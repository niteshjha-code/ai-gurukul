import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, parentTokenStore, tokenStore } from '../lib/api';

const AuthContext = createContext(null);

// Two sessions: `user` is the child currently learning; `parentToken` unlocks Parent Corner.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [parentToken, setParentTokenState] = useState(() => parentTokenStore.get());
  const [ready, setReady] = useState(false);

  const setParentToken = useCallback((token) => {
    parentTokenStore.set(token);
    setParentTokenState(token);
  }, []);

  useEffect(() => {
    if (!tokenStore.get()) return setReady(true);
    api('/auth/me')
      .then((d) => setUser(d.user))
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    const onUnauthorized = () => {
      tokenStore.set(null);
      setUser(null);
    };
    const onParentLocked = () => setParentToken(null);
    window.addEventListener('gurukul:unauthorized', onUnauthorized);
    window.addEventListener('gurukul:parent-locked', onParentLocked);
    return () => {
      window.removeEventListener('gurukul:unauthorized', onUnauthorized);
      window.removeEventListener('gurukul:parent-locked', onParentLocked);
    };
  }, [setParentToken]);

  const switchProfile = useCallback(async (profileId, token) => {
    const d = await api('/auth/switch', { method: 'POST', body: { profileId }, token: token ?? tokenStore.get() ?? parentTokenStore.get() });
    tokenStore.set(d.token);
    setUser(d.user);
    return d.user;
  }, []);

  // Returns where to go next: straight in for a single child, otherwise the "Who's learning?" picker.
  const login = useCallback(async (email, password) => {
    const d = await api('/auth/login', { method: 'POST', body: { email, password } });
    setParentToken(d.parentToken);
    if (d.profiles.length === 1) {
      await switchProfile(d.profiles[0].id, d.parentToken);
      return '/dashboard';
    }
    tokenStore.set(null);
    setUser(null);
    return '/profiles';
  }, [setParentToken, switchProfile]);

  const register = useCallback(async (form) => {
    const d = await api('/auth/register', { method: 'POST', body: form });
    tokenStore.set(d.token);
    setParentToken(d.parentToken);
    setUser(d.user);
    return d.user;
  }, [setParentToken]);

  const unlockParent = useCallback(async (password) => {
    const d = await api('/auth/unlock', { method: 'POST', body: { password }, token: tokenStore.get() ?? parentTokenStore.get() });
    setParentToken(d.parentToken);
    return d.parentToken;
  }, [setParentToken]);

  const lockParent = useCallback(() => setParentToken(null), [setParentToken]);

  const logout = useCallback(() => {
    tokenStore.set(null);
    setParentToken(null);
    setUser(null);
  }, [setParentToken]);

  const refresh = useCallback(async () => {
    const d = await api('/auth/me');
    setUser(d.user);
    return d.user;
  }, []);

  const updateProfile = useCallback(async (changes) => {
    const d = await api('/auth/me', { method: 'PATCH', body: changes });
    setUser(d.user);
    return d.user;
  }, []);

  const value = useMemo(
    () => ({ user, ready, parentToken, login, register, logout, refresh, updateProfile, switchProfile, unlockParent, lockParent }),
    [user, ready, parentToken, login, register, logout, refresh, updateProfile, switchProfile, unlockParent, lockParent],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
