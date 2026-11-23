import { z } from 'zod';
import {
  isLocalDate,
  stopKindSchema,
  toLocalDate,
  validateStopDates,
  type Stop,
  type Trip,
} from '@ve-que/domain';
import { t } from '@/shared/i18n';
import { formatDateRange } from '@/shared/lib/format-date';

/**
 * Schéma du formulaire d'étape.
 *
 * Contrairement aux voyages, la validité d'une étape dépend du **contexte** : les dates du
 * voyage et les autres étapes. Le schéma est donc fabriqué à la demande (fonction *factory*)
 * avec ce contexte. La règle elle-même n'est pas réécrite ici : on appelle
 * `validateStopDates` du domaine et on traduit chaque problème en message sous le bon champ.
 */
export function makeStopFormSchema(
  trip: Pick<Trip, 'startDate' | 'endDate'>,
  otherStops: readonly Pick<Stop, 'id' | 'name' | 'arrivalDate' | 'departureDate'>[],
  editingId?: string,
) {
  return z
    .object({
      name: z.string().trim().min(1, t.validation.required).max(60, t.validation.maxLength(60)),
      kind: stopKindSchema,
      arrivalDate: z.iso.date(t.validation.dateRequired),
      departureDate: z.iso.date(t.validation.dateRequired),
      vietnameseName: z.string().trim().max(80, t.validation.maxLength(80)),
      notes: z.string().trim().max(500, t.validation.maxLength(500)),
    })
    .superRefine((values, ctx) => {
      // Une date manquante a déjà son message (« Choisis une date ») : rien de plus à vérifier.
      if (!isLocalDate(values.arrivalDate) || !isLocalDate(values.departureDate)) return;
      const issues = validateStopDates(
        {
          id: editingId,
          arrivalDate: toLocalDate(values.arrivalDate),
          departureDate: toLocalDate(values.departureDate),
        },
        trip,
        otherStops,
      );
      for (const issue of issues) {
        switch (issue.code) {
          case 'no_night':
            ctx.addIssue({
              code: 'custom',
              path: ['departureDate'],
              message: t.stops.errors.noNight,
            });
            break;
          case 'outside_trip':
            ctx.addIssue({
              code: 'custom',
              path: ['arrivalDate'],
              message: t.stops.errors.outsideTrip(formatDateRange(trip.startDate, trip.endDate)),
            });
            break;
          case 'overlap':
            ctx.addIssue({
              code: 'custom',
              path: ['arrivalDate'],
              message: t.stops.errors.overlap(issue.withStop.name),
            });
            break;
        }
      }
    });
}

export type StopFormValues = z.infer<ReturnType<typeof makeStopFormSchema>>;
