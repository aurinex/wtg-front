import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, IconButton, Typography, Switch, FormControlLabel,
  TextField, Button, Chip, SwipeableDrawer, ToggleButtonGroup, ToggleButton,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ShareIcon from '@mui/icons-material/Share';
import StopIcon from '@mui/icons-material/Stop';
import TopBar from '../components/common/TopBar';
import PlatformPicker from '../components/player/PlatformPicker';
import VideoInput from '../components/player/VideoInput';
import VideoPlayer from '../components/player/VideoPlayer';
import VideoSearch from '../components/player/VideoSearch';
import ChatBox from '../components/chat/ChatBox';
import { getRoom, updateRoom, leaveRoom } from '../api/rooms';
import { useAuthStore } from '../store/authStore';
import { useRoomStore } from '../store/roomStore';
import { useTranslation } from '../utils/i18n';

const platforms = [
  { id: 'youtube', label: 'YouTube' },
  { id: 'vk', label: 'VK Video' },
  { id: 'twitch', label: 'Twitch' },
  { id: 'web', label: 'WEB' },
];

export default function Room() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const { currentRoom, setRoom, messages, setMessages, addMessage, updateReaction, clearRoom } = useRoomStore();
  const { t } = useTranslation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [platform, setPlatform] = useState('youtube');
  const [snackbar, setSnackbar] = useState('');
  const [roomReady, setRoomReady] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const currentRoomRef = useRef(currentRoom);
  currentRoomRef.current = currentRoom;
  const userRef = useRef(user);
  userRef.current = user;
  const codeRef = useRef(code);
  codeRef.current = code;

  useEffect(() => {
    if (!code) return;
    setRoomReady(false);
    getRoom(code).then((res) => {
      setRoom(res.data);
      setRoomName(res.data.name);
      setIsPrivate(res.data.is_private);
      setVideoUrl(res.data.video_url);
      setPlatform(res.data.platform);
      setRoomReady(true);
    }).catch(() => navigate('/'));

    return () => { clearRoom(); setRoomReady(false); };
  }, [code]);

  useEffect(() => {
    if (!code || !token || !roomReady) return;

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = window.location.host;
    const socket = new WebSocket(`${protocol}://${host}/ws/${code}?token=${token}`);

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: 'load_messages' }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const room = currentRoomRef.current;
      const uid = userRef.current?.id;

      switch (data.type) {
        case 'messages':
          setMessages(data.messages);
          break;
        case 'message':
          addMessage(data.message);
          break;
        case 'reaction_update':
          updateReaction(data.message_id, data.reactions);
          break;
        case 'sync':
          if (!room || data.user_id === uid) return;
          if (data.action === 'change_video') {
            setVideoUrl(data.data?.video_url || room.video_url);
            setRoom({ ...room, video_url: data.data?.video_url || room.video_url, is_playing: false, current_time: 0 });
          } else {
            const state = data.room_state;
            if (!state) return;
            let targetTime = state.current_time;
            if (state.is_playing && state.started_at > 0) {
              const elapsed = Date.now() / 1000 - state.started_at;
              targetTime = Math.max(0, state.current_time + elapsed);
            }
            setRoom({ ...room, is_playing: state.is_playing, current_time: targetTime });
          }
          break;
        case 'participants':
          break;
      }
    };

    wsRef.current = socket;

    return () => {
      socket.close();
      wsRef.current = null;
    };
  }, [code, token, roomReady]);

  const sendSync = useCallback((payload: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'sync', ...payload }));
    }
  }, []);

  const handleLocalPlay = useCallback(() => {
    const now = Date.now() / 1000;
    const curTime = currentRoomRef.current?.current_time ?? 0;
    sendSync({ action: 'play', timestamp: now, current_time: curTime });
  }, [sendSync]);

  const handleLocalPause = useCallback((time: number) => {
    sendSync({ action: 'pause', current_time: time });
  }, [sendSync]);

  const handleLocalSeek = useCallback((time: number) => {
    sendSync({ action: 'seek', current_time: time });
  }, [sendSync]);

  const handleSelectVideo = useCallback((url: string, selectedPlatform: string) => {
    if (!codeRef.current) return;
    setVideoUrl(url);
    setPlatform(selectedPlatform);
    setShowSearch(false);
    updateRoom(codeRef.current, { video_url: url, platform: selectedPlatform }).then(() => {
      sendSync({ action: 'change_video', video_url: url, platform: selectedPlatform });
    });
  }, [sendSync]);

  const handleStopVideo = useCallback(() => {
    setVideoUrl('');
  }, []);

  const handlePlatformPicked = useCallback((val: string) => {
    setPlatform(val);
    setShowSearch(true);
  }, []);

  const handleSendMessage = useCallback((content: string, replyTo?: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'message', content, reply_to: replyTo }));
    }
  }, []);

  const handleReact = useCallback((messageId: string, reaction: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'reaction', message_id: messageId, reaction }));
    }
  }, []);

  const [settingsPlatform, setSettingsPlatform] = useState(platform);
  const [settingsVideoUrl, setSettingsVideoUrl] = useState(videoUrl);
  useEffect(() => { setSettingsPlatform(platform); }, [platform]);
  useEffect(() => { setSettingsVideoUrl(videoUrl); }, [videoUrl]);

  const handleSaveSettings = async () => {
    if (!codeRef.current) return;
    const updates: any = { name: roomName, is_private: isPrivate };
    const videoChanged = settingsVideoUrl !== videoUrl || settingsPlatform !== platform;
    if (settingsPlatform !== platform) {
      updates.platform = settingsPlatform;
    }
    if (videoChanged) {
      updates.video_url = settingsVideoUrl;
    }
    await updateRoom(codeRef.current, updates);
    if (currentRoom) {
      setRoom({ ...currentRoom, name: roomName, is_private: isPrivate });
    }
    if (settingsPlatform !== platform) {
      setPlatform(settingsPlatform);
    }
    if (videoChanged) {
      setVideoUrl(settingsVideoUrl);
      sendSync({ action: 'change_video', video_url: settingsVideoUrl, platform: settingsPlatform });
    }
    setSettingsOpen(false);
  };

  const handleLeave = async () => {
    if (codeRef.current) await leaveRoom(codeRef.current);
    clearRoom();
    navigate('/');
  };

  const handleCopyCode = () => {
    const c = codeRef.current;
    if (c) {
      navigator.clipboard.writeText(c);
      setSnackbar(t('room.copied'));
      setTimeout(() => setSnackbar(''), 2000);
    }
  };

  if (!currentRoom || !user) return null;

  return (
    <Box sx={{ height: '100dvh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <TopBar
        title={currentRoom.name}
        onBack={handleLeave}
        rightAction={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={code}
              size="small"
              onClick={handleCopyCode}
              onDelete={handleCopyCode}
              deleteIcon={<ContentCopyIcon />}
              sx={{ fontSize: 12, height: 28, px: 1, gap: 1, borderRadius: 1, backgroundColor: 'background.paper' }}
            />
            <IconButton
              size="small"
              onClick={() => navigator.clipboard.writeText(`${window.location.origin}/room/${code}`)}
            >
              <ShareIcon />
            </IconButton>
          </Box>
        }
      />

      <Box sx={{ px: 2, pb: 2, flexShrink: 0, gap: 2, display: 'flex', flexDirection: 'column' }}>
        {videoUrl ? (
          <>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Box sx={{ flex: 1 }}>
                <VideoInput onSend={(url) => handleSelectVideo(url, platform)} />
              </Box>
              <IconButton onClick={handleStopVideo} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                <StopIcon />
              </IconButton>
            </Box>
            <VideoPlayer
              platform={platform}
              videoUrl={videoUrl}
              isPlaying={currentRoom.is_playing}
              currentTime={currentRoom.current_time}
              onPlay={handleLocalPlay}
              onPause={handleLocalPause}
              onSeek={handleLocalSeek}
            />
          </>
        ) : showSearch ? (
          <VideoSearch
            platform={platform}
            onSelect={handleSelectVideo}
            onBack={() => setShowSearch(false)}
          />
        ) : (
          <Box sx={{ gap: 2, display: 'flex', flexDirection: 'column' }}>
            <VideoInput onSend={(url) => handleSelectVideo(url, platform)} />
            <Box sx={{ width: '100%', aspectRatio: '16/9', borderRadius: 3 }}>
              <PlatformPicker onSelect={handlePlatformPicked} />
            </Box>
          </Box>
        )}
      </Box>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
        <ChatBox
          messages={messages}
          currentUserId={user.id}
          onSend={handleSendMessage}
          onReact={handleReact}
          onSettingsOpen={() => setSettingsOpen(true)}
        />
      </Box>

      <SwipeableDrawer
        anchor="bottom"
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onOpen={() => setSettingsOpen(true)}
        disableSwipeToOpen
        slotProps={{
          paper: {
            sx: {
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              bgcolor: 'background.paper',
              maxHeight: '85dvh',
            },
          },
        }}
      >
        <Box sx={{ width: 40, height: 4, bgcolor: 'divider', borderRadius: 2, mx: 'auto', mt: 1.5, mb: 1 }} />
        <Box sx={{ px: 3, pb: 4, overflow: 'auto' }}>
          <Typography variant="h6" fontWeight={700} mb={2}>{t('room.settings')}</Typography>

          <TextField
            label={t('room.name')} fullWidth size="small" sx={{ mb: 2 }}
            value={roomName} onChange={(e) => setRoomName(e.target.value)}
          />

          <TextField
            fullWidth size="small" label={t('room.video_placeholder')}
            value={settingsVideoUrl}
            onChange={(e) => setSettingsVideoUrl(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Platform
          </Typography>
          <ToggleButtonGroup
            value={settingsPlatform}
            exclusive
            onChange={(_, v) => v && setSettingsPlatform(v)}
            fullWidth
            size="small"
            sx={{ mb: 3 }}
          >
            {platforms.map((p) => (
              <ToggleButton key={p.id} value={p.id} sx={{ textTransform: 'none', fontWeight: 600 }}>
                {p.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          <FormControlLabel
            control={<Switch checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />}
            label={t('room.private')}
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <Typography variant="caption" color="text.secondary">{t('room.code')}:</Typography>
            <Chip label={code} onClick={handleCopyCode} icon={<ContentCopyIcon />} size="small" />
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={handleLeave} color="error" variant="outlined" sx={{ flex: 1 }}>
              {t('room.leave')}
            </Button>
            <Button onClick={handleSaveSettings} variant="contained" sx={{ flex: 1 }}>
              {t('room.save')}
            </Button>
          </Box>
        </Box>
      </SwipeableDrawer>

      {snackbar && (
        <Box sx={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 9999 }}>
          <Chip label={snackbar} color="primary" />
        </Box>
      )}
    </Box>
  );
}
