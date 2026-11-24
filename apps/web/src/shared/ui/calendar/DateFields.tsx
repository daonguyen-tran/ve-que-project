import { CalendarDays, CircleAlert } from 'lucide-react';
import { useId, type ReactNode } from 'react';
import { isLocalDate, type LocalDate } from '@ve-que/domain';
import { t } from '@/shared/i18n';
import { cn } from '@/shared/lib/cn';
import { formatMediumDate } from '@/shared/lib/format-date';
import { controlClass, describedBy, type FieldChrome } from '@/shared/ui/form/field-chrome';
import { FieldFrame } from '@/shared/ui/form/fields';
import { PICKER_PANEL_CLASS } from '@/shared/ui/picker/picker-cell';
import { usePickerPanel } from '@/shared/ui/picker/use-picker-panel';
import { Calendar, type DayDecoration } from './Calendar';
import {
  isPickable as isRangePickable,
  nextRange,
  type CalendarSelection,
  type RangeRules,
} from './calendar-model';

/** Options communes aux deux champs. */
interface CalendarOptions {
  min?: LocalDate;
  max?: LocalDate;
  decorate?: (date: LocalDate) => DayDecoration | undefined;
  defaultFocus?: LocalDate;
}

/**
 * Valeur venant d'un formulaire : une chaîne « AAAA-MM-JJ », ou vide (`''`) tant que rien
 * n'est choisi. Toute valeur qui n'est pas une date valide est traitée comme « rien ».
 */
type MaybeDate = string | null | undefined;
const orNull = (value: MaybeDate): LocalDate | null => (value && isLocalDate(value) ? value : null);

/**
 * Champ « un jour » : un bouton qui affiche la date choisie et déplie le calendrier en
 * dessous. Choisir un jour referme le calendrier et rend le focus au bouton ; toucher ailleurs
 * ou Échap le referme aussi (voir `usePickerPanel`).
 *
 * Le calendrier s'ouvre dans la page (et non dans une fenêtre par-dessus) : dans un panneau
 * déjà modal, une seconde couche modale compliquerait le focus et le bouton retour d'Android.
 */
export function DateField({
  label,
  hint,
  error,
  externalErrorId,
  labelAside,
  value,
  onChange,
  isPickable = () => true,
  min,
  max,
  decorate,
  defaultFocus,
  panelClassName,
}: FieldChrome &
  CalendarOptions & {
    value: MaybeDate;
    onChange: (date: LocalDate) => void;
    isPickable?: (date: LocalDate) => boolean;
    /**
     * Classes du calendrier déplié. Dans une grille (date + heure côte à côte), passer
     * `col-span-full row-start-2` : le calendrier prend toute la largeur, sous la ligne.
     */
    panelClassName?: string;
  }) {
  const id = useId();
  const panelId = useId();
  const { open, toggle, close, triggerRef, panelRef, onKeyDown } = usePickerPanel();
  const date = orNull(value);
  const inBounds = (day: LocalDate) => (!min || day >= min) && (!max || day <= max);

  // Fragment : le champ et son calendrier sont deux éléments frères, pour que le parent (une
  // grille par exemple) puisse placer le calendrier sur toute la largeur.
  return (
    <>
      <FieldFrame
        id={id}
        label={label}
        hint={hint}
        error={error}
        externalErrorId={externalErrorId}
        labelAside={labelAside}
      >
        <button
          ref={triggerRef}
          id={id}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, { hint, error, externalErrorId })}
          onClick={toggle}
          onKeyDown={onKeyDown}
          className={controlClass(
            Boolean(error),
            'tabular flex items-center justify-between gap-2 text-left',
          )}
        >
          <span className={cn(!date && 'text-muted')}>
            {date ? formatMediumDate(date) : t.calendar.choose}
          </span>
          <CalendarDays
            className="text-muted size-5 shrink-0"
            strokeWidth={1.9}
            aria-hidden="true"
          />
        </button>
      </FieldFrame>
      {open && (
        <div
          ref={panelRef}
          id={panelId}
          onKeyDown={onKeyDown}
          className={cn(PICKER_PANEL_CLASS, panelClassName)}
        >
          <Calendar
            selection={{ start: date, end: date }}
            isPickable={(day) => inBounds(day) && isPickable(day)}
            onPick={(day) => {
              onChange(day);
              close(true);
            }}
            min={min}
            max={max}
            decorate={decorate}
            defaultFocus={defaultFocus}
            labelledBy={id}
          />
        </div>
      )}
    </>
  );
}

/**
 * Champ « plage de dates » (arrivée → départ, début → fin du voyage) : deux cases de résumé et
 * le calendrier toujours visible en dessous. On touche le premier jour, puis le dernier ; la
 * case attendue est soulignée et une phrase dit quoi faire.
 *
 * Les règles (`rules`) viennent de l'écran : pour une étape, par exemple, on ne peut pas partir
 * après le début de l'étape suivante. Le calendrier grise d'avance les jours impossibles.
 */
export function DateRangeField({
  label,
  startLabel,
  endLabel,
  value,
  onChange,
  rules,
  summary,
  hint,
  errors = [],
  footer,
  min,
  max,
  decorate,
  defaultFocus,
}: CalendarOptions & {
  label: string;
  startLabel: string;
  endLabel: string;
  value: { start: MaybeDate; end: MaybeDate };
  onChange: (selection: CalendarSelection) => void;
  rules: RangeRules;
  /** Résumé à droite du libellé quand la plage est complète (ex. « 4 nuits »). */
  summary?: (start: LocalDate, end: LocalDate) => string;
  hint?: string;
  errors?: Array<string | undefined>;
  /** Légende ou précision sous le calendrier. */
  footer?: ReactNode;
}) {
  const labelId = useId();
  const statusId = useId();
  const selection: CalendarSelection = { start: orNull(value.start), end: orNull(value.end) };
  const { start, end } = selection;
  const messages = [...new Set(errors.filter(Boolean))];
  const waitingFor = !start || end ? 'start' : 'end';
  const status =
    waitingFor === 'start' ? t.calendar.pickStart(startLabel) : t.calendar.pickEnd(endLabel);

  return (
    <div
      role="group"
      aria-labelledby={labelId}
      aria-describedby={statusId}
      className="flex flex-col gap-2"
    >
      <div className="flex items-baseline justify-between gap-3">
        <span id={labelId} className="text-ink-soft text-sm font-medium">
          {label}
        </span>
        {start && end && summary && (
          <span className="text-muted tabular text-[13px]">{summary(start, end)}</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <RangeEnd label={startLabel} date={start} active={waitingFor === 'start' && !start} />
        <RangeEnd label={endLabel} date={end} active={waitingFor === 'end'} />
      </div>

      <div className={PICKER_PANEL_CLASS}>
        <Calendar
          selection={selection}
          isPickable={(day) => isRangePickable(selection, day, rules)}
          onPick={(day) => onChange(nextRange(selection, day, rules))}
          min={min}
          max={max}
          decorate={decorate}
          defaultFocus={defaultFocus}
          labelledBy={labelId}
        />
      </div>

      {messages.length > 0 ? (
        <div id={statusId} className="flex flex-col gap-1">
          {messages.map((message) => (
            <p
              key={message}
              className="text-laque-deep m-0 flex items-start gap-1.5 text-[13px] font-medium"
            >
              <CircleAlert className="mt-px size-4 shrink-0" strokeWidth={2} aria-hidden="true" />
              {message}
            </p>
          ))}
        </div>
      ) : (
        <p id={statusId} aria-live="polite" className="text-muted m-0 text-[13px]">
          {start && end ? hint : status}
        </p>
      )}
      {footer}
    </div>
  );
}

/** Case de résumé d'une extrémité de la plage. Soulignée quand c'est elle qu'on attend. */
function RangeEnd({
  label,
  date,
  active,
}: {
  label: string;
  date: LocalDate | null;
  active: boolean;
}) {
  return (
    <div
      className={cn(
        'bg-surface flex min-h-14 flex-col justify-center rounded-xl border px-3.5 py-2',
        active ? 'border-laque outline-laque outline-1' : 'border-line',
      )}
    >
      <span className="text-muted text-xs font-medium">{label}</span>
      <span className={cn('tabular text-[15px] font-semibold', !date && 'text-muted font-normal')}>
        {date ? formatMediumDate(date) : '—'}
      </span>
    </div>
  );
}
