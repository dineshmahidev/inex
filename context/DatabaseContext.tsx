import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme } from '@/constants/theme';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import * as Notifications from 'expo-notifications';
import { parseFinancialText } from '@/utils/billParser';

const KEYS = {
  DATA: '@smart_data_v4',
  CATS: '@smart_cats_v3',
  REMINDERS: '@smart_reminders_v2',
  SETTINGS: '@smart_settings_v4',
  NOTES: '@smart_notes_v1',
  TODOS: '@smart_todos_v1',
  HABITS: '@smart_habits_v1',
  VOICE: '@smart_voice_v1',
};

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
}

export interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  categoryId: string;
  note: string;
  date: string;
}

export interface Reminder {
  id: string;
  name: string;
  amount: number;
  dueDay: number; // 1-31
  type: 'loan' | 'emi' | 'bill';
  lastPaidMonth?: string; // YYYY-MM
  totalMonths?: number;
  paidMonths?: number;
  alertType?: 'on_day' | '2_days_before' | 'both' | 'none' | 'custom';
  customDate?: string;
  isCompleted?: boolean;
  paymentHistory?: { date: string; amount: number }[];
}

export interface UserSettings {
  isLocked: boolean;
  pin: string | null;
  currency: string;
  theme: 'dark' | 'light';
  userName: string;
  userImage: string | null;
  hasOnboarded: boolean;
  themeColor?: string; // App-wide theme accent color
  hasSeenTour?: boolean; // App tour completed
}

export interface Note {
  id: string;
  title: string;
  text: string;
  date: string;
  color?: string;
  pinned?: boolean;
}

export interface Todo {
  id: string;
  text: string;
  category: string;
  starred: boolean;
  completed: boolean;
  date: string;
  time?: string;
  reminderDate?: string;
}

export interface Habit {
  id: string;
  name: string;
  color: string;
  icon: string;
  logs: string[]; // ['2024-04-01', ...]
  reminderTime?: string; // HH:mm
  challenge?: string; // e.g. "10 Days", "30 Days"
  goal?: number;
  goalUnit?: string;
}

export interface VoiceNote {
  id: string;
  title: string;
  uri: string;
  date: string;
  time: string;
  reminderDate?: string;
  duration?: number;
}

const DEFAULT_CATS: Category[] = [
  { id: '1', name: 'Food & Dining', icon: 'coffee', color: '#FF6B6B', type: 'expense' },
  { id: '2', name: 'Travel & Cabs', icon: 'truck', color: '#4D96FF', type: 'expense' },
  { id: '3', name: 'Home Bills', icon: 'zap', color: '#FFD93D', type: 'expense' },
  { id: '4', name: 'EMI & Loans', icon: 'credit-card', color: '#F43F5E', type: 'expense' },
  { id: '5', name: 'Salary', icon: 'wallet', color: '#10B981', type: 'income' },
  { id: '6', name: 'Other Income', icon: 'briefcase', color: '#6366F1', type: 'income' },
];

interface DatabaseContextType {
  transactions: Transaction[];
  categories: Category[];
  reminders: Reminder[];
  settings: UserSettings;
  notes: Note[];
  todos: Todo[];
  habits: Habit[];
  voiceNotes: VoiceNote[];
  isLoading: boolean;
  Colors: any;
  addTransaction: (tx: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, tx: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => void;
  deleteTransactions: (ids: string[]) => void;
  markReminderPaid: (id: string, trackAsExpense?: boolean, manualDate?: string) => Promise<void>;
  addReminder: (rem: Omit<Reminder, 'id'>) => void;
  updateReminder: (id: string, rem: Partial<Reminder>) => Promise<void>;
  deleteReminder: (id: string) => void;
  addNote: (note: Omit<Note, 'id'>) => Promise<void>;
  updateNote: (id: string, note: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => void;
  addTodo: (td: Omit<Todo, 'id'>) => Promise<string>;
  updateTodo: (id: string, td: Partial<Todo>) => Promise<void>;
  saveTodos: (todos: Todo[]) => Promise<void>;
  addHabit: (h: Omit<Habit, 'id' | 'logs'>) => Promise<string>;
  updateHabit: (id: string, h: Partial<Habit>) => Promise<void>;
  deleteHabit: (id: string) => void;
  addVoiceNote: (vn: Omit<VoiceNote, 'id'>) => Promise<string>;
  updateVoiceNote: (id: string, vn: Partial<VoiceNote>) => Promise<void>;
  deleteVoiceNote: (id: string) => void;
  setSettings: (s: UserSettings) => void;
  refresh: () => void;
  clearAllData: () => Promise<void>;
  exportData: () => Promise<void>;
  importData: (json: string) => Promise<void>;
  detectCategory: (note: string) => string | null;
  globalMonth: Date;
  setGlobalMonth: React.Dispatch<React.SetStateAction<Date>>;
  smsBills: { id: string; name: string; amount: number; dueDay: number; type: 'bill'|'emi'|'loan' }[];
  setSmsBills: React.Dispatch<React.SetStateAction<{ id: string; name: string; amount: number; dueDay: number; type: 'bill'|'emi'|'loan' }[]>>;
  saveToSafetyFile: () => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATS);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
  const [smsBills, setSmsBills] = useState<{ id: string; name: string; amount: number; dueDay: number; type: 'bill'|'emi'|'loan' }[]>([]);
  const [settings, setSettings] = useState<UserSettings>({ 
    isLocked: false, 
    pin: null, 
    currency: '₹', 
    theme: 'dark',
    userName: 'Guest',
    userImage: null,
    hasOnboarded: false,
    themeColor: '#F472B6', // Default pink
    hasSeenTour: false
  });

  const [isLoading, setIsLoading] = useState(true);
  const [globalMonth, setGlobalMonth] = useState<Date>(new Date());

  const baseColors = settings.theme === 'light' ? Theme.light : Theme.dark;
  const Colors = useMemo(() => {
    const primaryColor = settings.themeColor || "#F472B6";
    return {
      ...baseColors,
      primary: primaryColor,
      secondary: primaryColor,
      accent: primaryColor,
      glass: `${primaryColor}15`,
      gradient: [primaryColor, primaryColor] as [string, string, ...string[]],
    };
  }, [settings.theme, settings.themeColor]);

  const mergeLists = <T extends { id: string }>(listA: T[], listB: T[]): T[] => {
    const merged = [...listA, ...listB];
    const seen = new Set<string>();
    return merged.filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  };

  const load = async () => {
    try {
      // 1. Load current version values
      const [currentTxStr, currentCatStr, currentRemStr, currentSetStr, currentNoteStr, currentTodoStr, currentHabitStr, currentVoiceStr, currentSmsStr] = await Promise.all([
        AsyncStorage.getItem(KEYS.DATA),
        AsyncStorage.getItem(KEYS.CATS),
        AsyncStorage.getItem(KEYS.REMINDERS),
        AsyncStorage.getItem(KEYS.SETTINGS),
        AsyncStorage.getItem(KEYS.NOTES),
        AsyncStorage.getItem(KEYS.TODOS),
        AsyncStorage.getItem(KEYS.HABITS),
        AsyncStorage.getItem(KEYS.VOICE),
        AsyncStorage.getItem('tracksy_sms'),
      ]);

      let loadedTx: Transaction[] = currentTxStr ? JSON.parse(currentTxStr) : [];
      let loadedCat: Category[] = currentCatStr ? JSON.parse(currentCatStr) : DEFAULT_CATS;
      let loadedRem: Reminder[] = currentRemStr ? JSON.parse(currentRemStr) : [];
      let loadedSet: Partial<UserSettings> = currentSetStr ? JSON.parse(currentSetStr) : {};
      let loadedNote: Note[] = currentNoteStr ? JSON.parse(currentNoteStr) : [];
      let loadedTodo: Todo[] = currentTodoStr ? JSON.parse(currentTodoStr) : [];
      let loadedHabit: Habit[] = currentHabitStr ? JSON.parse(currentHabitStr) : [];
      let loadedVoice: VoiceNote[] = currentVoiceStr ? JSON.parse(currentVoiceStr) : [];
      let loadedSms = currentSmsStr ? JSON.parse(currentSmsStr) : [];

      // 2. Load safety backup file data (for reinstalls recovery)
      const safetyData = await loadFromSafetyFile();
      if (safetyData) {
        loadedTx = mergeLists(loadedTx, safetyData.transactions || []);
        loadedRem = mergeLists(loadedRem, safetyData.reminders || []);
        loadedNote = mergeLists(loadedNote, safetyData.notes || []);
        loadedTodo = mergeLists(loadedTodo, safetyData.todos || []);
        loadedHabit = mergeLists(loadedHabit, safetyData.habits || []);
        loadedVoice = mergeLists(loadedVoice, safetyData.voiceNotes || []);
        loadedSet = { ...(safetyData.settings || {}), ...loadedSet };
      }

      // 3. Scan and merge legacy keys in order (for app upgrade migrations)
      // Legacy Transactions
      const legacyTxKeys = ['@smart_data_v3', '@smart_data_v2', '@smart_data_v1', 'transactions'];
      for (const key of legacyTxKeys) {
        const val = await AsyncStorage.getItem(key);
        if (val) {
          try {
            const parsed = JSON.parse(val);
            loadedTx = mergeLists(loadedTx, Array.isArray(parsed) ? parsed : []);
          } catch (e) {}
        }
      }

      // Legacy Categories
      const legacyCatKeys = ['@smart_cats_v2', '@smart_cats_v1', 'categories'];
      for (const key of legacyCatKeys) {
        const val = await AsyncStorage.getItem(key);
        if (val) {
          try {
            const parsed = JSON.parse(val);
            loadedCat = mergeLists(loadedCat, Array.isArray(parsed) ? parsed : []);
          } catch (e) {}
        }
      }

      // Legacy Reminders
      const legacyRemKeys = ['@smart_reminders_v1', 'reminders'];
      for (const key of legacyRemKeys) {
        const val = await AsyncStorage.getItem(key);
        if (val) {
          try {
            const parsed = JSON.parse(val);
            loadedRem = mergeLists(loadedRem, Array.isArray(parsed) ? parsed : []);
          } catch (e) {}
        }
      }

      // Legacy Settings
      const legacySetKeys = ['@smart_settings_v3', '@smart_settings_v2', '@smart_settings_v1', 'settings'];
      for (const key of legacySetKeys) {
        const val = await AsyncStorage.getItem(key);
        if (val) {
          try {
            const parsed = JSON.parse(val);
            loadedSet = { ...parsed, ...loadedSet };
          } catch (e) {}
        }
      }

      // Legacy Notes
      const legacyNoteKeys = ['notes', '@smart_notes_v0'];
      for (const key of legacyNoteKeys) {
        const val = await AsyncStorage.getItem(key);
        if (val) {
          try {
            const parsed = JSON.parse(val);
            loadedNote = mergeLists(loadedNote, Array.isArray(parsed) ? parsed : []);
          } catch (e) {}
        }
      }

      // Legacy Todos
      const legacyTodoKeys = ['todos', '@smart_todos_v0'];
      for (const key of legacyTodoKeys) {
        const val = await AsyncStorage.getItem(key);
        if (val) {
          try {
            const parsed = JSON.parse(val);
            loadedTodo = mergeLists(loadedTodo, Array.isArray(parsed) ? parsed : []);
          } catch (e) {}
        }
      }

      // Legacy Habits
      const legacyHabitKeys = ['habits', '@smart_habits_v0'];
      for (const key of legacyHabitKeys) {
        const val = await AsyncStorage.getItem(key);
        if (val) {
          try {
            const parsed = JSON.parse(val);
            loadedHabit = mergeLists(loadedHabit, Array.isArray(parsed) ? parsed : []);
          } catch (e) {}
        }
      }

      // Legacy Voice Notes
      const legacyVoiceKeys = ['voice', '@smart_voice_v0'];
      for (const key of legacyVoiceKeys) {
        const val = await AsyncStorage.getItem(key);
        if (val) {
          try {
            const parsed = JSON.parse(val);
            loadedVoice = mergeLists(loadedVoice, Array.isArray(parsed) ? parsed : []);
          } catch (e) {}
        }
      }

      // 4. Update state with completely loaded & merged values
      setTransactions(loadedTx);
      setCategories(loadedCat);
      setReminders(loadedRem);
      setNotes(loadedNote);
      setTodos(loadedTodo);
      setHabits(loadedHabit);
      setVoiceNotes(loadedVoice);
      setSmsBills(loadedSms);
      setSettings(prev => ({ ...prev, ...loadedSet }));

      // 5. Instantly seed/save back merged values to current AsyncStorage keys (guarantees safe sync)
      await Promise.all([
        AsyncStorage.setItem(KEYS.DATA, JSON.stringify(loadedTx)),
        AsyncStorage.setItem(KEYS.CATS, JSON.stringify(loadedCat)),
        AsyncStorage.setItem(KEYS.REMINDERS, JSON.stringify(loadedRem)),
        AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify({ ...settings, ...loadedSet })),
        AsyncStorage.setItem(KEYS.NOTES, JSON.stringify(loadedNote)),
        AsyncStorage.setItem(KEYS.TODOS, JSON.stringify(loadedTodo)),
        AsyncStorage.setItem(KEYS.HABITS, JSON.stringify(loadedHabit)),
        AsyncStorage.setItem(KEYS.VOICE, JSON.stringify(loadedVoice)),
      ]);

    } catch (e) {
      console.error("Critical Load/Migration Error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromSafetyFile = async () => {
    try {
      const fileUri = `${FileSystem.documentDirectory}tracksy_safety_backup.json`;
      const info = await FileSystem.getInfoAsync(fileUri);
      if (info.exists) {
        const content = await FileSystem.readAsStringAsync(fileUri);
        return JSON.parse(content);
      }
    } catch (e) {
      console.log("Safety recovery check failed:", e);
    }
    return null;
  };

  const saveToSafetyFile = async () => {
    try {
      const backup = { transactions, categories, reminders, settings, notes, todos, habits, voiceNotes };
      const fileUri = `${FileSystem.documentDirectory}tracksy_safety_backup.json`;
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(backup));
    } catch (e) {
      console.error("Safety backup failed:", e);
    }
  };

  useEffect(() => {
      if (!isLoading) {
          saveToSafetyFile();
      }
  }, [transactions, reminders, notes, todos, habits, voiceNotes, settings]);

  useEffect(() => { load(); }, []);

  const addTransaction = async (tx: Omit<Transaction, 'id'>) => {
    const newTx = { ...tx, id: Date.now().toString() };
    const updated = [newTx, ...transactions];
    setTransactions(updated);
    await AsyncStorage.setItem(KEYS.DATA, JSON.stringify(updated));
  };

  const deleteTransaction = (id: string) => {
    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    AsyncStorage.setItem(KEYS.DATA, JSON.stringify(updated));
  };

  const deleteTransactions = (ids: string[]) => {
    const updated = transactions.filter(t => !ids.includes(t.id));
    setTransactions(updated);
    AsyncStorage.setItem(KEYS.DATA, JSON.stringify(updated));
  };

  const updateTransaction = async (id: string, tx: Partial<Transaction>) => {
    const updated = transactions.map(t => t.id === id ? { ...t, ...tx } : t);
    setTransactions(updated);
    await AsyncStorage.setItem(KEYS.DATA, JSON.stringify(updated));
  };

  const markReminderPaid = async (id: string, trackAsExpense: boolean = true, manualDate?: string) => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const rem = reminders.find(r => r.id === id);
    if (!rem) return;
    // Allow multiple payments if it's a tenure-based reminder (totalMonths exists)
    if (!rem.totalMonths && rem.lastPaidMonth === currentMonth) return;
    
    const updatedReminders = reminders.map(r => {
      if (r.id !== id) return r;
      
      const newPaidCount = (r.paidMonths || 0) + 1;
      const isDone = r.totalMonths ? newPaidCount >= r.totalMonths : false;
      const newHistory = [...(r.paymentHistory || []), { date: manualDate || new Date().toISOString(), amount: r.amount }];
      
      return { 
        ...r, 
        lastPaidMonth: currentMonth, 
        paidMonths: newPaidCount,
        isCompleted: isDone,
        paymentHistory: newHistory
      };
    });
    setReminders(updatedReminders);
    await AsyncStorage.setItem(KEYS.REMINDERS, JSON.stringify(updatedReminders));

    if (rem && trackAsExpense !== false) {
        const catId = rem.type === 'bill' ? '3' : '4';
        await addTransaction({ 
            amount: rem.amount, 
            type: 'expense', 
            categoryId: catId, 
            note: rem.name, 
            date: new Date().toISOString() 
        });
    }
  };

  const addReminder = (rem: Omit<Reminder, 'id'>) => {
    const updated = [...reminders, { ...rem, id: Date.now().toString() }];
    setReminders(updated);
    AsyncStorage.setItem(KEYS.REMINDERS, JSON.stringify(updated));
  };

  const updateReminder = async (id: string, rem: Partial<Reminder>) => {
    const updated = reminders.map(r => r.id === id ? { ...r, ...rem } : r);
    setReminders(updated);
    await AsyncStorage.setItem(KEYS.REMINDERS, JSON.stringify(updated));
  };

  const deleteReminder = (id: string) => {
    const updated = reminders.filter(r => r.id !== id);
    setReminders(updated);
    AsyncStorage.setItem(KEYS.REMINDERS, JSON.stringify(updated));
  };

  const addNote = async (n: Omit<Note, 'id'>) => {
    const newNote = { ...n, id: Date.now().toString() };
    const updated = [newNote, ...notes];
    setNotes(updated);
    await AsyncStorage.setItem(KEYS.NOTES, JSON.stringify(updated));
  };

  const updateNote = async (id: string, n: Partial<Note>) => {
    const updated = notes.map(note => note.id === id ? { ...note, ...n } : note);
    setNotes(updated);
    await AsyncStorage.setItem(KEYS.NOTES, JSON.stringify(updated));
  };

  const deleteNote = (id: string) => {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    AsyncStorage.setItem(KEYS.NOTES, JSON.stringify(updated));
  };

  const saveTodos = async (tds: Todo[]) => {
    setTodos(tds);
    await AsyncStorage.setItem(KEYS.TODOS, JSON.stringify(tds));
  };

  const addTodo = async (td: Omit<Todo, 'id'>) => {
    const id = Date.now().toString();
    const newTodo = { ...td, id };
    const updated = [newTodo, ...todos];
    await saveTodos(updated);
    return id;
  };

  const updateTodo = async (id: string, td: Partial<Todo>) => {
    const updated = todos.map(t => t.id === id ? { ...t, ...td } : t);
    setTodos(updated);
    await AsyncStorage.setItem(KEYS.TODOS, JSON.stringify(updated));
  };

  const addHabit = async (h: Omit<Habit, 'id' | 'logs'>) => {
    const newHabit = { ...h, id: Date.now().toString(), logs: [] };
    const updated = [newHabit, ...habits];
    setHabits(updated);
    await AsyncStorage.setItem(KEYS.HABITS, JSON.stringify(updated));
    return newHabit.id;
  };

  const updateHabit = async (id: string, h: Partial<Habit>) => {
    const updated = habits.map(hab => hab.id === id ? { ...hab, ...h } : hab);
    setHabits(updated);
    await AsyncStorage.setItem(KEYS.HABITS, JSON.stringify(updated));
  };

  const deleteHabit = (id: string) => {
    const updated = habits.filter(h => h.id !== id);
    setHabits(updated);
    AsyncStorage.setItem(KEYS.HABITS, JSON.stringify(updated));
  };

  const addVoiceNote = async (vn: Omit<VoiceNote, 'id'>) => {
    const id = Date.now().toString();
    const newVn = { ...vn, id };
    const updated = [newVn, ...voiceNotes];
    setVoiceNotes(updated);
    await AsyncStorage.setItem(KEYS.VOICE, JSON.stringify(updated));
    return id;
  };

  const updateVoiceNote = async (id: string, vn: Partial<VoiceNote>) => {
    const updated = voiceNotes.map(v => v.id === id ? { ...v, ...vn } : v);
    setVoiceNotes(updated);
    await AsyncStorage.setItem(KEYS.VOICE, JSON.stringify(updated));
  };

  const deleteVoiceNote = async (id: string) => {
    const vn = voiceNotes.find(v => v.id === id);
    if (vn) {
        try {
            await FileSystem.deleteAsync(vn.uri);
        } catch (e) {}
    }
    const updated = voiceNotes.filter(v => v.id !== id);
    setVoiceNotes(updated);
    await AsyncStorage.setItem(KEYS.VOICE, JSON.stringify(updated));
  };

  const updateSettings = (s: UserSettings) => {
    setSettings(s);
    AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(s));
  };

  const exportData = async () => {
    try {
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (!isSharingAvailable) {
        throw new Error("Sharing is not available on this device");
      }

      const backup = { 
        transactions, 
        categories, 
        reminders, 
        settings, 
        notes, 
        todos, 
        habits,
        voiceNotes,
        exportDate: new Date().toISOString(),
        appName: 'Tracksy'
      };

      // Use a timestamped filename to avoid cache issues in native builds
      const fileName = `tracksy_backup_${new Date().getTime()}.json`;
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(backup));
      
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Export Tracksy Backup',
        UTI: 'public.json'
      });
    } catch (error) {
      console.error("Export Error:", error);
      throw error;
    }
  };

  const importData = async (json: string) => {
    try {
      const data = JSON.parse(json);
      if (data.transactions) setTransactions(data.transactions);
      if (data.categories) setCategories(data.categories);
      if (data.reminders) setReminders(data.reminders);
      if (data.settings) setSettings(data.settings);
      if (data.notes) setNotes(data.notes);
      if (data.todos) setTodos(data.todos);
      if (data.habits) setHabits(data.habits);
      if (data.voiceNotes) setVoiceNotes(data.voiceNotes);
      
      await Promise.all([
          AsyncStorage.setItem(KEYS.DATA, JSON.stringify(data.transactions || [])),
          AsyncStorage.setItem(KEYS.CATS, JSON.stringify(data.categories || DEFAULT_CATS)),
          AsyncStorage.setItem(KEYS.REMINDERS, JSON.stringify(data.reminders || [])),
          AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(data.settings || settings)),
          AsyncStorage.setItem(KEYS.NOTES, JSON.stringify(data.notes || [])),
          AsyncStorage.setItem(KEYS.TODOS, JSON.stringify(data.todos || [])),
          AsyncStorage.setItem(KEYS.HABITS, JSON.stringify(data.habits || [])),
          AsyncStorage.setItem(KEYS.VOICE, JSON.stringify(data.voiceNotes || []))
      ]);
    } catch (e) {
        throw new Error("Invalid backup file");
    }
  };

  const clearAllData = async () => {
    // 1. Wipe all AsyncStorage keys
    await AsyncStorage.multiRemove(Object.values(KEYS));
    
    // 2. Delete safety backup file from FileSystem (Factory Reset clean-wipe)
    try {
      const fileUri = `${FileSystem.documentDirectory}tracksy_safety_backup.json`;
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
    } catch (e) {
      console.log("Failed to clear safety backup file:", e);
    }
    
    // 3. Clear react state
    setTransactions([]); setReminders([]); setNotes([]); setTodos([]); setHabits([]); setVoiceNotes([]); setCategories(DEFAULT_CATS); 
    setSettings({ 
        isLocked: false, 
        pin: null, 
        currency: '₹', 
        theme: 'dark', 
        userName: 'Guest',
        userImage: null,
        hasOnboarded: false,
        hasSeenTour: false
    });
  };

  const detectCategory = useCallback((note: string) => {
    const input = note.toLowerCase();
    if (input.includes('food') || input.includes('pizza') || input.includes('dinner') || input.includes('swiggy')) return '1';
    if (input.includes('uber') || input.includes('taxi') || input.includes('auto') || input.includes('petrol')) return '2';
    if (input.includes('bill') || input.includes('rent') || input.includes('recharge')) return '3';
    if (input.includes('emi') || input.includes('loan')) return '4';
    if (input.includes('salary') || input.includes('paycheck')) return '5';
    return null;
  }, []);

  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem('tracksy_sms', JSON.stringify(smsBills));
    }
  }, [smsBills, isLoading]);

  // Notification Parsing Listener
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      const body = notification.request.content.body || notification.request.content.title;
      if (body) {
        const parsed = parseFinancialText(body);
        if (parsed) {
          setSmsBills(prev => {
            const id = Date.now().toString();
            // Avoid duplicates within same session/short time
            const isDuplicate = prev.some(s => s.name === parsed.name && Math.abs(s.amount - parsed.amount) < 1);
            if (isDuplicate) return prev;
            
            return [{
              id,
              name: parsed.name,
              amount: parsed.amount,
              dueDay: parsed.date.getDate(),
              type: parsed.type
            }, ...prev];
          });
        }
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <DatabaseContext.Provider 
      value={{ 
        transactions, categories, reminders, notes, todos, habits, isLoading, Colors,
        addTransaction, updateTransaction, deleteTransaction, deleteTransactions,
        markReminderPaid, addReminder, updateReminder, deleteReminder,
        addNote, updateNote, deleteNote,
        addTodo, updateTodo, saveTodos,
        addHabit, updateHabit, deleteHabit,
        voiceNotes, addVoiceNote, updateVoiceNote, deleteVoiceNote,
        settings, setSettings: updateSettings, refresh: load,
        clearAllData, exportData, importData, detectCategory,
        globalMonth, setGlobalMonth,
        smsBills, setSmsBills,
        saveToSafetyFile
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
}
