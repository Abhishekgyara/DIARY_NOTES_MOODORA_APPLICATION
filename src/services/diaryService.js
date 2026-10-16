import { getItem, setItem } from '@/utils/storageUtils';
import { getDateKey } from '@/utils/dateUtils';
import { apiRequest, jsonBody } from '@/services/apiClient';

const ENTRIES_KEY = 'diary_entries';
const DRAFT_KEY = 'diary_draft';
let draftMutation = Promise.resolve();

function queueDraftMutation(operation) {
  const result = draftMutation.then(operation);
  draftMutation = result.catch(() => {});
  return result;
}

function getAllEntries() {
  return getItem(ENTRIES_KEY) || [];
}

function saveAllEntries(entries) {
  setItem(ENTRIES_KEY, entries);
}

export function getEntries() {
  return getAllEntries().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function getEntryById(id) {
  return getAllEntries().find((e) => e.id === id) || null;
}

export function getEntriesByDate(dateKey) {
  return getAllEntries()
    .filter((e) => e.dateKey === dateKey)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function getRecentEntries(limit = 5) {
  return getEntries().slice(0, limit);
}

export async function createEntry({ title, content, date, mood, photoIds, favorite }) {
  const entries = getAllEntries();
  const result = await apiRequest('/entries', {
    method: 'POST',
    body: jsonBody({
      title: title.trim(),
      content: content.trim(),
      dateKey: typeof date === 'string' ? date.slice(0, 10) : getDateKey(date),
      mood: mood || null,
      photoIds: photoIds || [],
      favorite: !!favorite,
    }),
  });
  const entry = result.entry;
  entries.push(entry);
  saveAllEntries(entries);
  return entry;
}

export async function updateEntry(id, updates) {
  const entries = getAllEntries();
  const idx = entries.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  const result = await apiRequest(`/entries/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: jsonBody({
      ...updates,
      dateKey: updates.date || updates.dateKey || entries[idx].dateKey,
    }),
  });
  const updated = result.entry;
  entries[idx] = updated;
  saveAllEntries(entries);
  return updated;
}

export async function deleteEntry(id) {
  await apiRequest(`/entries/${encodeURIComponent(id)}`, { method: 'DELETE' });
  const entries = getAllEntries().filter((e) => e.id !== id);
  saveAllEntries(entries);
  return true;
}

export async function toggleFavorite(id) {
  const entries = getAllEntries();
  const idx = entries.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  const result = await apiRequest(`/entries/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: jsonBody({ favorite: !entries[idx].favorite }),
  });
  entries[idx] = result.entry;
  saveAllEntries(entries);
  return entries[idx];
}

export function getFavoriteEntries() {
  return getEntries().filter((e) => e.favorite);
}

export function getEntryDates() {
  const entries = getAllEntries();
  const dateMap = {};
  entries.forEach((e) => {
    dateMap[e.dateKey] = (dateMap[e.dateKey] || 0) + 1;
  });
  return dateMap;
}

export async function saveDraft(draft) {
  return queueDraftMutation(async () => {
    const result = await apiRequest('/draft', { method: 'PUT', body: jsonBody(draft) });
    setItem(DRAFT_KEY, result.draft);
    return result.draft;
  });
}

export function getDraft() {
  return getItem(DRAFT_KEY);
}

export async function clearDraft() {
  return queueDraftMutation(async () => {
    await apiRequest('/draft', { method: 'DELETE' });
    setItem(DRAFT_KEY, null);
  });
}
