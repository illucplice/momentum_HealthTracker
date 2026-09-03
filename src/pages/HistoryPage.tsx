import { useMemo } from 'react';
import { CheckCircle2, XCircle, Circle, ChevronRight } from 'lucide-react';
import { useData } from '@/store/DataContext';
import { useNav } from '@/store/NavContext';
import { toDateKey, addDays, isToday, formatFullDate, formatShortDate } from '@/lib/date';
import { isHabitActiveOnDate, isCompleted } from '@/lib/habits';
import { DynamicIcon } from '@/components/DynamicIcon';

export function HistoryPage() {
  const { habits, records } = useData();
  const { selectedDate, setSelectedDate, setPage } = useNav();

  // Generate last 30 days
  const days = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const date = addDays(new Date(), -i);
      const dateKey = toDateKey(date);
      const active = habits.filter(h => isHabitActiveOnDate(h, dateKey));
      const dayRecords = records.filter(r => r.date === dateKey);
      const completed = dayRecords.filter(r => {
        const h = habits.find(h => h.id === r.habit_id);
        return h ? isCompleted(r.actual_value, h.target_value) : false;
      }).length;
      return { date, dateKey, completed, total: active.length, pct: active.length > 0 ? (completed / active.length) * 100 : 0 };
    });
  }, [habits, records]);

  const dateKey = toDateKey(selectedDate);
  const dayRecords = records.filter(r => r.date === dateKey);
  const activeHabits = habits.filter(h => isHabitActiveOnDate(h, dateKey));

  return (
    <div className="px-6 py-6 max-w-5xl mx-auto pb-24 md:pb-6">
      <h1 className="text-2xl font-bold text-white mb-1">History</h1>
      <p className="text-sm text-zinc-500 mb-6">Look back at your past 30 days of habit tracking</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Timeline */}
        <div>
          <div className="space-y-2">
            {days.map((d, i) => {
              const isSel = d.dateKey === dateKey;
              const label = i === 0 ? 'Today' : i === 1 ? 'Yesterday' : formatShortDate(d.date);
              return (
                <button
                  key={d.dateKey}
                  onClick={() => setSelectedDate(d.date)}
                  className={`card w-full p-4 flex items-center justify-between text-left transition-all ${
                    isSel ? 'border-indigo-500/30 bg-indigo-500/5' : 'card-hover'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold"
                      style={{
                        background: d.total === 0 ? 'var(--bg-elevated)' : d.pct >= 100 ? 'rgba(16,185,129,0.15)' : d.pct >= 50 ? 'rgba(245,158,11,0.15)' : d.pct > 0 ? 'rgba(99,102,241,0.1)' : 'var(--bg-elevated)',
                        color: d.pct >= 100 ? '#34d399' : d.pct >= 50 ? '#fbbf24' : d.pct > 0 ? '#818cf8' : '#52525b',
                      }}
                    >
                      {Math.round(d.pct)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{label}</p>
                      <p className="text-xs text-zinc-500">
                        {d.completed} / {d.total} completed
                        {d.total === 0 && ' (no habits)'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-zinc-300">{Math.round(d.pct)}%</span>
                    <ChevronRight size={16} className="text-zinc-600" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected date detail */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="card p-5">
            <h2 className="text-lg font-semibold text-white mb-1">
              {isToday(selectedDate) ? 'Today' : formatFullDate(selectedDate)}
            </h2>
            <p className="text-xs text-zinc-500 mb-4">
              {activeHabits.length} active habits
            </p>

            {activeHabits.length === 0 ? (
              <p className="text-zinc-500 text-sm text-center py-8">No active habits for this date.</p>
            ) : (
              <div className="space-y-2">
                {activeHabits.map(habit => {
                  const record = dayRecords.find(r => r.habit_id === habit.id);
                  const actual = record?.actual_value ?? 0;
                  const completed = isCompleted(actual, habit.target_value);
                  return (
                    <div key={habit.id} className="flex items-center gap-3 p-3 rounded-xl bg-elevated">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: `${habit.color}15`, color: habit.color }}
                      >
                        <DynamicIcon name={habit.icon} size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{habit.name}</p>
                        <p className="text-xs text-zinc-500">
                          {actual} / {habit.target_value} {habit.unit}
                        </p>
                      </div>
                      {completed ? (
                        <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
                      ) : actual > 0 ? (
                        <Circle size={18} className="text-amber-400 flex-shrink-0" />
                      ) : (
                        <XCircle size={18} className="text-zinc-600 flex-shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <button
              onClick={() => setPage('overview')}
              className="btn-ghost w-full justify-center mt-4"
            >
              Open in Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
