import { useMemo, useState } from 'react';
import { Plus, Target, Flame, CheckCircle2 } from 'lucide-react';
import { useData } from '@/store/DataContext';
import { useNav } from '@/store/NavContext';
import { DateNav } from '@/components/DateNav';
import { HabitCard } from '@/components/HabitCard';
import { HabitForm } from '@/components/HabitForm';
import { ProgressBar } from '@/components/ProgressBar';
import { DynamicIcon } from '@/components/DynamicIcon';
import { isHabitActiveOnDate, isCompleted, computeStreak } from '@/lib/habits';
import { toDateKey, getWeekDays, isToday, getGreeting, getWeekdayLabels } from '@/lib/date';
import { MOTIVATIONAL_MESSAGES } from '@/lib/constants';
import type { Habit } from '@/types';

export function OverviewPage() {
  const { habits, records, entries, routines, routineHabits, categories, loading } = useData();
  const { selectedDate, setSelectedDate, setPage } = useNav();
  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const dateKey = toDateKey(selectedDate);
  const greeting = getGreeting();
  const motivationalMsg = MOTIVATIONAL_MESSAGES[new Date().getDate() % MOTIVATIONAL_MESSAGES.length];

  const activeHabits = useMemo(() => habits.filter(h => isHabitActiveOnDate(h, dateKey)), [habits, dateKey]);
  const dayRecords = useMemo(() => records.filter(r => r.date === dateKey), [records, dateKey]);
  const dayEntries = useMemo(() => {
    const recordIds = new Set(dayRecords.map(r => r.id));
    return entries.filter(e => recordIds.has(e.habit_record_id));
  }, [entries, dayRecords]);

  const completedCount = useMemo(() => {
    return dayRecords.filter(r => {
      const habit = habits.find(h => h.id === r.habit_id);
      return habit ? isCompleted(r.actual_value, habit.target_value) : false;
    }).length;
  }, [dayRecords, habits]);

  const totalActive = activeHabits.length;
  const remaining = totalActive - completedCount;
  const dayPct = totalActive > 0 ? (completedCount / totalActive) * 100 : 0;

  // Weekly overview
  const weekDays = getWeekDays(selectedDate);
  const weekData = weekDays.map(d => {
    const dKey = toDateKey(d);
    const dActive = habits.filter(h => isHabitActiveOnDate(h, dKey));
    const dRecords = records.filter(r => r.date === dKey);
    const dCompleted = dRecords.filter(r => {
      const h = habits.find(h => h.id === r.habit_id);
      return h ? isCompleted(r.actual_value, h.target_value) : false;
    }).length;
    return {
      date: d,
      completed: dCompleted,
      total: dActive.length,
      pct: dActive.length > 0 ? (dCompleted / dActive.length) * 100 : 0,
    };
  });

  const weeklyCompleted = weekData.reduce((sum, d) => sum + d.completed, 0);
  const weeklyTotal = weekData.reduce((sum, d) => sum + d.total, 0);
  const weeklyPct = weeklyTotal > 0 ? (weeklyCompleted / weeklyTotal) * 100 : 0;

  // Overall streak (best current streak across all habits)
  const bestStreak = useMemo(() => {
    let best = 0;
    for (const habit of activeHabits) {
      const habitRecords = new Map<string, typeof records[0]>();
      records.filter(r => r.habit_id === habit.id).forEach(r => habitRecords.set(r.date, r));
      const { current } = computeStreak(habit.id, habitRecords, new Map(), habit, toDateKey(new Date()));
      best = Math.max(best, current);
    }
    return best;
  }, [activeHabits, records]);

  const handleEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setShowForm(true);
  };

  if (habits.length === 0 && !loading) {
    return (
      <>
        <EmptyState onCreate={() => { setEditingHabit(null); setShowForm(true); }} />
        <HabitForm open={showForm} onClose={() => setShowForm(false)} editingHabit={editingHabit} categories={categories} />
      </>
    );
  }

  return (
    <div className="px-6 py-6 max-w-6xl mx-auto pb-24 md:pb-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-0.5">{greeting}</h1>
        <p className="text-sm text-zinc-500">{motivationalMsg}</p>
      </div>

      {/* Date Navigation */}
      <div className="card p-4 mb-5">
        <DateNav />
      </div>

      {/* Daily Progress Meter */}
      <div className="card p-6 mb-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Today's Progress</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">{completedCount}</span>
              <span className="text-lg text-zinc-500">/ {totalActive} habits</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-indigo-400">{Math.round(dayPct)}%</div>
            <p className="text-xs text-zinc-500">completed</p>
          </div>
        </div>
        <ProgressBar percentage={dayPct} color="#6366f1" height={10} />
        <div className="flex items-center gap-6 mt-3 text-xs">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-emerald-400" />
            <span className="text-zinc-400">Completed: <span className="text-white font-medium">{completedCount}</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Target size={14} className="text-zinc-500" />
            <span className="text-zinc-400">Remaining: <span className="text-white font-medium">{remaining}</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Flame size={14} className="text-orange-400" />
            <span className="text-zinc-400">Best streak: <span className="text-white font-medium">{bestStreak} days</span></span>
          </div>
        </div>
      </div>

      {/* Weekly Overview */}
      <div className="card p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">This Week</p>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-400">Weekly completion</span>
            <span className="text-white font-semibold">{Math.round(weeklyPct)}%</span>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {weekData.map((d, i) => {
            const isSel = toDateKey(d.date) === dateKey;
            return (
              <button
                key={i}
                onClick={() => setSelectedDate(d.date)}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${
                  isSel ? 'bg-indigo-500/10' : 'hover:bg-hover'
                }`}
              >
                <span className="text-[10px] font-medium text-zinc-500 uppercase">{getWeekdayLabels()[i]}</span>
                <span className={`text-sm font-semibold ${isSel ? 'text-indigo-400' : 'text-zinc-300'}`}>
                  {d.date.getDate()}
                </span>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold relative"
                  style={{
                    background: d.total === 0 ? 'var(--bg-elevated)' : d.pct >= 100 ? 'rgba(16,185,129,0.15)' : d.pct >= 50 ? 'rgba(245,158,11,0.15)' : d.pct > 0 ? 'rgba(99,102,241,0.1)' : 'var(--bg-elevated)',
                    color: d.pct >= 100 ? '#34d399' : d.pct >= 50 ? '#fbbf24' : d.pct > 0 ? '#818cf8' : '#52525b',
                  }}
                >
                  {d.total === 0 ? '—' : `${Math.round(d.pct)}`}
                </div>
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-subtle text-xs">
          <span className="text-zinc-400">Habits completed</span>
          <span className="text-white font-medium">{weeklyCompleted} / {weeklyTotal}</span>
        </div>
      </div>

      {/* Routines (if any) */}
      {routines.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Routines</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {routines.map(routine => {
              const rhForRoutine = routineHabits.filter(rh => rh.routine_id === routine.id);
              const routineHabitsList = rhForRoutine
                .map(rh => habits.find(h => h.id === rh.habit_id))
                .filter((h): h is Habit => !!h && isHabitActiveOnDate(h, dateKey));
              const routineCompleted = routineHabitsList.filter(h => {
                const r = dayRecords.find(rec => rec.habit_id === h.id);
                return r ? isCompleted(r.actual_value, h.target_value) : false;
              }).length;
              const routinePct = routineHabitsList.length > 0 ? (routineCompleted / routineHabitsList.length) * 100 : 0;
              return (
                <button
                  key={routine.id}
                  onClick={() => setPage('routines')}
                  className="card p-4 text-left card-hover"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: `${routine.color}15`, color: routine.color }}
                    >
                      <DynamicIcon name={routine.icon} size={18} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-white">{routine.name}</h3>
                      <p className="text-xs text-zinc-500">{routineCompleted} / {routineHabitsList.length} completed</p>
                    </div>
                    <span className="text-lg font-bold text-indigo-400">{Math.round(routinePct)}%</span>
                  </div>
                  <ProgressBar percentage={routinePct} color={routine.color} height={4} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Habits */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          {isToday(selectedDate) ? "Today's Habits" : 'Habits'}
        </p>
        <button onClick={() => { setEditingHabit(null); setShowForm(true); }} className="btn-ghost !text-xs !py-1.5">
          <Plus size={14} /> New Habit
        </button>
      </div>

      {activeHabits.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-zinc-400 text-sm mb-1">No active habits for this date.</p>
          <p className="text-zinc-600 text-xs">Create a habit or adjust start/end dates.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeHabits.map(habit => {
            const record = dayRecords.find(r => r.habit_id === habit.id);
            const habitEntries = record ? dayEntries.filter(e => e.habit_record_id === record.id) : [];
            return (
              <HabitCard
                key={habit.id}
                habit={habit}
                date={selectedDate}
                record={record}
                entries={habitEntries}
                onEdit={() => handleEdit(habit)}
              />
            );
          })}
        </div>
      )}

      <HabitForm open={showForm} onClose={() => setShowForm(false)} editingHabit={editingHabit} categories={categories} />
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center">
      <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6">
        <Flame size={40} className="text-indigo-400" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Build your first routine.</h2>
      <p className="text-zinc-500 text-sm mb-6 max-w-sm">Start with one small habit and build from there. Momentum grows with consistency.</p>
      <button onClick={onCreate} className="btn-primary">
        <Plus size={16} /> Create your first habit
      </button>
    </div>
  );
}
