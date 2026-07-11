import { useEffect, useRef, useState, useCallback } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { resolveVideo, type VideoInfo } from '../../api/search';
import CustomVideoControls from './CustomVideoControls';

interface Props {
  videoUrl: string;
  isPlaying: boolean;
  currentTime: number;
  onPlay: () => void;
  onPause: (time: number) => void;
  onSeek: (time: number) => void;
  onTimeUpdate: (time: number) => void;
  onReady: (duration: number) => void;
}

export default function CustomVideoPlayer({
  videoUrl, isPlaying, currentTime,
  onPlay, onPause, onSeek, onTimeUpdate, onReady,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [directUrl, setDirectUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [meta, setMeta] = useState<VideoInfo | null>(null);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [localPlaying, setLocalPlaying] = useState(false);

  useEffect(() => {
    if (!videoUrl) return;
    setLoading(true);
    setError('');
    setDirectUrl('');
    setMeta(null);
    setDuration(0);
    setBuffered(0);
    setLocalPlaying(false);

    resolveVideo(videoUrl)
      .then((res) => {
        const url = res.data.embed_url;
        if (!url || url === videoUrl) {
          setError('Could not resolve video URL');
          return;
        }
        setMeta(res.data);
        setDirectUrl(url);
        if (res.data.duration > 0) {
          setDuration(res.data.duration);
          onReady(res.data.duration);
        }
      })
      .catch((err) => {
        setError(err?.response?.data?.detail || 'Failed to resolve video');
      })
      .finally(() => setLoading(false));
  }, [videoUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying && video.paused) {
      video.play().catch(() => {});
    } else if (!isPlaying && !video.paused) {
      video.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || currentTime <= 0 || Math.abs(video.currentTime - currentTime) < 1) return;
    video.currentTime = currentTime;
  }, [currentTime]);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setLocalPlaying(!video.paused);
    onTimeUpdate(video.currentTime);
  }, [onTimeUpdate]);

  const handlePlay = useCallback(() => {
    const video = videoRef.current;
    if (video && video.paused) {
      video.play().catch(() => {});
    }
    setLocalPlaying(true);
    onPlay();
  }, [onPlay]);

  const handlePause = useCallback(() => {
    const video = videoRef.current;
    if (video && !video.paused) {
      video.pause();
    }
    setLocalPlaying(false);
    onPause(videoRef.current?.currentTime ?? 0);
  }, [onPause]);

  const handleSeek = useCallback((time: number) => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = time;
    }
    onSeek(time);
  }, [onSeek]);

  const handleLoadedMeta = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const d = video.duration;
    if (isFinite(d) && d > 0 && duration === 0) {
      setDuration(d);
      onReady(d);
    }
  }, [onReady, duration]);

  if (loading) {
    return (
      <Box sx={{
        width: '100%', aspectRatio: '16/9', bgcolor: '#0a0a14', borderRadius: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 1,
      }}>
        <CircularProgress size={32} />
        <Typography variant="caption" color="text.secondary">Resolving video...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{
        width: '100%', aspectRatio: '16/9', bgcolor: '#0a0a14', borderRadius: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box
      ref={containerRef}
      sx={{
        width: '100%', aspectRatio: '16/9', bgcolor: '#000', borderRadius: 1,
        overflow: 'hidden', position: 'relative', maxHeight: '70dvh',
      }}
    >
      <video
        ref={videoRef}
        src={directUrl}
        preload="metadata"
        playsInline
        style={{ width: '100%', height: '100%', display: 'block' }}
        onTimeUpdate={handleTimeUpdate}
        onPlay={handlePlay}
        onPause={handlePause}
        onLoadedMetadata={handleLoadedMeta}
        onProgress={() => {
          const v = videoRef.current;
          if (v && v.buffered.length > 0) {
            setBuffered(v.buffered.end(v.buffered.length - 1));
          }
        }}
        onEnded={() => setLocalPlaying(false)}
        onError={() => setError('Video failed to load')}
      />

      {!localPlaying && !isPlaying && directUrl && (
        <Box
          onClick={handlePlay}
          sx={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', zIndex: 1,
          }}
        >
          <Box sx={{
            width: 60, height: 60, borderRadius: '50%',
            bgcolor: 'rgba(124,77,255,0.9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 0.15s',
            '&:hover': { transform: 'scale(1.1)' },
          }}>
            <Box sx={{ width: 0, height: 0, borderStyle: 'solid', borderWidth: '12px 0 12px 20px', borderColor: 'transparent transparent transparent white', ml: "6px" }} />
          </Box>
        </Box>
      )}

      <CustomVideoControls
        playing={localPlaying || isPlaying}
        currentTime={currentTime}
        duration={duration}
        buffered={buffered}
        title={meta?.title}
        channel={meta?.channel}
        onPlay={handlePlay}
        onPause={handlePause}
        onSeek={handleSeek}
        containerRef={containerRef}
        videoRef={videoRef}
      />
    </Box>
  );
}
