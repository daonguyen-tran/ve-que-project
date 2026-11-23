import { zodResolver } from '@hookform/resolvers/zod';
import { Trash2 } from 'lucide-react';
import { useEffect, useId, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toLocalDate, type LocalDate, type Stop, type Trip } from '@ve-que/domain';
import { t } from '@/shared/i18n';
import { Button } from '@/shared/ui/Button';
import { ConfirmSheet } from '@/shared/ui/ConfirmSheet';
import { DateField, FieldGroupError, TextField } from '@/shared/ui/form/fields';
import { SegmentedField } from '@/shared/ui/form/SegmentedField';
import { Sheet } from '@/shared/ui/Sheet';
import { useStopService } from '../hooks/use-stops';
import { makeStopFormSchema, type StopFormValues } from '../stop-form-schema';
import { STOP_KIND_OPTIONS } from '../stop-style';

/** Ce que le panneau doit faire : créer (avec des dates proposées) ou modifier une étape. */
export type StopSheetTarget =
  | { mode: 'create'; arrivalDate?: LocalDate; departureDate?: LocalDate }
  | { mode: 'edit'; stop: Stop };

function initialValues(target: StopSheetTarget): StopFormValues {
  if (target.mode === 'edit') {
    const { stop } = target;
    return {
      name: stop.name,
      kind: stop.kind,
      arrivalDate: stop.arrivalDate,
      departureDate: stop.departureDate,
      vietnameseName: stop.place.vietnamese,
      notes: stop.notes,
    };
  }
  return {
    name: '',
    kind: 'city',
    arrivalDate: target.arrivalDate ?? '',
    departureDate: target.departureDate ?? '',
    vietnameseName: '',
    notes: '',
  };
}

/** Création et modification d'une étape (F-2.1), avec suppression en cascade. */
export function StopSheet({
  trip,
  stops,
  target,
  onClose,
}: {
  trip: Trip;
  stops: Stop[];
  /** `null` : panneau fermé. */
  target: StopSheetTarget | null;
  onClose: () => void;
}) {
  const stopService = useStopService();
  const formId = useId();
  const datesErrorId = useId();
  const [saveError, setSaveError] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const editing = target?.mode === 'edit' ? target.stop : undefined;

  // Le schéma dépend du voyage et des autres étapes : on le recalcule quand ils changent.
  const schema = useMemo(
    () => makeStopFormSchema(trip, stops, editing?.id),
    [trip, stops, editing?.id],
  );
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StopFormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialValues({ mode: 'create' }),
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
      ...values,
      arrivalDate: toLocalDate(values.arrivalDate),
      departureDate: toLocalDate(values.departureDate),
    };
    try {
      if (editing) await stopService.updateStop(trip, editing, input);
      else await stopService.createStop(trip, input);
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
        title={editing ? t.stops.editTitle : t.stops.addTitle}
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
            label={t.stops.nameLabel}
            placeholder={t.stops.namePlaceholder}
            autoComplete="off"
            error={errors.name?.message}
            {...register('name')}
          />
          <SegmentedField
            label={t.stops.kindLabel}
            options={STOP_KIND_OPTIONS}
            {...register('kind')}
          />
          <div className="flex flex-col gap-1.5">
            <div className="grid grid-cols-2 gap-3">
              <DateField
                label={t.stops.arrivalLabel}
                min={trip.startDate}
                max={trip.endDate}
                error={errors.arrivalDate?.message}
                externalErrorId={datesErrorId}
                {...register('arrivalDate')}
              />
              <DateField
                label={t.stops.departureLabel}
                min={trip.startDate}
                max={trip.endDate}
                error={errors.departureDate?.message}
                externalErrorId={datesErrorId}
                {...register('departureDate')}
              />
            </div>
            {errors.arrivalDate || errors.departureDate ? (
              <FieldGroupError
                id={datesErrorId}
                messages={[errors.arrivalDate?.message, errors.departureDate?.message]}
              />
            ) : (
              <p className="text-muted m-0 text-[13px]">{t.stops.datesHint}</p>
            )}
          </div>
          <TextField
            label={t.stops.vietnameseLabel}
            labelAside={t.common.optional}
            placeholder={t.stops.vietnamesePlaceholder}
            hint={t.stops.vietnameseHint}
            lang="vi"
            autoComplete="off"
            error={errors.vietnameseName?.message}
            {...register('vietnameseName')}
          />
          <TextField
            label={t.stops.notesLabel}
            labelAside={t.common.optional}
            placeholder={t.stops.notesPlaceholder}
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
              {t.stops.delete}
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
          title={t.stops.deleteTitle}
          message={t.stops.deleteMessage(editing.name)}
          confirmLabel={t.stops.delete}
          onConfirm={() => stopService.deleteStop(editing)}
        />
      )}
    </>
  );
}
