import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookHeart, Mail, Lock, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { validateLoginForm, hasErrors } from '@/utils/validation';
import ThemeSwitcher from '@/components/common/ThemeSwitcher';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [showForgot, setShowForgot] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setErrors({ ...errors, [name]: '' });
    setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validateLoginForm(form);
    if (hasErrors(validation)) {
      setErrors(validation);
      return;
    }
    try {
      await login(form);
      navigate('/dashboard');
    } catch (error) {
      setServerError(error.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-form-container">
        <div className="auth-form-top">
          <Link to="/" className="auth-back-link">
            <ArrowLeft size={18} />
            <span>Back</span>
          </Link>
          <ThemeSwitcher compact />
        </div>

        <div className="auth-form-card">
          <div className="auth-form-logo">
            <BookHeart size={30} style={{ color: 'var(--accent)' }} />
          </div>
          <h1 className="auth-form-title">Welcome back</h1>
          <p className="auth-form-subtitle">Continue your journaling journey</p>

          {serverError && (
            <div className="auth-error-banner">
              <AlertCircle size={18} />
              <span>{serverError}</span>
            </div>
          )}

          {showForgot ? (
            <div className="auth-forgot-info">
              <p>
                Password recovery isn't available yet. Contact your administrator if you can't access your account.
              </p>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowForgot(false)}>
                Back to login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label className="input-label">Email</label>
                <div className="input-wrapper">
                  <Mail size={18} className="input-icon" />
                  <input
                    type="email"
                    name="email"
                    autoComplete="username"
                    className="input-field input-with-icon"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                  />
                </div>
                {errors.email && <p className="input-error">{errors.email}</p>}
              </div>

              <div className="form-group">
                <label className="input-label">Password</label>
                <div className="input-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input
                    type="password"
                    name="password"
                    autoComplete="current-password"
                    className="input-field input-with-icon"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={handleChange}
                  />
                </div>
                {errors.password && <p className="input-error">{errors.password}</p>}
              </div>

              <div className="auth-form-options">
                <button
                  type="button"
                  className="auth-forgot-btn"
                  onClick={() => setShowForgot(true)}
                >
                  Forgot password?
                </button>
              </div>

              <button type="submit" className="btn btn-primary btn-lg w-full">
                Sign In
              </button>
            </form>
          )}

          <p className="auth-form-footer">
            Don't have an account?{' '}
            <Link to="/signup" className="auth-link">Sign up</Link>
          </p>
        </div>
      </div>

      <style>{`
        .auth-form-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: var(--bg-primary);
        }

        .auth-form-top {
          position: absolute;
          top: 20px;
          left: 24px;
          right: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .auth-back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-secondary);
          transition: color 0.2s ease;
        }
        .auth-back-link:hover { color: var(--text-primary); }

        .auth-form-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 40px;
          max-width: 420px;
          width: 100%;
          box-shadow: 0 8px 40px var(--shadow);
          animation: fadeInScale 0.4s ease;
        }

        .auth-form-logo {
          display: flex;
          justify-content: center;
          margin-bottom: 20px;
        }

        .auth-form-title {
          font-size: 28px;
          font-weight: 600;
          text-align: center;
          color: var(--text-primary);
        }

        .auth-form-subtitle {
          font-size: 15px;
          color: var(--text-secondary);
          text-align: center;
          margin-bottom: 28px;
        }

        .auth-error-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.3);
          border-radius: var(--radius-sm);
          color: #EF4444;
          font-size: 14px;
          margin-bottom: 20px;
        }

        .auth-form { display: flex; flex-direction: column; gap: 16px; }

        .form-group { display: flex; flex-direction: column; }

        .input-wrapper {
          position: relative;
        }
        .input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          pointer-events: none;
        }
        .input-with-icon {
          padding-left: 42px;
        }

        .auth-form-options {
          display: flex;
          justify-content: flex-end;
        }
        .auth-forgot-btn {
          font-size: 13px;
          color: var(--accent);
          font-weight: 500;
          transition: color 0.2s ease;
        }
        .auth-forgot-btn:hover {
          color: var(--accent-hover);
          text-decoration: underline;
        }

        .auth-forgot-info {
          text-align: center;
          padding: 16px;
          background: var(--bg-tertiary);
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          font-size: 14px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          align-items: center;
        }

        .auth-form-footer {
          text-align: center;
          font-size: 14px;
          color: var(--text-secondary);
          margin-top: 24px;
        }
        .auth-link {
          color: var(--accent);
          font-weight: 600;
        }
        .auth-link:hover { text-decoration: underline; }

        @media (max-width: 480px) {
          .auth-form-card {
            padding: 28px 20px;
          }
          .auth-form-title {
            font-size: 24px;
          }
        }
      `}</style>
    </div>
  );
}
