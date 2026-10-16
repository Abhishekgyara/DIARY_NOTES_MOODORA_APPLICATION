import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Palette, Bell, Download, Trash2, Shield, Check, Save } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ThemeSwitcher from '@/components/common/ThemeSwitcher';
import { getReminderSettings, saveReminderSettings } from '@/services/authService';
import { getEntries } from '@/services/diaryService';
import { getDailyMoods } from '@/services/moodService';
import { clearDemoData } from '@/services/demoService';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useToast } from '@/components/common/Toast';

export default function Settings() {
  const navigate = useNavigate();
  const { user, updateProfile, deleteProfile, logout } = useAuth();
  const { showToast, ToastEl } = useToast();
  const [name, setName] = useState(user?.name || '');
  const [reminder, setReminder] = useState(getReminderSettings());
  const [showClearDemo, setShowClearDemo] = useState(false);
  const [showDeleteProfile, setShowDeleteProfile] = useState(false);

  const handleSaveProfile = async () => {
    if (name.trim().length < 2) {
      showToast('Name must be at least 2 characters', 'error');
      return;
    }
    try {
      await updateProfile({ name: name.trim() });
      showToast('Profile updated');
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleSaveReminder = async () => {
    try {
      await saveReminderSettings(reminder);
      showToast('Reminder settings saved');
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleExportJSON = () => {
    const data = {
      user: { name: user?.name, email: user?.email },
      entries: getEntries(),
      moods: getDailyMoods(),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moodora-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported as JSON');
  };

  const handleExportCSV = () => {
    const entries = getEntries();
    const headers = ['ID', 'Title', 'Date', 'Mood', 'Word Count', 'Favorite', 'Created At', 'Content'];
    const rows = entries.map((e) => [
      e.id,
      `"${e.title.replace(/"/g, '""')}"`,
      e.dateKey,
      e.mood || '',
      e.wordCount,
      e.favorite ? 'Yes' : 'No',
      e.createdAt,
      `"${e.content.replace(/"/g, '""').replace(/\n/g, ' ')}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moodora-entries-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Entries exported as CSV');
  };

  const handleClearDemo = async () => {
    try {
      await clearDemoData();
      setShowClearDemo(false);
      showToast('Diary data cleared');
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleDeleteProfile = async () => {
    try {
      await deleteProfile();
      setShowDeleteProfile(false);
      navigate('/');
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  return (
    <div className="animate-fadeIn" style={{ maxWidth: 720 }}>
      {ToastEl}
      <div className="section-header">
        <div>
          <h1 className="section-title">Settings</h1>
          <p className="section-subtitle">Manage your profile and preferences</p>
        </div>
      </div>

      {/* Profile */}
      <div className="card settings-card">
        <div className="settings-card-header">
          <div className="settings-card-icon" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
            <User size={20} />
          </div>
          <div>
            <h3 className="settings-card-title">Profile</h3>
            <p className="settings-card-desc">Update your display name</p>
          </div>
        </div>
        <div className="settings-card-body">
          <div className="form-group mb-4">
            <label className="input-label">Display Name</label>
            <input
              type="text"
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="form-group mb-4">
            <label className="input-label">Email</label>
            <input type="email" className="input-field" value={user?.email || ''} disabled style={{ opacity: 0.6 }} />
          </div>
          <button className="btn btn-primary" onClick={handleSaveProfile}>
            <Save size={16} />
            Save Profile
          </button>
        </div>
      </div>

      {/* Theme */}
      <div className="card settings-card">
        <div className="settings-card-header">
          <div className="settings-card-icon" style={{ background: 'rgba(34,168,232,0.12)', color: '#22A8E8' }}>
            <Palette size={20} />
          </div>
          <div>
            <h3 className="settings-card-title">Theme</h3>
            <p className="settings-card-desc">Choose your preferred color scheme</p>
          </div>
        </div>
        <div className="settings-card-body">
          <ThemeSwitcher />
        </div>
      </div>

      {/* Reminders */}
      <div className="card settings-card">
        <div className="settings-card-header">
          <div className="settings-card-icon" style={{ background: 'rgba(245,197,24,0.12)', color: '#F5C518' }}>
            <Bell size={20} />
          </div>
          <div>
            <h3 className="settings-card-title">Reminders</h3>
            <p className="settings-card-desc">Choose when you want a journaling reminder</p>
          </div>
        </div>
        <div className="settings-card-body">
          <div className="flex items-center justify-between mb-4">
            <span style={{ fontSize: 14, fontWeight: 500 }}>Enable reminders</span>
            <button
              className={`toggle-switch ${reminder.enabled ? 'toggle-switch-on' : ''}`}
              onClick={() => setReminder({ ...reminder, enabled: !reminder.enabled })}
            >
              <span className="toggle-knob" />
            </button>
          </div>
          {reminder.enabled && (
            <div className="flex gap-4 flex-wrap">
              <div className="form-group" style={{ flex: 1, minWidth: 120 }}>
                <label className="input-label">Time</label>
                <input
                  type="time"
                  className="input-field"
                  value={reminder.time}
                  onChange={(e) => setReminder({ ...reminder, time: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: 140 }}>
                <label className="input-label">Frequency</label>
                <select
                  className="input-field"
                  value={reminder.frequency}
                  onChange={(e) => setReminder({ ...reminder, frequency: e.target.value })}
                >
                  <option value="daily">Daily</option>
                  <option value="weekdays">Weekdays</option>
                  <option value="weekends">Weekends</option>
                </select>
              </div>
            </div>
          )}
          <button className="btn btn-primary mt-4" onClick={handleSaveReminder}>
            <Save size={16} />
            Save Reminders
          </button>
        </div>
      </div>

      {/* Data Export */}
      <div className="card settings-card">
        <div className="settings-card-header">
          <div className="settings-card-icon" style={{ background: 'rgba(52,185,122,0.12)', color: '#34B97A' }}>
            <Download size={20} />
          </div>
          <div>
            <h3 className="settings-card-title">Data Export</h3>
            <p className="settings-card-desc">Download your diary data</p>
          </div>
        </div>
        <div className="settings-card-body">
          <div className="flex gap-3 flex-wrap">
            <button className="btn btn-ghost" onClick={handleExportJSON}>
              <Download size={16} />
              Export as JSON
            </button>
            <button className="btn btn-ghost" onClick={handleExportCSV}>
              <Download size={16} />
              Export Entries as CSV
            </button>
          </div>
        </div>
      </div>

      {/* Privacy */}
      <div className="card settings-card">
        <div className="settings-card-header">
          <div className="settings-card-icon" style={{ background: 'rgba(139,92,246,0.12)', color: '#8B5CF6' }}>
            <Shield size={20} />
          </div>
          <div>
            <h3 className="settings-card-title">Privacy</h3>
            <p className="settings-card-desc">How your data is stored</p>
          </div>
        </div>
        <div className="settings-card-body">
          <div className="privacy-info">
            <p>
              <strong>Private account storage.</strong> Your account, diary entries, daily moods, reminders,
              and drafts are stored in MongoDB. Photos are stored as binary files in MongoDB GridFS.
            </p>
            <p>
              Your browser keeps a local cache for the interface, while the server is the source of truth.
              Sign in to access your data across devices. Clearing browser data does not delete your server data.
            </p>
            <p>
              <strong>Photos:</strong> JPG, PNG, and WebP files up to 4MB are stored in GridFS and served
              only to the signed-in account that uploaded them.
            </p>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card settings-card settings-danger-zone">
        <div className="settings-card-header">
          <div className="settings-card-icon" style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444' }}>
            <Trash2 size={20} />
          </div>
          <div>
            <h3 className="settings-card-title">Danger Zone</h3>
            <p className="settings-card-desc">Irreversible actions</p>
          </div>
        </div>
        <div className="settings-card-body">
          <div className="danger-row">
            <div>
              <strong>Clear diary data</strong>
              <p>Remove all entries, moods, drafts, and photos from your account.</p>
            </div>
            <button className="btn btn-ghost btn-danger-text" onClick={() => setShowClearDemo(true)}>
              Clear Data
            </button>
          </div>
          <div className="danger-row">
            <div>
              <strong>Delete profile and all data</strong>
              <p>Permanently delete your account and all stored data from this device.</p>
            </div>
            <button className="btn btn-danger" onClick={() => setShowDeleteProfile(true)}>
              <Trash2 size={16} />
              Delete Profile
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showClearDemo}
        title="Clear Diary Data"
        message="This will remove all diary entries, moods, drafts, and photos from your account. This cannot be undone."
        confirmLabel="Clear All"
        danger
        onConfirm={handleClearDemo}
        onCancel={() => setShowClearDemo(false)}
      />

      <ConfirmDialog
        open={showDeleteProfile}
        title="Delete Profile"
        message="This will permanently delete your account and ALL of its data from MongoDB. This cannot be undone."
        confirmLabel="Delete Everything"
        danger
        onConfirm={handleDeleteProfile}
        onCancel={() => setShowDeleteProfile(false)}
      />

      <style>{`
        .settings-card {
          margin-bottom: 16px;
          padding: 0;
          overflow: hidden;
        }
        .settings-card-header {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border-light);
        }
        .settings-card-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .settings-card-title {
          font-size: 16px;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          color: var(--text-primary);
        }
        .settings-card-desc {
          font-size: 13px;
          color: var(--text-secondary);
          margin-top: 2px;
        }
        .settings-card-body {
          padding: 20px 24px;
        }
        .toggle-switch {
          width: 44px;
          height: 26px;
          border-radius: 13px;
          background: var(--border);
          position: relative;
          transition: background 0.2s ease;
          flex-shrink: 0;
        }
        .toggle-switch-on {
          background: var(--accent);
        }
        .toggle-knob {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #fff;
          transition: transform 0.2s ease;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .toggle-switch-on .toggle-knob {
          transform: translateX(18px);
        }
        .privacy-info {
          background: var(--bg-tertiary);
          border-radius: var(--radius-sm);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .privacy-info p {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.6;
        }
        .settings-danger-zone {
          border-color: rgba(239,68,68,0.3);
        }
        .danger-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 14px 0;
          border-bottom: 1px solid var(--border-light);
          flex-wrap: wrap;
        }
        .danger-row:last-child { border-bottom: none; }
        .danger-row strong {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
        }
        .danger-row p {
          font-size: 13px;
          color: var(--text-secondary);
          margin-top: 2px;
        }
        .btn-danger-text {
          color: #EF4444;
          border-color: rgba(239,68,68,0.3);
        }
        .btn-danger-text:hover {
          background: rgba(239,68,68,0.08);
          border-color: #EF4444;
        }
        @media (max-width: 480px) {
          .settings-card-header, .settings-card-body {
            padding: 16px;
          }
          .danger-row {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
