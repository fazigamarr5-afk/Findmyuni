import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Grid, Typography, Box, Tabs, Tab, Button, Card, CardContent,
  CircularProgress, Alert, Chip, IconButton, Avatar, Divider, Paper
} from '@mui/material';
import {
  School as SchoolIcon, Favorite as FavoriteIcon, Assignment as AssignmentIcon,
  CalendarMonth as CalendarIcon, Star as StarIcon, Delete as DeleteIcon,
  OpenInNew as OpenInNewIcon, TrendingUp as TrendingIcon
} from '@mui/icons-material';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [applications, setApplications] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (currentUser) fetchDashboardData();
  }, [currentUser]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch favorites with university data
      const { data: favs } = await supabase
        .from('favorites')
        .select('id, university_id, created_at')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (favs && favs.length > 0) {
        const uniIds = favs.map(f => f.university_id);
        const { data: unis } = await supabase
          .from('universities')
          .select('id, name, basic_info, programs')
          .in('id', uniIds);
        
        const uniMap = {};
        (unis || []).forEach(u => uniMap[u.id] = u);
        
        setFavorites(favs.map(f => ({
          ...f,
          university: uniMap[f.university_id]
        })).filter(f => f.university));
      }

      // Fetch applications
      const { data: apps } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });
      setApplications(apps || []);

      // Fetch reviews
      const { data: revs } = await supabase
        .from('reviews')
        .select('*, universities(name)')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });
      setReviews(revs || []);

      // Fetch upcoming deadlines from favorited universities
      if (favs && favs.length > 0) {
        const uniIds = favs.map(f => f.university_id);
        const { data: deadlineUnis } = await supabase
          .from('universities')
          .select('id, name, basic_info')
          .in('id', uniIds);
        
        const today = new Date();
        const upcoming = (deadlineUnis || [])
          .map(u => ({
            ...u,
            deadline: u.basic_info?.['Deadline to Apply'],
            daysLeft: u.basic_info?.['Deadline to Apply']
              ? Math.ceil((new Date(u.basic_info['Deadline to Apply']) - today) / (1000*60*60*24))
              : null
          }))
          .filter(u => u.deadline && u.daysLeft > 0)
          .sort((a, b) => a.daysLeft - b.daysLeft);
        setDeadlines(upcoming);
      }

    } catch (e) {
      console.error('Dashboard error:', e);
      setError('Failed to load dashboard data');
    }
    setLoading(false);
  };

  const removeFavorite = async (favId, universityId) => {
    await supabase.from('favorites').delete().eq('id', favId);
    setFavorites(prev => prev.filter(f => f.id !== favId));
  };

  const getDaysColor = (days) => {
    if (days <= 3) return 'error';
    if (days <= 7) return 'warning';
    return 'info';
  };

  if (!currentUser) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h4" fontWeight="bold" mb={2}>Student Dashboard</Typography>
        <Typography color="text.secondary" mb={3}>Please log in to access your dashboard</Typography>
        <Button variant="contained" color="primary" onClick={() => navigate('/login')}>Log In</Button>
      </Container>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <CircularProgress />
      </Box>
    );
  }

  const tabs = [
    { label: `Favorites (${favorites.length})`, icon: <FavoriteIcon /> },
    { label: `Applications (${applications.length})`, icon: <AssignmentIcon /> },
    { label: `Reviews (${reviews.length})`, icon: <StarIcon /> },
    { label: `Deadlines (${deadlines.length})`, icon: <CalendarIcon /> },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" gap={2} mb={4}>
        <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main', fontSize: 24 }}>
          {currentUser.email?.charAt(0).toUpperCase() || 'U'}
        </Avatar>
        <Box>
          <Typography variant="h4" fontWeight="bold">My Dashboard</Typography>
          <Typography color="text.secondary">Welcome back, {currentUser.email?.split('@')[0]}</Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Stats Cards */}
      <Grid container spacing={2} mb={4}>
        {[
          { label: 'Favorites', count: favorites.length, color: '#ef4444', icon: <FavoriteIcon /> },
          { label: 'Applications', count: applications.length, color: '#3b82f6', icon: <AssignmentIcon /> },
          { label: 'Reviews', count: reviews.length, color: '#f59e0b', icon: <StarIcon /> },
          { label: 'Upcoming', count: deadlines.length, color: '#10b981', icon: <CalendarIcon /> },
        ].map((stat, i) => (
          <Grid item xs={6} md={3} key={i}>
            <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, borderRadius: 2 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: stat.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>
                {stat.icon}
              </Box>
              <Box>
                <Typography variant="h5" fontWeight="bold">{stat.count}</Typography>
                <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Paper sx={{ borderRadius: 2, mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ px: 2 }}>
          {tabs.map((tab, i) => (
            <Tab key={i} icon={tab.icon} label={tab.label} sx={{ minHeight: 56 }} />
          ))}
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Box>
          {favorites.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <FavoriteIcon sx={{ fontSize: 48, color: '#ef4444', mb: 2 }} />
              <Typography variant="h6" mb={1}>No favorites yet</Typography>
              <Typography color="text.secondary" mb={2}>Star universities on their detail pages to save them here</Typography>
              <Button variant="contained" onClick={() => navigate('/universities')}>Browse Universities</Button>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {favorites.map(fav => {
                const uni = fav.university;
                const rk = uni.basic_info?.rankings;
                return (
                  <Grid item xs={12} sm={6} md={4} key={fav.id}>
                    <Card sx={{ height: '100%', cursor: 'pointer', '&:hover': { boxShadow: 4 } }} onClick={() => navigate(`/universities/${uni.id}`)}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                          <Box display="flex" gap={1.5} alignItems="center">
                            <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                              {uni.name.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle1" fontWeight="bold" noWrap sx={{ maxWidth: 200 }}>{uni.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {uni.basic_info?.Location || 'Pakistan'} • {uni.basic_info?.Sector || 'N/A'}
                              </Typography>
                            </Box>
                          </Box>
                          <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); removeFavorite(fav.id, uni.id); }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                        {rk?.national && (
                          <Chip label={`#${rk.national} Pakistan`} size="small" sx={{ mt: 1, bgcolor: '#fef3c7', color: '#92400e' }} />
                        )}
                        {rk?.world_qs && (
                          <Chip label={`QS #${rk.world_qs}`} size="small" sx={{ mt: 1, ml: 0.5, bgcolor: '#dbeafe', color: '#1e40af' }} />
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Box>
      )}

      {activeTab === 1 && (
        <Box>
          {applications.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <AssignmentIcon sx={{ fontSize: 48, color: '#3b82f6', mb: 2 }} />
              <Typography variant="h6" mb={1}>No applications yet</Typography>
              <Typography color="text.secondary" mb={2}>Apply to universities from their detail pages</Typography>
              <Button variant="contained" onClick={() => navigate('/universities')}>Browse Universities</Button>
            </Paper>
          ) : (
            applications.map(app => (
              <Card key={app.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h6">{app.universityName || app.university_name || 'University'}</Typography>
                      <Typography variant="body2" color="text.secondary">{app.program || 'Program not specified'}</Typography>
                    </Box>
                    <Chip
                      label={app.status || 'Pending'}
                      color={app.status === 'accepted' ? 'success' : app.status === 'rejected' ? 'error' : 'primary'}
                    />
                  </Box>
                </CardContent>
              </Card>
            ))
          )}
        </Box>
      )}

      {activeTab === 2 && (
        <Box>
          {reviews.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <StarIcon sx={{ fontSize: 48, color: '#f59e0b', mb: 2 }} />
              <Typography variant="h6" mb={1}>No reviews yet</Typography>
              <Typography color="text.secondary" mb={2}>Rate and review universities you've visited</Typography>
              <Button variant="contained" onClick={() => navigate('/universities')}>Browse Universities</Button>
            </Paper>
          ) : (
            reviews.map(rev => (
              <Card key={rev.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">{rev.universities?.name || 'University'}</Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        {[1,2,3,4,5].map(n => (
                          <StarIcon key={n} fontSize="small" sx={{ color: n <= rev.rating ? '#f59e0b' : '#e0e0e0' }} />
                        ))}
                      </Box>
                    </Box>
                    <Button size="small" onClick={() => navigate(`/universities/${rev.university_id}`)}>
                      View <OpenInNewIcon fontSize="small" />
                    </Button>
                  </Box>
                  {rev.comment && <Typography variant="body2" mt={1}>{rev.comment}</Typography>}
                  <Typography variant="caption" color="text.secondary" mt={1} display="block">
                    {new Date(rev.created_at).toLocaleDateString()}
                  </Typography>
                </CardContent>
              </Card>
            ))
          )}
        </Box>
      )}

      {activeTab === 3 && (
        <Box>
          {deadlines.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <CalendarIcon sx={{ fontSize: 48, color: '#10b981', mb: 2 }} />
              <Typography variant="h6" mb={1}>No upcoming deadlines</Typography>
              <Typography color="text.secondary" mb={2}>Favorite universities to track their deadlines here</Typography>
              <Button variant="contained" onClick={() => navigate('/universities')}>Browse Universities</Button>
            </Paper>
          ) : (
            deadlines.map(d => (
              <Card key={d.id} sx={{ mb: 2, cursor: 'pointer', '&:hover': { boxShadow: 3 } }} onClick={() => navigate(`/universities/${d.id}`)}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">{d.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Deadline: {new Date(d.deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </Typography>
                    </Box>
                    <Chip
                      label={d.daysLeft <= 3 ? `${d.daysLeft} days!` : `${d.daysLeft} days left`}
                      color={getDaysColor(d.daysLeft)}
                      sx={{ fontWeight: 'bold' }}
                    />
                  </Box>
                </CardContent>
              </Card>
            ))
          )}
        </Box>
      )}
    </Container>
  );
};

export default Dashboard;
