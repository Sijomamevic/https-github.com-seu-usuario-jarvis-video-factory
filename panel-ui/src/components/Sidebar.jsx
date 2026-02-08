import { Link } from 'react-router-dom';
import { Menu, Home, FileText, Users, Play, Folder, Settings } from 'lucide-react';
import { useUIStore } from '../store';

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore();

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/' },
    { icon: FileText, label: 'Projetos', path: '/projects' },
    { icon: Users, label: 'Personagens', path: '/characters' },
    { icon: Play, label: 'Execução', path: '/execution' },
    { icon: Folder, label: 'Arquivos', path: '/files' },
  ];

  return (
    <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-slate-800 border-r border-slate-700 flex flex-col transition-all duration-300`}>
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        {sidebarOpen && <h1 className="text-xl font-bold text-blue-400">Jarvis</h1>}
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
        >
          <Menu size={20} />
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors text-slate-300 hover:text-white"
          >
            <item.icon size={20} />
            {sidebarOpen && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <button className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors text-slate-300 hover:text-white w-full">
          <Settings size={20} />
          {sidebarOpen && <span>Configurações</span>}
        </button>
      </div>
    </aside>
  );
}
