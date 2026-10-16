import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CalendarDays, Plus, FileText, X, Pencil, Trash2, Smile } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday as isDateToday, isSameDay, parseISO } from 'date-fns';
import { getEntryDates, getEntriesByDate, deleteEntry } from '@/services/diaryService';
import { getDailyMoods, getMajorityMood, saveMood, deleteMood } from '@/services/moodService';
import { getMoodColor, getMoodLabel, getMoodEmoji } from '@/config/moods';
import { getDateKey } from '@/utils/dateUtils';
import Modal from '@/components/common/Modal';
import MoodTracker from '@/components/mood/MoodTracker';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { MoodBar, MoodPill } from '@/components/common/MoodVisuals';
import { EmptyState } from '@/components/common/EmptyState';
import { useToast } from '@/components/common/Toast';

export default function Calendar() {
  const navigate = useNavigate();
  const { showToast, ToastEl } = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [deleteEntryId, setDeleteEntryId] = useState(null);
  const [moodForDate, setMoodForDate] = useState({});
  const [version, setVersion] = useState(0);

  const entryDates = useMemo(() => getEntryDates(), [version]);
  const allMoods = useMemo(() => getDailyMoods(), [version]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [currentMonth]);

  const selectedKey = selectedDate ? getDateKey(selectedDate) : null;
  const selectedEntries = selectedKey ? getEntriesByDate(selectedKey) : [];
  const selectedMood = selectedKey ? allMoods[selectedKey] : null;
  const selectedMajority = selectedMood ? getMajorityMood(selectedMood.percentages) : null;

  const handleDayClick = (day) => {
    setSelectedDate(day);
  };

  const handleSaveMood = async (percentages) => {
    if (selectedKey) {
      try {
        await saveMood(selectedKey, percentages);
        setShowMoodModal(false);
        showToast('Mood saved');
        setVersion((v) => v + 1);
        return true;
      } catch (error) {
        showToast(error.message, 'error');
        return false;
      }
    }
  };

  const handleDeleteMood = async () => {
    if (selectedKey) {
      try {
        await deleteMood(selectedKey);
        showToast('Mood deleted');
        setVersion((v) => v + 1);
      } catch (error) {
        showToast(error.message, 'error');
      }
    }
  };

  const handleDeleteEntry = async () => {
    if (deleteEntryId) {
      try {
        await deleteEntry(deleteEntryId);
        setDeleteEntryId(null);
        showToast('Entry deleted');
        setVersion((v) => v + 1);
      } catch (error) {
        showToast(error.message, 'error');
      }
    }
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="animate-fadeIn">
      {ToastEl}
      <div className="section-header">
        <div>
          <h1 className="section-title">Calendar</h1>
          <p className="section-subtitle">Your journaling journey at a glance</p>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => { setCurrentMonth(new Date()); setSelectedDate(new Date()); }}
        >
          <CalendarDays size={16} />
          Today
        </button>
      </div>

      <div className="calendar-layout">
        {/* Calendar grid */}
        <div className="card calendar-card">
          <div className="calendar-nav">
            <button className="btn btn-icon btn-ghost" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft size={20} />
            </button>
            <h3 style={{ fontSize: 20, fontWeight: 600 }}>{format(currentMonth, 'MMMM yyyy')}</h3>
            <button className="btn btn-icon btn-ghost" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="calendar-grid">
            {weekDays.map((d) => (
              <div key={d} className="calendar-weekday">{d}</div>
            ))}
            {calendarDays.map((day) => {
              const key = getDateKey(day);
              const inMonth = isSameMonth(day, currentMonth);
              const today = isDateToday(day);
              const selected = selectedDate && isSameDay(day, selectedDate);
              const noteCount = entryDates[key] || 0;
              const dayMood = allMoods[key];

              return (
                <button
                  key={key}
                  className={`calendar-day ${!inMonth ? 'calendar-day-outside' : ''} ${today ? 'calendar-day-today' : ''} ${selected ? 'calendar-day-selected' : ''}`}
                  onClick={() => handleDayClick(day)}
                >
                  <span className="calendar-day-num">{format(day, 'd')}</span>
                  {noteCount > 0 && (
                    <span className="calendar-day-badge">{noteCount}</span>
                  )}
                  {dayMood && (
                    <div className="calendar-day-mood-bar">
                      {Object.entries(dayMood.percentages).slice(0, 5).map(([moodId, pct]) => (
                        <div key={moodId} style={{ width: `${pct}%`, background: getMoodColor(moodId) }} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Day detail panel */}
        {selectedDate && (
          <div className="card calendar-detail">
            <div className="calendar-detail-header">
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 600 }}>
                  {format(selectedDate, 'EEEE')}
                </h3>
                <p className="text-secondary" style={{ fontSize: 14 }}>
                  {format(selectedDate, 'MMMM d, yyyy')}
                </p>
              </div>
              <button className="btn btn-icon btn-ghost btn-sm" onClick={() => setSelectedDate(null)}>
                <X size={18} />
              </button>
            </div>

            {/* Note count */}
            <div className="calendar-detail-section">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={16} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontSize: 14, fontWeight: 500 }}>
                  {selectedEntries.length} {selectedEntries.length === 1 ? 'note' : 'notes'}
                </span>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-ghost btn-sm" onClick={() => setShowNotesModal(true)} disabled={!selectedEntries.length}>
                  View Notes
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => navigate(`/entries/new?date=${selectedKey}`)}
                >
                  <Plus size={16} />
                  New Entry
                </button>
              </div>
            </div>

            {/* Mood section */}
            <div className="calendar-detail-section">
              <div className="flex items-center gap-2 mb-2">
                <Smile size={16} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontSize: 14, fontWeight: 500 }}>
                  {selectedMood ? 'Daily Mood' : 'No mood recorded'}
                </span>
              </div>

              {selectedMood ? (
                <div>
                  <MoodBar percentages={selectedMood.percentages} height={8} />
                  <div className="mt-4 flex gap-3 flex-wrap">
                    {Object.entries(selectedMood.percentages).map(([moodId, pct]) => (
                      <div key={moodId} className="flex items-center gap-2">
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: getMoodColor(moodId) }} />
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                          {getMoodLabel(moodId)} · {pct}%
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center gap-2 flex-wrap">
                    <span className="text-muted" style={{ fontSize: 13 }}>Majority mood:</span>
                    {selectedMajority?.type === 'tie' ? (
                      <span style={{ fontSize: 13 }}>
                        {selectedMajority.moods.map((m) => getMoodLabel(m)).join(' / ')} (tied at {selectedMajority.value}%)
                      </span>
                    ) : selectedMajority?.type === 'single' ? (
                      <MoodPill moodId={selectedMajority.mood} />
                    ) : null}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button className="btn btn-ghost btn-sm" onClick={() => setShowMoodModal(true)}>Update Mood</button>
                    <button className="btn btn-ghost btn-sm" onClick={handleDeleteMood} style={{ color: '#EF4444' }}>Remove Mood</button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-muted" style={{ fontSize: 13, marginBottom: 12 }}>
                    No mood has been recorded for this day. Moods are independent of diary entries.
                  </p>
                  <button className="btn btn-primary btn-sm" onClick={() => setShowMoodModal(true)}>
                    <Smile size={16} />
                    Record Mood
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mood modal */}
      <Modal
        open={showMoodModal}
        onClose={() => setShowMoodModal(false)}
        title={`Mood for ${selectedDate ? format(selectedDate, 'MMM d, yyyy') : ''}`}
        size="lg"
      >
        <MoodTracker
          initialPercentages={selectedMood?.percentages || {}}
          onSave={handleSaveMood}
          saveLabel="Save Daily Mood"
        />
      </Modal>

      {/* Notes modal */}
      <Modal
        open={showNotesModal}
        onClose={() => setShowNotesModal(false)}
        title={`Notes for ${selectedDate ? format(selectedDate, 'MMM d, yyyy') : ''}`}
        size="lg"
      >
        {selectedEntries.length === 0 ? (
          <EmptyState icon={FileText} title="No notes" subtitle="No entries for this date." />
        ) : (
          <div className="flex flex-col gap-3">
            {selectedEntries.map((entry) => (
              <div
                key={entry.id}
                className="calendar-note-item"
                onClick={() => navigate(`/entries/${entry.id}`)}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex items-center gap-2 mb-1">
                    <strong style={{ fontSize: 15 }}>{entry.title}</strong>
                    {entry.mood && <MoodPill moodId={entry.mood} size="sm" />}
                  </div>
                  <p className="text-secondary truncate" style={{ fontSize: 14 }}>
                    {entry.content}
                  </p>
                  <span className="text-muted" style={{ fontSize: 12 }}>
                    {format(parseISO(entry.createdAt), 'h:mm a')}
                  </span>
                </div>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <button className="btn btn-icon btn-ghost btn-sm" onClick={() => navigate(`/entries/${entry.id}/edit`)}>
                    <Pencil size={14} />
                  </button>
                  <button className="btn btn-icon btn-ghost btn-sm" onClick={() => setDeleteEntryId(entry.id)} style={{ color: '#EF4444' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteEntryId}
        title="Delete Entry"
        message="Are you sure you want to delete this entry?"
        confirmLabel="Delete"
        danger
        onConfirm={handleDeleteEntry}
        onCancel={() => setDeleteEntryId(null)}
      />

      <style>{`
        .calendar-layout {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 16px;
          align-items: start;
        }
        .calendar-card { padding: 20px; }
        .calendar-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
        }
        .calendar-weekday {
          text-align: center;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
          padding: 8px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .calendar-day {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          padding: 8px 4px;
          border-radius: 10px;
          border: 2px solid transparent;
          background: var(--bg-secondary);
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary);
          min-height: 56px;
          transition: all 0.15s ease;
          position: relative;
        }
        .calendar-day:hover {
          border-color: var(--accent);
          background: var(--bg-hover);
        }
        .calendar-day-outside {
          opacity: 0.35;
        }
        .calendar-day-today {
          border-color: var(--accent);
          background: var(--accent-soft);
        }
        .calendar-day-selected {
          border-color: var(--accent);
          background: var(--accent-soft);
          box-shadow: 0 0 0 2px var(--accent);
        }
        .calendar-day-num { font-size: 13px; }
        .calendar-day-badge {
          position: absolute;
          top: 4px;
          right: 4px;
          background: var(--accent);
          color: var(--text-inverse);
          font-size: 10px;
          font-weight: 700;
          border-radius: 10px;
          padding: 1px 6px;
          min-width: 18px;
          text-align: center;
        }
        .calendar-day-mood-bar {
          display: flex;
          width: 100%;
          height: 4px;
          border-radius: 2px;
          overflow: hidden;
          margin-top: auto;
        }
        .calendar-day-mood-bar > div {
          transition: width 0.3s ease;
        }

        .calendar-detail {
          position: sticky;
          top: 20px;
        }
        .calendar-detail-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border-light);
        }
        .calendar-detail-section {
          padding: 16px 0;
          border-bottom: 1px solid var(--border-light);
        }
        .calendar-detail-section:last-child { border-bottom: none; }
        .calendar-note-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .calendar-note-item:hover {
          border-color: var(--text-muted);
          background: var(--bg-hover);
        }

        @media (max-width: 900px) {
          .calendar-layout {
            grid-template-columns: 1fr;
          }
          .calendar-detail {
            position: static;
          }
        }
        @media (max-width: 480px) {
          .calendar-day {
            min-height: 48px;
            padding: 6px 2px;
          }
          .calendar-day-num { font-size: 12px; }
          .calendar-day-badge { font-size: 9px; padding: 0 4px; }
        }
      `}</style>
    </div>
  );
}
