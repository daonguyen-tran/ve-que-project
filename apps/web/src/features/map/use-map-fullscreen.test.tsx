import { act, fireEvent, render, screen } from '@testing-library/react';
import { useRef } from 'react';
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';
import { useMapFullscreen } from './use-map-fullscreen';

function Probe() {
  const frame = useRef<HTMLDivElement>(null);
  const { expanded, enter, exit } = useMapFullscreen(frame);
  const location = useLocation();
  return (
    <div ref={frame}>
      <output>{`${location.pathname}${location.search}|${expanded ? 'plein' : 'normal'}`}</output>
      <button type="button" onClick={enter}>
        Entrer
      </button>
      <button type="button" onClick={exit}>
        Sortir
      </button>
    </div>
  );
}

function setup(entry: string) {
  const router = createMemoryRouter([{ path: '/planning', element: <Probe /> }], {
    initialEntries: [entry],
  });
  render(<RouterProvider router={router} />);
  return router;
}

describe('useMapFullscreen', () => {
  it('ajoute le plein écran à l’historique : le retour le referme', async () => {
    const router = setup('/planning?vue=carte&ville=hoi+an');
    fireEvent.click(screen.getByRole('button', { name: 'Entrer' }));
    expect(screen.getByRole('status').textContent).toBe(
      '/planning?vue=carte&ville=hoi+an&plein=1|plein',
    );
    expect(document.body.style.overflow).toBe('hidden');

    await act(() => router.navigate(-1));
    expect(screen.getByRole('status').textContent).toBe('/planning?vue=carte&ville=hoi+an|normal');
    expect(document.body.style.overflow).toBe('');
  });

  it('se ferme avec le bouton ou Échap, même ouvert par un lien direct', () => {
    setup('/planning?vue=carte&plein=1');
    expect(screen.getByRole('status').textContent).toContain('|plein');
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.getByRole('status').textContent).toBe('/planning?vue=carte|normal');

    fireEvent.click(screen.getByRole('button', { name: 'Entrer' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sortir' }));
    expect(screen.getByRole('status').textContent).toBe('/planning?vue=carte|normal');
  });
});
