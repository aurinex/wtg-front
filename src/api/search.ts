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

export interface VideoInfo {
  title: string;
  duration: number;
  thumbnail: string;
  channel: string;
  embed_url: string;
  webpage_url: string;
}

function cleanYouTubeUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/watch?v=${v}`;
    }
  } catch {}
  return url;
}

export const resolveVideo = (url: string) =>
  api.get<VideoInfo>('/search/resolve', { params: { url: cleanYouTubeUrl(url) } });
