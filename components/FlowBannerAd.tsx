import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ADMOB_CONFIG } from '@/constants/Ads';

let BannerAd: any;
let BannerAdSize: any;
let TestIds: any;

try {
  // Attempt to load the native ad components
  const Ads = require('react-native-google-mobile-ads');
  BannerAd = Ads.BannerAd;
  BannerAdSize = Ads.BannerAdSize;
  TestIds = Ads.TestIds;
} catch (e) {
  // Native module not available (e.g. Expo Go)
  BannerAd = null;
}

export const FlowBannerAd = () => {
  const [adFailed, setAdFailed] = React.useState(false);

  // Hide completely if native ads aren't built or if they fail to load
  if (!BannerAd || adFailed) {
    return null;
  }

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={__DEV__ ? TestIds.BANNER : ADMOB_CONFIG.bannerAdUnitId}
        size={BannerAdSize.BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdFailedToLoad={(error: any) => {
          console.warn('Ad failed to load: ', error);
          setAdFailed(true);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 10,
    minHeight: 60
  }
});
