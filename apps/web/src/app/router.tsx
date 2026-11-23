import { createBrowserRouter } from 'react-router';
import { DesignPreviewPage } from '@/features/design-preview/DesignPreviewPage';
import { ExpensesPage } from '@/features/expenses/ExpensesPage';
import { QuickExpensePage } from '@/features/expenses/QuickExpensePage';
import { IdeasPage } from '@/features/ideas/IdeasPage';
import { MorePage } from '@/features/more/MorePage';
import { PlanningPage } from '@/features/planning/PlanningPage';
import { TodayPage } from '@/features/today/TodayPage';
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
      { path: 'apercu', element: <DesignPreviewPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
