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
  Dimensions,
  Animated,
} from 'react-native';
import { useDatabase } from '@/hooks/useDatabase';
import { formatInputWithCommas } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { ChevronLeft, Sparkles, Brain, TrendingDown, Wallet, TrendingUp, Check } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

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
        locked: "Strategic Plan Locked! Returning to Dashboard...",
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
        locked: "வியூகம் உறுதி செய்யப்பட்டது! திரும்புதல்...",
        placeholder: "தொகையை உள்ளிடவும்"
    }
};

function DotPattern() {
  const rows = Math.ceil(height / 28);
  const cols = Math.ceil(width / 28);
  const dots: React.ReactNode[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      dots.push(
        <View
          key={`${r}-${c}`}
          style={{
            position: 'absolute',
            left: c * 28 + 14,
            top: r * 28 + 14,
            width: 3,
            height: 3,
            borderRadius: 1.5,
            backgroundColor: '#171717',
            opacity: 0.08,
          }}
        />
      );
    }
  }
  return <>{dots}</>;
}

function TypingDots() {
  const [dot1] = useState(new Animated.Value(0));
  const [dot2] = useState(new Animated.Value(0));
  const [dot3] = useState(new Animated.Value(0));

  useEffect(() => {
    const bounce = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: -6, duration: 300, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(400),
        ])
      );
    };

    const a1 = bounce(dot1, 0);
    const a2 = bounce(dot2, 150);
    const a3 = bounce(dot3, 300);
    a1.start();
    a2.start();
    a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  return (
    <View style={{ flexDirection: 'row', gap: 5, padding: 4 }}>
      {[dot1, dot2, dot3].map((anim, i) => (
        <Animated.View
          key={i}
          style={{
            width: 7, height: 7, borderRadius: 3.5,
            backgroundColor: '#16a34a', opacity: 0.5,
            transform: [{ translateY: anim }],
          }}
        />
      ))}
    </View>
  );
}

const TIER_ICONS = [Wallet, TrendingDown, TrendingUp, Sparkles];

export default function ChatScreen() {
  const { settings, transactions } = useDatabase();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  const [lang, setLang] = useState<'en' | 'ta'>('en');
  const [step, setStep] = useState(-1);
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
    setMessages(prev => [...prev, { id: 'generating', text: s.generating, sender: 'ai' }]);

    setTimeout(() => {
        const totalIncome = transactions.filter(t => t.type === 'income').reduce((s,t) => s + t.amount, 0) || 50000;

        let targetAmount = 0;
        if (target.includes('%')) {
            targetAmount = (totalIncome * parseInt(target)) / 100;
        } else {
            targetAmount = parseInt(target.replace(/[^0-9]/g, ''));
        }

        const buffer = totalIncome * 0.1;
        const essentialsLimit = totalIncome * 0.45;
        const lifestyleLimit = Math.max(0, totalIncome - essentialsLimit - targetAmount - buffer);

        setMessages(prev => prev.filter(m => m.id !== 'generating'));

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
    }, 2000);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <DotPattern />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft color="#171717" size={24} strokeWidth={3} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={styles.aiBadge}>
              <Brain size={20} color="#16a34a" />
            </View>
            <View>
              <Text style={styles.headerTitle}>AI Strategy</Text>
              <Text style={styles.headerSubtitle}>Powered by Tracksy</Text>
            </View>
          </View>
          <View style={[styles.langBadge, { backgroundColor: '#16a34a' }]}>
            <Text style={styles.langBadgeText}>{lang === 'en' ? 'EN' : 'த'.toUpperCase()}</Text>
          </View>
        </View>

        <ScrollView ref={scrollRef} contentContainerStyle={styles.chatList} showsVerticalScrollIndicator={false}>
            {messages.map((m, idx) => (
                <View key={m.id} style={[styles.msgWrapper, m.sender === 'user' ? styles.userWrapper : styles.aiWrapper]}>
                    {m.sender === 'ai' && (
                        <View style={styles.aiAvatar}>
                          <Sparkles size={12} color="#16a34a" />
                        </View>
                    )}
                    <View style={{ flex: 1 }}>
                        {m.id === 'generating' ? (
                          <View style={[styles.bubble, styles.aiBubble]}>
                            <TypingDots />
                          </View>
                        ) : (
                          <View style={[styles.bubble, m.sender === 'user' ? styles.userBubble : styles.aiBubble]}>
                            <Text style={[styles.msgText, { color: m.sender === 'user' ? '#FFFFFF' : '#171717' }]}>
                              {m.text}
                            </Text>
                          </View>
                        )}

                        {(m.type === 'options' || m.type === 'lang') && m.options && (
                            <View style={styles.optionsGrid}>
                                {m.options.map((opt, i) => {
                                  const colors = ['#16a34a', '#8b5cf6', '#eab308', '#ef4444'];
                                  const color = colors[i % colors.length];
                                  return (
                                    <TouchableOpacity
                                      key={i}
                                      style={[styles.optBtn, { borderColor: color }]}
                                      onPress={() => m.type === 'lang' ? handleLanguageSelect(opt) : handleOptionSelect(opt)}
                                      activeOpacity={0.8}
                                    >
                                        <Text style={[styles.optText, { color }]}>{opt}</Text>
                                    </TouchableOpacity>
                                  );
                                })}
                            </View>
                        )}

                        {m.type === 'result' && m.options && (
                            <View style={styles.resultCard}>
                              <View style={styles.resultHeader}>
                                <Sparkles size={14} color="#16a34a" />
                                <Text style={styles.resultHead}>STRATEGIC ROADMAP</Text>
                              </View>
                              <View style={styles.resultDivider} />
                              {m.options.map((tier, idx) => {
                                const Icon = TIER_ICONS[idx];
                                const parts = tier.split(': ');
                                const label = parts[0];
                                const value = parts[1];
                                return (
                                  <View key={idx} style={styles.tierRow}>
                                    <View style={[styles.tierIcon, { backgroundColor: idx === 0 ? '#16a34a' : idx === 1 ? '#8b5cf6' : idx === 2 ? '#eab308' : '#ef4444' }]}>
                                      <Icon size={12} color="#FFFFFF" />
                                    </View>
                                    <Text style={styles.tierLabel}>{label}</Text>
                                    <Text style={[styles.tierValue, { color: idx === 0 ? '#16a34a' : idx === 1 ? '#8b5cf6' : idx === 2 ? '#eab308' : '#ef4444' }]}>{value}</Text>
                                  </View>
                                );
                              })}
                            </View>
                        )}
                    </View>
                </View>
            ))}
        </ScrollView>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            {showManualInput ? (
                <View style={[styles.inputContainer, { backgroundColor: '#FFFFFF' }]}>
                  <TextInput
                    style={styles.input}
                    placeholder={s.placeholder}
                    placeholderTextColor="#a3a3a3"
                    keyboardType="numeric"
                    value={input}
                    onChangeText={(text) => setInput(formatInputWithCommas(text))}
                    autoFocus
                  />
                  <TouchableOpacity style={styles.sendBtn} onPress={handleManualSubmit} activeOpacity={0.8}>
                    <Check size={20} color="#FFFFFF" strokeWidth={3} />
                  </TouchableOpacity>
                </View>
            ) : (
              <View style={styles.footer}>
                  <Text style={styles.footerText}>{s.footer}</Text>
              </View>
            )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#16a34a15',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#171717',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#525252',
    letterSpacing: 0.3,
    marginTop: 1,
  },
  langBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  langBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  chatList: {
    padding: 20,
    paddingBottom: 100,
    gap: 20,
  },
  msgWrapper: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  userWrapper: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  aiWrapper: {
    alignSelf: 'flex-start',
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#16a34a15',
    marginTop: 6,
  },
  bubble: {
    padding: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
    maxWidth: '82%',
  },
  userBubble: {
    backgroundColor: '#16a34a',
    borderBottomRightRadius: 4,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  aiBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  msgText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 21,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  optBtn: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 16,
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  optText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  resultCard: {
    marginTop: 12,
    padding: 18,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 0,
  },
  resultHead: {
    fontSize: 9,
    fontWeight: '900',
    color: '#16a34a',
    letterSpacing: 2,
  },
  resultDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 14,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  tierIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tierLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#171717',
  },
  tierValue: {
    fontSize: 14,
    fontWeight: '900',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#a3a3a3',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  input: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 20,
    fontSize: 14,
    fontWeight: '600',
    color: '#171717',
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});
