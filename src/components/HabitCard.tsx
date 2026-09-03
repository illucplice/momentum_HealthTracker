import { useState } from 'react';
import { Plus, Minus, Check, Flame, Pencil, StickyNote, Clock, Trash2, Archive, ChevronDown, ChevronUp } from 'lucide-react';
import type { Habit, HabitRecord, HabitEntry } from '@/types';
import { useData } from '@/store/DataContext';
import { DynamicIcon } from '@/components/DynamicIcon';
import { ProgressBar } from '@/components/ProgressBar';
import { useConfirm } from '@/components/Modal';
import { showToast } from '@/components/Toast';
import { computeCompletion, isCompleted, isTargetExceeded, isOneClickHabit, formatValue, computeStreak } from '@/lib/habits';
import { toDateKey, formatTime } from '@/lib/date';

interface HabitCardProps {
  habit: Habit;
  date: Date;
  record: HabitRecord | undefined;
  entries: HabitEntry[];
  onEdit: () => void;
}

export function HabitCard({ habit, date, record, entries, onEdit }: HabitCardProps) {
  const { incrementRecord, toggleComplete, addEntry, deleteEntry, updateRecordNote, updateHabit, records, entries: allEntries } = useData();
  const { confirm } = useConfirm();
  const [showActivity, setShowActivity] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [noteText, setNoteText] = useState(record?.note || '');
  const [customValue, setCustomValue] = useState('');
  const [customNote, setCustomNote] = useState('');

  const actual = record?.actual_value ?? 0;
  const target = habit.target_value;
  const pct = computeCompletion(actual, target);
  const completed = isCompleted(actual, target);
  const exceeded = isTargetExceeded(actual, target);
  const oneClick = isOneClickHabit(habit);

  // Streak calculation
  const habitRecords = new Map<string, HabitRecord>();
  records.filter(r => r.habit_id === habit.id).forEach(r => habitRecords.set(r.date, r));
  const habitEntries = new Map<string, HabitEntry[]>();
  allEntries.filter(e => record && e.habit_record_id === record.id).forEach(e => {
    const arr = habitEntries.get(e.habit_record_id) || [];
    arr.push(e);
    habitEntries.set(e.habit_record_id, arr);
  });
  const streak = computeStreak(habit.id, habitRecords, habitEntries, habit, toDateKey(new Date()));

  const accentColor = habit.color;

  const handleIncrement = (delta: number) => {
    const willComplete = !completed && actual + delta >= target;
    incrementRecord(habit.id, date, delta);
    if (willComplete) showToast('Habit completed!');
  };

  const handleToggle = () => {
    toggleComplete(habit.id, date);
    if (!completed) showToast(`${habit.name} completed!`);
  };

  const handleAddEntry = () => {
    const val = parseFloat(customValue);
    if (isNaN(val) || val === 0) return;
    addEntry(habit.id, date, val, customNote || undefined);
    setCustomValue('');
    setCustomNote('');
    if (isCompleted(actual + val, target) && !completed) showToast(`${habit.name} completed!`);
  };

  const handleDeleteEntry = (entryId: string) => {
    if (!record) return;
    deleteEntry(entryId, record.id, habit.id, date);
  };

  const handleArchive = () => {
    confirm({
      title: 'Archive habit?',
      message: `${habit.name} will be archived. You can restore it later from Settings.`,
      confirmText: 'Archive',
      onConfirm: () => { updateHabit(habit.id, { is_archived: true, is_active: false }); showToast('Habit archived'); },
    });
  };

  return (
    <div
      className="card p-5 group relative overflow-hidden"
      style={{ borderColor: completed ? `${accentColor}40` : undefined }}
    >
      {completed && (
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{ background: accentColor }}
        />
      )}

      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${accentColor}15`, color: accentColor }}
          >
            <DynamicIcon name={habit.icon} size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-sm truncate">{habit.name}</h3>
            {habit.description && (
              <p className="text-xs text-zinc-500 truncate">{habit.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="btn-icon !w-7 !h-7" title="Edit">
            <Pencil size={14} />
          </button>
        </div>
      </div>

      {/* Target & Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-zinc-500">Target</span>
          <span className="text-xs font-medium text-zinc-300">
            {formatValue(target, habit.unit)}
          </span>
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-zinc-500">Progress</span>
          <div className="flex items-center gap-1.5">
            <span className={`text-sm font-semibold ${completed ? 'text-emerald-400' : 'text-white'}`}>
              {actual} / {target}
            </span>
            <span className="text-xs text-zinc-500">{habit.unit}</span>
          </div>
        </div>
        <ProgressBar percentage={pct} color={accentColor} height={6} />
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-xs text-zinc-500">{Math.round(pct)}%</span>
          {streak.current > 0 && (
            <span className="flex items-center gap-1 text-xs text-orange-400 font-medium">
              <Flame size={12} /> {streak.current} day streak
            </span>
          )}
          {exceeded && (
            <span className="text-xs text-amber-400 font-medium">Target exceeded</span>
          )}
        </div>
      </div>

      {/* Controls */}
      {oneClick ? (
        <button
          onClick={handleToggle}
          className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            completed
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-hover text-zinc-300 border border-transparent hover:border-subtle'
          }`}
        >
          {completed ? (
            <>
              <Check size={16} /> Completed
            </>
          ) : (
            'Mark Complete'
          )}
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleIncrement(-1)}
            className="w-10 h-10 rounded-xl bg-hover flex items-center justify-center text-zinc-300 hover:text-white transition-colors flex-shrink-0"
            disabled={actual <= 0}
          >
            <Minus size={16} />
          </button>
          <div className="flex-1 text-center">
            <span className="text-lg font-bold text-white">{actual}</span>
            <span className="text-xs text-zinc-500 ml-1">/ {target} {habit.unit}</span>
          </div>
          <button
            onClick={() => handleIncrement(1)}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all flex-shrink-0"
            style={{ background: accentColor }}
          >
            <Plus size={16} />
          </button>
          <button
            onClick={handleToggle}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
              completed
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-hover text-zinc-400 hover:text-white'
            }`}
          >
            <Check size={16} />
          </button>
        </div>
      )}

      {/* Quick add buttons for numeric habits */}
      {!oneClick && target > 1 && (
        <div className="flex items-center gap-1.5 mt-2">
          {[1, 2, 5].map(n => (
            <button
              key={n}
              onClick={() => handleIncrement(n)}
              className="flex-1 py-1.5 rounded-lg bg-hover text-xs font-medium text-zinc-400 hover:text-white transition-colors"
            >
              +{n}
            </button>
          ))}
          <button
            onClick={() => setShowActivity(!showActivity)}
            className="flex-1 py-1.5 rounded-lg bg-hover text-xs font-medium text-zinc-400 hover:text-white transition-colors flex items-center justify-center gap-1"
          >
            {showActivity ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            Activity
          </button>
        </div>
      )}

      {/* Activity section */}
      {showActivity && (
        <div className="mt-3 pt-3 border-t border-subtle animate-slide-down">
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Today's Activity</div>
          {entries.length === 0 ? (
            <p className="text-xs text-zinc-600 mb-3">No entries yet. Add one below.</p>
          ) : (
            <div className="space-y-1 mb-3">
              {entries.map(e => (
                <div key={e.id} className="flex items-center justify-between text-xs group/entry">
                  <div className="flex items-center gap-2">
                    <Clock size={11} className="text-zinc-600" />
                    <span className="text-zinc-400">
                      {formatTime(new Date(e.created_at))}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-medium">+{e.value}</span>
                    {e.note && <span className="text-zinc-500">{e.note}</span>}
                    <button
                      onClick={() => handleDeleteEntry(e.id)}
                      className="opacity-0 group-hover/entry:opacity-100 text-zinc-600 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between text-xs pt-1.5 border-t border-subtle">
                <span className="text-zinc-500 font-medium">Total</span>
                <span className="text-white font-semibold">{actual} {habit.unit}</span>
              </div>
            </div>
          )}

          {/* Add custom entry */}
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={customValue}
              onChange={e => setCustomValue(e.target.value)}
              placeholder="Amount"
              className="input-field !py-1.5 !text-xs w-20"
            />
            <input
              type="text"
              value={customNote}
              onChange={e => setCustomNote(e.target.value)}
              placeholder="Note (optional)"
              className="input-field !py-1.5 !text-xs flex-1"
            />
            <button
              onClick={handleAddEntry}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors flex-shrink-0"
              style={{ background: accentColor }}
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Note section */}
      <div className="mt-2 flex items-center gap-1">
        <button
          onClick={() => { setShowNote(!showNote); setNoteText(record?.note || ''); }}
          className={`text-xs flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
            record?.note ? 'text-amber-400/80' : 'text-zinc-600 hover:text-zinc-400'
          }`}
        >
          <StickyNote size={11} /> {record?.note ? 'Note' : 'Add note'}
        </button>
        <button onClick={handleArchive} className="text-xs flex items-center gap-1 px-2 py-1 rounded-md text-zinc-600 hover:text-rose-400 transition-colors">
          <Archive size={11} /> Archive
        </button>
      </div>

      {showNote && (
        <div className="mt-2 animate-slide-down">
          <textarea
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            placeholder="Add a note for this day..."
            className="input-field !text-xs resize-none"
            rows={2}
          />
          <button
            onClick={() => { updateRecordNote(habit.id, date, noteText); setShowNote(false); showToast('Note saved'); }}
            className="btn-ghost !text-xs !py-1.5 mt-1"
          >
            Save note
          </button>
        </div>
      )}
    </div>
  );
}
