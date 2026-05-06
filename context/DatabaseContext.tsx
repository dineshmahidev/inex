import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme } from '@/constants/theme';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

const KEYS = {
  DATA: '@smart_data_v4',
  CATS: '@smart_cats_v3',
  REMINDERS: '@smart_reminders_v2',
  SETTINGS: '@smart_settings_v4',
  NOTES: '@smart_notes_v1',
  TODOS: '@smart_todos_v1',
  HABITS: '@smart_habits_v1',
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
  customDate?: string; // ISO string for the strict custom date
}

export interface UserSettings {
  isLocked: boolean;
  pin: string | null;
  currency: string;
  theme: 'dark' | 'light';
  userName: string;
  userImage: string | null;
  hasOnboarded: boolean;
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
  isLoading: boolean;
  Colors: any;
  addTransaction: (tx: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, tx: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => void;
  markReminderPaid: (id: string, trackAsExpense?: boolean) => Promise<void>;
  addReminder: (rem: Omit<Reminder, 'id'>) => void;
  updateReminder: (id: string, rem: Partial<Reminder>) => Promise<void>;
  deleteReminder: (id: string) => void;
  addNote: (note: Omit<Note, 'id'>) => Promise<void>;
  updateNote: (id: string, note: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => void;
  addTodo: (td: Omit<Todo, 'id'>) => Promise<string>;
  updateTodo: (id: string, td: Partial<Todo>) => Promise<void>;
  saveTodos: (todos: Todo[]) => Promise<void>;
  addHabit: (h: Omit<Habit, 'id' | 'logs'>) => Promise<void>;
  updateHabit: (id: string, h: Partial<Habit>) => Promise<void>;
  deleteHabit: (id: string) => void;
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
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATS);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [smsBills, setSmsBills] = useState<{ id: string; name: string; amount: number; dueDay: number; type: 'bill'|'emi'|'loan' }[]>([]);
  const [settings, setSettings] = useState<UserSettings>({ 
    isLocked: false, 
    pin: null, 
    currency: '₹', 
    theme: 'dark',
    userName: 'Guest',
    userImage: null,
    hasOnboarded: false
  });

  const [isLoading, setIsLoading] = useState(true);
  const [globalMonth, setGlobalMonth] = useState<Date>(new Date());

  const Colors = settings.theme === 'light' ? Theme.light : Theme.dark;

  const load = async () => {
    try {
      const [t, c, r, s, n, td, h, sms] = await Promise.all([
        AsyncStorage.getItem(KEYS.DATA),
        AsyncStorage.getItem(KEYS.CATS),
        AsyncStorage.getItem(KEYS.REMINDERS),
        AsyncStorage.getItem(KEYS.SETTINGS),
        AsyncStorage.getItem(KEYS.NOTES),
        AsyncStorage.getItem(KEYS.TODOS),
        AsyncStorage.getItem(KEYS.HABITS),
        AsyncStorage.getItem('tracksy_sms'),
      ]);
      if (t) setTransactions(JSON.parse(t));
      if (c) setCategories(JSON.parse(c));
      if (r) setReminders(JSON.parse(r));
      if (n) setNotes(JSON.parse(n));
      if (td) setTodos(JSON.parse(td));
      if (h) setHabits(JSON.parse(h));
      if (sms) setSmsBills(JSON.parse(sms));
      if (s) {
          const loadedSettings = JSON.parse(s);
          setSettings(prev => ({...prev, ...loadedSettings}));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

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

  const updateTransaction = async (id: string, tx: Partial<Transaction>) => {
    const updated = transactions.map(t => t.id === id ? { ...t, ...tx } : t);
    setTransactions(updated);
    await AsyncStorage.setItem(KEYS.DATA, JSON.stringify(updated));
  };

  const markReminderPaid = async (id: string, trackAsExpense: boolean = true) => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const rem = reminders.find(r => r.id === id);
    if (!rem || rem.lastPaidMonth === currentMonth) return;
    
    const updatedReminders = reminders.map(r => 
      r.id === id 
        ? { ...r, lastPaidMonth: currentMonth, paidMonths: (r.paidMonths || 0) + 1 } 
        : r
    );
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

  const updateSettings = (s: UserSettings) => {
    setSettings(s);
    AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(s));
  };

  const exportData = async () => {
    const backup = { transactions, categories, reminders, settings, notes, todos, habits };
    const fileUri = FileSystem.cacheDirectory + 'inex_backup.json';
    await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(backup));
    await Sharing.shareAsync(fileUri);
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
      
      await Promise.all([
          AsyncStorage.setItem(KEYS.DATA, JSON.stringify(data.transactions || [])),
          AsyncStorage.setItem(KEYS.CATS, JSON.stringify(data.categories || DEFAULT_CATS)),
          AsyncStorage.setItem(KEYS.REMINDERS, JSON.stringify(data.reminders || [])),
          AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(data.settings || settings)),
          AsyncStorage.setItem(KEYS.NOTES, JSON.stringify(data.notes || [])),
          AsyncStorage.setItem(KEYS.TODOS, JSON.stringify(data.todos || [])),
          AsyncStorage.setItem(KEYS.HABITS, JSON.stringify(data.habits || []))
      ]);
    } catch (e) {
        throw new Error("Invalid backup file");
    }
  };

  const clearAllData = async () => {
    await AsyncStorage.multiRemove(Object.values(KEYS));
    setTransactions([]); setReminders([]); setNotes([]); setTodos([]); setHabits([]); setCategories(DEFAULT_CATS); 
    setSettings({ 
        isLocked: false, 
        pin: null, 
        currency: '₹', 
        theme: 'dark', 
        userName: 'Guest',
        userImage: null,
        hasOnboarded: false 
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
  }, [smsBills]);

  return (
    <DatabaseContext.Provider 
      value={{ 
        transactions, categories, reminders, notes, todos, habits, isLoading, Colors,
        addTransaction, updateTransaction, deleteTransaction,
        markReminderPaid, addReminder, updateReminder, deleteReminder,
        addNote, updateNote, deleteNote,
        addTodo, updateTodo, saveTodos,
        addHabit, updateHabit, deleteHabit,
        settings, setSettings: updateSettings, refresh: load,
        clearAllData, exportData, importData, detectCategory,
        globalMonth, setGlobalMonth,
        smsBills, setSmsBills
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
