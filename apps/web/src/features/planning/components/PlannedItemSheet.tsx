import { zodResolver } from '@hookform/resolvers/zod';
import { Trash2 } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { slotForTime, toLocalDate, type Trip } from '@ve-que/domain';
import { t } from '@/shared/i18n';
import { formatDuration, formatShortDate } from '@/shared/lib/format-date';
import { moneyFromField } from '@/shared/lib/money-field';
import { Button } from '@/shared/ui/Button';
import { ConfirmSheet } from '@/shared/ui/ConfirmSheet';
import { AmountField } from '@/shared/ui/form/AmountField';
import { SelectField, TextField } from '@/shared/ui/form/fields';
import { SegmentedField } from '@/shared/ui/form/SegmentedField';
import { Sheet } from '@/shared/ui/Sheet';
import { usePlannedItemService, type TripCalendar } from '../hooks/use-day-plan';
import { DURATION_OPTIONS, KIND_OPTIONS, SLOT_OPTIONS, STATUS_OPTIONS } from '../plan-style';
import {
  initialPlannedItemValues,
  plannedItemFormSchema,
  type PlannedItemFormValues,
  type PlannedItemSheetTarget,
} from '../planned-item-form';

const EMPTY_TARGET: PlannedItemSheetTarget = {
  mode: 'create',
  date: toLocalDate('2000-01-01'),
  slot: 'morning',
  kind: 'activity',
};

/**
 * Ajout et modification d'un élément du programme. Changer le jour ou le créneau ici est
 * l'action « Déplacer » sur téléphone (F-2.9) ; sur PC, on peut aussi glisser-déposer.
 */
export function PlannedItemSheet({
  trip,
  calendar,
  target,
  onClose,
}: {
  trip: Trip;
  calendar: TripCalendar;
  target: PlannedItemSheetTarget | null;
  onClose: () => void;
}) {
  const service = usePlannedItemService();
  const formId = useId();
  const [saveError, setSaveError] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const editing = target?.mode === 'edit' ? target.item : undefined;

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PlannedItemFormValues>({
    resolver: zodResolver(plannedItemFormSchema),
    defaultValues: initialPlannedItemValues(EMPTY_TARGET),
  });

  useEffect(() => {
    if (target) reset(initialPlannedItemValues(target));
  }, [target, reset]);

  const kind = useWatch({ control, name: 'kind' });
  const cost = useWatch({ control, name: 'cost' });
  const isActivity = kind === 'activity';

  const close = () => {
    setSaveError(false);
    onClose();
  };

  const onSubmit = handleSubmit(async (values) => {
    setSaveError(false);
    const input = {
      kind: values.kind,
      title: values.title || t.plan.kinds[values.kind],
      date: toLocalDate(values.date),
      slot: values.slot,
      time: values.time || null,
      durationMinutes: values.duration ? Number(values.duration) : null,
      estimatedCost: moneyFromField(values.cost),
      // Un temps libre n'a ni adresse ni coût : on n'enregistre pas ce qui a pu être saisi
      // avant de changer de type.
      address: values.kind === 'free_time' ? '' : values.address,
      vietnameseAddress: values.kind === 'free_time' ? '' : values.vietnameseAddress,
      status: values.status,
      notes: values.notes,
    };
    if (input.kind === 'free_time') input.estimatedCost = null;
    try {
      if (editing) await service.update(editing, input);
      else await service.create(trip, input);
      close();
    } catch {
      setSaveError(true);
    }
  });

  const dayOptions = calendar.days.map((day) => ({
    value: day.date,
    label: t.plan.dayOption(
      day.dayNumber,
      formatShortDate(day.date),
      (day.stopId && calendar.stopsById.get(day.stopId)?.name) || t.plan.noStop,
    ),
  }));

  return (
    <>
      <Sheet
        open={target !== null && !confirmDelete}
        onClose={close}
        title={editing ? t.plan.editTitle : t.plan.addTitle}
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
          <SegmentedField
            label={t.plan.kindLabel}
            options={KIND_OPTIONS}
            columns={3}
            {...register('kind')}
          />
          <TextField
            label={t.plan.titleLabel}
            labelAside={isActivity ? undefined : t.common.optional}
            placeholder={isActivity ? t.plan.titlePlaceholder : t.plan.kinds[kind]}
            autoComplete="off"
            error={errors.title?.message}
            {...register('title')}
          />
          <SelectField
            label={t.plan.dayField}
            options={dayOptions}
            error={errors.date?.message}
            {...register('date')}
          />
          <SegmentedField label={t.plan.slotLabel} options={SLOT_OPTIONS} {...register('slot')} />
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label={t.plan.timeLabel}
              labelAside={t.common.optional}
              type="time"
              className="tabular"
              {...register('time', {
                // Une heure précise range l'élément dans le bon créneau, sans autre geste.
                onChange: (event: { target: { value: string } }) => {
                  const value = event.target.value;
                  if (/^\d{2}:\d{2}$/.test(value)) setValue('slot', slotForTime(value));
                },
              })}
            />
            {kind !== 'free_time' ? (
              <SelectField
                label={t.plan.durationLabel}
                options={[
                  { value: '', label: t.plan.durationUnknown },
                  ...DURATION_OPTIONS.map((minutes) => ({
                    value: String(minutes),
                    label: formatDuration(minutes),
                  })),
                ]}
                {...register('duration')}
              />
            ) : (
              <span />
            )}
          </div>
          <p className="text-muted -mt-3 mb-0 text-[13px]">{t.plan.timeHint}</p>

          {kind !== 'free_time' && (
            <>
              <AmountField
                label={t.plan.costLabel}
                labelAside={t.common.optional}
                hint={t.plan.costHint}
                error={errors.cost?.text?.message}
                text={cost.text}
                currency={cost.currency}
                textInput={register('cost.text')}
                currencyInput={register('cost.currency')}
              />
              <TextField
                label={t.plan.addressLabel}
                labelAside={t.common.optional}
                autoComplete="off"
                error={errors.address?.message}
                {...register('address')}
              />
              <TextField
                label={t.plan.vietnameseAddressLabel}
                labelAside={t.common.optional}
                hint={t.plan.vietnameseAddressHint}
                lang="vi"
                autoComplete="off"
                error={errors.vietnameseAddress?.message}
                {...register('vietnameseAddress')}
              />
            </>
          )}
          <SelectField
            label={t.plan.statusLabel}
            options={STATUS_OPTIONS}
            {...register('status')}
          />
          <TextField
            label={t.plan.notesLabel}
            labelAside={t.common.optional}
            placeholder={t.plan.notesPlaceholder}
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
              {t.plan.delete}
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
          title={t.plan.deleteTitle}
          message={t.plan.deleteMessage(editing.title)}
          confirmLabel={t.plan.delete}
          onConfirm={() => service.remove(editing)}
        />
      )}
    </>
  );
}
