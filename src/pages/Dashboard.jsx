import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Calendar, Smile, Flame, Heart, Clock, ChevronRight, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { getEntries, getEntryDates } from '@/services/diaryService';
import { getDailyMoods, getMajorityMood, getTodayMood } from '@/services/moodService';
import { getGreeting, relativeDate, wordCount } from '@/utils/dateUtils';
import { getMoodLabel, getMoodColor, getMoodEmoji } from '@/config/moods';
import { StatCard, StatCardGrid } from '@/components/common/StatCard';
import { EmptyState } from '@/components/common/EmptyState';
import { MoodPill, MoodBar } from '@/components/common/MoodVisuals';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [entries] = useState(() => getEntries());

  const stats = useMemo(() => {
    const entryDates = getEntryDates();
    const totalNotes = entries.length;
    const daysJournaled = Object.keys(entryDates).length;
    const allMoods = getDailyMoods();
    const moodCount = {};
    Object.values(allMoods).forEach((dm) => {
      const majority = getMajorityMood(dm.percentages);
      if (majority?.type === 'single') {
        moodCount[majority.mood] = (moodCount[majority.mood] || 0) + 1;
      }
    });
    const mostMood = Object.entries(moodCount).sort((a, b) => b[1] - a[1])[0];

    let streak = 0;
    const today = format(new Date(), 'yyyy-MM-dd');
    const dates = [...new Set(entries.map((e) => e.dateKey))].sort((a, b) => b.localeCompare(a));
    let checkDate = today;
    if (dates[0] !== today) {
      const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');
      if (dates[0] !== yesterday) { checkDate = null; }
      else checkDate = yesterday;
    }
    if (checkDate) {
      for (const date of dates) {
        if (date === checkDate) {
          streak++;
          checkDate = format(new Date(new Date(checkDate).getTime() - 86400000), 'yyyy-MM-dd');
        } else if (date < checkDate) break;
      }
    }

    return {
      totalNotes,
      daysJournaled,
      mostMood: mostMood ? mostMood[0] : null,
      streak,
    };
  }, [entries]);

  const todayMood = getTodayMood();
  const recentEntries = entries.slice(0, 5);

  return (
    <div className="stagger">
      {/* Greeting */}
      <div className="mb-6" style={{ animationDelay: '0s' }}>
        <h1 className="section-title">{getGreeting()}, {user?.name?.split(' ')[0]}</h1>
        <p className="section-subtitle">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6">
        <StatCardGrid>
          <StatCard
            icon={FileText}
            label="Total Notes"
            value={stats.totalNotes}
            color="#C9A96E"
            delay={0.05}
          />
          <StatCard
            icon={Calendar}
            label="Days Journaled"
            value={stats.daysJournaled}
            color="#34B97A"
            delay={0.10}
          />
          <StatCard
            icon={Smile}
            label="Most Recorded Mood"
            value={stats.mostMood ? getMoodLabel(stats.mostMood) : '—'}
            color={stats.mostMood ? getMoodColor(stats.mostMood) : '#9CA3AF'}
            delay={0.15}
          />
          <StatCard
            icon={Flame}
            label="Writing Streak"
            value={`${stats.streak} day${stats.streak !== 1 ? 's' : ''}`}
            color="#FF8C42"
            delay={0.20}
          />
        </StatCardGrid>
      </div>

      {/* Today's Mood + Quick Action */}
      <div className="dashboard-row">
        <div className="card" style={{ flex: 1 }}>
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontSize: 18, fontWeight: 600 }}>Today's Mood</h3>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate('/calendar')}
            >
              {todayMood ? 'Update' : 'Record'}
            </button>
          </div>
          {todayMood ? (
            <div>
              <div className="flex gap-2 flex-wrap mb-4">
                {Object.entries(todayMood.percentages).map(([moodId, pct]) => (
                  <MoodPill key={moodId} moodId={moodId} />
                ))}
              </div>
              <MoodBar percentages={todayMood.percentages} height={8} />
              <div className="mt-4 flex gap-4 flex-wrap">
                {Object.entries(todayMood.percentages).map(([moodId, pct]) => (
                  <div key={moodId} className="flex items-center gap-2">
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: getMoodColor(moodId),
                      }}
                    />
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      {getMoodLabel(moodId)} · {pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '24px 0' }}>
              <Smile size={32} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
              <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                No mood recorded for today yet.
              </p>
              <button
                className="btn btn-primary btn-sm mt-4"
                onClick={() => navigate('/calendar')}
              >
                Record Today's Mood
              </button>
            </div>
          )}
        </div>

        <div className="card dashboard-quick-add" style={{ flex: '0 0 320px' }}>
          <BookOpen size={28} style={{ color: 'var(--accent)', marginBottom: 12 }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>New Diary Entry</h3>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
            Capture your thoughts, feelings, and moments.
          </p>
          <button
            className="btn btn-primary btn-lg w-full"
            onClick={() => navigate('/entries/new')}
          >
            <Plus size={20} />
            Write Entry
          </button>
        </div>
      </div>

      {/* Recent Entries */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ fontSize: 20, fontWeight: 600 }}>Recent Entries</h3>
          {entries.length > 5 && (
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/calendar')}>
              View all
            </button>
          )}
        </div>

        {recentEntries.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={FileText}
              title="No entries yet"
              subtitle="Start journaling by creating your first diary entry."
              action={
                <button
                  className="btn btn-primary"
                  onClick={() => navigate('/entries/new')}
                >
                  <Plus size={18} />
                  Write your first entry
                </button>
              }
            />
          </div>
        ) : (
          <div className="entry-list">
            {recentEntries.map((entry) => (
              <div
                key={entry.id}
                className="card card-hover entry-list-item"
                onClick={() => navigate(`/entries/${entry.id}`)}
              >
                <div className="entry-list-item-main">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="entry-list-title">{entry.title}</h4>
                    {entry.favorite && <Heart size={14} fill="currentColor" style={{ color: '#FF6B9D' }} />}
                  </div>
                  <p className="entry-list-preview">{entry.content}</p>
                  <div className="entry-list-meta">
                    <span className="flex items-center gap-1">
                      <Clock size={13} />
                      {relativeDate(entry.dateKey)}
                    </span>
                    <span>{entry.wordCount} words</span>
                    {entry.mood && <MoodPill moodId={entry.mood} size="sm" />}
                  </div>
                </div>
                <ChevronRight size={20} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .dashboard-row {
          display: flex;
          gap: 16px;
          margin-top: 16px;
        }
        .dashboard-quick-add {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: center;
        }
        .entry-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .entry-list-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 18px 20px;
          cursor: pointer;
        }
        .entry-list-item-main {
          flex: 1;
          min-width: 0;
        }
        .entry-list-title {
          font-size: 16px;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .entry-list-preview {
          font-size: 14px;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin: 4px 0 8px;
        }
        .entry-list-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 12px;
          color: var(--text-muted);
          flex-wrap: wrap;
        }
        @media (max-width: 768px) {
          .dashboard-row {
            flex-direction: column;
          }
          .dashboard-quick-add {
            flex: none !important;
          }
        }
      `}</style>
    </div>
  );
}
