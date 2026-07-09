import api from './client';

export const sendFriendRequest = (to_user_id: string) =>
  api.post('/friends/request', { to_user_id });

export const getIncomingRequests = () => api.get('/friends/requests/incoming');

export const getOutgoingRequests = () => api.get('/friends/requests/outgoing');

export const acceptRequest = (requestId: string) =>
  api.post(`/friends/request/${requestId}/accept`);

export const rejectRequest = (requestId: string) =>
  api.post(`/friends/request/${requestId}/reject`);

export const getFriends = () => api.get('/friends');

export const removeFriend = (friendId: string) =>
  api.delete(`/friends/${friendId}`);
