export type HabitType = 'yes_no' | 'numeric' | 'duration' | 'count';

export interface Category {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Habit {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  category_id: string | null;
  color: string;
  habit_type: HabitType;
  target_value: number;
  unit: string;
  start_date: string;
  end_date: string | null;
  reminder_time: string | null;
  reminder_days: number[];
  reminder_enabled: boolean;
  is_active: boolean;
  is_archived: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface HabitRecord {
  id: string;
  habit_id: string;
  date: string;
  target_value: number;
  actual_value: number;
  completed: boolean;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface HabitEntry {
  id: string;
  habit_record_id: string;
  value: number;
  note: string | null;
  created_at: string;
}

export interface Routine {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  sort_order: number;
  created_at: string;
}

export interface RoutineHabit {
  id: string;
  routine_id: string;
  habit_id: string;
  sort_order: number;
}

export interface HabitWithCategory extends Habit {
  category: Category | null;
}

export interface HabitRecordWithEntries extends HabitRecord {
  habit_entries: HabitEntry[];
}
