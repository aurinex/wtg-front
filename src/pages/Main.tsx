import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, TextField, Typography, Card, CardMedia, CardContent, Chip,
  InputAdornment, Skeleton,
} from '@mui/material';
import Icon from '../components/common/Icon';
import ProtectedLayout from '../components/common/ProtectedLayout';
import TopBar from '../components/common/TopBar';
import { listRooms, joinRoom } from '../api/rooms';
import { useTranslation } from '../utils/i18n';
import type { Room } from '../types';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function RoomCard({ room, onClick }: { room: Room; onClick: () => void }) {
  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: 'pointer', borderRadius: 1, overflow: 'hidden',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': { transform: 'scale(1.02)', boxShadow: '0 8px 30px rgba(124,77,255,0.15)' },
        bgcolor: 'background.paper',
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <CardMedia
          component="img"
          height={140}
          image={room.video_thumbnail || '/placeholder.png'}
          alt={room.video_title}
          sx={{ bgcolor: '#1a1a2e', objectFit: 'cover', border: '1px solid transparent' }}
        />
        {room.video_duration > 0 && (
          <Chip
            icon={<Icon name="access_time" size={12} sx={{ opacity: 0.5 }} />}
            label={formatDuration(room.video_duration)}
            size="small"
            sx={{
              position: 'absolute', bottom: 6, right: 6,
              bgcolor: 'rgba(0,0,0,0.8)', color: 'white', fontSize: 11,
              borderRadius: 2,
            }}
          />
        )}
        <Box sx={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
          bgcolor: 'rgba(255,255,255,0.1)',
        }}>
          {room.current_time > 0 && room.video_duration > 0 && (
            <Box sx={{
              width: `${(room.current_time / room.video_duration) * 100}%`,
              height: '100%', bgcolor: 'primary.main',
              transition: 'width 0.3s',
            }} />
          )}
        </Box>
      </Box>
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Typography variant="subtitle2" fontWeight={600} noWrap>
          {room.name || 'Unnamed Room'}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
          <Icon name="people" size={12} sx={{ opacity: 0.5 }} />
          <Typography variant="caption" color="text.secondary">
            {room.participants?.length || 0}
          </Typography>
          <Chip label={room.platform} size="small" sx={{ ml: 'auto', height: 20, fontSize: 10, borderRadius: 1 }} />
        </Box>
      </CardContent>
    </Card>
  );
}

export default function Main() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const fetchRooms = async (q?: string) => {
    setLoading(true);
    try {
      const res = await listRooms(q || undefined);
      setRooms(res.data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchRooms(); }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchRooms(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const handleRoomClick = async (room: Room) => {
    try {
      await joinRoom(room.code);
      navigate(`/room/${room.code}`);
    } catch { navigate(`/room/${room.code}`); }
  };

  return (
    <ProtectedLayout>
      <TopBar title={t('main.title')} />
      <Box sx={{ px: 2, pt: 1, pb: 2 }}>
        <TextField
          placeholder={t('main.search')} size="small" fullWidth
          value={search} onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Icon name="search" size={18} sx={{ opacity: 0.4 }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': { borderRadius: 4, bgcolor: 'rgba(255,255,255,0.04)' },
          }}
        />
        {loading ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} variant="rounded" height={220} sx={{ borderRadius: 4 }} />
            ))}
          </Box>
        ) : rooms.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 8 }}>
            <Typography color="text.secondary">
              {search ? t('main.no_results') : t('main.no_rooms')}
            </Typography>
            <Typography variant="caption" color="text.disabled">
              {t('main.create_hint')}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            {rooms.map((room) => (
              <RoomCard key={room.id} room={room} onClick={() => handleRoomClick(room)} />
            ))}
          </Box>
        )}
      </Box>
    </ProtectedLayout>
  );
}
