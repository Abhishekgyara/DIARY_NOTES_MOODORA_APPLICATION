import { getItem, setItem } from '@/utils/storageUtils';
import { getDateKey } from '@/utils/dateUtils';
import { apiRequest, jsonBody } from '@/services/apiClient';

const MOOD_KEY = 'daily_moods';

function getAllMoods() {
  return getItem(MOOD_KEY) || {};
}

function saveAllMoods(moods) {
  setItem(MOOD_KEY, moods);
}

export function getDailyMoods() {
  return getAllMoods();
}

export function getMoodByDate(dateKey) {
  const moods = getAllMoods();
  return moods[dateKey] || null;
}

export async function saveMood(dateKey, percentages) {
  const moods = getAllMoods();
  const total = Object.values(percentages).reduce((sum, v) => sum + (v || 0), 0);
  if (total !== 100) return null;
  const cleaned = Object.fromEntries(Object.entries(percentages).filter(([, value]) => value > 0));
  const result = await apiRequest(`/moods/${encodeURIComponent(dateKey)}`, {
    method: 'PUT',
    body: jsonBody({ percentages: cleaned }),
  });
  moods[dateKey] = result.mood;
  saveAllMoods(moods);
  return moods[dateKey];
}

export async function deleteMood(dateKey) {
  await apiRequest(`/moods/${encodeURIComponent(dateKey)}`, { method: 'DELETE' });
  const moods = getAllMoods();
  delete moods[dateKey];
  saveAllMoods(moods);
  return true;
}

export function getMoodDates() {
  return Object.keys(getAllMoods());
}

export function getMajorityMood(percentages) {
  if (!percentages || !Object.keys(percentages).length) return null;
  const sorted = Object.entries(percentages).sort((a, b) => b[1] - a[1]);
  const top = sorted[0];
  const tied = sorted.filter(([, v]) => v === top[1]);
  if (tied.length > 1) {
    return { type: 'tie', moods: tied.map(([k]) => k), value: top[1] };
  }
  return { type: 'single', mood: top[0], value: top[1] };
}

export function getTodayMood() {
  return getMoodByDate(getDateKey(new Date()));
}

export function getMoodDatesInRange(startKey, endKey) {
  const moods = getAllMoods();
  return Object.values(moods).filter((m) => {
    return m.dateKey >= startKey && m.dateKey <= endKey;
  });
}
