import { z } from 'zod';
import { baseEntitySchema, tripScopedSchema } from '../shared/entity';
import { localDateSchema } from '../shared/local-date';
import { currencyCodeSchema } from '../money/currency';
import { moneySchema } from '../money/money';

/** Fuseau par défaut : tout le Vietnam est en UTC+7, sans heure d'été. */
export const DEFAULT_TRIP_TIME_ZONE = 'Asia/Ho_Chi_Minh';

/** Voyage (F-1.1). L'application en gère plusieurs. */
export const tripSchema = baseEntitySchema
  .extend({
    name: z.string().trim().min(1),
    startDate: localDateSchema,
    endDate: localDateSchema,
    /** Fuseau IANA de la destination : sert à savoir « quel jour on est » sur place. */
    timeZone: z.string().default(DEFAULT_TRIP_TIME_ZONE),
    /** Devise des budgets et statistiques (EUR). */
    referenceCurrency: currencyCodeSchema.default('EUR'),
    /** Forfait quotidien par personne pour le budget ascendant (F-7.2). */
    dailyAllowance: moneySchema.nullable().default(null),
    /** Active la répartition des dépenses entre membres (F-5.8). */
    splitEnabled: z.boolean().default(false),
    archivedAt: z.iso.datetime().nullable().default(null),
  })
  .refine((trip) => trip.endDate >= trip.startDate, {
    message: 'La date de fin doit être postérieure ou égale à la date de début',
    path: ['endDate'],
  });

export type Trip = z.infer<typeof tripSchema>;

/** Membre d'un voyage (F-1.3). « Moi » est créé avec le voyage et ne peut être supprimé. */
export const memberSchema = tripScopedSchema.extend({
  name: z.string().trim().min(1),
  /** Nom d'un jeton de couleur du design system, pas une valeur CSS. */
  color: z.string(),
  isMe: z.boolean(),
});

export type Member = z.infer<typeof memberSchema>;
