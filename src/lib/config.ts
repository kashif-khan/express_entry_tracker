/**
 * Feature flags configuration system
 * Supports both build-time (env vars) and runtime (localStorage/IndexedDB) flags
 */

import type { FeatureFlag, FeatureFlagValue } from "@/types/express-entry";

/** Default feature flag values - safe by default */
const DEFAULT_FEATURE_FLAGS: Record<FeatureFlag, FeatureFlagValue> = {
  FEATURE_TABLE_DRAG: "on",
  FEATURE_TABLE_RESIZE: "on",
  FEATURE_STATS_ANIMATIONS: "on",
  FEATURE_A11Y_CHECKS: "on",
} as const;

/** Storage key for persisted feature flags */
const FEATURE_FLAGS_STORAGE_KEY = "expressEntryTracker_featureFlags";

/**
 * Get feature flag value with fallback hierarchy:
 * 1. Runtime override (localStorage/IndexedDB)
 * 2. Build-time environment variable
 * 3. Default value
 */
export function getFeatureFlag(flag: FeatureFlag): FeatureFlagValue {
  try {
    // 1. Check runtime override from localStorage
    const stored = localStorage.getItem(FEATURE_FLAGS_STORAGE_KEY);
    if (stored) {
      const flags = JSON.parse(stored) as Partial<
        Record<FeatureFlag, FeatureFlagValue>
      >;
      if (flags[flag]) {
        return flags[flag]!;
      }
    }
  } catch {
    // Ignore localStorage errors (SSR, private mode, etc.)
  }

  // 2. Check build-time environment variable
  const envValue = process.env[`NEXT_PUBLIC_${flag}`] as
    | FeatureFlagValue
    | undefined;
  if (envValue === "on" || envValue === "off") {
    return envValue;
  }

  // 3. Return default value
  return DEFAULT_FEATURE_FLAGS[flag];
}

/**
 * Set feature flag value and persist to localStorage
 */
export function setFeatureFlag(
  flag: FeatureFlag,
  value: FeatureFlagValue,
): void {
  try {
    const stored = localStorage.getItem(FEATURE_FLAGS_STORAGE_KEY);
    const flags = stored ? JSON.parse(stored) : {};
    flags[flag] = value;
    localStorage.setItem(FEATURE_FLAGS_STORAGE_KEY, JSON.stringify(flags));
  } catch (error) {
    console.warn("Failed to persist feature flag:", error);
  }
}

/**
 * Get all feature flags with their current values
 */
export function getAllFeatureFlags(): Record<FeatureFlag, FeatureFlagValue> {
  const flags = Object.keys(DEFAULT_FEATURE_FLAGS) as FeatureFlag[];
  return flags.reduce(
    (acc, flag) => {
      acc[flag] = getFeatureFlag(flag);
      return acc;
    },
    {} as Record<FeatureFlag, FeatureFlagValue>,
  );
}

/**
 * Reset all feature flags to defaults and clear localStorage overrides
 */
export function resetFeatureFlags(): void {
  try {
    localStorage.removeItem(FEATURE_FLAGS_STORAGE_KEY);
  } catch (error) {
    console.warn("Failed to reset feature flags:", error);
  }
}

/**
 * Hook to check if a feature is enabled
 */
export function useFeatureFlag(flag: FeatureFlag): boolean {
  return getFeatureFlag(flag) === "on";
}

/**
 * Configuration constants
 */
export const CONFIG = {
  /** Default polling interval for data fetching (in milliseconds) */
  DEFAULT_POLL_INTERVAL_MS: 3_600_000, // 1 hour

  /** Maximum retry attempts for data fetching */
  MAX_RETRY_ATTEMPTS: 3,

  /** Base delay for exponential backoff (milliseconds) */
  RETRY_BASE_DELAY_MS: 1000,

  /** IRCC Express Entry JSON endpoint (base URL, use getDataUrl() for runtime URL) */
  IRCC_DATA_URL:
    "https://www.canada.ca/content/dam/ircc/documents/json/ee_rounds_123_en.json",

  /** CORS Proxies for development with fallback options */
  CORS_PROXIES: [
    "https://corsproxy.io/?",
    "https://cors-anywhere.herokuapp.com/",
    "https://api.codetabs.com/v1/proxy?quest=",
    "https://proxy.cors.sh/",
    "https://cors.bridged.cc/",
  ],

  /** IndexedDB configuration */
  INDEXEDDB: {
    DATABASE_NAME: "ee-tracker-db",
    VERSION: 1,
    STORES: {
      DRAWS: "draws",
      SETTINGS: "settings",
    },
  },

  /** Local storage keys */
  STORAGE_KEYS: {
    POLL_INTERVAL: "expressEntryTracker_pollInterval",
    FEATURE_FLAGS: FEATURE_FLAGS_STORAGE_KEY,
    TABLE_STATE: "expressEntryTracker_tableState",
  },

  /** Table configuration */
  TABLE: {
    DEFAULT_PAGE_SIZE: 25,
    PAGE_SIZE_OPTIONS: [10, 25, 50, 100, "all"] as const,
    DEFAULT_SORT: {
      key: "drawNumber" as const,
      direction: "desc" as const,
    },
  },

  /** Animation configuration */
  ANIMATIONS: {
    /** Duration for count-up animations (milliseconds) */
    COUNT_UP_DURATION: 2000,
    /** Easing function for animations */
    EASING: "easeOutQuart",
  },

  /** Accessibility settings */
  A11Y: {
    /** Focus visible outline styles */
    FOCUS_STYLES: "ring-2 ring-blue-500 ring-offset-2",
    /** Screen reader only class */
    SR_ONLY: "sr-only",
  },
} as const;

/**
 * Get user-configurable polling interval from localStorage
 */
export function getPollingInterval(): number {
  try {
    const stored = localStorage.getItem(CONFIG.STORAGE_KEYS.POLL_INTERVAL);
    if (stored) {
      const interval = parseInt(stored, 10);
      if (interval > 0) {
        return interval;
      }
    }
  } catch {
    // Ignore localStorage errors
  }
  return CONFIG.DEFAULT_POLL_INTERVAL_MS;
}

/**
 * Set user polling interval and persist to localStorage
 */
export function setPollingInterval(intervalMs: number): void {
  if (intervalMs <= 0) {
    throw new Error("Polling interval must be positive");
  }
  try {
    localStorage.setItem(
      CONFIG.STORAGE_KEYS.POLL_INTERVAL,
      intervalMs.toString(),
    );
  } catch (error) {
    console.warn("Failed to persist polling interval:", error);
  }
}

/**
 * Get the data URL with CORS proxy support for all environments
 * Always uses CORS proxy to avoid CORS issues across all deployment scenarios
 */
export function getDataUrl(): string {
  // Allow override via environment variable
  if (process.env.NEXT_PUBLIC_IRCC_DATA_URL) {
    return process.env.NEXT_PUBLIC_IRCC_DATA_URL;
  }

  // Always use first proxy option - fetchDraws will handle fallbacks
  return CONFIG.CORS_PROXIES[0] + CONFIG.IRCC_DATA_URL;
}

/**
 * Get all possible data URLs with CORS proxy fallbacks for all environments
 * Returns array of proxied URLs to try in order for robust CORS handling
 */
export function getDataUrls(): string[] {
  // Allow override via environment variable
  if (process.env.NEXT_PUBLIC_IRCC_DATA_URL) {
    return [process.env.NEXT_PUBLIC_IRCC_DATA_URL];
  }

  // Always return array of proxied URLs for fallback in all environments
  return CONFIG.CORS_PROXIES.map((proxy) => proxy + CONFIG.IRCC_DATA_URL);
}
