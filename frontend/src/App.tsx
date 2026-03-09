
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ChatDashboard } from './pages/ChatDashboard';
import { ProjectsDashboard } from './pages/ProjectsDashboard';
import { KnowledgeBase } from './pages/KnowledgeBase';
import { Overview } from './pages/Overview';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Overview />} />
          <Route path="chat" element={<ChatDashboard />} />
          <Route path="projects" element={<ProjectsDashboard />} />
          <Route path="knowledge" element={<KnowledgeBase />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
