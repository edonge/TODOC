import { useState } from 'react';
import { withApiBase } from '../api/base';
import { useNavigate } from 'react-router-dom';
import todocLogo from '../assets/Todoc.png';
import './LoginPage.css';

function SignupPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    // 유효성 검사
    if (username.length < 3) {
      setError('아이디는 3자 이상이어야 합니다');
      return;
    }

    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다');
      return;
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(withApiBase('/api/auth/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      // 응답 텍스트 먼저 확인
      const text = await response.text();

      if (!text) {
        throw new Error('서버 응답이 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.');
      }

      const data = JSON.parse(text);

      if (!response.ok) {
        throw new Error(data.detail || '회원가입에 실패했습니다');
      }

      // 회원가입 성공 시 로그인 페이지로 이동
      alert('회원가입이 완료되었습니다. 로그인해주세요.');
      navigate('/login');
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('서버에 연결할 수 없습니다. 백엔드 서버를 확인해주세요.');
      } else {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
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
        <form className="login-form" onSubmit={handleSignup}>
          <div className="input-wrapper">
            <input
              type="text"
              placeholder="아이디를 입력하세요 (3자 이상)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="login-input"
              disabled={isLoading}
            />
          </div>

          <div className="input-wrapper">
            <input
              type="password"
              placeholder="비밀번호를 입력하세요 (6자 이상)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
              disabled={isLoading}
            />
          </div>

          <div className="input-wrapper">
            <input
              type="password"
              placeholder="비밀번호 확인"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="login-input"
              disabled={isLoading}
            />
          </div>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? '가입 중...' : '회원가입'}
          </button>
        </form>

        {/* 하단 링크 */}
        <div className="login-footer">
          <span className="footer-link" onClick={() => navigate('/login')}>
            로그인으로 돌아가기
          </span>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
