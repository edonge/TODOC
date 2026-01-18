import { Outlet, useLocation } from 'react-router-dom';
import Header from '../home/Header';

const TITLE_MAP = {
  '/home': '홈',
  '/community': '커뮤니티',
  '/record': '일지',
  '/ai': '토닥 AI',
};

function AppLayout() {
  const { pathname } = useLocation();
  const title = TITLE_MAP[pathname] ?? '홈';

  return (
    <div className="app-layout">
      <Header title={title} />
      <Outlet />
    </div>
  );
}

export default AppLayout;
