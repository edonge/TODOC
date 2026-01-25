import { useState } from 'react';
import { withApiBase } from '../api/base';
import { useNavigate } from 'react-router-dom';
import todocLogo from '../assets/Todoc.png';
import './LoginPage.css';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('아이디와 비밀번호를 입력해주세요');
      return;
    }

    setIsLoading(true);

    try {
      // OAuth2PasswordRequestForm 형식으로 전송 (form-urlencoded)
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const response = await fetch(withApiBase('/api/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      const text = await response.text();

      if (!text) {
        throw new Error('서버 응답이 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.');
      }

      const data = JSON.parse(text);

      if (!response.ok) {
        throw new Error(data.detail || '로그인에 실패했습니다');
      }

      // 토큰 저장
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.removeItem('todoc_ai_sessions');

      try {
        const meRes = await fetch(withApiBase('/api/auth/me'), {
          headers: { Authorization: `Bearer ${data.access_token}` },
        });
        if (meRes.ok) {
          const me = await meRes.json();
          if (me?.id) {
            localStorage.setItem('user_id', String(me.id));
          }
        }
      } catch (meError) {
        console.warn('Failed to load user info', meError);
      }

      // 첫 로그인 여부에 따라 분기
      if (data.is_first_login) {
        navigate('/onboarding');
      } else {
        navigate('/home');
      }
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
        <form className="login-form" onSubmit={handleLogin}>
          <div className="input-wrapper">
            <input
              type="text"
              placeholder="아이디를 입력하세요"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="login-input"
              disabled={isLoading}
            />
          </div>

          <div className="input-wrapper">
            <input
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
              disabled={isLoading}
            />
          </div>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        {/* 하단 링크 */}
        <div className="login-footer">
          <span className="footer-link" onClick={() => navigate('/signup')}>
            회원가입
          </span>
          <span className="footer-divider">|</span>
          <span className="footer-link">ID/비번 찾기</span>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
