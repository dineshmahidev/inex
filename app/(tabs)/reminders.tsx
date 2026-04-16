import React, { useState, useMemo } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  Modal,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDatabase, Reminder } from '@/hooks/useDatabase';
import { Bell, Plus, CheckCircle2, Circle, Trash2, Calendar, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import { requestNotificationPermissions, scheduleReminderNotification } from '@/utils/notifications';
import LottieView from 'lottie-react-native';
import { FlowBannerAd } from '@/components/FlowBannerAd';

export default function RemindersScreen() {
  const { reminders, addReminder, deleteReminder, markReminderPaid, settings, Colors } = useDatabase();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [tick, setTick] = useState(0); // Trigger live updates

  // Live countdown update every minute
  React.useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);
  
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [type, setType] = useState<'loan' | 'emi' | 'bill'>('emi');
  const [date, setDate] = useState(new Date());
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);

  const currentMonth = new Date().toISOString().slice(0, 7);

  const pendingReminders = useMemo(() => {
    return reminders?.filter(r => r.lastPaidMonth !== currentMonth) || [];
  }, [reminders, currentMonth]);

  const paidReminders = useMemo(() => {
    return reminders?.filter(r => r.lastPaidMonth === currentMonth) || [];
  }, [reminders, currentMonth]);

  const handleAdd = async () => {
    if (!name || !amount || !dueDay) return;
    const remId = Date.now().toString();
    await addReminder({ name, amount: parseFloat(amount), dueDay: parseInt(dueDay), type });
    
    // Schedule Notification
    const hasPermission = await requestNotificationPermissions();
    if (hasPermission) {
        await scheduleReminderNotification(remId, name, parseFloat(amount), date);
    }

    setName(''); setAmount(''); setDueDay(''); setIsModalVisible(false);
    setDate(new Date());
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const getCountdown = (day: number) => {
    const now = new Date();
    const currentDay = now.getDate();
    let target = new Date(now.getFullYear(), now.getMonth(), day);

    if (currentDay > day) {
        // Due next month
        target = new Date(now.getFullYear(), now.getMonth() + 1, day);
    }

    const diffMs = target.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffDays > 0) return `${diffDays}d ${diffHours}h left`;
    if (diffHours > 0) return `${diffHours}h ${diffMins}m left`;
    if (diffMins > 0) return `${diffMins}m left`;
    return "Due Today!";
  };

  const mostUrgent = useMemo(() => {
    if (pendingReminders.length === 0) return null;
    return [...pendingReminders].sort((a,b) => {
        const now = new Date();
        const getT = (d: number) => {
            let t = new Date(now.getFullYear(), now.getMonth(), d);
            if (now.getDate() > d) t = new Date(now.getFullYear(), now.getMonth() + 1, d);
            return t.getTime();
        };
        return getT(a.dueDay) - getT(b.dueDay);
    })[0];
  }, [pendingReminders, tick]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: Colors.text }]}>Bills & EMIs</Text>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: Colors.primary }]} onPress={() => setIsModalVisible(true)}>
          <Plus color="#000" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {mostUrgent && (
            <View style={[styles.heroCard, { backgroundColor: Colors.primary }]}>
                <LottieView 
                    source={require('@/assets/Cycle Rider.json')}
                    style={styles.rider}
                    autoPlay
                    loop
                />
                <View style={styles.heroHeader}>
                    <Bell color="#000" size={16} />
                    <Text style={styles.heroLabel}>MOST URGENT PAYMENT</Text>
                </View>
                <Text style={styles.heroName} numberOfLines={1}>{mostUrgent.name}</Text>
                <View style={styles.heroTimeContainer}>
                    <Text style={styles.heroTime}>{getCountdown(mostUrgent.dueDay)}</Text>
                </View>
                <View style={styles.heroFooter}>
                    <Text style={styles.heroMeta}>DUE ON {mostUrgent.dueDay}TH • {settings.currency}{mostUrgent.amount.toLocaleString()}</Text>
                </View>
            </View>
        )}

        <Text style={[styles.sectionTitle, { color: Colors.textMuted }]}>Required Payments</Text>
        {pendingReminders.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: Colors.card, borderColor: Colors.border }]}><Text style={{ color: Colors.textMuted }}>No pending bills right now.</Text></View>
        ) : (
          pendingReminders.map(rem => (
            <TouchableOpacity key={rem.id} style={[styles.card, { backgroundColor: Colors.card, borderColor: Colors.border }]} onPress={() => {
                Alert.alert("Confirm Payment", `Pay ${settings.currency}${rem.amount}?`, [{text: "No"}, {text: "Pay", onPress: () => markReminderPaid(rem.id)}]);
            }}>
              <Circle size={26} color={Colors.secondary} />
              <View style={styles.cardInfo}>
                <Text style={[styles.cardName, { color: Colors.text }]}>{rem.name}</Text>
                <View style={styles.countdownRow}>
                    <Text style={{ color: Colors.textMuted, fontSize: 11 }}>DUE ON {rem.dueDay}TH • </Text>
                    <View style={[styles.countdownBadge, { backgroundColor: Colors.primary + '20' }]}>
                        <Text style={[styles.countdownText, { color: Colors.primary }]}>{getCountdown(rem.dueDay)}</Text>
                    </View>
                </View>
              </View>
              <Text style={[styles.cardAmount, { color: Colors.text }]}>{settings.currency}{rem.amount.toLocaleString()}</Text>
            </TouchableOpacity>
          ))
        )}

        {paidReminders.length > 0 && (
          <View style={{ marginTop: 25 }}>
            <Text style={[styles.sectionTitle, { color: Colors.textMuted }]}>Settled This Month</Text>
            {paidReminders.map(rem => (
              <View key={rem.id} style={[styles.card, { backgroundColor: Colors.card, borderColor: Colors.border, opacity: 0.5 }]}>
                <CheckCircle2 size={26} color={Colors.primary} />
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardName, { color: Colors.text }]}>{rem.name}</Text>
                  <Text style={{ color: Colors.textMuted, fontSize: 11 }}>COMPLETED</Text>
                </View>
                <TouchableOpacity onPress={() => deleteReminder(rem.id)}><Trash2 size={18} color={Colors.textMuted} /></TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: Colors.card, borderColor: Colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: Colors.text }]}>New Payment Goal</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}><X color={Colors.text} size={24} /></TouchableOpacity>
            </View>
            
            <TextInput style={[styles.input, { backgroundColor: Colors.background, color: Colors.text, borderColor: Colors.border }]} placeholder="Bill Name" placeholderTextColor={Colors.textMuted} value={name} onChangeText={setName} />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 15 }}>
              <TextInput style={[styles.input, { flex: 1, backgroundColor: Colors.background, color: Colors.text, borderColor: Colors.border }]} placeholder="Amount" placeholderTextColor={Colors.textMuted} keyboardType="numeric" value={amount} onChangeText={setAmount} />
              <TextInput style={[styles.input, { width: 80, backgroundColor: Colors.background, color: Colors.text, borderColor: Colors.border }]} placeholder="Day" placeholderTextColor={Colors.textMuted} keyboardType="numeric" value={dueDay} onChangeText={setDueDay} />
            </View>
            
            <View style={{ marginTop: 20 }}>
                <Text style={[styles.sectionTitle, { color: Colors.textMuted }]}>Schedule Alert (Optional)</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity 
                        style={[styles.pickerBtn, { backgroundColor: Colors.background, borderColor: Colors.border }]}
                        onPress={() => setShowDate(true)}
                    >
                        <Calendar size={18} color={Colors.primary} />
                        <Text style={{ color: Colors.text, fontSize: 13, fontWeight: '700' }}>{date.toLocaleDateString()}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.pickerBtn, { backgroundColor: Colors.background, borderColor: Colors.border }]}
                        onPress={() => setShowTime(true)}
                    >
                        <Bell size={18} color={Colors.primary} />
                        <Text style={{ color: Colors.text, fontSize: 13, fontWeight: '700' }}>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {showDate && (
                <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    onChange={(e, d) => {
                        setShowDate(false);
                        if(d) setDate(d);
                    }}
                />
            )}
            {showTime && (
                <DateTimePicker
                    value={date}
                    mode="time"
                    display="default"
                    onChange={(e, d) => {
                        setShowTime(false);
                        if(d) setDate(d);
                    }}
                />
            )}
            
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: Colors.primary }]} onPress={handleAdd}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Save Goal</Text>
            </TouchableOpacity>

            <FlowBannerAd />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24 },
  title: { fontSize: 32, fontWeight: '900' },
  addBtn: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20 },
  heroCard: { padding: 25, borderRadius: 36, marginBottom: 30, elevation: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, overflow: 'hidden' },
  rider: { position: 'absolute', top: 5, right: 0, width: 100, height: 100, transform: [{ scaleX: -1 }] },
  heroHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, opacity: 0.8 },
  heroLabel: { fontSize: 10, fontWeight: '900', color: '#000', letterSpacing: 1.5 },
  heroName: { fontSize: 28, fontWeight: '900', color: '#000', marginBottom: 15, letterSpacing: -1 },
  heroTimeContainer: { backgroundColor: 'rgba(0,0,0,0.1)', padding: 20, borderRadius: 24, alignItems: 'center', marginBottom: 15 },
  heroTime: { fontSize: 36, fontWeight: '900', color: '#000' },
  heroFooter: { borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.1)', paddingTop: 15 },
  heroMeta: { fontSize: 12, fontWeight: 'bold', color: '#000', opacity: 0.7 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12, marginLeft: 4 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 28, marginBottom: 12, borderWidth: 1 },
  cardInfo: { flex: 1, marginLeft: 16 },
  countdownRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  countdownBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  countdownText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  cardName: { fontSize: 17, fontWeight: '700' },
  cardAmount: { fontSize: 17, fontWeight: '900' },
  emptyCard: { padding: 40, alignItems: 'center', borderRadius: 28, borderWidth: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 36, borderTopRightRadius: 36, padding: 24, borderWidth: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  modalTitle: { fontSize: 22, fontWeight: 'bold' },
  input: { padding: 20, borderRadius: 20, borderWidth: 1, fontSize: 16 },
  pickerBtn: { flex: 1, height: 56, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1 },
  saveBtn: { height: 64, borderRadius: 22, padding: 18, alignItems: 'center', marginTop: 25 },
  adPlaceholder: {
    height: 60,
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 5,
    opacity: 0.6
  },
  adLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1
  }
});
