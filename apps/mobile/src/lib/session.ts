import { useEffect } from 'react';
import { myMemberships } from './api';
import { useAppStore } from './store';
import { supabase } from './supabase';

/**
 * Keeps the local mode in step with the server: whoever is signed in, their membership decides
 * parent or guardian mode. A parent is always the protected member of exactly one circle.
 */
export async function refreshMembership(): Promise<void> {
  const memberships = await myMemberships();
  const store = useAppStore.getState();
  const protectedM = memberships.find((m) => m.role === 'protected');
  if (protectedM) {
    store.setMembership({ mode: 'parent', circleId: protectedM.circleId, role: 'protected', displayName: protectedM.displayName });
    store.setConsented(!!protectedM.consentedAt);
    return;
  }
  const guardian = memberships.find((m) => m.circleId === store.circleId) ?? memberships[0];
  if (guardian) {
    store.setMembership({ mode: 'guardian', circleId: guardian.circleId, role: 'guardian', displayName: guardian.displayName });
  }
}

export function useSessionSync() {
  const hydrated = useAppStore((s) => s.hydrated);
  useEffect(() => {
    if (!hydrated) return;
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || (event === 'INITIAL_SESSION' && !session)) {
        // Without a session the device is no longer bound to a circle.
        if (useAppStore.getState().mode) useAppStore.getState().reset();
        return;
      }
      if (session && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN')) {
        // Defer: calling Supabase inside the auth callback can deadlock the client.
        setTimeout(() => void refreshMembership().catch(() => undefined), 0);
      }
    });
    return () => data.subscription.unsubscribe();
  }, [hydrated]);
}
