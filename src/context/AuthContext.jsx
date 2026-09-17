import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

  const loadProfile = async (user) => {
    setProfileLoading(true);
    if (!user || user.is_anonymous || !supabase) {
      setProfile(null);
      setProfileLoading(false);
      return null;
    }
    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (error) console.error('Profile load failed', error);
    setProfile(data || null);
    setProfileLoading(false);
    return data || null;
  };

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return undefined;
    }
    let alive = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!alive) return;
      setSession(data.session || null);
      await loadProfile(data.session?.user);
      if (alive) setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setProfileLoading(true);
      setTimeout(() => loadProfile(nextSession?.user), 0);
    });
    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const ensureGuestSession = async () => {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { data: existing } = await supabase.auth.getSession();
    if (existing.session) return existing.session;
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
      if (/anonymous|disabled/i.test(error.message || '')) {
        throw new Error('Guest checkout needs Anonymous Sign-Ins enabled in Supabase Authentication settings. Your cart is safe; enable it and try again.');
      }
      throw error;
    }
    return data.session;
  };

  const signUp = async ({ fullName, email, password, phone }) => {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { data: current } = await supabase.auth.getUser();
    const details = { full_name: fullName.trim(), phone: phone.trim() };
    const result = current.user?.is_anonymous
      ? await supabase.auth.updateUser({ email, password, data: details })
      : await supabase.auth.signUp({ email, password, options: { data: details } });
    if (result.error) throw result.error;
    await loadProfile(result.data.user);
    return result.data;
  };

  const login = async (email, password) => {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const nextProfile = await loadProfile(data.user);
    return { ...data, profile: nextProfile };
  };

  const logout = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
  };

  const updateProfile = async (values) => {
    if (!session?.user || session.user.is_anonymous) throw new Error('Please sign in first.');
    const payload = { full_name: values.fullName.trim(), phone: values.phone.trim(), updated_at: new Date().toISOString() };
    const { data, error } = await supabase.from('profiles').update(payload).eq('id', session.user.id).select().single();
    if (error) throw error;
    setProfile(data);
    return data;
  };

  const value = useMemo(() => ({
    session,
    user: session?.user || null,
    profile,
    loading,
    profileLoading,
    configured: isSupabaseConfigured,
    isCustomer: Boolean(session?.user && !session.user.is_anonymous),
    isAdmin: profile?.role === 'admin',
    ensureGuestSession,
    signUp,
    login,
    logout,
    updateProfile,
    refreshProfile: () => loadProfile(session?.user),
  }), [session, profile, loading, profileLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
