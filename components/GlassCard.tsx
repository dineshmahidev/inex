import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors as StaticColors } from '@/constants/theme';
import { useDatabase } from '@/hooks/useDatabase';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function GlassCard({ children, style }: GlassCardProps) {
  const { Colors } = useDatabase();
  return (
    <View style={[styles.card, { backgroundColor: Colors.card, borderColor: Colors.border }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: StaticColors.card,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: StaticColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
});
