import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/constants/theme';

interface NeoCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function NeoCard({ children, style }: NeoCardProps) {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2.5,
    borderColor: Colors.border,
    shadowColor: Colors.border,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0, // Disable Android default shadow as we emulate it if possible, but Android elevation doesn't do hard shadows well. We might need a wrapper for Android if this fails, but stick to standard shadow properties first.
  },
});
