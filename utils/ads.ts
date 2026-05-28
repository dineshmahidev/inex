import { ADMOB_CONFIG } from '@/constants/Ads';

let InterstitialAd: any;
let AdEventType: any;
let TestIds: any;

try {
  const Ads = require('react-native-google-mobile-ads');
  InterstitialAd = Ads.InterstitialAd;
  AdEventType = Ads.AdEventType;
  TestIds = Ads.TestIds;
} catch (e) {
  InterstitialAd = null;
}

class AdManager {
  private interstitial: any = null;
  private isLoaded = false;
  private isLoading = false;

  constructor() {
    this.init();
  }

  public init() {
    return; // ADS DISABLED FOR NOW
    if (!InterstitialAd) {
      console.log('react-native-google-mobile-ads module is not available.');
      return;
    }
    try {
      const adUnitId = __DEV__ 
        ? TestIds.INTERSTITIAL 
        : (ADMOB_CONFIG.interstitialAdUnitId || TestIds.INTERSTITIAL);

      console.log('Initializing InterstitialAd with Unit ID:', adUnitId);

      this.interstitial = InterstitialAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: true,
      });

      this.interstitial.addAdEventListener(AdEventType.LOADED, () => {
        this.isLoaded = true;
        this.isLoading = false;
        console.log('Interstitial ad successfully loaded.');
      });

      this.interstitial.addAdEventListener(AdEventType.ERROR, (error: any) => {
        this.isLoaded = false;
        this.isLoading = false;
        console.warn('Interstitial ad failed to load:', error);
      });

      this.interstitial.addAdEventListener(AdEventType.CLOSED, () => {
        this.isLoaded = false;
        this.isLoading = false;
        console.log('Interstitial ad closed by user. Preloading next...');
        this.load(); // Preload for the next action
      });

      this.load();
    } catch (e) {
      console.warn('Failed to init Interstitial AdManager:', e);
    }
  }

  public load() {
    return; // ADS DISABLED FOR NOW
    if (!this.interstitial || this.isLoaded || this.isLoading) return;
    try {
      this.isLoading = true;
      this.interstitial.load();
    } catch (e) {
      this.isLoading = false;
      console.warn('Failed to load Interstitial ad:', e);
    }
  }

  public showAd() {
    return; // ADS DISABLED FOR NOW
    if (!InterstitialAd) {
      console.log('AdMob is not available in this environment.');
      return;
    }
    try {
      if (this.isLoaded && this.interstitial) {
        console.log('Showing Interstitial Ad...');
        this.interstitial.show();
      } else {
        console.log('Ad not loaded yet. Attempting to load in background...');
        this.load();
      }
    } catch (e) {
      console.warn('Error displaying Interstitial ad:', e);
    }
  }
}

export const interstitialAdManager = new AdManager();
