import { fireEvent, render, screen } from '@testing-library/react';
import { Link, Outlet, createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';
import { isPlanningPath, usePlanningEditMode } from './edit-mode-context';
import { EditModeToggle } from './EditModeToggle';
import { PlanningEditModeProvider } from './PlanningEditModeProvider';

/** Affiche le mode courant et des liens pour naviguer entre écrans. */
function Probe() {
  const { editing } = usePlanningEditMode();
  return (
    <>
      <p>{editing ? 'édition' : 'lecture'}</p>
      <EditModeToggle />
      <Link to="/planning">planning</Link>
      <Link to="/planning/jours/2027-07-09">jour</Link>
      <Link to="/depenses">dépenses</Link>
    </>
  );
}

function renderAt(path: string) {
  const router = createMemoryRouter(
    [
      {
        element: (
          <PlanningEditModeProvider>
            <Outlet />
          </PlanningEditModeProvider>
        ),
        children: [{ path: '*', element: <Probe /> }],
      },
    ],
    { initialEntries: [path] },
  );
  render(<RouterProvider router={router} />);
}

describe('PlanningEditModeProvider', () => {
  it('démarre en lecture et garde l’édition entre les écrans du planning', async () => {
    renderAt('/planning');
    expect(await screen.findByText('lecture')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Modifier' }));
    expect(screen.getByText('édition')).toBeTruthy();

    fireEvent.click(screen.getByRole('link', { name: 'jour' }));
    expect(await screen.findByText('édition')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Terminé' })).toBeTruthy();
  });

  it('revient en lecture dès qu’on quitte le planning', async () => {
    renderAt('/planning');
    fireEvent.click(await screen.findByRole('button', { name: 'Modifier' }));

    fireEvent.click(screen.getByRole('link', { name: 'dépenses' }));
    expect(await screen.findByText('lecture')).toBeTruthy();

    fireEvent.click(screen.getByRole('link', { name: 'planning' }));
    expect(await screen.findByText('lecture')).toBeTruthy();
  });
});

describe('isPlanningPath', () => {
  it('reconnaît les écrans du planning et eux seuls', () => {
    expect(isPlanningPath('/planning')).toBe(true);
    expect(isPlanningPath('/planning/jours/2027-07-09')).toBe(true);
    expect(isPlanningPath('/planning/etapes/abc')).toBe(true);
    expect(isPlanningPath('/planningue')).toBe(false);
    expect(isPlanningPath('/depenses')).toBe(false);
  });
});
