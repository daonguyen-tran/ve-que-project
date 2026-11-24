import { zodResolver } from '@hookform/resolvers/zod';
import { Trash2 } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { cityKey, formatLocation, type Trip } from '@ve-que/domain';
import { useStops } from '@/features/itinerary/hooks/use-stops';
import { LocationField } from '@/features/map/components/LocationField';
import { locationFromField } from '@/features/map/location-field';
import { DURATION_OPTIONS } from '@/features/planning/plan-style';
import { t } from '@/shared/i18n';
import { formatDuration } from '@/shared/lib/format-date';
import { moneyFromField } from '@/shared/lib/money-field';
import { Button } from '@/shared/ui/Button';
import { ConfirmSheet } from '@/shared/ui/ConfirmSheet';
import { AmountField } from '@/shared/ui/form/AmountField';
import { CheckboxField } from '@/shared/ui/form/CheckboxField';
import { SelectField, TextField } from '@/shared/ui/form/fields';
import { SegmentedField } from '@/shared/ui/form/SegmentedField';
import { Sheet } from '@/shared/ui/Sheet';
import { useIdeaService } from '../hooks/use-ideas';
import {
  DEFAULT_RANGE,
  ideaFormSchema,
  initialIdeaValues,
  rangesFromValues,
  type IdeaFormValues,
  type IdeaSheetTarget,
} from '../idea-form';
import { CATEGORY_OPTIONS } from '../idea-style';
import { OpeningHoursField } from './OpeningHoursField';

const PRIORITY_OPTIONS = [
  { value: 'must', label: t.ideas.priorities.must },
  { value: 'nice', label: t.ideas.priorities.nice },
];
const PLACE_OPTIONS = [
  { value: 'indoor', label: t.ideas.indoor },
  { value: 'outdoor', label: t.ideas.outdoor },
];

/** Création et modification d'une idée (F-3.1). */
export function IdeaSheet({
  trip,
  cities,
  target,
  onClose,
}: {
  trip: Trip;
  /** Villes proposées à la saisie : étapes du voyage et villes déjà utilisées. */
  cities: string[];
  target: IdeaSheetTarget | null;
  onClose: () => void;
}) {
  const service = useIdeaService();
  const formId = useId();
  const citiesId = useId();
  const [saveError, setSaveError] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const editing = target?.mode === 'edit' ? target.idea : undefined;

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<IdeaFormValues>({
    resolver: zodResolver(ideaFormSchema),
    defaultValues: initialIdeaValues({ mode: 'create', city: '' }),
  });

  useEffect(() => {
    if (target) reset(initialIdeaValues(target));
  }, [target, reset]);

  const price = useWatch({ control, name: 'price' });
  const hasHours = useWatch({ control, name: 'hasHours' });
  const locationText = useWatch({ control, name: 'location' });
  const city = useWatch({ control, name: 'city' });
  // La carte s'ouvre sur l'étape du même nom que la ville de l'idée, si elle a une position.
  const cityStop = useStops(trip.id)?.find(
    (stop) => stop.place.location && cityKey(stop.name) === cityKey(city),
  );

  const close = () => {
    setSaveError(false);
    onClose();
  };

  const onSubmit = handleSubmit(async (values) => {
    setSaveError(false);
    const input = {
      title: values.title,
      city: values.city,
      category: values.category,
      priority: values.priority,
      durationMinutes: Number(values.duration),
      pricePerPerson: moneyFromField(values.price),
      indoor: values.place === 'indoor',
      openingHours: rangesFromValues(values),
      url: values.url || null,
      address: values.address,
      vietnameseAddress: values.vietnameseAddress,
      location: locationFromField(values.location),
      notes: values.notes,
    };
    try {
      if (editing) await service.update(editing, input);
      else await service.create(trip, input);
      close();
    } catch {
      setSaveError(true);
    }
  });

  return (
    <>
      <Sheet
        open={target !== null && !confirmDelete}
        onClose={close}
        title={editing ? t.ideas.editTitle : t.ideas.addTitle}
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
            label={t.ideas.titleLabel}
            placeholder={t.ideas.titlePlaceholder}
            autoComplete="off"
            error={errors.title?.message}
            {...register('title')}
          />
          <TextField
            label={t.ideas.cityLabel}
            hint={t.ideas.cityHint}
            list={citiesId}
            autoComplete="off"
            error={errors.city?.message}
            {...register('city')}
          />
          <datalist id={citiesId}>
            {cities.map((city) => (
              <option key={city} value={city} />
            ))}
          </datalist>
          <SegmentedField
            label={t.ideas.categoryLabel}
            options={CATEGORY_OPTIONS}
            columns={3}
            {...register('category')}
          />
          <SegmentedField
            label={t.ideas.priorityLabel}
            options={PRIORITY_OPTIONS}
            {...register('priority')}
          />
          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label={t.ideas.durationLabel}
              options={DURATION_OPTIONS.map((minutes) => ({
                value: String(minutes),
                label: formatDuration(minutes),
              }))}
              {...register('duration')}
            />
            <SegmentedField
              label={t.ideas.placeKindLabel}
              options={PLACE_OPTIONS}
              {...register('place')}
            />
          </div>
          <AmountField
            label={t.ideas.priceLabel}
            labelAside={t.common.optional}
            error={errors.price?.text?.message}
            text={price.text}
            currency={price.currency}
            textInput={register('price.text')}
            currencyInput={register('price.currency')}
          />

          <fieldset className="m-0 flex min-w-0 flex-col gap-3 border-0 p-0">
            <legend className="text-ink-soft mb-1.5 p-0 text-sm font-medium">
              {t.ideas.hoursLabel}
            </legend>
            <CheckboxField
              label={t.ideas.hoursKnown}
              hint={hasHours ? undefined : t.ideas.hoursHint}
              {...register('hasHours', {
                onChange: (event: { target: { checked: boolean } }) => {
                  if (event.target.checked && getValues('ranges').length === 0) {
                    setValue('ranges', [DEFAULT_RANGE]);
                  }
                },
              })}
            />
            {hasHours && (
              <OpeningHoursField
                control={control}
                register={register}
                errors={errors.ranges}
                onEmpty={() => setValue('hasHours', false)}
              />
            )}
          </fieldset>

          <TextField
            label={t.ideas.addressLabel}
            labelAside={t.common.optional}
            autoComplete="off"
            error={errors.address?.message}
            {...register('address')}
          />
          <TextField
            label={t.ideas.vietnameseAddressLabel}
            labelAside={t.common.optional}
            hint={t.ideas.vietnameseAddressHint}
            lang="vi"
            autoComplete="off"
            error={errors.vietnameseAddress?.message}
            {...register('vietnameseAddress')}
          />
          <LocationField
            value={locationText}
            error={errors.location?.message}
            inputProps={register('location')}
            onPick={(point) =>
              setValue('location', formatLocation(point), {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            center={cityStop?.place.location ?? null}
          />
          <TextField
            label={t.ideas.urlLabel}
            labelAside={t.common.optional}
            placeholder={t.ideas.urlPlaceholder}
            type="url"
            inputMode="url"
            autoComplete="off"
            error={errors.url?.message}
            {...register('url')}
          />
          <TextField
            label={t.ideas.notesLabel}
            labelAside={t.common.optional}
            placeholder={t.ideas.notesPlaceholder}
            autoComplete="off"
            error={errors.notes?.message}
            {...register('notes')}
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
              {t.ideas.delete}
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
          title={t.ideas.deleteTitle}
          message={t.ideas.deleteMessage(editing.title)}
          confirmLabel={t.ideas.delete}
          onConfirm={() => service.remove(editing)}
        />
      )}
    </>
  );
}
