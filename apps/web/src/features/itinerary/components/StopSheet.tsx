import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Trash2 } from 'lucide-react';
import { useEffect, useId, useMemo, useState } from 'react';
import { useController, useForm, useWatch } from 'react-hook-form';
import {
  daysBetween,
  stopAvailability,
  stopColorOf,
  toLocalDate,
  type LocalDate,
  type Stop,
  type StopColor,
  type Trip,
  formatLocation,
  type LocalitySuggestion,
} from '@ve-que/domain';
import { t } from '@/shared/i18n';
import { Button } from '@/shared/ui/Button';
import { ConfirmSheet } from '@/shared/ui/ConfirmSheet';
import { DateRangeField } from '@/shared/ui/calendar';
import { CheckboxField } from '@/shared/ui/form/CheckboxField';
import { TextField } from '@/shared/ui/form/fields';
import { SegmentedField } from '@/shared/ui/form/SegmentedField';
import { Sheet } from '@/shared/ui/Sheet';
import { useStopService } from '../hooks/use-stops';
import { LocalityNameField } from '@/features/localities/components/LocalityNameField';
import { useLocalityService } from '@/features/localities/hooks/use-localities';
import { LocationField } from '@/features/map/components/LocationField';
import { locationFromField, locationToField } from '@/features/map/location-field';
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
      location: locationToField(stop.place.location),
      notes: stop.notes,
      remember: false,
    };
  }
  return {
    name: '',
    kind: 'city',
    color: target.color ?? 'indigo',
    arrivalDate: target.arrivalDate ?? '',
    departureDate: target.departureDate ?? '',
    vietnameseName: '',
    location: '',
    notes: '',
    remember: false,
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
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<StopFormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialValues({ mode: 'create' }),
  });
  // Les deux dates sont pilotées par le calendrier (composant contrôlé), pas par un <input>.
  const arrival = useController({ control, name: 'arrivalDate' });
  const departure = useController({ control, name: 'departureDate' });
  const locationText = useWatch({ control, name: 'location' });
  const name = useController({ control, name: 'name' });
  const localityService = useLocalityService();
  // Suggestion choisie pour le nom, mémorisée avec le panneau ouvert à ce moment-là : en
  // rouvrir un autre (autre étape, nouvelle création) l'oublie, sans effet à synchroniser.
  const [pick, setPick] = useState<{
    target: StopSheetTarget;
    suggestion: LocalitySuggestion;
  } | null>(null);
  const picked = pick && pick.target === target ? pick.suggestion : null;

  /** Choisir une suggestion remplit le nom, le nom vietnamien, le type et la position. */
  const applySuggestion = (suggestion: LocalitySuggestion) => {
    if (!target) return;
    const options = { shouldDirty: true, shouldValidate: true };
    name.field.onChange(suggestion.name);
    setValue('vietnameseName', suggestion.vietnameseName, options);
    setValue('kind', suggestion.kind, options);
    setValue('location', suggestion.location ? formatLocation(suggestion.location) : '', options);
    setValue('remember', false);
    setPick({ target, suggestion });
  };

  /** Modifier le nom après un choix : la position venait de la suggestion, on l'oublie. */
  const typeName = (value: string) => {
    name.field.onChange(value);
    if (picked) {
      setPick(null);
      setValue('location', '', { shouldDirty: true });
    }
  };

  useEffect(() => {
    if (target) reset(initialValues(target));
  }, [target, reset]);

  const close = () => {
    setSaveError(false);
    onClose();
  };

  const onSubmit = handleSubmit(async ({ remember, ...values }) => {
    setSaveError(false);
    const input = {
      ...values,
      arrivalDate: toLocalDate(values.arrivalDate),
      departureDate: toLocalDate(values.departureDate),
      location: locationFromField(values.location),
    };
    try {
      if (editing) await stopService.updateStop(trip, editing, input);
      else await stopService.createStop(trip, input);
      // Un lieu trouvé en ligne est retenu d'office : il sera proposé ensuite, même hors ligne.
      // Un nom saisi à la main ne l'est que si l'utilisateur l'a demandé.
      if (remember || picked?.source === 'online') {
        await localityService.remember({
          name: input.name,
          vietnameseName: input.vietnameseName,
          kind: input.kind,
          location: input.location,
        });
      }
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
          <div className="flex flex-col gap-1">
            <LocalityNameField
              label={t.stops.nameLabel}
              placeholder={t.stops.namePlaceholder}
              error={errors.name?.message}
              value={name.field.value}
              onChange={typeName}
              onBlur={name.field.onBlur}
              onPick={applySuggestion}
            />
            {picked ? (
              <p
                role="status"
                className="text-muted m-0 flex items-center gap-1.5 px-1 text-[13px]"
              >
                <Check className="size-4 shrink-0" strokeWidth={2.2} aria-hidden="true" />
                {t.localities.picked(picked.name)}
              </p>
            ) : (
              name.field.value.trim() && (
                <CheckboxField
                  label={t.localities.remember}
                  hint={t.localities.rememberHint}
                  {...register('remember')}
                />
              )
            )}
          </div>
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
            center={null}
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
