import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Image, StyleSheet, View } from 'react-native';
import { Wallet, TrendingUp, TrendingDown, Target, Sparkles, Shield, Bell, Calendar, CheckCircle2, Zap, Brain, Activity } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

const ICONS = [
  { Icon: Wallet, x: width * 0.1, y: height * 0.2, size: 22, color: '#171717', delay: 100 },
  { Icon: TrendingUp, x: width * 0.78, y: height * 0.16, size: 20, color: '#171717', delay: 250 },
  { Icon: Target, x: width * 0.15, y: height * 0.52, size: 18, color: '#171717', delay: 400 },
  { Icon: Sparkles, x: width * 0.82, y: height * 0.45, size: 20, color: '#171717', delay: 550 },
  { Icon: Shield, x: width * 0.08, y: height * 0.76, size: 20, color: '#171717', delay: 700 },
  { Icon: Bell, x: width * 0.75, y: height * 0.78, size: 18, color: '#171717', delay: 850 },
  { Icon: Calendar, x: width * 0.5, y: height * 0.1, size: 20, color: '#171717', delay: 1000 },
  { Icon: CheckCircle2, x: width * 0.88, y: height * 0.65, size: 18, color: '#171717', delay: 1150 },
  { Icon: Zap, x: width * 0.22, y: height * 0.36, size: 16, color: '#171717', delay: 1300 },
  { Icon: Brain, x: width * 0.72, y: height * 0.33, size: 18, color: '#171717', delay: 1450 },
  { Icon: Activity, x: width * 0.45, y: height * 0.84, size: 18, color: '#171717', delay: 1600 },
  { Icon: TrendingDown, x: width * 0.85, y: height * 0.88, size: 16, color: '#171717', delay: 1750 },
];

interface Props {
  ready: boolean;
  onFinish: () => void;
}

export default function AnimatedSplash({ ready, onFinish }: Props) {
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const iconAnims = useRef(ICONS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.stagger(150, iconAnims.map((anim, i) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: ICONS[i].delay,
        useNativeDriver: true,
      })
    )).start();
  }, []);

  useEffect(() => {
    Animated.sequence([
      Animated.delay(800),
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, friction: 4, tension: 40, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  useEffect(() => {
    if (ready) {
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => onFinish());
    }
  }, [ready]);

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
      {ICONS.map(({ Icon, x, y, size, color }, i) => (
        <Animated.View
          key={i}
          style={[
            styles.iconWrapper,
            {
              left: x, top: y,
              opacity: iconAnims[i],
              transform: [
                { translateY: iconAnims[i].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
                { scale: iconAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) },
              ],
            },
          ]}
        >
          <Icon size={size} color={color} strokeWidth={1.5} />
        </Animated.View>
      ))}

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
          source={require('../assets/app_logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fcd002',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
  },
  iconWrapper: {
    position: 'absolute',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 130,
    height: 130,
  },
});
