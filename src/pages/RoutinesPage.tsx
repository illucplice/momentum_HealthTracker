import { useState } from 'react';
import { Plus, Trash2, X, Check, Flame } from 'lucide-react';
import { useData } from '@/store/DataContext';
import { useNav } from '@/store/NavContext';
import { DynamicIcon } from '@/components/DynamicIcon';
import { Modal, useConfirm } from '@/components/Modal';
import { ProgressBar } from '@/components/ProgressBar';
import { showToast } from '@/components/Toast';
import { isHabitActiveOnDate, isCompleted } from '@/lib/habits';
import { toDateKey } from '@/lib/date';
import { ACCENT_COLORS, ROUTINE_ICONS } from '@/lib/constants';
import type { Habit, Routine } from '@/types';

export function RoutinesPage() {
  const { habits, records, routines, routineHabits } = useData();
  const { selectedDate } = useNav();
  const { createRoutine, deleteRoutine, addHabitToRoutine, removeHabitFromRoutine, toggleComplete, incrementRecord, error } = useData();
  const { confirm } = useConfirm();
  const [showCreate, setShowCreate] = useState(false);

  // Create form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Sunrise');
  const [color, setColor] = useState('#6366f1');

  const dateKey = toDateKey(selectedDate);
  const dayRecords = records.filter(r => r.date === dateKey);

  const handleCreate = async () => {
    if (!name.trim()) return;
    const result = await createRoutine({ name: name.trim(), description: description.trim() || null, icon, color });
    if (!result) {
      showToast(error || 'Could not create routine. Please try again.', 'info');
      return;
    }
    setName(''); setDescription(''); setIcon('Sunrise'); setColor('#6366f1');
    setShowCreate(false);
    showToast('Routine created');
  };

  const handleDelete = (routine: Routine) => {
    confirm({
      title: 'Delete routine?',
      message: `"${routine.name}" will be permanently deleted. Habits will not be affected.`,
      confirmText: 'Delete',
      onConfirm: () => { deleteRoutine(routine.id); showToast('Routine deleted'); },
    });
  };

  return (
    <div className="px-6 py-6 max-w-5xl mx-auto pb-24 md:pb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Routines</h1>
          <p className="text-sm text-zinc-500">Group habits into routines for structured daily flow</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus size={16} /> New Routine
        </button>
      </div>

      {routines.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
            <Flame size={32} className="text-indigo-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">No routines yet</h3>
          <p className="text-sm text-zinc-500 mb-4">Create a routine to group habits like "Morning Routine" or "Evening Routine".</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary mx-auto">
            <Plus size={16} /> Create your first routine
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {routines.map(routine => {
            const rhForRoutine = routineHabits.filter(rh => rh.routine_id === routine.id);
            const routineHabitsList = rhForRoutine
              .map(rh => habits.find(h => h.id === rh.habit_id))
              .filter((h): h is Habit => !!h && isHabitActiveOnDate(h, dateKey));

            const completedCount = routineHabitsList.filter(h => {
              const r = dayRecords.find(rec => rec.habit_id === h.id);
              return r ? isCompleted(r.actual_value, h.target_value) : false;
            }).length;
            const pct = routineHabitsList.length > 0 ? (completedCount / routineHabitsList.length) * 100 : 0;

            return (
              <div key={routine.id} className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `${routine.color}15`, color: routine.color }}
                    >
                      <DynamicIcon name={routine.icon} size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white">{routine.name}</h3>
                      <p className="text-xs text-zinc-500">
                        {completedCount} / {routineHabitsList.length} completed — {Math.round(pct)}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold" style={{ color: routine.color }}>{Math.round(pct)}%</span>
                    <button onClick={() => handleDelete(routine)} className="btn-icon text-zinc-600 hover:text-rose-400">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <ProgressBar percentage={pct} color={routine.color} height={6} />

                <div className="mt-4 space-y-2">
                  {routineHabitsList.length === 0 ? (
                    <p className="text-zinc-500 text-sm text-center py-3">No active habits in this routine.</p>
                  ) : (
                    routineHabitsList.map(habit => {
                      const record = dayRecords.find(r => r.habit_id === habit.id);
                      const actual = record?.actual_value ?? 0;
                      const completed = isCompleted(actual, habit.target_value);
                      return (
                        <div key={habit.id} className="flex items-center gap-3 p-3 rounded-xl bg-elevated group">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: `${habit.color}15`, color: habit.color }}
                          >
                            <DynamicIcon name={habit.icon} size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{habit.name}</p>
                            <p className="text-xs text-zinc-500">{actual} / {habit.target_value} {habit.unit}</p>
                          </div>
                          {habit.target_value === 1 || habit.habit_type === 'yes_no' ? (
                            <button
                              onClick={() => toggleComplete(habit.id, selectedDate)}
                              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all flex-shrink-0 ${
                                completed
                                  ? 'bg-emerald-500/15 text-emerald-400'
                                  : 'bg-hover text-zinc-400 hover:text-white'
                              }`}
                            >
                              {completed ? <Check size={16} /> : <Plus size={16} />}
                            </button>
                          ) : (
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={() => incrementRecord(habit.id, selectedDate, -1)}
                                className="w-7 h-7 rounded-lg bg-hover flex items-center justify-center text-zinc-400 hover:text-white text-sm"
                              >
                                −
                              </button>
                              <span className="text-sm font-medium text-white w-8 text-center">{actual}</span>
                              <button
                                onClick={() => incrementRecord(habit.id, selectedDate, 1)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-sm"
                                style={{ background: habit.color }}
                              >
                                +
                              </button>
                            </div>
                          )}
                          <button
                            onClick={() => removeHabitFromRoutine(routine.id, habit.id)}
                            className="btn-icon !w-7 !h-7 opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-rose-400"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Add habit to routine */}
                <AddHabitToRoutine routineId={routine.id} habits={habits} routineHabits={routineHabits} onAdd={addHabitToRoutine} />
              </div>
            );
          })}
        </div>
      )}

      {/* Create routine modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Routine" size="md">
        <div className="space-y-4">
          <div>
            <label className="label">Routine Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Morning Routine" className="input-field" autoFocus />
          </div>
          <div>
            <label className="label">Description</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional" className="input-field" />
          </div>
          <div>
            <label className="label">Icon</label>
            <div className="grid grid-cols-8 gap-1.5">
              {ROUTINE_ICONS.map(ic => (
                <button
                  key={ic}
                  onClick={() => setIcon(ic)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                    icon === ic ? 'bg-indigo-500/15 text-indigo-400 ring-1 ring-indigo-500/30' : 'bg-elevated text-zinc-400 hover:text-white'
                  }`}
                >
                  <DynamicIcon name={ic} size={16} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Color</label>
            <div className="flex items-center gap-2 flex-wrap">
              {ACCENT_COLORS.map(c => (
                <button
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  className={`w-7 h-7 rounded-full transition-all ${color === c.value ? 'ring-2 ring-white ring-offset-2 ring-offset-surface' : ''}`}
                  style={{ background: c.value }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowCreate(false)} className="btn-ghost">Cancel</button>
            <button onClick={handleCreate} className="btn-primary" disabled={!name.trim()}>Create Routine</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function AddHabitToRoutine({ routineId, habits, routineHabits, onAdd }: {
  routineId: string;
  habits: Habit[];
  routineHabits: { routine_id: string; habit_id: string }[];
  onAdd: (routineId: string, habitId: string) => void;
}) {
  const [show, setShow] = useState(false);
  const available = habits.filter(h => !h.is_archived && !routineHabits.some(rh => rh.routine_id === routineId && rh.habit_id === h.id));

  if (available.length === 0) return null;

  return (
    <div className="mt-3">
      {show ? (
        <div className="flex flex-wrap gap-1.5 animate-slide-down">
          {available.map(h => (
            <button
              key={h.id}
              onClick={() => { onAdd(routineId, h.id); showToast('Habit added to routine'); }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-elevated text-xs text-zinc-300 hover:text-white hover:bg-hover transition-colors"
            >
              <DynamicIcon name={h.icon} size={12} /> {h.name}
            </button>
          ))}
          <button onClick={() => setShow(false)} className="btn-icon !w-7 !h-7">
            <X size={14} />
          </button>
        </div>
      ) : (
        <button onClick={() => setShow(true)} className="btn-ghost !text-xs !py-1.5">
          <Plus size={14} /> Add habit
        </button>
      )}
    </div>
  );
}
