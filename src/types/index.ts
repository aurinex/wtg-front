export interface User {
  id: string;
  username: string;
  email: string;
  display_name: string;
  avatar_url: string;
  is_email_verified: boolean;
  created_at: string;
}

export interface Room {
  id: string;
  code: string;
  name: string;
  creator_id: string;
  platform: string;
  video_url: string;
  video_title: string;
  video_duration: number;
  video_thumbnail: string;
  is_private: boolean;
  is_playing: boolean;
  current_time: number;
  created_at: string;
  participants: string[];
}

export interface Message {
  id: string;
  room_id: string;
  user_id: string;
  username: string;
  avatar_url: string;
  content: string;
  reply_to: string | null;
  reactions: Record<string, string>;
  created_at: string;
}

export interface FriendRequestItem {
  id: string;
  from_user_id: string;
  from_username: string;
  from_avatar: string;
  to_user_id: string;
  status: string;
  created_at: string;
}

export interface Friend {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  added_at: string;
}

export interface WSMessage {
  type: string;
  [key: string]: unknown;
}

export interface SyncData {
  is_playing: boolean;
  current_time: number;
}
