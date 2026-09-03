import { useMemo } from 'react';
import { TrendingUp, Flame, Trophy, CheckCircle2 } from 'lucide-react';
import { useData } from '@/store/DataContext';
import { toDateKey, addDays, getWeekdayLabels, formatShortDate } from '@/lib/date';
import { isHabitActiveOnDate, isCompleted, computeStreak } from '@/lib/habits';
import { DynamicIcon } from '@/components/DynamicIcon';

export function AnalyticsPage() {
  const { habits, records } = useData();

  const activeHabits = habits.filter(h => !h.is_archived);

  // Total habits completed
  const totalCompleted = useMemo(() => {
    return records.filter(r => {
      const h = habits.find(h => h.id === r.habit_id);
      return h ? isCompleted(r.actual_value, h.target_value) : false;
    }).length;
  }, [records, habits]);

  // Average daily completion (last 30 days)
  const last30Days = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const date = addDays(new Date(), -i);
      const dateKey = toDateKey(date);
      const dActive = habits.filter(h => isHabitActiveOnDate(h, dateKey));
      const dRecords = records.filter(r => r.date === dateKey);
      const dCompleted = dRecords.filter(r => {
        const h = habits.find(h => h.id === r.habit_id);
        return h ? isCompleted(r.actual_value, h.target_value) : false;
      }).length;
      return { date, dateKey, completed: dCompleted, total: dActive.length, pct: dActive.length > 0 ? (dCompleted / dActive.length) * 100 : 0 };
    });
  }, [habits, records]);

  const avgDaily = last30Days.filter(d => d.total > 0).reduce((sum, d) => sum + d.pct, 0) / (last30Days.filter(d => d.total > 0).length || 1);

  // Best day
  const bestDay = last30Days.reduce((best, d) => d.pct > best.pct ? d : best, last30Days[0] || { date: new Date(), pct: 0, completed: 0, total: 0, dateKey: '' });

  // Current & longest streaks
  const streakData = useMemo(() => {
    let currentBest = 0;
    let longestBest = 0;
    for (const habit of activeHabits) {
      const habitRecords = new Map<string, typeof records[0]>();
      records.filter(r => r.habit_id === habit.id).forEach(r => habitRecords.set(r.date, r));
      const { current, best } = computeStreak(habit.id, habitRecords, new Map(), habit, toDateKey(new Date()));
      currentBest = Math.max(currentBest, current);
      longestBest = Math.max(longestBest, best);
    }
    return { current: currentBest, longest: longestBest };
  }, [activeHabits, records]);

  // Completion by habit
  const habitPerformance = useMemo(() => {
    return activeHabits.map(habit => {
      const habitRecords = records.filter(r => r.habit_id === habit.id);
      const completed = habitRecords.filter(r => isCompleted(r.actual_value, habit.target_value)).length;
      const total = habitRecords.length;
      return {
        habit,
        completed,
        total,
        pct: total > 0 ? (completed / total) * 100 : 0,
      };
    }).sort((a, b) => b.pct - a.pct);
  }, [activeHabits, records]);

  // Completion by weekday (last 30 days)
  const weekdayPerformance = useMemo(() => {
    const days = [0, 1, 2, 3, 4, 5, 6];
    return days.map(day => {
      const dayRecords = last30Days.filter(d => d.date.getDay() === day && d.total > 0);
      const avg = dayRecords.length > 0 ? dayRecords.reduce((sum, d) => sum + d.pct, 0) / dayRecords.length : 0;
      return { day, avg, count: dayRecords.length };
    });
  }, [last30Days]);

  // Weekly completion (last 8 weeks)
  const weeklyData = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => {
      const weekStart = addDays(new Date(), -(i + 1) * 7);
      const weekEnd = addDays(weekStart, 6);
      const startKey = toDateKey(weekStart);
      const endKey = toDateKey(weekEnd);
      const weekRecords = records.filter(r => r.date >= startKey && r.date <= endKey);
      const weekActive = habits.filter(h => isHabitActiveOnDate(h, startKey));
      const completed = weekRecords.filter(r => {
        const h = habits.find(h => h.id === r.habit_id);
        return h ? isCompleted(r.actual_value, h.target_value) : false;
      }).length;
      const total = weekActive.length * 7;
      return { weekStart, completed, total, pct: total > 0 ? (completed / total) * 100 : 0 };
    }).reverse();
  }, [records, habits]);

  return (
    <div className="px-6 py-6 max-w-5xl mx-auto pb-24 md:pb-6">
      <h1 className="text-2xl font-bold text-white mb-1">Analytics</h1>
      <p className="text-sm text-zinc-500 mb-6">Track your long-term progress and trends</p>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard icon={CheckCircle2} label="Total Completed" value={totalCompleted} color="#10b981" />
        <StatCard icon={TrendingUp} label="Avg Daily" value={`${Math.round(avgDaily)}%`} color="#6366f1" />
        <StatCard icon={Flame} label="Current Streak" value={`${streakData.current}d`} color="#f97316" />
        <StatCard icon={Trophy} label="Longest Streak" value={`${streakData.longest}d`} color="#f59e0b" />
      </div>

      {/* Best day */}
      <div className="card p-5 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Trophy size={20} className="text-amber-400" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Best Day</p>
            <p className="text-sm font-semibold text-white">
              {formatShortDate(bestDay.date)} — {Math.round(bestDay.pct)}% ({bestDay.completed}/{bestDay.total})
            </p>
          </div>
        </div>
      </div>

      {/* Daily completion by weekday */}
      <div className="card p-5 mb-5">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Daily Completion by Weekday</p>
        <div className="space-y-2.5">
          {weekdayPerformance.map((d, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs text-zinc-400 w-8">{getWeekdayLabels()[((d.day + 6) % 7)]}</span>
              <div className="flex-1 h-6 bg-elevated rounded-lg overflow-hidden relative">
                <div
                  className="h-full rounded-lg transition-all flex items-center justify-end pr-2"
                  style={{ width: `${Math.max(2, d.avg)}%`, background: d.avg >= 75 ? '#10b981' : d.avg >= 50 ? '#f59e0b' : '#6366f1' }}
                >
                  {d.avg > 15 && <span className="text-[10px] font-bold text-white">{Math.round(d.avg)}%</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Habit performance */}
      <div className="card p-5 mb-5">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Habit Performance</p>
        {habitPerformance.length === 0 ? (
          <p className="text-zinc-500 text-sm text-center py-4">No data yet.</p>
        ) : (
          <div className="space-y-3">
            {habitPerformance.map(({ habit, pct, completed, total }) => (
              <div key={habit.id} className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${habit.color}15`, color: habit.color }}
                >
                  <DynamicIcon name={habit.icon} size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white truncate">{habit.name}</span>
                    <span className="text-xs text-zinc-500 flex-shrink-0 ml-2">{completed}/{total} days</span>
                  </div>
                  <div className="h-2 bg-elevated rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: habit.color }}
                    />
                  </div>
                </div>
                <span className="text-sm font-semibold text-zinc-300 w-10 text-right">{Math.round(pct)}%</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weekly trend */}
      <div className="card p-5">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Weekly Trend (last 8 weeks)</p>
        <div className="flex items-end justify-between gap-2 h-32">
          {weeklyData.map((w, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex-1 flex items-end">
                <div
                  className="w-full rounded-t-lg transition-all"
                  style={{
                    height: `${Math.max(2, w.pct)}%`,
                    background: w.pct >= 75 ? '#10b981' : w.pct >= 50 ? '#f59e0b' : w.pct >= 25 ? '#6366f1' : '#3f3f46',
                  }}
                  title={`${Math.round(w.pct)}%`}
                />
              </div>
              <span className="text-[9px] text-zinc-600">{formatShortDate(w.weekStart).split(' ')[1]}{w.weekStart.getDate()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof TrendingUp; label: string; value: string | number; color: string }) {
  return (
    <div className="card p-4">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${color}15`, color }}>
        <Icon size={18} />
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
    </div>
  );
}
