import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchProfile } from '@/lib/db/profile';

type UserContextValue = {
  userId: string | null;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  isAnonymous: boolean;
  plan: 'free' | 'premium';
  isPremium: boolean;
  loading: boolean;
  refreshProfile: () => Promise<void>;
};

const UserContext = createContext<UserContextValue>({
  userId: null,
  email: null,
  displayName: null,
  avatarUrl: null,
  isAnonymous: true,
  plan: 'free',
  isPremium: false,
  loading: true,
  refreshProfile: async () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [plan, setPlan] = useState<'free' | 'premium'>('free');
  const [loading, setLoading] = useState(true);

  const applySession = (session: { user: { id: string; email?: string } } | null) => {
    const uid = session?.user.id ?? null;
    const userEmail = session?.user.email ?? null;
    setUserId(uid);
    setEmail(userEmail);
    setIsAnonymous(!userEmail);
    return uid;
  };

  const loadProfile = async (uid: string) => {
    const p = await fetchProfile(uid);
    if (p) {
      setPlan(p.plan);
      setDisplayName(p.displayName);
      setAvatarUrl(p.avatarUrl);
    }
  };

  const refreshProfile = async () => {
    if (userId) await loadProfile(userId);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const uid = applySession(session as any);
      if (uid) {
        loadProfile(uid).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = applySession(session as any);
      if (uid) loadProfile(uid);
      else { setPlan('free'); setDisplayName(null); setAvatarUrl(null); }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{
      userId, email, displayName, avatarUrl,
      isAnonymous, plan, isPremium: plan === 'premium',
      loading, refreshProfile,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
