import { AppBar, Toolbar, Typography, IconButton } from '@mui/material';
import Icon from './Icon';

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
            <Icon name="arrow_back_two" size={16} />
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
