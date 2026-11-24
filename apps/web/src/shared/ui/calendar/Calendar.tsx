import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { localDateOf, type LocalDate } from '@ve-que/domain';
import { t } from '@/shared/i18n';
import { cn } from '@/shared/lib/cn';
import { pickerCellClass } from '@/shared/ui/picker/picker-cell';
import { formatFullDate, formatMonthYear, weekdayNames } from '@/shared/lib/format-date';
import {
  addMonths,
  clampDate,
  dayRole,
  firstDayOf,
  monthGrid,
  monthOf,
  monthsBetween,
  moveByKey,
  sameMonth,
  type CalendarSelection,
  type DayRole,
  type MonthRef,
} from './calendar-model';

/** Apparence particulière d'un jour, fournie par l'écran (ex. nuit déjà prise par une étape). */
export interface DayDecoration {
  /** Classes Tailwind du fond (ex. teinte de l'étape qui occupe la nuit). */
  className?: string;
  /** Précision lue par les lecteurs d'écran et affichée au survol (« Nuit à Saigon »). */
  description?: string;
}

export interface CalendarProps {
  selection: CalendarSelection;
  /** Le jour peut-il être choisi ? (règles métier de l'écran appelant) */
  isPickable: (date: LocalDate) => boolean;
  onPick: (date: LocalDate) => void;
  /** Bornes d'affichage (ex. dates du voyage). Hors bornes, les jours sont affichés vides. */
  min?: LocalDate;
  max?: LocalDate;
  decorate?: (date: LocalDate) => DayDecoration | undefined;
  /** Jour proposé au clavier et mois affiché quand rien n'est sélectionné. */
  defaultFocus?: LocalDate;
  /** Libellé du calendrier (id du libellé du champ). */
  labelledBy?: string;
}

/** Au-delà de 3 mois, on n'empile plus : un mois à la fois, avec des flèches. */
const MAX_STACKED_MONTHS = 3;

/**
 * Calendrier maison, réutilisable pour un jour seul ou une plage.
 *
 * Pourquoi pas le champ date du navigateur : il ne sait pas griser des jours précis (seulement
 * un minimum et un maximum), ni montrer une plage, ni colorer les jours déjà pris.
 *
 * Le composant est « bête » : il affiche une sélection et signale les jours touchés. La façon
 * de construire la sélection (un jour, une plage) et les règles (quels jours sont possibles)
 * viennent de l'appelant (`DateField`, `DateRangeField`), ce qui le garde réutilisable.
 *
 * Affichage :
 * - plage bornée courte (un voyage) : tous les mois l'un sous l'autre, sans navigation ;
 * - sinon : un mois à la fois, avec « mois précédent / suivant ».
 *
 * Accessibilité (motif « date picker » des ARIA Authoring Practices) : chaque mois est une
 * grille (`role="grid"`). Un seul jour est atteignable avec Tab (« tabindex itinérant ») ;
 * les flèches, Début/Fin et Page précédente/suivante déplacent le focus ; Entrée ou Espace
 * choisissent. Les jours impossibles restent lisibles mais sont marqués `aria-disabled`.
 */
export function Calendar({
  selection,
  isPickable,
  onPick,
  min,
  max,
  decorate,
  defaultFocus,
  labelledBy,
}: CalendarProps) {
  const stacked =
    min !== undefined && max !== undefined && monthsBetween(min, max).length <= MAX_STACKED_MONTHS;

  const initialFocus = clampDate(selection.start ?? defaultFocus ?? min ?? todayLocal(), min, max);
  const [focused, setFocused] = useState<LocalDate>(initialFocus);
  const [visibleMonth, setVisibleMonth] = useState<MonthRef>(monthOf(initialFocus));
  const buttons = useRef(new Map<LocalDate, HTMLButtonElement>());
  // Le focus ne doit bouger qu'après une action clavier, jamais à l'ouverture du calendrier.
  const focusPending = useRef(false);

  useLayoutEffect(() => {
    if (!focusPending.current) return;
    focusPending.current = false;
    buttons.current.get(focused)?.focus();
  }, [focused, visibleMonth]);

  const months = stacked ? monthsBetween(min, max) : [visibleMonth];

  const moveFocus = (date: LocalDate) => {
    const next = clampDate(date, min, max);
    focusPending.current = true;
    setFocused(next);
    if (!stacked && !sameMonth(monthOf(next), visibleMonth)) setVisibleMonth(monthOf(next));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, date: LocalDate) => {
    const target = moveByKey(date, event.key);
    if (!target) return;
    event.preventDefault();
    moveFocus(target);
  };

  const showMonth = (delta: number) => {
    const month = addMonths(visibleMonth, delta);
    setVisibleMonth(month);
    // Le focus clavier suit le mois affiché (son premier jour, ramené dans les bornes).
    setFocused(clampDate(firstDayOf(month), min, max));
  };
  const canShow = (delta: number) => {
    const month = addMonths(visibleMonth, delta);
    if (delta < 0 && min) return !isBefore(month, monthOf(min));
    if (delta > 0 && max) return !isBefore(monthOf(max), month);
    return true;
  };

  return (
    <div className="flex flex-col gap-4">
      {months.map((month) => (
        <MonthGrid
          key={`${month.year}-${month.month}`}
          month={month}
          header={
            stacked ? undefined : (
              <span className="flex gap-1">
                <NavButton
                  label={t.calendar.previousMonth}
                  disabled={!canShow(-1)}
                  onClick={() => showMonth(-1)}
                  icon={ChevronLeft}
                />
                <NavButton
                  label={t.calendar.nextMonth}
                  disabled={!canShow(1)}
                  onClick={() => showMonth(1)}
                  icon={ChevronRight}
                />
              </span>
            )
          }
          labelledBy={labelledBy}
          isSelected={(date) => dayRole(selection, date) !== null}
          renderDay={(date) => {
            if ((min && date < min) || (max && date > max)) {
              return (
                <span
                  className="text-muted/40 flex h-11 items-center justify-center text-[15px]"
                  aria-hidden="true"
                >
                  {Number(date.slice(8))}
                </span>
              );
            }
            return (
              <DayButton
                date={date}
                role={dayRole(selection, date)}
                pickable={isPickable(date)}
                decoration={decorate?.(date)}
                tabbable={date === focused}
                buttonRef={(node) => {
                  if (node) buttons.current.set(date, node);
                  else buttons.current.delete(date);
                }}
                onPick={() => {
                  setFocused(date);
                  onPick(date);
                }}
                onKeyDown={(event) => onKeyDown(event, date)}
              />
            );
          }}
        />
      ))}
    </div>
  );
}

function MonthGrid({
  month,
  header,
  labelledBy,
  isSelected,
  renderDay,
}: {
  month: MonthRef;
  header?: ReactNode;
  labelledBy?: string;
  isSelected: (date: LocalDate) => boolean;
  renderDay: (date: LocalDate) => ReactNode;
}) {
  const titleId = `cal-${month.year}-${month.month}-${labelledBy ?? 'title'}`;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex min-h-11 items-center justify-between px-1">
        <h3 id={titleId} className="m-0 text-[15px] font-semibold first-letter:uppercase">
          {formatMonthYear(month.year, month.month)}
        </h3>
        {header}
      </div>
      <table
        role="grid"
        aria-labelledby={labelledBy ? `${labelledBy} ${titleId}` : titleId}
        className="w-full table-fixed border-collapse"
      >
        <thead>
          <tr>
            {weekdayNames().map(({ short, long }) => (
              <th
                key={long}
                scope="col"
                abbr={long}
                className="text-muted pb-1 text-xs font-medium"
              >
                {short}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {monthGrid(month).map((week, index) => (
            <tr key={index}>
              {week.map((date, day) =>
                date ? (
                  <td
                    key={date}
                    className="p-0"
                    role="gridcell"
                    aria-selected={isSelected(date) || undefined}
                  >
                    {renderDay(date)}
                  </td>
                ) : (
                  <td key={`empty-${day}`} className="p-0" />
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Un jour. La plage est dessinée en deux couches : une bande pâle derrière (moitié droite pour
 * le début, moitié gauche pour la fin, toute la largeur entre les deux), et une pastille pleine
 * pour les extrémités. Les bandes de jours voisins se touchent et forment un ruban continu.
 */
function DayButton({
  date,
  role,
  pickable,
  decoration,
  tabbable,
  buttonRef,
  onPick,
  onKeyDown,
}: {
  date: LocalDate;
  role: DayRole;
  pickable: boolean;
  decoration: DayDecoration | undefined;
  tabbable: boolean;
  buttonRef: (node: HTMLButtonElement | null) => void;
  onPick: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
}) {
  const endpoint = role === 'start' || role === 'end' || role === 'single';
  const label = [formatFullDate(date), decoration?.description, !pickable && t.calendar.unavailable]
    .filter(Boolean)
    .join(', ');

  return (
    <span className="relative flex h-11 items-center justify-center">
      {(role === 'inside' || role === 'start' || role === 'end') && (
        <span
          aria-hidden="true"
          className={cn(
            'bg-laque-tint absolute inset-y-1',
            role === 'inside' && 'inset-x-0',
            role === 'start' && 'right-0 left-1/2',
            role === 'end' && 'right-1/2 left-0',
          )}
        />
      )}
      <button
        ref={buttonRef}
        type="button"
        tabIndex={tabbable ? 0 : -1}
        aria-label={label}
        aria-disabled={pickable ? undefined : true}
        title={decoration?.description}
        onClick={pickable ? onPick : undefined}
        onKeyDown={onKeyDown}
        className={pickerCellClass({
          selected: endpoint,
          pickable,
          extra: decoration?.className,
        })}
      >
        {Number(date.slice(8))}
      </button>
    </span>
  );
}

function NavButton({
  label,
  disabled,
  onClick,
  icon: Icon,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  icon: typeof ChevronLeft;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="border-line bg-surface text-ink hover:border-muted flex size-11 items-center justify-center rounded-xl border disabled:opacity-40"
    >
      <Icon className="size-5" strokeWidth={1.9} aria-hidden="true" />
    </button>
  );
}

function isBefore(a: MonthRef, b: MonthRef): boolean {
  return a.year < b.year || (a.year === b.year && a.month < b.month);
}

/** Date du jour dans le fuseau de l'appareil. */
function todayLocal(): LocalDate {
  return localDateOf(new Date(), Intl.DateTimeFormat().resolvedOptions().timeZone);
}
