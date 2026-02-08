import { create } from 'zustand';

export const useProjectStore = create((set) => ({
  projects: [],
  currentProject: null,
  
  setProjects: (projects) => set({ projects }),
  setCurrentProject: (project) => set({ currentProject: project }),
  addProject: (project) => set((state) => ({ projects: [...state.projects, project] })),
  updateProject: (id, updates) => set((state) => ({
    projects: state.projects.map(p => p.id === id ? { ...p, ...updates } : p),
    currentProject: state.currentProject?.id === id ? { ...state.currentProject, ...updates } : state.currentProject,
  })),
  deleteProject: (id) => set((state) => ({
    projects: state.projects.filter(p => p.id !== id),
    currentProject: state.currentProject?.id === id ? null : state.currentProject,
  })),
}));

export const useExecutionStore = create((set) => ({
  executions: [],
  currentExecution: null,
  
  setExecutions: (executions) => set({ executions }),
  setCurrentExecution: (execution) => set({ currentExecution: execution }),
  addExecution: (execution) => set((state) => ({ executions: [...state.executions, execution] })),
  updateExecution: (id, updates) => set((state) => ({
    executions: state.executions.map(e => e.id === id ? { ...e, ...updates } : e),
    currentExecution: state.currentExecution?.id === id ? { ...state.currentExecution, ...updates } : state.currentExecution,
  })),
}));

export const useAgentStore = create((set) => ({
  agents: {},
  
  setAgents: (agents) => set({ agents }),
  updateAgentStatus: (agentName, status) => set((state) => ({
    agents: { ...state.agents, [agentName]: status },
  })),
}));

export const useUIStore = create((set) => ({
  sidebarOpen: true,
  darkMode: true,
  notifications: [],
  
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  addNotification: (notification) => set((state) => ({
    notifications: [...state.notifications, { ...notification, id: Date.now() }],
  })),
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id),
  })),
}));
