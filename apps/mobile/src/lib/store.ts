import type { Locale } from '@alt/i18n';
import type { MemberRole } from '@alt/core';
import type { TextScale } from '@alt/tokens';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { deviceLocale } from './i18n';

export type Mode = 'guardian' | 'parent';

/** Steps of the setup ritual, in order. Steps 2 (calls) and 5 (test call) arrive with Call Shield. */
export const SETUP_STEPS = ['language', 'calls', 'family', 'safe-word', 'test'] as const;
export type SetupStep = (typeof SETUP_STEPS)[number];

type State = {
  hydrated: boolean;
  mode: Mode | null;
  circleId: string | null;
  role: MemberRole | null;
  displayName: string | null;
  locale: Locale;
  textScale: TextScale;
  /** Highest setup step completed (index into SETUP_STEPS), -1 if none. */
  setupProgress: number;
  setupDone: boolean;
  consented: boolean;
  /** Device-level analytics opt-out (both modes). Error reports stay on: they hold no personal data. */
  analyticsOptOut: boolean;
  /** Random id for analytics, generated on first launch. Not linked to the account. */
  installId: string | null;
};

type Actions = {
  setMembership: (m: { mode: Mode; circleId: string; role: MemberRole; displayName?: string | null }) => void;
  setLocale: (locale: Locale) => void;
  setTextScale: (scale: TextScale) => void;
  completeSetupStep: (step: SetupStep) => void;
  finishSetup: () => void;
  setConsented: (v: boolean) => void;
  setAnalyticsOptOut: (v: boolean) => void;
  setInstallId: (id: string) => void;
  reset: () => void;
};

const initial: Omit<State, 'hydrated'> = {
  mode: null,
  circleId: null,
  role: null,
  displayName: null,
  locale: deviceLocale(),
  textScale: 'extraLarge',
  setupProgress: -1,
  setupDone: false,
  consented: false,
  analyticsOptOut: false,
  installId: null,
};

export const useAppStore = create<State & Actions>()(
  persist(
    (set) => ({
      ...initial,
      hydrated: false,
      setMembership: ({ mode, circleId, role, displayName }) =>
        set((s) => ({ mode, circleId, role, displayName: displayName ?? s.displayName })),
      setLocale: (locale) => set({ locale }),
      setTextScale: (textScale) => set({ textScale }),
      completeSetupStep: (step) =>
        set((s) => ({ setupProgress: Math.max(s.setupProgress, SETUP_STEPS.indexOf(step)) })),
      finishSetup: () => set({ setupDone: true, setupProgress: SETUP_STEPS.length - 1 }),
      setConsented: (consented) => set({ consented }),
      setAnalyticsOptOut: (analyticsOptOut) => set({ analyticsOptOut }),
      setInstallId: (installId) => set({ installId }),
      reset: () => set((s) => ({ ...initial, analyticsOptOut: s.analyticsOptOut, installId: s.installId })),
    }),
    {
      name: 'alt-app',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ hydrated: _h, ...rest }) => rest,
      onRehydrateStorage: () => () => useAppStore.setState({ hydrated: true }),
    },
  ),
);
