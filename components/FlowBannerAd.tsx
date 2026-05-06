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

  // Use real Ad if available, otherwise show the elite mock
  if (BannerAd && !adFailed) {
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
  }

  // Fallback Mock UI (Elite version)
  return (
    <View style={styles.testAdBody}>
      <View style={styles.adBadge}><Text style={styles.adBadgeText}>Ad</Text></View>
      <Text style={styles.testAdTitle}>Tracksy Ad Spot</Text>
      <Text style={styles.testAdDesc}>Real Google Ads will appear here in the native build. Ready for production.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 10,
    minHeight: 60
  },
  testAdBody: {
    height: 60,
    width: '100%',
    backgroundColor: '#F1F1F1',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    overflow: 'hidden',
    marginVertical: 10
  },
  adBadge: {
    backgroundColor: '#FF7A00',
    paddingHorizontal: 4,
    borderRadius: 2,
    marginRight: 10
  },
  adBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff'
  },
  testAdTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10
  },
  testAdDesc: {
    flex: 1,
    fontSize: 10,
    color: '#666'
  }
});
