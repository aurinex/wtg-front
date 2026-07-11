import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, List, ListItem, Avatar, ListItemText, IconButton,
  Button, TextField, Tabs, Tab,
} from '@mui/material';
import ProtectedLayout from '../components/common/ProtectedLayout';
import Icon from '../components/common/Icon';
import TopBar from '../components/common/TopBar';
import { getFriends, getIncomingRequests, sendFriendRequest, acceptRequest, rejectRequest, removeFriend } from '../api/friends';
import { searchUsers } from '../api/users';
import { useTranslation } from '../utils/i18n';
import type { Friend, FriendRequestItem } from '../types';

export default function Friends() {
  const [tab, setTab] = useState(0);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incoming, setIncoming] = useState<FriendRequestItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const { t } = useTranslation();

  const fetchAll = async () => {
    try {
      const [f, inc] = await Promise.all([
        getFriends(),
        getIncomingRequests(),
      ]);
      setFriends(f.data);
      setIncoming(inc.data);
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    try {
      const res = await searchUsers(q);
      setSearchResults(res.data);
    } catch { setSearchResults([]); }
  };

  const handleSendRequest = async (userId: string) => {
    try {
      await sendFriendRequest(userId);
      setSearchResults([]);
      setSearchQuery('');
    } catch { /* ignore */ }
  };

  const handleAccept = async (id: string) => {
    await acceptRequest(id);
    fetchAll();
  };

  const handleReject = async (id: string) => {
    await rejectRequest(id);
    fetchAll();
  };

  const handleRemove = async (id: string) => {
    await removeFriend(id);
    fetchAll();
  };

  return (
    <ProtectedLayout>
      <TopBar title={t('friends.title')} />
      <Box sx={{ p: 2 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            mb: 2,
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, borderRadius: 2 },
            '& .MuiTabs-indicator': { borderRadius: 2, height: 3 },
          }}
        >
          <Tab label={`${t('friends.tab_friends')} (${friends.length})`} />
          <Tab label={`${t('friends.tab_requests')} (${incoming.length})`} />
          <Tab label={t('friends.tab_add')} />
        </Tabs>

        {tab === 0 && (
          <List>
            {friends.length === 0 ? (
              <Typography color="text.secondary" textAlign="center" mt={4}>{t('friends.no_friends')}</Typography>
            ) : (
              friends.map((f) => (
                <Paper key={f.id} sx={{ mb: 1, borderRadius: 3 }}>
                  <ListItem
                    secondaryAction={
                      <IconButton onClick={() => handleRemove(f.id)} size="small">
                        <Icon name="close" size={16} sx={{ mr: 1, color: "error.main", opacity: 0.45 }} />
                      </IconButton>
                    }
                  >
                    <Avatar src={f.avatar_url || undefined} sx={{ mr: 2 }}>
                      {f.username[0]?.toUpperCase()}
                    </Avatar>
                    <ListItemText
                      primary={f.display_name || f.username}
                      secondary={`@${f.username}`}
                    />
                  </ListItem>
                </Paper>
              ))
            )}
          </List>
        )}

        {tab === 1 && (
          <List>
            {incoming.length === 0 ? (
              <Typography color="text.secondary" textAlign="center" mt={4}>{t('friends.no_requests')}</Typography>
            ) : (
              incoming.map((r) => (
                <Paper key={r.id} sx={{ mb: 1, borderRadius: 3 }}>
                  <ListItem
                    secondaryAction={
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton onClick={() => handleAccept(r.id)} size="small">
                          <Icon name="check" size={18} sx={{ color: 'success.main', opacity: 0.8 }} />
                        </IconButton>
                        <IconButton onClick={() => handleReject(r.id)} size="small">
                          <Icon name="close" size={16} sx={{ color: 'error.main', opacity: 0.6 }} />
                        </IconButton>
                      </Box>
                    }
                  >
                    <Avatar src={r.from_avatar || undefined} sx={{ mr: 2 }}>
                      {r.from_username[0]?.toUpperCase()}
                    </Avatar>
                    <ListItemText primary={r.from_username} secondary={t('friends.wants_friends')} />
                  </ListItem>
                </Paper>
              ))
            )}
          </List>
        )}

        {tab === 2 && (
          <Box>
            <TextField
              fullWidth size="small" placeholder={t('friends.search')}
              value={searchQuery} onChange={(e) => handleSearch(e.target.value)}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': { borderRadius: 4, bgcolor: 'rgba(255,255,255,0.04)' },
              }}
            />
            {searchResults.length === 0 && searchQuery.length >= 2 && (
              <Typography color="text.secondary" textAlign="center">{t('friends.no_users')}</Typography>
            )}
            <List>
              {searchResults.map((u: any) => (
                <Paper key={u.id} sx={{ mb: 1, borderRadius: 3 }}>
                  <ListItem
                    secondaryAction={
                      <Button
                        size="small" variant="outlined"
                        onClick={() => handleSendRequest(u.id)}
                        startIcon={<Icon name="person_add" size={18} />}
                        sx={{ borderRadius: 3 }}
                      >
                        {t('friends.add')}
                      </Button>
                    }
                  >
                    <Avatar src={u.avatar_url || undefined} sx={{ mr: 2 }}>
                      {u.username[0]?.toUpperCase()}
                    </Avatar>
                    <ListItemText
                      primary={u.display_name || u.username}
                      secondary={`@${u.username}`}
                    />
                  </ListItem>
                </Paper>
              ))}
            </List>
          </Box>
        )}
      </Box>
    </ProtectedLayout>
  );
}
