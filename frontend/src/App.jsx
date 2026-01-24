import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import OnboardingPage from './pages/OnboardingPage';
import HomePage from './pages/HomePage';
import CommunityPage from './pages/CommunityPage';
import RecordPage from './pages/RecordPage';
import GrowthRecordAddPage from './pages/GrowthRecordAddPage';
import SleepRecordAddPage from './pages/SleepRecordAddPage';
import DiaperRecordAddPage from './pages/DiaperRecordAddPage';
import EtcRecordAddPage from './pages/EtcRecordAddPage';
import HealthRecordAddPage from './pages/HealthRecordAddPage';
import MealRecordAddPage from './pages/MealRecordAddPage';
import AiHomePage from './pages/AiHomePage';
import AiChatPage from './pages/AiChatPage';
import AppLayout from './components/layout/AppLayout';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app-wrapper">
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route element={<AppLayout />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/record" element={<RecordPage />} />
            <Route path="/record/growth/add" element={<GrowthRecordAddPage />} />
            <Route path="/record/sleep/add" element={<SleepRecordAddPage />} />
            <Route path="/record/diaper/add" element={<DiaperRecordAddPage />} />
            <Route path="/record/etc/add" element={<EtcRecordAddPage />} />
            <Route path="/record/health/add" element={<HealthRecordAddPage />} />
            <Route path="/record/meal/add" element={<MealRecordAddPage />} />
          </Route>
          <Route path="/ai" element={<AiHomePage />} />
          <Route path="/ai/:mode" element={<AiChatPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
