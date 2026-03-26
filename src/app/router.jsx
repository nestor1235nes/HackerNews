import { Navigate, createBrowserRouter } from 'react-router-dom'
import App from '../App'
import NotFoundPage from '../pages/NotFoundPage'
import StoryCommentsPage from '../pages/StoryCommentsPage'
import TopPage from '../pages/TopPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <Navigate to="/top" replace />,
      },
      {
        path: 'top',
        element: <TopPage />,
      },
      {
        path: 'story/:id',
        element: <StoryCommentsPage />,
      },
      {
        path: '404',
        element: <NotFoundPage />,
      },
      {
        path: '*',
        element: <Navigate to="/404" replace />,
      },
    ],
  },
])
