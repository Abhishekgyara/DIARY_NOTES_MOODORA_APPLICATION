import { getItem, setItem } from '@/utils/storageUtils';
import { apiRequest, jsonBody } from '@/services/apiClient';

const REMINDER_KEY = 'reminder_settings';

export function getReminderSettings() {
  return (
    getItem(REMINDER_KEY) || {
      enabled: false,
      time: '20:00',
      frequency: 'daily',
    }
  );
}

export async function saveReminderSettings(settings) {
  const result = await apiRequest('/settings/reminder', {
    method: 'PUT',
    body: jsonBody(settings),
  });
  setItem(REMINDER_KEY, result.reminder);
  return result.reminder;
}
