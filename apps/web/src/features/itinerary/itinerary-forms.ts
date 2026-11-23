import { z } from 'zod';
import {
  bookingStatusSchema,
  isLocalDate,
  toLocalDate,
  transferModeSchema,
  validateTransfer,
  type Trip,
} from '@ve-que/domain';
import { t } from '@/shared/i18n';
import { formatDateRange } from '@/shared/lib/format-date';
import { optionalMoneyFieldSchema } from '@/shared/lib/money-field';

/*
 * Schémas des formulaires d'hébergement et de trajet. Même principe que pour les étapes :
 * les règles viennent du domaine, le schéma ne fait que les traduire en messages.
 */

/** Champ facultatif : vide, ou une adresse web complète. */
const optionalUrl = z
  .string()
  .trim()
  .refine((value) => value === '' || z.url({ protocol: /^https?$/ }).safeParse(value).success, {
    message: t.accommodations.urlInvalid,
  });

export const accommodationFormSchema = z.object({
  name: z.string().trim().min(1, t.validation.required).max(80, t.validation.maxLength(80)),
  status: bookingStatusSchema,
  price: optionalMoneyFieldSchema,
  bookingRef: z.string().trim().max(80, t.validation.maxLength(80)),
  url: optionalUrl,
  address: z.string().trim().max(200, t.validation.maxLength(200)),
  vietnameseAddress: z.string().trim().max(200, t.validation.maxLength(200)),
});
export type AccommodationFormValues = z.infer<typeof accommodationFormSchema>;

/** Heure facultative : vide ou `HH:mm` (c'est ce que renvoie `<input type="time">`). */
const optionalTime = z.string().regex(/^$|^([01]\d|2[0-3]):[0-5]\d$/);

export function makeTransferFormSchema(
  trip: Pick<Trip, 'startDate' | 'endDate'>,
  route: { fromStopId: string; toStopId: string },
) {
  return z
    .object({
      mode: transferModeSchema,
      departDate: z.iso.date(t.validation.dateRequired),
      departTime: optionalTime,
      arriveDate: z.iso.date(t.validation.dateRequired),
      arriveTime: optionalTime,
      price: optionalMoneyFieldSchema,
      status: bookingStatusSchema,
      bookingRef: z.string().trim().max(80, t.validation.maxLength(80)),
      notes: z.string().trim().max(500, t.validation.maxLength(500)),
    })
    .superRefine((values, ctx) => {
      if (!isLocalDate(values.departDate) || !isLocalDate(values.arriveDate)) return;
      const issues = validateTransfer(
        {
          ...route,
          departDate: toLocalDate(values.departDate),
          departTime: values.departTime || null,
          arriveDate: toLocalDate(values.arriveDate),
          arriveTime: values.arriveTime || null,
        },
        trip,
      );
      for (const issue of issues) {
        const message =
          issue.code === 'same_stop'
            ? t.transfers.errors.sameStop
            : issue.code === 'arrives_before_departure'
              ? t.transfers.errors.arrivesBefore
              : t.transfers.errors.outsideTrip(formatDateRange(trip.startDate, trip.endDate));
        ctx.addIssue({ code: 'custom', path: ['arriveDate'], message });
      }
    });
}
export type TransferFormValues = z.infer<ReturnType<typeof makeTransferFormSchema>>;
