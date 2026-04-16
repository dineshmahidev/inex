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
  Alert
} from 'react-native';
import { Colors } from '@/constants/theme';
import { useDatabase } from '@/hooks/useDatabase';
import { X, Mic, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface AddTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (tx: any) => void;
  initialData?: any;
  onUpdate?: (id: string, tx: any) => void;
}

export function AddTransactionModal({ visible, onClose, onAdd, initialData, onUpdate }: AddTransactionModalProps) {
  const { categories, detectCategory, Colors } = useDatabase();
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');
  const [isAiSuggesting, setIsAiSuggesting] = useState(false);

  useEffect(() => {
    if (visible && initialData) {
      setType(initialData.type);
      setAmount(initialData.amount.toString());
      setCategoryId(initialData.categoryId);
      setNote(initialData.note);
    } else if (visible) {
      reset();
    }
  }, [visible, initialData]);

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

  const handleAdd = () => {
    if (!amount || !categoryId) {
      Alert.alert("Missing Info", "Please enter amount and category");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (initialData && onUpdate) {
        onUpdate(initialData.id, {
            amount: parseFloat(amount),
            type,
            categoryId,
            note,
            date: initialData.date,
        });
    } else {
        onAdd({
            amount: parseFloat(amount),
            type,
            categoryId,
            note,
            date: new Date().toISOString(),
        });
    }
    onClose();
  };

  const reset = () => {
    setAmount('');
    setNote('');
    setCategoryId('');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.content, { backgroundColor: Colors.card }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: Colors.text }]}>{initialData ? 'Edit Transaction' : 'New Transaction'}</Text>
            <TouchableOpacity onPress={onClose}><X color={Colors.text} size={24} /></TouchableOpacity>
          </View>

          <View style={[styles.typeSwitcher, { backgroundColor: Colors.background }]}>
            <TouchableOpacity style={[styles.typeBtn, type === 'income' && styles.typeBtnActiveIn]} onPress={() => setType('income')}>
              <Text style={[styles.typeBtnText, type === 'income' ? styles.textWhite : { color: Colors.textMuted }]}>Income</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.typeBtn, type === 'expense' && styles.typeBtnActiveEx]} onPress={() => setType('expense')}>
              <Text style={[styles.typeBtnText, type === 'expense' ? styles.textWhite : { color: Colors.textMuted }]}>Expense</Text>
            </TouchableOpacity>
          </View>

          <TextInput 
            style={[styles.amountInput, { color: Colors.text }]}
            placeholder="₹0.00"
            placeholderTextColor={Colors.textMuted}
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
            autoFocus
          />

          <View style={styles.noteContainer}>
            <TextInput 
              style={[styles.noteInput, { color: Colors.text, borderColor: Colors.border }]}
              placeholder="What was this for? (e.g. Pizza with friends)"
              placeholderTextColor={Colors.textMuted}
              value={note}
              onChangeText={setNote}
              multiline
            />
            {isAiSuggesting && (
              <View style={styles.aiLabel}>
                <Sparkles size={10} color={Colors.primary} />
                <Text style={[styles.aiLabelText, { color: Colors.primary }]}>AI Categorized</Text>
              </View>
            )}
          </View>

          <Text style={[styles.sectionLabel, { color: Colors.textMuted }]}>Select Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
            {categories.filter(c => c.type === type).map(cat => (
              <TouchableOpacity 
                key={cat.id} 
                style={[styles.catItem, { backgroundColor: Colors.background, borderColor: Colors.border }, categoryId === cat.id && { backgroundColor: cat.color + '20', borderColor: cat.color }]}
                onPress={() => setCategoryId(cat.id)}
              >
                <Text style={[styles.catText, { color: Colors.textMuted }, categoryId === cat.id && { color: cat.color }]}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: Colors.primary }]} onPress={handleAdd}>
            <Text style={[styles.saveBtnText, { color: Colors.background }]}>Record Transaction</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  content: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 20, fontWeight: 'bold' },
  typeSwitcher: { flexDirection: 'row', borderRadius: 16, padding: 4, marginBottom: 24 },
  typeBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  typeBtnActiveIn: { backgroundColor: '#10B981' },
  typeBtnActiveEx: { backgroundColor: '#EF4444' },
  typeBtnText: { fontWeight: '700' },
  textWhite: { color: '#fff' },
  amountInput: { fontSize: 48, fontWeight: '800', textAlign: 'center', marginBottom: 24 },
  noteContainer: { marginBottom: 24 },
  noteInput: { fontSize: 16, borderBottomWidth: 1, paddingVertical: 12 },
  aiLabel: { flexDirection: 'row', alignItems: 'center', gap: 4, position: 'absolute', right: 0, bottom: -20 },
  aiLabelText: { fontSize: 10, fontWeight: '600' },
  sectionLabel: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
  catScroll: { marginBottom: 32 },
  catItem: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, marginRight: 8, borderWidth: 1 },
  catText: { fontWeight: '600' },
  saveBtn: { paddingVertical: 18, borderRadius: 16, alignItems: 'center', marginBottom: 20 },
  saveBtnText: { fontSize: 16, fontWeight: 'bold' },
});
