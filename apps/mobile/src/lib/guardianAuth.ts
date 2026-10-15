import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Href } from 'expo-router';
import { acceptInvite, myMemberships } from './api';
import { refreshMembership } from './session';

const PENDING_INVITE = 'alt.pendingInvite';

/** A guardian invite opened before signing in is remembered across the magic-link round trip. */
export const pendingInvite = {
  set: (token: string) => AsyncStorage.setItem(PENDING_INVITE, token),
  take: async () => {
    const token = await AsyncStorage.getItem(PENDING_INVITE);
    if (token) await AsyncStorage.removeItem(PENDING_INVITE);
    return token;
  },
};

/** After a guardian signs in: accept any pending invite, then go home or create a circle. */
export async function finishGuardianSignIn(): Promise<Href> {
  const token = await pendingInvite.take();
  if (token) {
    try {
      await acceptInvite(token);
    } catch {
      // An expired or used invite shouldn't block sign-in; they can ask for a new one.
    }
  }
  await refreshMembership();
  const memberships = await myMemberships();
  if (memberships.some((m) => m.role === 'protected')) return '/';
  return memberships.length > 0 ? '/guardian/home' : '/guardian/create-circle';
}
