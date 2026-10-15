import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { finishGuardianSignIn } from '@/lib/guardianAuth';
import { supabase } from '@/lib/supabase';

/** Magic-link redirect: alt://auth-callback?code=… (PKCE). */
export default function AuthCallback() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    void (async () => {
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          router.replace(await finishGuardianSignIn());
          return;
        }
      }
      router.replace('/guardian/sign-in');
    })();
  }, [code]);
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
