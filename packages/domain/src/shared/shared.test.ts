import { describe, expect, it } from 'vitest';
import { createEntity, markDeleted, updateEntity, type BaseEntity } from './entity';
import { addDays, daysBetween, localDateOf, toLocalDate } from './local-date';

interface Note extends BaseEntity {
  text: string;
}

describe('entités', () => {
  const t0 = new Date('2027-07-01T10:00:00.000Z');
  const t1 = new Date('2027-07-01T11:00:00.000Z');

  it('crée une entité avec un UUID v7 et des horodatages', () => {
    const note = createEntity<Note>({ text: 'phở' }, t0);
    expect(note.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-/);
    expect(note.createdAt).toBe(t0.toISOString());
    expect(note.deletedAt).toBeNull();
  });

  it('met à jour sans muter', () => {
    const note = createEntity<Note>({ text: 'phở' }, t0);
    const updated = updateEntity(note, { text: 'bún chả' }, t1);
    expect(note.text).toBe('phở');
    expect(updated).toMatchObject({
      text: 'bún chả',
      updatedAt: t1.toISOString(),
      createdAt: t0.toISOString(),
    });
  });

  it('supprime logiquement', () => {
    const deleted = markDeleted(createEntity<Note>({ text: 'x' }, t0), t1);
    expect(deleted.deletedAt).toBe(t1.toISOString());
  });
});

describe('dates locales', () => {
  it('donne le jour sur place, pas celui de Paris', () => {
    // 20 h 30 à Paris le 14 juillet = 1 h 30 le 15 juillet au Vietnam.
    const instant = new Date('2027-07-14T18:30:00.000Z');
    expect(localDateOf(instant, 'Europe/Paris')).toBe('2027-07-14');
    expect(localDateOf(instant, 'Asia/Ho_Chi_Minh')).toBe('2027-07-15');
  });

  it('ajoute des jours sans être piégé par le changement d’heure', () => {
    expect(addDays(toLocalDate('2027-03-27'), 2)).toBe('2027-03-29');
    expect(daysBetween(toLocalDate('2027-07-01'), toLocalDate('2027-07-21'))).toBe(20);
  });

  it('refuse une date invalide', () => {
    expect(() => toLocalDate('2027-02-30')).toThrow(RangeError);
  });
});
