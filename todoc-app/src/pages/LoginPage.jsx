import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import todocLogo from '../assets/Todoc.png';
import './LoginPage.css';

function LoginPage() {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // 실제 인증 없이 온보딩 화면으로 이동
    navigate('/onboarding');
  };

  return (
    <div className="login-container">
      <div className="login-content">
        {/* 로고 영역 */}
        <div className="logo-section">
          <img src={todocLogo} alt="TODOC" className="logo-image" />
          <p className="logo-subtitle">똑똑한 육아 습관</p>
        </div>

        {/* 입력 폼 영역 */}
        <form className="login-form" onSubmit={handleLogin}>
          <div className="input-wrapper">
            <input
              type="text"
              placeholder="ID를 입력하세요"
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="login-input"
            />
          </div>

          <div className="input-wrapper">
            <input
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
            />
          </div>

          <button type="submit" className="login-button">
            로그인
          </button>
        </form>

        {/* 하단 링크 */}
        <div className="login-footer">
          <span className="footer-link">회원가입</span>
          <span className="footer-divider">|</span>
          <span className="footer-link">ID/비번 찾기</span>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
