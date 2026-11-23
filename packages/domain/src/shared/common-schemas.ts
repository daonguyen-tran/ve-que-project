import { z } from 'zod';

/** Heure locale `HH:mm` (24 h), sans fuseau : comme les dates, elle est celle du lieu. */
export const localTimeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Heure attendue au format HH:mm');
export type LocalTime = z.infer<typeof localTimeSchema>;

/** Coordonnées GPS (WGS 84, celles d'OpenStreetMap et de Google Maps). */
export const geoPointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
export type GeoPoint = z.infer<typeof geoPointSchema>;

/**
 * Adresse d'un lieu. `vietnamese` est l'adresse écrite en vietnamien, avec ses diacritiques,
 * à montrer telle quelle à un chauffeur ou à un passant.
 */
export const placeSchema = z.object({
  address: z.string().default(''),
  vietnamese: z.string().default(''),
  location: geoPointSchema.nullable().default(null),
});
export type Place = z.infer<typeof placeSchema>;

/** Statut de réservation commun aux hébergements et aux trajets. */
export const bookingStatusSchema = z.enum(['considered', 'booked', 'cancelled']);
export type BookingStatus = z.infer<typeof bookingStatusSchema>;
