import { getMoodColor, getMoodLabel, getMoodEmoji } from '@/config/moods';

export function MoodPill({ moodId, size = 'md' }) {
  const color = getMoodColor(moodId);
  return (
    <span
      className="mood-pill"
      style={{
        background: `${color}22`,
        color,
        fontSize: size === 'sm' ? 11 : 13,
        padding: size === 'sm' ? '2px 8px' : '4px 12px',
      }}
    >
      <span>{getMoodEmoji(moodId)}</span>
      <span>{getMoodLabel(moodId)}</span>
    </span>
  );
}

export function MoodBar({ percentages, height = 6 }) {
  const entries = Object.entries(percentages).filter(([, v]) => v > 0);
  if (!entries.length) {
    return <div style={{ height, background: 'var(--border-light)', borderRadius: height / 2 }} />;
  }
  return (
    <div className="mood-bar" style={{ height }}>
      {entries.map(([moodId, pct]) => (
        <div
          key={moodId}
          className="mood-bar-segment"
          style={{ width: `${pct}%`, background: getMoodColor(moodId) }}
        />
      ))}
    </div>
  );
}

export function MoodDot({ moodId, size = 10 }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        background: getMoodColor(moodId),
        flexShrink: 0,
      }}
    />
  );
}
