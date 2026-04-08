'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { Profile } from '@the-heist/shared';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error: string | null }>;
  signInWithGitHub: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

function getSupabase(): SupabaseClient | null {
  try {
    return createClient();
  } catch {
    return null;
  }
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef<SupabaseClient | null>(null);

  // Lazy-init supabase client (only in browser)
  function getClient(): SupabaseClient | null {
    if (!supabaseRef.current) {
      supabaseRef.current = getSupabase();
    }
    return supabaseRef.current;
  }

  const fetchProfile = useCallback(async (userId: string) => {
    const supabase = getClient();
    if (!supabase) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(data as Profile | null);
  }, []);

  useEffect(() => {
    const supabase = getClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u);
      if (u) fetchProfile(u.id);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        fetchProfile(u.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = getClient();
    if (!supabase) return { error: 'Supabase not initialized' };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signUp = useCallback(async (email: string, password: string, username: string) => {
    const supabase = getClient();
    if (!supabase) return { error: 'Supabase not initialized' };
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    return { error: error?.message ?? null };
  }, []);

  const signInWithGitHub = useCallback(async () => {
    const supabase = getClient();
    if (!supabase) return { error: 'Supabase not initialized' };
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, []);

  return { user, profile, loading, signIn, signUp, signInWithGitHub, signOut };
}
