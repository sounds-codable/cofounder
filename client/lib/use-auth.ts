'use client';

import { useCallback, useEffect, useSyncExternalStore, useState } from 'react';
import { fetchMe, type MeProfile } from '@/lib/platform-api';
import { clearStoredAccessToken, getStoredAccessToken, subscribeAccessToken } from '@/lib/session';

export function useAuthState() {
  const token = useSyncExternalStore(subscribeAccessToken, getStoredAccessToken, () => null);
  const [profile, setProfile] = useState<MeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  const refresh = useCallback(async () => {
    if (!token) {
      setProfile(null);
      setAuthenticated(false);
      setLoading(false);
      return null;
    }

    setLoading(true);

    try {
      const nextProfile = await fetchMe();
      setProfile(nextProfile);
      setAuthenticated(true);
      return nextProfile;
    } catch {
      clearStoredAccessToken();
      setProfile(null);
      setAuthenticated(false);
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void refresh();

    return undefined;
  }, [refresh, token]);

  return {
    authenticated,
    loading,
    profile,
    refresh,
  };
}
