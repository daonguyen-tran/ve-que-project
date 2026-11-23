import { createBrowserRouter } from 'react-router';
import { DataPage } from '@/features/data/pages/DataPage';
import { DesignPreviewPage } from '@/features/design-preview/DesignPreviewPage';
import { ExpensesPage } from '@/features/expenses/ExpensesPage';
import { QuickExpensePage } from '@/features/expenses/QuickExpensePage';
import { IdeasPage } from '@/features/ideas/pages/IdeasPage';
import { StopDetailPage } from '@/features/itinerary/pages/StopDetailPage';
import { MorePage } from '@/features/more/MorePage';
import { DayPage } from '@/features/planning/pages/DayPage';
import { PlanningPage } from '@/features/planning/pages/PlanningPage';
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
      { path: 'planning/etapes/:stopId', element: <StopDetailPage /> },
      { path: 'planning/jours/:date', element: <DayPage /> },
      { path: 'idees', element: <IdeasPage /> },
      { path: 'depenses', element: <ExpensesPage /> },
      { path: 'depenses/nouvelle', element: <QuickExpensePage /> },
      { path: 'plus', element: <MorePage /> },
      { path: 'plus/donnees', element: <DataPage /> },
      { path: 'voyages', element: <TripsPage /> },
      { path: 'voyages/nouveau', element: <NewTripPage /> },
      { path: 'voyages/:tripId', element: <TripDetailPage /> },
      { path: 'apercu', element: <DesignPreviewPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
