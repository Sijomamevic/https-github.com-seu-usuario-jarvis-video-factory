import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Projects
export const projectsAPI = {
  getAll: () => api.get('/projects'),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  execute: (id, data) => api.post(`/projects/${id}/execute`, data),
};

// Executions
export const executionsAPI = {
  getByProject: (projectId) => api.get(`/executions/project/${projectId}`),
  getById: (id) => api.get(`/executions/${id}`),
  create: (data) => api.post('/executions', data),
};

// Characters
export const charactersAPI = {
  getByProject: (projectId) => api.get(`/characters/project/${projectId}`),
  create: (data) => api.post('/characters', data),
};

// Agents
export const agentsAPI = {
  getStatus: () => api.get('/agents/status'),
  triggerAction: (agentName, data) => api.post(`/agents/${agentName}/action`, data),
};

// Files
export const filesAPI = {
  upload: (projectId, type, file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', projectId);
    formData.append('type', type);
    return api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  list: (projectId, type) => api.get(`/files/${projectId}/${type}`),
  get: (projectId, type, filename) => api.get(`/files/${projectId}/${type}/${filename}`),
};

export default api;
