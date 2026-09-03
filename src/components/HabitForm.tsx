import { useState, useEffect } from 'react';
import type { Habit, Category, HabitType } from '@/types';
import { useData } from '@/store/DataContext';
import { DynamicIcon } from '@/components/DynamicIcon';
import { Modal } from '@/components/Modal';
import { showToast } from '@/components/Toast';
import { ACCENT_COLORS, HABIT_ICONS, HABIT_TYPES, DEFAULT_CATEGORIES } from '@/lib/constants';
import { toDateKey } from '@/lib/date';
import { requestReminderPermission } from '@/hooks/useHabitReminders';
import { Plus } from 'lucide-react';

interface HabitFormProps {
  open: boolean;
  onClose: () => void;
  editingHabit?: Habit | null;
  categories: Category[];
}

export function HabitForm({ open, onClose, editingHabit, categories }: HabitFormProps) {
  const { createHabit, updateHabit, createCategory, error } = useData();
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('CheckCircle');
  const [categoryId, setCategoryId] = useState<string>('');
  const [color, setColor] = useState('#6366f1');
  const [habitType, setHabitType] = useState<HabitType>('numeric');
  const [targetValue, setTargetValue] = useState(1);
  const [unit, setUnit] = useState('units');
  const [startDate, setStartDate] = useState(toDateKey(new Date()));
  const [endDate, setEndDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderDays, setReminderDays] = useState<number[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#10b981');
  const [showNewCategory, setShowNewCategory] = useState(false);

  useEffect(() => {
    if (editingHabit) {
      setName(editingHabit.name);
      setDescription(editingHabit.description || '');
      setIcon(editingHabit.icon);
      setCategoryId(editingHabit.category_id || '');
      setColor(editingHabit.color);
      setHabitType(editingHabit.habit_type);
      setTargetValue(editingHabit.target_value);
      setUnit(editingHabit.unit);
      setStartDate(editingHabit.start_date);
      setEndDate(editingHabit.end_date || '');
      setReminderTime(editingHabit.reminder_time || '');
      setReminderEnabled(editingHabit.reminder_enabled);
      setReminderDays(editingHabit.reminder_days || []);
    } else {
      setName('');
      setDescription('');
      setIcon('CheckCircle');
      setCategoryId('');
      setColor('#6366f1');
      setHabitType('numeric');
      setTargetValue(1);
      setUnit('units');
      setStartDate(toDateKey(new Date()));
      setEndDate('');
      setReminderTime('');
      setReminderEnabled(false);
      setReminderDays([]);
    }
  }, [editingHabit, open]);

  const handleTypeChange = (type: HabitType) => {
    setHabitType(type);
    if (type === 'yes_no') {
      setTargetValue(1);
      setUnit('session');
    } else if (type === 'duration') {
      setUnit('minutes');
    } else if (type === 'count') {
      setUnit('reps');
    } else {
      setUnit('units');
    }
  };

  const handleReminderDayToggle = (day: number) => {
    setReminderDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    const cat = await createCategory(newCategoryName.trim(), newCategoryColor);
    if (cat) {
      setCategoryId(cat.id);
      setNewCategoryName('');
      setShowNewCategory(false);
      showToast('Category created');
    } else {
      showToast(error || 'Could not create category. Please try again.', 'info');
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    const data: Partial<Habit> = {
      name: name.trim(),
      description: description.trim() || null,
      icon,
      category_id: categoryId || null,
      color,
      habit_type: habitType,
      target_value: targetValue,
      unit,
      start_date: startDate,
      end_date: endDate || null,
      reminder_time: reminderTime || null,
      reminder_enabled: reminderEnabled,
      reminder_days: reminderDays,
    };
    setSubmitting(true);
    try {
      if (editingHabit) {
        await updateHabit(editingHabit.id, data);
        showToast('Habit updated');
      } else {
        const result = await createHabit(data);
        if (!result) {
          showToast(error || 'Could not create habit. Please try again.', 'info');
          return;
        }
        showToast('Habit created');
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Modal open={open} onClose={onClose} title={editingHabit ? 'Edit Habit' : 'Create Habit'} size="lg">
      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="label">Habit Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Play Guitar"
            className="input-field"
            autoFocus
          />
        </div>

        {/* Description */}
        <div>
          <label className="label">Description</label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Optional description"
            className="input-field"
          />
        </div>

        {/* Habit Type */}
        <div>
          <label className="label">Habit Type</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {HABIT_TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => handleTypeChange(t.value as HabitType)}
                className={`p-3 rounded-xl text-left transition-all border ${
                  habitType === t.value
                    ? 'bg-indigo-500/10 border-indigo-500/30'
                    : 'bg-elevated border-subtle hover:border-border-d'
                }`}
              >
                <div className="text-sm font-medium text-white">{t.label}</div>
                <div className="text-[10px] text-zinc-500 mt-0.5">{t.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Target & Unit */}
        {habitType !== 'yes_no' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Daily Target</label>
              <input
                type="number"
                value={targetValue}
                onChange={e => setTargetValue(Math.max(1, parseFloat(e.target.value) || 1))}
                className="input-field"
                min={1}
                step={habitType === 'duration' ? 5 : 1}
              />
            </div>
            <div>
              <label className="label">Unit</label>
              <input
                type="text"
                value={unit}
                onChange={e => setUnit(e.target.value)}
                placeholder="e.g. minutes, glasses, pages"
                className="input-field"
              />
            </div>
          </div>
        )}

        {/* Icon */}
        <div>
          <label className="label">Icon</label>
          <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5 max-h-28 overflow-y-auto p-1">
            {HABIT_ICONS.map(ic => (
              <button
                key={ic}
                onClick={() => setIcon(ic)}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                  icon === ic
                    ? 'bg-indigo-500/15 text-indigo-400 ring-1 ring-indigo-500/30'
                    : 'bg-elevated text-zinc-400 hover:text-white hover:bg-hover'
                }`}
              >
                <DynamicIcon name={ic} size={16} />
              </button>
            ))}
          </div>
        </div>

        {/* Color */}
        <div>
          <label className="label">Accent Color</label>
          <div className="flex items-center gap-2 flex-wrap">
            {ACCENT_COLORS.map(c => (
              <button
                key={c.value}
                onClick={() => setColor(c.value)}
                className={`w-7 h-7 rounded-full transition-all ${
                  color === c.value ? 'ring-2 ring-white ring-offset-2 ring-offset-surface' : ''
                }`}
                style={{ background: c.value }}
                title={c.name}
              />
            ))}
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="label">Category</label>
          <div className="flex items-center gap-2">
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="input-field flex-1"
            >
              <option value="">None</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button
              onClick={() => setShowNewCategory(!showNewCategory)}
              className="btn-icon flex-shrink-0"
              title="Add category"
            >
              <Plus size={16} />
            </button>
          </div>
          {showNewCategory && (
            <div className="flex items-center gap-2 mt-2 animate-slide-down">
              <input
                type="text"
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                placeholder="Category name"
                className="input-field flex-1"
              />
              <div className="flex items-center gap-1">
                {DEFAULT_CATEGORIES.slice(0, 5).map(c => (
                  <button
                    key={c.color}
                    onClick={() => setNewCategoryColor(c.color)}
                    className={`w-6 h-6 rounded-full transition-all ${
                      newCategoryColor === c.color ? 'ring-2 ring-white' : ''
                    }`}
                    style={{ background: c.color }}
                  />
                ))}
              </div>
              <button onClick={handleAddCategory} className="btn-primary !py-1.5 !px-3 !text-xs">Add</button>
            </div>
          )}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="label">End Date (optional)</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="input-field"
            />
          </div>
        </div>

        {/* Reminder */}
        <div className="border-t border-subtle pt-4">
          <div className="flex items-center justify-between mb-3">
            <label className="label !mb-0">Reminder</label>
            <button
              onClick={() => {
                const next = !reminderEnabled;
                setReminderEnabled(next);
                if (next) requestReminderPermission();
              }}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                reminderEnabled ? 'bg-indigo-500' : 'bg-border-d'
              }`}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  reminderEnabled ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
          {reminderEnabled && (
            <p className="text-[10px] text-zinc-600 -mt-2 mb-3">
              Reminders fire while Momentum is open in a browser tab. Allow notifications when prompted to see them outside the tab.
            </p>
          )}
          {reminderEnabled && (
            <div className="animate-slide-down space-y-3">
              <div>
                <label className="label">Reminder Time</label>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={e => setReminderTime(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">Days of Week</label>
                <div className="flex items-center gap-1">
                  {weekDays.map((d, i) => (
                    <button
                      key={i}
                      onClick={() => handleReminderDayToggle(i)}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                        reminderDays.includes(i)
                          ? 'bg-indigo-500/15 text-indigo-400'
                          : 'bg-elevated text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {d[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={handleSubmit} className="btn-primary" disabled={!name.trim() || submitting}>
            {submitting ? 'Saving...' : editingHabit ? 'Save Changes' : 'Create Habit'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
