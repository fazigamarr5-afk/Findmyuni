import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, Box, CircularProgress, Alert,
  Select, MenuItem, FormControl, InputLabel, Grid, Pagination
} from '@mui/material';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';

const OpenAdmissions = () => {
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ sector: '', province: '' });
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    fetchOpenAdmissions();
  }, []);

  const fetchOpenAdmissions = async () => {
    try {
      setLoading(true);
      const { data, error: dbError } = await supabase
        .from('universities')
        .select('*')
        .order('name');

      if (dbError) throw dbError;

      const today = new Date();

      const withDeadlines = (data || []).filter(uni => {
        const deadlineStr = uni.deadline || uni.basic_info?.["Deadline to Apply"];
        if (!deadlineStr) return false;
        try {
          const d = new Date(deadlineStr);
          return !isNaN(d.getTime()) && d >= today;
        } catch { return false; }
      });

      withDeadlines.sort((a, b) => {
        const da = new Date(a.deadline || a.basic_info?.["Deadline to Apply"]);
        const db = new Date(b.deadline || b.basic_info?.["Deadline to Apply"]);
        return da - db;
      });

      setUniversities(withDeadlines);
      setError(null);
    } catch (err) {
      console.error('Error fetching open admissions:', err);
      setError('Failed to load universities');
    } finally {
      setLoading(false);
    }
  };

  const getPrograms = (uni) => {
    const p = uni.programs;
    if (!p || typeof p !== 'object') return [];
    const bs = p.BSPrograms || p.u || [];
    const ms = p.MSPrograms || p.g || [];
    const phd = p.PhDPrograms || p.d || [];
    return [...bs, ...ms, ...phd];
  };

  const getSectors = () => [...new Set(universities.map(u => u.sector || u.basic_info?.Sector).filter(Boolean))];
  const getProvinces = () => [...new Set(universities.map(u => u.province || u.basic_info?.Province).filter(Boolean))];

  const filtered = universities.filter(uni => {
    if (filters.sector) {
      const s = (uni.sector || uni.basic_info?.Sector || '').toLowerCase();
      if (!s.includes(filters.sector.toLowerCase())) return false;
    }
    if (filters.province) {
      const p = (uni.province || uni.basic_info?.Province || '').toLowerCase();
      if (!p.includes(filters.province.toLowerCase())) return false;
    }
    return true;
  });

  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>;
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        Universities with Open Admissions
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Sector</InputLabel>
            <Select value={filters.sector} label="Sector" onChange={e => { setFilters(p => ({ ...p, sector: e.target.value })); setPage(1); }}>
              <MenuItem value="">All Sectors</MenuItem>
              {getSectors().map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Province</InputLabel>
            <Select value={filters.province} label="Province" onChange={e => { setFilters(p => ({ ...p, province: e.target.value })); setPage(1); }}>
              <MenuItem value="">All Provinces</MenuItem>
              {getProvinces().map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {filtered.length === 0 ? (
        <Alert severity="info">No universities with upcoming deadlines found.</Alert>
      ) : (
        <>
          <TableContainer component={Paper} variant="outlined">
            <Table sx={{ minWidth: 650 }}>
              <TableHead sx={{ bgcolor: 'primary.main' }}>
                <TableRow>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', width: '5%' }}>#</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', width: '35%' }}>UNIVERSITY</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', width: '25%' }}>PROGRAMS</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', width: '15%' }}>SECTOR</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', width: '20%' }}>DEADLINE</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginated.map((uni, index) => {
                  const deadlineStr = uni.deadline || uni.basic_info?.["Deadline to Apply"];
                  const daysRemaining = deadlineStr
                    ? Math.ceil((new Date(deadlineStr) - new Date()) / (1000 * 60 * 60 * 24))
                    : null;
                  const programs = getPrograms(uni);
                  const location = uni.location || uni.basic_info?.Location;

                  return (
                    <TableRow key={uni.id || index} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                      <TableCell>{(page - 1) * rowsPerPage + index + 1}</TableCell>
                      <TableCell>
                        <Link to={`/universities/${uni.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          <Typography fontWeight="medium" color="primary.main" sx={{ '&:hover': { textDecoration: 'underline' } }}>
                            {uni.name}
                          </Typography>
                        </Link>
                        {location && <Typography variant="body2" color="text.secondary">{location}</Typography>}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {programs.length > 0 ? (
                            <>
                              {programs.slice(0, 3).join(', ')}
                              {programs.length > 3 && ` +${programs.length - 3} more`}
                            </>
                          ) : (
                            <span style={{ color: '#999' }}>N/A</span>
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell>{uni.sector || uni.basic_info?.Sector || 'N/A'}</TableCell>
                      <TableCell>
                        <Typography fontWeight="medium" color="error.main">
                          {deadlineStr ? new Date(deadlineStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                        </Typography>
                        {daysRemaining !== null && (
                          <Typography variant="caption" color={daysRemaining > 7 ? 'text.secondary' : 'error.main'}>
                            {daysRemaining > 0 ? `(in ${daysRemaining} days)` : daysRemaining === 0 ? '(Today)' : '(Passed)'}
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={Math.ceil(filtered.length / rowsPerPage)}
              page={page}
              onChange={(_, p) => setPage(p)}
              color="primary"
            />
          </Box>
        </>
      )}
    </Box>
  );
};

export default OpenAdmissions;
