import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchProfile } from '@/lib/db/profile';

type UserContextValue = {
  userId: string | null;
  plan: 'free' | 'premium';
  isPremium: boolean;
  loading: boolean;
};

const UserContext = createContext<UserContextValue>({
  userId: null,
  plan: 'free',
  isPremium: false,
  loading: true,
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [plan, setPlan] = useState<'free' | 'premium'>('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const uid = session?.user.id ?? null;
      setUserId(uid);
      if (uid) {
        fetchProfile(uid).then(p => {
          if (p) setPlan(p.plan);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user.id ?? null;
      setUserId(uid);
      if (uid) {
        fetchProfile(uid).then(p => { if (p) setPlan(p.plan); });
      } else {
        setPlan('free');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ userId, plan, isPremium: plan === 'premium', loading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
