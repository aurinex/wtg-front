import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Paper } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import AddIcon from '@mui/icons-material/Add';
import PersonIcon from '@mui/icons-material/Person';
import { createRoom } from '../../api/rooms';

export default function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveIdx = (): number => {
    if (location.pathname === '/') return 0;
    if (location.pathname === '/profile' || location.pathname.startsWith('/profile') || location.pathname === '/friends') return 2;
    return -1;
  };

  const activeIdx = getActiveIdx();
  const showAdd = activeIdx === -1;

  const getIndicatorStyle = (): React.CSSProperties => {
    if (activeIdx === 0) {
      return { left: 'calc(16.67% - 22px)', width: 44, height: 44 } as React.CSSProperties;
    }
    if (activeIdx === 2) {
      return { left: 'calc(83.33% - 22px)', width: 44, height: 44 } as React.CSSProperties;
    }
    return { left: 'calc(50% - 28px)', width: 56, height: 56 } as React.CSSProperties;
  };

  const indicatorStyle = getIndicatorStyle();

  const handleTab = async (idx: number) => {
    if (idx === 0) navigate('/');
    else if (idx === 1) {
      try {
        const res = await createRoom({});
        navigate(`/room/${res.data.code}`);
      } catch { /* ignore */ }
    } else if (idx === 2) navigate('/profile');
  };

  const tabs = [
    { id: 'home', icon: <HomeIcon sx={{ fontSize: 26 }} /> },
    { id: 'add', icon: <AddIcon sx={{ fontSize: 32 }} />, isAdd: true },
    { id: 'profile', icon: <PersonIcon sx={{ fontSize: 26 }} /> },
  ];

  return (
    <Paper
      sx={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000,
        bgcolor: 'background.paper', borderRadius: "16px 16px 0 0",
      }}
      elevation={8}
    >
      <Box sx={{ position: 'relative', display: 'flex', height: 64, maxWidth: 500, mx: 'auto' }}>
        <Box
          sx={{
            position: 'absolute', bottom: 8,
            left: indicatorStyle.left as string,
            width: indicatorStyle.width,
            height: indicatorStyle.height,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #7c4dff, #b388ff)',
            opacity: activeIdx >= 0 || showAdd ? 1 : 0,
            transition: 'left 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), height 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s',
            zIndex: 0,
          }}
        />

        {tabs.map((tab, i) => {
          const isActive = activeIdx === i;
          return (
            <Box
              key={tab.id}
              onClick={() => handleTab(i)}
              sx={{
                flex: 1,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                position: 'relative', zIndex: 1, cursor: 'pointer',
                pt: tab.isAdd ? 0 : 0.5,
                userSelect: 'none',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <Box
                sx={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: tab.isAdd ? 56 : 44, height: tab.isAdd ? 56 : 44,
                  borderRadius: '50%',
                  bgcolor: tab.isAdd ? 'primary.main' : 'transparent',
                  transform: tab.isAdd ? 'translateY(-16px)' : 'none',
                  boxShadow: tab.isAdd ? '0 4px 20px rgba(124,77,255,0.4)' : 'none',
                  transition: 'transform 0.3s, box-shadow 0.3s, background-color 0.3s',
                  '&:active': { transform: tab.isAdd ? 'translateY(-12px) scale(0.95)' : 'scale(0.9)' },
                  color: tab.isAdd ? 'white' : isActive ? 'white' : 'text.secondary',
                }}
              >
                {tab.icon}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}
