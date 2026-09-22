import { useEffect, useMemo, useState } from 'react';
import { authApi, setAccessToken } from '../services/api.js';
import { AuthContext } from './auth-context.js';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    authApi
      .refresh()
      .then((response) => {
        if (active) setUser(response.data.user);
      })
      .catch(() => {
        setAccessToken(null);
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
          setUser(null);
        }
      },
    }),
    [loading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
