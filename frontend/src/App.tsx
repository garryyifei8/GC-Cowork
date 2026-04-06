import './widgets/registry'; // Initialize widget registry
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ProjectsDashboard } from './pages/ProjectsDashboard';
import { KnowledgeBase } from './pages/KnowledgeBase';
import { Overview } from './pages/Overview';
import { ProjectDetail } from './pages/ProjectDetail';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { Tasks } from './pages/Tasks';
import { HRDashboard } from './pages/HRDashboard';
import { FinanceDashboard } from './pages/FinanceDashboard';
import { BiddingDashboard } from './pages/BiddingDashboard';
import { MyDaily } from './pages/MyDaily';
import { ChatPage } from './pages/ChatPage';
import AgentsPage from './pages/AgentsPage';
import { LegalDashboard } from './pages/LegalDashboard';
import { AuditDashboard } from './pages/AuditDashboard';
import { SupervisionDashboard } from './pages/SupervisionDashboard';
import { BusinessAnalytics } from './pages/BusinessAnalytics';
import { SettingsPage } from './pages/SettingsPage';
import { ToastContainer } from './components/ui/ToastContainer';

function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Overview />} />
          <Route path="agents" element={<AgentsPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="daily" element={<MyDaily />} />
          <Route path="projects" element={<ProjectsDashboard />} />
          <Route
            path="projects/:id"
            element={
              <ErrorBoundary>
                <ProjectDetail />
              </ErrorBoundary>
            }
          />
          <Route path="hr" element={<HRDashboard />} />
          <Route path="finance" element={<FinanceDashboard />} />
          <Route path="bidding" element={<BiddingDashboard />} />
          <Route path="knowledge" element={<KnowledgeBase />} />
          <Route path="legal" element={<LegalDashboard />} />
          <Route path="audit" element={<AuditDashboard />} />
          <Route path="supervision" element={<SupervisionDashboard />} />
          <Route path="analytics" element={<BusinessAnalytics />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
