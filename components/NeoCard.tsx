import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors as StaticColors } from '@/constants/theme';
import { useDatabase } from '@/hooks/useDatabase';

interface NeoCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function NeoCard({ children, style }: NeoCardProps) {
  const { Colors } = useDatabase();
  return (
    <View style={[styles.card, { backgroundColor: Colors.card, borderColor: Colors.border, shadowColor: Colors.border }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: StaticColors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2.5,
    borderColor: StaticColors.border,
    shadowColor: StaticColors.border,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
});
