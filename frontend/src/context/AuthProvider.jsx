import { useEffect, useMemo, useState } from 'react';
import { authApi, setAccessToken } from '../services/api.js';
import { AuthContext } from './auth-context.js';

const SESSION_MARKER = 'careerflow_session_started';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (localStorage.getItem(SESSION_MARKER) !== 'true') {
      setLoading(false);
      return () => {
        active = false;
      };
    }

    authApi
      .refresh()
      .then((response) => {
        if (active) setUser(response.data.user);
      })
      .catch(() => {
        setAccessToken(null);
        localStorage.removeItem(SESSION_MARKER);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const establishSession = (response) => {
    setAccessToken(response.data.accessToken);
    localStorage.setItem(SESSION_MARKER, 'true');
    setUser(response.data.user);
    return response.data.user;
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      login: async (credentials) => establishSession(await authApi.login(credentials)),
      guestLogin: async () => establishSession(await authApi.guest()),
      register: async (details) => establishSession(await authApi.register(details)),
      logout: async () => {
        try {
          await authApi.logout();
        } finally {
          setAccessToken(null);
          localStorage.removeItem(SESSION_MARKER);
          setUser(null);
        }
      },
    }),
    [loading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
