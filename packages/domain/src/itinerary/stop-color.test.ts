import { describe, expect, it } from 'vitest';
import { toLocalDate as d } from '../shared/local-date';
import { STOP_COLORS } from './itinerary';
import { stopColorOf, suggestStopColor } from './stop-color';

const stop = (
  kind: 'city' | 'village' | 'island',
  arrival: string,
  color?: (typeof STOP_COLORS)[number],
) => ({
  kind,
  color,
  arrivalDate: d(arrival),
});

describe('stopColorOf', () => {
  it('garde la couleur choisie, sinon prend celle du type', () => {
    expect(stopColorOf(stop('city', '2027-07-01', 'lotus'))).toBe('lotus');
    expect(stopColorOf(stop('village', '2027-07-01'))).toBe('jade');
    expect(stopColorOf(stop('island', '2027-07-01'))).toBe('sarcelle');
  });
});

describe('suggestStopColor', () => {
  it('propose la première couleur libre', () => {
    expect(suggestStopColor([])).toBe('indigo');
    // La ville sans couleur occupe déjà l'indigo (couleur de son type).
    expect(suggestStopColor([stop('city', '2027-07-01'), stop('city', '2027-07-04', 'jade')])).toBe(
      'sarcelle',
    );
  });

  it('reprend la palette sans répéter la couleur de la dernière étape', () => {
    const all = STOP_COLORS.map((color, index) =>
      stop('city', `2027-07-${String(index + 1).padStart(2, '0')}`, color),
    );
    // 8 étapes : on reviendrait à l'indigo, qui n'est pas la couleur de la dernière (ardoise).
    expect(suggestStopColor(all)).toBe('indigo');
    const lastIsIndigo = [...all.slice(1), stop('city', '2027-07-20', 'indigo')];
    expect(suggestStopColor(lastIsIndigo)).toBe('jade');
  });
});
