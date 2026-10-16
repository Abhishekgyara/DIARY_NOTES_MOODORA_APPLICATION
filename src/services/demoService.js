import { apiRequest } from '@/services/apiClient';
import { clearAccountCache } from '@/services/dataCache';

export async function clearDemoData() {
  await apiRequest('/data', { method: 'DELETE' });
  clearAccountCache();
}

export function isDemoSeeded() {
  return false;
}
