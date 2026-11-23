import { z } from 'zod';
import {
  ideaCategorySchema,
  type Idea,
  type IdeaCategory,
  type OpeningRange,
} from '@ve-que/domain';
import { t } from '@/shared/i18n';
import { moneyToField, optionalMoneyFieldSchema } from '@/shared/lib/money-field';

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Plage d'horaires telle que saisie : les jours sont des cases à cocher, dont React Hook Form
 * renvoie les valeurs cochées sous forme de chaînes (« 1 », « 2 »…). Elle n'est vérifiée que
 * si « Je connais les horaires » est coché (voir `superRefine`).
 */
const rangeSchema = z.object({
  days: z.array(z.string()),
  open: z.string(),
  close: z.string(),
});

const optionalUrl = z
  .string()
  .trim()
  .refine((value) => value === '' || z.url({ protocol: /^https?$/ }).safeParse(value).success, {
    message: t.accommodations.urlInvalid,
  });

export const ideaFormSchema = z
  .object({
    title: z.string().trim().min(1, t.validation.required).max(80, t.validation.maxLength(80)),
    city: z.string().trim().min(1, t.validation.required).max(60, t.validation.maxLength(60)),
    category: ideaCategorySchema,
    priority: z.enum(['must', 'nice']),
    duration: z.string().regex(/^\d+$/),
    price: optionalMoneyFieldSchema,
    place: z.enum(['indoor', 'outdoor']),
    hasHours: z.boolean(),
    ranges: z.array(rangeSchema),
    url: optionalUrl,
    address: z.string().trim().max(200, t.validation.maxLength(200)),
    vietnameseAddress: z.string().trim().max(200, t.validation.maxLength(200)),
    notes: z.string().trim().max(500, t.validation.maxLength(500)),
  })
  .superRefine((values, ctx) => {
    if (!values.hasHours) return;
    values.ranges.forEach((range, index) => {
      if (range.days.length === 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['ranges', index, 'days'],
          message: t.ideas.daysRequired,
        });
      }
      for (const key of ['open', 'close'] as const) {
        if (!TIME.test(range[key])) {
          ctx.addIssue({
            code: 'custom',
            path: ['ranges', index, key],
            message: t.validation.required,
          });
        }
      }
    });
  });
export type IdeaFormValues = z.infer<typeof ideaFormSchema>;
export type IdeaRangeValues = IdeaFormValues['ranges'][number];

/** Plage proposée par défaut : tous les jours, 8 h – 17 h. */
export const DEFAULT_RANGE: IdeaRangeValues = {
  days: ['1', '2', '3', '4', '5', '6', '0'],
  open: '08:00',
  close: '17:00',
};

export type IdeaSheetTarget =
  { mode: 'create'; city: string; category?: IdeaCategory } | { mode: 'edit'; idea: Idea };

export function initialIdeaValues(target: IdeaSheetTarget): IdeaFormValues {
  const idea = target.mode === 'edit' ? target.idea : undefined;
  return {
    title: idea?.title ?? '',
    city: idea?.city ?? (target.mode === 'create' ? target.city : ''),
    category:
      idea?.category ?? (target.mode === 'create' ? target.category : undefined) ?? 'culture',
    priority: idea?.priority ?? 'nice',
    duration: String(idea?.durationMinutes ?? 60),
    price: moneyToField(idea?.pricePerPerson ?? null, 'VND'),
    place: idea?.indoor ? 'indoor' : 'outdoor',
    hasHours: Boolean(idea?.openingHours?.length),
    ranges: idea?.openingHours?.map(rangeToValues) ?? [],
    url: idea?.url ?? '',
    address: idea?.place.address ?? '',
    vietnameseAddress: idea?.place.vietnamese ?? '',
    notes: idea?.notes ?? '',
  };
}

function rangeToValues(range: OpeningRange): IdeaRangeValues {
  return { days: range.days.map(String), open: range.open, close: range.close };
}

export function rangesFromValues(values: IdeaFormValues): OpeningRange[] | null {
  if (!values.hasHours) return null;
  return values.ranges.map((range) => ({
    days: range.days.map(Number).sort((a, b) => a - b),
    open: range.open,
    close: range.close,
  }));
}
