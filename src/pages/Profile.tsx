import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, TextField, Button, Typography, Avatar, Paper, Dialog, DialogTitle,
  DialogContent, DialogActions, ToggleButtonGroup, ToggleButton,
  List, ListItemButton, ListItemAvatar, ListItemText,
} from '@mui/material';
import Icon from '../components/common/Icon';
import ProtectedLayout from '../components/common/ProtectedLayout';
import TopBar from '../components/common/TopBar';
import { useAuthStore } from '../store/authStore';
import { useLangStore } from '../utils/i18n';
import { useTranslation } from '../utils/i18n';
import { updateMe, uploadAvatar } from '../api/users';

export default function Profile() {
  const { user, updateUser, logout } = useAuthStore();
  const { lang, setLang } = useLangStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatar, setAvatar] = useState(user?.avatar_url || '');
  const [logoutOpen, setLogoutOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    try {
      const res = await updateMe({ display_name: displayName, username, email });
      updateUser(res.data);
    } catch { /* handle error */ }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await uploadAvatar(file);
      updateUser(res.data);
      setAvatar(res.data.avatar_url);
    } catch { /* handle error */ }
  };

  const handleLogout = () => {
    logout();
    setLogoutOpen(false);
  };

  if (!user) return null;

  return (
    <ProtectedLayout>
      <TopBar title={t('profile.title')} />
      <Box sx={{ p: 2, maxWidth: 500, mx: 'auto', pb: 10 }}>
        <Paper sx={{ p: 3, textAlign: 'center', mb: 2, borderRadius: 2 }}>
          <Box sx={{ position: 'relative', display: 'inline-block' }}>
            <Avatar
              src={avatar || undefined}
              sx={{ width: 88, height: 88, mx: 'auto', mb: 1, cursor: 'pointer', boxShadow: '0 4px 20px rgba(124,77,255,0.3)' }}
              onClick={() => fileInputRef.current?.click()}
            >
              {user.username[0]?.toUpperCase()}
            </Avatar>
            <Box
              sx={{
                position: 'absolute', bottom: 4, right: -4,
                bgcolor: 'primary.main', borderRadius: '50%', p: 0.6,
                cursor: 'pointer', display: 'flex',
                boxShadow: '0 2px 8px rgba(124,77,255,0.4)',
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Icon name="upload" size={24} sx={{ opacity: 0.85, p: 0.5 }} />
            </Box>
          </Box>
          <input ref={fileInputRef} type="file" hidden accept="image/*" onChange={handleAvatarChange} />
          <Typography variant="h6" fontWeight={700}>{user.username}</Typography>
          <Typography variant="body2" color="text.secondary">{user.email}</Typography>
        </Paper>

        <Paper sx={{ p: 3, mb: 2, borderRadius: 2 }}>
          <TextField
            label={t('profile.display_name')} fullWidth size="small" sx={{ mb: 2 }}
            value={displayName} onChange={(e) => setDisplayName(e.target.value)}
          />
          <TextField
            label={t('profile.username')} fullWidth size="small" sx={{ mb: 2 }}
            value={username} onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            label={t('profile.email')} type="email" fullWidth size="small" sx={{ mb: 2 }}
            value={email} onChange={(e) => setEmail(e.target.value)}
          />
          <Button variant="contained" fullWidth onClick={handleSave} sx={{ borderRadius: 3 }}>
            {t('profile.save')}
          </Button>
        </Paper>

        <Paper sx={{ borderRadius: 2, mb: 2, overflow: 'hidden' }}>
          <List disablePadding>
            <ListItemButton onClick={() => navigate('/friends')} sx={{ py: 1.5 }}>
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <Icon name="friends" size={20} />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={t('profile.friends')}
                primaryTypographyProps={{ fontWeight: 600 }}
              />
            </ListItemButton>
          </List>
        </Paper>

        <Paper sx={{ p: 3, borderRadius: 2, mb: 2 }}>
          <Typography variant="subtitle2" fontWeight={600} mb={1.5}>
            {t('profile.language')}
          </Typography>
          <ToggleButtonGroup
            value={lang}
            exclusive
            onChange={(_, v) => v && setLang(v)}
            fullWidth
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                borderRadius: 3, border: '1px solid', borderColor: 'divider',
                '&.Mui-selected': { bgcolor: 'primary.main', color: 'white' },
              },
            }}
          >
            <Box sx={{ display: 'flex', width: '100%', gap: 2}}>
              <ToggleButton value="en">{t('lang.en')}</ToggleButton>
              <ToggleButton value="ru">{t('lang.ru')}</ToggleButton>
            </Box>
            
          </ToggleButtonGroup>
        </Paper>

        <Button
          variant="outlined" color="error" fullWidth
          onClick={() => setLogoutOpen(true)}
          sx={{ borderRadius: 3 }}
        >
          {t('profile.signout')}
        </Button>
      </Box>

      <Dialog open={logoutOpen} onClose={() => setLogoutOpen(false)}>
        <DialogTitle>{t('profile.signout_title')}</DialogTitle>
        <DialogContent>{t('profile.signout_confirm')}</DialogContent>
        <DialogActions>
          <Button onClick={() => setLogoutOpen(false)}>{t('profile.signout_cancel')}</Button>
          <Button onClick={handleLogout} color="error">{t('profile.signout')}</Button>
        </DialogActions>
      </Dialog>
    </ProtectedLayout>
  );
}
