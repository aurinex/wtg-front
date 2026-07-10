import { Box } from '@mui/material';
import NavBar from '../layout/NavBar';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ pb: 7, minHeight: '100dvh', bgcolor: 'background.default' }}>
      {children}
      <NavBar />
    </Box>
  );
}
