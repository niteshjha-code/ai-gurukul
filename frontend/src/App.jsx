import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppLayout from './components/AppLayout';
import { PageLoader } from './components/ui';
import Landing from './pages/Landing';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const StoryStudio = lazy(() => import('./pages/StoryStudio'));
const StoryView = lazy(() => import('./pages/StoryView'));
const Library = lazy(() => import('./pages/Library'));
const Quiz = lazy(() => import('./pages/Quiz'));
const Homework = lazy(() => import('./pages/Homework'));
const Progress = lazy(() => import('./pages/Progress'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Profiles = lazy(() => import('./pages/Profiles'));
const Parent = lazy(() => import('./pages/Parent'));

function RequireAuth({ children }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return children;
}

function GuestOnly({ children }) {
  const { user, parentToken, ready } = useAuth();
  if (!ready) return <PageLoader />;
  if (user) return <Navigate to="/dashboard" replace />;
  if (parentToken) return <Navigate to="/profiles" replace />;
  return children;
}

// Logged in as a child or as the parent.
function RequireSession({ children }) {
  const { user, parentToken, ready } = useAuth();
  if (!ready) return <PageLoader />;
  return user || parentToken ? children : <Navigate to="/login" replace />;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
          <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
          <Route path="/profiles" element={<RequireSession><Profiles /></RequireSession>} />
          <Route path="/parent" element={<RequireSession><Parent /></RequireSession>} />
          <Route path="/parent/:childId" element={<RequireSession><Parent /></RequireSession>} />
          <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/create" element={<StoryStudio />} />
            <Route path="/stories" element={<Library />} />
            <Route path="/stories/:id" element={<StoryView />} />
            <Route path="/quiz/:id" element={<Quiz />} />
            <Route path="/homework" element={<Homework />} />
            <Route path="/progress" element={<Progress />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}
