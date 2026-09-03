import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { 
  Container, Box, Typography, Button, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, CircularProgress, 
  Alert, Tabs, Tab, IconButton, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, Select, MenuItem, InputLabel, FormControl,
  Grid, Card, CardContent, Divider, Chip, List, ListItem, ListItemText,
  ListItemSecondaryAction, Switch, LinearProgress, Tooltip, Badge
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  Refresh as RefreshIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  BarChart as BarChartIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Download as DownloadIcon,
  AutoFixHigh as AutoFixHighIcon,
  RateReview as RateReviewIcon,
  Storage as StorageIcon
} from '@mui/icons-material';
import { supabase } from '../supabase';
import { adminService, checkApiConnectivity, isUsingFirestoreFallback } from '../services/api.service.js';

// ============================================================
// STYLED COMPONENTS
// ============================================================
const StyledContainer = styled(Container)(({ theme }) => ({
  padding: theme.spacing(4),
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
}));

const StatsCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  borderRadius: 12,
  transition: 'transform 0.2s, box-shadow 0.2s',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
}));

const QualityBar = styled(LinearProgress)(({ theme, value }) => ({
  height: 8,
  borderRadius: 4,
  backgroundColor: theme.palette.grey[200],
  '& .MuiLinearProgress-bar': {
    borderRadius: 4,
    backgroundColor: value >= 80 ? '#4caf50' : value >= 50 ? '#ff9800' : '#f44336',
  },
}));

const StatBox = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  padding: theme.spacing(2),
  borderRadius: 12,
  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
}));

const ChartBar = styled(Box)(({ theme, height }) => ({
  width: 40,
  height: `${height}%`,
  borderRadius: '4px 4px 0 0',
  backgroundColor: theme.palette.primary.main,
  transition: 'height 0.5s ease',
  position: 'relative',
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
  },
  '&::after': {
    content: 'attr(data-label)',
    position: 'absolute',
    bottom: -24,
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: 10,
    color: theme.palette.text.secondary,
    whiteSpace: 'nowrap',
  },
}));

// ============================================================
// ADMIN DASHBOARD
// ============================================================
const AdminDashboard = () => {
  const navigate = useNavigate();
  const { verifyAdminStatus, currentUser } = useAuth();
  const { showToast } = useToast();
  const theme = useTheme();

  // Data
  const [universities, setUniversities] = useState([]);
  const [users, setUsers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalUniversities: 0, totalApplications: 0, pendingScrapeJobs: 0 });
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({});
  
  // Data Quality State
  const [qualityFilter, setQualityFilter] = useState('all'); // all, incomplete, complete
  const [qualitySort, setQualitySort] = useState('name');
  
  // Analytics State  
  const [viewAnalytics, setViewAnalytics] = useState({ totalViews: 0, topViewed: [], recentActivity: [] });
  
  // Reviews State
  const [reviewFilter, setReviewFilter] = useState('all'); // all, pending, flagged

  // ============================================================
  // DATA FETCHING
  // ============================================================
  useEffect(() => {
    fetchAllData();
    verifyAdmin();
  }, []);

  const verifyAdmin = async () => {
    try {
      const isAdmin = await verifyAdminStatus();
      if (!isAdmin) {
        showToast('Warning: Your admin status has issues. Attempting to fix...', 'warning');
        await verifyAdminStatus();
      }
    } catch (err) {
      console.error('Error verifying admin status:', err);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [unisResult, usersResult, appsResult, reviewsResult, favsResult] = await Promise.allSettled([
        supabase.from('universities').select('*').order('name'),
        supabase.from('users').select('*').order('created_at', { ascending: false }),
        supabase.from('applications').select('*').order('created_at', { ascending: false }),
        supabase.from('reviews').select('*, universities(name)').order('created_at', { ascending: false }),
        supabase.from('favorites').select('*'),
      ]);

      if (unisResult.status === 'fulfilled' && unisResult.value.data) setUniversities(unisResult.value.data);
      if (usersResult.status === 'fulfilled' && usersResult.value.data) setUsers(usersResult.value.data);
      if (appsResult.status === 'fulfilled' && appsResult.value.data) setApplications(appsResult.value.data);
      if (reviewsResult.status === 'fulfilled' && reviewsResult.value.data) setReviews(reviewsResult.value.data);
      if (favsResult.status === 'fulfilled' && favsResult.value.data) setFavorites(favsResult.value.data);

      setStats({
        totalUsers: usersResult.status === 'fulfilled' ? (usersResult.value.data?.length || 0) : 0,
        totalUniversities: unisResult.status === 'fulfilled' ? (unisResult.value.data?.length || 0) : 0,
        totalApplications: appsResult.status === 'fulfilled' ? (appsResult.value.data?.length || 0) : 0,
        pendingScrapeJobs: 0,
      });

      // Calculate view analytics from basic_info.views
      if (unisResult.status === 'fulfilled' && unisResult.value.data) {
        const unis = unisResult.value.data;
        const totalViews = unis.reduce((sum, u) => sum + (u.basic_info?.views || 0), 0);
        const topViewed = [...unis]
          .filter(u => u.basic_info?.views > 0)
          .sort((a, b) => (b.basic_info?.views || 0) - (a.basic_info?.views || 0))
          .slice(0, 10);
        setViewAnalytics({ totalViews, topViewed, recentActivity: [] });
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // DATA QUALITY COMPUTATIONS
  // ============================================================
  const qualityData = useMemo(() => {
    return universities.map(uni => {
      const hasPrograms = uni.programs && Object.keys(uni.programs).length > 0;
      const hasRankings = uni.basic_info?.rankings && Object.keys(uni.basic_info.rankings).length > 0;
      const hasLogo = uni.basic_info?.logo_url && !uni.basic_info.logo_url.includes('ui-avatars');
      const hasScholarships = uni.scholarships && (
        Array.isArray(uni.scholarships) ? uni.scholarships.length > 0 : Object.keys(uni.scholarships).length > 0
      );
      const hasDeadline = uni.deadline || uni.basic_info?.deadline;
      const hasLocation = uni.basic_info?.Location;
      const hasSector = uni.basic_info?.Sector;
      const hasWebsite = uni.website || uni.url;
      
      const fields = [hasPrograms, hasRankings, hasLogo, hasScholarships, hasDeadline, hasLocation, hasSector, hasWebsite];
      const filledCount = fields.filter(Boolean).length;
      const completeness = Math.round((filledCount / fields.length) * 100);
      
      return {
        ...uni,
        quality: {
          programs: hasPrograms,
          rankings: hasRankings,
          logo: hasLogo,
          scholarships: hasScholarships,
          deadline: hasDeadline,
          location: hasLocation,
          sector: hasSector,
          website: hasWebsite,
          completeness,
        }
      };
    });
  }, [universities]);

  const filteredQualityData = useMemo(() => {
    let data = qualityData;
    if (qualityFilter === 'incomplete') data = data.filter(u => u.quality.completeness < 100);
    if (qualityFilter === 'complete') data = data.filter(u => u.quality.completeness === 100);
    
    if (qualitySort === 'name') data.sort((a, b) => a.name.localeCompare(b.name));
    if (qualitySort === 'completeness-asc') data.sort((a, b) => a.quality.completeness - b.quality.completeness);
    if (qualitySort === 'completeness-desc') data.sort((a, b) => b.quality.completeness - a.quality.completeness);
    
    return data;
  }, [qualityData, qualityFilter, qualitySort]);

  const qualityStats = useMemo(() => {
    const total = qualityData.length;
    const complete = qualityData.filter(u => u.quality.completeness === 100).length;
    const partial = qualityData.filter(u => u.quality.completeness >= 50 && u.quality.completeness < 100).length;
    const poor = qualityData.filter(u => u.quality.completeness < 50).length;
    const avgCompleteness = total > 0 ? Math.round(qualityData.reduce((s, u) => s + u.quality.completeness, 0) / total) : 0;
    
    // Count missing fields
    const missingPrograms = qualityData.filter(u => !u.quality.programs).length;
    const missingRankings = qualityData.filter(u => !u.quality.rankings).length;
    const missingLogos = qualityData.filter(u => !u.quality.logo).length;
    const missingScholarships = qualityData.filter(u => !u.quality.scholarships).length;
    const missingDeadlines = qualityData.filter(u => !u.quality.deadline).length;
    
    return { total, complete, partial, poor, avgCompleteness, missingPrograms, missingRankings, missingLogos, missingScholarships, missingDeadlines };
  }, [qualityData]);

  // ============================================================
  // ANALYTICS COMPUTATIONS
  // ============================================================
  const analyticsData = useMemo(() => {
    // Sector distribution
    const sectorCount = {};
    universities.forEach(u => {
      const sector = u.basic_info?.Sector || 'Unknown';
      sectorCount[sector] = (sectorCount[sector] || 0) + 1;
    });

    // Location distribution (top 10)
    const locationCount = {};
    universities.forEach(u => {
      const loc = u.basic_info?.Location || 'Unknown';
      const city = loc.split(',')[0].trim();
      locationCount[city] = (locationCount[city] || 0) + 1;
    });
    const topLocations = Object.entries(locationCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    // Program distribution
    const programCount = {};
    universities.forEach(u => {
      if (u.programs) {
        Object.keys(u.programs).forEach(level => {
          const count = Array.isArray(u.programs[level]) ? u.programs[level].length : 0;
          programCount[level] = (programCount[level] || 0) + count;
        });
      }
    });

    // Rankings distribution
    const rankingBuckets = { 'Top 10': 0, 'Top 50': 0, 'Top 100': 0, 'Top 200': 0, 'Unranked': 0 };
    universities.forEach(u => {
      const rank = u.basic_info?.rankings?.national;
      if (!rank) rankingBuckets['Unranked']++;
      else if (rank <= 10) rankingBuckets['Top 10']++;
      else if (rank <= 50) rankingBuckets['Top 50']++;
      else if (rank <= 100) rankingBuckets['Top 100']++;
      else rankingBuckets['Top 200']++;
    });

    // HEC category distribution
    const hecCount = {};
    universities.forEach(u => {
      const cat = u.basic_info?.rankings?.hec_category || 'N/A';
      hecCount[cat] = (hecCount[cat] || 0) + 1;
    });

    // User registration trend (by month)
    const userTrend = {};
    users.forEach(u => {
      const month = u.created_at ? new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) : 'Unknown';
      userTrend[month] = (userTrend[month] || 0) + 1;
    });

    // Favorites per university (top 10 most favorited)
    const favCount = {};
    favorites.forEach(f => {
      favCount[f.university_id] = (favCount[f.university_id] || 0) + 1;
    });
    const topFavorited = Object.entries(favCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([id, count]) => {
        const uni = universities.find(u => u.id === id);
        return { name: uni?.name || 'Unknown', count };
      });

    return { sectorCount, topLocations, programCount, rankingBuckets, hecCount, userTrend, topFavorited };
  }, [universities, users, favorites]);

  // ============================================================
  // EVENT HANDLERS
  // ============================================================
  const handleTabChange = (_, newValue) => setActiveTab(newValue);

  const handleOpenDialog = (type, item = null) => {
    setDialogType(type);
    setSelectedItem(item);
    if (type === 'editUser' || type === 'addUser') {
      setFormData({ email: item?.email || '', name: item?.name || item?.display_name || '', role: item?.role || 'user' });
    } else if (type === 'editUniversity') {
      setFormData({
        name: item?.name || '',
        location: item?.basic_info?.Location || '',
        sector: item?.basic_info?.Sector || 'Public',
        website: item?.website || item?.url || '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => { setOpenDialog(false); setDialogType(''); setSelectedItem(null); setFormData({}); };
  const handleFormChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };

  const handleFormSubmit = async () => {
    try {
      if (dialogType === 'editUser' && selectedItem) {
        await adminService.updateUser(selectedItem.id, formData);
        showToast('User updated successfully', 'success');
      } else if (dialogType === 'editUniversity' && selectedItem) {
        await supabase.from('universities').update({
          name: formData.name,
          basic_info: { ...selectedItem.basic_info, Location: formData.location, Sector: formData.sector },
          website: formData.website,
          updated_at: new Date().toISOString(),
        }).eq('id', selectedItem.id);
        showToast('University updated successfully', 'success');
      }
      fetchAllData();
      handleCloseDialog();
    } catch (err) {
      showToast('Error: ' + (err.message || 'Unknown error'), 'error');
    }
  };

  const handleDeleteItem = async (type, id) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
    try {
      if (type === 'university') {
        await supabase.from('universities').delete().eq('id', id);
      } else if (type === 'user') {
        await adminService.deleteUser(id);
      } else if (type === 'review') {
        await supabase.from('reviews').delete().eq('id', id);
      }
      showToast(`${type} deleted successfully`, 'success');
      fetchAllData();
    } catch (err) {
      showToast('Error deleting: ' + err.message, 'error');
    }
  };

  const handleUpdateApplicationStatus = async (applicationId, status) => {
    try {
      await supabase.from('applications').update({ status }).eq('id', applicationId);
      showToast(`Application marked as ${status}`, 'success');
      fetchAllData();
    } catch (err) {
      showToast('Error updating application', 'error');
    }
  };

  const handleAddAdmin = async () => {
    try {
      if (!currentUser?.email) { setError('No user logged in'); return; }
      const { data: existing } = await supabase.from('admins').select('id').eq('email', currentUser.email.toLowerCase()).maybeSingle();
      if (existing) { showToast('Already an admin', 'info'); return; }
      await supabase.from('admins').insert({
        email: currentUser.email.toLowerCase(),
        name: currentUser.user_metadata?.display_name || 'Admin User',
        user_id: currentUser.id,
      });
      showToast('Added as admin', 'success');
    } catch (err) {
      showToast('Failed: ' + err.message, 'error');
    }
  };

  const handlePromoteToAdmin = async (userId) => {
    try {
      await adminService.setUserAsAdmin(userId, true);
      showToast('User promoted to admin', 'success');
      fetchAllData();
    } catch (err) { showToast('Error: ' + err.message, 'error'); }
  };

  const handleDemoteFromAdmin = async (userId) => {
    try {
      await adminService.setUserAsAdmin(userId, false);
      showToast('User demoted from admin', 'success');
      fetchAllData();
    } catch (err) { showToast('Error: ' + err.message, 'error'); }
  };

  const handleExportData = () => {
    const csv = [
      ['Name', 'Location', 'Sector', 'Programs', 'Rankings', 'Logo', 'Scholarships', 'Completeness%'].join(','),
      ...qualityData.map(u => [
        `"${u.name}"`,
        `"${u.quality.location ? u.basic_info?.Location : ''}"`,
        `"${u.quality.sector ? u.basic_info?.Sector : ''}"`,
        u.quality.programs ? 'Yes' : 'No',
        u.quality.rankings ? 'Yes' : 'No',
        u.quality.logo ? 'Yes' : 'No',
        u.quality.scholarships ? 'Yes' : 'No',
        u.quality.completeness,
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'university-data-quality.csv';
    a.click();
    showToast('CSV exported successfully', 'success');
  };

  // ============================================================
  // RENDER: STATS CARDS
  // ============================================================
  const renderStats = () => {
    const adminCount = users.filter(u => u.role === 'admin').length;
    const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : 'N/A';
    
    return (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">Total Users</Typography>
              <Typography variant="h4" fontWeight="bold">{stats.totalUsers}</Typography>
              <Typography variant="caption" color="textSecondary">{adminCount} admin{adminCount !== 1 ? 's' : ''}</Typography>
            </CardContent>
          </StatsCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">Universities</Typography>
              <Typography variant="h4" fontWeight="bold">{stats.totalUniversities}</Typography>
              <Typography variant="caption" color="textSecondary">{qualityStats.avgCompleteness}% avg completeness</Typography>
            </CardContent>
          </StatsCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">Applications</Typography>
              <Typography variant="h4" fontWeight="bold">{stats.totalApplications}</Typography>
              <Typography variant="caption" color="textSecondary">{applications.filter(a => a.status === 'pending').length} pending</Typography>
            </CardContent>
          </StatsCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">Reviews</Typography>
              <Typography variant="h4" fontWeight="bold">{reviews.length}</Typography>
              <Typography variant="caption" color="textSecondary">⭐ {avgRating} avg rating</Typography>
            </CardContent>
          </StatsCard>
        </Grid>
      </Grid>
    );
  };

  // ============================================================
  // RENDER: UNIVERSITIES TAB
  // ============================================================
  const renderUniversitiesTab = () => (
    <StyledPaper>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight="bold">Universities ({universities.length})</Typography>
        <IconButton onClick={fetchAllData} color="primary"><RefreshIcon /></IconButton>
      </Box>
      <TableContainer sx={{ maxHeight: 500 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Location</strong></TableCell>
              <TableCell><strong>Sector</strong></TableCell>
              <TableCell><strong>Programs</strong></TableCell>
              <TableCell><strong>Ranking</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {universities.map((uni) => (
              <TableRow key={uni.id} hover>
                <TableCell sx={{ fontWeight: 500 }}>{uni.name}</TableCell>
                <TableCell>{uni.basic_info?.Location || 'N/A'}</TableCell>
                <TableCell>
                  <Chip size="small" label={uni.basic_info?.Sector || 'N/A'} 
                    color={uni.basic_info?.Sector === 'Public' ? 'primary' : uni.basic_info?.Sector === 'Private' ? 'secondary' : 'default'} />
                </TableCell>
                <TableCell>{uni.programs ? Object.values(uni.programs).flat().length : 0}</TableCell>
                <TableCell>{uni.basic_info?.rankings?.national ? `#${uni.basic_info.rankings.national}` : 'N/A'}</TableCell>
                <TableCell>
                  <IconButton size="small" color="primary" onClick={() => handleOpenDialog('editUniversity', uni)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDeleteItem('university', uni.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </StyledPaper>
  );

  // ============================================================
  // RENDER: USERS TAB
  // ============================================================
  const renderUsersTab = () => (
    <StyledPaper>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight="bold">Users ({users.length})</Typography>
        <IconButton onClick={fetchAllData} color="primary"><RefreshIcon /></IconButton>
      </Box>
      <TableContainer sx={{ maxHeight: 500 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Email</strong></TableCell>
              <TableCell><strong>Role</strong></TableCell>
              <TableCell><strong>Joined</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} hover>
                <TableCell>{user.display_name || user.name || 'N/A'}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip size="small" label={user.role === 'admin' ? 'Admin' : 'User'} 
                    color={user.role === 'admin' ? 'secondary' : 'default'} />
                </TableCell>
                <TableCell>{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</TableCell>
                <TableCell>
                  {user.role === 'admin' ? (
                    <Button size="small" variant="outlined" color="warning" onClick={() => handleDemoteFromAdmin(user.id)}>Demote</Button>
                  ) : (
                    <Button size="small" variant="outlined" color="secondary" onClick={() => handlePromoteToAdmin(user.id)}>Make Admin</Button>
                  )}
                  <IconButton size="small" color="error" onClick={() => handleDeleteItem('user', user.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </StyledPaper>
  );

  // ============================================================
  // RENDER: APPLICATIONS TAB
  // ============================================================
  const renderApplicationsTab = () => (
    <StyledPaper>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight="bold">Applications ({applications.length})</Typography>
        <IconButton onClick={fetchAllData} color="primary"><RefreshIcon /></IconButton>
      </Box>
      {applications.length === 0 ? (
        <Alert severity="info">No applications submitted yet. Applications will appear here when students apply through the dashboard.</Alert>
      ) : (
        <TableContainer sx={{ maxHeight: 500 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>User</strong></TableCell>
                <TableCell><strong>University</strong></TableCell>
                <TableCell><strong>Program</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Submitted</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {applications.map((app) => (
                <TableRow key={app.id} hover>
                  <TableCell>{app.user_name || app.user_id?.slice(0, 8)}</TableCell>
                  <TableCell>{app.university_name || 'N/A'}</TableCell>
                  <TableCell>{app.program_name || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip size="small" label={app.status || 'pending'}
                      color={app.status === 'accepted' ? 'success' : app.status === 'rejected' ? 'error' : app.status === 'under-review' ? 'primary' : 'default'} />
                  </TableCell>
                  <TableCell>{app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell>
                    <Button size="small" variant="contained" color="success" sx={{ mr: 0.5 }}
                      onClick={() => handleUpdateApplicationStatus(app.id, 'accepted')}>Accept</Button>
                    <Button size="small" variant="contained" color="error"
                      onClick={() => handleUpdateApplicationStatus(app.id, 'rejected')}>Reject</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </StyledPaper>
  );

  // ============================================================
  // RENDER: DATA QUALITY TAB
  // ============================================================
  const renderDataQualityTab = () => (
    <Box>
      {/* Quality Overview Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <CheckCircleIcon sx={{ fontSize: 40, color: '#4caf50', mb: 1 }} />
            <Typography variant="h4" fontWeight="bold" color="success.main">{qualityStats.complete}</Typography>
            <Typography variant="body2" color="textSecondary">Complete (100%)</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <WarningIcon sx={{ fontSize: 40, color: '#ff9800', mb: 1 }} />
            <Typography variant="h4" fontWeight="bold" color="warning.main">{qualityStats.partial}</Typography>
            <Typography variant="body2" color="textSecondary">Partial (50-99%)</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <ErrorIcon sx={{ fontSize: 40, color: '#f44336', mb: 1 }} />
            <Typography variant="h4" fontWeight="bold" color="error.main">{qualityStats.poor}</Typography>
            <Typography variant="body2" color="textSecondary">Poor (&lt;50%)</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <StorageIcon sx={{ fontSize: 40, color: '#2196f3', mb: 1 }} />
            <Typography variant="h4" fontWeight="bold" color="primary.main">{qualityStats.avgCompleteness}%</Typography>
            <Typography variant="body2" color="textSecondary">Avg Completeness</Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Missing Fields Breakdown */}
      <StyledPaper>
        <Typography variant="h6" fontWeight="bold" gutterBottom>Missing Data Breakdown</Typography>
        <Grid container spacing={2}>
          {[
            { label: 'Programs', count: qualityStats.missingPrograms, total: qualityStats.total, color: '#2196f3' },
            { label: 'Rankings', count: qualityStats.missingRankings, total: qualityStats.total, color: '#9c27b0' },
            { label: 'Logos', count: qualityStats.missingLogos, total: qualityStats.total, color: '#ff9800' },
            { label: 'Scholarships', count: qualityStats.missingScholarships, total: qualityStats.total, color: '#4caf50' },
            { label: 'Deadlines', count: qualityStats.missingDeadlines, total: qualityStats.total, color: '#f44336' },
          ].map(({ label, count, total, color }) => (
            <Grid item xs={12} sm={6} md={4} key={label}>
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'background.paper', border: `1px solid ${color}20` }}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" fontWeight="bold">{label}</Typography>
                  <Typography variant="body2" color="textSecondary">{total - count}/{total} have data</Typography>
                </Box>
                <QualityBar variant="determinate" value={Math.round(((total - count) / total) * 100)} />
                <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                  {count} missing
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </StyledPaper>

      {/* Filter and Export */}
      <StyledPaper>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight="bold">University Data Quality ({filteredQualityData.length})</Typography>
          <Box display="flex" gap={1} alignItems="center">
            <Select size="small" value={qualityFilter} onChange={e => setQualityFilter(e.target.value)}>
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="incomplete">Incomplete Only</MenuItem>
              <MenuItem value="complete">Complete Only</MenuItem>
            </Select>
            <Select size="small" value={qualitySort} onChange={e => setQualitySort(e.target.value)}>
              <MenuItem value="name">Name</MenuItem>
              <MenuItem value="completeness-asc">Completeness ↑</MenuItem>
              <MenuItem value="completeness-desc">Completeness ↓</MenuItem>
            </Select>
            <Tooltip title="Export CSV">
              <IconButton color="primary" onClick={handleExportData}><DownloadIcon /></IconButton>
            </Tooltip>
            <IconButton onClick={fetchAllData} color="primary"><RefreshIcon /></IconButton>
          </Box>
        </Box>
        <TableContainer sx={{ maxHeight: 400 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>University</strong></TableCell>
                <TableCell><strong>Programs</strong></TableCell>
                <TableCell><strong>Rankings</strong></TableCell>
                <TableCell><strong>Logo</strong></TableCell>
                <TableCell><strong>Scholarships</strong></TableCell>
                <TableCell><strong>Deadline</strong></TableCell>
                <TableCell><strong>Completeness</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredQualityData.map((uni) => (
                <TableRow key={uni.id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{uni.name}</TableCell>
                  <TableCell>{uni.quality.programs ? <CheckCircleIcon color="success" fontSize="small" /> : <ErrorIcon color="error" fontSize="small" />}</TableCell>
                  <TableCell>{uni.quality.rankings ? <CheckCircleIcon color="success" fontSize="small" /> : <ErrorIcon color="error" fontSize="small" />}</TableCell>
                  <TableCell>{uni.quality.logo ? <CheckCircleIcon color="success" fontSize="small" /> : <ErrorIcon color="error" fontSize="small" />}</TableCell>
                  <TableCell>{uni.quality.scholarships ? <CheckCircleIcon color="success" fontSize="small" /> : <ErrorIcon color="error" fontSize="small" />}</TableCell>
                  <TableCell>{uni.quality.deadline ? <CheckCircleIcon color="success" fontSize="small" /> : <ErrorIcon color="error" fontSize="small" />}</TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <QualityBar variant="determinate" value={uni.quality.completeness} sx={{ width: 80, height: 6 }} />
                      <Typography variant="caption" fontWeight="bold">{uni.quality.completeness}%</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </StyledPaper>
    </Box>
  );

  // ============================================================
  // RENDER: ANALYTICS TAB
  // ============================================================
  const renderAnalyticsTab = () => {
    const maxSector = Math.max(...Object.values(analyticsData.sectorCount), 1);
    const maxLocation = Math.max(...analyticsData.topLocations.map(([, v]) => v), 1);
    const maxRanking = Math.max(...Object.values(analyticsData.rankingBuckets), 1);
    const maxHec = Math.max(...Object.values(analyticsData.hecCount), 1);

    return (
      <Box>
        {/* Overview Stats */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <StatBox>
              <Typography variant="h3" fontWeight="bold" color="primary">{viewAnalytics.totalViews}</Typography>
              <Typography variant="body2" color="textSecondary">Total Page Views</Typography>
            </StatBox>
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatBox>
              <Typography variant="h3" fontWeight="bold" color="secondary">{favorites.length}</Typography>
              <Typography variant="body2" color="textSecondary">Total Favorites</Typography>
            </StatBox>
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatBox>
              <Typography variant="h3" fontWeight="bold" color="success.main">{reviews.length}</Typography>
              <Typography variant="body2" color="textSecondary">Total Reviews</Typography>
            </StatBox>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Sector Distribution */}
          <Grid item xs={12} md={6}>
            <StyledPaper>
              <Typography variant="h6" fontWeight="bold" gutterBottom>Sector Distribution</Typography>
              <Box display="flex" alignItems="flex-end" gap={1} height={200} sx={{ pt: 2 }}>
                {Object.entries(analyticsData.sectorCount).map(([sector, count]) => (
                  <Box key={sector} display="flex" flexDirection="column" alignItems="center" flex={1}>
                    <Typography variant="caption" fontWeight="bold">{count}</Typography>
                    <ChartBar height={(count / maxSector) * 100} data-label={sector} />
                  </Box>
                ))}
              </Box>
            </StyledPaper>
          </Grid>

          {/* Top Locations */}
          <Grid item xs={12} md={6}>
            <StyledPaper>
              <Typography variant="h6" fontWeight="bold" gutterBottom>Top Cities</Typography>
              <Box display="flex" alignItems="flex-end" gap={0.5} height={200} sx={{ pt: 2 }}>
                {analyticsData.topLocations.map(([city, count]) => (
                  <Box key={city} display="flex" flexDirection="column" alignItems="center" flex={1}>
                    <Typography variant="caption" fontWeight="bold">{count}</Typography>
                    <ChartBar height={(count / maxLocation) * 100} data-label={city.length > 8 ? city.slice(0, 8) + '…' : city}
                      sx={{ backgroundColor: theme.palette.success.main }} />
                  </Box>
                ))}
              </Box>
            </StyledPaper>
          </Grid>

          {/* Rankings Distribution */}
          <Grid item xs={12} md={6}>
            <StyledPaper>
              <Typography variant="h6" fontWeight="bold" gutterBottom>National Rankings Distribution</Typography>
              <Box display="flex" alignItems="flex-end" gap={1} height={200} sx={{ pt: 2 }}>
                {Object.entries(analyticsData.rankingBuckets).map(([bucket, count]) => (
                  <Box key={bucket} display="flex" flexDirection="column" alignItems="center" flex={1}>
                    <Typography variant="caption" fontWeight="bold">{count}</Typography>
                    <ChartBar height={(count / maxRanking) * 100} data-label={bucket}
                      sx={{ backgroundColor: '#9c27b0' }} />
                  </Box>
                ))}
              </Box>
            </StyledPaper>
          </Grid>

          {/* HEC Categories */}
          <Grid item xs={12} md={6}>
            <StyledPaper>
              <Typography variant="h6" fontWeight="bold" gutterBottom>HEC Category Distribution</Typography>
              <Box display="flex" alignItems="flex-end" gap={1} height={200} sx={{ pt: 2 }}>
                {Object.entries(analyticsData.hecCount).sort(([a], [b]) => a.localeCompare(b)).map(([cat, count]) => (
                  <Box key={cat} display="flex" flexDirection="column" alignItems="center" flex={1}>
                    <Typography variant="caption" fontWeight="bold">{count}</Typography>
                    <ChartBar height={(count / maxHec) * 100} data-label={cat}
                      sx={{ backgroundColor: '#ff9800' }} />
                  </Box>
                ))}
              </Box>
            </StyledPaper>
          </Grid>

          {/* Most Viewed Universities */}
          <Grid item xs={12} md={6}>
            <StyledPaper>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />Most Viewed Universities
              </Typography>
              {viewAnalytics.topViewed.length === 0 ? (
                <Alert severity="info">No view data yet. Views will appear as users browse universities.</Alert>
              ) : (
                <List dense>
                  {viewAnalytics.topViewed.map((uni, i) => (
                    <ListItem key={uni.id}>
                      <ListItemText 
                        primary={<><strong>#{i + 1}</strong> {uni.name}</>}
                        secondary={`${uni.basic_info?.views || 0} views`}
                      />
                      <Chip size="small" label={`${uni.basic_info?.views || 0}`} color="primary" />
                    </ListItem>
                  ))}
                </List>
              )}
            </StyledPaper>
          </Grid>

          {/* Most Favorited Universities */}
          <Grid item xs={12} md={6}>
            <StyledPaper>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                <StarIcon sx={{ mr: 1, verticalAlign: 'middle', color: '#ff9800' }} />Most Favorited Universities
              </Typography>
              {analyticsData.topFavorited.length === 0 ? (
                <Alert severity="info">No favorites yet. Users will save universities as favorites from the detail pages.</Alert>
              ) : (
                <List dense>
                  {analyticsData.topFavorited.map((item, i) => (
                    <ListItem key={i}>
                      <ListItemText 
                        primary={<><strong>#{i + 1}</strong> {item.name}</>}
                        secondary={`${item.count} favorites`}
                      />
                      <Chip size="small" label={`${item.count}`} color="warning" icon={<StarIcon />} />
                    </ListItem>
                  ))}
                </List>
              )}
            </StyledPaper>
          </Grid>

          {/* Programs by Level */}
          <Grid item xs={12}>
            <StyledPaper>
              <Typography variant="h6" fontWeight="bold" gutterBottom>Programs by Level</Typography>
              <Grid container spacing={2}>
                {Object.entries(analyticsData.programCount).map(([level, count]) => (
                  <Grid item xs={6} sm={3} key={level}>
                    <StatBox>
                      <Typography variant="h4" fontWeight="bold">{count}</Typography>
                      <Typography variant="body2" color="textSecondary">{level}</Typography>
                    </StatBox>
                  </Grid>
                ))}
              </Grid>
            </StyledPaper>
          </Grid>
        </Grid>
      </Box>
    );
  };

  // ============================================================
  // RENDER: REVIEWS MODERATION TAB
  // ============================================================
  const renderReviewsTab = () => {
    const filteredReviews = reviewFilter === 'all' ? reviews 
      : reviewFilter === 'low' ? reviews.filter(r => r.rating <= 2)
      : reviews.filter(r => r.rating >= 4);

    return (
      <StyledPaper>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5" fontWeight="bold">Reviews Moderation ({reviews.length})</Typography>
          <Box display="flex" gap={1}>
            <Select size="small" value={reviewFilter} onChange={e => setReviewFilter(e.target.value)}>
              <MenuItem value="all">All Reviews</MenuItem>
              <MenuItem value="low">Low Ratings (1-2 ⭐)</MenuItem>
              <MenuItem value="high">High Ratings (4-5 ⭐)</MenuItem>
            </Select>
            <IconButton onClick={fetchAllData} color="primary"><RefreshIcon /></IconButton>
          </Box>
        </Box>
        
        {reviews.length === 0 ? (
          <Alert severity="info">No reviews yet. Reviews will appear when students rate universities.</Alert>
        ) : (
          <TableContainer sx={{ maxHeight: 500 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>University</strong></TableCell>
                  <TableCell><strong>User</strong></TableCell>
                  <TableCell><strong>Rating</strong></TableCell>
                  <TableCell><strong>Title</strong></TableCell>
                  <TableCell><strong>Comment</strong></TableCell>
                  <TableCell><strong>Date</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredReviews.map((review) => (
                  <TableRow key={review.id} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{review.universities?.name || review.university_id?.slice(0, 8)}</TableCell>
                    <TableCell>{review.user_id?.slice(0, 8)}</TableCell>
                    <TableCell>
                      <Chip size="small" label={`${'⭐'.repeat(review.rating)} ${review.rating}/5`}
                        color={review.rating >= 4 ? 'success' : review.rating <= 2 ? 'error' : 'default'} />
                    </TableCell>
                    <TableCell>{review.title || '—'}</TableCell>
                    <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {review.comment || '—'}
                    </TableCell>
                    <TableCell>{review.created_at ? new Date(review.created_at).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell>
                      <Tooltip title="Delete Review">
                        <IconButton size="small" color="error" onClick={() => handleDeleteItem('review', review.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        
        {/* Review Summary */}
        {reviews.length > 0 && (
          <Box mt={3}>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="h6" fontWeight="bold" gutterBottom>Review Summary</Typography>
            <Grid container spacing={2}>
              {[5, 4, 3, 2, 1].map(stars => {
                const count = reviews.filter(r => r.rating === stars).length;
                const pct = Math.round((count / reviews.length) * 100);
                return (
                  <Grid item xs={12} sm={6} md={4} key={stars}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body2" sx={{ minWidth: 60 }}>{'⭐'.repeat(stars)}</Typography>
                      <LinearProgress variant="determinate" value={pct} sx={{ flex: 1, height: 8, borderRadius: 4 }} />
                      <Typography variant="caption" sx={{ minWidth: 40 }}>{count} ({pct}%)</Typography>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        )}
      </StyledPaper>
    );
  };

  // ============================================================
  // RENDER: SETTINGS TAB
  // ============================================================
  const renderSettingsTab = () => (
    <StyledPaper>
      <Typography variant="h5" fontWeight="bold" gutterBottom>Admin Settings</Typography>
      <List>
        <ListItem>
          <ListItemText primary="Add Current User as Admin" secondary="Register yourself as an admin in the system" />
          <ListItemSecondaryAction>
            <Button variant="contained" color="secondary" onClick={handleAddAdmin}>Add as Admin</Button>
          </ListItemSecondaryAction>
        </ListItem>
        <Divider />
        <ListItem>
          <ListItemText primary="Export All Data" secondary="Download university data quality report as CSV" />
          <ListItemSecondaryAction>
            <Button variant="contained" color="primary" startIcon={<DownloadIcon />} onClick={handleExportData}>Export CSV</Button>
          </ListItemSecondaryAction>
        </ListItem>
        <Divider />
        <ListItem>
          <ListItemText primary="Database Info" secondary={`Universities: ${universities.length} | Users: ${users.length} | Applications: ${applications.length} | Reviews: ${reviews.length} | Favorites: ${favorites.length}`} />
        </ListItem>
        <Divider />
        <ListItem>
          <ListItemText primary="API Configuration" secondary="OpenRouter chatbot API and Supabase connection" />
          <ListItemSecondaryAction>
            <Chip label={import.meta.env.VITE_OPENROUTER_API_KEY ? 'Configured' : 'Not Set'} 
              color={import.meta.env.VITE_OPENROUTER_API_KEY ? 'success' : 'error'} size="small" />
          </ListItemSecondaryAction>
        </ListItem>
      </List>
    </StyledPaper>
  );

  // ============================================================
  // RENDER: DIALOG
  // ============================================================
  const renderDialogContent = () => {
    switch (dialogType) {
      case 'editUser':
        return (
          <>
            <DialogTitle>Edit User</DialogTitle>
            <DialogContent>
              <TextField autoFocus margin="dense" name="email" label="Email" fullWidth value={formData.email || ''} onChange={handleFormChange} />
              <TextField margin="dense" name="name" label="Name" fullWidth value={formData.name || ''} onChange={handleFormChange} />
              <FormControl fullWidth margin="dense">
                <InputLabel>Role</InputLabel>
                <Select name="role" value={formData.role || 'user'} onChange={handleFormChange} label="Role">
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </DialogContent>
          </>
        );
      case 'editUniversity':
        return (
          <>
            <DialogTitle>Edit University</DialogTitle>
            <DialogContent>
              <TextField autoFocus margin="dense" name="name" label="University Name" fullWidth value={formData.name || ''} onChange={handleFormChange} />
              <TextField margin="dense" name="location" label="Location" fullWidth value={formData.location || ''} onChange={handleFormChange} />
              <FormControl fullWidth margin="dense">
                <InputLabel>Sector</InputLabel>
                <Select name="sector" value={formData.sector || 'Public'} onChange={handleFormChange} label="Sector">
                  <MenuItem value="Public">Public</MenuItem>
                  <MenuItem value="Private">Private</MenuItem>
                  <MenuItem value="Semi-Government">Semi-Government</MenuItem>
                </Select>
              </FormControl>
              <TextField margin="dense" name="website" label="Website URL" fullWidth value={formData.website || ''} onChange={handleFormChange} />
            </DialogContent>
          </>
        );
      default: return null;
    }
  };

  // ============================================================
  // LOADING STATE
  // ============================================================
  if (loading) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }} color="textSecondary">Loading dashboard data...</Typography>
      </Box>
    );
  }

  // ============================================================
  // MAIN RENDER
  // ============================================================
  return (
    <StyledContainer maxWidth="xl">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">Admin Dashboard</Typography>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchAllData}>Refresh All</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {renderStats()}

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab icon={<SchoolIcon />} label="Universities" />
          <Tab icon={<PersonIcon />} label="Users" />
          <Tab icon={<AssessmentIcon />} label="Applications" />
          <Tab icon={<AutoFixHighIcon />} label="Data Quality" />
          <Tab icon={<BarChartIcon />} label="Analytics" />
          <Tab icon={<RateReviewIcon />} label="Reviews" />
          <Tab icon={<SettingsIcon />} label="Settings" />
        </Tabs>
      </Paper>

      {activeTab === 0 && renderUniversitiesTab()}
      {activeTab === 1 && renderUsersTab()}
      {activeTab === 2 && renderApplicationsTab()}
      {activeTab === 3 && renderDataQualityTab()}
      {activeTab === 4 && renderAnalyticsTab()}
      {activeTab === 5 && renderReviewsTab()}
      {activeTab === 6 && renderSettingsTab()}

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        {renderDialogContent()}
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleFormSubmit} variant="contained" color="primary">Save</Button>
        </DialogActions>
      </Dialog>
    </StyledContainer>
  );
};

export default AdminDashboard;
