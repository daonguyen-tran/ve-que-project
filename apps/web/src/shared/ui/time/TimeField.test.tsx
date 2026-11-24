import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DateField } from '@/shared/ui/calendar';
import { TimeField } from './TimeField';

function Harness({ initial = '' }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  const [date, setDate] = useState('');
  return (
    <>
      <TimeField label="Heure" clearable value={value} onChange={setValue} />
      <DateField label="Jour" value={date} onChange={setDate} />
      <p data-testid="value">{value}</p>
    </>
  );
}

const trigger = () => screen.getByLabelText('Heure');
const value = () => screen.getByTestId('value').textContent;
const wheel = (name: 'Heures' | 'Minutes') => screen.getByRole('spinbutton', { name });

afterEach(() => {
  vi.useRealTimers();
});

describe('TimeField', () => {
  it('ouvre les roues sur 09:00 sans rien enregistrer, puis « Valider » garde l’heure affichée', () => {
    render(<Harness />);
    expect(trigger().textContent).toContain('Choisir une heure');
    fireEvent.click(trigger());

    expect(wheel('Heures').getAttribute('aria-valuetext')).toBe('9 h');
    expect(wheel('Minutes').getAttribute('aria-valuetext')).toBe('0 minute');
    expect(value()).toBe('');

    fireEvent.click(screen.getByRole('button', { name: 'Valider' }));
    expect(value()).toBe('09:00');
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger());
  });

  it('enregistre à chaque changement de roue, au clavier', () => {
    render(<Harness initial="10:45" />);
    fireEvent.click(trigger());
    fireEvent.keyDown(wheel('Heures'), { key: 'ArrowDown' });
    expect(value()).toBe('11:45');
    fireEvent.keyDown(wheel('Minutes'), { key: 'PageDown' });
    expect(value()).toBe('11:55');
    fireEvent.keyDown(wheel('Minutes'), { key: 'End' });
    expect(value()).toBe('11:59');
    fireEvent.keyDown(wheel('Heures'), { key: 'Home' });
    expect(value()).toBe('00:59');
  });

  it('lit la valeur centrée quand la roue s’arrête de défiler', () => {
    vi.useFakeTimers();
    render(<Harness initial="10:45" />);
    fireEvent.click(trigger());
    const hours = wheel('Heures');

    // Défilement jusqu'à la 14e ligne (44 px par ligne), puis arrêt.
    hours.scrollTop = 14 * 44 + 10;
    fireEvent.scroll(hours);
    expect(value()).toBe('10:45');
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(value()).toBe('14:45');
  });

  it('peut s’effacer', () => {
    render(<Harness initial="10:45" />);
    fireEvent.click(trigger());
    fireEvent.click(screen.getByRole('button', { name: 'Effacer' }));
    expect(value()).toBe('');
    expect(trigger().textContent).toContain('Choisir une heure');
  });

  it('se referme avec Échap ou en ouvrant un autre champ', () => {
    render(<Harness />);
    fireEvent.click(trigger());
    fireEvent.keyDown(wheel('Heures'), { key: 'Escape' });
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    expect(value()).toBe('');

    fireEvent.click(trigger());
    const day = screen.getByLabelText('Jour');
    fireEvent.pointerDown(day);
    fireEvent.click(day);
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    expect(day.getAttribute('aria-expanded')).toBe('true');
  });
});
