import { z } from 'zod';
import { tripScopedSchema } from '../shared/entity';
import { localDateSchema } from '../shared/local-date';
import { bookingStatusSchema, localTimeSchema, placeSchema } from '../shared/common-schemas';
import { moneySchema } from '../money/money';

/** Étape : lieu de séjour sur une période (F-2.1). */
export const stopKindSchema = z.enum(['city', 'village', 'island']);
export type StopKind = z.infer<typeof stopKindSchema>;

/**
 * Couleurs d'étape, choisies par l'utilisateur pour distinguer les étapes (frise, calendrier,
 * cartes). Ce sont des noms de jetons du design system, pas des valeurs CSS : l'interface fait
 * la correspondance (`stop-style.ts` côté web). Huit teintes nettement différentes, sans le
 * rouge laque (réservé aux actions et à la sélection) ni le curcuma (réservé au « maintenant »).
 */
export const STOP_COLORS = [
  'indigo',
  'jade',
  'sarcelle',
  'ocre',
  'prune',
  'lotus',
  'ciel',
  'ardoise',
] as const;
export const stopColorSchema = z.enum(STOP_COLORS);
export type StopColor = z.infer<typeof stopColorSchema>;

export const stopSchema = tripScopedSchema.extend({
  name: z.string().trim().min(1),
  kind: stopKindSchema,
  /**
   * Facultative : les étapes créées avant l'arrivée des couleurs (et les anciennes sauvegardes)
   * n'en ont pas. Elles prennent alors la couleur de leur type (voir `stopColorOf`).
   */
  color: stopColorSchema.optional(),
  /** Nuit d'arrivée incluse, jour de départ exclu (on dort ailleurs ce soir-là). */
  arrivalDate: localDateSchema,
  departureDate: localDateSchema,
  place: placeSchema,
  notes: z.string().default(''),
});
export type Stop = z.infer<typeof stopSchema>;

/** Hébergement d'une étape (F-2.2). */
export const accommodationSchema = tripScopedSchema.extend({
  stopId: z.uuid(),
  name: z.string().trim().min(1),
  place: placeSchema,
  price: moneySchema.nullable(),
  status: bookingStatusSchema,
  bookingRef: z.string().default(''),
  url: z.url().nullable().default(null),
});
export type Accommodation = z.infer<typeof accommodationSchema>;

/** Trajet entre deux étapes (F-2.3). */
export const transferModeSchema = z.enum([
  'flight',
  'train',
  'bus',
  'sleeper_bus',
  'car',
  'boat',
  'motorbike',
  'other',
]);
export type TransferMode = z.infer<typeof transferModeSchema>;

export const transferSchema = tripScopedSchema.extend({
  fromStopId: z.uuid(),
  toStopId: z.uuid(),
  mode: transferModeSchema,
  departDate: localDateSchema,
  departTime: localTimeSchema.nullable(),
  arriveDate: localDateSchema,
  arriveTime: localTimeSchema.nullable(),
  price: moneySchema.nullable(),
  status: bookingStatusSchema,
  bookingRef: z.string().default(''),
  notes: z.string().default(''),
});
export type Transfer = z.infer<typeof transferSchema>;

/** Créneau d'une journée (F-2.5). */
export const timeSlotSchema = z.enum(['morning', 'afternoon', 'evening']);
export type TimeSlot = z.infer<typeof timeSlotSchema>;
export const TIME_SLOTS: readonly TimeSlot[] = timeSlotSchema.options;

/** Cycle de vie d'un élément planifié (F-2.8). */
export const plannedItemStatusSchema = z.enum(['idea', 'planned', 'booked', 'done', 'cancelled']);
export type PlannedItemStatus = z.infer<typeof plannedItemStatusSchema>;

/**
 * Élément placé dans un créneau (F-2.6, F-2.7) :
 * - `activity` : une activité, issue de la banque d'idées (`ideaId`) ou saisie librement ;
 * - `free_time` : un bloc « temps libre » assumé ;
 * - `family` : un moment en famille (jours au village, F-2.11).
 */
export const plannedItemKindSchema = z.enum(['activity', 'free_time', 'family']);
export type PlannedItemKind = z.infer<typeof plannedItemKindSchema>;

export const plannedItemSchema = tripScopedSchema.extend({
  date: localDateSchema,
  slot: timeSlotSchema,
  /** Heure précise optionnelle (une réservation à 14 h 30, par exemple). */
  time: localTimeSchema.nullable(),
  kind: plannedItemKindSchema,
  ideaId: z.uuid().nullable(),
  title: z.string().trim().min(1),
  place: placeSchema.nullable(),
  /** Durée estimée (F-2.6) ; `null` si inconnue. Sert aussi au « temps libre » (phase 3). */
  durationMinutes: z.int().positive().nullable().default(null),
  /** Coût estimé pour le groupe, dans sa devise. */
  estimatedCost: moneySchema.nullable(),
  status: plannedItemStatusSchema,
  notes: z.string().default(''),
  /** Ordre d'affichage dans le créneau (entier croissant). */
  position: z.int().nonnegative(),
});
export type PlannedItem = z.infer<typeof plannedItemSchema>;
