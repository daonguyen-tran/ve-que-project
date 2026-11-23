import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { Money } from '@ve-que/domain';
import { demoToday } from '@/features/design-preview/demo-today';
import { TodayView } from './TodayView';

const normalize = (s: string | null) => s?.replace(/[\u202f\u00a0]/g, ' ');

function renderToday(model = demoToday) {
  return render(
    <MemoryRouter>
      <TodayView model={model} />
    </MemoryRouter>,
  );
}

describe('TodayView', () => {
  it('annonce le montant en poche en entier, avec sa devise', () => {
    renderToday();
    const amount = screen.getByLabelText((label) => normalize(label) === '1 240 000 ₫');
    expect(amount).toBeTruthy();
  });

  it('décrit la barre du jour pour les lecteurs d’écran', () => {
    renderToday();
    const bar = screen.getByRole('img', {
      name: (name) => name.includes('dépensés sur un budget'),
    });
    expect(normalize(bar.getAttribute('aria-label'))).toBe(
      '380 000 ₫ dépensés sur un budget de 600 000 ₫',
    );
  });

  it('signale le créneau en cours', () => {
    renderToday();
    const now = document.querySelector('[aria-current="time"]');
    expect(now?.textContent).toContain('Temps libre');
  });

  it('signale un dépassement de budget autrement que par la couleur', () => {
    renderToday({ ...demoToday, day: { ...demoToday.day, spent: Money.of(700_000, 'VND') } });
    const warning = screen.getByText((text) => text.startsWith('Budget du jour dépassé de'));
    expect(normalize(warning.textContent)).toBe('Budget du jour dépassé de 100 000 ₫');
  });
});
