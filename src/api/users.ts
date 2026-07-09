import api from './client';

export const getMe = () => api.get('/users/me');

export const updateMe = (data: any) => api.put('/users/me', data);

export const uploadAvatar = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/users/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const searchUsers = (q: string) =>
  api.get('/users/search', { params: { q } });
