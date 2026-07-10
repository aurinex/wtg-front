import { useEffect, useRef, useCallback } from 'react';
import { useRoomStore } from '../store/roomStore';
import type { Room } from '../types';

const MESSAGE_PAGE_SIZE = 50;

interface UseWebSocketOptions {
  code: string | undefined;
  token: string | null;
  roomReady: boolean;
  setVideoUrl: (url: string) => void;
  setRoom: (room: Room) => void;
  setMessages: (messages: any[]) => void;
  addMessage: (msg: any) => void;
  updateReaction: (messageId: string, reactions: Record<string, string>) => void;
}

export function useWebSocket({
  code, token, roomReady,
  setVideoUrl, setRoom, setMessages, addMessage, updateReaction,
}: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const currentRoomRef = useRef<Room | null>(null);
  const userRef = useRef<{ id: string } | null>(null);
  const codeRef = useRef(code);
  codeRef.current = code;

  const hasMoreRef = useRef(true);
  const loadingMoreRef = useRef(false);

  const currentRoom = useRoomStore((s) => s.currentRoom);
  currentRoomRef.current = currentRoom;

  useEffect(() => {
    if (!code || !token || !roomReady) return;

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = window.location.host;
    const socket = new WebSocket(`${protocol}://${host}/ws/${code}?token=${token}`);

    socket.onopen = () => {
      hasMoreRef.current = true;
      socket.send(JSON.stringify({ type: 'load_messages', offset: 0, limit: MESSAGE_PAGE_SIZE }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const room = currentRoomRef.current;
      const uid = userRef.current?.id;

      switch (data.type) {
        case 'messages': {
          if (data.offset === 0) {
            setMessages(data.messages);
          } else {
            const store = useRoomStore.getState();
            setMessages([...data.messages, ...store.messages]);
          }
          hasMoreRef.current = data.has_more ?? false;
          loadingMoreRef.current = false;
          break;
        }
        case 'message':
          addMessage(data.message);
          break;
        case 'reaction_update':
          updateReaction(data.message_id, data.reactions);
          break;
        case 'sync':
          if (!room || data.user_id === uid) return;
          if (data.action === 'stop_video') {
            setVideoUrl('');
            setRoom({ ...room, video_url: '', is_playing: false, current_time: 0 });
          } else if (data.action === 'change_video') {
            setVideoUrl(data.data?.video_url || room.video_url);
            setRoom({ ...room, video_url: data.data?.video_url || room.video_url, is_playing: false, current_time: 0 });
          } else {
            const state = data.room_state;
            if (!state) return;
            let targetTime = state.current_time;
            if (state.is_playing && state.started_at > 0) {
              const elapsed = Date.now() / 1000 - state.started_at;
              targetTime = Math.max(0, state.current_time + elapsed);
            }
            setRoom({ ...room, is_playing: state.is_playing, current_time: targetTime });
          }
          break;
      }
    };

    wsRef.current = socket;

    return () => {
      socket.close();
      wsRef.current = null;
    };
  }, [code, token, roomReady]);

  const setUserRef = useCallback((u: { id: string } | null) => {
    userRef.current = u;
  }, []);

  const sendSync = useCallback((payload: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'sync', ...payload }));
    }
  }, []);

  const sendMessage = useCallback((content: string, replyTo?: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'message', content, reply_to: replyTo }));
    }
  }, []);

  const sendReaction = useCallback((messageId: string, reaction: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'reaction', message_id: messageId, reaction }));
    }
  }, []);

  const loadMoreMessages = useCallback(() => {
    if (loadingMoreRef.current || !hasMoreRef.current) return;
    loadingMoreRef.current = true;
    const store = useRoomStore.getState();
    const offset = store.messages.length;
    wsRef.current?.send(JSON.stringify({ type: 'load_messages', offset, limit: MESSAGE_PAGE_SIZE }));
  }, []);

  return {
    wsRef,
    sendSync,
    sendMessage,
    sendReaction,
    loadMoreMessages,
    hasMore: hasMoreRef,
    setUserRef,
  };
}
