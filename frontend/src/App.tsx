
import './widgets/registry';  // Initialize widget registry
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ProjectsDashboard } from './pages/ProjectsDashboard';
import { KnowledgeBase } from './pages/KnowledgeBase';
import { Overview } from './pages/Overview';
import { ProjectDetail } from './pages/ProjectDetail';
import { Tasks } from './pages/Tasks';
import { HRDashboard } from './pages/HRDashboard';
import { FinanceDashboard } from './pages/FinanceDashboard';
import { MyDaily } from './pages/MyDaily';
import { ChatPage } from './pages/ChatPage';
import AgentsPage from './pages/AgentsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Overview />} />
          <Route path="agents" element={<AgentsPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="daily" element={<MyDaily />} />
          <Route path="projects" element={<ProjectsDashboard />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="hr" element={<HRDashboard />} />
          <Route path="finance" element={<FinanceDashboard />} />
          <Route path="knowledge" element={<KnowledgeBase />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
