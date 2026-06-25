import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import { useDatabase } from '@/hooks/useDatabase';

interface NeoButtonProps {
  onPress?: () => void;
  title?: string;
  children?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  color?: string;
  disabled?: boolean;
}

export function NeoButton({ onPress, title, children, style, textStyle, color, disabled = false }: NeoButtonProps) {
  const { Colors } = useDatabase();
  const buttonColor = color || Colors.primary;
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  const handlePressIn = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(pan, {
      toValue: { x: 4, y: 4 },
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    Animated.spring(pan, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={disabled}
      style={{ position: 'relative' }}
    >
      {/* Background shadow layer */}
      <Animated.View style={[styles.shadowLayer, { backgroundColor: Colors.border }, style, { borderRadius: style?.borderRadius || 16 }]} />
      
      {/* Foreground interactive layer */}
      <Animated.View
        style={[
          styles.button,
          { borderColor: Colors.border },
          style,
          { backgroundColor: disabled ? Colors.textMuted : buttonColor },
          { transform: pan.getTranslateTransform() }
        ]}
      >
        {children ? children : (
          <Text style={[styles.text, { color: Colors.text }, textStyle]}>{title}</Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shadowLayer: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: -4,
    bottom: -4,
    backgroundColor: Colors.border,
    borderRadius: 16,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    // We use actual translation instead of CSS shadow so we get a real physical press effect
  },
  text: {
    color: Colors.text,
    fontWeight: '900',
    fontSize: 16,
    textTransform: 'uppercase',
  }
});
