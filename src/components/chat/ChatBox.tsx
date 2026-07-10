import { useState, useRef, useEffect } from 'react';
import { Box, TextField, IconButton, Typography, Avatar, CircularProgress } from '@mui/material';
import MessageItem from './MessageItem';
import type { Message } from '../../types';
import { useTranslation } from '../../utils/i18n';
import Icon from '../common/Icon';

interface Props {
  messages: Message[];
  currentUserId: string;
  onSend: (content: string, replyTo?: string) => void;
  onReact: (messageId: string, reaction: string) => void;
  onSettingsOpen: () => void;
  onLoadMore?: () => void;
}

export default function ChatBox({ messages, currentUserId, onSend, onReact, onSettingsOpen, onLoadMore }: Props) {
  const [input, setInput] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(messages.length);
  const { t } = useTranslation();

  useEffect(() => {
    const container = containerRef.current;
    const prevLen = prevLengthRef.current;
    prevLengthRef.current = messages.length;

    if (messages.length > prevLen && prevLen > 0) {
      container?.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container || !onLoadMore) return;
    if (container.scrollTop < 50) {
      onLoadMore();
    }
  };

  const handleSend = () => {
    if (input.trim()) {
      onSend(input.trim(), replyTo?.id);
      setInput('');
      setReplyTo(null);
    }
  };

  const handleReply = (msg: Message) => {
    setReplyTo(msg);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.paper' }}>
      <Box
        ref={containerRef}
        onScroll={handleScroll}
        sx={{
          flex: 1, overflowY: 'auto', py: 1, display: 'flex', flexDirection: 'column',
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 2 },
        }}
      >
        <div ref={topRef} />
        {messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 4, color: 'text.disabled' }}>
            <Typography variant="body2">{t('chat.no_messages')}</Typography>
          </Box>
        ) : (
          messages.map((msg) => {
            const repliedMessage = msg.reply_to
              ? messages.find((m) => m.id === msg.reply_to)
              : null;
            return (
              <MessageItem
                key={msg.id}
                message={msg}
                repliedMessage={repliedMessage}
                currentUserId={currentUserId}
                onReply={handleReply}
                onReact={onReact}
              />
            );
          })
        )}
        <div ref={bottomRef} />
      </Box>

      {replyTo && (
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 0.8,
          bgcolor: 'rgba(124,77,255,0.08)', borderTop: '1px solid', borderColor: 'divider',
        }}>
          <Avatar src={replyTo.avatar_url || undefined} sx={{ width: 24, height: 24 }}>
            {replyTo.username[0]?.toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="caption" fontWeight={600} color="primary.light" sx={{fontSize: 12}}>
              {t('chat.replying')} {replyTo.username}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', mt: -0.5 }}>
              {replyTo.content}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setReplyTo(null)}>
            <Icon name="close" size={12} sx={{ opacity: 0.5 }} />
          </IconButton>
        </Box>
      )}

      <Box sx={{
        px: 1.5, py: 2, bgcolor: 'background.default',
        display: 'flex', gap: 1, alignItems: 'center', borderRadius: replyTo ? "0" : "24px 24px 0 0",
        transition: 'all 0.2s ease',
      }}>
        <IconButton
          onClick={onSettingsOpen}
          size="small"
          sx={{
            width: 40, height: 40, borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.06)',
            flexShrink: 0,
            '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' },
          }}
        >
          <Icon name="settings" size={18} sx={{ opacity: 0.7 }} />
        </IconButton>
        <TextField
          fullWidth size="small" placeholder={t('chat.placeholder')}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
          multiline maxRows={3}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '24px',
              bgcolor: 'rgba(255,255,255,0.04)',
            },
          }}
          slotProps={{
            input: {
              endAdornment: (
                <IconButton size="small" onClick={handleSend} disabled={!input.trim()} sx={{ mr: -0.5 }}>
                  <Icon name="message" size={20} sx={{ opacity: 0.8 }} />
                </IconButton>
              ),
            },
          }}
        />
      </Box>
    </Box>
  );
}
