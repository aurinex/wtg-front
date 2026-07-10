import { useState } from 'react';
import { TextField, IconButton, InputAdornment } from '@mui/material';
import { useTranslation } from '../../utils/i18n';
import Icon from '../common/Icon';

interface Props {
  onSend: (url: string) => void;
}

export default function VideoInput({ onSend }: Props) {
  const [url, setUrl] = useState('');
  const { t } = useTranslation();

  const handleSend = () => {
    if (url.trim()) {
      onSend(url.trim());
      setUrl('');
    }
  };

  return (
    <TextField
      fullWidth size="small" placeholder={t('room.video_placeholder')}
      value={url}
      onChange={(e) => setUrl(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: 4,
          bgcolor: 'rgba(255,255,255,0.04)',
        },
      }}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton size="small" onClick={handleSend} disabled={!url.trim()}>
                <Icon name="search" size={16} sx={{ opacity: 0.5 }} />
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
