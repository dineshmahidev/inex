import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

interface Props {
  ready: boolean;
  onFinish: () => void;
  color?: string;
}

export default function AnimatedSplash({ ready, onFinish, color = '#F472B6' }: Props) {
  const logoScale = useRef(new Animated.Value(0.4)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  
  const textTranslateY = useRef(new Animated.Value(20)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  
  const containerOpacity = useRef(new Animated.Value(1)).current;

  // Spring entry for central logo and text
  useEffect(() => {
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      // After logo appears, slide up the text
      Animated.parallel([
        Animated.spring(textTranslateY, {
          toValue: 0,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  // Smooth container fade-out when application is ready
  useEffect(() => {
    if (ready) {
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 500,
        delay: 800, // Show the animation for a moment even if ready instantly
        useNativeDriver: true,
      }).start(() => onFinish());
    }
  }, [ready]);

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity, backgroundColor: '#FFFFFF' }]}>
      <StatusBar backgroundColor="transparent" style="dark" translucent={true} />
      {/* Container for logo and text */}
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Image
            source={require('../assets/splash_logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View
          style={{
            opacity: textOpacity,
            transform: [{ translateY: textTranslateY }],
            marginTop: 24,
          }}
        >
          <Text style={styles.brandText}>Tracksy</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 220,
    height: 220,
  },
  brandText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#171717',
    letterSpacing: 1.5,
  },
});
