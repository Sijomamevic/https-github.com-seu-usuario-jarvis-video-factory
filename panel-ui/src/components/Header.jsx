import { Bell, Moon, Sun, User } from 'lucide-react';
import { useUIStore } from '../store';

export default function Header() {
  const { darkMode, toggleDarkMode, notifications } = useUIStore();

  return (
    <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-semibold text-white">Jarvis Video Factory</h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors relative">
            <Bell size={20} className="text-slate-300" />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>
        </div>

        <button
          onClick={toggleDarkMode}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
        >
          {darkMode ? (
            <Sun size={20} className="text-slate-300" />
          ) : (
            <Moon size={20} className="text-slate-300" />
          )}
        </button>

        <div className="flex items-center gap-2 pl-4 border-l border-slate-700">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <User size={16} className="text-white" />
          </div>
          <span className="text-sm text-slate-300">Admin</span>
        </div>
      </div>
    </header>
  );
}
