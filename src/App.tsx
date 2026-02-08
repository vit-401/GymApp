/**
 * @file Application root component.
 *
 * Renders the React Router provider which handles all routing.
 * The actual page layout (nav, timer, content area) is defined in AppLayout.
 */

import { RouterProvider } from 'react-router-dom';
import { router } from './router';

export default function App() {
  return <RouterProvider router={router} />;
}
