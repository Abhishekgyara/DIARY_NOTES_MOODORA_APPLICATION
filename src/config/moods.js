export const MOODS = {
  happy:       { id: 'happy',       label: 'Happy',       color: '#F5C518', emoji: '😊' },
  calm:        { id: 'calm',        label: 'Calm',        color: '#34B97A', emoji: '😌' },
  excited:     { id: 'excited',     label: 'Excited',     color: '#FF8C42', emoji: '🤩' },
  loved:       { id: 'loved',       label: 'Loved',       color: '#FF6B9D', emoji: '🥰' },
  neutral:     { id: 'neutral',     label: 'Neutral',     color: '#9CA3AF', emoji: '😐' },
  sad:         { id: 'sad',         label: 'Sad',         color: '#3B82F6', emoji: '😢' },
  angry:       { id: 'angry',       label: 'Angry',       color: '#EF4444', emoji: '😠' },
  anxious:     { id: 'anxious',     label: 'Anxious',     color: '#8B5CF6', emoji: '😰' },
  overwhelmed: { id: 'overwhelmed', label: 'Overwhelmed', color: '#D2691E', emoji: '😵' },
  low:         { id: 'low',         label: 'Low',         color: '#4F46E5', emoji: '😔' },
};

export const MOOD_LIST = Object.values(MOODS);

export const MOOD_COLORS = Object.fromEntries(
  MOOD_LIST.map((m) => [m.id, m.color])
);

export function getMoodById(id) {
  return MOODS[id] || null;
}

export function getMoodColor(id) {
  return MOOD_COLORS[id] || '#9CA3AF';
}

export function getMoodLabel(id) {
  return MOODS[id]?.label || id;
}

export function getMoodEmoji(id) {
  return MOODS[id]?.emoji || '';
}
