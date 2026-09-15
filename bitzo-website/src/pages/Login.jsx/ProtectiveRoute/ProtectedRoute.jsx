import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { authFetch, clearAuthState } from '../../../utils/session';
import { API_ORIGIN } from '../../../config/api';

export default function ProtectedRoute() {
  const location = useLocation();
  const [state, setState] = useState('checking'); // checking | ok | redirect

  useEffect(() => {
    let mounted = true;

    const validate = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        if (mounted) setState('redirect');
        return;
      }

      try {
        const res = await authFetch(`${API_ORIGIN}/api/me`, { method: 'GET' });
        if (!mounted) return;

        if (res.ok) {
          setState('ok');
        } else {
          clearAuthState();
          setState('redirect');
        }
      } catch (_) {
        if (!mounted) return;
        clearAuthState();
        setState('redirect');
      }
    };

    validate();
    return () => {
      mounted = false;
    };
  }, []);

  if (state === 'checking') {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f0f0f',
          color: '#fff',
          fontFamily: 'sans-serif',
        }}
      >
        Loading...
      </div>
    );
  }

  if (state === 'redirect') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
