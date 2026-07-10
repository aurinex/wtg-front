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
  onPause?: (time: number) => void;
  onSeek?: (time: number) => void;
  onReady?: () => void;
}

export default function VideoPlayer({
  platform, videoUrl, isPlaying, currentTime,
  onTimeUpdate, onPlay, onPause, onSeek, onReady,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  const onPlayRef = useRef(onPlay);
  const onPauseRef = useRef(onPause);
  const onSeekRef = useRef(onSeek);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const onReadyRef = useRef(onReady);
  const isExternalAdjustment = useRef(0);

  onPlayRef.current = onPlay;
  onPauseRef.current = onPause;
  onSeekRef.current = onSeek;
  onTimeUpdateRef.current = onTimeUpdate;
  onReadyRef.current = onReady;

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
    if (platform !== 'youtube' || !videoUrl) return;

    const container = containerRef.current;
    if (!container) return;

    const tryInitPlayer = () => {
      if (!window.YT || !window.YT.Player) {
        return;
      }

      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }

      const el = document.createElement('div');
      el.id = 'youtube-player';
      container.innerHTML = '';
      container.appendChild(el);

      const ytMatch = videoUrl.match(/(?:v=|\/)([\w-]{11})/);
      const videoId = ytMatch ? ytMatch[1] : '';

      playerRef.current = new window.YT.Player(el.id, {
        videoId,
        playerVars: {
          autoplay: 0,
          controls: 1,
          rel: 0,
          enablejsapi: 1,
          modestbranding: 1,
        },
        events: {
          onReady: () => {
            const iframe = container.querySelector('iframe');
            if (iframe) {
              iframe.style.width = '100%';
              iframe.style.height = '100%';
              iframe.style.position = 'absolute';
              iframe.style.top = '0';
              iframe.style.left = '0';
            }
            onReadyRef.current?.();
          },
          onStateChange: (e: any) => {
            if (isExternalAdjustment.current > 0) {
              isExternalAdjustment.current -= 1;
              return;
            }
            if (e.data === window.YT.PlayerState.PLAYING) {
              onPlayRef.current?.();
            } else if (e.data === window.YT.PlayerState.PAUSED) {
              onPauseRef.current?.(playerRef.current?.getCurrentTime() ?? 0);
            }
          },
        },
      });
    };

    tryInitPlayer();

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [platform, videoUrl]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player || !player.playVideo) return;
    isExternalAdjustment.current += 1;
    if (isPlaying) {
      player.playVideo();
    } else {
      player.pauseVideo();
    }
  }, [isPlaying]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player || !player.seekTo || currentTime <= 0) return;
    isExternalAdjustment.current += 1;
    player.seekTo(currentTime, true);
  }, [currentTime]);

  useEffect(() => {
    if (platform !== 'youtube') return;
    const interval = setInterval(() => {
      const player = playerRef.current;
      if (player && player.getCurrentTime) {
        onTimeUpdateRef.current?.(player.getCurrentTime());
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [platform]);

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

  if (platform === 'youtube') {
    return (
      <Box sx={{ width: '100%', aspectRatio: '16/9', bgcolor: '#000', borderRadius: 1, overflow: 'hidden', position: 'relative' }}>
        <Box ref={containerRef} sx={{ width: '100%', height: '100%', position: 'relative' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', aspectRatio: '16/9', bgcolor: '#000', borderRadius: 1, overflow: 'hidden' }}>
      <iframe
        ref={iframeRef}
        src={embedUrl}
        style={{ width: '100%', height: '100%', border: 'none' }}
        allow="autoplay; encrypted-media; fullscreen"
        allowFullScreen
      />
    </Box>
  );
}
