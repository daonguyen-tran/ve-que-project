import { zodResolver } from '@hookform/resolvers/zod';
import { Trash2 } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import type { Accommodation, Stop } from '@ve-que/domain';
import { t } from '@/shared/i18n';
import { moneyFromField, moneyToField } from '@/shared/lib/money-field';
import { Button } from '@/shared/ui/Button';
import { ConfirmSheet } from '@/shared/ui/ConfirmSheet';
import { AmountField } from '@/shared/ui/form/AmountField';
import { TextField } from '@/shared/ui/form/fields';
import { SegmentedField } from '@/shared/ui/form/SegmentedField';
import { Sheet } from '@/shared/ui/Sheet';
import { useAccommodationService } from '../hooks/use-itinerary';
import { accommodationFormSchema, type AccommodationFormValues } from '../itinerary-forms';
import { BOOKING_STATUS_OPTIONS } from '../transfer-style';

export type AccommodationSheetTarget =
  { mode: 'create' } | { mode: 'edit'; accommodation: Accommodation };

function initialValues(target: AccommodationSheetTarget | null): AccommodationFormValues {
  const accommodation = target?.mode === 'edit' ? target.accommodation : undefined;
  return {
    name: accommodation?.name ?? '',
    status: accommodation?.status ?? 'considered',
    // Les hébergements se paient en général sur place, en đồng : c'est la devise par défaut.
    price: moneyToField(accommodation?.price ?? null, 'VND'),
    bookingRef: accommodation?.bookingRef ?? '',
    url: accommodation?.url ?? '',
    address: accommodation?.place.address ?? '',
    vietnameseAddress: accommodation?.place.vietnamese ?? '',
  };
}

/** Ajout et modification d'un hébergement d'une étape (F-2.2). */
export function AccommodationSheet({
  stop,
  target,
  onClose,
}: {
  stop: Stop;
  target: AccommodationSheetTarget | null;
  onClose: () => void;
}) {
  const service = useAccommodationService();
  const formId = useId();
  const [saveError, setSaveError] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const editing = target?.mode === 'edit' ? target.accommodation : undefined;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<AccommodationFormValues>({
    resolver: zodResolver(accommodationFormSchema),
    defaultValues: initialValues(null),
  });

  useEffect(() => {
    if (target) reset(initialValues(target));
  }, [target, reset]);

  const close = () => {
    setSaveError(false);
    onClose();
  };

  const onSubmit = handleSubmit(async (values) => {
    setSaveError(false);
    const input = {
      name: values.name,
      status: values.status,
      price: moneyFromField(values.price),
      bookingRef: values.bookingRef,
      url: values.url || null,
      address: values.address,
      vietnameseAddress: values.vietnameseAddress,
    };
    try {
      if (editing) await service.update(editing, input);
      else await service.create(stop, input);
      close();
    } catch {
      setSaveError(true);
    }
  });

  // `useWatch` s'abonne au seul champ prix pour l'aperçu du montant en direct.
  const price = useWatch({ control, name: 'price' });

  return (
    <>
      <Sheet
        open={target !== null && !confirmDelete}
        onClose={close}
        title={editing ? t.accommodations.editTitle : t.accommodations.addTitle}
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
          <TextField
            label={t.accommodations.nameLabel}
            placeholder={t.accommodations.namePlaceholder}
            autoComplete="off"
            error={errors.name?.message}
            {...register('name')}
          />
          <SegmentedField
            label={t.booking.label}
            options={BOOKING_STATUS_OPTIONS}
            {...register('status')}
          />
          <AmountField
            label={t.accommodations.priceLabel}
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
            label={t.accommodations.urlLabel}
            labelAside={t.common.optional}
            placeholder={t.accommodations.urlPlaceholder}
            type="url"
            inputMode="url"
            autoComplete="off"
            error={errors.url?.message}
            {...register('url')}
          />
          <TextField
            label={t.accommodations.addressLabel}
            labelAside={t.common.optional}
            autoComplete="off"
            error={errors.address?.message}
            {...register('address')}
          />
          <TextField
            label={t.accommodations.vietnameseAddressLabel}
            labelAside={t.common.optional}
            hint={t.accommodations.vietnameseAddressHint}
            lang="vi"
            autoComplete="off"
            error={errors.vietnameseAddress?.message}
            {...register('vietnameseAddress')}
          />
          {saveError && (
            <p role="alert" className="text-laque-deep m-0 text-[15px] font-medium">
              {t.validation.saveFailed}
            </p>
          )}
          {editing && (
            <Button
              variant="quiet"
              onClick={() => setConfirmDelete(true)}
              className="-ml-4 self-start"
            >
              <Trash2 className="size-5" strokeWidth={1.9} aria-hidden="true" />
              {t.accommodations.delete}
            </Button>
          )}
        </form>
      </Sheet>

      {editing && (
        <ConfirmSheet
          open={confirmDelete}
          onClose={() => {
            setConfirmDelete(false);
            close();
          }}
          title={t.accommodations.deleteTitle}
          message={t.accommodations.deleteMessage(editing.name)}
          confirmLabel={t.accommodations.delete}
          onConfirm={() => service.remove(editing)}
        />
      )}
    </>
  );
}
