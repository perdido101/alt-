import { Redirect } from 'expo-router';
import { useAppStore } from '@/lib/store';

/** Mode router. The parent always lands on the same home screen once setup is done. */
export default function Index() {
  const { mode, consented, setupDone } = useAppStore();
  if (mode === 'parent') {
    if (!consented) return <Redirect href="/parent/consent" />;
    if (!setupDone) return <Redirect href="/parent/setup/language" />;
    return <Redirect href="/parent/home" />;
  }
  if (mode === 'guardian') return <Redirect href="/guardian/home" />;
  return <Redirect href="/welcome" />;
}
