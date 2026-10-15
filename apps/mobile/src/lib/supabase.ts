import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';
import { chunkedSecureStorage } from './secureStorage';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'missing-anon-key';

export const supabase = createClient(url, anonKey, {
  auth: {
    storage: chunkedSecureStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});

// Refresh tokens only while the app is in the foreground (recommended for React Native).
AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
