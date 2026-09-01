import React, { useState, useEffect } from 'react';
import { Container, Grid, Paper, Typography, CircularProgress, Box, Alert, Snackbar } from '@mui/material';
import { useAuth } from '../context/AuthContext.jsx';
import ScrapeRequests from '../components/ScrapeRequests.jsx';
import RequestScrape from '../components/RequestScrape.jsx';
import { supabase } from '../supabase';

const ScrapeManagement = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (!user) return;

    const fetchRequests = async () => {
      try {
        const { data, error } = await supabase
          .from('scrape_requests')
          .select('*')
          .eq('user_id', user.id || user.uid)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setRequests(data || []);
      } catch (err) {
        console.error('Error fetching requests:', err);
        setError('Failed to fetch scraping requests');
        showSnackbar('Error fetching requests', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [user]);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
              Scrape Management
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Monitor and manage university data scraping requests.
            </Typography>
          </Paper>
        </Grid>

        {error && (
          <Grid item xs={12}>
            <Alert severity="error">{error}</Alert>
          </Grid>
        )}

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <RequestScrape onSuccess={() => showSnackbar('Scrape request submitted successfully')} />
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <ScrapeRequests requests={requests} />
          </Paper>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ScrapeManagement; 