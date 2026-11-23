import { describe, expect, it } from 'vitest';
import { Money } from '@ve-que/domain';
import { moneyFromField, moneyToField, optionalMoneyFieldSchema } from './money-field';

describe('champ de montant', () => {
  it('accepte un champ vide (montant facultatif)', () => {
    expect(optionalMoneyFieldSchema.safeParse({ text: '  ', currency: 'VND' }).success).toBe(true);
    expect(moneyFromField({ text: '', currency: 'VND' })).toBeNull();
  });

  it('convertit la saisie « 1,2M » en đồng', () => {
    expect(moneyFromField({ text: '1,2M', currency: 'VND' })).toEqual(Money.of(1_200_000, 'VND'));
  });

  it('explique pourquoi une saisie est refusée', () => {
    const result = optionalMoneyFieldSchema.safeParse({ text: '12,5', currency: 'VND' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      'Le đồng n’a pas de centimes : arrondis le montant',
    );
  });

  it('réaffiche un montant enregistré pour le modifier', () => {
    expect(moneyToField(Money.of(4550, 'EUR'), 'VND')).toEqual({ text: '45,5', currency: 'EUR' });
    expect(moneyToField(null, 'VND')).toEqual({ text: '', currency: 'VND' });
  });
});
