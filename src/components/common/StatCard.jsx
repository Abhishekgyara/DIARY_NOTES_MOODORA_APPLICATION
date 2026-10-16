import { FileText, Calendar, Smile, Flame } from 'lucide-react';

export function StatCard({ icon: Icon, label, value, color, delay = 0 }) {
  return (
    <div
      className="card card-hover stat-card"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="stat-card-icon" style={{ background: `${color}22`, color }}>
        <Icon size={22} />
      </div>
      <div className="stat-card-info">
        <span className="stat-card-value">{value}</span>
        <span className="stat-card-label">{label}</span>
      </div>
      <style>{`
        .stat-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          opacity: 0;
          animation: fadeInUp 0.5s ease forwards;
        }
        .stat-card-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .stat-card-info {
          display: flex;
          flex-direction: column;
        }
        .stat-card-value {
          font-size: 24px;
          font-weight: 700;
          font-family: 'Inter', sans-serif;
          color: var(--text-primary);
          line-height: 1.2;
        }
        .stat-card-label {
          font-size: 13px;
          color: var(--text-secondary);
          margin-top: 2px;
        }
      `}</style>
    </div>
  );
}

export function StatCardGrid({ children }) {
  return (
    <div className="stat-grid">
      {children}
      <style>{`
        .stat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 16px;
        }
        @media (max-width: 480px) {
          .stat-grid {
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
          .stat-card {
            padding: 14px;
            gap: 10px;
          }
          .stat-card-icon {
            width: 38px;
            height: 38px;
            border-radius: 10px;
          }
          .stat-card-icon svg {
            width: 18px;
            height: 18px;
          }
          .stat-card-value {
            font-size: 20px;
          }
          .stat-card-label {
            font-size: 11px;
          }
        }
      `}</style>
    </div>
  );
}

export const STAT_ICONS = { FileText, Calendar, Smile, Flame };
