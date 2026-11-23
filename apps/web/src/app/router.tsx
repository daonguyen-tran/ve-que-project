import { createBrowserRouter } from 'react-router';
import { DesignPreviewPage } from '@/features/design-preview/DesignPreviewPage';
import { ExpensesPage } from '@/features/expenses/ExpensesPage';
import { QuickExpensePage } from '@/features/expenses/QuickExpensePage';
import { IdeasPage } from '@/features/ideas/IdeasPage';
import { MorePage } from '@/features/more/MorePage';
import { PlanningPage } from '@/features/planning/PlanningPage';
import { TodayPage } from '@/features/today/TodayPage';
import { NewTripPage } from '@/features/trips/pages/NewTripPage';
import { TripDetailPage } from '@/features/trips/pages/TripDetailPage';
import { TripsPage } from '@/features/trips/pages/TripsPage';
import { AppShell } from './layout/AppShell';
import { NotFoundPage } from './NotFoundPage';

/** Les URL sont en français : ce sont celles que l'utilisateur voit et partage. */
export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { index: true, element: <TodayPage /> },
      { path: 'planning', element: <PlanningPage /> },
      { path: 'idees', element: <IdeasPage /> },
      { path: 'depenses', element: <ExpensesPage /> },
      { path: 'depenses/nouvelle', element: <QuickExpensePage /> },
      { path: 'plus', element: <MorePage /> },
      { path: 'voyages', element: <TripsPage /> },
      { path: 'voyages/nouveau', element: <NewTripPage /> },
      { path: 'voyages/:tripId', element: <TripDetailPage /> },
      { path: 'apercu', element: <DesignPreviewPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
