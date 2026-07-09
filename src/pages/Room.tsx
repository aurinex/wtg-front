import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, IconButton, Typography, Switch, FormControlLabel,
  TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Chip,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ShareIcon from '@mui/icons-material/Share';
import TopBar from '../components/common/TopBar';
import PlatformPicker from '../components/player/PlatformPicker';
import VideoInput from '../components/player/VideoInput';
import VideoPlayer from '../components/player/VideoPlayer';
import ChatBox from '../components/chat/ChatBox';
import { getRoom, updateRoom, leaveRoom } from '../api/rooms';
import { useAuthStore } from '../store/authStore';
import { useRoomStore } from '../store/roomStore';
import { useTranslation } from '../utils/i18n';

export default function Room() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { currentRoom, setRoom, messages, setMessages, addMessage, updateReaction } = useRoomStore();
  const { t } = useTranslation();
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [platform, setPlatform] = useState('youtube');
  const [snackbar, setSnackbar] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!code) return;
    getRoom(code).then((res) => {
      setRoom(res.data);
      setRoomName(res.data.name);
      setIsPrivate(res.data.is_private);
      setVideoUrl(res.data.video_url);
      setPlatform(res.data.platform);
    }).catch(() => navigate('/'));
  }, [code]);

  useEffect(() => {
    if (!code || !token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = window.location.host;
    const socket = new WebSocket(`${protocol}://${host}/ws/${code}?token=${token}`);

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: 'load_messages' }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
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
          handleSync(data);
          break;
        case 'participants':
          break;
      }
    };

    socket.onclose = () => {};
    setWs(socket);

    return () => {
      socket.close();
      setWs(null);
    };
  }, [code, token]);

  const handleSync = useCallback((data: any) => {
    if (!currentRoom) return;
    if (data.user_id === user?.id) return;
    const state = data.room_state;
    setRoom({ ...currentRoom, is_playing: state.is_playing, current_time: state.current_time });
  }, [currentRoom, user]);

  const handleSendMessage = useCallback((content: string, replyTo?: string) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'message', content, reply_to: replyTo }));
    }
  }, [ws]);

  const handleReact = useCallback((messageId: string, reaction: string) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'reaction', message_id: messageId, reaction }));
    }
  }, [ws]);

  const handleChangeVideo = useCallback((url: string) => {
    if (!currentRoom || !code) return;
    setVideoUrl(url);
    updateRoom(code, { video_url: url, platform }).then(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'sync', action: 'change_video',
          video_url: url, platform,
        }));
      }
    });
  }, [currentRoom, code, platform, ws]);

  const handlePlatformChange = useCallback((val: string) => {
    setPlatform(val);
    if (code) {
      updateRoom(code, { platform: val });
    }
  }, [code]);

  const handleSaveSettings = async () => {
    if (!code) return;
    await updateRoom(code, { name: roomName, is_private: isPrivate });
    if (currentRoom) {
      setRoom({ ...currentRoom, name: roomName, is_private: isPrivate });
    }
    setSettingsOpen(false);
  };

  const handleLeave = async () => {
    if (code) await leaveRoom(code);
    setRoom(null);
    setMessages([]);
    navigate('/');
  };

  const handleCopyCode = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      setSnackbar(t('room.copied'));
      setTimeout(() => setSnackbar(''), 2000);
    }
  };

  if (!currentRoom || !user) return null;

  return (
    <Box sx={{ height: '100dvh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column', }}>
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
              sx={{ 
                fontSize: 12, 
                height: 28, 
                px: 1, 
                gap: 1, 
                borderRadius: 1, 
                backgroundColor: 'background.paper',
              }}
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
            <VideoInput onSend={handleChangeVideo} />
            <VideoPlayer
              platform={platform}
              videoUrl={videoUrl}
              isPlaying={currentRoom.is_playing}
              currentTime={currentRoom.current_time}
            />
          </>
        ) : (
          <Box sx={{ gap: 2, display: 'flex', flexDirection: 'column' }}>
            <VideoInput onSend={handleChangeVideo} />
            <Box sx={{ width: '100%', aspectRatio: '16/9', borderRadius: 3 }}>
              <PlatformPicker onSelect={(val) => { setPlatform(val); }} />
            </Box>
          </Box>
        )}
      </Box>

      <Box
        ref={chatContainerRef}
        sx={{
          flex: 1, display: 'flex', flexDirection: 'column',
          minHeight: 0, overflow: 'hidden',
        }}
      >
        <ChatBox
          messages={messages}
          currentUserId={user.id}
          onSend={handleSendMessage}
          onReact={handleReact}
          onSettingsOpen={() => setSettingsOpen(true)}
        />
      </Box>

      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{t('room.settings')}</DialogTitle>
        <DialogContent>
          <TextField
            label={t('room.name')} fullWidth size="small" sx={{ mt: 1, mb: 2 }}
            value={roomName} onChange={(e) => setRoomName(e.target.value)}
          />
          <FormControlLabel
            control={<Switch checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />}
            label={t('room.private')}
          />
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">{t('room.code')}:</Typography>
            <Chip label={code} onClick={handleCopyCode} icon={<ContentCopyIcon />} sx={{ ml: 1 }} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLeave} color="error">{t('room.leave')}</Button>
          <Button onClick={() => setSettingsOpen(false)}>{t('room.cancel')}</Button>
          <Button onClick={handleSaveSettings} variant="contained">{t('room.save')}</Button>
        </DialogActions>
      </Dialog>

      {snackbar && (
        <Box sx={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 9999 }}>
          <Chip label={snackbar} color="primary" />
        </Box>
      )}
    </Box>
  );
}
