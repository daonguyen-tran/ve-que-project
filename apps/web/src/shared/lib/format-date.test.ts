import { describe, expect, it } from 'vitest';
import { formatDuration, formatTime } from './format-date';

describe('formatTime et formatDuration', () => {
  it('écrit les heures à la française', () => {
    expect(formatTime('14:30')).toBe('14 h 30');
    expect(formatTime('09:00')).toBe('9 h');
  });
  it('écrit les durées', () => {
    expect(formatDuration(30)).toBe('30 min');
    expect(formatDuration(120)).toBe('2 h');
    expect(formatDuration(90)).toBe('1 h 30');
  });
});
