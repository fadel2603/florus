import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchProfile } from '@/lib/db/profile';

type UserContextValue = {
  userId: string | null;
  email: string | null;
  isAnonymous: boolean;
  plan: 'free' | 'premium';
  isPremium: boolean;
  loading: boolean;
};

const UserContext = createContext<UserContextValue>({
  userId: null,
  email: null,
  isAnonymous: true,
  plan: 'free',
  isPremium: false,
  loading: true,
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [plan, setPlan] = useState<'free' | 'premium'>('free');
  const [loading, setLoading] = useState(true);

  const applySession = (session: { user: { id: string; email?: string; is_anonymous?: boolean } } | null) => {
    const uid = session?.user.id ?? null;
    const userEmail = session?.user.email ?? null;
    const anon = !userEmail;
    setUserId(uid);
    setEmail(userEmail);
    setIsAnonymous(anon);
    return uid;
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const uid = applySession(session as any);
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
      const uid = applySession(session as any);
      if (uid) {
        fetchProfile(uid).then(p => { if (p) setPlan(p.plan); });
      } else {
        setPlan('free');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ userId, email, isAnonymous, plan, isPremium: plan === 'premium', loading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
