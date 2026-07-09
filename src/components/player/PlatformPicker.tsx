import { Box, Typography } from '@mui/material';
import { useTranslation } from '../../utils/i18n';

const platforms = [
  {
    id: 'web', name: 'WEB',
    icon: '/icons/web.svg',
    bg: 'linear-gradient(135deg, #1a1a2e77, #16213e77)',
    color: '#fff',
  },
  {
    id: 'youtube', name: 'YouTube',
    icon: '/icons/youtube.svg',
    bg: 'linear-gradient(135deg, #ff000077, #9b000077)',
    color: '#fff',
  },
  {
    id: 'vk', name: 'VK Video',
    icon: '/icons/vk.svg',
    bg: 'linear-gradient(135deg, #0077ff77, #0055cc77)',
    color: '#fff',
  },
  {
    id: 'twitch', name: 'Twitch',
    icon: '/icons/twitch.svg',
    bg: 'linear-gradient(135deg, #9146ff77, #772ce877)',
    color: '#fff',
  },
];

interface Props {
  onSelect: (platform: string) => void;
}

export default function PlatformPicker({ onSelect }: Props) {
  const { t } = useTranslation();

  return (
    <Box sx={{
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2,
      width: '100%', height: '100%',
    }}>
      {platforms.map((p) => (
        <Box
          key={p.id}
          onClick={() => onSelect(p.id)}
          sx={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 1.5, borderRadius: 4, cursor: 'pointer',
            background: p.bg,
            color: p.color,
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'scale(1.03)',
              boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
            },
            '&:active': { transform: 'scale(0.97)' },
            userSelect: 'none',
          }}
        >
            <Box
              component="img"
              src={p.icon}
              alt={p.id}
              sx={{
                width: 48, height: 48,
                objectFit: 'contain',
                filter: p.id === 'web' ? 'brightness(0) invert(1)' : 'none',
              }}
            />
          <Typography variant="caption" fontWeight={700} sx={{ opacity: 0.9, letterSpacing: '0.02em' }}>
            {p.name}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
