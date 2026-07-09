import { AppBar, Toolbar, Typography, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface TopBarProps {
  title?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export default function TopBar({ title, onBack, rightAction }: TopBarProps) {
  return (
    <AppBar position="static" elevation={0} sx={{ bgcolor: 'transparent', top: 0, zIndex: 1100 }}>
      <Toolbar sx={{ minHeight: 56, px: 2 }}>
        {onBack && (
          <IconButton edge="start" onClick={onBack} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
        )}
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
          {title || ''}
        </Typography>
        {rightAction}
      </Toolbar>
    </AppBar>
  );
}
