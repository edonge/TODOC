import { useNavigate } from 'react-router-dom';
import todocCharacter from '../../assets/characters/todoc_character.png';
import './HeroSection.css';

function HeroSection({ childName }) {
  const navigate = useNavigate();

  const handleChatClick = () => {
    navigate('/ai');
  };

  return (
    <section className="hero-section">
      <div className="hero-text">
        <p className="hero-message">
          우리 {childName} <span className="highlight">맞춤</span> AI,<br />
          지금 사용 해보세요!
        </p>
        <button className="hero-cta" onClick={handleChatClick}>
          <span className="cta-text">사용해보기</span>
        </button>
      </div>
      <div className="hero-character">
        <img src={todocCharacter} alt="토닥 캐릭터" className="character-image" />
      </div>
    </section>
  );
}

export default HeroSection;
