import { getItem, setItem } from '@/utils/storageUtils';
import { apiBlobRequest, apiRequest } from '@/services/apiClient';

const PHOTO_CACHE_KEY = 'photos';

function getCachedPhotos() {
  return getItem(PHOTO_CACHE_KEY) || [];
}

function savePhotos(photos) {
  setItem(PHOTO_CACHE_KEY, photos);
}

export async function addPhoto({ name, caption, date, blob, linkedEntryId, fileType }) {
  const formData = new FormData();
  const dateKey = typeof date === 'string' ? date.slice(0, 10) : new Date(date).toISOString().slice(0, 10);
  const originalName = name || 'photo';
  const filename = /\.[a-z0-9]+$/i.test(originalName) ? originalName : `${originalName}.jpg`;
  formData.append('photo', new File([blob], filename, { type: fileType || blob.type || 'image/jpeg' }));
  formData.append('name', name || 'Untitled');
  formData.append('caption', caption || '');
  formData.append('dateKey', dateKey);
  formData.append('linkedEntryId', linkedEntryId || '');

  const result = await apiRequest('/photos', { method: 'POST', body: formData });
  const photos = getCachedPhotos();
  photos.unshift(result.photo);
  savePhotos(photos);
  return result.photo;
}

export async function getAllPhotos() {
  const result = await apiRequest('/photos');
  savePhotos(result.photos);
  return result.photos;
}

export async function getPhotoById(id) {
  return getCachedPhotos().find((photo) => photo.id === id) || null;
}

export async function getPhotosByEntryId(entryId) {
  return getCachedPhotos().filter((photo) => photo.linkedEntryId === entryId);
}

export async function updatePhoto(id, updates) {
  const result = await apiRequest(`/photos/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  savePhotos(getCachedPhotos().map((photo) => photo.id === id ? result.photo : photo));
  return result.photo;
}

export async function deletePhoto(id) {
  await apiRequest(`/photos/${encodeURIComponent(id)}`, { method: 'DELETE' });
  savePhotos(getCachedPhotos().filter((photo) => photo.id !== id));
  return true;
}

export async function getPhotoURL(photo) {
  if (!photo) return null;
  const response = await apiBlobRequest(`/photos/${encodeURIComponent(photo.id)}/file`);
  return URL.createObjectURL(response);
}

export async function clearAllPhotos() {
  await apiRequest('/photos', { method: 'DELETE' });
  savePhotos([]);
  return true;
}

export async function fileToBlob(file) {
  return new Blob([await file.arrayBuffer()], { type: file.type });
}
