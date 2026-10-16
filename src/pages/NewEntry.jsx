import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Heart, X, AlertCircle, ImagePlus, FileText } from 'lucide-react';
import { createEntry, updateEntry, getEntryById, saveDraft, getDraft, clearDraft } from '@/services/diaryService';
import { MOOD_LIST, getMoodColor, getMoodLabel, getMoodEmoji } from '@/config/moods';
import { validateEntry, hasErrors } from '@/utils/validation';
import { getDateKey, wordCount } from '@/utils/dateUtils';
import { useToast } from '@/components/common/Toast';

const MOOD_OPTIONS = MOOD_LIST.map((m) => ({ id: m.id, label: m.label, color: m.color, emoji: m.emoji }));

export default function NewEntry({ editId, initialDate }) {
  const navigate = useNavigate();
  const { showToast, ToastEl } = useToast();
  const isEdit = !!editId;

  const [form, setForm] = useState({
    title: '',
    content: '',
    date: initialDate || getDateKey(new Date()),
    mood: '',
    favorite: false,
  });
  const [errors, setErrors] = useState({});
  const [dirty, setDirty] = useState(false);
  const draftTimer = useRef(null);

  useEffect(() => {
    if (editId) {
      const entry = getEntryById(editId);
      if (entry) {
        setForm({
          title: entry.title,
          content: entry.content,
          date: entry.dateKey,
          mood: entry.mood || '',
          favorite: entry.favorite,
        });
      }
    } else {
      const draft = getDraft();
      if (draft) {
        setForm({
          title: draft.title || '',
          content: draft.content || '',
          date: draft.date || getDateKey(new Date()),
          mood: draft.mood || '',
          favorite: draft.favorite || false,
        });
      }
    }
  }, [editId]);

  // Unsaved change protection
  useEffect(() => {
    const handler = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  // Autosave draft
  useEffect(() => {
    if (isEdit || !dirty) return;
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => {
      saveDraft(form).catch((error) => showToast(error.message, 'error'));
    }, 1500);
    return () => { if (draftTimer.current) clearTimeout(draftTimer.current); };
  }, [form, dirty, isEdit, showToast]);

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
    setDirty(true);
    setErrors({ ...errors, [field]: '' });
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const validation = validateEntry(form);
    if (hasErrors(validation)) {
      setErrors(validation);
      return;
    }
    const data = {
      title: form.title,
      content: form.content,
      date: form.date,
      mood: form.mood || null,
      favorite: form.favorite,
    };
    try {
      if (isEdit) {
        await updateEntry(editId, data);
        showToast('Entry updated');
      } else {
        await createEntry(data);
        await clearDraft();
        showToast('Entry created');
      }
      setDirty(false);
      setTimeout(() => navigate(-1), 600);
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const wc = wordCount(form.content);

  return (
    <div className="animate-fadeIn">
      {ToastEl}
      <div className="section-header">
        <div>
          <h1 className="section-title">{isEdit ? 'Edit Entry' : 'New Entry'}</h1>
          <p className="section-subtitle">
            {isEdit ? 'Update your diary entry' : 'Capture your thoughts and feelings'}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost" onClick={() => navigate(-1)}>
            <X size={18} />
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            <Save size={18} />
            {isEdit ? 'Update' : 'Save Entry'}
          </button>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 800 }}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="form-group">
            <label className="input-label">Title</label>
            <input
              type="text"
              className="input-field"
              placeholder="Give your entry a title..."
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              maxLength={200}
            />
            {errors.title && <p className="input-error">{errors.title}</p>}
          </div>

          <div className="form-group">
            <label className="input-label">Date</label>
            <input
              type="date"
              className="input-field"
              style={{ maxWidth: 260 }}
              value={form.date}
              max={getDateKey(new Date())}
              onChange={(e) => handleChange('date', e.target.value)}
            />
            <p className="text-muted mt-2" style={{ fontSize: 12 }}>
              You can assign this entry to a previous date.
            </p>
          </div>

          <div className="form-group">
            <label className="input-label">Content</label>
            <textarea
              className="input-field"
              placeholder="Write your thoughts..."
              value={form.content}
              onChange={(e) => handleChange('content', e.target.value)}
              rows={12}
              style={{ minHeight: 200 }}
            />
            <div className="flex items-center justify-between mt-2">
              {errors.content ? (
                <p className="input-error">{errors.content}</p>
              ) : (
                <span className="text-muted" style={{ fontSize: 12 }}>
                  {dirty && !isEdit ? 'Draft autosaved' : '\u00A0'}
                </span>
              )}
              <span className="text-muted" style={{ fontSize: 12 }}>{wc} words</span>
            </div>
          </div>

          <div className="form-group">
            <label className="input-label">Mood (optional)</label>
            <div className="mood-select-grid">
              <button
                type="button"
                className={`mood-option ${!form.mood ? 'mood-option-active' : ''}`}
                onClick={() => handleChange('mood', '')}
              >
                <span style={{ fontSize: 18 }}>—</span>
                <span>None</span>
              </button>
              {MOOD_OPTIONS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`mood-option ${form.mood === m.id ? 'mood-option-active' : ''}`}
                  style={form.mood === m.id ? { borderColor: m.color, background: `${m.color}15` } : {}}
                  onClick={() => handleChange('mood', m.id)}
                >
                  <span style={{ fontSize: 18 }}>{m.emoji}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="input-label">Favorite</label>
            <button
              type="button"
              className={`fav-toggle ${form.favorite ? 'fav-toggle-active' : ''}`}
              onClick={() => handleChange('favorite', !form.favorite)}
            >
              <Heart size={18} fill={form.favorite ? 'currentColor' : 'none'} />
              <span>{form.favorite ? 'Marked as favorite' : 'Mark as favorite'}</span>
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .mood-select-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 8px;
        }
        .mood-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 10px 8px;
          border: 2px solid var(--border);
          border-radius: var(--radius-sm);
          background: var(--bg-secondary);
          font-size: 12px;
          font-weight: 500;
          color: var(--text-secondary);
          transition: all 0.2s ease;
        }
        .mood-option:hover {
          border-color: var(--text-muted);
          transform: translateY(-1px);
        }
        .mood-option-active {
          border-color: var(--accent) !important;
          background: var(--accent-soft) !important;
          color: var(--accent) !important;
        }
        .fav-toggle {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          font-size: 14px;
          font-weight: 500;
          color: var(--text-secondary);
          transition: all 0.2s ease;
        }
        .fav-toggle:hover {
          border-color: var(--text-muted);
        }
        .fav-toggle-active {
          color: #FF6B9D;
          border-color: #FF6B9D;
          background: rgba(255,107,157,0.1);
        }
        @media (max-width: 480px) {
          .mood-select-grid {
            grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
          }
        }
      `}</style>
    </div>
  );
}
