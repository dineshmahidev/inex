import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, ShieldCheck, Lock, Eye, ServerOff } from 'lucide-react-native';
import { useDatabase } from '@/hooks/useDatabase';

export default function PrivacyScreen() {
  const { Colors } = useDatabase();
  const router = useRouter();

  const sections = [
    {
      icon: Lock,
      title: "Data Ownership",
      content: "All your financial data—including transactions, notes, and reminders—is stored exclusively on your device. We do not have access to your data, and we do not store it on any external servers."
    },
    {
      icon: ServerOff,
      title: "Offline First",
      content: "Flow Ledger operates fully offline. Your data never leaves your device unless you explicitly choose to export a backup file for your own use."
    },
    {
      icon: ShieldCheck,
      title: "Security",
      content: "We provide built-in PIN and biometric lock features to protect your app from unauthorized physical access. We recommend keeping these enabled."
    },
    {
      icon: Eye,
      title: "Transparency",
      content: "We do not track your behavior, we do not use third-party analytics, and we do not sell any information to third parties. Your privacy is our core value."
    }
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft color={Colors.text} size={28} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: Colors.text }]}>Privacy Policy</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.hero, { backgroundColor: Colors.primary + '10' }]}>
              <ShieldCheck size={50} color={Colors.primary} />
              <Text style={[styles.heroTitle, { color: Colors.text }]}>Your Data, Your Control</Text>
              <Text style={[styles.heroSub, { color: Colors.textMuted }]}>Read how Flow Ledger protects your financial independence.</Text>
          </View>

          {sections.map((sec, i) => (
              <View key={i} style={[styles.card, { backgroundColor: Colors.card, borderColor: Colors.border }]}>
                  <View style={styles.cardHeader}>
                      <View style={[styles.iconBox, { backgroundColor: Colors.primary + '15' }]}>
                          <sec.icon size={20} color={Colors.primary} />
                      </View>
                      <Text style={[styles.cardTitle, { color: Colors.text }]}>{sec.title}</Text>
                  </View>
                  <Text style={[styles.cardContent, { color: Colors.textMuted }]}>{sec.content}</Text>
              </View>
          ))}

          <View style={styles.footer}>
              <Text style={{ color: Colors.textMuted, textAlign: 'center', fontSize: 12 }}>
                  Last Updated: April 2026 • Version 1.0.5
              </Text>
          </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 10 },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '900' },
  content: { padding: 20 },
  hero: { padding: 30, borderRadius: 32, alignItems: 'center', marginBottom: 25 },
  heroTitle: { fontSize: 20, fontWeight: '900', marginTop: 15 },
  heroSub: { fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  card: { padding: 25, borderRadius: 28, borderWidth: 1, marginBottom: 15 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '800' },
  cardContent: { fontSize: 14, lineHeight: 22, fontWeight: '500' },
  footer: { marginTop: 30, marginBottom: 50 },
});
