import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { AppLayout } from './layouts/AppLayout.jsx';
import { AuthPage } from './pages/AuthPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';
import { ResumeReviewPage } from './pages/ResumeReviewPage.jsx';
import { ResumesPage } from './pages/ResumesPage.jsx';
import { AtsAnalysisPage } from './pages/AtsAnalysisPage.jsx';
import { JobDetailPage } from './pages/JobDetailPage.jsx';
import { JobMatchPage } from './pages/JobMatchPage.jsx';
import { JobsPage } from './pages/JobsPage.jsx';
import { NewJobPage } from './pages/NewJobPage.jsx';
import { ResumeVersionPage } from './pages/ResumeVersionPage.jsx';
import { TailoringReviewPage } from './pages/TailoringReviewPage.jsx';
import { JobDiscoveryPage } from './pages/JobDiscoveryPage.jsx';
import { ReferralsPage } from './pages/ReferralsPage.jsx';
import { ReferralMessagesPage } from './pages/ReferralMessagesPage.jsx';
import { ApplicationPrepPage } from './pages/ApplicationPrepPage.jsx';
import { ApplicationsPage } from './pages/ApplicationsPage.jsx';
import { ApplicationDetailPage } from './pages/ApplicationDetailPage.jsx';
import { InterviewPrepPage } from './pages/InterviewPrepPage.jsx';
import { CopilotPage } from './pages/CopilotPage.jsx';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/resumes" element={<ResumesPage />} />
          <Route path="/resumes/:resumeId/review" element={<ResumeReviewPage />} />
          <Route path="/resumes/:resumeId/ats" element={<AtsAnalysisPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/jobs/new" element={<NewJobPage />} />
          <Route path="/jobs/discover" element={<JobDiscoveryPage />} />
          <Route path="/jobs/:jobId" element={<JobDetailPage />} />
          <Route path="/jobs/:jobId/match/:resumeId" element={<JobMatchPage />} />
          <Route path="/referrals" element={<ReferralsPage />} />
          <Route path="/referrals/:candidateId/messages" element={<ReferralMessagesPage />} />
          <Route path="/prepare" element={<ApplicationPrepPage />} />
          <Route path="/applications" element={<ApplicationsPage />} />
          <Route path="/applications/:applicationId" element={<ApplicationDetailPage />} />
          <Route path="/applications/:applicationId/interview-prep" element={<InterviewPrepPage />} />
          <Route path="/copilot" element={<CopilotPage />} />
          <Route path="/tailoring/:sessionId" element={<TailoringReviewPage />} />
          <Route path="/resume-versions/:versionId" element={<ResumeVersionPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
