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
import { Bell, Plus, CheckCircle2, Circle, Trash2, Calendar, X, Clock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import { requestNotificationPermissions, cancelReminderNotification, scheduleReminderNotification, scheduleMonthlyReminderNotification } from '@/utils/notifications';
import LottieView from 'lottie-react-native';
import { FlowBannerAd } from '@/components/FlowBannerAd';

export default function RemindersScreen() {
  const { reminders, addReminder, updateReminder, deleteReminder, markReminderPaid, settings, Colors, smsBills, setSmsBills } = useDatabase();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [tick, setTick] = useState(0); // Trigger live updates
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'required' | 'sms'>('required');
  
  const isSelectionMode = selectedIds.length > 0;

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const deleteSelected = () => {
    Alert.alert(
      "Delete Selected?",
      `Remove ${selectedIds.length} bills/reminders?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: async () => {
          for (const id of selectedIds) {
            await deleteReminder(id);
          }
          setSelectedIds([]);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }}
      ]
    );
  };

  const markSelectedPaid = () => {
    Alert.alert(
      "Mark Selected Paid?",
      `Mark ${selectedIds.length} bills as paid?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Mark Paid", style: "default", onPress: async () => {
          for (const id of selectedIds) {
            await markReminderPaid(id);
          }
          setSelectedIds([]);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }}
      ]
    );
  };


  // Live countdown update every minute
  React.useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);
  
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [type, setType] = useState<'loan' | 'emi' | 'bill'>('emi');
  const [totalMonths, setTotalMonths] = useState('');
  const [alertType, setAlertType] = useState<'on_day' | '2_days_before' | 'both' | 'none' | 'custom'>('none');
  const [date, setDate] = useState(new Date(Date.now() + 5 * 60000));
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  
  const [editingRemId, setEditingRemId] = useState<string | null>(null);

  const handleOpenModal = (rem?: Reminder) => {
      if (rem) {
          setEditingRemId(rem.id);
          setName(rem.name);
          setAmount(rem.amount.toString());
          setDueDay(rem.dueDay.toString());
          setType(rem.type);
          setTotalMonths(rem.totalMonths ? rem.totalMonths.toString() : '');
          setAlertType(rem.alertType || 'none');
          setDate(rem.customDate ? new Date(rem.customDate) : new Date(Date.now() + 5 * 60000));
      } else {
          setEditingRemId(null);
          setName('');
          setAmount('');
          setDueDay('');
          setType('emi');
          setTotalMonths('');
          setAlertType('none');
          setDate(new Date(Date.now() + 5 * 60000));
      }
      setIsModalVisible(true);
  };

  const currentMonth = new Date().toISOString().slice(0, 7);

  const pendingReminders = useMemo(() => {
    return reminders?.filter(r => r.lastPaidMonth !== currentMonth && !r.isCompleted) || [];
  }, [reminders, currentMonth]);

  const paidReminders = useMemo(() => {
    return reminders?.filter(r => r.lastPaidMonth === currentMonth && !r.isCompleted) || [];
  }, [reminders, currentMonth]);

  const completedReminders = useMemo(() => {
    return reminders?.filter(r => r.isCompleted) || [];
  }, [reminders]);

  const handleSave = async () => {
    if (!name || !amount || !dueDay) return;
    
    const parsedAmount = parseFloat(amount);
    const parsedDueDay = parseInt(dueDay);
    const parsedTotalMonths = totalMonths ? parseInt(totalMonths) : undefined;

    if (editingRemId) {
        await updateReminder(editingRemId, { name, amount: parsedAmount, dueDay: parsedDueDay, type, totalMonths: parsedTotalMonths, alertType, customDate: date.toISOString() });
        if (alertType === 'custom') {
            const hasPermission = await requestNotificationPermissions();
            if (hasPermission) {
                await scheduleReminderNotification(editingRemId, name, parsedAmount, date);
            }
        } else if (alertType !== 'none') {
            const hasPermission = await requestNotificationPermissions();
            if (hasPermission) {
                await scheduleMonthlyReminderNotification(editingRemId, name, parsedAmount, parsedDueDay, alertType);
            }
        } else {
            await cancelReminderNotification(editingRemId);
        }
    } else {
        const remId = Date.now().toString();
        await addReminder({ name, amount: parsedAmount, dueDay: parsedDueDay, type, totalMonths: parsedTotalMonths, alertType, paidMonths: 0, customDate: date.toISOString() });
        if (alertType === 'custom') {
            const hasPermission = await requestNotificationPermissions();
            if (hasPermission) {
                await scheduleReminderNotification(remId, name, parsedAmount, date);
            }
        } else if (alertType !== 'none') {
            const hasPermission = await requestNotificationPermissions();
            if (hasPermission) {
                await scheduleMonthlyReminderNotification(remId, name, parsedAmount, parsedDueDay, alertType);
            }
        }
    }

    setName(''); setAmount(''); setDueDay(''); setTotalMonths(''); setAlertType('none'); setIsModalVisible(false);
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
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: Colors.primary }]} onPress={() => handleOpenModal()}>
          <Plus color="#000" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {mostUrgent && (
            <View style={[styles.heroCard, { backgroundColor: Colors.primary }]}>
                <LottieView 
                    source={require('../../assets/cycle_rider.json')}
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

        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15 }}>
            <TouchableOpacity 
                style={[styles.tabBtn, activeTab === 'required' ? { backgroundColor: Colors.primary } : { backgroundColor: Colors.card, borderColor: Colors.border, borderWidth: 1 }]}
                onPress={() => setActiveTab('required')}
            >
                <Text style={{ color: activeTab === 'required' ? '#000' : Colors.textMuted, fontSize: 11, fontWeight: '900', letterSpacing: 1 }}>REQUIRED PAYMENTS</Text>
            </TouchableOpacity>
            <TouchableOpacity 
                style={[styles.tabBtn, activeTab === 'sms' ? { backgroundColor: Colors.primary } : { backgroundColor: Colors.card, borderColor: Colors.border, borderWidth: 1 }]}
                onPress={() => setActiveTab('sms')}
            >
                <Text style={{ color: activeTab === 'sms' ? '#000' : Colors.textMuted, fontSize: 11, fontWeight: '900', letterSpacing: 1 }}>SMS PARSED</Text>
            </TouchableOpacity>
        </View>

        {activeTab === 'required' ? (
          <>
            <View style={styles.litHeaderRow}>
                <Text style={[styles.sectionTitle, { color: Colors.textMuted, marginTop: 10 }]}>Upcoming Bills</Text>
            {isSelectionMode && (
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity 
                  style={[styles.litAddBtn, { backgroundColor: Colors.primary }]}
                  onPress={() => {
                    if (selectedIds.length === pendingReminders.length) {
                      setSelectedIds([]);
                    } else {
                      setSelectedIds(pendingReminders.map(r => r.id));
                    }
                    Haptics.selectionAsync();
                  }}
                >
                  <CheckCircle2 color="#000" size={20} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.litAddBtn, { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border }]} 
                  onPress={() => setSelectedIds([])}
                >
                  <X color={Colors.text} size={20} />
                </TouchableOpacity>
              </View>
            )}
        </View>

        {pendingReminders.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: Colors.card, borderColor: Colors.border }]}><Text style={{ color: Colors.textMuted }}>No pending bills right now.</Text></View>
        ) : (
          pendingReminders.map(rem => {
            const isSelected = selectedIds.includes(rem.id);
            return (
              <TouchableOpacity 
                key={rem.id} 
                style={[
                    styles.card, 
                    { backgroundColor: isSelected ? Colors.primary : Colors.card, borderColor: isSelected ? Colors.primary : Colors.border },
                    isSelected && { transform: [{ scale: 0.98 }] }
                ]} 
                onLongPress={() => toggleSelection(rem.id)}
                delayLongPress={300}
                onPress={() => {
                    if (isSelectionMode) {
                        toggleSelection(rem.id);
                        return;
                    }
                    Alert.alert("Manage Bill", `Manage ${rem.name} (${settings.currency}${rem.amount})?`, [
                        {text: "Cancel", style: "cancel"}, 
                        {text: "Edit", onPress: () => handleOpenModal(rem)}, 
                        {text: "Mark as Paid", onPress: () => {
                            Alert.alert("Track Expense?", "Do you want to add this payment to your expense tracker?", [
                                {text: "No, just mark paid", onPress: () => markReminderPaid(rem.id, false)},
                                {text: "Yes, track it", onPress: () => markReminderPaid(rem.id, true)}
                            ]);
                        }}
                    ]);
                }}
              >
                {isSelected ? (
                    <View style={[styles.selectionCircle, { borderColor: '#000', backgroundColor: '#000' }]}>
                      <CheckCircle2 color={Colors.primary} size={16} />
                    </View>
                ) : (
                    <Circle size={26} color={Colors.secondary} />
                )}
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardName, { color: isSelected ? '#000' : Colors.text }]}>{rem.name}</Text>
                  <View style={styles.countdownRow}>
                      <Text style={{ color: isSelected ? 'rgba(0,0,0,0.7)' : Colors.textMuted, fontSize: 11 }}>DUE ON {rem.dueDay}TH • </Text>
                      <View style={[styles.countdownBadge, { backgroundColor: isSelected ? 'rgba(0,0,0,0.1)' : Colors.primary + '20' }]}>
                          <Text style={[styles.countdownText, { color: isSelected ? '#000' : Colors.primary }]}>{getCountdown(rem.dueDay)}</Text>
                      </View>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.cardAmount, { color: isSelected ? '#000' : Colors.text }]}>{settings.currency}{rem.amount.toLocaleString()}</Text>
                  {rem.totalMonths && (
                      <Text style={{ color: isSelected ? 'rgba(0,0,0,0.7)' : Colors.textMuted, fontSize: 10, marginTop: 4, fontWeight: 'bold' }}>
                          {rem.paidMonths || 0} / {rem.totalMonths} months
                      </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}

          </View>
        )}

        {paidReminders.length > 0 && (
          <View style={{ marginTop: 25 }}>
            <Text style={[styles.sectionTitle, { color: Colors.textMuted }]}>Settled This Month</Text>
            {paidReminders.map(rem => (
              <View key={rem.id} style={[styles.card, { backgroundColor: Colors.card, borderColor: Colors.border, opacity: 0.5 }]}>
                <CheckCircle2 size={26} color={Colors.primary} />
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardName, { color: Colors.text }]}>{rem.name}</Text>
                  <Text style={{ color: Colors.textMuted, fontSize: 11 }}>PAID FOR {new Date().toLocaleString('default', { month: 'long' }).toUpperCase()}</Text>
                </View>
                <TouchableOpacity onPress={() => deleteReminder(rem.id)}><Trash2 size={18} color={Colors.textMuted} /></TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {completedReminders.length > 0 && (
          <View style={{ marginTop: 25 }}>
            <Text style={[styles.sectionTitle, { color: Colors.primary, fontWeight: '900' }]}>Fully Completed Dues</Text>
            {completedReminders.map(rem => (
              <View key={rem.id} style={[styles.card, { backgroundColor: Colors.card, borderColor: Colors.primary, borderStyle: 'dashed' }]}>
                <CheckCircle2 size={26} color={Colors.primary} />
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardName, { color: Colors.text }]}>{rem.name}</Text>
                  <Text style={{ color: Colors.primary, fontSize: 11, fontWeight: 'bold' }}>TENURE FINISHED ({rem.totalMonths}/{rem.totalMonths})</Text>
                </View>
                <TouchableOpacity onPress={() => deleteReminder(rem.id)}><Trash2 size={18} color={Colors.textMuted} /></TouchableOpacity>
              </View>
            ))}
          </View>
        )}
          </>
        ) : (
          <View>
            {smsBills.length === 0 ? (
                <View style={[styles.emptyCard, { backgroundColor: Colors.card, borderColor: Colors.border }]}><Text style={{ color: Colors.textMuted }}>No parsed SMS bills found.</Text></View>
            ) : (
                smsBills.map(sms => (
                    <View key={sms.id} style={[styles.card, { backgroundColor: Colors.card, borderColor: Colors.border }]}>
                        <View style={styles.cardInfo}>
                            <Text style={[styles.cardName, { color: Colors.text }]}>{sms.name}</Text>
                            <Text style={{ color: Colors.textMuted, fontSize: 11, marginTop: 4 }}>Detected Due: {sms.dueDay}th • {sms.type.toUpperCase()}</Text>
                        </View>
                        <Text style={[styles.cardAmount, { color: Colors.text, marginRight: 15 }]}>{settings.currency}{sms.amount.toLocaleString()}</Text>
                        <TouchableOpacity 
                            style={{ backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 }}
                            onPress={() => {
                                handleOpenModal({
                                    id: '',
                                    name: sms.name,
                                    amount: sms.amount,
                                    dueDay: sms.dueDay,
                                    type: sms.type,
                                });
                                setSmsBills(prev => prev.filter(s => s.id !== sms.id));
                            }}
                        >
                            <Text style={{ color: '#000', fontSize: 12, fontWeight: 'bold' }}>Add</Text>
                        </TouchableOpacity>
                    </View>
                ))
            )}
          </View>
        )}
      </ScrollView>

      {isSelectionMode && (
        <View style={[styles.bottomActionBar, { backgroundColor: Colors.card, borderTopColor: Colors.border }]}>
            <TouchableOpacity 
              style={[styles.batchBtn, { backgroundColor: Colors.primary }]} 
              onPress={markSelectedPaid}
            >
              <CheckCircle2 color="#000" size={18} />
              <Text style={styles.batchBtnText}>MARK PAID ({selectedIds.length})</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.batchBtn, { backgroundColor: '#FF3B30' }]} 
              onPress={deleteSelected}
            >
              <Trash2 color="#fff" size={18} />
            </TouchableOpacity>
        </View>
      )}

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
              <TextInput style={[styles.input, { width: 80, backgroundColor: Colors.background, color: Colors.text, borderColor: Colors.border }]} placeholder="Day" placeholderTextColor={Colors.textMuted} keyboardType="numeric" value={dueDay} onChangeText={setDueDay} maxLength={2} />
            </View>

            <View style={{ marginTop: 15 }}>
              <TextInput style={[styles.input, { backgroundColor: Colors.background, color: Colors.text, borderColor: Colors.border }]} placeholder="Total Duration (Months) - Optional" placeholderTextColor={Colors.textMuted} keyboardType="numeric" value={totalMonths} onChangeText={setTotalMonths} />
            </View>
            
            <View style={{ marginTop: 20 }}>
                <Text style={[styles.sectionTitle, { color: Colors.textMuted }]}>Reminder Options</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                    {['none', 'on_day', '2_days_before', 'both', 'custom'].map((opt) => (
                        <TouchableOpacity
                            key={opt}
                            style={[
                                styles.pickerBtn, 
                                { flex: 1, minWidth: '28%', backgroundColor: alertType === opt ? Colors.primary : Colors.background, borderColor: alertType === opt ? Colors.primary : Colors.border }
                            ]}
                            onPress={() => setAlertType(opt as any)}
                        >
                            <Text style={{ 
                                color: alertType === opt ? '#000' : Colors.text, 
                                fontSize: 11, 
                                fontWeight: '700' 
                            }}>
                                {opt === 'none' ? 'None' : opt === 'on_day' ? 'Due Date' : opt === '2_days_before' ? '2 Days Prior' : opt === 'both' ? 'Both' : 'Strict Date'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {alertType === 'custom' && (
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 15 }}>
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
                          <Clock size={18} color={Colors.primary} />
                          <Text style={{ color: Colors.text, fontSize: 13, fontWeight: '700' }}>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                      </TouchableOpacity>
                  </View>
                )}
            </View>

            {showDate && (
                <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    onChange={(e, d) => {
                        setShowDate(false);
                        if(d) {
                            const next = new Date(date);
                            next.setFullYear(d.getFullYear());
                            next.setMonth(d.getMonth());
                            next.setDate(d.getDate());
                            setDate(next);
                        }
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
                        if(d) {
                            const next = new Date(date);
                            next.setHours(d.getHours());
                            next.setMinutes(d.getMinutes());
                            next.setSeconds(0);
                            setDate(next);
                        }
                    }}
                />
            )}
            
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: Colors.primary }]} onPress={handleSave}>
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
  saveBtn: {
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10
  },
  litHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 5,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  litAddBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    paddingBottom: 30,
    elevation: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  batchBtn: {
    flex: 1,
    height: 54,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  batchBtnText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    color: '#000',
  },
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
