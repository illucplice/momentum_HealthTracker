import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { Habit, HabitRecord, HabitEntry, Category, Routine, RoutineHabit, HabitType } from '@/types';
import { toDateKey } from '@/lib/date';
import { isCompleted } from '@/lib/habits';
import { DEFAULT_CATEGORIES } from '@/lib/constants';

interface DataState {
  habits: Habit[];
  records: HabitRecord[];
  entries: HabitEntry[];
  categories: Category[];
  routines: Routine[];
  routineHabits: RoutineHabit[];
  loading: boolean;
  error: string | null;

  createHabit: (data: Partial<Habit>) => Promise<Habit | null>;
  updateHabit: (id: string, data: Partial<Habit>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  archiveHabit: (id: string) => Promise<void>;

  getOrCreateRecord: (habitId: string, date: Date) => Promise<HabitRecord | null>;
  setRecordValue: (habitId: string, date: Date, value: number) => Promise<void>;
  incrementRecord: (habitId: string, date: Date, delta: number) => Promise<void>;
  toggleComplete: (habitId: string, date: Date) => Promise<void>;
  addEntry: (habitId: string, date: Date, value: number, note?: string) => Promise<void>;
  deleteEntry: (entryId: string, recordId: string, habitId: string, date: Date) => Promise<void>;
  updateRecordNote: (habitId: string, date: Date, note: string) => Promise<void>;

  createCategory: (name: string, color: string) => Promise<Category | null>;

  createRoutine: (data: Partial<Routine>) => Promise<Routine | null>;
  updateRoutine: (id: string, data: Partial<Routine>) => Promise<void>;
  deleteRoutine: (id: string) => Promise<void>;
  addHabitToRoutine: (routineId: string, habitId: string) => Promise<void>;
  removeHabitFromRoutine: (routineId: string, habitId: string) => Promise<void>;

  refetch: () => Promise<void>;
  clearAllData: () => Promise<boolean>;
}

const DataContext = createContext<DataState | null>(null);

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [records, setRecords] = useState<HabitRecord[]>([]);
  const [entries, setEntries] = useState<HabitEntry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [routineHabits, setRoutineHabits] = useState<RoutineHabit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [habitsRes, recordsRes, entriesRes, categoriesRes, routinesRes, rhRes] = await Promise.all([
        supabase.from('habits').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: true }),
        supabase.from('habit_records').select('*'),
        supabase.from('habit_entries').select('*').order('created_at', { ascending: true }),
        supabase.from('categories').select('*').order('name'),
        supabase.from('routines').select('*').order('sort_order', { ascending: true }),
        supabase.from('routine_habits').select('*').order('sort_order', { ascending: true }),
      ]);

      if (habitsRes.error) throw habitsRes.error;
      if (recordsRes.error) throw recordsRes.error;
      if (entriesRes.error) throw entriesRes.error;
      if (categoriesRes.error) throw categoriesRes.error;
      if (routinesRes.error) throw routinesRes.error;
      if (rhRes.error) throw rhRes.error;

      setHabits(habitsRes.data as Habit[]);
      setRecords(recordsRes.data as HabitRecord[]);
      setEntries(entriesRes.data as HabitEntry[]);
      setCategories(categoriesRes.data as Category[]);
      setRoutines(routinesRes.data as Routine[]);
      setRoutineHabits(rhRes.data as RoutineHabit[]);

      if ((categoriesRes.data as Category[]).length === 0) {
        for (const cat of DEFAULT_CATEGORIES) {
          await supabase.from('categories').insert({ name: cat.name, color: cat.color });
        }
        const { data: newCats } = await supabase.from('categories').select('*').order('name');
        if (newCats) setCategories(newCats as Category[]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const createHabit = useCallback(async (data: Partial<Habit>): Promise<Habit | null> => {
    const insertData = {
      name: data.name || 'Untitled Habit',
      description: data.description || null,
      icon: data.icon || 'CheckCircle',
      category_id: data.category_id || null,
      color: data.color || '#6366f1',
      habit_type: (data.habit_type as HabitType) || 'numeric',
      target_value: data.target_value ?? 1,
      unit: data.unit || 'units',
      start_date: data.start_date || toDateKey(new Date()),
      end_date: data.end_date || null,
      reminder_time: data.reminder_time || null,
      reminder_days: data.reminder_days || [],
      reminder_enabled: data.reminder_enabled ?? false,
      is_active: data.is_active ?? true,
      is_archived: false,
      sort_order: data.sort_order ?? habits.length,
    };
    const { data: result, error: err } = await supabase.from('habits').insert(insertData).select().single();
    if (err) { setError(err.message); return null; }
    const newHabit = result as Habit;
    setHabits(prev => [...prev, newHabit]);
    return newHabit;
  }, [habits.length]);

  const updateHabit = useCallback(async (id: string, data: Partial<Habit>) => {
    const { error: err } = await supabase.from('habits').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id);
    if (err) { setError(err.message); return; }
    setHabits(prev => prev.map(h => h.id === id ? { ...h, ...data } as Habit : h));
  }, []);

  const deleteHabit = useCallback(async (id: string) => {
    const { error: err } = await supabase.from('habits').update({ is_archived: true, is_active: false, updated_at: new Date().toISOString() }).eq('id', id);
    if (err) { setError(err.message); return; }
    setHabits(prev => prev.map(h => h.id === id ? { ...h, is_archived: true, is_active: false } : h));
  }, []);

  const archiveHabit = useCallback(async (id: string) => {
    await updateHabit(id, { is_archived: true, is_active: false });
  }, [updateHabit]);

  const getOrCreateRecord = useCallback(async (habitId: string, date: Date): Promise<HabitRecord | null> => {
    const dateKey = toDateKey(date);
    const existing = records.find(r => r.habit_id === habitId && r.date === dateKey);
    if (existing) return existing;

    const habit = habits.find(h => h.id === habitId);
    if (!habit) return null;

    const { data, error: err } = await supabase
      .from('habit_records')
      .insert({
        habit_id: habitId,
        date: dateKey,
        target_value: habit.target_value,
        actual_value: 0,
        completed: false,
      })
      .select()
      .single();

    if (err) {
      const { data: existing2 } = await supabase
        .from('habit_records')
        .select('*')
        .eq('habit_id', habitId)
        .eq('date', dateKey)
        .maybeSingle();
      if (existing2) {
        const rec = existing2 as HabitRecord;
        setRecords(prev => prev.some(r => r.id === rec.id) ? prev : [...prev, rec]);
        return rec;
      }
      return null;
    }

    const newRecord = data as HabitRecord;
    setRecords(prev => [...prev, newRecord]);
    return newRecord;
  }, [records, habits]);

  const setRecordValue = useCallback(async (habitId: string, date: Date, value: number) => {
    const record = await getOrCreateRecord(habitId, date);
    if (!record) return;
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;
    const completed = isCompleted(value, habit.target_value);

    const { error: err } = await supabase
      .from('habit_records')
      .update({ actual_value: value, completed, updated_at: new Date().toISOString() })
      .eq('id', record.id);

    if (err) { setError(err.message); return; }
    setRecords(prev => prev.map(r => r.id === record.id ? { ...r, actual_value: value, completed } : r));
  }, [getOrCreateRecord, habits]);

  const incrementRecord = useCallback(async (habitId: string, date: Date, delta: number) => {
    const record = await getOrCreateRecord(habitId, date);
    if (!record) return;
    const newValue = Math.max(0, record.actual_value + delta);
    await setRecordValue(habitId, date, newValue);
  }, [getOrCreateRecord, setRecordValue]);

  const toggleComplete = useCallback(async (habitId: string, date: Date) => {
    const record = await getOrCreateRecord(habitId, date);
    if (!record) return;
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;
    const newValue = record.completed ? 0 : habit.target_value;
    await setRecordValue(habitId, date, newValue);
  }, [getOrCreateRecord, habits, setRecordValue]);

  const addEntry = useCallback(async (habitId: string, date: Date, value: number, note?: string) => {
    const record = await getOrCreateRecord(habitId, date);
    if (!record) return;
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const { data: newEntry, error: err } = await supabase
      .from('habit_entries')
      .insert({ habit_record_id: record.id, value, note: note || null })
      .select()
      .single();

    if (err) { setError(err.message); return; }
    const entry = newEntry as HabitEntry;
    setEntries(prev => [...prev, entry]);

    const newValue = Math.max(0, record.actual_value + value);
    const completed = isCompleted(newValue, habit.target_value);
    const { error: err2 } = await supabase
      .from('habit_records')
      .update({ actual_value: newValue, completed, updated_at: new Date().toISOString() })
      .eq('id', record.id);
    if (err2) { setError(err2.message); return; }
    setRecords(prev => prev.map(r => r.id === record.id ? { ...r, actual_value: newValue, completed } : r));
  }, [getOrCreateRecord, habits]);

  const deleteEntry = useCallback(async (entryId: string, recordId: string, _habitId: string, _date: Date) => {
    const entry = entries.find(e => e.id === entryId);
    if (!entry) return;
    const { error: err } = await supabase.from('habit_entries').delete().eq('id', entryId);
    if (err) { setError(err.message); return; }
    setEntries(prev => prev.filter(e => e.id !== entryId));

    const record = records.find(r => r.id === recordId);
    if (!record) return;
    const newValue = Math.max(0, record.actual_value - entry.value);
    const habit = habits.find(h => h.id === record.habit_id);
    const completed = habit ? isCompleted(newValue, habit.target_value) : false;
    const { error: err2 } = await supabase
      .from('habit_records')
      .update({ actual_value: newValue, completed, updated_at: new Date().toISOString() })
      .eq('id', recordId);
    if (err2) { setError(err2.message); return; }
    setRecords(prev => prev.map(r => r.id === recordId ? { ...r, actual_value: newValue, completed } : r));
  }, [entries, records, habits]);

  const updateRecordNote = useCallback(async (habitId: string, date: Date, note: string) => {
    const record = await getOrCreateRecord(habitId, date);
    if (!record) return;
    const { error: err } = await supabase
      .from('habit_records')
      .update({ note, updated_at: new Date().toISOString() })
      .eq('id', record.id);
    if (err) { setError(err.message); return; }
    setRecords(prev => prev.map(r => r.id === record.id ? { ...r, note } : r));
  }, [getOrCreateRecord]);

  const createCategory = useCallback(async (name: string, color: string): Promise<Category | null> => {
    const { data, error: err } = await supabase.from('categories').insert({ name, color }).select().single();
    if (err) { setError(err.message); return null; }
    const cat = data as Category;
    setCategories(prev => [...prev, cat]);
    return cat;
  }, []);

  const createRoutine = useCallback(async (data: Partial<Routine>): Promise<Routine | null> => {
    const insertData = {
      name: data.name || 'Untitled Routine',
      description: data.description || null,
      icon: data.icon || 'Sunrise',
      color: data.color || '#6366f1',
      sort_order: data.sort_order ?? routines.length,
    };
    const { data: result, error: err } = await supabase.from('routines').insert(insertData).select().single();
    if (err) { setError(err.message); return null; }
    const newRoutine = result as Routine;
    setRoutines(prev => [...prev, newRoutine]);
    return newRoutine;
  }, [routines.length]);

  const updateRoutine = useCallback(async (id: string, data: Partial<Routine>) => {
    const { error: err } = await supabase.from('routines').update(data).eq('id', id);
    if (err) { setError(err.message); return; }
    setRoutines(prev => prev.map(r => r.id === id ? { ...r, ...data } as Routine : r));
  }, []);

  const deleteRoutine = useCallback(async (id: string) => {
    const { error: err } = await supabase.from('routines').delete().eq('id', id);
    if (err) { setError(err.message); return; }
    setRoutines(prev => prev.filter(r => r.id !== id));
    setRoutineHabits(prev => prev.filter(rh => rh.routine_id !== id));
  }, []);

  const addHabitToRoutine = useCallback(async (routineId: string, habitId: string) => {
    const existing = routineHabits.find(rh => rh.routine_id === routineId && rh.habit_id === habitId);
    if (existing) return;
    const order = routineHabits.filter(rh => rh.routine_id === routineId).length;
    const { data, error: err } = await supabase
      .from('routine_habits')
      .insert({ routine_id: routineId, habit_id: habitId, sort_order: order })
      .select()
      .single();
    if (err) { setError(err.message); return; }
    setRoutineHabits(prev => [...prev, data as RoutineHabit]);
  }, [routineHabits]);

  const removeHabitFromRoutine = useCallback(async (routineId: string, habitId: string) => {
    const { error: err } = await supabase
      .from('routine_habits')
      .delete()
      .eq('routine_id', routineId)
      .eq('habit_id', habitId);
    if (err) { setError(err.message); return; }
    setRoutineHabits(prev => prev.filter(rh => !(rh.routine_id === routineId && rh.habit_id === habitId)));
  }, []);

  const refetch = useCallback(async () => {
    await fetchAll();
  }, [fetchAll]);

  const clearAllData = useCallback(async (): Promise<boolean> => {
    // habits/routines cascade-delete their records, entries, and routine_habits.
    const { error: habitsErr } = await supabase.from('habits').delete().not('id', 'is', null);
    if (habitsErr) { setError(habitsErr.message); return false; }
    const { error: routinesErr } = await supabase.from('routines').delete().not('id', 'is', null);
    if (routinesErr) { setError(routinesErr.message); return false; }
    const { error: categoriesErr } = await supabase.from('categories').delete().not('id', 'is', null);
    if (categoriesErr) { setError(categoriesErr.message); return false; }

    setHabits([]);
    setRecords([]);
    setEntries([]);
    setRoutines([]);
    setRoutineHabits([]);
    setCategories([]);
    await fetchAll();
    return true;
  }, [fetchAll]);

  const value: DataState = {
    habits, records, entries, categories, routines, routineHabits, loading, error,
    createHabit, updateHabit, deleteHabit, archiveHabit,
    getOrCreateRecord, setRecordValue, incrementRecord, toggleComplete,
    addEntry, deleteEntry, updateRecordNote,
    createCategory,
    createRoutine, updateRoutine, deleteRoutine, addHabitToRoutine, removeHabitFromRoutine,
    refetch, clearAllData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
