import { zodResolver } from '@hookform/resolvers/zod';
import { Trash2 } from 'lucide-react';
import { useEffect, useId, useMemo, useState } from 'react';
import { useController, useForm, useWatch } from 'react-hook-form';
import { isLocalDate, toLocalDate, type Stop, type Transfer, type Trip } from '@ve-que/domain';
import { t } from '@/shared/i18n';
import { moneyFromField, moneyToField } from '@/shared/lib/money-field';
import { Button } from '@/shared/ui/Button';
import { ConfirmSheet } from '@/shared/ui/ConfirmSheet';
import { AmountField } from '@/shared/ui/form/AmountField';
import { DateField } from '@/shared/ui/calendar';
import { FieldGroupError, TextField } from '@/shared/ui/form/fields';
import { SegmentedField } from '@/shared/ui/form/SegmentedField';
import { Sheet } from '@/shared/ui/Sheet';
import { useTransferService } from '../hooks/use-itinerary';
import { makeTransferFormSchema, type TransferFormValues } from '../itinerary-forms';
import { BOOKING_STATUS_OPTIONS, TRANSFER_MODE_OPTIONS } from '../transfer-style';

/** Trajet à créer entre deux étapes, ou trajet existant à modifier. */
export interface TransferSheetTarget {
  from: Stop;
  to: Stop;
  transfer?: Transfer;
}

function initialValues(target: TransferSheetTarget | null): TransferFormValues {
  const transfer = target?.transfer;
  // Par défaut, on part le jour où l'on quitte l'étape de départ.
  const day = target ? target.from.departureDate : '';
  return {
    mode: transfer?.mode ?? 'flight',
    departDate: transfer?.departDate ?? day,
    departTime: transfer?.departTime ?? '',
    arriveDate: transfer?.arriveDate ?? day,
    arriveTime: transfer?.arriveTime ?? '',
    price: moneyToField(transfer?.price ?? null, 'VND'),
    status: transfer?.status ?? 'considered',
    bookingRef: transfer?.bookingRef ?? '',
    notes: transfer?.notes ?? '',
  };
}

/** Ajout et modification du trajet entre deux étapes (F-2.3). */
export function TransferSheet({
  trip,
  target,
  onClose,
}: {
  trip: Trip;
  target: TransferSheetTarget | null;
  onClose: () => void;
}) {
  const service = useTransferService();
  const formId = useId();
  const datesErrorId = useId();
  const [saveError, setSaveError] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fromStopId = target?.from.id ?? '';
  const toStopId = target?.to.id ?? '';

  // Le schéma dépend du voyage et des deux étapes reliées.
  const schema = useMemo(
    () => makeTransferFormSchema(trip, { fromStopId, toStopId }),
    [trip, fromStopId, toStopId],
  );
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<TransferFormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialValues(null),
  });
  // Dates pilotées par le calendrier maison (composant contrôlé).
  const departDate = useController({ control, name: 'departDate' });
  const arriveDate = useController({ control, name: 'arriveDate' });

  useEffect(() => {
    if (target) reset(initialValues(target));
  }, [target, reset]);

  const close = () => {
    setSaveError(false);
    onClose();
  };

  const onSubmit = handleSubmit(async (values) => {
    if (!target) return;
    setSaveError(false);
    const input = {
      fromStopId: target.from.id,
      toStopId: target.to.id,
      mode: values.mode,
      departDate: toLocalDate(values.departDate),
      departTime: values.departTime || null,
      arriveDate: toLocalDate(values.arriveDate),
      arriveTime: values.arriveTime || null,
      price: moneyFromField(values.price),
      status: values.status,
      bookingRef: values.bookingRef,
      notes: values.notes,
    };
    try {
      if (target.transfer) await service.update(trip, target.transfer, input);
      else await service.create(trip, input);
      close();
    } catch {
      setSaveError(true);
    }
  });

  // `useWatch` s'abonne au seul champ prix pour l'aperçu du montant en direct.
  const price = useWatch({ control, name: 'price' });
  const routeLabel = target ? t.transfers.route(target.from.name, target.to.name) : '';
  const dateError = errors.departDate?.message ?? errors.arriveDate?.message;

  return (
    <>
      <Sheet
        open={target !== null && !confirmDelete}
        onClose={close}
        title={target?.transfer ? t.transfers.editTitle : t.transfers.addTitle}
        footer={
          <>
            <Button variant="quiet" onClick={close}>
              {t.common.cancel}
            </Button>
            <Button type="submit" form={formId} disabled={isSubmitting}>
              {t.common.save}
            </Button>
          </>
        }
      >
        <form
          id={formId}
          noValidate
          onSubmit={(event) => void onSubmit(event)}
          className="flex flex-col gap-5"
        >
          <p className="m-0 text-base font-semibold">{routeLabel}</p>
          <SegmentedField
            label={t.transfers.modeLabel}
            options={TRANSFER_MODE_OPTIONS}
            columns={4}
            {...register('mode')}
          />

          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-[1fr_8.5rem] gap-3">
              <DateField
                label={t.transfers.departDateLabel}
                min={trip.startDate}
                max={trip.endDate}
                error={errors.departDate?.message}
                externalErrorId={datesErrorId}
                value={departDate.field.value}
                onChange={departDate.field.onChange}
                panelClassName="col-span-full row-start-2"
              />
              <TextField
                label={t.transfers.departTimeLabel}
                type="time"
                {...register('departTime')}
              />
            </div>
            <div className="grid grid-cols-[1fr_8.5rem] gap-3">
              <DateField
                label={t.transfers.arriveDateLabel}
                min={trip.startDate}
                max={trip.endDate}
                // On n'arrive pas avant d'être parti : les jours d'avant sont grisés.
                isPickable={(day) => !departDate.field.value || day >= departDate.field.value}
                defaultFocus={
                  isLocalDate(departDate.field.value) ? departDate.field.value : undefined
                }
                error={errors.arriveDate?.message}
                externalErrorId={datesErrorId}
                value={arriveDate.field.value}
                onChange={arriveDate.field.onChange}
                panelClassName="col-span-full row-start-2"
              />
              <TextField
                label={t.transfers.arriveTimeLabel}
                type="time"
                {...register('arriveTime')}
              />
            </div>
            {dateError ? (
              <FieldGroupError
                id={datesErrorId}
                messages={[errors.departDate?.message, errors.arriveDate?.message]}
              />
            ) : (
              <p className="text-muted m-0 text-[13px]">{t.transfers.timesHint}</p>
            )}
          </div>

          <SegmentedField
            label={t.booking.label}
            options={BOOKING_STATUS_OPTIONS}
            {...register('status')}
          />
          <AmountField
            label={t.transfers.priceLabel}
            labelAside={t.common.optional}
            error={errors.price?.text?.message}
            text={price.text}
            currency={price.currency}
            textInput={register('price.text')}
            currencyInput={register('price.currency')}
          />
          <TextField
            label={t.booking.refLabel}
            labelAside={t.common.optional}
            placeholder={t.booking.refPlaceholder}
            autoComplete="off"
            error={errors.bookingRef?.message}
            {...register('bookingRef')}
          />
          <TextField
            label={t.transfers.notesLabel}
            labelAside={t.common.optional}
            placeholder={t.transfers.notesPlaceholder}
            autoComplete="off"
            error={errors.notes?.message}
            {...register('notes')}
          />
          {saveError && (
            <p role="alert" className="text-laque-deep m-0 text-[15px] font-medium">
              {t.validation.saveFailed}
            </p>
          )}
          {target?.transfer && (
            <Button
              variant="quiet"
              onClick={() => setConfirmDelete(true)}
              className="-ml-4 self-start"
            >
              <Trash2 className="size-5" strokeWidth={1.9} aria-hidden="true" />
              {t.transfers.delete}
            </Button>
          )}
        </form>
      </Sheet>

      {target?.transfer && (
        <ConfirmSheet
          open={confirmDelete}
          onClose={() => {
            setConfirmDelete(false);
            close();
          }}
          title={t.transfers.deleteTitle}
          message={t.transfers.deleteMessage(routeLabel)}
          confirmLabel={t.transfers.delete}
          onConfirm={() => service.remove(target.transfer!)}
        />
      )}
    </>
  );
}
