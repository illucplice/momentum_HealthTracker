import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useData } from '@/store/DataContext';
import { useNav } from '@/store/NavContext';
import { DateNav } from '@/components/DateNav';
import { HabitCard } from '@/components/HabitCard';
import { HabitForm } from '@/components/HabitForm';
import { ProgressBar } from '@/components/ProgressBar';
import { isHabitActiveOnDate, isCompleted } from '@/lib/habits';
import { toDateKey, isToday, getGreeting } from '@/lib/date';
import { MOTIVATIONAL_MESSAGES } from '@/lib/constants';
import type { Habit } from '@/types';

export function TodayPage() {
  const { habits, records, entries, categories } = useData();
  const { selectedDate } = useNav();
  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const dateKey = toDateKey(selectedDate);
  const greeting = getGreeting();
  const motivationalMsg = MOTIVATIONAL_MESSAGES[new Date().getDate() % MOTIVATIONAL_MESSAGES.length];

  const activeHabits = useMemo(() => habits.filter(h => isHabitActiveOnDate(h, dateKey)), [habits, dateKey]);
  const dayRecords = records.filter(r => r.date === dateKey);
  const dayEntries = entries.filter(e => dayRecords.some(r => r.id === e.habit_record_id));

  const completedCount = dayRecords.filter(r => {
    const h = habits.find(h => h.id === r.habit_id);
    return h ? isCompleted(r.actual_value, h.target_value) : false;
  }).length;

  const totalActive = activeHabits.length;
  const remaining = totalActive - completedCount;
  const dayPct = totalActive > 0 ? (completedCount / totalActive) * 100 : 0;

  const incompleteHabits = activeHabits.filter(h => {
    const r = dayRecords.find(rec => rec.habit_id === h.id);
    return r ? !isCompleted(r.actual_value, h.target_value) : true;
  });
  const completeHabits = activeHabits.filter(h => {
    const r = dayRecords.find(rec => rec.habit_id === h.id);
    return r ? isCompleted(r.actual_value, h.target_value) : false;
  });

  return (
    <div className="px-6 py-6 max-w-4xl mx-auto pb-24 md:pb-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-0.5">{greeting}</h1>
        <p className="text-sm text-zinc-500">{motivationalMsg}</p>
      </div>

      <div className="card p-4 mb-5">
        <DateNav />
      </div>

      {/* Progress */}
      <div className="card p-6 mb-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              {isToday(selectedDate) ? "Today's Progress" : 'Progress'}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">{completedCount}</span>
              <span className="text-lg text-zinc-500">/ {totalActive} habits</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-indigo-400">{Math.round(dayPct)}%</div>
            <p className="text-xs text-zinc-500">{remaining > 0 ? `${remaining} remaining` : 'all done'}</p>
          </div>
        </div>
        <ProgressBar percentage={dayPct} color="#6366f1" height={10} />
      </div>

      {/* Incomplete habits first */}
      {incompleteHabits.length > 0 && (
        <>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
            {isToday(selectedDate) ? 'Still To Do' : 'Not Completed'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            {incompleteHabits.map(habit => {
              const record = dayRecords.find(r => r.habit_id === habit.id);
              const habitEntries = record ? dayEntries.filter(e => e.habit_record_id === record.id) : [];
              return (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  date={selectedDate}
                  record={record}
                  entries={habitEntries}
                  onEdit={() => { setEditingHabit(habit); setShowForm(true); }}
                />
              );
            })}
          </div>
        </>
      )}

      {/* Completed habits */}
      {completeHabits.length > 0 && (
        <>
          <p className="text-xs font-semibold text-emerald-400/70 uppercase tracking-wider mb-3">Completed</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {completeHabits.map(habit => {
              const record = dayRecords.find(r => r.habit_id === habit.id);
              const habitEntries = record ? dayEntries.filter(e => e.habit_record_id === record.id) : [];
              return (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  date={selectedDate}
                  record={record}
                  entries={habitEntries}
                  onEdit={() => { setEditingHabit(habit); setShowForm(true); }}
                />
              );
            })}
          </div>
        </>
      )}

      {activeHabits.length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-zinc-400 text-sm mb-1">No active habits for this date.</p>
          <button onClick={() => { setEditingHabit(null); setShowForm(true); }} className="btn-primary mx-auto mt-4">
            <Plus size={16} /> Create a habit
          </button>
        </div>
      )}

      <HabitForm open={showForm} onClose={() => setShowForm(false)} editingHabit={editingHabit} categories={categories} />
    </div>
  );
}
