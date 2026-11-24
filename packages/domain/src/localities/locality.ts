import { z } from 'zod';
import { geoPointSchema, type GeoPoint } from '../shared/common-schemas';
import { baseEntitySchema } from '../shared/entity';
import { stopKindSchema, type StopKind } from '../itinerary/itinerary';

/*
 * Localités : villes, villages et îles qu'on peut choisir comme étape.
 *
 * Trois provenances, de la plus sûre à la plus large :
 * - `builtin` : la liste intégrée à l'appli (grandes villes, lieux touristiques), hors ligne ;
 * - `saved`   : « mes lieux », ajoutés par l'utilisateur (le village de la famille…), hors ligne ;
 * - `online`  : un service de recherche en ligne, pour tout le reste.
 */

/**
 * Lieu enregistré par l'utilisateur (« mes lieux »). Comme le carnet d'adresses, il n'est
 * rattaché à aucun voyage : on le retrouve d'un voyage à l'autre.
 */
export const localitySchema = baseEntitySchema.extend({
  name: z.string().trim().min(1),
  vietnameseName: z.string().default(''),
  kind: stopKindSchema,
  /** Inconnue pour un lieu saisi à la main, sans passer par une suggestion. */
  location: geoPointSchema.nullable().default(null),
});
export type Locality = z.infer<typeof localitySchema>;

export type LocalitySource = 'builtin' | 'saved' | 'online';

/** Une suggestion affichée sous le champ « Nom » d'une étape, quelle que soit sa provenance. */
export interface LocalitySuggestion {
  /** Identifiant stable dans la liste des suggestions (sert aussi aux attributs ARIA). */
  key: string;
  source: LocalitySource;
  /** Nom usuel, celui qu'on donne à l'étape (« Hô Chi Minh-Ville »). */
  name: string;
  /** Nom en vietnamien, avec diacritiques (« Thành phố Hồ Chí Minh »). */
  vietnameseName: string;
  kind: StopKind;
  location: GeoPoint | null;
  /** Précision affichée en second (province, région…), facultative. */
  detail?: string;
}
