import { describe, expect, it } from 'vitest';
import { parseAmount } from './parse-amount';

const vnd = (input: string) => parseAmount(input, 'VND');
const eur = (input: string) => parseAmount(input, 'EUR');
const minor = (r: ReturnType<typeof parseAmount>) => (r.ok ? r.value.amountMinor : r.error);

describe('parseAmount — saisie « à la vietnamienne »', () => {
  it.each([
    ['50k', 50_000],
    ['50K', 50_000],
    ['1,2M', 1_200_000],
    ['1.2m', 1_200_000],
    ['1,5k', 1_500],
    ['350000', 350_000],
    ['350 000', 350_000],
    ['350.000', 350_000],
    ['1.200.000', 1_200_000],
    ['1\u202f200\u202f000', 1_200_000],
  ])('VND : %s → %i', (input, expected) => {
    expect(minor(vnd(input))).toBe(expected);
  });

  it.each([
    ['12,50', 1_250],
    ['12.5', 1_250],
    ['12', 1_200],
    ['1 250', 125_000],
    ['0,99', 99],
  ])('EUR : %s → %i centimes', (input, expected) => {
    expect(minor(eur(input))).toBe(expected);
  });

  it.each([
    ['', 'empty'],
    ['   ', 'empty'],
    ['abc', 'invalid'],
    ['k50', 'invalid'],
    ['1,2,3', 'invalid'],
    ['12.5000', 'invalid'],
    ['1.200.000k', 'invalid'],
    ['-50k', 'invalid'],
  ])('refuse « %s » (%s)', (input, error) => {
    expect(minor(vnd(input))).toBe(error);
  });

  it('refuse les fractions de đồng', () => {
    expect(minor(vnd('12,5'))).toBe('too_precise');
    expect(minor(vnd('1,2345k'))).toBe('too_precise');
  });

  it('refuse les montants absurdes', () => {
    expect(minor(vnd('99999999999999999999'))).toBe('too_large');
  });
});
