import { useRef, useState, useCallback, useEffect } from 'react';
import { Box, Typography, Slider, IconButton } from '@mui/material';
import Icon from '../common/Icon';

function fmt(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface Props {
  playing: boolean;
  currentTime: number;
  duration: number;
  buffered: number;
  title?: string;
  channel?: string;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

export default function CustomVideoControls({
  playing, currentTime, duration, buffered, title, channel,
  onPlay, onPause, onSeek, containerRef, videoRef,
}: Props) {
  const [dragging, setDragging] = useState(false);
  const [dragValue, setDragValue] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [subtitlesOn, setSubtitlesOn] = useState(false);
  const [hasTracks, setHasTracks] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();
  const [visible, setVisible] = useState(true);

  const show = useCallback(() => {
    setVisible(true);
    clearTimeout(hideTimer.current);
    if (playing) {
      hideTimer.current = setTimeout(() => setVisible(false), 3000);
    }
  }, [playing]);

  const handleSeek = (_: any, value: number | number[]) => {
    setDragValue(value as number);
    setDragging(true);
  };

  const handleSeekEnd = (_: any, value: number | number[]) => {
    setDragging(false);
    onSeek(value as number);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setFullscreen(false));
    }
  };

  const handleVolumeChange = (_: any, value: number | number[]) => {
    const v = value as number;
    setVolume(v);
    const video = videoRef.current;
    if (video) {
      video.volume = v;
      video.muted = v === 0;
      setMuted(v === 0);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    if (muted || volume === 0) {
      video.muted = false;
      video.volume = 0.5;
      setMuted(false);
      setVolume(0.5);
    } else {
      video.muted = true;
      setMuted(true);
    }
  };

  const toggleSubtitles = () => {
    const video = videoRef.current;
    if (!video) return;
    const tracks = video.textTracks;
    for (let i = 0; i < tracks.length; i++) {
      tracks[i].mode = subtitlesOn ? 'hidden' : 'showing';
    }
    setSubtitlesOn(!subtitlesOn);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      if (video.textTracks.length > 0) setHasTracks(true);
      const onChange = () => setHasTracks(video.textTracks.length > 0);
      video.textTracks.addEventListener('addtrack', onChange);
      return () => video.textTracks.removeEventListener('addtrack', onChange);
    }
  }, [videoRef]);

  const progress = duration > 0 ? ((dragging ? dragValue : currentTime) / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? (buffered / duration) * 100 : 0;

  const volIconName = muted || volume === 0 ? 'volume_down' : volume < 0.5 ? 'volume_off' : 'volume_up';

  return (
    <>
      {(title || channel) && (
        <Box sx={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1,
          background: 'linear-gradient(rgba(0,0,0,0.7), transparent)',
          px: { xs: 1.5, sm: 2 }, py: { xs: 1, sm: 1.5 },
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.3s',
          pointerEvents: 'none',
          display: 'flex', gap: 1, alignItems: 'center',
        }}>
          {title && (
            <Typography variant="caption" sx={{ color: 'white', fontSize: { xs: 11, sm: 12 }, fontWeight: 600, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {title}
            </Typography>
          )}
          {channel && (
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: { xs: 10, sm: 11 }, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {channel}
            </Typography>
          )}
        </Box>
      )}
      <Box
      onMouseMove={show}
      onTouchStart={show}
      sx={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
        pt: 4, px: { xs: 1, sm: 2 }, pb: { xs: 1.5, sm: 1.5 },
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s',
        cursor: 'default',
      }}
    >
      <Box sx={{ mx: -0.5 }}>
        <Slider
          value={dragging ? dragValue : currentTime}
          min={0}
          max={Math.max(duration, 1)}
          step={0.1}
          onChange={handleSeek}
          onChangeCommitted={handleSeekEnd}
          sx={{
            color: '#7c4dff', px: 0.5,
            '& .MuiSlider-rail': {
              height: 4, borderRadius: 2, opacity: 1,
              background: `linear-gradient(to right, rgba(255,255,255,0.25) ${bufferedPct}%, rgba(255,255,255,0.12) ${bufferedPct}%)`,
            },
            '& .MuiSlider-track': {
              height: 4, borderRadius: 2, border: 'none',
            },
            '& .MuiSlider-thumb': {
              width: 14, height: 14,
              '&:hover, &.Mui-active': { boxShadow: '0 0 0 4px rgba(124,77,255,0.4)' },
            },
          }}
        />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.25, sm: 0.5 } }}>
        <IconButton
          size="small"
          onClick={() => (playing ? onPause() : onPlay())}
          sx={{ color: 'white', p: { xs: 0.75, sm: 0.5 } }}
        >
          {playing ? <Icon name="pause" size={14} /> : <Icon name="play_arrow" size={14} />}
        </IconButton>

        <Typography variant="caption" sx={{ color: 'white', fontSize: { xs: 10, sm: 11 }, minWidth: 36, fontFamily: 'monospace' }}>
          {fmt(dragging ? dragValue : currentTime)}
        </Typography>

        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: { xs: 10, sm: 11 }, fontFamily: 'monospace' }}>
          / {fmt(duration)}
        </Typography>

        <Box sx={{ flex: 1 }} />

        <IconButton size="small" onClick={toggleMute} sx={{ color: 'white', p: { xs: 0.75, sm: 0.5 } }}>
          <Icon name={volIconName} size={18} />
        </IconButton>

        <Slider
          value={muted ? 0 : volume}
          min={0}
          max={1}
          step={0.01}
          onChange={handleVolumeChange}
          sx={{
            display: { xs: 'none', sm: 'block' },
            width: 60, color: 'white', py: 0,
            '& .MuiSlider-thumb': { width: 10, height: 10 },
            '& .MuiSlider-track': { height: 3, borderRadius: 2 },
            '& .MuiSlider-rail': { height: 3, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.2)' },
          }}
        />

        {hasTracks && (
          <IconButton size="small" onClick={toggleSubtitles} sx={{ color: subtitlesOn ? '#7c4dff' : 'white', p: { xs: 0.75, sm: 0.5 } }}>
            {subtitlesOn ? <Icon name="subtitles" size={20} /> : <Icon name="subtitles_off" size={20} />}
          </IconButton>
        )}

        <IconButton size="small" onClick={toggleFullscreen} sx={{ color: 'white', p: { xs: 0.75, sm: 0.5 } }}>
          {fullscreen ? <Icon name="shrink" size={14} /> : <Icon name="expand" size={14} />}
        </IconButton>
      </Box>
    </Box>
    </>
  );
}
