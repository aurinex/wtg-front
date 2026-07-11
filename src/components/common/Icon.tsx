import { useState, useRef, useEffect } from 'react';
import { Box } from '@mui/material';

const SVG_PATH = '/icons/icons';

interface IconProps {
  name: string;
  size?: number;
  sx?: Record<string, any>;
}

export default function Icon({ name, size = 24, sx }: IconProps) {
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth === 0) {
      setFailed(true);
    }
  }, []);

  if (failed) {
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

  return (
    <>
      <Box
        component="img"
        ref={imgRef}
        src={`${SVG_PATH}/${name}.svg`}
        onError={() => setFailed(true)}
        sx={{ display: 'none' }}
        alt=""
      />
      <Box
        sx={{
          width: size, height: size, flexShrink: 0,
          backgroundColor: 'currentColor',
          mask: `url(${SVG_PATH}/${name}.svg) center / contain no-repeat`,
          WebkitMask: `url(${SVG_PATH}/${name}.svg) center / contain no-repeat`,
          color: '#fff',
          ...sx,
        }}
      />
    </>
  );
}
