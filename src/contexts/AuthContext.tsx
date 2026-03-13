import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as Linking from 'expo-linking';

import {
  AuthUser,
  clearStoredUser,
  createGuestUser,
  getAuthUserFromSupabaseUser,
  getStoredUser,
  handleAuthCallbackUrl,
  storeUser,
} from '../lib/auth';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

type AuthContextType = {
  user: AuthUser | null;
  isLoading: boolean;
  isPasswordRecovery: boolean;
  signIn: (user: AuthUser) => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  clearPasswordRecovery: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isPasswordRecovery: false,
  signIn: async () => {},
  signInAsGuest: async () => {},
  signOut: async () => {},
  clearPasswordRecovery: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let linkingSubscription: { remove: () => void } | null = null;
    let authSubscription: { unsubscribe: () => void } | null = null;

    const bootstrap = async () => {
      try {
        if (isSupabaseConfigured) {
          const initialUrl = await Linking.getInitialURL();
          if (initialUrl) {
            await handleAuthCallbackUrl(initialUrl);
          }
        }

        const currentUser = await getStoredUser();
        if (isMounted) {
          setUser(currentUser);
        }
      } catch {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (isSupabaseConfigured) {
      linkingSubscription = Linking.addEventListener('url', ({ url }) => {
        handleAuthCallbackUrl(url).catch(() => {});
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (_event === 'PASSWORD_RECOVERY' && isMounted) {
          setIsPasswordRecovery(true);
        }

        if (_event === 'SIGNED_OUT' && isMounted) {
          setIsPasswordRecovery(false);
        }

        if (isMounted) {
          setUser(getAuthUserFromSupabaseUser(session?.user ?? null));
          setIsLoading(false);
        }
      });

      authSubscription = subscription;
    }

    bootstrap();

    return () => {
      isMounted = false;
      linkingSubscription?.remove();
      authSubscription?.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (newUser: AuthUser) => {
    await storeUser(newUser);
    setUser(newUser);
    setIsPasswordRecovery(false);
  }, []);

  const signInAsGuest = useCallback(async () => {
    const guestUser = createGuestUser();
    await storeUser(guestUser);
    setUser(guestUser);
    setIsPasswordRecovery(false);
  }, []);

  const signOut = useCallback(async () => {
    await clearStoredUser();
    setUser(null);
    setIsPasswordRecovery(false);
  }, []);

  const clearPasswordRecovery = useCallback(() => {
    setIsPasswordRecovery(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isPasswordRecovery,
        signIn,
        signInAsGuest,
        signOut,
        clearPasswordRecovery,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
