import { useState } from 'react';
import { Box } from '@mui/material';

const SVG_PATH = '/icons/icons';

interface IconProps {
  name: string;
  size?: number;
  sx?: Record<string, any>;
}

export default function Icon({ name, size = 24, sx }: IconProps) {
  const [failed, setFailed] = useState(false);

  if (!failed) {
    return (
      <Box
        component="img"
        src={`${SVG_PATH}/${name}.svg`}
        onError={() => setFailed(true)}
        sx={{ width: size, height: size, flexShrink: 0, filter: 'brightness(0) invert(1)', ...sx }}
        alt=""
      />
    );
  }

  return (
    <Box
      sx={{
        width: size, height: size, flexShrink: 0, borderRadius: '50%',
        bgcolor: 'rgba(255,255,255,0.1)', border: '1px dashed rgba(255,255,255,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: Math.max(10, size * 0.35), color: 'rgba(255,255,255,0.3)',
        lineHeight: 1, ...sx,
      }}
      title={`Missing icon: ${name}`}
    >
      ?
    </Box>
  );
}
