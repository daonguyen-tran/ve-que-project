import { useEffect, useLayoutEffect, useRef, type KeyboardEvent } from 'react';
import { cn } from '@/shared/lib/cn';
import { useMediaQuery } from '@/shared/lib/use-media-query';
import { indexAtScroll, stepThrough } from './time-model';

/** Hauteur d'une ligne : 44 px, la taille minimale d'une cible tactile (NF-3). */
export const WHEEL_ROW = 44;
const ROW = WHEEL_ROW;
/** Lignes visibles : la valeur centrale et deux de chaque côté. */
const VISIBLE = 5;
/** Marge haute et basse : de quoi centrer la première et la dernière valeur. */
export const WHEEL_PAD = ROW * Math.floor(VISIBLE / 2);
const PAD = WHEEL_PAD;
/** Délai sans défilement au-delà duquel on considère que la roue s'est arrêtée. */
const SETTLE_MS = 120;

/**
 * Roue de sélection, comme les sélecteurs d'heure des téléphones : une colonne qui défile et
 * s'arrête toujours pile sur une valeur, celle qui passe dans la bande centrale.
 *
 * Mécanique :
 * - le défilement est natif (doigt, molette, élan) et l'arrêt sur une ligne vient du CSS
 *   `scroll-snap` : pas de calcul d'inertie maison ;
 * - quand le défilement s'arrête (aucun événement pendant `SETTLE_MS` ; l'événement
 *   `scrollend` n'existe pas partout), on lit la ligne centrée et on la signale ;
 * - quand la valeur change d'ailleurs (clavier, toucher une ligne, ouverture), la roue tourne
 *   jusqu'à elle. Si la roue y est déjà (le changement vient de son propre défilement), elle
 *   ne bouge pas : les deux sens ne se contrarient jamais.
 *
 * Accessibilité : la colonne est un `spinbutton` (motif ARIA des sélecteurs à roue). Flèches
 * haut et bas pour une valeur, Page précédente et suivante pour un saut, Début et Fin pour
 * les bouts. Les lignes elles-mêmes sont masquées aux lecteurs d'écran, qui lisent la valeur
 * courante (`aria-valuetext`).
 */
export function Wheel({
  label,
  values,
  value,
  onChange,
  format,
  describe,
  pageStep = 5,
  band = true,
}: {
  label: string;
  values: readonly number[];
  value: number;
  onChange: (value: number) => void;
  /** Texte affiché d'une ligne (« 09 »). */
  format: (value: number) => string;
  /** Valeur lue par les lecteurs d'écran (« 9 heures »). */
  describe: (value: number) => string;
  pageStep?: number;
  /**
   * Bande de sélection derrière la valeur centrale. Plusieurs roues côte à côte la
   * désactivent pour en dessiner une seule, continue (voir `TimeField`).
   */
  band?: boolean;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<number | undefined>(undefined);
  const positioned = useRef(false);
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const index = Math.max(values.indexOf(value), 0);

  // Amène la roue sur la valeur : d'un coup à l'ouverture, en douceur ensuite.
  useLayoutEffect(() => {
    const element = scroller.current;
    if (!element) return;
    const top = index * ROW;
    if (Math.abs(element.scrollTop - top) < 1) return;
    const instant = !positioned.current || reducedMotion;
    positioned.current = true;
    // jsdom (tests) ne connaît pas `scrollTo` sur les éléments.
    if (typeof element.scrollTo === 'function') {
      element.scrollTo({ top, behavior: instant ? 'instant' : 'smooth' });
    } else {
      element.scrollTop = top;
    }
  }, [index, reducedMotion]);

  useEffect(() => () => window.clearTimeout(settleTimer.current), []);

  const onScroll = () => {
    window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => {
      const element = scroller.current;
      if (!element) return;
      const settled = values[indexAtScroll(element.scrollTop, ROW, values.length)];
      if (settled !== undefined && settled !== value) onChange(settled);
    }, SETTLE_MS);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const deltas: Record<string, number> = {
      ArrowUp: -1,
      ArrowDown: 1,
      PageUp: -pageStep,
      PageDown: pageStep,
      Home: -values.length,
      End: values.length,
    };
    const delta = deltas[event.key];
    if (delta === undefined) return;
    event.preventDefault();
    onChange(stepThrough(values, value, delta));
  };

  return (
    <div className="relative flex-1">
      {band && <SelectionBand />}
      <div
        ref={scroller}
        role="spinbutton"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={values[0]}
        aria-valuemax={values.at(-1)}
        aria-valuenow={value}
        aria-valuetext={describe(value)}
        onScroll={onScroll}
        onKeyDown={onKeyDown}
        className={cn(
          'no-scrollbar relative snap-y snap-mandatory overflow-y-auto overscroll-contain rounded-xl',
          'focus-visible:outline-laque focus-visible:outline-2 focus-visible:outline-offset-2',
          // Fondu en haut et en bas : on devine les valeurs suivantes sans s'y arrêter.
          '[mask-image:linear-gradient(to_bottom,transparent,black_35%,black_65%,transparent)]',
        )}
        style={{ height: ROW * VISIBLE, paddingBlock: PAD }}
      >
        <div aria-hidden="true">
          {values.map((item) => (
            <div
              key={item}
              onClick={() => onChange(item)}
              className={cn(
                'tabular flex snap-center items-center justify-center text-xl transition-colors duration-150 select-none',
                item === value ? 'text-laque-deep font-semibold' : 'text-ink-soft cursor-pointer',
              )}
              style={{ height: ROW }}
            >
              {format(item)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Bande de sélection, derrière les colonnes : la valeur centrale s'y arrête. */
export function SelectionBand() {
  return (
    <div
      aria-hidden="true"
      className="bg-laque-tint pointer-events-none absolute inset-x-0 rounded-xl"
      style={{ top: WHEEL_PAD, height: WHEEL_ROW }}
    />
  );
}
