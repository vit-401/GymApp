import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/components/Layout/AppLayout';
import { WorkoutPage } from '@/pages/WorkoutPage';
import { CalendarPage } from '@/pages/CalendarPage';
import { MetricsPage } from '@/pages/MetricsPage';
import { ExercisesPage } from '@/pages/ExercisesPage';
import { ProgramPage } from '@/pages/ProgramPage';
import { SettingsPage } from '@/pages/SettingsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <WorkoutPage /> },
      { path: 'calendar', element: <CalendarPage /> },
      { path: 'metrics', element: <MetricsPage /> },
      { path: 'exercises', element: <ExercisesPage /> },
      { path: 'program', element: <ProgramPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
]);
