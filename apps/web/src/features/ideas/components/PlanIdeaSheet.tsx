import { CircleAlert } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { useController, useForm, useWatch } from 'react-hook-form';
import {
  groupCost,
  openingStatus,
  slotForTime,
  suggestDayForCity,
  timeSlotSchema,
  toLocalDate,
  tripPhase,
  tripToday,
  type Idea,
  type PlannedItem,
  type TimeSlot,
  type Trip,
} from '@ve-que/domain';
import type { TripCalendar } from '@/features/planning/hooks/use-day-plan';
import { formatCost, SLOT_OPTIONS } from '@/features/planning/plan-style';
import { t } from '@/shared/i18n';
import { formatShortDate } from '@/shared/lib/format-date';
import { Button } from '@/shared/ui/Button';
import { SelectField } from '@/shared/ui/form/fields';
import { SegmentedField } from '@/shared/ui/form/SegmentedField';
import { Sheet } from '@/shared/ui/Sheet';
import { TimeField } from '@/shared/ui/time';
import { useIdeaService } from '../hooks/use-ideas';

interface PlanValues {
  date: string;
  slot: TimeSlot;
  time: string;
}

/**
 * Planifier une idée (F-3.3) : jour, créneau, heure facultative. Le jour proposé est le
 * premier passé dans la ville de l'idée ; les horaires connus signalent un lieu fermé, sans
 * jamais bloquer (les horaires saisis peuvent être faux, ou on veut juste voir la façade).
 */
export function PlanIdeaSheet({
  trip,
  calendar,
  idea,
  travellers,
  onClose,
  onPlanned,
}: {
  trip: Trip;
  calendar: TripCalendar;
  idea: Idea | null;
  travellers: number;
  onClose: () => void;
  onPlanned: (item: PlannedItem) => void;
}) {
  const service = useIdeaService();
  const formId = useId();
  const [saveError, setSaveError] = useState(false);
  const { register, handleSubmit, reset, control, setValue, formState } = useForm<PlanValues>({
    defaultValues: { date: '', slot: 'morning', time: '' },
  });

  useEffect(() => {
    if (!idea) return;
    const now = new Date();
    const from = tripPhase(trip, now) === 'ongoing' ? tripToday(trip, now) : undefined;
    const date = suggestDayForCity(
      calendar.days,
      [...calendar.stopsById.values()],
      idea.city,
      from,
    );
    reset({ date: date ?? '', slot: 'morning', time: '' });
  }, [idea, trip, calendar, reset]);

  const [date, slot, time] = useWatch({ control, name: ['date', 'slot', 'time'] });
  // L'heure est pilotée par le sélecteur maison (composant contrôlé).
  const timeField = useController({ control, name: 'time' });

  if (!idea)
    return (
      <Sheet open={false} onClose={onClose} title="">
        {null}
      </Sheet>
    );

  const status =
    date && timeSlotSchema.safeParse(slot).success
      ? openingStatus(idea.openingHours, toLocalDate(date), { slot, time: time || null })
      : 'unknown';
  const cost = groupCost(idea.pricePerPerson, travellers);
  const weekday = date ? (t.ideas.weekdays[new Date(`${date}T00:00:00Z`).getUTCDay()] ?? '') : '';

  const close = () => {
    setSaveError(false);
    onClose();
  };

  const onSubmit = handleSubmit(async (values) => {
    setSaveError(false);
    try {
      const item = await service.plan(
        trip,
        idea,
        { date: toLocalDate(values.date), slot: values.slot, time: values.time || null },
        travellers,
      );
      onPlanned(item);
      close();
    } catch {
      setSaveError(true);
    }
  });

  return (
    <Sheet
      open
      onClose={close}
      title={t.ideas.planAction(idea.title)}
      footer={
        <>
          <Button variant="quiet" onClick={close}>
            {t.common.cancel}
          </Button>
          <Button type="submit" form={formId} disabled={formState.isSubmitting}>
            {t.ideas.plan}
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
        <SelectField
          label={t.plan.dayField}
          options={calendar.days.map((day) => ({
            value: day.date,
            label: t.plan.dayOption(
              day.dayNumber,
              formatShortDate(day.date),
              (day.stopId && calendar.stopsById.get(day.stopId)?.name) || t.plan.noStop,
            ),
          }))}
          {...register('date')}
        />
        <SegmentedField label={t.plan.slotLabel} options={SLOT_OPTIONS} {...register('slot')} />
        <TimeField
          label={t.plan.timeLabel}
          labelAside={t.common.optional}
          hint={t.plan.timeHint}
          clearable
          value={timeField.field.value}
          onChange={(value) => {
            timeField.field.onChange(value);
            if (value) setValue('slot', slotForTime(value));
          }}
        />
        {status === 'closed' && (
          <p
            role="status"
            className="bg-laque-tint text-laque-deep m-0 flex gap-2 rounded-xl px-3.5 py-3 text-[15px] leading-relaxed"
          >
            <CircleAlert className="mt-0.5 size-5 shrink-0" strokeWidth={1.9} aria-hidden="true" />
            {t.ideas.closedWarning(weekday)}
          </p>
        )}
        {cost && (
          <p className="text-ink-soft m-0 text-[15px]">
            {t.ideas.costPreview(formatCost(cost), travellers)}
          </p>
        )}
        {saveError && (
          <p role="alert" className="text-laque-deep m-0 text-[15px] font-medium">
            {t.validation.saveFailed}
          </p>
        )}
      </form>
    </Sheet>
  );
}
