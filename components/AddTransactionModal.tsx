import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatInputWithCommas } from '@/constants/theme';
import { useDatabase } from '@/hooks/useDatabase';
import * as Haptics from 'expo-haptics';
import { interstitialAdManager } from '@/utils/ads';

const { width } = Dimensions.get('window');

const EMOJI_MAP: Record<string, string> = {
  'Food & Dining': '🍔',
  'Travel & Cabs': '🚕',
  'Home Bills': '🏠',
  'EMI & Loans': '💳',
  'Salary': '💼',
  'Other Income': '✨',
  'Shopping': '🛍️',
  'Health': '💊',
  'Entertainment': '🎬',
  'Education': '📚',
};

interface AddTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (tx: any) => void;
  initialData?: any;
  onUpdate?: (id: string, tx: any) => void;
}

export function AddTransactionModal({
  visible,
  onClose,
  onAdd,
  initialData,
  onUpdate,
}: AddTransactionModalProps) {
  const { categories, detectCategory, Colors } = useDatabase();
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');
  const [isAiSuggesting, setIsAiSuggesting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible && initialData) {
      setType(initialData.type);
      setAmount(formatInputWithCommas(initialData.amount.toString()));
      setCategoryId(initialData.categoryId);
      setNote(initialData.note || '');
    } else if (visible) {
      reset();
    }
  }, [visible, initialData]);

  useEffect(() => {
    if (visible) setIsSubmitting(false);
  }, [visible]);

  useEffect(() => {
    if (!initialData && note.length > 3) {
      const detected = detectCategory(note);
      if (detected && detected !== categoryId) {
        setCategoryId(detected);
        setIsAiSuggesting(true);
        setTimeout(() => setIsAiSuggesting(false), 2000);
      }
    }
  }, [note]);

  const reset = () => {
    setAmount('');
    setNote('');
    setCategoryId('');
    setType('expense');
  };

  const handleSave = async () => {
    if (isSubmitting) return;
    const cleanAmountStr = amount.replace(/,/g, '');
    if (!cleanAmountStr || !categoryId) {
      Alert.alert('Missing Info', 'Please enter an amount and select a category.');
      return;
    }
    setIsSubmitting(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const parsedAmount = parseFloat(cleanAmountStr);
      if (initialData && onUpdate) {
        await onUpdate(initialData.id, {
          amount: parsedAmount, type, categoryId, note, date: initialData.date,
        });
      } else {
        await onAdd({ amount: parsedAmount, type, categoryId, note, date: new Date().toISOString() });
        interstitialAdManager.showAd();
      }
      onClose();
    } catch (e) {
      console.error('Failed to save transaction', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCats = categories.filter((c) => c.type === type);
  const isIncome = type === 'income';

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.fullScreenContainer} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.fullScreenContent}
          >
            {/* Title */}
            <View style={styles.sheetTitleRow}>
              <Text style={styles.sheetTitle}>
                {initialData ? '✏️ Edit Transaction' : '💸 New Transaction'}
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.sheetClose}>
                <Text style={styles.sheetCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Income / Expense Toggle */}
            <View style={styles.typeToggle}>
              <TouchableOpacity
                style={[styles.typeBtn, isIncome && styles.typeBtnIncome]}
                onPress={() => setType('income')}
              >
                <Text style={styles.typeBtnIcon}>📈</Text>
                <Text style={[styles.typeBtnText, isIncome && styles.typeBtnTextActive]}>
                  Income
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, !isIncome && styles.typeBtnExpense]}
                onPress={() => setType('expense')}
              >
                <Text style={styles.typeBtnIcon}>📉</Text>
                <Text style={[styles.typeBtnText, !isIncome && styles.typeBtnTextActive]}>
                  Expense
                </Text>
              </TouchableOpacity>
            </View>

            {/* Amount Input */}
            <View style={[styles.amountBox, { borderColor: isIncome ? '#10B981' : Colors.primary }]}>
              <Text style={[styles.amountPrefix, { color: isIncome ? '#10B981' : Colors.primary }]}>
                {isIncome ? '+' : '-'}
              </Text>
              <TextInput
                style={[styles.amountInput, { color: isIncome ? '#10B981' : Colors.primary }]}
                placeholder="0.00"
                placeholderTextColor="#D1D5DB"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={(text) => setAmount(formatInputWithCommas(text))}
                autoFocus
              />
            </View>

            {/* Note Input */}
            <View style={styles.noteBox}>
              <Text style={styles.inputLabel}>📝 Note</Text>
              <TextInput
                style={styles.noteInput}
                placeholder="What was this for?"
                placeholderTextColor="#9CA3AF"
                value={note}
                onChangeText={setNote}
                multiline
              />
              {isAiSuggesting && (
                <View style={styles.aiTag}>
                  <Text style={styles.aiTagText}>✨ AI auto-categorized</Text>
                </View>
              )}
            </View>

            {/* Category Picker */}
            <Text style={styles.inputLabel}>🏷️ Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.catScroll}
              contentContainerStyle={styles.catScrollContent}
            >
              {filteredCats.map((cat) => {
                const isSelected = categoryId === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.catChip,
                      isSelected && { backgroundColor: cat.color + '20', borderColor: cat.color, borderWidth: 1.5 },
                    ]}
                    onPress={() => setCategoryId(cat.id)}
                  >
                    <Text style={styles.catChipEmoji}>
                      {EMOJI_MAP[cat.name] || '📌'}
                    </Text>
                    <Text style={[styles.catChipText, isSelected && { color: cat.color }]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Save Button */}
            <TouchableOpacity
              style={[
                styles.saveBtn,
                { backgroundColor: isIncome ? '#10B981' : Colors.primary, shadowColor: isIncome ? '#10B981' : Colors.primary },
                isSubmitting && { opacity: 0.7 },
              ]}
              onPress={handleSave}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              <Text style={styles.saveBtnText}>
                {isSubmitting ? 'Saving…' : initialData ? 'Update Transaction' : '+ Add Transaction'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: { flex: 1, backgroundColor: '#FFFFFF' },
  fullScreenContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 34 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  dismissArea: { flex: 1 },

  sheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  scrollContent: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16 },

  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: '#171717' },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { fontSize: 14, color: '#6B7280', fontWeight: '700' },
  sheetClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCloseText: { fontSize: 14, color: '#6B7280', fontWeight: '700' },

  // Type Toggle
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 18,
    padding: 5,
    marginBottom: 20,
    gap: 6,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
  },
  typeBtnIncome: {
    backgroundColor: '#DCFCE7',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  typeBtnExpense: {
    backgroundColor: '#FFF0F6',
    shadowColor: '#F472B6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  typeBtnIcon: { fontSize: 18 },
  typeBtnText: { fontSize: 15, fontWeight: '700', color: '#9CA3AF' },
  typeBtnTextActive: { color: '#171717' },

  // Amount
  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 20,
  },
  amountPrefix: { fontSize: 36, fontWeight: '900', marginRight: 4 },
  amountInput: { flex: 1, fontSize: 40, fontWeight: '900', letterSpacing: -1 },

  // Note
  noteBox: { marginBottom: 20, position: 'relative' },
  inputLabel: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 },
  noteInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 14,
    fontSize: 15,
    color: '#171717',
    minHeight: 64,
    textAlignVertical: 'top',
  },
  aiTag: {
    position: 'absolute',
    bottom: -20,
    right: 0,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  aiTagText: { fontSize: 11, color: '#10B981', fontWeight: '700' },

  // Category
  catScroll: { marginBottom: 24, marginHorizontal: -24 },
  catScrollContent: { paddingHorizontal: 24, gap: 10 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#F3F4F6',
  },
  catChipEmoji: { fontSize: 18 },
  catChipText: { fontSize: 13, fontWeight: '700', color: '#6B7280' },

  // Save
  saveBtn: {
    borderRadius: 20,
    paddingVertical: 17,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
