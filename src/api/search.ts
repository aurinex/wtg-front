import api from './client';

export interface SearchResult {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  channel: string;
  url: string;
}

export const searchVideos = (q: string, platform: string = 'youtube') =>
  api.get<SearchResult[]>('/search', { params: { q, platform } });
