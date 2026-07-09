import api from './client';

export const createRoom = (data: {
  name?: string;
  platform?: string;
  video_url?: string;
  is_private?: boolean;
}) => api.post('/rooms', data);

export const listRooms = (search?: string) =>
  api.get('/rooms', { params: { search } });

export const getRoom = (code: string) => api.get(`/rooms/${code}`);

export const updateRoom = (code: string, data: any) =>
  api.put(`/rooms/${code}`, data);

export const joinRoom = (code: string) => api.post(`/rooms/${code}/join`);

export const leaveRoom = (code: string) => api.post(`/rooms/${code}/leave`);
