import { zodResolver } from '@hookform/resolvers/zod';
import { Trash2 } from 'lucide-react';
import { useEffect, useId, useMemo, useState } from 'react';
import { useController, useForm } from 'react-hook-form';
import {
  daysBetween,
  stopAvailability,
  stopColorOf,
  toLocalDate,
  type LocalDate,
  type Stop,
  type StopColor,
  type Trip,
} from '@ve-que/domain';
import { t } from '@/shared/i18n';
import { Button } from '@/shared/ui/Button';
import { ConfirmSheet } from '@/shared/ui/ConfirmSheet';
import { DateRangeField } from '@/shared/ui/calendar';
import { TextField } from '@/shared/ui/form/fields';
import { SegmentedField } from '@/shared/ui/form/SegmentedField';
import { Sheet } from '@/shared/ui/Sheet';
import { useStopService } from '../hooks/use-stops';
import { makeStopFormSchema, type StopFormValues } from '../stop-form-schema';
import { STOP_COLOR_STYLE, STOP_KIND_OPTIONS } from '../stop-style';
import { StopColorField } from './StopColorField';

/** Ce que le panneau doit faire : créer (avec des dates proposées) ou modifier une étape. */
export type StopSheetTarget =
  | { mode: 'create'; arrivalDate?: LocalDate; departureDate?: LocalDate; color?: StopColor }
  | { mode: 'edit'; stop: Stop };

function initialValues(target: StopSheetTarget): StopFormValues {
  if (target.mode === 'edit') {
    const { stop } = target;
    return {
      name: stop.name,
      kind: stop.kind,
      color: stopColorOf(stop),
      arrivalDate: stop.arrivalDate,
      departureDate: stop.departureDate,
      vietnameseName: stop.place.vietnamese,
      notes: stop.notes,
    };
  }
  return {
    name: '',
    kind: 'city',
    color: target.color ?? 'indigo',
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
  onDeleted,
}: {
  trip: Trip;
  stops: Stop[];
  /** `null` : panneau fermé. */
  target: StopSheetTarget | null;
  onClose: () => void;
  /** Appelé après la suppression (ex. pour quitter la fiche de l'étape supprimée). */
  onDeleted?: () => void;
}) {
  const stopService = useStopService();
  const formId = useId();
  const [saveError, setSaveError] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const editing = target?.mode === 'edit' ? target.stop : undefined;

  // Nuits déjà prises par les autres étapes : le calendrier les grise et les colore.
  const availability = useMemo(
    () => stopAvailability(trip, stops, editing?.id),
    [trip, stops, editing?.id],
  );
  const hasOtherStops = stops.some((stop) => stop.id !== editing?.id);

  // Le schéma dépend du voyage et des autres étapes : on le recalcule quand ils changent.
  const schema = useMemo(
    () => makeStopFormSchema(trip, stops, editing?.id),
    [trip, stops, editing?.id],
  );
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StopFormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialValues({ mode: 'create' }),
  });
  // Les deux dates sont pilotées par le calendrier (composant contrôlé), pas par un <input>.
  const arrival = useController({ control, name: 'arrivalDate' });
  const departure = useController({ control, name: 'departureDate' });

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
          <StopColorField
            label={t.stops.colorLabel}
            hint={t.stops.colorHint}
            registration={register('color')}
          />
          <DateRangeField
            label={t.stops.datesLabel}
            startLabel={t.stops.arrivalLabel}
            endLabel={t.stops.departureLabel}
            value={{ start: arrival.field.value, end: departure.field.value }}
            onChange={({ start, end }) => {
              arrival.field.onChange(start ?? '');
              departure.field.onChange(end ?? '');
            }}
            rules={{ canStart: availability.canArrive, canEnd: availability.canDepart }}
            summary={(start, end) => t.stops.nights(daysBetween(start, end))}
            hint={t.stops.datesHint}
            errors={[errors.arrivalDate?.message, errors.departureDate?.message]}
            min={trip.startDate}
            max={trip.endDate}
            decorate={(date) => {
              const other = availability.takenBy(date);
              return other
                ? {
                    className: STOP_COLOR_STYLE[stopColorOf(other)].tint,
                    description: t.stops.takenNight(other.name),
                  }
                : undefined;
            }}
            footer={
              hasOtherStops && <p className="text-muted m-0 text-[13px]">{t.stops.takenLegend}</p>
            }
          />
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
          onConfirm={async () => {
            await stopService.deleteStop(editing);
            onDeleted?.();
          }}
        />
      )}
    </>
  );
}
