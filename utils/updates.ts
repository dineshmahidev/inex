import { Platform, Linking } from 'react-native';

export interface UpdateInfo {
  hasUpdate: boolean;
  latestVersion: string;
  isForceUpdate: boolean;
  storeUrl: string;
}

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.dineshmahidev.tracksy';
const APP_STORE_URL = 'https://apps.apple.com/app/com.dineshmahidev.tracksy'; // Fallback

// Local version coordinates matching app.json
export const CURRENT_VERSION = '1.0.4';
export const CURRENT_VERSION_CODE = 8;

/**
 * Checks if a newer version of the app exists.
 * In a real production app, you would fetch a remote config endpoint or query store APIs.
 * We implement a robust check that simulates updates if a remote test flag is enabled,
 * and gracefully queries the iTunes lookup API on iOS, and defaults to standard Play Store links.
 */
export async function checkForUpdates(forceTest: boolean = false): Promise<UpdateInfo> {
  try {
    const storeUrl = Platform.OS === 'android' ? PLAY_STORE_URL : APP_STORE_URL;

    // If testing updates, trigger update immediately
    if (forceTest) {
      return {
        hasUpdate: true,
        latestVersion: '1.0.5',
        isForceUpdate: false,
        storeUrl,
      };
    }

    // iOS Store API Check
    if (Platform.OS === 'ios') {
      const response = await fetch('https://itunes.apple.com/lookup?bundleId=com.dineshmahidev.tracksy');
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const storeVersion = data.results[0].version; // e.g. "1.0.5"
        const hasUpdate = isNewerVersion(CURRENT_VERSION, storeVersion);
        return {
          hasUpdate,
          latestVersion: storeVersion,
          isForceUpdate: false,
          storeUrl: data.results[0].trackViewUrl || storeUrl,
        };
      }
    }

    // Android/General Check: For Android, querying the raw HTML of Google Play Store is often rate-limited,
    // so in production, querying a remote configuration JSON (like Firebase Remote Config or a self-hosted JSON file)
    // is the absolute industry standard.
    // We query a mock config JSON, with a fast safe fallback.
    try {
      const response = await fetch('https://raw.githubusercontent.com/dineshmahidev/inex/main/update_config.json', {
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (response.ok) {
        const config = await response.json();
        const latestCode = config.android?.versionCode || CURRENT_VERSION_CODE;
        const hasUpdate = latestCode > CURRENT_VERSION_CODE;
        return {
          hasUpdate,
          latestVersion: config.android?.versionName || CURRENT_VERSION,
          isForceUpdate: config.android?.forceUpdate || false,
          storeUrl: config.android?.storeUrl || PLAY_STORE_URL,
        };
      }
    } catch (e) {
      // Quiet fail to silent fallback
    }

  } catch (error) {
    console.log('Update check failed quietly:', error);
  }

  return {
    hasUpdate: false,
    latestVersion: CURRENT_VERSION,
    isForceUpdate: false,
    storeUrl: Platform.OS === 'android' ? PLAY_STORE_URL : APP_STORE_URL,
  };
}

// Compare semantic versioning (e.g. 1.0.4 vs 1.0.5)
function isNewerVersion(current: string, latest: string): boolean {
  const parse = (v: string) => v.split('.').map(Number);
  const curParts = parse(current);
  const latParts = parse(latest);
  
  for (let i = 0; i < Math.max(curParts.length, latParts.length); i++) {
    const c = curParts[i] || 0;
    const l = latParts[i] || 0;
    if (l > c) return true;
    if (c > l) return false;
  }
  return false;
}

export function openStoreLink(url: string) {
  Linking.canOpenURL(url).then((supported) => {
    if (supported) {
      Linking.openURL(url);
    } else {
      Linking.openURL(PLAY_STORE_URL);
    }
  }).catch(() => {
    Linking.openURL(PLAY_STORE_URL);
  });
}
