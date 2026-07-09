import { useEffect, useRef, useCallback } from 'react';
import { Box } from '@mui/material';
import { useTranslation } from '../../utils/i18n';

interface Props {
  platform: string;
  videoUrl: string;
  isPlaying: boolean;
  currentTime: number;
  onTimeUpdate?: (time: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onSeek?: (time: number) => void;
  onReady?: () => void;
}

export default function VideoPlayer({
  platform, videoUrl, isPlaying, currentTime,
  onTimeUpdate, onPlay, onPause, onSeek, onReady,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<any>(null);
  const { t } = useTranslation();

  const getEmbedUrl = useCallback(() => {
    if (!videoUrl) return '';

    switch (platform) {
      case 'youtube': {
        const match = videoUrl.match(/(?:v=|\/)([\w-]{11})/);
        if (match) return `https://www.youtube.com/embed/${match[1]}?enablejsapi=1&autoplay=0&controls=1`;
        return '';
      }
      case 'vk': {
        if (videoUrl.includes('vk.com')) {
          const idMatch = videoUrl.match(/video(-?\d+_\d+)/);
          if (idMatch) return `https://vk.com/video_ext.php?oid=${idMatch[1]}&embed=1`;
        }
        if (videoUrl.includes('video_ext.php')) return videoUrl;
        return videoUrl;
      }
      case 'twitch': {
        const channelMatch = videoUrl.match(/(?:twitch\.tv\/)(\w+)/);
        if (channelMatch) return `https://player.twitch.tv/?channel=${channelMatch[1]}&parent=localhost`;
        const videoMatch = videoUrl.match(/(?:twitch\.tv\/videos\/)(\d+)/);
        if (videoMatch) return `https://player.twitch.tv/?video=${videoMatch[1]}&parent=localhost`;
        return videoUrl;
      }
      case 'web':
        return videoUrl;
      default:
        return videoUrl;
    }
  }, [platform, videoUrl]);

  useEffect(() => {
    if (platform === 'youtube' && window.YT && window.YT.Player) {
      playerRef.current = new window.YT.Player('youtube-player', {
        events: {
          onReady: () => onReady?.(),
          onStateChange: (e: any) => {
            if (e.data === window.YT.PlayerState.PLAYING) onPlay?.();
            if (e.data === window.YT.PlayerState.PAUSED) onPause?.();
          },
        },
      });
    }
  }, [platform, videoUrl]);

  const embedUrl = getEmbedUrl();

  if (!embedUrl) {
    return (
      <Box sx={{
        width: '100%', aspectRatio: '16/9', bgcolor: '#000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 1, color: 'text.secondary', fontSize: 14,
      }}>
        {t('room.video_hint')}
      </Box>
    );
  }

  if (platform === 'web') {
    return (
      <Box sx={{ width: '100%', aspectRatio: '16/9', bgcolor: '#000', borderRadius: 1, overflow: 'hidden' }}>
        <iframe
          ref={iframeRef}
          src={embedUrl}
          style={{ width: '100%', height: '100%', border: 'none' }}
          allow="autoplay; fullscreen"
          allowFullScreen
        />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', aspectRatio: '16/9', bgcolor: '#000', borderRadius: 1, overflow: 'hidden', }}>
      {platform === 'youtube' ? (
        <iframe
          id="youtube-player"
          src={embedUrl}
          style={{ width: '100%', height: '100%', border: 'none' }}
          allow="autoplay; encrypted-media; fullscreen"
          allowFullScreen
        />
      ) : (
        <iframe
          ref={iframeRef}
          src={embedUrl}
          style={{ width: '100%', height: '100%', border: 'none' }}
          allow="autoplay; fullscreen"
          allowFullScreen
        />
      )}
    </Box>
  );
}
