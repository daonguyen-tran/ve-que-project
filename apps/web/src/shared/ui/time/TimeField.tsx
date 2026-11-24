import { Clock } from 'lucide-react';
import { useId, useState } from 'react';
import { t } from '@/shared/i18n';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/Button';
import { controlClass, describedBy, type FieldChrome } from '@/shared/ui/form/field-chrome';
import { FieldFrame } from '@/shared/ui/form/fields';
import { PICKER_PANEL_CLASS } from '@/shared/ui/picker/picker-cell';
import { usePickerPanel } from '@/shared/ui/picker/use-picker-panel';
import {
  DEFAULT_TIME,
  formatTime,
  HOURS,
  MINUTES,
  pad2,
  parseTime,
  type TimeParts,
} from './time-model';
import { SelectionBand, Wheel } from './Wheel';

/**
 * Champ « heure », jumeau de `DateField` : un bouton qui affiche l'heure choisie et déplie,
 * dessous, deux roues qui défilent (heures, minutes), comme sur un téléphone.
 *
 * - Chaque arrêt d'une roue enregistre l'heure aussitôt : sur une activité, le créneau
 *   s'ajuste pendant qu'on fait défiler.
 * - Un champ vide ouvre les roues sur 09:00 sans rien enregistrer : « Valider » garde l'heure
 *   affichée telle quelle, toucher ailleurs referme sans rien changer.
 * - `clearable` ajoute « Effacer » pour les champs facultatifs.
 */
export function TimeField({
  label,
  hint,
  error,
  externalErrorId,
  labelAside,
  value,
  onChange,
  clearable = false,
  panelClassName,
}: FieldChrome & {
  value: string | null | undefined;
  onChange: (value: string) => void;
  clearable?: boolean;
  /** Voir `DateField` : `col-span-full row-start-2` dans une grille de champs côte à côte. */
  panelClassName?: string;
}) {
  const id = useId();
  const panelId = useId();
  const { open, toggle, close, triggerRef, panelRef, onKeyDown } = usePickerPanel();
  // Position des roues. Elle suit la valeur enregistrée, sauf quand le champ est vide : les
  // roues montrent alors 09:00 sans que rien ne soit encore choisi.
  const [draft, setDraft] = useState<TimeParts>(DEFAULT_TIME);
  const shown = parseTime(value) ?? draft;

  const update = (next: TimeParts) => {
    setDraft(next);
    onChange(formatTime(next));
  };

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
          <span className={cn(!value && 'text-muted')}>{value || t.time.choose}</span>
          <Clock className="text-muted size-5 shrink-0" strokeWidth={1.9} aria-hidden="true" />
        </button>
      </FieldFrame>
      {open && (
        <div
          ref={panelRef}
          id={panelId}
          onKeyDown={onKeyDown}
          className={cn(PICKER_PANEL_CLASS, 'flex flex-col gap-2', panelClassName)}
        >
          <div className="relative mx-auto flex w-full max-w-64 items-center gap-1">
            <SelectionBand />
            <Wheel
              label={t.time.hours}
              values={HOURS}
              value={shown.hour}
              onChange={(hour) => update({ ...shown, hour })}
              format={pad2}
              describe={t.time.hourName}
              pageStep={6}
              band={false}
            />
            <span
              aria-hidden="true"
              className="text-laque-deep relative pb-0.5 text-xl font-semibold"
            >
              :
            </span>
            <Wheel
              label={t.time.minutes}
              values={MINUTES}
              value={shown.minute}
              onChange={(minute) => update({ ...shown, minute })}
              format={pad2}
              describe={t.time.minuteName}
              pageStep={10}
              band={false}
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            {clearable && value && (
              <Button
                variant="quiet"
                onClick={() => {
                  onChange('');
                  close(true);
                }}
              >
                {t.time.clear}
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() => {
                if (!value) onChange(formatTime(shown));
                close(true);
              }}
            >
              {t.time.confirm}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
