import { describe, expect, it } from 'vitest';
import { CurrencyMismatchError, Money, roundHalfAwayFromZero } from './money';
import { convert } from './exchange';
import { formatCompact, formatMoney } from './format';

const NARROW_NBSP = /\u202f|\u00a0/g;
const normalizeSpaces = (s: string) => s.replace(NARROW_NBSP, ' ');

describe('Money', () => {
  it('stocke les euros en centimes et les đồng en unités', () => {
    expect(Money.fromMajor(45.5, 'EUR').amountMinor).toBe(4550);
    expect(Money.fromMajor(50_000, 'VND').amountMinor).toBe(50_000);
  });

  it('refuse un montant non entier en unités mineures', () => {
    expect(() => Money.of(12.5, 'EUR')).toThrow(RangeError);
  });

  it('corrige les erreurs de flottant classiques', () => {
    expect(Money.fromMajor(1.005, 'EUR').amountMinor).toBe(101);
    expect(Money.fromMajor(0.1 + 0.2, 'EUR').amountMinor).toBe(30);
  });

  it('arrondit le demi en s’éloignant de zéro, symétriquement', () => {
    expect(roundHalfAwayFromZero(2.5)).toBe(3);
    expect(roundHalfAwayFromZero(-2.5)).toBe(-3);
  });

  it('interdit d’additionner deux devises différentes', () => {
    expect(() => Money.add(Money.of(1, 'EUR'), Money.of(1, 'VND'))).toThrow(CurrencyMismatchError);
  });

  it('additionne une liste', () => {
    const total = Money.sum([Money.of(30_000, 'VND'), Money.of(45_000, 'VND')], 'VND');
    expect(total).toEqual(Money.of(75_000, 'VND'));
  });

  describe('allocateEvenly', () => {
    it('répartit sans perdre un seul đồng', () => {
      const parts = Money.allocateEvenly(Money.of(100_000, 'VND'), 3);
      expect(parts.map((p) => p.amountMinor)).toEqual([33_334, 33_333, 33_333]);
      expect(Money.sum(parts, 'VND').amountMinor).toBe(100_000);
    });

    it('gère les montants négatifs (remboursements)', () => {
      const parts = Money.allocateEvenly(Money.of(-10, 'EUR'), 3);
      expect(parts.map((p) => p.amountMinor)).toEqual([-4, -3, -3]);
    });

    it('refuse zéro part', () => {
      expect(() => Money.allocateEvenly(Money.of(10, 'EUR'), 0)).toThrow(RangeError);
    });
  });
});

describe('convert', () => {
  const rate = {
    base: 'EUR',
    quote: 'VND',
    rate: 27_000,
    source: 'manual',
    observedAt: '2027-07-01T00:00:00.000Z',
  } as const;

  it('convertit dans le sens du taux', () => {
    expect(convert(Money.fromMajor(10, 'EUR'), 'VND', rate)).toEqual(Money.of(270_000, 'VND'));
  });

  it('convertit dans le sens inverse', () => {
    expect(convert(Money.of(50_000, 'VND'), 'EUR', rate)).toEqual(Money.of(185, 'EUR'));
  });

  it('ne touche pas un montant déjà dans la bonne devise', () => {
    const m = Money.of(500, 'EUR');
    expect(convert(m, 'EUR', rate)).toBe(m);
  });
});

describe('formatMoney', () => {
  it('formate à la française', () => {
    expect(normalizeSpaces(formatMoney(Money.of(1_200_000, 'VND')))).toBe('1 200 000 ₫');
    expect(normalizeSpaces(formatMoney(Money.of(4550, 'EUR')))).toBe('45,50 €');
  });

  it('produit la forme courte des étiquettes de prix', () => {
    expect(formatCompact(Money.of(155_000, 'VND'))).toBe('155k');
    expect(formatCompact(Money.of(1_200_000, 'VND'))).toBe('1,2M');
    expect(formatCompact(Money.of(25_500, 'VND'))).toBe('25,5k');
    expect(formatCompact(Money.of(800, 'VND'))).toBe('800');
  });

  it('peut omettre le symbole', () => {
    expect(normalizeSpaces(formatMoney(Money.of(50_000, 'VND'), { withSymbol: false }))).toBe(
      '50 000',
    );
  });
});
