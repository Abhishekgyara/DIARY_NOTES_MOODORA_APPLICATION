import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import AppLayout from '@/components/layout/AppLayout';
import InstallAppButton from '@/components/common/InstallAppButton';
import { PageLoader } from '@/components/common/EmptyState';

import Welcome from '@/pages/Welcome';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import Dashboard from '@/pages/Dashboard';
import NewEntry from '@/pages/NewEntry';
import EntryDetails from '@/pages/EntryDetails';
import Calendar from '@/pages/Calendar';
import Photos from '@/pages/Photos';
import Analytics from '@/pages/Analytics';
import Settings from '@/pages/Settings';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <AppLayout>{children}</AppLayout>;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <InstallAppButton />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

function AppRoutes() {
  const { initializationError, retryInitialization } = useAuth();
  if (initializationError) {
    return (
      <main className="auth-page" style={{ display: 'grid', placeItems: 'center', padding: 24 }}>
        <div className="card" style={{ maxWidth: 480 }}>
          <h1 className="section-title">Could not connect to your diary</h1>
          <p className="section-subtitle">{initializationError}</p>
          <button className="btn btn-primary mt-4" onClick={retryInitialization}>Try again</button>
        </div>
      </main>
    );
  }
  return (
    <Routes>
      <Route path="/" element={<PublicRoute><Welcome /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/entries/new" element={<ProtectedRoute><NewEntryFromQuery /></ProtectedRoute>} />
      <Route path="/entries/:id" element={<ProtectedRoute><EntryDetails /></ProtectedRoute>} />
      <Route path="/entries/:id/edit" element={<ProtectedRoute><NewEntryFromEdit /></ProtectedRoute>} />
      <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
      <Route path="/photos" element={<ProtectedRoute><Photos /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function NewEntryFromQuery() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const date = params.get('date');
  return <NewEntry initialDate={date} />;
}

function NewEntryFromEdit() {
  const { id } = useParams();
  return <NewEntry editId={id} />;
}
