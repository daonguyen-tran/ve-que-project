import { describe, expect, it } from 'vitest';
import { searchZoom } from './search-zoom';

describe('searchZoom', () => {
  it('montre une localité en entier et une adresse de près', () => {
    expect(searchZoom({ kind: 'island' })).toBeLessThan(searchZoom({ kind: 'city' }));
    expect(searchZoom({ kind: 'city' })).toBeLessThan(searchZoom({ kind: 'village' }));
    expect(searchZoom({ kind: 'village' })).toBeLessThan(searchZoom({}));
    expect(searchZoom({})).toBe(17);
  });
});
