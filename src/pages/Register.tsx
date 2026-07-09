import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box, TextField, Button, Typography, Paper, Alert,
} from '@mui/material';
import { register as registerApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import { useTranslation } from '../utils/i18n';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await registerApi({ username, email, password });
      setAuth(res.data.user, res.data.access_token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || t('auth.register_failed'));
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', p: 2, bgcolor: 'background.default',
    }}>
      <Paper sx={{ p: 4, maxWidth: 400, width: '100%', borderRadius: 2 }}>
        <Typography variant="h5" fontWeight={700} mb={3} textAlign="center">
          {t('auth.signup')}
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
        <form onSubmit={handleSubmit}>
          <TextField label={t('auth.username')} fullWidth sx={{ mb: 2 }} size="small"
            value={username} onChange={(e) => setUsername(e.target.value)} required />
          <TextField label={t('auth.email')} type="email" fullWidth sx={{ mb: 2 }} size="small"
            value={email} onChange={(e) => setEmail(e.target.value)} required />
          <TextField label={t('auth.password')} type="password" fullWidth sx={{ mb: 3 }} size="small"
            value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Button type="submit" variant="contained" fullWidth sx={{ mb: 2, borderRadius: 3 }}>
            {t('auth.signup')}
          </Button>
        </form>
        <Typography variant="body2" textAlign="center" color="text.secondary">
          {t('auth.has_account')}{' '}
          <Link to="/login" style={{ color: '#7c4dff' }}>{t('auth.signin')}</Link>
        </Typography>
      </Paper>
    </Box>
  );
}
