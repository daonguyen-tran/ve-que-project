import { describe, expect, it } from 'vitest';
import { toLocalDate as d } from '@ve-que/domain';
import { containerId, findContainer, moveAcross, moveWithin, type Columns } from './plan-board';

const day = d('2027-07-04');
const morning = containerId(day, 'morning');
const afternoon = containerId(day, 'afternoon');
const evening = containerId(day, 'evening');
const columns: Columns = { [morning]: ['a', 'b'], [afternoon]: ['c'], [evening]: [] };

describe('plan-board', () => {
  it('retrouve le créneau d’un élément ou d’un créneau', () => {
    expect(findContainer(columns, 'b')).toBe(morning);
    expect(findContainer(columns, evening)).toBe(evening);
    expect(findContainer(columns, 'inconnu')).toBeUndefined();
  });

  it('passe dans un autre créneau, au rang de l’élément survolé', () => {
    expect(moveAcross(columns, 'a', 'c', false)[afternoon]).toEqual(['a', 'c']);
    expect(moveAcross(columns, 'a', 'c', true)[afternoon]).toEqual(['c', 'a']);
    expect(moveAcross(columns, 'a', evening, false)).toMatchObject({
      [morning]: ['b'],
      [evening]: ['a'],
    });
  });

  it('réordonne dans le même créneau', () => {
    expect(moveWithin(columns, 'a', 'b')[morning]).toEqual(['b', 'a']);
    expect(moveWithin(columns, 'a', 'c')).toBe(columns);
  });
});
