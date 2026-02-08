import { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { projectsAPI, agentsAPI } from '../services/api';
import { useProjectStore, useAgentStore } from '../store';

export default function Dashboard() {
  const { projects, setProjects } = useProjectStore();
  const { agents, setAgents } = useAgentStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [projectsRes, agentsRes] = await Promise.all([
        projectsAPI.getAll(),
        agentsAPI.getStatus(),
      ]);
      
      setProjects(projectsRes.data.projects);
      setAgents(agentsRes.data.agents);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: 'Total de Projetos', value: projects.length, color: 'bg-blue-500' },
    { label: 'Agentes Ativos', value: Object.values(agents).filter(a => a.status === 'online').length, color: 'bg-green-500' },
    { label: 'Em Execução', value: projects.filter(p => p.status === 'executing').length, color: 'bg-yellow-500' },
    { label: 'Concluídos', value: projects.filter(p => p.status === 'completed').length, color: 'bg-purple-500' },
  ];

  const chartData = [
    { name: 'Jan', projetos: 4, execuções: 24 },
    { name: 'Fev', projetos: 3, execuções: 13 },
    { name: 'Mar', projetos: 2, execuções: 9 },
    { name: 'Abr', projetos: 5, execuções: 39 },
    { name: 'Mai', projetos: 4, execuções: 28 },
    { name: 'Jun', projetos: 6, execuções: 40 },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className={`${stat.color} w-12 h-12 rounded-lg mb-4 flex items-center justify-center`}>
              <span className="text-white font-bold text-lg">📊</span>
            </div>
            <p className="text-slate-400 text-sm">{stat.label}</p>
            <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Projetos por Mês</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
              <Legend />
              <Bar dataKey="projetos" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Execuções por Mês</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
              <Legend />
              <Line type="monotone" dataKey="execuções" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Agentes</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(agents).map(([name, status]) => (
            <div key={name} className="bg-slate-700 rounded-lg p-4 text-center">
              <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${status.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <p className="text-sm font-medium text-white capitalize">{name}</p>
              <p className="text-xs text-slate-400 mt-1">{status.status}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
