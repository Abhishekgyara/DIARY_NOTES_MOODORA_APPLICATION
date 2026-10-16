import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Pencil, Trash2, Clock, Calendar as CalIcon } from 'lucide-react';
import { getEntryById, deleteEntry, toggleFavorite } from '@/services/diaryService';
import { formatDate, formatTime, wordCount } from '@/utils/dateUtils';
import { getMoodLabel, getMoodEmoji, getMoodColor } from '@/config/moods';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { MoodPill } from '@/components/common/MoodVisuals';
import { useToast } from '@/components/common/Toast';

export default function EntryDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast, ToastEl } = useToast();
  const [entry, setEntry] = useState(null);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    setEntry(getEntryById(id));
  }, [id]);

  if (!entry) {
    return (
      <div className="card">
        <EmptyState
          icon={CalIcon}
          title="Entry not found"
          subtitle="This entry may have been deleted."
          action={
            <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </button>
          }
        />
      </div>
    );
  }

  const handleDelete = async () => {
    try {
      await deleteEntry(id);
      setShowDelete(false);
      showToast('Entry deleted');
      setTimeout(() => navigate('/dashboard'), 500);
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleFav = async () => {
    try {
      const updated = await toggleFavorite(id);
      setEntry(updated);
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  return (
    <div className="animate-fadeIn" style={{ maxWidth: 800, margin: '0 auto' }}>
      {ToastEl}
      <div className="section-header">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
          Back
        </button>
        <div className="flex gap-2">
          <button className="btn btn-ghost btn-sm" onClick={handleFav}>
            <Heart size={16} fill={entry.favorite ? 'currentColor' : 'none'} style={{ color: entry.favorite ? '#FF6B9D' : undefined }} />
            {entry.favorite ? 'Favorited' : 'Favorite'}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/entries/${id}/edit`)}>
            <Pencil size={16} />
            Edit
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => setShowDelete(true)}>
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </div>

      <div className="card">
        <h1 style={{ fontSize: 30, fontWeight: 600, marginBottom: 12, lineHeight: 1.2 }}>{entry.title}</h1>

        <div className="flex items-center gap-4 flex-wrap mb-6" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          <span className="flex items-center gap-1">
            <CalIcon size={14} />
            {formatDate(entry.dateKey)}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={14} />
            {formatTime(entry.createdAt)}
          </span>
          <span>{entry.wordCount || wordCount(entry.content)} words</span>
          {entry.mood && <MoodPill moodId={entry.mood} size="sm" />}
        </div>

        <div style={{ fontSize: 16, lineHeight: 1.8, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
          {entry.content}
        </div>
      </div>

      <ConfirmDialog
        open={showDelete}
        title="Delete Entry"
        message="Are you sure you want to delete this entry? This action cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  );
}
