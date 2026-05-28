import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Currency, formatWithCommas } from '@/constants/theme';
import { NeoCard } from './NeoCard';

interface BudgetProgressProps {
  spent: number;
  limit: number;
}

export function BudgetProgress({ spent, limit }: BudgetProgressProps) {
  const percentage = Math.min((spent / limit) * 100, 100);
  const remaining = Math.max(limit - spent, 0);
  const color = percentage > 90 ? Colors.secondary : percentage > 70 ? '#F59E0B' : Colors.primary;

  return (
    <NeoCard style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Monthly Budget</Text>
        <Text style={styles.amount}>{Currency}{formatWithCommas(limit)}</Text>
      </View>
      
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: color }]} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Spent: {Currency}{formatWithCommas(spent)}</Text>
        <Text style={styles.footerText}>Remains: {Currency}{formatWithCommas(remaining)}</Text>
      </View>
    </NeoCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  amount: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  progressBg: {
    height: 16,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 2.5,
    borderColor: '#171717',
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
});
