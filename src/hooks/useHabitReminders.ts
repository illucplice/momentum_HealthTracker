import { useEffect, useRef } from 'react';
import type { Habit, HabitRecord } from '@/types';
import { toDateKey } from '@/lib/date';
import { isCompleted, isHabitActiveOnDate } from '@/lib/habits';
import { showToast } from '@/components/Toast';

const FIRED_KEY = 'momentum:remindersFired';

function loadFired(): Record<string, true> {
  try {
    const raw = localStorage.getItem(FIRED_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveFired(fired: Record<string, true>) {
  try {
    localStorage.setItem(FIRED_KEY, JSON.stringify(fired));
  } catch {
    // ignore storage failures (private browsing, quota, etc.)
  }
}

/**
 * Polls once a minute for any habit whose reminder is due right now (matching
 * time-of-day and day-of-week) and hasn't already been completed today.
 * Fires a native browser notification when permission has been granted,
 * and always falls back to an in-app toast so reminders are never silent.
 */
export function useHabitReminders(habits: Habit[], records: HabitRecord[]) {
  const habitsRef = useRef(habits);
  const recordsRef = useRef(records);
  habitsRef.current = habits;
  recordsRef.current = records;

  useEffect(() => {
    const check = () => {
      const now = new Date();
      const dateKey = toDateKey(now);
      const dayOfWeek = now.getDay();
      const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const fired = loadFired();
      let changed = false;

      for (const habit of habitsRef.current) {
        if (!habit.reminder_enabled || !habit.reminder_time) continue;
        if (!isHabitActiveOnDate(habit, dateKey)) continue;
        if (!(habit.reminder_days || []).includes(dayOfWeek)) continue;
        if (habit.reminder_time.slice(0, 5) !== hhmm) continue;

        const fireKey = `${habit.id}:${dateKey}:${hhmm}`;
        if (fired[fireKey]) continue;

        const record = recordsRef.current.find(r => r.habit_id === habit.id && r.date === dateKey);
        const alreadyDone = record ? isCompleted(record.actual_value, habit.target_value) : false;
        if (alreadyDone) continue;

        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification('Momentum', {
            body: `Time for: ${habit.name}`,
            tag: fireKey,
          });
        } else {
          showToast(`Reminder: ${habit.name}`, 'info');
        }

        fired[fireKey] = true;
        changed = true;
      }

      if (changed) saveFired(fired);
    };

    check();
    const interval = setInterval(check, 30_000);
    return () => clearInterval(interval);
  }, []);
}

export async function requestReminderPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof Notification === 'undefined') return 'unsupported';
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission;
  }
  return Notification.requestPermission();
}

export function getReminderPermission(): NotificationPermission | 'unsupported' {
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission;
}
