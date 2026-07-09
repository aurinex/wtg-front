import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box, TextField, Button, Typography, Paper, Alert,
} from '@mui/material';
import { login as loginApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import { useTranslation } from '../utils/i18n';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await loginApi({ username, password });
      setAuth(res.data.user, res.data.access_token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || t('auth.login_failed'));
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', p: 2, bgcolor: 'background.default',
    }}>
      <Paper sx={{ p: 4, maxWidth: 400, width: '100%', borderRadius: 2 }}>
        <Typography variant="h5" fontWeight={700} mb={3} textAlign="center">
          {t('auth.signin')}
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
        <form onSubmit={handleSubmit}>
          <TextField
            label={t('auth.username')} fullWidth sx={{ mb: 2 }} size="small"
            value={username} onChange={(e) => setUsername(e.target.value)} required
          />
          <TextField
            label={t('auth.password')} type="password" fullWidth sx={{ mb: 3 }} size="small"
            value={password} onChange={(e) => setPassword(e.target.value)} required
          />
          <Button type="submit" variant="contained" fullWidth sx={{ mb: 2, borderRadius: 3 }}>
            {t('auth.signin')}
          </Button>
        </form>
        <Typography variant="body2" textAlign="center" color="text.secondary">
          {t('auth.no_account')}{' '}
          <Link to="/register" style={{ color: '#7c4dff' }}>{t('auth.signup')}</Link>
        </Typography>
      </Paper>
    </Box>
  );
}
