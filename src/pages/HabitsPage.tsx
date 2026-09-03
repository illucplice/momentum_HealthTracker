import { useMemo, useState } from 'react';
import { Plus, Search, Archive } from 'lucide-react';
import { useData } from '@/store/DataContext';
import { useNav } from '@/store/NavContext';
import { HabitCard } from '@/components/HabitCard';
import { HabitForm } from '@/components/HabitForm';
import { toDateKey } from '@/lib/date';
import type { Habit } from '@/types';

export function HabitsPage() {
  const { habits, records, entries, categories } = useData();
  const { selectedDate } = useNav();
  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [showArchived, setShowArchived] = useState(false);

  const dateKey = toDateKey(selectedDate);
  const dayRecords = records.filter(r => r.date === dateKey);

  const filteredHabits = useMemo(() => {
    let result = habits.filter(h => showArchived ? h.is_archived : !h.is_archived);
    if (search) {
      result = result.filter(h => h.name.toLowerCase().includes(search.toLowerCase()) || h.description?.toLowerCase().includes(search.toLowerCase()));
    }
    if (filterCategory) {
      result = result.filter(h => h.category_id === filterCategory);
    }
    return result.sort((a, b) => a.sort_order - b.sort_order);
  }, [habits, search, filterCategory, showArchived]);

  const handleEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setShowForm(true);
  };

  return (
    <div className="px-6 py-6 max-w-6xl mx-auto pb-24 md:pb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Habits</h1>
          <p className="text-sm text-zinc-500">Manage and track all your habits</p>
        </div>
        <button onClick={() => { setEditingHabit(null); setShowForm(true); }} className="btn-primary">
          <Plus size={16} /> New Habit
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search habits..."
            className="input-field pl-9"
          />
        </div>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="input-field !w-auto"
        >
          <option value="">All categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button
          onClick={() => setShowArchived(!showArchived)}
          className={`btn-icon ${showArchived ? 'text-indigo-400' : ''}`}
          title={showArchived ? 'Show active' : 'Show archived'}
        >
          <Archive size={18} />
        </button>
      </div>

      {filteredHabits.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-zinc-400 text-sm">
            {showArchived ? 'No archived habits.' : search || filterCategory ? 'No habits match your filters.' : 'No habits yet. Create your first one!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHabits.map(habit => {
            const record = dayRecords.find(r => r.habit_id === habit.id);
            const habitEntries = record ? entries.filter(e => e.habit_record_id === record.id) : [];
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
