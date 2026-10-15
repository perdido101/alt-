/** Setup health reported by the parent's phone (devices.health), as the call-shield module returns it. */
export type DeviceHealth = {
  supported?: boolean;
  callScreeningRole?: boolean;
  notifications?: boolean;
  overlay?: boolean;
  batteryExempt?: boolean;
  fullScreenIntent?: boolean;
  phoneState?: boolean;
  platform?: string;
};

export type HealthProblem = 'callScreeningRole' | 'notifications' | 'phoneState' | 'overlay' | 'batteryExempt' | 'fullScreenIntent';

export type HealthReport = {
  /** Call protection is actually working (Android with the screening role). */
  protecting: boolean;
  /** Ordered most important first. `callScreeningRole` lost means no protection at all. */
  problems: HealthProblem[];
  /** Days since the phone last talked to us, when that's worryingly long. */
  staleDays: number | null;
};

const ORDER: HealthProblem[] = ['callScreeningRole', 'notifications', 'phoneState', 'fullScreenIntent', 'batteryExempt', 'overlay'];
export const STALE_AFTER_DAYS = 3;

/** Decides which setup-health warnings the guardian sees (e.g. after an Android update revoked a permission). */
export function evaluateHealth(platform: string, health: DeviceHealth, lastSeenAt: string | null, now: Date = new Date()): HealthReport {
  const days = lastSeenAt ? Math.floor((now.getTime() - new Date(lastSeenAt).getTime()) / 86_400_000) : null;
  const staleDays = days !== null && days >= STALE_AFTER_DAYS ? days : null;
  if (platform !== 'android' || health.supported === false) return { protecting: false, problems: [], staleDays };
  const problems = ORDER.filter((k) => health[k] === false);
  return { protecting: health.callScreeningRole === true, problems, staleDays };
}
