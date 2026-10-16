import { getEntries } from './diaryService';
import { getDailyMoods, getMajorityMood } from './moodService';
import { getDateKey } from '@/utils/dateUtils';
import { format, subDays, parseISO, differenceInCalendarDays } from 'date-fns';
import { MOOD_LIST, getMoodColor } from '@/config/moods';

export function getAnalytics(period) {
  const entries = getEntries();
  const allMoods = getDailyMoods();

  let startDate;
  const endDate = new Date();

  switch (period) {
    case '7d':  startDate = subDays(new Date(), 6);  break;
    case '30d': startDate = subDays(new Date(), 29); break;
    case '90d': startDate = subDays(new Date(), 89); break;
    case 'all': startDate = new Date(0);             break;
    default:    startDate = subDays(new Date(), 6);
  }

  const startKey = format(startDate, 'yyyy-MM-dd');
  const endKey = format(endDate, 'yyyy-MM-dd');

  const periodEntries = entries.filter((e) => e.dateKey >= startKey && e.dateKey <= endKey);
  const periodMoods = Object.values(allMoods).filter(
    (m) => m.dateKey >= startKey && m.dateKey <= endKey
  );

  const totalNotes = periodEntries.length;
  const journalingDays = new Set(periodEntries.map((e) => e.dateKey)).size;
  const recordedMoodDays = periodMoods.length;

  const moodCount = {};
  periodMoods.forEach((m) => {
    Object.entries(m.percentages).forEach(([k, v]) => {
      moodCount[k] = (moodCount[k] || 0) + 1;
    });
  });
  const mostFrequentMood =
    Object.entries(moodCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  const streak = calculateStreak(entries);

  const moodDistribution = MOOD_LIST.map((m) => {
    const total = periodMoods.reduce((sum, dm) => sum + (dm.percentages[m.id] || 0), 0);
    return { name: m.label, value: total, mood: m.id, color: m.color };
  }).filter((m) => m.value > 0);

  const moodTrend = buildMoodTrend(periodMoods, startDate, endDate);
  const moodComposition = buildMoodComposition(periodMoods, startDate, endDate);
  const writingActivity = buildWritingActivity(periodEntries, startDate, endDate);
  const heatmap = buildHeatmap(allMoods, startDate, endDate);

  return {
    totalNotes,
    journalingDays,
    recordedMoodDays,
    mostFrequentMood,
    streak,
    moodDistribution,
    moodTrend,
    moodComposition,
    writingActivity,
    heatmap,
    period,
  };
}

function calculateStreak(entries) {
  if (!entries.length) return 0;
  const dates = [...new Set(entries.map((e) => e.dateKey))].sort((a, b) => b.localeCompare(a));
  const today = format(new Date(), 'yyyy-MM-dd');
  let streak = 0;
  let checkDate = today;

  const firstDate = dates[0];
  if (firstDate !== today) {
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    if (firstDate !== yesterday) return 0;
    checkDate = yesterday;
  }

  for (const date of dates) {
    if (date === checkDate) {
      streak++;
      checkDate = format(subDays(parseISO(checkDate), 1), 'yyyy-MM-dd');
    } else if (date < checkDate) {
      break;
    }
  }
  return streak;
}

function buildMoodTrend(moods, start, end) {
  const days = [];
  let cursor = new Date(start);
  while (cursor <= end) {
    const key = format(cursor, 'yyyy-MM-dd');
    const dm = moods.find((m) => m.dateKey === key);
    const entry = { date: format(cursor, 'MMM d') };
    MOOD_LIST.forEach((m) => {
      entry[m.label] = dm?.percentages[m.id] || 0;
    });
    days.push(entry);
    cursor = new Date(cursor.getTime() + 86400000);
  }
  return days;
}

function buildMoodComposition(moods, start, end) {
  const days = [];
  let cursor = new Date(start);
  while (cursor <= end) {
    const key = format(cursor, 'yyyy-MM-dd');
    const dm = moods.find((m) => m.dateKey === key);
    const entry = { date: format(cursor, 'MMM d') };
    MOOD_LIST.forEach((m) => {
      entry[m.label] = dm?.percentages[m.id] || 0;
    });
    days.push(entry);
    cursor = new Date(cursor.getTime() + 86400000);
  }
  return days;
}

function buildWritingActivity(entries, start, end) {
  const dayMap = {};
  entries.forEach((e) => {
    dayMap[e.dateKey] = (dayMap[e.dateKey] || 0) + 1;
  });
  const days = [];
  let cursor = new Date(start);
  while (cursor <= end) {
    const key = format(cursor, 'yyyy-MM-dd');
    days.push({ date: format(cursor, 'MMM d'), notes: dayMap[key] || 0 });
    cursor = new Date(cursor.getTime() + 86400000);
  }
  return days;
}

function buildHeatmap(allMoods, start, end) {
  const moodValues = Object.values(allMoods)
    .filter((m) => m.dateKey >= format(start, 'yyyy-MM-dd') && m.dateKey <= format(end, 'yyyy-MM-dd'))
    .map((m) => {
      const majority = getMajorityMood(m.percentages);
      const moodId = majority?.type === 'single' ? majority.mood : majority?.type === 'tie' ? majority.moods[0] : null;
      return { date: m.dateKey, moodId, color: moodId ? getMoodColor(moodId) : null };
    });
  return moodValues;
}
