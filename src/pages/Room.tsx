import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, IconButton, Typography, TextField, Button, Chip, SwipeableDrawer,
  Switch, FormControlLabel,
} from '@mui/material';
import Icon from '../components/common/Icon';
import TopBar from '../components/common/TopBar';
import VideoInput from '../components/player/VideoInput';
import PlatformPicker from '../components/player/PlatformPicker';
import VideoSearch from '../components/player/VideoSearch';
import CustomVideoPlayer from '../components/player/CustomVideoPlayer';
import ChatBox from '../components/chat/ChatBox';
import { getRoom, updateRoom, leaveRoom } from '../api/rooms';
import { useAuthStore } from '../store/authStore';
import { useRoomStore } from '../store/roomStore';
import { useTranslation } from '../utils/i18n';
import { useWebSocket } from '../hooks/useWebSocket';

export default function Room() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
  const [bookmarkletCopied, setBookmarkletCopied] = useState(false);
  const [browsingPlatform, setBrowsingPlatform] = useState<string | null>(null);

  const codeRef = useRef(code);
  codeRef.current = code;
  const currentTimeRef = useRef(0);
  currentTimeRef.current = currentRoom?.current_time ?? 0;

  const {
    sendSync, sendMessage, sendReaction, loadMoreMessages, setUserRef,
  } = useWebSocket({
    code, token, roomReady,
    setVideoUrl, setRoom, setMessages, addMessage, updateReaction,
  });

  useEffect(() => {
    if (user) setUserRef(user);
  }, [user, setUserRef]);

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

      const urlParam = searchParams.get('url');
      if (urlParam) {
        let cleanUrl = urlParam;
        try {
          const u = new URL(urlParam);
          if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
            const v = u.searchParams.get('v');
            if (v) cleanUrl = `https://www.youtube.com/watch?v=${v}`;
          }
        } catch {}
        const plat = cleanUrl.includes('youtube') || cleanUrl.includes('youtu.be') ? 'youtube'
          : cleanUrl.includes('vk.com') ? 'vk'
          : cleanUrl.includes('twitch.tv') ? 'twitch'
          : 'web';
        setVideoUrl(cleanUrl);
        setPlatform(plat);
        updateRoom(code, { video_url: cleanUrl, platform: plat });
        window.history.replaceState({}, '', `/room/${code}`);
      }
    }).catch(() => navigate('/'));

    return () => { clearRoom(); setRoomReady(false); };
  }, [code]);

  const handleLocalPlay = useCallback(() => {
    if (currentRoom) setRoom({ ...currentRoom, is_playing: true });
    const now = Date.now() / 1000;
    const curTime = currentRoom?.current_time ?? 0;
    sendSync({ action: 'play', timestamp: now, current_time: curTime });
  }, [sendSync, currentRoom, setRoom]);

  const handleLocalPause = useCallback((time: number) => {
    if (currentRoom) setRoom({ ...currentRoom, is_playing: false, current_time: time });
    sendSync({ action: 'pause', current_time: time });
  }, [sendSync, currentRoom, setRoom]);

  const handleLocalSeek = useCallback((time: number) => {
    sendSync({ action: 'seek', current_time: time });
  }, [sendSync]);

  const handleSelectVideo = useCallback((raw: string) => {
    if (!codeRef.current) return;
    let url = raw;
    try {
      const u = new URL(raw);
      if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
        const v = u.searchParams.get('v');
        if (v) url = `https://www.youtube.com/watch?v=${v}`;
      }
    } catch {}
    const plat = url.includes('youtube') || url.includes('youtu.be') ? 'youtube'
      : url.includes('vk.com') || url.includes('vkvideo.ru') ? 'vk'
      : url.includes('twitch.tv') ? 'twitch'
      : 'web';
    setVideoUrl(url);
    setPlatform(plat);
    updateRoom(codeRef.current, { video_url: url, platform: plat }).then(() => {
      sendSync({ action: 'change_video', video_url: url, platform: plat });
    });
  }, [sendSync]);

  const handleSearchSelect = useCallback((raw: string, plat: string) => {
    let url = raw;
    try {
      const u = new URL(raw);
      if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
        const v = u.searchParams.get('v');
        if (v) url = `https://www.youtube.com/watch?v=${v}`;
      }
    } catch {}
    setBrowsingPlatform(null);
    setVideoUrl(url);
    setPlatform(plat);
    if (codeRef.current) {
      updateRoom(codeRef.current, { video_url: url, platform: plat }).then(() => {
        sendSync({ action: 'change_video', video_url: url, platform: plat });
      });
    }
  }, [sendSync]);

  const handleStopVideo = useCallback(() => {
    if (!codeRef.current || !currentRoom) return;
    updateRoom(codeRef.current, { video_url: '', platform: '' });
    sendSync({ action: 'stop_video' });
    setVideoUrl('');
  }, [sendSync, currentRoom]);

  const handlePlayerReady = useCallback((duration: number) => {
    if (!currentRoom) return;
    setRoom({ ...currentRoom, video_duration: duration });
  }, [currentRoom]);

  const handlePlayerTimeUpdate = useCallback((time: number) => {
    if (!currentRoom) return;
    setRoom({ ...currentRoom, current_time: time });
  }, [currentRoom]);

  useEffect(() => {
    if (!currentRoom?.is_playing) return;
    const interval = setInterval(() => {
      sendSync({ action: 'sync', current_time: currentTimeRef.current });
    }, 1500);
    return () => clearInterval(interval);
  }, [currentRoom?.is_playing, sendSync]);

  const handleSaveSettings = async () => {
    if (!codeRef.current) return;
    await updateRoom(codeRef.current, { name: roomName, is_private: isPrivate });
    if (currentRoom) {
      setRoom({ ...currentRoom, name: roomName, is_private: isPrivate });
    }
    setSettingsOpen(false);
  };

  const handleLeave = async () => {
    if (codeRef.current) await leaveRoom(codeRef.current);
    clearRoom();
    navigate('/');
  };

  const copyText = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  };

  const fallbackCopy = (text: string) => {
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  };

  const handleCopyCode = () => {
    const c = codeRef.current;
    if (c) {
      copyText(c);
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
              deleteIcon={<Icon name="copy" sx={{ mr: 1 }} size={12} />}
              sx={{ fontSize: 12, height: 28, px: 1, borderRadius: 1, backgroundColor: 'background.paper' }}
            />
            <IconButton
              size="small"
              onClick={() => {
                const url = `${window.location.origin}/room/${code}`;
                const shareData = { title: currentRoom.name, text: url, url };
                if (navigator.canShare && navigator.canShare(shareData)) {
                  navigator.share(shareData).catch(() => {});
                } else {
                  copyText(url);
                  setSnackbar(t('room.copied'));
                  setTimeout(() => setSnackbar(''), 2000);
                }
              }}
            >
              <Icon name="share" size={20} />
            </IconButton>
          </Box>
        }
      />

      <Box sx={{ px: 2, pb: 2, flexShrink: 0, gap: 2, display: 'flex', flexDirection: 'column' }}>
        {videoUrl ? (
          <>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Box sx={{ flex: 1 }}>
                <VideoInput onSend={handleSelectVideo} />
              </Box>
              <IconButton onClick={handleStopVideo} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 2, p: 1.5 }}>
                <Icon name="stop" size={16} />
              </IconButton>
            </Box>
            <CustomVideoPlayer
              videoUrl={videoUrl}
              isPlaying={currentRoom.is_playing}
              currentTime={currentRoom.current_time}
              onPlay={handleLocalPlay}
              onPause={handleLocalPause}
              onSeek={handleLocalSeek}
              onTimeUpdate={handlePlayerTimeUpdate}
              onReady={handlePlayerReady}
            />
          </>
        ) : browsingPlatform ? (
          <VideoSearch
            platform={browsingPlatform}
            onSelect={handleSearchSelect}
            onBack={() => setBrowsingPlatform(null)}
          />
        ) : (
          <>
            <Box sx={{ }}>
              <VideoInput onSend={handleSelectVideo} />
            </Box>
            <PlatformPicker onSelect={setBrowsingPlatform} />
          </>
        )}
      </Box>

      <Box sx={{ flex: '1 1 0', minHeight: 40, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <ChatBox
          messages={messages}
          currentUserId={user.id}
          onSend={sendMessage}
          onReact={sendReaction}
          onSettingsOpen={() => setSettingsOpen(true)}
          onLoadMore={loadMoreMessages}
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

          <FormControlLabel
            control={<Switch checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />}
            label={t('room.private')}
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Typography variant="caption" color="text.secondary">{t('room.code')}:</Typography>
            <Chip sx={{px: 1.5, backgroundColor: 'background.default', borderRadius: 2}} label={code} onClick={handleCopyCode} icon={<Icon name="copy" size={12} />} size="small" />
          </Box>

          <Typography variant="subtitle2" fontWeight={600} mb={1}>Быстрая отправка видео</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            1️⃣ Перетащи эту ссылку на панель закладок браузера:
          </Typography>
          <Box
            component="a"
            href={`javascript:(function(){var u=location.href;var m=u.match(/(?:v=|\\/)([\\w-]{11})/);var c='${code}';if(c&&m){location.href='${window.location.origin}/room/'+c+'?url='+encodeURIComponent('https://youtube.com/watch?v='+m[1])}else if(c){location.href='${window.location.origin}/room/'+c+'?url='+encodeURIComponent(u)}})()`}
            sx={{
              display: 'block', p: 1.5, mb: 1, borderRadius: 2,
              bgcolor: 'rgba(124,77,255,0.12)', color: 'primary.light',
              border: '1px dashed', borderColor: 'primary.main',
              textDecoration: 'none', fontSize: 13, fontWeight: 700,
              textAlign: 'center', cursor: 'grab',
              '&:hover': { bgcolor: 'rgba(124,77,255,0.2)' },
            }}
            onClick={(e) => e.preventDefault()}
            draggable
          >
            ⚡ Добавить в RaveClone
          </Box>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={bookmarkletCopied ? <Icon name="check" size={12} sx={{ opacity: 0.7 }} /> : <Icon name="copy" size={12} sx={{ opacity: 0.7 }} />}
              onClick={() => {
                const bm = `javascript:(function(){var u=location.href;var m=u.match(/(?:v=|\\/)([\\w-]{11})/);var c='${code}';if(c&&m){location.href='${window.location.origin}/room/'+c+'?url='+encodeURIComponent('https://youtube.com/watch?v='+m[1])}else if(c){location.href='${window.location.origin}/room/'+c+'?url='+encodeURIComponent(u)}})()`;
                fallbackCopy(bm);
                setBookmarkletCopied(true);
                setTimeout(() => setBookmarkletCopied(false), 2000);
              }}
              sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12, flex: 1 }}
            >
              {bookmarkletCopied ? 'Скопировано!' : 'Копировать'}
            </Button>
          </Box>
          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 3 }}>
            2️⃣ Открой YouTube, найди видео, нажми на закладку → видео откроется здесь.
            На телефоне — скопируй ссылку с YouTube и вставь в поле ввода наверху.
          </Typography>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={handleLeave} color="error" variant="outlined" sx={{ flex: 1, borderRadius: '16px 8px 8px 16px' }}>
              {t('room.leave')}
            </Button>
            <Button onClick={handleSaveSettings} variant="contained" sx={{ flex: 1, borderRadius: '8px 16px 16px 8px' }}>
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
