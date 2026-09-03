import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useData } from '@/store/DataContext';
import { useNav } from '@/store/NavContext';
import { getMonthMatrix, toDateKey, isToday, formatMonthYear, getWeekdayLabels, formatFullDate } from '@/lib/date';
import { isHabitActiveOnDate, isCompleted } from '@/lib/habits';
import { HabitCard } from '@/components/HabitCard';
import { HabitForm } from '@/components/HabitForm';
import type { Habit } from '@/types';

export function CalendarPage() {
  const { habits, records, entries, categories } = useData();
  const { selectedDate, setSelectedDate } = useNav();
  const [calMonth, setCalMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [showForm, setShowForm] = useState(false);

  const dateKey = toDateKey(selectedDate);
  const dayRecords = records.filter(r => r.date === dateKey);
  const activeHabits = habits.filter(h => isHabitActiveOnDate(h, dateKey));

  const getDayCompletion = (date: Date) => {
    const dKey = toDateKey(date);
    const dActive = habits.filter(h => isHabitActiveOnDate(h, dKey));
    if (dActive.length === 0) return null;
    const dRecords = records.filter(r => r.date === dKey);
    const dCompleted = dRecords.filter(r => {
      const h = habits.find(h => h.id === r.habit_id);
      return h ? isCompleted(r.actual_value, h.target_value) : false;
    }).length;
    return { completed: dCompleted, total: dActive.length, pct: (dCompleted / dActive.length) * 100 };
  };

  const matrix = getMonthMatrix(calMonth.getFullYear(), calMonth.getMonth());

  return (
    <div className="px-6 py-6 max-w-6xl mx-auto pb-24 md:pb-6">
      <h1 className="text-2xl font-bold text-white mb-1">Calendar</h1>
      <p className="text-sm text-zinc-500 mb-6">View your completion history and navigate to any date</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Calendar */}
        <div className="card p-5 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1))} className="btn-icon">
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-semibold text-white">{formatMonthYear(calMonth)}</span>
            <button onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1))} className="btn-icon">
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {getWeekdayLabels().map(d => (
              <div key={d} className="text-center text-[10px] font-semibold text-zinc-500 uppercase py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {matrix.flat().map((date, i) => {
              if (!date) return <div key={i} />;
              const dKey = toDateKey(date);
              const isSelected = dKey === dateKey;
              const isCurrentMonth = date.getMonth() === calMonth.getMonth();
              const completion = getDayCompletion(date);
              const today = isToday(date);

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(date)}
                  className={`relative aspect-square rounded-lg flex flex-col items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-indigo-500 text-white font-semibold'
                      : isCurrentMonth
                      ? 'text-zinc-300 hover:bg-hover'
                      : 'text-zinc-600'
                  }`}
                >
                  <span className="text-sm">{date.getDate()}</span>
                  {today && !isSelected && <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-indigo-400" />}
                  {completion && isCurrentMonth && (
                    <div className="mt-0.5 flex items-center gap-0.5">
                      {completion.pct >= 100 ? (
                        <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-400'}`} />
                      ) : completion.pct >= 50 ? (
                        <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/70' : 'bg-amber-400'}`} />
                      ) : completion.pct > 0 ? (
                        <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/50' : 'bg-zinc-500'}`} />
                      ) : (
                        <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/20' : 'bg-zinc-700'}`} />
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-subtle">
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400" /> <span className="text-zinc-500">High</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-400" /> <span className="text-zinc-500">Partial</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-zinc-700" /> <span className="text-zinc-500">None</span>
              </div>
            </div>
          </div>
        </div>

        {/* Selected date details */}
        <div className="lg:col-span-2">
          <div className="card p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">{formatFullDate(selectedDate)}</h2>
                <p className="text-xs text-zinc-500">
                  {activeHabits.length} active habits
                </p>
              </div>
              {!isToday(selectedDate) && (
                <button onClick={() => setSelectedDate(new Date())} className="btn-ghost !text-xs">Jump to Today</button>
              )}
            </div>
          </div>

          {activeHabits.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-zinc-400 text-sm">No active habits for this date.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeHabits.map(habit => {
                const record = dayRecords.find(r => r.habit_id === habit.id);
                const habitEntries = record ? entries.filter(e => e.habit_record_id === record.id) : [];
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
          )}
        </div>
      </div>

      <HabitForm open={showForm} onClose={() => setShowForm(false)} editingHabit={editingHabit} categories={categories} />
    </div>
  );
}
