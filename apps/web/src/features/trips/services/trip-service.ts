import {
  assertMemberRemovable,
  buildNewTrip,
  createEntity,
  memberSchema,
  nextMemberColor,
  tripSchema,
  updateEntity,
  type EntityId,
  type Member,
  type NewTripInput,
  type Trip,
} from '@ve-que/domain';
import type { Repositories } from '@/infrastructure/repositories';
import { SETTING_KEYS } from '@/infrastructure/repositories/settings-store';

export type TripInfoChanges = Partial<
  Pick<Trip, 'name' | 'startDate' | 'endDate' | 'referenceCurrency'>
>;

/**
 * **Service applicatif** (les « cas d'usage ») des voyages et de leurs membres.
 *
 * Rôle de cette couche : orchestrer. Les règles vivent dans le domaine (`buildNewTrip`,
 * `assertMemberRemovable`…), le stockage derrière les repositories. Le service enchaîne les
 * deux, dans une transaction quand plusieurs écritures doivent réussir ensemble. Les écrans
 * n'appellent que lui : ils ne savent ni comment on valide, ni où l'on enregistre.
 *
 * L'horloge est injectée (`clock`) pour que les tests maîtrisent « maintenant ».
 */
export class TripService {
  constructor(
    private readonly repositories: Repositories,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  /** Crée le voyage, « Moi » et les compagnons, puis l'affiche (F-1.1, F-1.3). */
  async createTrip(input: NewTripInput): Promise<Trip> {
    const { trip, members } = buildNewTrip(input, this.clock());
    await this.repositories.transaction(async () => {
      await this.repositories.trips.save(trip);
      await this.repositories.members.saveMany(members);
      await this.repositories.settings.set(SETTING_KEYS.activeTripId, trip.id);
    });
    return trip;
  }

  async updateTrip(trip: Trip, changes: TripInfoChanges): Promise<Trip> {
    // On revalide l'entité complète : une modification ne doit jamais produire un voyage
    // invalide (par exemple une date de fin repassée avant le départ).
    const updated = tripSchema.parse(updateEntity(trip, changes, this.clock()));
    await this.repositories.trips.save(updated);
    return updated;
  }

  /** Archiver range un voyage terminé : il n'est plus proposé par défaut mais reste consultable. */
  async setArchived(trip: Trip, archived: boolean): Promise<void> {
    const now = this.clock();
    await this.repositories.trips.save(
      updateEntity(trip, { archivedAt: archived ? now.toISOString() : null }, now),
    );
  }

  /** Choisit le voyage affiché par défaut sur cet appareil. */
  async openTrip(tripId: EntityId): Promise<void> {
    await this.repositories.settings.set(SETTING_KEYS.activeTripId, tripId);
  }

  /**
   * Supprime le voyage et **tout ce qui lui appartient** (suppression logique, en cascade).
   * La cascade parcourt tous les repositories rattachés à un voyage : une table ajoutée plus
   * tard à `tripScopedRepositories` sera nettoyée sans modifier ce code.
   */
  async deleteTrip(tripId: EntityId): Promise<void> {
    await this.repositories.transaction(async () => {
      for (const repository of this.tripScopedRepositories()) {
        const rows = await repository.listByTrip(tripId);
        for (const row of rows) await repository.remove(row.id);
      }
      await this.repositories.trips.remove(tripId);
      const activeId = await this.repositories.settings.get<string>(SETTING_KEYS.activeTripId);
      if (activeId === tripId) await this.repositories.settings.remove(SETTING_KEYS.activeTripId);
    });
  }

  async addMember(tripId: EntityId, name: string): Promise<Member> {
    const existing = await this.repositories.members.listByTrip(tripId);
    const member = memberSchema.parse(
      createEntity<Member>(
        { tripId, name: name.trim(), color: nextMemberColor(existing), isMe: false },
        this.clock(),
      ),
    );
    await this.repositories.members.save(member);
    return member;
  }

  async renameMember(member: Member, name: string): Promise<void> {
    await this.repositories.members.save(
      memberSchema.parse(updateEntity(member, { name: name.trim() }, this.clock())),
    );
  }

  async removeMember(member: Member): Promise<void> {
    assertMemberRemovable(member);
    // Phase 2 : refuser aussi le retrait d'un membre qui a payé ou partagé des dépenses.
    await this.repositories.members.remove(member.id);
  }

  private tripScopedRepositories() {
    const r = this.repositories;
    return [
      r.members,
      r.stops,
      r.accommodations,
      r.transfers,
      r.ideas,
      r.plannedItems,
      r.expenses,
      r.wallets,
      r.walletMovements,
    ];
  }
}
