import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Characters from './pages/Characters';
import Execution from './pages/Execution';
import Files from './pages/Files';
import { useUIStore } from './store';
import websocketService from './services/websocket';

function App() {
  const { darkMode } = useUIStore();
  const [currentProjectId, setCurrentProjectId] = useState(null);

  useEffect(() => {
    if (currentProjectId) {
      websocketService.connect(currentProjectId);
    }

    return () => {
      websocketService.disconnect();
    };
  }, [currentProjectId]);

  return (
    <Router>
      <div className={`flex h-screen ${darkMode ? 'dark' : ''}`}>
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-auto bg-slate-900">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/projects" element={<Projects setCurrentProjectId={setCurrentProjectId} />} />
              <Route path="/projects/:id" element={<ProjectDetail setCurrentProjectId={setCurrentProjectId} />} />
              <Route path="/characters" element={<Characters />} />
              <Route path="/execution" element={<Execution />} />
              <Route path="/files" element={<Files />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
