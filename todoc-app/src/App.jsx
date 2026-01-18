import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import HomePage from './pages/HomePage';
import CommunityPage from './pages/CommunityPage';
import RecordPage from './pages/RecordPage';
import GrowthRecordAddPage from './pages/GrowthRecordAddPage';
import SleepRecordAddPage from './pages/SleepRecordAddPage';
import DiaperRecordAddPage from './pages/DiaperRecordAddPage';
import AppLayout from './components/layout/AppLayout';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app-wrapper">
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route element={<AppLayout />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/record" element={<RecordPage />} />
            <Route path="/record/growth/add" element={<GrowthRecordAddPage />} />
            <Route path="/record/sleep/add" element={<SleepRecordAddPage />} />
            <Route path="/record/diaper/add" element={<DiaperRecordAddPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
