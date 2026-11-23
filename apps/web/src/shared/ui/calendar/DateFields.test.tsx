import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { toLocalDate as d, type LocalDate } from '@ve-que/domain';
import { DateField } from './DateFields';

function Harness() {
  const [value, setValue] = useState<LocalDate | ''>('');
  return (
    <DateField
      label="Départ le"
      value={value}
      onChange={setValue}
      min={d('2027-07-01')}
      max={d('2027-07-21')}
      isPickable={(date) => date !== '2027-07-03'}
    />
  );
}

describe('DateField', () => {
  it('s’ouvre, choisit un jour, se referme et rend le focus au champ', () => {
    render(<Harness />);
    const trigger = screen.getByLabelText('Départ le');
    expect(trigger.textContent).toContain('Choisir une date');

    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'lundi 5 juillet 2027' }));

    expect(trigger.textContent).toContain('lun. 5 juil. 2027');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger);
  });

  it('ignore un jour indisponible', () => {
    render(<Harness />);
    fireEvent.click(screen.getByLabelText('Départ le'));
    fireEvent.click(screen.getByRole('button', { name: 'samedi 3 juillet 2027, indisponible' }));
    expect(screen.getByLabelText('Départ le').textContent).toContain('Choisir une date');
  });

  it('se parcourt au clavier, sans sortir des bornes', () => {
    render(<Harness />);
    fireEvent.click(screen.getByLabelText('Départ le'));
    // Seul le jour « actif » est atteignable avec Tab : ici le premier jour du voyage.
    const first = screen.getByRole('button', { name: 'jeudi 1 juillet 2027' });
    expect(first.tabIndex).toBe(0);

    fireEvent.keyDown(first, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'jeudi 8 juillet 2027' }),
    );
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowUp' });
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowLeft' });
    // Le 30 juin est hors du voyage : le focus reste sur le 1er juillet.
    expect(document.activeElement).toBe(first);
  });
});
