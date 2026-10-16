import { Moon, Sun, Heart, CloudRain } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { THEMES } from '@/config/themes';

const THEME_ICONS = {
  light: Sun,
  dark: Moon,
  dream: Heart,
  happy: CloudRain,
};

export default function ThemeSwitcher({ compact = false }) {
  const { theme, changeTheme } = useTheme();

  if (compact) {
    return (
      <div className="flex gap-2 flex-wrap">
        {Object.values(THEMES).map((t) => {
          const Icon = THEME_ICONS[t.id];
          return (
            <button
              key={t.id}
              className={`theme-chip ${theme === t.id ? 'theme-chip-active' : ''}`}
              onClick={() => changeTheme(t.id)}
              title={t.label}
            >
              <Icon size={16} />
              <span>{t.label}</span>
            </button>
          );
        })}
        <style>{`
          .theme-chip {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 500;
            color: var(--text-secondary);
            border: 1px solid var(--border);
            transition: all 0.2s ease;
          }
          .theme-chip:hover {
            border-color: var(--text-muted);
          }
          .theme-chip-active {
            background: var(--accent-soft);
            color: var(--accent);
            border-color: var(--accent);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="flex gap-3 flex-wrap">
      {Object.values(THEMES).map((t) => {
        const Icon = THEME_ICONS[t.id];
        return (
          <button
            key={t.id}
            className={`theme-card ${theme === t.id ? 'theme-card-active' : ''}`}
            onClick={() => changeTheme(t.id)}
          >
            <Icon size={22} style={{ color: 'var(--accent)' }} />
            <span>{t.label}</span>
          </button>
        );
      })}
      <style>{`
        .theme-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 16px 20px;
          border-radius: var(--radius);
          border: 2px solid var(--border);
          background: var(--bg-secondary);
          font-size: 14px;
          font-weight: 500;
          color: var(--text-secondary);
          transition: all 0.2s ease;
          min-width: 90px;
        }
        .theme-card:hover {
          border-color: var(--text-muted);
          transform: translateY(-2px);
        }
        .theme-card-active {
          border-color: var(--accent);
          background: var(--accent-soft);
          color: var(--accent);
        }
      `}</style>
    </div>
  );
}
