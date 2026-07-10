import { useState, useEffect, useRef } from 'react';
import {
  Box, TextField, Typography, Card, CardMedia, CardContent, Chip,
  InputAdornment, Skeleton,
} from '@mui/material';
import Icon from '../common/Icon';
import { searchVideos, type SearchResult } from '../../api/search';
import { useTranslation } from '../../utils/i18n';

function formatDuration(seconds: number): string {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface Props {
  platform: string;
  onSelect: (url: string, platform: string) => void;
  onBack: () => void;
}

export default function VideoSearch({ platform, onSelect, onBack }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchVideos(query, platform);
        setResults(res.data);
      } catch {
        setResults([]);
      }
      setLoading(false);
      setSearched(true);
    }, 500);
    return () => clearTimeout(timer);
  }, [query, platform]);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Box
          onClick={onBack}
          sx={{ display: 'flex', cursor: 'pointer', p: 0.5, borderRadius: 1, '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' } }}
        >
          <Icon name="arrow_back_two" size={14} />
        </Box>
        <TextField
          inputRef={inputRef}
          fullWidth size="small"
          placeholder={`Search ${platform}...`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Icon name="search" size={16} sx={{ opacity: 0.4 }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{
            '& .MuiOutlinedInput-root': { borderRadius: 4, bgcolor: 'rgba(255,255,255,0.04)' },
          }}
        />
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={80} sx={{ borderRadius: 2 }} />
          ))}
        </Box>
      )}

      {!loading && searched && results.length === 0 && query.trim() && (
        <Typography color="text.secondary" textAlign="center" mt={4}>
          No results found
        </Typography>
      )}

      {!loading && !searched && !query.trim() && (
        <Typography color="text.disabled" textAlign="center" mt={2} variant="body2">
          Search for videos on {platform}
        </Typography>
      )}

      {results.map((video) => (
        <Card
          key={video.id}
          onClick={() => onSelect(video.url, platform)}
          sx={{
            display: 'flex', mb: 1, borderRadius: 3, cursor: 'pointer',
            bgcolor: 'rgba(255,255,255,0.03)',
            transition: 'transform 0.15s',
            '&:hover': { transform: 'scale(1.01)', bgcolor: 'rgba(255,255,255,0.06)' },
          }}
        >
          <Box sx={{ position: 'relative', width: 120, flexShrink: 0 }}>
            <CardMedia
              component="img"
              height={68}
              image={video.thumbnail || '/placeholder.png'}
              alt={video.title}
              sx={{ objectFit: 'cover', height: '100%' }}
            />
            {video.duration > 0 && (
              <Chip
                icon={<Icon name="access_time" size={10} sx={{ opacity: 0.5 }} />}
                label={formatDuration(video.duration)}
                size="small"
                sx={{
                  position: 'absolute', bottom: 4, right: 4,
                  bgcolor: 'rgba(0,0,0,0.8)', color: 'white', fontSize: 10,
                  height: 18, borderRadius: 1,
                }}
              />
            )}
          </Box>
          <CardContent sx={{ flex: 1, py: 1, px: 1.5, '&:last-child': { pb: 1 } }}>
            <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.3 }} noWrap>
              {video.title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {video.channel}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
