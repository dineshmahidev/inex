import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Dimensions
} from 'react-native';
import { useDatabase } from '@/hooks/useDatabase';
import { useRouter } from 'expo-router';
import { ChevronLeft, Send, Sparkles, Brain, Target, TrendingDown, Wallet, ArrowRight, Languages } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Message = {
  id: string;
  text: string;
  sender: 'ai' | 'user';
  type?: 'text' | 'options' | 'result' | 'lang';
  options?: string[];
};

const STRINGS = {
    en: {
        welcome: "Welcome to Tracksy Strategic Advisory. Choose your language to begin.",
        focus: "What is your primary financial focus for this month?",
        goals: ['Aggressive Saving', 'Expense Control', 'Debt Clearance'],
        savingQ: "To calculate your path, how much do you want to save per month?",
        targets: ['10%', '20%', '30%', 'Manual Entry'],
        generating: "Calculating Strategic Roadmap...",
        summary: "Strategic Roadmap Generated. For your focus, I've calculated this High-Efficiency breakdown:",
        tiers: ['Essential Bills', 'Variable Spend', 'Saving Target', 'Emergency Buffer'],
        footer: "Tracksy Strategic AI uses your history for precise calculations.",
        apply: "APPLY",
        lock: "Lock Strategy",
        recalc: "Recalculate",
        locked: "✨ Strategic Plan Locked! Returning to Dashboard...",
        placeholder: "Enter Amount"
    },
    ta: {
        welcome: "Tracksy வியூக ஆலோசனைக்கு வரவேற்கிறோம். தொடங்குவதற்கு உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்.",
        focus: "இந்த மாதத்திற்கான உங்கள் முக்கிய நிதி இலக்கு என்ன?",
        goals: ['அதிக சேமிப்பு', 'செலவு கட்டுப்பாடு', 'கடன் தீர்த்தல்'],
        savingQ: "உங்கள் பாதையை கணக்கிட, ஒரு மாதத்திற்கு எவ்வளவு சேமிக்க விரும்புகிறீர்கள்?",
        targets: ['10%', '20%', '30%', 'கைமுறை உள்ளீடு'],
        generating: "வியூக வரைபடம் கணக்கிடப்படுகிறது...",
        summary: "நிதியியல் வியூகம் உருவாக்கப்பட்டது. உங்கள் கவனத்திற்காக, இந்த உயர் செயல்திறன் முறிவை நான் கணக்கிட்டுள்ளேன்:",
        tiers: ['அத்தியாவசிய செலவுகள்', 'இதர செலவுகள்', 'சேமிப்பு இலக்கு', 'அவசரகால நிதி'],
        footer: "துல்லியமான கணக்கீடுகளுக்கு Tracksy AI உங்கள் வரலாற்றைப் பயன்படுத்துக்கிறது.",
        apply: "பயன்படுத்து",
        lock: "வியூகத்தை உறுதிசெய்",
        recalc: "மீண்டும் கணக்கிடு",
        locked: "✨ வியூகம் உறுதி செய்யப்பட்டது! திரும்புதல்...",
        placeholder: "தொகையை உள்ளிடவும்"
    }
};

export default function ChatScreen() {
  const { Colors, settings, transactions } = useDatabase();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  
  const [lang, setLang] = useState<'en' | 'ta'>('en');
  const [step, setStep] = useState(-1); // -1 for language selection
  const [userData, setUserData] = useState({ goal: '', target: '' });
  const [showManualInput, setShowManualInput] = useState(false);
  const [input, setInput] = useState('');
  
  const [messages, setMessages] = useState<Message[]>([
    { 
        id: '0', 
        text: "Select Language / மொழியைத் தேர்ந்தெடுக்கவும்", 
        sender: 'ai',
        type: 'lang',
        options: ['English', 'தமிழ்']
    }
  ]);

  const s = lang === 'en' ? STRINGS.en : STRINGS.ta;

  useEffect(() => {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  const handleLanguageSelect = (selected: string) => {
    const selectedLang = selected === 'தமிழ்' ? 'ta' : 'en';
    setLang(selectedLang);
    const ts = selectedLang === 'en' ? STRINGS.en : STRINGS.ta;
    
    setMessages(prev => [...prev, { id: Date.now().toString(), text: selected, sender: 'user' }]);
    setStep(0);
    
    setTimeout(() => {
        setMessages(prev => [...prev, { id: 'lang-msg', text: ts.welcome, sender: 'ai' }]);
        setTimeout(() => {
            setMessages(prev => [...prev, { id: 'focus-msg', text: ts.focus, sender: 'ai', type: 'options', options: ts.goals }]);
        }, 800);
    }, 500);
  };

  const handleOptionSelect = (option: string) => {
    const userMsg: Message = { id: Date.now().toString(), text: option, sender: 'user' };
    setMessages([...messages, userMsg]);
    
    if (option === s.lock) {
        setTimeout(() => {
            setMessages(prev => [...prev, { id: 'lock-msg', text: s.locked, sender: 'ai' }]);
            setTimeout(() => router.back(), 2000);
        }, 800);
        return;
    }

    if (option === s.recalc) {
        setStep(0);
        setMessages([{ id: 'restart', text: s.focus, sender: 'ai', type: 'options', options: s.goals }]);
        return;
    }

    if (step === 0) {
        setUserData({ ...userData, goal: option });
        setStep(1);
        setTimeout(() => {
            setMessages(prev => [...prev, { 
                id: 'saving-q', 
                text: s.savingQ, 
                sender: 'ai',
                type: 'options',
                options: s.targets
            }]);
        }, 800);
    } else if (step === 1) {
        if (option === 'Manual Entry' || option === 'கைமுறை உள்ளீடு') {
            setShowManualInput(true);
        } else {
            setUserData({ ...userData, target: option });
            generateStrategy(option);
        }
    }
  };

  const handleManualSubmit = () => {
      if (!input.trim()) return;
      const amountLabel = `${settings.currency}${input}`;
      setUserData({ ...userData, target: amountLabel });
      setMessages([...messages, { id: Date.now().toString(), text: amountLabel, sender: 'user' }]);
      setShowManualInput(false);
      setInput('');
      generateStrategy(amountLabel);
  };

  const generateStrategy = (target: string) => {
    setStep(2);
    setTimeout(() => {
        const totalIncome = transactions.filter(t => t.type === 'income').reduce((s,t) => s + t.amount, 0) || 50000;
        
        let targetAmount = 0;
        if (target.includes('%')) {
            targetAmount = (totalIncome * parseInt(target)) / 100;
        } else {
            targetAmount = parseInt(target.replace(/[^0-9]/g, ''));
        }

        const buffer = totalIncome * 0.1; // 10% Safety Buffer
        const essentialsLimit = totalIncome * 0.45; // Refined to 45%
        const lifestyleLimit = Math.max(0, totalIncome - essentialsLimit - targetAmount - buffer);

        const aiMsg: Message = { 
            id: 'result-msg', 
            text: s.summary, 
            sender: 'ai',
            type: 'result',
            options: [
                `${s.tiers[0]}: ${settings.currency}${essentialsLimit.toLocaleString()}`,
                `${s.tiers[1]}: ${settings.currency}${lifestyleLimit.toLocaleString()}`,
                `${s.tiers[2]}: ${settings.currency}${targetAmount.toLocaleString()}`,
                `${s.tiers[3]}: ${settings.currency}${buffer.toLocaleString()}`
            ]
        };
        setMessages(prev => [...prev, aiMsg]);
        
        setTimeout(() => {
            setMessages(prev => [...prev, {
                id: 'final-q',
                text: lang === 'en' ? "Would you like to lock this high-performance roadmap?" : "இந்த உயர் செயல்திறன் வரைபடத்தை உறுதிசெய்ய விரும்புகிறீர்களா?",
                sender: 'ai',
                type: 'options',
                options: [s.lock, s.recalc]
            }]);
        }, 1200);
    }, 1500);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft color={Colors.text} size={24} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
            <View style={[styles.aiBadge, { backgroundColor: Colors.primary + '20' }]}>
                <Languages size={18} color={Colors.primary} />
            </View>
            <View>
                <Text style={[styles.title, { color: Colors.text }]}>Tracksy STRATEGY</Text>
                <Text style={[styles.status, { color: Colors.primary }]}>{lang === 'en' ? 'MULTILINGUAL' : 'தமிழ் பதிப்பு'}</Text>
            </View>
        </View>
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.chatList} showsVerticalScrollIndicator={false}>
          {messages.map((m) => (
              <View key={m.id} style={[styles.msgWrapper, m.sender === 'user' ? styles.userWrapper : styles.aiWrapper]}>
                  {m.sender === 'ai' && (
                      <View style={[styles.avatar, { backgroundColor: Colors.card }]}><Sparkles size={14} color={Colors.primary} /></View>
                  )}
                  <View style={{ flex: 1 }}>
                      <View style={[styles.bubble, m.sender === 'user' ? { backgroundColor: Colors.primary } : { backgroundColor: Colors.card, borderColor: Colors.border, borderWidth: 1 }]}>
                          <Text style={[styles.msgText, { color: m.sender === 'user' ? '#000' : Colors.text }]}>{m.text}</Text>
                      </View>

                      {(m.type === 'options' || m.type === 'lang') && (
                          <View style={styles.optionsGrid}>
                              {m.options?.map((opt, i) => (
                                  <TouchableOpacity 
                                    key={i} 
                                    style={[styles.optBtn, { borderColor: Colors.primary }]}
                                    onPress={() => m.type === 'lang' ? handleLanguageSelect(opt) : handleOptionSelect(opt)}
                                  >
                                      <Text style={[styles.optText, { color: Colors.primary }]}>{opt}</Text>
                                  </TouchableOpacity>
                              ))}
                          </View>
                      )}

                      {m.type === 'result' && (
                          <View style={[styles.resultCard, { backgroundColor: Colors.primary + '10', borderColor: Colors.primary }]}>
                              <Text style={[styles.resultHead, { color: Colors.primary }]}>{lang === 'en' ? 'ROADMAP' : 'வரைபடம்'}</Text>
                              <View style={styles.resultList}>
                                  {m.options?.map((tier, idx) => (
                                      <View key={idx} style={styles.tierRow}>
                                          <View style={[styles.dot, { backgroundColor: Colors.primary }]} />
                                          <Text style={[styles.tierText, { color: Colors.text }]}>{tier}</Text>
                                      </View>
                                  ))}
                              </View>
                          </View>
                      )}
                  </View>
              </View>
          ))}
      </ScrollView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          {showManualInput ? (
              <View style={[styles.inputContainer, { backgroundColor: Colors.card, borderTopColor: Colors.primary }]}>
                <TextInput 
                  style={[styles.input, { color: Colors.text, borderColor: Colors.primary }]}
                  placeholder={s.placeholder}
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  value={input}
                  onChangeText={setInput}
                  autoFocus
                />
                <TouchableOpacity style={[styles.sendBtn, { backgroundColor: Colors.primary }]} onPress={handleManualSubmit}>
                    <Text style={{ fontWeight: '900', fontSize: 10 }}>{s.apply}</Text>
                </TouchableOpacity>
              </View>
          ) : (
            <View style={[styles.footer, { borderTopColor: Colors.border }]}>
                <Text style={[styles.footerText, { color: Colors.textMuted }]}>{s.footer}</Text>
            </View>
          )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 15 },
  backBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  headerInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  aiBadge: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  status: { fontSize: 10, fontWeight: 'BOLD', textTransform: 'uppercase', letterSpacing: 0.5 },
  chatList: { padding: 20, paddingBottom: 100, gap: 25 },
  msgWrapper: { flexDirection: 'row', gap: 12, width: '100%' },
  userWrapper: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  aiWrapper: { alignSelf: 'flex-start' },
  avatar: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 5 },
  bubble: { padding: 18, borderRadius: 24, alignSelf: 'flex-start', maxWidth: '85%' },
  msgText: { fontSize: 15, fontWeight: '600', lineHeight: 22 },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 15 },
  optBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20, borderWidth: 1.5 },
  optText: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  resultCard: { marginTop: 15, padding: 20, borderRadius: 24, borderWidth: 1, borderStyle: 'dashed' },
  resultHead: { fontSize: 10, fontWeight: 'BOLD', letterSpacing: 2, marginBottom: 15 },
  resultList: { gap: 12 },
  tierRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  tierText: { fontSize: 13, fontWeight: '700' },
  footer: { padding: 20, borderTopWidth: 1, alignItems: 'center' },
  footerText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textAlign: 'center' },
  inputContainer: { flexDirection: 'row', padding: 15, paddingBottom: Platform.OS === 'ios' ? 30 : 15, gap: 10, borderTopWidth: 1 },
  input: { flex: 1, height: 50, borderRadius: 25, paddingHorizontal: 20, fontSize: 15, fontWeight: '600', borderWidth: 1 },
  sendBtn: { width: 80, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
});
