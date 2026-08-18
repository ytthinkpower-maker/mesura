import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

import type { Database } from '@/lib/database.types';

/**
 * The Supabase client.
 *
 * Both values are `EXPO_PUBLIC_` on purpose: the URL and the anon key are
 * publishable, and Row Level Security — not secrecy — is what keeps one user
 * out of another user's rows. The `service_role` key must never appear in this
 * repo, in any `.env` file, or anywhere the bundle can reach.
 *
 * Which project is used depends on the mode: `.env.development` points at
 * `mesura-dev` for Expo Go, `.env.production` at `mesura-prod`.
 */
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase is not configured. EXPO_PUBLIC_SUPABASE_URL and ' +
      'EXPO_PUBLIC_SUPABASE_ANON_KEY must be set in .env.development ' +
      '(Expo Go) or .env.production. Restart Metro after editing them — ' +
      'env values are inlined at bundle time.'
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    /**
     * Sessions live in AsyncStorage rather than SecureStore: SecureStore caps a
     * value at 2048 bytes on iOS and a Supabase session (two JWTs plus user
     * metadata) routinely exceeds that, which silently drops the session and
     * signs the user out. Losing someone's history is the exact failure this
     * product promises not to have.
     */
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    /** There is no URL to read a session out of in a native app. */
    detectSessionInUrl: false,
  },
});
