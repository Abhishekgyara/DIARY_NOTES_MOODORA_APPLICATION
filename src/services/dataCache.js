import { setItem, removeItem } from '@/utils/storageUtils';

export function hydrateDataCache(data) {
  setItem('diary_entries', data.entries || []);
  setItem('daily_moods', data.moods || {});
  setItem('photos', data.photos || []);
  setItem('reminder_settings', data.reminder || { enabled: false, time: '20:00', frequency: 'daily' });
  setItem('diary_draft', data.draft || null);
}

export function clearAccountCache() {
  ['diary_entries', 'daily_moods', 'moodora_photos', 'reminder_settings', 'diary_draft'].forEach(removeItem);
}
