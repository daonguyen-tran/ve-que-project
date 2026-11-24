import { describe, expect, it } from 'vitest';
import { HOURS, indexAtScroll, MINUTES, parseTime, stepThrough } from './time-model';

describe('time-model', () => {
  it('lit une heure valide et refuse le reste', () => {
    expect(parseTime('09:30')).toEqual({ hour: 9, minute: 30 });
    expect(parseTime('23:59')).toEqual({ hour: 23, minute: 59 });
    expect(parseTime('24:00')).toBeNull();
    expect(parseTime('9:30')).toBeNull();
    expect(parseTime('')).toBeNull();
  });

  it('propose toutes les heures et toutes les minutes', () => {
    expect(HOURS).toHaveLength(24);
    expect(MINUTES).toHaveLength(60);
  });

  it('trouve la ligne centrée, même entre deux lignes ou hors limites', () => {
    expect(indexAtScroll(0, 44, 24)).toBe(0);
    expect(indexAtScroll(44 * 14, 44, 24)).toBe(14);
    // À mi-chemin d'une ligne, on arrondit à la plus proche.
    expect(indexAtScroll(44 * 14 + 30, 44, 24)).toBe(15);
    // Rebond élastique au-delà des bouts (iOS) : on reste dans la liste.
    expect(indexAtScroll(-60, 44, 24)).toBe(0);
    expect(indexAtScroll(44 * 40, 44, 24)).toBe(23);
  });

  it('avance et recule sans dépasser les bouts', () => {
    expect(stepThrough(HOURS, 9, 1)).toBe(10);
    expect(stepThrough(HOURS, 0, -1)).toBe(0);
    expect(stepThrough(MINUTES, 55, 10)).toBe(59);
  });
});
