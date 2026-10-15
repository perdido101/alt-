import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { hasPin } from './pin';

const RELOCK_AFTER_MS = 60_000;

/** Parent mode: ask for the PIN on launch and after a minute in the background (only if a PIN was set). */
export function usePinLock(enabled: boolean) {
  const backgroundAt = useRef<number | null>(null);
  useEffect(() => {
    if (!enabled) return;
    void hasPin().then((yes) => yes && router.push('/parent/lock'));
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') backgroundAt.current = Date.now();
      if (state === 'active' && backgroundAt.current && Date.now() - backgroundAt.current > RELOCK_AFTER_MS) {
        backgroundAt.current = null;
        void hasPin().then((yes) => yes && router.push('/parent/lock'));
      }
    });
    return () => sub.remove();
  }, [enabled]);
}
