import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, AreaChart, Area } from 'recharts';
import { FileText, Calendar, Smile, Flame, BarChart3, Info } from 'lucide-react';
import { getAnalytics } from '@/services/analyticsService';
import { MOOD_LIST, getMoodColor, getMoodLabel } from '@/config/moods';
import { StatCard, StatCardGrid } from '@/components/common/StatCard';
import { EmptyState } from '@/components/common/EmptyState';
import { format, subDays, parseISO, isToday } from 'date-fns';

const PERIODS = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: 'all', label: 'Overall' },
];

export default function Analytics() {
  const [period, setPeriod] = useState('7d');
  const data = useMemo(() => getAnalytics(period), [period]);

  const tooltipStyle = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    fontSize: 13,
    color: 'var(--text-primary)',
  };

  const hasMoodData = data.moodDistribution.length > 0;
  const hasWritingData = data.totalNotes > 0;

  return (
    <div className="animate-fadeIn">
      <div className="section-header">
        <div>
          <h1 className="section-title">Analytics</h1>
          <p className="section-subtitle">Insights into your moods and journaling</p>
        </div>
        <div className="period-tabs">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              className={`period-tab ${period === p.value ? 'period-tab-active' : ''}`}
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Data source info */}
      <div className="card analytics-info mb-6">
        <Info size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          Showing data from <strong style={{ color: 'var(--text-primary)' }}>
          {period === 'all' ? 'all records' : format(data.moodTrend?.[0]?.date ? new Date() : new Date(), 'MMM d')}
          {period !== 'all' && ` to ${format(new Date(), 'MMM d')}`}</strong>.
          Daily moods are recorded separately from entry-level moods. Days without recorded moods are shown as empty, not neutral.
        </span>
      </div>

      {/* Summary stats */}
      <div className="mb-6">
        <StatCardGrid>
          <StatCard icon={FileText} label="Total Notes" value={data.totalNotes} color="#C9A96E" delay={0.05} />
          <StatCard icon={Smile} label="Mood Recorded Days" value={data.recordedMoodDays} color="#34B97A" delay={0.10} />
          <StatCard icon={Calendar} label="Journaling Days" value={data.journalingDays} color="#22A8E8" delay={0.15} />
          <StatCard icon={Flame} label="Writing Streak" value={`${data.streak}d`} color="#FF8C42" delay={0.20} />
        </StatCardGrid>
      </div>

      {data.mostFrequentMood && (
        <div className="card mb-6" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `${getMoodColor(data.mostFrequentMood)}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Smile size={22} style={{ color: getMoodColor(data.mostFrequentMood) }} />
          </div>
          <div>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Most Frequently Recorded Mood: </span>
            <strong style={{ fontSize: 15, color: getMoodColor(data.mostFrequentMood) }}>{getMoodLabel(data.mostFrequentMood)}</strong>
          </div>
        </div>
      )}

      {!hasMoodData && !hasWritingData ? (
        <div className="card">
          <EmptyState
            icon={BarChart3}
            title="No data yet"
            subtitle="Start journaling and recording moods to see your analytics come to life."
          />
        </div>
      ) : (
        <div className="analytics-charts">
          {/* Mood Distribution Doughnut */}
          {hasMoodData && (
            <div className="card chart-card">
              <h3 className="chart-title">Mood Distribution</h3>
              <p className="chart-subtitle">How your moods are distributed</p>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.moodDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={2}
                  >
                    {data.moodDistribution.map((entry) => (
                      <Cell key={entry.mood} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value) => [`${value}%`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="chart-legend">
                {data.moodDistribution.map((m) => (
                  <div key={m.mood} className="chart-legend-item">
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: m.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{m.name}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{m.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mood Trend */}
          {hasMoodData && (
            <div className="card chart-card chart-card-wide">
              <h3 className="chart-title">Mood Trends</h3>
              <p className="chart-subtitle">Your mood percentages over time</p>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.moodTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {MOOD_LIST.filter((m) => data.moodTrend.some((d) => d[m.label] > 0)).map((m) => (
                    <Area
                      key={m.id}
                      type="monotone"
                      dataKey={m.label}
                      stackId="1"
                      stroke={m.color}
                      fill={m.color}
                      fillOpacity={0.4}
                      strokeWidth={1.5}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Mood Composition Stacked Bar */}
          {hasMoodData && (
            <div className="card chart-card chart-card-wide">
              <h3 className="chart-title">Daily Mood Composition</h3>
              <p className="chart-subtitle">Mood breakdown per day</p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.moodComposition}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {MOOD_LIST.filter((m) => data.moodComposition.some((d) => d[m.label] > 0)).map((m) => (
                    <Bar key={m.id} dataKey={m.label} stackId="a" fill={m.color} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Writing Activity */}
          {hasWritingData && (
            <div className="card chart-card chart-card-wide">
              <h3 className="chart-title">Writing Activity</h3>
              <p className="chart-subtitle">Notes written per day</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.writingActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} notes`, '']} />
                  <Bar dataKey="notes" fill="var(--accent)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Mood Heatmap */}
          {hasMoodData && data.heatmap.length > 0 && (
            <div className="card chart-card chart-card-wide">
              <h3 className="chart-title">Mood Calendar Heatmap</h3>
              <p className="chart-subtitle">Your dominant mood each day</p>
              <div className="heatmap-grid">
                {data.heatmap.map((day) => (
                  <div
                    key={day.date}
                    className="heatmap-cell"
                    style={{
                      background: day.color || 'var(--bg-tertiary)',
                      opacity: day.color ? 0.85 : 0.3,
                    }}
                    title={`${format(parseISO(day.date), 'MMM d')}: ${day.moodId ? getMoodLabel(day.moodId) : 'No mood'}`}
                  />
                ))}
              </div>
              <div className="heatmap-legend">
                {MOOD_LIST.filter((m) => data.heatmap.some((h) => h.moodId === m.id)).map((m) => (
                  <div key={m.id} className="chart-legend-item">
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: m.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{m.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        .period-tabs {
          display: flex;
          gap: 4px;
          background: var(--bg-tertiary);
          border-radius: var(--radius-sm);
          padding: 4px;
          flex-wrap: wrap;
        }
        .period-tab {
          padding: 7px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
          transition: all 0.2s ease;
        }
        .period-tab:hover {
          color: var(--text-primary);
        }
        .period-tab-active {
          background: var(--bg-card);
          color: var(--accent);
          box-shadow: 0 2px 8px var(--shadow);
        }
        .analytics-info {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 20px;
        }
        .analytics-charts {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .chart-card {
          padding: 20px;
        }
        .chart-card-wide {
          grid-column: 1 / -1;
        }
        .chart-title {
          font-size: 17px;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          color: var(--text-primary);
        }
        .chart-subtitle {
          font-size: 13px;
          color: 'var(--text-secondary)';
          margin-bottom: 16px;
        }
        .chart-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          justify-content: center;
          margin-top: 16px;
        }
        .chart-legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .heatmap-grid {
          display: grid;
          grid-template-columns: repeat(15, 1fr);
          gap: 4px;
          margin: 16px 0;
        }
        .heatmap-cell {
          aspect-ratio: 1;
          border-radius: 4px;
          min-height: 20px;
        }
        .heatmap-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          justify-content: center;
        }
        @media (max-width: 768px) {
          .analytics-charts {
            grid-template-columns: 1fr;
          }
          .heatmap-grid {
            grid-template-columns: repeat(10, 1fr);
          }
        }
        @media (max-width: 480px) {
          .period-tabs {
            width: 100%;
            justify-content: center;
          }
          .period-tab {
            padding: 6px 10px;
            font-size: 12px;
          }
          .heatmap-grid {
            grid-template-columns: repeat(8, 1fr);
          }
        }
      `}</style>
    </div>
  );
}
