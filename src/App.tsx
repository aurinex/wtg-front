import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useEffect } from 'react';
import { getMe } from './api/users';
import Login from './pages/Login';
import Register from './pages/Register';
import Main from './pages/Main';
import Room from './pages/Room';
import Profile from './pages/Profile';
import Friends from './pages/Friends';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (token) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  const { token, setAuth, user } = useAuthStore();

  useEffect(() => {
    if (token && !user) {
      getMe()
        .then((res) => {
          useAuthStore.getState().setAuth(res.data, token);
        })
        .catch(() => {
          useAuthStore.getState().logout();
        });
    }
  }, [token, user]);

  return (
    <Routes>
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
      <Route path="/" element={<ProtectedRoute><Main /></ProtectedRoute>} />
      <Route path="/room/:code" element={<ProtectedRoute><Room /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
