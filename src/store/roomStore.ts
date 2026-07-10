import { create } from 'zustand';
import type { Room, Message } from '../types';

interface RoomState {
  currentRoom: Room | null;
  messages: Message[];
  setRoom: (room: Room | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (msg: Message) => void;
  updateReaction: (messageId: string, reactions: Record<string, string>) => void;
  clearRoom: () => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  currentRoom: null,
  messages: [],
  setRoom: (room) => set({ currentRoom: room }),
  setMessages: (messages) => set({ messages }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  updateReaction: (messageId, reactions) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === messageId ? { ...m, reactions } : m
      ),
    })),
  clearRoom: () => set({ currentRoom: null, messages: [] }),
}));
