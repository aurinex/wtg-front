import { useState, useRef, useEffect } from 'react';
import { Box, TextField, IconButton, Typography, Avatar } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import SettingsIcon from '@mui/icons-material/Settings';
import MessageItem from './MessageItem';
import type { Message } from '../../types';
import { useTranslation } from '../../utils/i18n';

interface Props {
  messages: Message[];
  currentUserId: string;
  onSend: (content: string, replyTo?: string) => void;
  onReact: (messageId: string, reaction: string) => void;
  onSettingsOpen: () => void;
}

export default function ChatBox({ messages, currentUserId, onSend, onReact, onSettingsOpen }: Props) {
  const [input, setInput] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
        sx={{
          flex: 1, overflowY: 'auto', py: 1,
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 2 },
        }}
      >
        {messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 4, color: 'text.disabled' }}>
            <Typography variant="body2">{t('chat.no_messages')}</Typography>
          </Box>
        ) : (
          messages.map((msg) => (
            <MessageItem
              key={msg.id}
              message={msg}
              currentUserId={currentUserId}
              onReply={handleReply}
              onReact={onReact}
            />
          ))
        )}
        <div ref={bottomRef} />
      </Box>

      {replyTo && (
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 0.8,
          bgcolor: 'rgba(124,77,255,0.08)', borderTop: '1px solid', borderColor: 'divider',
        }}>
          <Avatar src={replyTo.avatar_url || undefined} sx={{ width: 20, height: 20 }}>
            {replyTo.username[0]?.toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="caption" fontWeight={600} color="primary.light">
              {t('chat.replying')} {replyTo.username}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
              {replyTo.content}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setReplyTo(null)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      )}

      <Box sx={{
        px: 1.5, py: 2, bgcolor: 'background.default',
        display: 'flex', gap: 1, alignItems: 'center', borderRadius: "24px 24px 0 0",
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
          <SettingsIcon sx={{ fontSize: 20 }} />
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
                  <SendIcon fontSize="small" />
                </IconButton>
              ),
            },
          }}
        />
      </Box>
    </Box>
  );
}
