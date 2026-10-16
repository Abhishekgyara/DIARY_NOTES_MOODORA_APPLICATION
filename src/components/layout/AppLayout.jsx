import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

export default function AppLayout({ children }) {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <div className="app-content animate-fadeIn" key={pathname}>
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
