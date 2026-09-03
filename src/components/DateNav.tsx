import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { useState } from 'react';
import { useNav } from '@/store/NavContext';
import { addDays, isToday, formatFullDate, formatShortDate, getMonthMatrix, formatMonthYear, toDateKey } from '@/lib/date';
import { useData } from '@/store/DataContext';
import { isHabitActiveOnDate, isCompleted } from '@/lib/habits';
import { Modal } from '@/components/Modal';

export function DateNav() {
  const { selectedDate, setSelectedDate } = useNav();
  const { habits, records } = useData();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calMonth, setCalMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

  const prevDay = formatShortDate(addDays(selectedDate, -1));
  const nextDay = formatShortDate(addDays(selectedDate, 1));

  const getDayCompletion = (date: Date) => {
    const dateKey = toDateKey(date);
    const activeHabits = habits.filter(h => isHabitActiveOnDate(h, dateKey));
    if (activeHabits.length === 0) return null;
    const dayRecords = records.filter(r => r.date === dateKey);
    const completed = dayRecords.filter(r => {
      const habit = habits.find(h => h.id === r.habit_id);
      return habit ? isCompleted(r.actual_value, habit.target_value) : false;
    }).length;
    return { completed, total: activeHabits.length, pct: (completed / activeHabits.length) * 100 };
  };

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSelectedDate(addDays(selectedDate, -1))}
          className="btn-icon"
          title={prevDay}
        >
          <ChevronLeft size={20} />
        </button>

        <div className="text-center min-w-[200px]">
          <div className="text-lg font-semibold text-white">
            {isToday(selectedDate) ? 'Today' : formatFullDate(selectedDate)}
          </div>
          {isToday(selectedDate) && (
            <div className="text-xs text-zinc-500">{formatFullDate(selectedDate)}</div>
          )}
        </div>

        <button
          onClick={() => setSelectedDate(addDays(selectedDate, 1))}
          className="btn-icon"
          title={nextDay}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="flex items-center gap-2">
        {!isToday(selectedDate) && (
          <button onClick={() => setSelectedDate(new Date())} className="btn-ghost text-xs">
            Today
          </button>
        )}
        <button onClick={() => { setCalMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)); setCalendarOpen(true); }} className="btn-icon" title="Open calendar">
          <CalendarDays size={18} />
        </button>
      </div>

      <Modal open={calendarOpen} onClose={() => setCalendarOpen(false)} title={formatMonthYear(calMonth)} size="sm">
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
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
            <div key={d} className="text-center text-[10px] font-semibold text-zinc-500 uppercase py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {getMonthMatrix(calMonth.getFullYear(), calMonth.getMonth()).flat().map((date, i) => {
            if (!date) return <div key={i} />;
            const dateKey = toDateKey(date);
            const isSelected = toDateKey(selectedDate) === dateKey;
            const isCurrentMonth = date.getMonth() === calMonth.getMonth();
            const completion = getDayCompletion(date);
            const today = isToday(date);

            return (
              <button
                key={i}
                onClick={() => { setSelectedDate(date); setCalendarOpen(false); }}
                className={`relative aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-all ${
                  isSelected
                    ? 'bg-indigo-500 text-white font-semibold'
                    : isCurrentMonth
                    ? 'text-zinc-300 hover:bg-hover'
                    : 'text-zinc-600'
                }`}
              >
                <span>{date.getDate()}</span>
                {today && !isSelected && (
                  <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-indigo-400" />
                )}
                {completion && isCurrentMonth && (
                  <div className="absolute bottom-1 flex gap-0.5">
                    <div
                      className={`w-1 h-1 rounded-full ${
                        isSelected ? 'bg-white/70' :
                        completion.pct >= 100 ? 'bg-emerald-400' :
                        completion.pct >= 50 ? 'bg-amber-400' :
                        completion.pct > 0 ? 'bg-zinc-500' : 'bg-zinc-700'
                      }`}
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}
