import type { Session } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';

import { supabase } from '@/lib/supabase';

type AuthContextValue = {
  /** The current session, or null when signed out. */
  session: Session | null;
  /** True until the stored session has been read back from disk. */
  initializing: boolean;
  /**
   * True between verifying a recovery code and saving the new password. During
   * that window there IS a session, but the user has not finished recovering,
   * so the router must keep them on the new-password screen rather than
   * dropping them into the app.
   */
  recoveringPassword: boolean;
  beginPasswordRecovery: () => void;
  endPasswordRecovery: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [recoveringPassword, setRecoveringPassword] = useState(false);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setInitializing(false);
    });

    /**
     * The callback stays synchronous on purpose: awaiting another Supabase call
     * inside it deadlocks the auth client.
     */
    const { data: subscription } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      setInitializing(false);
      if (event === 'PASSWORD_RECOVERY') setRecoveringPassword(true);
      if (event === 'SIGNED_OUT') setRecoveringPassword(false);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  /**
   * Supabase refreshes the access token on a timer, which iOS suspends in the
   * background. Tying the timer to foreground state keeps a returning user
   * signed in instead of bouncing them to the sign-in screen.
   */
  useEffect(() => {
    const handle = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void supabase.auth.startAutoRefresh();
      } else {
        void supabase.auth.stopAutoRefresh();
      }
    });

    if (AppState.currentState === 'active') void supabase.auth.startAutoRefresh();

    return () => {
      handle.remove();
      void supabase.auth.stopAutoRefresh();
    };
  }, []);

  const beginPasswordRecovery = useCallback(() => setRecoveringPassword(true), []);
  const endPasswordRecovery = useCallback(() => setRecoveringPassword(false), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      initializing,
      recoveringPassword,
      beginPasswordRecovery,
      endPasswordRecovery,
    }),
    [session, initializing, recoveringPassword, beginPasswordRecovery, endPasswordRecovery]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>.');
  return value;
}
