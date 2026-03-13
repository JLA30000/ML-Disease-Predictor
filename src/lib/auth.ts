import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '@supabase/supabase-js';

import { isSupabaseConfigured, supabase, supabaseRedirectUrl } from './supabase';

const GUEST_SESSION_KEY = 'guestSession';

export type AuthUser = {
  id: string;
  email: string | null;
  name: string;
  provider: 'email' | 'guest';
};

export type SignUpResult = {
  email: string;
  requiresEmailConfirmation: boolean;
};

function requireSupabaseConfig() {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Authentication is not configured yet. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }
}

function getNameFromUser(user: User): string {
  const metadataName =
    typeof user.user_metadata?.full_name === 'string'
      ? user.user_metadata.full_name.trim()
      : typeof user.user_metadata?.name === 'string'
        ? user.user_metadata.name.trim()
        : '';

  if (metadataName) {
    return metadataName;
  }

  if (user.email) {
    return user.email.split('@')[0];
  }

  return 'User';
}

function mapUser(user: User | null): AuthUser | null {
  if (!user?.email) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: getNameFromUser(user),
    provider: 'email',
  };
}

async function getGuestUser(): Promise<AuthUser | null> {
  try {
    const raw = await AsyncStorage.getItem(GUEST_SESSION_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<AuthUser>;
    if (parsed.provider !== 'guest') {
      return null;
    }

    return {
      id: typeof parsed.id === 'string' ? parsed.id : `guest-${Date.now()}`,
      email: null,
      name: typeof parsed.name === 'string' && parsed.name.trim() ? parsed.name : 'Guest',
      provider: 'guest',
    };
  } catch {
    return null;
  }
}

async function clearGuestUser(): Promise<void> {
  try {
    await AsyncStorage.removeItem(GUEST_SESSION_KEY);
  } catch {
    // Storage failures should not crash the app.
  }
}

export function createGuestUser(): AuthUser {
  return {
    id: `guest-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    email: null,
    name: 'Guest',
    provider: 'guest',
  };
}

function normalizeErrorMessage(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('email not confirmed')) {
    return 'Please verify your email before signing in.';
  }

  if (lower.includes('invalid login credentials')) {
    return 'Incorrect email or password.';
  }

  return message;
}

function parseUrlParams(url: string): Record<string, string> {
  const params = new URLSearchParams();
  const [base, hash] = url.split('#');
  const query = base.includes('?') ? base.split('?')[1] : '';

  if (query) {
    new URLSearchParams(query).forEach((value, key) => params.set(key, value));
  }

  if (hash) {
    new URLSearchParams(hash).forEach((value, key) => params.set(key, value));
  }

  const entries: Record<string, string> = {};
  params.forEach((value, key) => {
    entries[key] = value;
  });
  return entries;
}

export function getAuthUserFromSupabaseUser(user: User | null): AuthUser | null {
  return mapUser(user);
}

export async function getStoredUser(): Promise<AuthUser | null> {
  const guestUser = await getGuestUser();

  if (!isSupabaseConfigured) {
    return guestUser;
  }

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw new Error(normalizeErrorMessage(error.message));
  }

  const storedUser = mapUser(session?.user ?? null);
  if (storedUser) {
    await clearGuestUser();
    return storedUser;
  }

  return guestUser;
}

export async function storeUser(user: AuthUser): Promise<void> {
  if (user.provider === 'guest') {
    try {
      await AsyncStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(user));
    } catch {
      // Storage failures should not crash the app.
    }
    return;
  }

  await clearGuestUser();
}

export async function clearStoredUser(): Promise<void> {
  await clearGuestUser();

  if (!isSupabaseConfigured) {
    return;
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error(normalizeErrorMessage(sessionError.message));
  }

  if (!session) {
    return;
  }

  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) {
    throw new Error(normalizeErrorMessage(error.message));
  }
}

export async function signUpWithEmail(
  name: string,
  email: string,
  password: string
): Promise<SignUpResult> {
  requireSupabaseConfig();

  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: {
        full_name: name.trim(),
      },
      emailRedirectTo: supabaseRedirectUrl,
    },
  });

  if (error) {
    throw new Error(normalizeErrorMessage(error.message));
  }

  return {
    email: data.user?.email ?? email.trim().toLowerCase(),
    requiresEmailConfirmation: !data.session,
  };
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<AuthUser> {
  requireSupabaseConfig();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) {
    throw new Error(normalizeErrorMessage(error.message));
  }

  const user = mapUser(data.user);
  if (!user) {
    throw new Error('Unable to sign in.');
  }

  return user;
}

export async function resendEmailConfirmation(email: string): Promise<void> {
  requireSupabaseConfig();

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email.trim().toLowerCase(),
    options: {
      emailRedirectTo: supabaseRedirectUrl,
    },
  });

  if (error) {
    throw new Error(normalizeErrorMessage(error.message));
  }
}

export async function requestPasswordReset(email: string): Promise<void> {
  requireSupabaseConfig();

  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: supabaseRedirectUrl,
  });

  if (error) {
    throw new Error(normalizeErrorMessage(error.message));
  }
}

export async function updatePassword(password: string): Promise<void> {
  requireSupabaseConfig();

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    throw new Error(normalizeErrorMessage(error.message));
  }
}

export async function handleAuthCallbackUrl(url: string): Promise<boolean> {
  if (!isSupabaseConfigured) {
    return false;
  }

  const params = parseUrlParams(url);

  if (params.access_token && params.refresh_token) {
    const { error } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });

    if (error) {
      throw new Error(normalizeErrorMessage(error.message));
    }

    return true;
  }

  if (params.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) {
      throw new Error(normalizeErrorMessage(error.message));
    }
    return true;
  }

  return false;
}
