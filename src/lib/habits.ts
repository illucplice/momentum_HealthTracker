import type { Habit, HabitRecord, HabitEntry } from '@/types';

export function isHabitActiveOnDate(habit: Habit, dateKey: string): boolean {
  if (!habit.is_active || habit.is_archived) return false;
  const habitStart = habit.start_date;
  if (dateKey < habitStart) return false;
  if (habit.end_date && dateKey > habit.end_date) return false;
  return true;
}

export function computeCompletion(actual: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, (actual / target) * 100);
}

export function isCompleted(actual: number, target: number): boolean {
  return actual >= target;
}

export function isTargetExceeded(actual: number, target: number): boolean {
  return actual > target;
}

export function formatValue(value: number, unit: string): string {
  const rounded = Math.round(value * 100) / 100;
  if (unit === 'minutes') return `${rounded} min`;
  if (unit === 'hours') return `${rounded} hr`;
  if (unit === 'session' || unit === 'sessions') {
    return `${rounded} ${rounded === 1 ? 'session' : 'sessions'}`;
  }
  return `${rounded} ${unit}`;
}

export function isOneClickHabit(habit: Habit): boolean {
  return habit.habit_type === 'yes_no' || habit.target_value === 1;
}

export function computeStreak(
  habitId: string,
  records: Map<string, HabitRecord>,
  entriesByRecord: Map<string, HabitEntry[]>,
  habit: Habit,
  todayKey: string,
): { current: number; best: number } {
  const startDate = habit.start_date;
  const start = startDate > todayKey ? todayKey : startDate;

  let currentDate = fromDateKeySafe(todayKey);
  let current = 0;

  while (true) {
    const key = toDateKeySafe(currentDate);
    if (key < start) break;
    const record = records.get(key);
    const actual = record ? record.actual_value : 0;
    if (actual >= habit.target_value) {
      current++;
      currentDate = addDaysSafe(currentDate, -1);
    } else {
      if (key === todayKey) {
        currentDate = addDaysSafe(currentDate, -1);
        continue;
      }
      break;
    }
  }

  const best = computeBestStreak(habit, records, start, todayKey);
  return { current, best };
}

function computeBestStreak(
  habit: Habit,
  records: Map<string, HabitRecord>,
  startDate: string,
  endDate: string,
): number {
  let best = 0;
  let streak = 0;
  let current = fromDateKeySafe(startDate);
  const end = fromDateKeySafe(endDate);

  while (current <= end) {
    const key = toDateKeySafe(current);
    const record = records.get(key);
    const actual = record ? record.actual_value : 0;
    if (actual >= habit.target_value) {
      streak++;
      best = Math.max(best, streak);
    } else {
      streak = 0;
    }
    current = addDaysSafe(current, 1);
  }
  return best;
}

function fromDateKeySafe(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toDateKeySafe(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDaysSafe(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
