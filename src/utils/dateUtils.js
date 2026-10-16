import { format, parseISO, differenceInDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, subDays, isSameDay, isValid } from 'date-fns';

export function formatDate(date, fmt = 'MMM d, yyyy') {
  const d = typeof date === 'string' ? parseISO(date) : new Date(date);
  return isValid(d) ? format(d, fmt) : '';
}

export function formatTime(date) {
  const d = typeof date === 'string' ? parseISO(date) : new Date(date);
  return isValid(d) ? format(d, 'h:mm a') : '';
}

export function formatDateTime(date) {
  return `${formatDate(date)} · ${formatTime(date)}`;
}

export function getTodayKey() {
  return format(new Date(), 'yyyy-MM-dd');
}

export function getDateKey(date) {
  if (typeof date === 'string') return date.slice(0, 10);
  return format(date, 'yyyy-MM-dd');
}

export function getGreeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Good night';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}

export function getWeekDays(date = new Date()) {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
}

export function getMonthDays(date) {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  return eachDayOfInterval({ start, end });
}

export function getCalendarGrid(date) {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  return eachDayOfInterval({ start: gridStart, end: gridEnd });
}

export function getDaysAgo(n) {
  return subDays(new Date(), n);
}

export function getDateRange(period) {
  switch (period) {
    case '7d':  return { start: subDays(new Date(), 6),  end: new Date() };
    case '30d': return { start: subDays(new Date(), 29), end: new Date() };
    case '90d': return { start: subDays(new Date(), 89), end: new Date() };
    case 'all': return { start: new Date(0), end: new Date() };
    default:    return { start: subDays(new Date(), 6),  end: new Date() };
  }
}

export function daysBetween(a, b) {
  return Math.abs(differenceInDays(a, b));
}

export function isToday(date) {
  return isSameDay(typeof date === 'string' ? parseISO(date) : new Date(date), new Date());
}

export function relativeDate(date) {
  const d = typeof date === 'string' ? parseISO(date) : new Date(date);
  if (!isValid(d)) return '';
  const diff = differenceInDays(new Date(), d);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  if (diff < 30) return `${Math.floor(diff / 7)} week${Math.floor(diff / 7) > 1 ? 's' : ''} ago`;
  return format(d, 'MMM d, yyyy');
}

export function getMonthLabel(date) {
  return format(date, 'MMMM yyyy');
}

export function getMonthGroupKey(date) {
  const d = typeof date === 'string' ? parseISO(date) : new Date(date);
  return format(d, 'yyyy-MM');
}

export function getMonthGroupLabel(date) {
  const d = typeof date === 'string' ? parseISO(date) : new Date(date);
  return format(d, 'MMMM yyyy');
}

export function generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function wordCount(text) {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}
