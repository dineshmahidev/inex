import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import LottieView from 'lottie-react-native';

const { width, height } = Dimensions.get('window');

interface Props {
  ready: boolean;
  onFinish: () => void;
  color?: string;
}

const features = [
  { text: "Your Habit Tracker", color: "#F472B6", anim: require('../assets/cycle_rider.json') },
  { text: "Your Income Expense Tracker", color: "#FB923C", anim: require('../assets/Super hero.json') },
  { text: "Your Sticky Note Buddy", color: "#FBBF24", anim: require('../assets/Smiley.json') },
  { text: "Your Todo Partner", color: "#34D399", anim: require('../assets/running pigeon.json') },
  { text: "Your Bill Reminder", color: "#60A5FA", anim: require('../assets/Cartoon Tooth Character.json') },
];

export default function AnimatedSplash({ ready, onFinish, color = '#F472B6' }: Props) {
  const logoScale = useRef(new Animated.Value(0.4)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  
  const textTranslateY = useRef(new Animated.Value(20)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  
  const containerOpacity = useRef(new Animated.Value(1)).current;

  const [featureIndex, setFeatureIndex] = useState(0);
  const featureFade = useRef(new Animated.Value(0)).current;
  const featureSlide = useRef(new Animated.Value(15)).current;

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

  // Cycle features
  useEffect(() => {
    const cycleAnimation = () => {
      featureSlide.setValue(20);
      Animated.sequence([
        Animated.parallel([
          Animated.timing(featureFade, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.spring(featureSlide, { toValue: 0, friction: 7, tension: 40, useNativeDriver: true })
        ]),
        Animated.delay(1000),
        Animated.timing(featureFade, { toValue: 0, duration: 400, useNativeDriver: true })
      ]).start();
    };

    // start the first animation slightly after the logo appears
    setTimeout(() => {
      cycleAnimation();
      const interval = setInterval(() => {
        setFeatureIndex((prev) => (prev + 1) % features.length);
        cycleAnimation();
      }, 1800);
      return () => clearInterval(interval);
    }, 1000);
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

  const currentFeature = features[featureIndex];

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity, backgroundColor: '#FFFFFF' }]}>
      <StatusBar backgroundColor="transparent" style="dark" translucent={true} />
      
      <Animated.View style={{ 
        position: 'absolute',
        top: 90,
        width: '100%',
        opacity: featureFade, 
        transform: [{ translateY: featureSlide }],
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        zIndex: 10,
      }}>
        <Text style={[styles.featureText, { color: currentFeature.color }]}>
          {currentFeature.text}
        </Text>
      </Animated.View>

      <View style={[styles.content, { transform: [{ translateY: -40 }] }]}>
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
            marginTop: 16,
            alignItems: 'center',
          }}
        >
          <Text style={styles.brandText}>Tracksy</Text>
        </Animated.View>
      </View>

      <Animated.View 
        style={[
          styles.lottieContainer, 
          { opacity: featureFade }
        ]}
      >
        <LottieView
          key={featureIndex} // force re-render on change
          source={currentFeature.anim}
          autoPlay
          loop
          style={styles.lottie}
        />
      </Animated.View>
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
    width: 170,
    height: 170,
  },
  brandText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#171717',
    letterSpacing: 1.5,
  },
  featureText: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.05)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  lottieContainer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  lottie: {
    width: 220,
    height: 220,
  }
});
