import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingWelcome from '../components/onboarding/OnboardingWelcome';
import OnboardingTerms from '../components/onboarding/OnboardingTerms';
import OnboardingName from '../components/onboarding/OnboardingName';
import OnboardingBirthday from '../components/onboarding/OnboardingBirthday';
import OnboardingProfile from '../components/onboarding/OnboardingProfile';
import OnboardingComplete from '../components/onboarding/OnboardingComplete';
import './OnboardingPage.css';

function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [childData, setChildData] = useState({
    name: '',
    birthday: null,
    gender: null,
    birthTiming: null,
    feedingType: null,
    recorder: null,
  });
  const navigate = useNavigate();

  const handleNext = () => {
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate('/login');
    }
  };

  const handleNameSubmit = (name) => {
    setChildData({ ...childData, name });
    handleNext();
  };

  const handleBirthdaySubmit = (birthday) => {
    setChildData({ ...childData, birthday });
    handleNext();
  };

  const handleProfileSubmit = (profileData) => {
    setChildData({ ...childData, ...profileData });
    handleNext();
  };

  const handleSkip = () => {
    handleNext();
  };

  const handleComplete = async () => {
    // 아이 정보를 localStorage에 저장
    if (childData.name) {
      localStorage.setItem('childName', childData.name);
    }
    if (childData.birthday) {
      localStorage.setItem('childBirthday', childData.birthday.toISOString());
    }

    // 온보딩 완료 API 호출 (is_first_login을 false로 변경)
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        await fetch('/api/auth/complete-onboarding', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('온보딩 완료 처리 실패:', error);
    }

    // 온보딩 완료 후 메인 화면으로 이동
    navigate('/home');
  };

  const getCallName = (fullName) => {
    if (!fullName) return '아이';
    const nameOnly = fullName.length > 1 ? fullName.slice(1) : fullName;
    const lastChar = nameOnly[nameOnly.length - 1];
    const code = lastChar.charCodeAt(0) - 0xac00;
    if (code < 0 || code > 11171) {
      return nameOnly;
    }
    const hasBatchim = code % 28 !== 0;
    return hasBatchim ? `${nameOnly}이` : nameOnly;
  };

  const callName = getCallName(childData.name);

  const renderStep = () => {
    switch (step) {
      case 1:
        return <OnboardingWelcome onNext={handleNext} />;
      case 2:
        return <OnboardingTerms onNext={handleNext} onBack={handleBack} />;
      case 3:
        return (
          <OnboardingName
            onNext={handleNameSubmit}
            onBack={handleBack}
            initialName={childData.name}
          />
        );
      case 4:
        return (
          <OnboardingBirthday
            onNext={handleBirthdaySubmit}
            onBack={handleBack}
            childName={callName}
            initialDate={childData.birthday}
          />
        );
      case 5:
        return (
          <OnboardingProfile
            onNext={handleProfileSubmit}
            onBack={handleBack}
            onSkip={handleSkip}
            initialData={{
              gender: childData.gender,
              birthTiming: childData.birthTiming,
              feedingType: childData.feedingType,
              recorder: childData.recorder,
            }}
          />
        );
      case 6:
        return (
          <OnboardingComplete
            onComplete={handleComplete}
            onBack={handleBack}
          />
        );
      default:
        handleComplete();
        return null;
    }
  };

  return (
    <div className="onboarding-container">
      {renderStep()}
    </div>
  );
}

export default OnboardingPage;
