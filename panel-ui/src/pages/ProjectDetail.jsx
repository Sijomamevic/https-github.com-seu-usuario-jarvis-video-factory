import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { projectsAPI, executionsAPI } from '../services/api';
import { useProjectStore, useExecutionStore } from '../store';
import websocketService from '../services/websocket';

export default function ProjectDetail({ setCurrentProjectId }) {
  const { id } = useParams();
  const { currentProject, setCurrentProject } = useProjectStore();
  const { executions, setExecutions } = useExecutionStore();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('plano');

  useEffect(() => {
    loadProjectData();
    setCurrentProjectId(id);

    websocketService.on('execution-updates', (data) => {
      if (data.projectId === id) {
        loadExecutions();
      }
    });

    return () => {
      websocketService.off('execution-updates', null);
    };
  }, [id, setCurrentProjectId]);

  const loadProjectData = async () => {
    try {
      setLoading(true);
      const [projectRes, executionsRes] = await Promise.all([
        projectsAPI.getById(id),
        executionsAPI.getByProject(id),
      ]);
      
      setCurrentProject(projectRes.data.project);
      setExecutions(executionsRes.data.executions);
    } catch (error) {
      console.error('Failed to load project data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExecutions = async () => {
    try {
      const res = await executionsAPI.getByProject(id);
      setExecutions(res.data.executions);
    } catch (error) {
      console.error('Failed to load executions:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-400">Carregando projeto...</p>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-400">Projeto não encontrado</p>
      </div>
    );
  }

  const scenes = currentProject.manifest?.scenes || [];

  return (
    <div className="p-6 space-y-6">
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h1 className="text-3xl font-bold text-white mb-2">{currentProject.name}</h1>
        <p className="text-slate-400 mb-4">{currentProject.description}</p>
        <div className="flex items-center gap-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            currentProject.status === 'completed' ? 'bg-green-500/20 text-green-400' :
            currentProject.status === 'executing' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-slate-700 text-slate-300'
          }`}>
            {currentProject.status}
          </span>
          <span className="text-slate-400">Tipo: {currentProject.type === 'short' ? 'Short' : 'Longo'}</span>
          <span className="text-slate-400">Duração: {currentProject.duration}s</span>
        </div>
      </div>

      <div className="flex gap-4 border-b border-slate-700">
        {['plano', 'instrucoes', 'cena', 'arquivos'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            {tab === 'plano' && 'Plano'}
            {tab === 'instrucoes' && 'Instruções'}
            {tab === 'cena' && 'Cena'}
            {tab === 'arquivos' && 'Arquivos'}
          </button>
        ))}
      </div>

      {activeTab === 'plano' && (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-4">Plano do Projeto</h2>
          <div className="space-y-2">
            {scenes.length === 0 ? (
              <p className="text-slate-400">Nenhuma cena definida</p>
            ) : (
              scenes.map((scene, idx) => (
                <div key={idx} className="bg-slate-700 p-4 rounded-lg">
                  <p className="font-medium text-white">{scene.title}</p>
                  <p className="text-sm text-slate-400 mt-1">{scene.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'cena' && (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-4">Execução das Cenas</h2>
          <div className="space-y-4">
            {executions.length === 0 ? (
              <p className="text-slate-400">Nenhuma execução iniciada</p>
            ) : (
              executions.map((execution) => (
                <div key={execution.id} className="bg-slate-700 p-4 rounded-lg border border-slate-600">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-white">{execution.agent_name}</p>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      execution.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      execution.status === 'running' ? 'bg-yellow-500/20 text-yellow-400' :
                      execution.status === 'error' ? 'bg-red-500/20 text-red-400' :
                      'bg-slate-600 text-slate-300'
                    }`}>
                      {execution.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">Cena: {execution.scene_id}</p>
                  {execution.error && (
                    <p className="text-sm text-red-400 mt-2">Erro: {execution.error}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'arquivos' && (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-4">Arquivos do Projeto</h2>
          <div className="space-y-4">
            {currentProject.status === 'completed' ? (
              <div className="bg-slate-700 p-4 rounded-lg border border-slate-600">
                <p className="text-sm text-slate-300 mb-3">Vídeo Final Gerado</p>
                <a
                  href={`/api/projects/${id}/download`}
                  download
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Vídeo Final
                </a>
                <p className="text-xs text-slate-400 mt-2">Caminho: /data/video_factory/{id}/export/final_video.mp4</p>
              </div>
            ) : (
              <p className="text-slate-400">Aguardando conclusão do projeto para disponibilizar download...</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
