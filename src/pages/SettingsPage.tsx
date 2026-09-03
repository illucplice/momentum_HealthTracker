import { useState } from 'react';
import { Download, RotateCcw, Trash2, Database, Info, Bell } from 'lucide-react';
import { useData } from '@/store/DataContext';
import { useConfirm } from '@/components/Modal';
import { showToast } from '@/components/Toast';
import { toDateKey } from '@/lib/date';
import { getReminderPermission, requestReminderPermission } from '@/hooks/useHabitReminders';

export function SettingsPage() {
  const { habits, records, entries, categories, routines, routineHabits, refetch, updateHabit, clearAllData } = useData();
  const { confirm } = useConfirm();
  const [permission, setPermission] = useState(getReminderPermission());

  const handleEnableNotifications = async () => {
    const result = await requestReminderPermission();
    setPermission(result === 'unsupported' ? 'unsupported' : result);
    if (result === 'granted') showToast('Notifications enabled');
    if (result === 'denied') showToast('Notifications blocked in browser settings', 'info');
  };

  const archivedHabits = habits.filter(h => h.is_archived);

  const handleExport = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      habits,
      records,
      entries,
      categories,
      routines,
      routineHabits,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `momentum-export-${toDateKey(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported');
  };

  const handleRestore = (habitId: string) => {
    updateHabit(habitId, { is_archived: false, is_active: true });
    showToast('Habit restored');
  };

  const handleClearAll = () => {
    confirm({
      title: 'Clear all data?',
      message: 'This will permanently delete all habits, records, entries, routines, and categories. This cannot be undone.',
      confirmText: 'Delete Everything',
      onConfirm: async () => {
        const ok = await clearAllData();
        showToast(ok ? 'All data cleared' : 'Could not clear data. Please try again.', ok ? 'success' : 'info');
      },
    });
  };

  return (
    <div className="px-6 py-6 max-w-3xl mx-auto pb-24 md:pb-6">
      <h1 className="text-2xl font-bold text-white mb-1">Settings</h1>
      <p className="text-sm text-zinc-500 mb-6">Manage your data and preferences</p>

      {/* Reminders */}
      <div className="card p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Bell size={18} className="text-indigo-400" />
          <h3 className="text-sm font-semibold text-white">Reminders</h3>
        </div>
        <div className="flex items-center justify-between p-3 rounded-xl bg-elevated">
          <div>
            <p className="text-sm font-medium text-white">Browser notifications</p>
            <p className="text-xs text-zinc-500">
              {permission === 'granted' ? 'Enabled — you\'ll get a notification when a reminder is due.'
                : permission === 'denied' ? 'Blocked. Enable notifications for this site in your browser settings.'
                : permission === 'unsupported' ? 'Not supported in this browser.'
                : 'Off. Turn this on so habit reminders can notify you.'}
            </p>
          </div>
          {permission !== 'granted' && permission !== 'unsupported' && (
            <button onClick={handleEnableNotifications} className="btn-ghost !text-xs">
              <Bell size={14} /> Enable
            </button>
          )}
        </div>
      </div>

      {/* Data & Export */}
      <div className="card p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Database size={18} className="text-indigo-400" />
          <h3 className="text-sm font-semibold text-white">Data Management</h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-elevated">
            <div>
              <p className="text-sm font-medium text-white">Export habit history</p>
              <p className="text-xs text-zinc-500">Download all your data as a JSON file</p>
            </div>
            <button onClick={handleExport} className="btn-ghost !text-xs">
              <Download size={14} /> Export
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-elevated">
            <div>
              <p className="text-sm font-medium text-white">Refresh data</p>
              <p className="text-xs text-zinc-500">Reload all data from the server</p>
            </div>
            <button onClick={refetch} className="btn-ghost !text-xs">
              <RotateCcw size={14} /> Refresh
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-elevated">
            <div>
              <p className="text-sm font-medium text-rose-400">Clear all data</p>
              <p className="text-xs text-zinc-500">Permanently delete everything</p>
            </div>
            <button onClick={handleClearAll} className="btn-ghost !text-xs !text-rose-400 hover:!bg-rose-500/10">
              <Trash2 size={14} /> Clear
            </button>
          </div>
        </div>
      </div>

      {/* Archived habits */}
      {archivedHabits.length > 0 && (
        <div className="card p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <RotateCcw size={18} className="text-zinc-400" />
            <h3 className="text-sm font-semibold text-white">Archived Habits ({archivedHabits.length})</h3>
          </div>
          <div className="space-y-2">
            {archivedHabits.map(h => (
              <div key={h.id} className="flex items-center justify-between p-3 rounded-xl bg-elevated">
                <div>
                  <p className="text-sm font-medium text-white">{h.name}</p>
                  <p className="text-xs text-zinc-500">Target: {h.target_value} {h.unit}</p>
                </div>
                <button onClick={() => handleRestore(h.id)} className="btn-ghost !text-xs">
                  <RotateCcw size={14} /> Restore
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* About */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Info size={18} className="text-zinc-400" />
          <h3 className="text-sm font-semibold text-white">About Momentum</h3>
        </div>
        <div className="space-y-2 text-xs text-zinc-400">
          <p>Momentum is a habit and daily routine tracker that helps you build consistency.</p>
          <div className="flex items-center gap-4 pt-2 border-t border-subtle">
            <span>Version 1.0.0</span>
            <span>·</span>
            <span>{habits.length} habits</span>
            <span>·</span>
            <span>{records.length} records</span>
            <span>·</span>
            <span>{entries.length} entries</span>
          </div>
        </div>
      </div>
    </div>
  );
}
