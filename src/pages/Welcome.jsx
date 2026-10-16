import { useNavigate } from 'react-router-dom';
import { BookHeart, Mail, UserPlus, Sparkles, Calendar, BarChart3, Camera } from 'lucide-react';
import ThemeSwitcher from '@/components/common/ThemeSwitcher';

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="auth-page">
      <div className="auth-top-bar">
        <div className="auth-logo">
          <BookHeart size={26} style={{ color: 'var(--accent)' }} />
          <span>Moodora</span>
        </div>
        <ThemeSwitcher compact />
      </div>

      <div className="auth-hero">
        <div className="auth-hero-content">
          <div className="auth-badge">
            <Sparkles size={14} />
            <span>Your personal diary & mood tracker</span>
          </div>
          <h1 className="auth-title">
            Capture your<br />thoughts & feelings
          </h1>
          <p className="auth-subtitle">
            A peaceful space to journal, track moods, and reflect on your
            emotional journey — beautifully organized, privately yours.
          </p>

          <div className="auth-actions">
            <button
              className="btn btn-primary btn-lg auth-btn-main"
              onClick={() => navigate('/signup')}
            >
              <UserPlus size={20} />
              Get Started
            </button>
            <button
              className="btn btn-ghost btn-lg"
              onClick={() => navigate('/login')}
            >
              <Mail size={20} />
              I have an account
            </button>
          </div>

          <p className="auth-note">
            Your account keeps your diary and mood records synced to your private account.
          </p>
        </div>

        <div className="auth-hero-visual">
          <div className="auth-feature-card auth-feature-card-1">
            <div className="auth-feature-icon" style={{ background: '#F5C51822', color: '#F5C518' }}>
              <BarChart3 size={20} />
            </div>
            <div>
              <strong>Mood Analytics</strong>
              <p>Visualize your emotional patterns</p>
            </div>
          </div>
          <div className="auth-feature-card auth-feature-card-2">
            <div className="auth-feature-icon" style={{ background: '#34B97A22', color: '#34B97A' }}>
              <Calendar size={20} />
            </div>
            <div>
              <strong>Calendar View</strong>
              <p>See your journey at a glance</p>
            </div>
          </div>
          <div className="auth-feature-card auth-feature-card-3">
            <div className="auth-feature-icon" style={{ background: '#22A8E822', color: '#22A8E8' }}>
              <Camera size={20} />
            </div>
            <div>
              <strong>Photo Memories</strong>
              <p>Attach photos to your entries</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .auth-page {
          min-height: 100vh;
          background: var(--bg-primary);
          display: flex;
          flex-direction: column;
        }

        .auth-top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 40px;
        }

        .auth-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'Playfair Display', serif;
          font-size: 22px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .auth-hero {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
          padding: 20px 40px 60px;
          gap: 40px;
        }

        .auth-hero-content {
          flex: 1;
          max-width: 520px;
        }

        .auth-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 20px;
          background: var(--accent-soft);
          color: var(--accent);
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 24px;
          animation: fadeInUp 0.5s ease;
        }

        .auth-title {
          font-size: 48px;
          font-weight: 700;
          line-height: 1.1;
          color: var(--text-primary);
          margin-bottom: 20px;
          animation: fadeInUp 0.6s ease;
        }

        .auth-subtitle {
          font-size: 17px;
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 32px;
          max-width: 440px;
          animation: fadeInUp 0.7s ease;
        }

        .auth-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-width: 340px;
          animation: fadeInUp 0.8s ease;
        }

        .auth-btn-main {
          width: 100%;
        }

        .auth-note {
          margin-top: 20px;
          font-size: 13px;
          color: var(--text-muted);
        }

        .auth-hero-visual {
          flex: 1;
          max-width: 460px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          position: relative;
        }

        .auth-feature-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 18px 20px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          box-shadow: 0 4px 20px var(--shadow);
          opacity: 0;
          animation: fadeInUp 0.6s ease forwards;
        }
        .auth-feature-card-1 { animation-delay: 0.3s; transform: translateX(-10px); }
        .auth-feature-card-2 { animation-delay: 0.5s; transform: translateX(10px); }
        .auth-feature-card-3 { animation-delay: 0.7s; transform: translateX(-10px); }

        .auth-feature-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .auth-feature-card strong {
          display: block;
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary);
          font-family: 'Inter', sans-serif;
        }
        .auth-feature-card p {
          font-size: 13px;
          color: var(--text-secondary);
          margin-top: 2px;
        }

        @media (max-width: 768px) {
          .auth-top-bar {
            padding: 16px 20px;
            flex-direction: column;
            gap: 12px;
          }
          .auth-hero {
            flex-direction: column-reverse;
            padding: 20px 20px 40px;
            text-align: center;
          }
          .auth-hero-content {
            max-width: 100%;
          }
          .auth-title {
            font-size: 32px;
          }
          .auth-subtitle {
            font-size: 15px;
          }
          .auth-actions {
            max-width: 100%;
          }
          .auth-badge, .auth-actions {
            align-self: center;
          }
          .auth-hero-visual {
            max-width: 100%;
          }
          .auth-feature-card-1,
          .auth-feature-card-2,
          .auth-feature-card-3 {
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}
