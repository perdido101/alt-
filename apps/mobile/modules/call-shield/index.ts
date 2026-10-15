import { NativeModule, requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

export type CallShieldHealth = {
  supported: boolean;
  callScreeningRole: boolean;
  notifications: boolean;
  overlay: boolean;
  batteryExempt: boolean;
  fullScreenIntent: boolean;
  phoneState: boolean;
  cacheUpdatedAt: number | null;
  sdk?: number;
};

export type ScreenedEvent = {
  type: 'screened';
  localId: string;
  numberKey: string | null;
  numberKind: 'hidden' | 'short' | 'domestic' | 'international' | 'invalid';
  classification: 'family' | 'official' | 'reported_scam' | 'risky' | 'unknown';
  reason: string;
  action: 'none' | 'warned' | 'silenced' | 'blocked';
  officialId: string | null;
  checkIn: boolean;
  label: string;
  who: string;
  startedAt: number;
};
export type EndedEvent = { type: 'ended'; localId: string; endedAt: number; answered: boolean };
export type QueuedEvent = ScreenedEvent | EndedEvent;

/** The cache the native screening service reads. Built by src/lib/callShield.ts. */
export type ScreeningCacheFile = {
  version: 1;
  updatedAt: string;
  protectionLevel: 'warn' | 'silence' | 'block';
  reportThreshold: number;
  family: string[];
  official: Array<{ id: string; key: string; organisation: string; category: string; displayNumber: string }>;
  reputation: Array<{ key: string; approvedReports: number; flagged: boolean }>;
  strings: Record<string, string>;
  colors: Record<string, string>;
};

type Events = {
  onCallScreened(e: { classification: ScreenedEvent['classification']; localId: string }): void;
  onCallEnded(e: { localId: string }): void;
};

declare class CallShieldNative extends NativeModule<Events> {
  isSupported(): boolean;
  getHealth(): CallShieldHealth;
  requestScreeningRole(): Promise<boolean>;
  openOverlaySettings(): void;
  openBatterySettings(): void;
  openNotificationSettings(): void;
  openFullScreenIntentSettings(): void;
  openAppSettings(): void;
  writeCache(json: string): void;
  drainEvents(): string;
}

declare class CallDirectoryNative extends NativeModule<Record<string, never>> {
  isSupported(): boolean;
  /** Same cache JSON as Android; becomes the Call Directory list (labels + optional blocks). */
  writeCache(json: string): void;
  getDirectoryStatus(): Promise<'enabled' | 'disabled' | 'unknown'>;
  openAppSettings(): void;
  drainEvents(): string;
}

const native = requireOptionalNativeModule('CallShield');

/** Android call screening. Null on iOS (and in tests); callers fall back to the manual check-in. */
export const CallShield = (Platform.OS === 'android' ? native : null) as CallShieldNative | null;

/** iOS Call Directory (labels and blocks reported numbers). Null on Android. */
export const CallDirectory = (Platform.OS === 'ios' ? native : null) as CallDirectoryNative | null;
