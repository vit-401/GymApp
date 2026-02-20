/**
 * @file Client-side routing configuration.
 *
 * All routes are nested under AppLayout which provides:
 * - Scrollable content area (via <Outlet />)
 * - Persistent rest timer bar
 * - Bottom navigation
 *
 * Route structure:
 *   /           → WorkoutPage (default, main workout logging screen)
 *   /calendar   → CalendarPage (monthly view of completed workouts)
 *   /metrics    → MetricsPage (body weight & belly size tracking)
 *   /exercises  → ExercisesPage (exercise library CRUD)
 *   /program    → ProgramPage (7-day split configuration)
 *   /settings   → SettingsPage (timer config, data export, danger zone)
 */

import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/components/Layout/AppLayout';
import { WorkoutPage } from '@/pages/WorkoutPage';
import { CalendarPage } from '@/pages/CalendarPage';
import { MetricsPage } from '@/pages/MetricsPage';
import { ExercisesPage } from '@/pages/ExercisesPage';
import { ProgramPage } from '@/pages/ProgramPage';
import { SettingsPage } from '@/pages/SettingsPage';

export const router = createBrowserRouter(
  [
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
  ],
  { basename: '/GymApp' }
);
