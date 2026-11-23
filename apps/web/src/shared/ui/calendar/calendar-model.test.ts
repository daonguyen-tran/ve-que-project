import { describe, expect, it } from 'vitest';
import { toLocalDate as d } from '@ve-que/domain';
import {
  addMonths,
  dayRole,
  isPickable,
  monthGrid,
  monthsBetween,
  moveByKey,
  nextRange,
  weekdayIndex,
  type RangeRules,
} from './calendar-model';

describe('grille', () => {
  it('commence la semaine le lundi', () => {
    // Le 1er juillet 2027 est un jeudi.
    expect(weekdayIndex(d('2027-07-01'))).toBe(3);
    expect(weekdayIndex(d('2027-07-04'))).toBe(6);
  });

  it('remplit les cases hors du mois avec null', () => {
    const weeks = monthGrid({ year: 2027, month: 7 });
    expect(weeks[0]).toEqual([
      null,
      null,
      null,
      '2027-07-01',
      '2027-07-02',
      '2027-07-03',
      '2027-07-04',
    ]);
    expect(weeks.at(-1)).toEqual([
      '2027-07-26',
      '2027-07-27',
      '2027-07-28',
      '2027-07-29',
      '2027-07-30',
      '2027-07-31',
      null,
    ]);
    expect(weeks.every((week) => week.length === 7)).toBe(true);
  });

  it('change d’année en passant décembre', () => {
    expect(addMonths({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 });
    expect(addMonths({ year: 2027, month: 1 }, -1)).toEqual({ year: 2026, month: 12 });
    expect(monthsBetween(d('2027-06-28'), d('2027-07-19'))).toEqual([
      { year: 2027, month: 6 },
      { year: 2027, month: 7 },
    ]);
  });
});

describe('plage', () => {
  // Règles d'exemple : les nuits du 10 au 13 sont prises par une autre étape.
  const rules: RangeRules = {
    canStart: (date) => date < '2027-07-10' || date >= '2027-07-14',
    canEnd: (start, date) => date > start && (start >= '2027-07-14' || date <= '2027-07-10'),
  };

  it('fixe le début puis la fin', () => {
    const first = nextRange({ start: null, end: null }, d('2027-07-04'), rules);
    expect(first).toEqual({ start: '2027-07-04', end: null });
    expect(nextRange(first, d('2027-07-08'), rules)).toEqual({
      start: '2027-07-04',
      end: '2027-07-08',
    });
  });

  it('recommence si on touche avant le début ou après une plage complète', () => {
    expect(nextRange({ start: d('2027-07-04'), end: null }, d('2027-07-02'), rules)).toEqual({
      start: '2027-07-02',
      end: null,
    });
    expect(
      nextRange({ start: d('2027-07-04'), end: d('2027-07-08') }, d('2027-07-15'), rules),
    ).toEqual({ start: '2027-07-15', end: null });
  });

  it('ignore un jour impossible', () => {
    const current = { start: d('2027-07-04'), end: null };
    expect(nextRange(current, d('2027-07-12'), rules)).toBe(current);
    expect(isPickable(current, d('2027-07-12'), rules)).toBe(false);
    // Le 10 est pris comme nuit, mais reste un départ possible (jour de transition).
    expect(isPickable(current, d('2027-07-10'), rules)).toBe(true);
  });

  it('donne la place de chaque jour', () => {
    const selection = { start: d('2027-07-04'), end: d('2027-07-08') };
    expect(dayRole(selection, d('2027-07-04'))).toBe('start');
    expect(dayRole(selection, d('2027-07-06'))).toBe('inside');
    expect(dayRole(selection, d('2027-07-08'))).toBe('end');
    expect(dayRole(selection, d('2027-07-09'))).toBeNull();
    expect(dayRole({ start: d('2027-07-04'), end: null }, d('2027-07-04'))).toBe('single');
  });
});

describe('clavier', () => {
  it('se déplace par jour, semaine et mois', () => {
    expect(moveByKey(d('2027-07-01'), 'ArrowLeft')).toBe('2027-06-30');
    expect(moveByKey(d('2027-07-01'), 'ArrowDown')).toBe('2027-07-08');
    expect(moveByKey(d('2027-07-01'), 'Home')).toBe('2027-06-28');
    expect(moveByKey(d('2027-07-01'), 'End')).toBe('2027-07-04');
    // 31 janvier + 1 mois : on s'arrête au dernier jour de février.
    expect(moveByKey(d('2027-01-31'), 'PageDown')).toBe('2027-02-28');
    expect(moveByKey(d('2027-07-01'), 'Tab')).toBeNull();
  });
});
