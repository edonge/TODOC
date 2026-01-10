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

  const handleComplete = () => {
    // 온보딩 완료 후 메인 화면으로 이동
    navigate('/home');
  };

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
            childName={childData.name}
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
