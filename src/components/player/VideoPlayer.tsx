import { useEffect, useRef } from 'react';
import { Box, Button, Typography } from '@mui/material';
import Icon from '../common/Icon';
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

function parseVkVideoId(url: string): { oid: string; id: string } | null {
  const classic = url.match(/vk\.(?:com|ru)\/video(-?\d+)_(\d+)/);
  if (classic) return { oid: classic[1], id: classic[2] };
  const newDom = url.match(/vkvideo\.ru\/video(-?\d+)_(\d+)/);
  if (newDom) return { oid: newDom[1], id: newDom[2] };
  return null;
}

function getPlatformUrl(platform: string, videoUrl: string): string | null {
  if (!videoUrl) return null;

  switch (platform) {
    case 'youtube': {
      const m = videoUrl.match(/(?:v=|\/)([\w-]{11})/);
      return m ? `https://www.youtube.com/embed/${m[1]}?enablejsapi=1&autoplay=0&controls=1` : null;
    }
    case 'vk': {
      const vk = parseVkVideoId(videoUrl);
      if (vk) return `https://vk.com/video_ext.php?oid=${vk.oid}&id=${vk.id}&embed=1`;
      return videoUrl;
    }
    case 'twitch': {
      const ch = videoUrl.match(/(?:twitch\.tv\/)(\w+)/);
      if (ch) return `https://player.twitch.tv/?channel=${ch[1]}&parent=localhost`;
      const v = videoUrl.match(/(?:twitch\.tv\/videos\/)(\d+)/);
      if (v) return `https://player.twitch.tv/?video=${v[1]}&parent=localhost`;
      return videoUrl;
    }
    case 'web':
      return videoUrl;
    default:
      return videoUrl;
  }
}

function ExtractPlaceholder({ platform, videoUrl }: { platform: string; videoUrl: string }) {
  return (
    <Box sx={{
      width: '100%', aspectRatio: '16/9', bgcolor: '#0a0a14', borderRadius: 1,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
      border: '1px solid', borderColor: 'divider',
    }}>
      <Typography variant="body2" color="text.secondary" textAlign="center">
        Встраивание {platform} заблокировано
      </Typography>
      <Button
        variant="contained" size="small"
        startIcon={<Icon name="open_in_new" size={16} />}
        onClick={() => window.open(videoUrl, '_blank')}
        sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600 }}
      >
        Открыть в {platform}
      </Button>
    </Box>
  );
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

  useEffect(() => {
    if (platform !== 'youtube' || !videoUrl) return;

    const container = containerRef.current;
    if (!container) return;

    const tryInitPlayer = () => {
      if (!window.YT || !window.YT.Player) return;

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
          autoplay: 0, controls: 1, rel: 0, enablejsapi: 1, modestbranding: 1,
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
    if (isPlaying) { player.playVideo(); } else { player.pauseVideo(); }
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
      const p = playerRef.current;
      if (p && p.getCurrentTime) onTimeUpdateRef.current?.(p.getCurrentTime());
    }, 1000);
    return () => clearInterval(interval);
  }, [platform]);

  if (!videoUrl) {
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
      <Box sx={{ width: '100%', aspectRatio: '16/9', bgcolor: '#0a0a14', borderRadius: 1, overflow: 'hidden', position: 'relative' }}>
        <Box ref={containerRef} sx={{ width: '100%', height: '100%', position: 'relative' }} />
      </Box>
    );
  }

  const embedUrl = getPlatformUrl(platform, videoUrl);

  if (!embedUrl) {
    return <ExtractPlaceholder platform={platform} videoUrl={videoUrl} />;
  }

  return (
    <Box sx={{ width: '100%', aspectRatio: '16/9', bgcolor: '#0a0a14', borderRadius: 1, overflow: 'hidden' }}>
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
