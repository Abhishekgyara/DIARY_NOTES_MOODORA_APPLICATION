import { useState, useRef, useEffect } from 'react';
import { Plus, Minus } from 'lucide-react';
import { MOOD_LIST, getMoodColor, getMoodLabel, getMoodEmoji } from '@/config/moods';

export default function MoodTracker({ initialPercentages = {}, onChange, onSave, saveLabel = 'Save Mood' }) {
  const [percentages, setPercentages] = useState(initialPercentages);
  const [selected, setSelected] = useState(Object.keys(initialPercentages));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPercentages(initialPercentages);
    setSelected(Object.keys(initialPercentages));
  }, [initialPercentages]);

  const total = Object.values(percentages).reduce((sum, v) => sum + (v || 0), 0);

  const toggleMood = (moodId) => {
    setSaved(false);
    if (selected.includes(moodId)) {
      const newSelected = selected.filter((m) => m !== moodId);
      const remaining = newSelected.length;
      const newPct = { ...percentages };
      delete newPct[moodId];
      if (remaining > 0) {
        const each = Math.floor(100 / remaining);
        let remainder = 100 - each * remaining;
        newSelected.forEach((m) => {
          newPct[m] = each + (remainder > 0 ? 1 : 0);
          if (remainder > 0) remainder--;
        });
      }
      setSelected(newSelected);
      setPercentages(newPct);
      onChange?.(newPct);
    } else {
      const newSelected = [...selected, moodId];
      const each = Math.floor(100 / newSelected.length);
      let remainder = 100 - each * newSelected.length;
      const newPct = {};
      newSelected.forEach((m) => {
        newPct[m] = each + (remainder > 0 ? 1 : 0);
        if (remainder > 0) remainder--;
      });
      setSelected(newSelected);
      setPercentages(newPct);
      onChange?.(newPct);
    }
  };

  const adjustPercentage = (moodId, delta) => {
    setSaved(false);
    const newPct = { ...percentages };
    const newVal = Math.max(0, Math.min(100, (newPct[moodId] || 0) + delta));
    const diff = newVal - (newPct[moodId] || 0);
    if (diff === 0) return;

    const others = selected.filter((m) => m !== moodId);
    const otherTotal = others.reduce((sum, m) => sum + (newPct[m] || 0), 0);

    if (diff > 0) {
      let toDeduct = diff;
      if (otherTotal === 0) return;
      others.forEach((m) => {
        const ratio = (newPct[m] || 0) / otherTotal;
        const deduct = Math.round(diff * ratio);
        newPct[m] = Math.max(0, (newPct[m] || 0) - deduct);
      });
      const actualDeducted = others.reduce((sum, m) => sum + ((percentages[m] || 0) - (newPct[m] || 0)), 0);
      toDeduct = actualDeducted;
    } else {
      // Adding back to others proportionally
      const toRedistribute = -diff;
      if (others.length > 0) {
        const each = Math.floor(toRedistribute / others.length);
        let rem = toRedistribute - each * others.length;
        others.forEach((m) => {
          newPct[m] = (newPct[m] || 0) + each + (rem > 0 ? 1 : 0);
          if (rem > 0) rem--;
        });
      }
    }

    newPct[moodId] = newVal;
    const newTotal = Object.values(newPct).reduce((sum, v) => sum + v, 0);
    if (newTotal !== 100) {
      const adj = 100 - newTotal;
      if (others.length > 0) {
        newPct[others[0]] = (newPct[others[0]] || 0) + adj;
      }
    }
    setPercentages(newPct);
    onChange?.(newPct);
  };

  const setExactValue = (moodId, value) => {
    setSaved(false);
    const clamped = Math.max(0, Math.min(100, value));
    const newPct = { ...percentages, [moodId]: clamped };
    const otherTotal = Object.entries(newPct)
      .filter(([k]) => k !== moodId)
      .reduce((sum, [, v]) => sum + v, 0);
    if (clamped + otherTotal > 100) {
      const excess = (clamped + otherTotal) - 100;
      const others = selected.filter((m) => m !== moodId);
      let remaining = excess;
      for (const m of others) {
        const canTake = Math.min(newPct[m], remaining);
        newPct[m] -= canTake;
        remaining -= canTake;
        if (remaining <= 0) break;
      }
    }
    setPercentages(newPct);
    onChange?.(newPct);
  };

  const handleSave = async () => {
    if (total === 100) {
      const savedSuccessfully = await onSave?.(percentages);
      if (savedSuccessfully !== false) setSaved(true);
    }
  };

  return (
    <div className="mood-tracker">
      <div className="mood-tracker-total-row">
        <span className="mood-tracker-total-label">Total</span>
        <span
          className="mood-tracker-total-value"
          style={{ color: total === 100 ? '#34B97A' : total > 100 ? '#EF4444' : 'var(--text-secondary)' }}
        >
          {total}%
          {total === 100 && <span style={{ marginLeft: 6, fontSize: 14 }}>&#10003;</span>}
        </span>
      </div>

      <div className="mood-tracker-moods">
        {MOOD_LIST.map((mood) => {
          const isSelected = selected.includes(mood.id);
          const pct = percentages[mood.id] || 0;
          return (
            <button
              key={mood.id}
              className={`mood-select-btn ${isSelected ? 'mood-select-btn-active' : ''}`}
              style={{
                borderColor: isSelected ? mood.color : 'var(--border)',
                background: isSelected ? `${mood.color}15` : 'var(--bg-secondary)',
              }}
              onClick={() => toggleMood(mood.id)}
            >
              <span style={{ fontSize: 20 }}>{mood.emoji}</span>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{mood.label}</span>
              {isSelected && (
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: mood.color,
                  }}
                >
                  {pct}%
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selected.length > 0 && (
        <div className="mood-tracker-sliders">
          {selected.map((moodId) => {
            const mood = MOOD_LIST.find((m) => m.id === moodId);
            const pct = percentages[moodId] || 0;
            return (
              <div key={moodId} className="mood-slider-row">
                <div className="mood-slider-label">
                  <span style={{ fontSize: 18 }}>{mood.emoji}</span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                    {mood.label}
                  </span>
                </div>
                <div className="mood-slider-controls">
                  <button
                    className="mood-slider-btn"
                    onClick={() => adjustPercentage(moodId, -5)}
                    disabled={pct <= 0}
                  >
                    <Minus size={16} />
                  </button>
                  <div className="mood-slider-track-wrapper">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={pct}
                      onChange={(e) => setExactValue(moodId, parseInt(e.target.value))}
                      className="mood-slider"
                      style={{ accentColor: mood.color }}
                    />
                    <div className="mood-slider-fill" style={{ width: `${pct}%`, background: mood.color }} />
                  </div>
                  <button
                    className="mood-slider-btn"
                    onClick={() => adjustPercentage(moodId, 5)}
                    disabled={pct >= 100}
                  >
                    <Plus size={16} />
                  </button>
                  <span className="mood-slider-value" style={{ color: mood.color }}>
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected.length === 0 && (
        <p className="mood-tracker-hint">
          Select one or more moods above to start distributing percentages.
        </p>
      )}

      {selected.length > 0 && total !== 100 && (
        <p className="mood-tracker-warning">
          Percentages must total exactly 100%. Currently at {total}%.
        </p>
      )}

      {onSave && (
        <button
          className="btn btn-primary w-full"
          onClick={handleSave}
          disabled={total !== 100}
          style={{ marginTop: 20 }}
        >
          {saved ? 'Saved!' : saveLabel}
        </button>
      )}

      <style>{`
        .mood-tracker {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .mood-tracker-total-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: var(--bg-tertiary);
          border-radius: var(--radius-sm);
        }
        .mood-tracker-total-label {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-secondary);
        }
        .mood-tracker-total-value {
          font-size: 18px;
          font-weight: 700;
        }
        .mood-tracker-moods {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
          gap: 10px;
        }
        .mood-select-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 14px 10px;
          border: 2px solid var(--border);
          border-radius: var(--radius-sm);
          background: var(--bg-secondary);
          transition: all 0.2s ease;
          min-height: 80px;
        }
        .mood-select-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px var(--shadow);
        }
        .mood-select-btn-active {
          transform: scale(1.02);
        }
        .mood-tracker-sliders {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .mood-slider-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .mood-slider-label {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 110px;
        }
        .mood-slider-controls {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          min-width: 200px;
        }
        .mood-slider-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: var(--bg-secondary);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }
        .mood-slider-btn:hover:not(:disabled) {
          background: var(--bg-hover);
          color: var(--text-primary);
        }
        .mood-slider-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        .mood-slider-track-wrapper {
          position: relative;
          flex: 1;
          height: 8px;
          border-radius: 4px;
          background: var(--border-light);
          overflow: hidden;
        }
        .mood-slider {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
          margin: 0;
        }
        .mood-slider-fill {
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          border-radius: 4px;
          transition: width 0.2s ease;
          pointer-events: none;
        }
        .mood-slider-value {
          font-size: 15px;
          font-weight: 700;
          min-width: 42px;
          text-align: right;
        }
        .mood-tracker-hint, .mood-tracker-warning {
          font-size: 14px;
          color: var(--text-secondary);
          text-align: center;
          padding: 12px;
        }
        .mood-tracker-warning {
          color: #FF8C42;
        }
        @media (max-width: 480px) {
          .mood-tracker-moods {
            grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          }
          .mood-slider-label {
            min-width: 90px;
          }
        }
      `}</style>
    </div>
  );
}
