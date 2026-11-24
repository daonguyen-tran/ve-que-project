import { z } from 'zod';
import {
  plannedItemKindSchema,
  plannedItemStatusSchema,
  type PlannedItem,
  type PlannedItemKind,
  type LocalDate,
} from '@ve-que/domain';
import { locationFieldSchema, locationToField } from '@/features/map/location-field';
import { t } from '@/shared/i18n';
import { moneyToField, optionalMoneyFieldSchema } from '@/shared/lib/money-field';

/** Formulaire d'un élément du programme (F-2.6 à F-2.8). */
export const plannedItemFormSchema = z
  .object({
    kind: plannedItemKindSchema,
    // Le titre n'est obligatoire que pour une activité : un « temps libre » se suffit à lui-même.
    title: z.string().trim().max(80, t.validation.maxLength(80)),
    date: z.iso.date(t.validation.dateRequired),
    time: z.string().regex(/^$|^([01]\d|2[0-3]):[0-5]\d$/),
    duration: z.string(),
    cost: optionalMoneyFieldSchema,
    address: z.string().trim().max(200, t.validation.maxLength(200)),
    vietnameseAddress: z.string().trim().max(200, t.validation.maxLength(200)),
    location: locationFieldSchema,
    status: plannedItemStatusSchema,
    notes: z.string().trim().max(500, t.validation.maxLength(500)),
    /** Idée choisie dans « Depuis tes idées » (champ caché), vide sinon. */
    ideaId: z.string(),
  })
  .superRefine((values, ctx) => {
    if (values.kind === 'activity' && values.title === '') {
      ctx.addIssue({ code: 'custom', path: ['title'], message: t.validation.required });
    }
  });
export type PlannedItemFormValues = z.infer<typeof plannedItemFormSchema>;

export type PlannedItemSheetTarget =
  { mode: 'create'; date: LocalDate; kind: PlannedItemKind } | { mode: 'edit'; item: PlannedItem };

export function initialPlannedItemValues(target: PlannedItemSheetTarget): PlannedItemFormValues {
  if (target.mode === 'create') {
    return {
      kind: target.kind,
      title: '',
      date: target.date,
      time: '',
      duration: '',
      cost: moneyToField(null, 'VND'),
      address: '',
      vietnameseAddress: '',
      location: '',
      status: 'planned',
      notes: '',
      ideaId: '',
    };
  }
  const { item } = target;
  return {
    kind: item.kind,
    title: item.title,
    date: item.date,
    time: item.time ?? '',
    duration: item.durationMinutes ? String(item.durationMinutes) : '',
    cost: moneyToField(item.estimatedCost, 'VND'),
    address: item.place?.address ?? '',
    vietnameseAddress: item.place?.vietnamese ?? '',
    location: locationToField(item.place?.location),
    status: item.status,
    notes: item.notes,
    ideaId: item.ideaId ?? '',
  };
}
