import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, Camera, BarChart3, Settings, Plus } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/calendar',  label: 'Calendar', icon: Calendar },
  { to: '/photos',    label: 'Photos', icon: Camera },
  { to: '/analytics', label: 'Stats', icon: BarChart3 },
  { to: '/settings',  label: 'Settings', icon: Settings },
];

export default function BottomNav() {
  const navigate = useNavigate();

  return (
    <>
      <nav className="bottom-nav">
        {NAV_ITEMS.slice(0, 2).map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `bottom-nav-item ${isActive ? 'bottom-nav-item-active' : ''}`
            }
          >
            <Icon size={22} />
            <span>{label}</span>
          </NavLink>
        ))}

        <button
          className="bottom-nav-fab"
          onClick={() => navigate('/entries/new')}
          title="New Entry"
        >
          <Plus size={26} />
        </button>

        {NAV_ITEMS.slice(2).map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `bottom-nav-item ${isActive ? 'bottom-nav-item-active' : ''}`
            }
          >
            <Icon size={22} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <style>{`
        .bottom-nav {
          display: none;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 64px;
          background: var(--bg-card);
          border-top: 1px solid var(--border);
          align-items: center;
          justify-content: space-around;
          z-index: 200;
          padding-bottom: env(safe-area-inset-bottom);
        }

        .bottom-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          color: var(--text-muted);
          font-size: 10px;
          font-weight: 500;
          transition: color 0.2s ease;
          flex: 1;
        }
        .bottom-nav-item:hover {
          color: var(--text-secondary);
        }
        .bottom-nav-item-active {
          color: var(--accent) !important;
        }

        .bottom-nav-fab {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: var(--accent);
          color: var(--text-inverse);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: -20px;
          box-shadow: 0 6px 20px var(--shadow-lg);
          transition: all 0.2s ease;
          flex-shrink: 0;
        }
        .bottom-nav-fab:hover {
          transform: scale(1.08);
          background: var(--accent-hover);
        }
        .bottom-nav-fab:active {
          transform: scale(0.95);
        }

        @media (max-width: 1024px) {
          .bottom-nav {
            display: flex;
          }
        }
      `}</style>
    </>
  );
}
