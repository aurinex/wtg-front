import { useState, useRef } from 'react';
import { Box, Typography, Avatar, Popover } from '@mui/material';
import type { Message } from '../../types';

const emojis = [
  { key: 'heart', src: '/emoji/heart.png' },
  { key: 'like', src: '/emoji/thumbsup.png' },
  { key: 'dislike', src: '/emoji/thumbsdown.png' },
  { key: 'poop', src: '/emoji/poop.png' },
];

interface Props {
  message: Message;
  currentUserId: string;
  onReply: (msg: Message) => void;
  onReact: (messageId: string, reaction: string) => void;
}

export default function MessageItem({ message, currentUserId, onReply, onReact }: Props) {
  const [swiped, setSwiped] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const touchStart = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = touchStart.current - e.changedTouches[0].clientX;
    if (dx > 60) {
      setSwiped(true);
      onReply(message);
      setTimeout(() => setSwiped(false), 500);
    }
  };

  const reactionCounts: Record<string, number> = {};
  const userReaction = message.reactions[currentUserId] || '';

  Object.values(message.reactions).forEach((r) => {
    reactionCounts[r] = (reactionCounts[r] || 0) + 1;
  });

  const activeReactions = emojis.filter((e) => reactionCounts[e.key] > 0);

  const handleReact = (key: string) => {
    onReact(message.id, userReaction === key ? '' : key);
    setAnchorEl(null);
  };

  return (
    <Box
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      sx={{
        display: 'flex', gap: 1.5, px: 2, py: 1,
        transform: swiped ? 'translateX(-60px)' : 'none',
        transition: 'transform 0.2s',
        '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' },
      }}
    >
      <Avatar src={message.avatar_url || undefined} sx={{ width: 32, height: 32, mt: 0.3 }}>
        {message.username[0]?.toUpperCase()}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" fontWeight={600} color="primary.light">
            {message.username}
          </Typography>
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10 }}>
            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Typography>
        </Box>
        {message.reply_to && (
          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', fontStyle: 'italic' }}>
            Replying to a message
          </Typography>
        )}
        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
          {message.content}
        </Typography>

        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
          {activeReactions.map((e) => (
            <Box
              key={e.key}
              onClick={() => onReact(message.id, userReaction === e.key ? '' : e.key)}
              sx={{
                display: 'flex', alignItems: 'center', gap: 0.5,
                px: 0.75, py: 0.5, borderRadius: 1,
                bgcolor: userReaction === e.key ? 'rgba(124,77,255,0.25)' : 'rgba(255,255,255,0.06)',
                cursor: 'pointer', fontSize: 12,
                '&:hover': { bgcolor: userReaction === e.key ? 'rgba(124,77,255,0.35)' : 'rgba(255,255,255,0.1)' },
              }}
            >
              <Box component="img" src={e.src} sx={{ width: 16, height: 16 }} />
              <Typography variant="caption" sx={{ fontSize: 10, lineHeight: 1 }}>
                {reactionCounts[e.key]}
              </Typography>
            </Box>
          ))}

          <Box
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 20, height: 20, borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.08)', cursor: 'pointer', fontSize: 14,
              lineHeight: 1, color: 'text.secondary',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' },
            }}
          >
            +
          </Box>
        </Box>
      </Box>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{ paper: { sx: { borderRadius: 3, bgcolor: '#1a1a2e', p: 0.5 } } }}
      >
        <Box sx={{ display: 'flex', gap: 0.5, px: 1, pt: 0.5 }}>
          {emojis.map((e) => (
            <Box
              key={e.key}
              onClick={() => handleReact(e.key)}
              sx={{
                cursor: 'pointer', p: 0.3, borderRadius: 1,
                transition: 'transform 0.15s',
                '&:hover': { transform: 'scale(1.3)', bgcolor: 'rgba(255,255,255,0)' },
              }}
            >
              <Box component="img" src={e.src} sx={{ width: 28, height: 28 }} />
            </Box>
          ))}
        </Box>
      </Popover>
    </Box>
  );
}
