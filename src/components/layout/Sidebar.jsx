import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, Camera, BarChart3, Settings, BookHeart, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/calendar',  label: 'Calendar',  icon: Calendar },
  { to: '/photos',    label: 'Photos',    icon: Camera },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings',  label: 'Settings',  icon: Settings },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside className="app-sidebar">
      <div className="sidebar-logo">
        <BookHeart size={26} style={{ color: 'var(--accent)' }} />
        <span className="sidebar-logo-text">Moodora</span>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar-nav-item ${isActive ? 'sidebar-nav-item-active' : ''}`
            }
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user?.name}</span>
            <span className="sidebar-user-email">{user?.email}</span>
          </div>
        </div>
        <button className="sidebar-logout" onClick={handleLogout} title="Logout">
          <LogOut size={18} />
        </button>
      </div>

      <style>{`
        .app-sidebar {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: 260px;
          background: var(--bg-sidebar);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          padding: 24px 16px;
          z-index: 100;
          transition: transform 0.3s ease;
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 12px 24px;
        }
        .sidebar-logo-text {
          font-family: 'Playfair Display', serif;
          font-size: 22px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .sidebar-nav {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .sidebar-nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 14px;
          border-radius: var(--radius-sm);
          font-size: 15px;
          font-weight: 500;
          color: var(--text-secondary);
          transition: all 0.2s ease;
        }
        .sidebar-nav-item:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }
        .sidebar-nav-item-active {
          background: var(--accent-soft);
          color: var(--accent) !important;
          font-weight: 600;
        }

        .sidebar-footer {
          border-top: 1px solid var(--border-light);
          padding-top: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .sidebar-user {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .sidebar-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--accent);
          color: var(--text-inverse);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          font-weight: 600;
          flex-shrink: 0;
        }

        .sidebar-user-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .sidebar-user-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sidebar-user-email {
          font-size: 11px;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sidebar-logout {
          padding: 8px;
          border-radius: 8px;
          color: var(--text-muted);
          transition: all 0.2s ease;
          flex-shrink: 0;
        }
        .sidebar-logout:hover {
          background: var(--bg-hover);
          color: #EF4444;
        }

        @media (max-width: 1024px) {
          .app-sidebar {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </aside>
  );
}
