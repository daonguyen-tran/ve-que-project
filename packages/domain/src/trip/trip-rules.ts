import { createEntity, isAlive } from '../shared/entity';
import { daysBetween, localDateOf, type LocalDate } from '../shared/local-date';
import { DEFAULT_TRIP_TIME_ZONE, memberSchema, tripSchema, type Member, type Trip } from './trip';

/** Où en est un voyage par rapport à aujourd'hui. */
export type TripPhase = 'upcoming' | 'ongoing' | 'past';

/**
 * « Aujourd'hui » se calcule dans le fuseau **du voyage** : à 20 h à Paris le 30 juin, il est
 * déjà 1 h le 1er juillet au Vietnam, donc le voyage qui commence le 1er juillet est en cours.
 */
export function tripToday(trip: Pick<Trip, 'timeZone'>, now: Date): LocalDate {
  return localDateOf(now, trip.timeZone);
}

export function tripPhase(
  trip: Pick<Trip, 'startDate' | 'endDate' | 'timeZone'>,
  now: Date,
): TripPhase {
  const today = tripToday(trip, now);
  if (today < trip.startDate) return 'upcoming';
  if (today > trip.endDate) return 'past';
  return 'ongoing';
}

/** Durée du voyage en jours, bornes incluses (du 1er au 21 juillet = 21 jours). */
export function tripLength(trip: Pick<Trip, 'startDate' | 'endDate'>): number {
  return daysBetween(trip.startDate, trip.endDate) + 1;
}

/** Jours restants avant le départ (0 le jour du départ ; négatif s'il est passé). */
export function daysUntilStart(trip: Pick<Trip, 'startDate' | 'timeZone'>, now: Date): number {
  return daysBetween(tripToday(trip, now), trip.startDate);
}

/** Numéro du jour en cours (1 le premier jour), ou `null` hors des dates du voyage. */
export function currentDayNumber(
  trip: Pick<Trip, 'startDate' | 'endDate' | 'timeZone'>,
  now: Date,
): number | null {
  if (tripPhase(trip, now) !== 'ongoing') return null;
  return daysBetween(trip.startDate, tripToday(trip, now)) + 1;
}

/**
 * Choisit le voyage « actif », celui que l'appli ouvre par défaut (F-1.2).
 *
 * Ordre de préférence :
 * 1. le voyage choisi explicitement par l'utilisateur, s'il existe encore et n'est pas archivé ;
 * 2. un voyage **en cours** (le plus récent s'il y en a plusieurs) ;
 * 3. le **prochain** voyage à venir (départ le plus proche) ;
 * 4. le dernier voyage terminé (pour consulter ses souvenirs).
 * Les voyages archivés et supprimés ne sont jamais choisis automatiquement.
 */
export function pickActiveTrip<T extends Trip>(
  trips: readonly T[],
  now: Date,
  preferredId?: string | null,
): T | undefined {
  const candidates = trips.filter((trip) => isAlive(trip) && trip.archivedAt === null);

  const preferred = preferredId ? candidates.find((trip) => trip.id === preferredId) : undefined;
  if (preferred) return preferred;

  const byPhase = (phase: TripPhase) => candidates.filter((trip) => tripPhase(trip, now) === phase);

  const ongoing = byPhase('ongoing').sort((a, b) => (a.startDate < b.startDate ? 1 : -1));
  if (ongoing[0]) return ongoing[0];

  const upcoming = byPhase('upcoming').sort((a, b) => (a.startDate < b.startDate ? -1 : 1));
  if (upcoming[0]) return upcoming[0];

  const past = byPhase('past').sort((a, b) => (a.endDate < b.endDate ? 1 : -1));
  return past[0];
}

/**
 * Couleurs disponibles pour les membres : des noms de jetons du design system, pas des
 * valeurs CSS. L'interface fait la correspondance (voir `member-style.ts` côté web).
 */
export const MEMBER_COLORS = ['laque', 'jade', 'indigo', 'ocre', 'prune', 'sarcelle'] as const;
export type MemberColor = (typeof MEMBER_COLORS)[number];

/** Première couleur pas encore utilisée par un membre (on recommence le cycle au-delà de 6). */
export function nextMemberColor(members: readonly Pick<Member, 'color'>[]): MemberColor {
  const used = new Set(members.map((member) => member.color));
  return (
    MEMBER_COLORS.find((color) => !used.has(color)) ??
    MEMBER_COLORS[members.length % MEMBER_COLORS.length]!
  );
}

export interface NewTripInput {
  name: string;
  startDate: LocalDate;
  endDate: LocalDate;
  referenceCurrency?: Trip['referenceCurrency'];
  timeZone?: string;
  /** Prénom de l'utilisateur : devient le membre « Moi ». */
  ownerName: string;
  /** Prénoms des autres voyageurs. */
  companionNames?: readonly string[];
}

/**
 * **Fabrique** d'un voyage complet : le voyage et ses membres, dont « Moi » (F-1.3).
 *
 * Les schémas Zod sont appliqués à la sortie : ils complètent les valeurs par défaut et
 * garantissent qu'aucune entité invalide (fin avant début, nom vide…) n'atteint la base.
 */
export function buildNewTrip(
  input: NewTripInput,
  now: Date = new Date(),
): { trip: Trip; members: Member[] } {
  const trip = tripSchema.parse(
    createEntity<Trip>(
      {
        name: input.name.trim(),
        startDate: input.startDate,
        endDate: input.endDate,
        timeZone: input.timeZone ?? DEFAULT_TRIP_TIME_ZONE,
        referenceCurrency: input.referenceCurrency ?? 'EUR',
        dailyAllowance: null,
        splitEnabled: false,
        archivedAt: null,
      },
      now,
    ),
  );

  const members: Member[] = [];
  const addMember = (name: string, isMe: boolean) => {
    members.push(
      memberSchema.parse(
        createEntity<Member>(
          { tripId: trip.id, name: name.trim(), color: nextMemberColor(members), isMe },
          now,
        ),
      ),
    );
  };

  addMember(input.ownerName, true);
  for (const name of input.companionNames ?? []) {
    if (name.trim() !== '') addMember(name, false);
  }

  return { trip, members };
}

export class CannotRemoveOwnerError extends Error {
  constructor() {
    super('Le membre « Moi » ne peut pas être retiré du voyage.');
    this.name = 'CannotRemoveOwnerError';
  }
}

/** Règle F-1.3 : « Moi » ne peut pas être supprimé. */
export function assertMemberRemovable(member: Pick<Member, 'isMe'>): void {
  if (member.isMe) throw new CannotRemoveOwnerError();
}
