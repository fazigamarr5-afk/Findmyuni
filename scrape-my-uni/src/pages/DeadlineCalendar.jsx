import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Chip, Container, Grid, Card, CardContent, Button, Alert, useTheme } from '@mui/material';
import { CalendarMonthOutlined, SchoolOutlined, ChevronLeft, ChevronRight, OpenInNew } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DeadlineCalendar = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => { fetchDeadlines(); }, []);

  const fetchDeadlines = async () => {
    setLoading(true);
    const { data } = await supabase.from('universities').select('id, name, basic_info, programs').order('name');
    const withDeadlines = (data || []).filter(u => u.basic_info?.['Deadline to Apply']);
    setUniversities(withDeadlines);
    setLoading(false);
  };

  const getDeadlinesForMonth = (month, year) => {
    return universities.filter(u => {
      const d = new Date(u.basic_info['Deadline to Apply']);
      return d.getMonth() === month && d.getFullYear() === year;
    }).sort((a, b) => new Date(a.basic_info['Deadline to Apply']) - new Date(b.basic_info['Deadline to Apply']));
  };

  const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

  const monthDeadlines = getDeadlinesForMonth(currentMonth, currentYear);
  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);

  const getDeadlinesForDay = (day) => {
    return monthDeadlines.filter(u => new Date(u.basic_info['Deadline to Apply']).getDate() === day);
  };

  const today = new Date();
  const isToday = (day) => day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  const upcomingDeadlines = monthDeadlines.filter(u => new Date(u.basic_info['Deadline to Apply']) >= today);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" color="primary" mb={1}>
        <CalendarMonthOutlined sx={{ mr: 1, verticalAlign: 'middle' }} />
        Admission Deadline Calendar
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={4}>
        Track application deadlines across {universities.length} Pakistani universities
      </Typography>

      <Grid container spacing={3}>
        {/* Calendar Grid */}
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
            {/* Month Navigation */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Button onClick={prevMonth}><ChevronLeft /></Button>
              <Typography variant="h5" fontWeight="bold">{MONTHS[currentMonth]} {currentYear}</Typography>
              <Button onClick={nextMonth}><ChevronRight /></Button>
            </Box>

            {/* Day Headers */}
            <Grid container columns={7} mb={1}>
              {DAYS.map(d => (
                <Grid item key={d} xs={1}>
                  <Typography variant="caption" textAlign="center" display="block" fontWeight="bold" color="text.secondary">{d}</Typography>
                </Grid>
              ))}
            </Grid>

            {/* Calendar Days */}
            <Grid container columns={7}>
              {/* Empty cells for first week */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <Grid item key={`empty-${i}`} xs={1}>
                  <Box sx={{ minHeight: 80, border: '1px solid #f0f0f0', borderRadius: 1, m: 0.25 }} />
                </Grid>
              ))}
              {/* Days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayDeadlines = getDeadlinesForDay(day);
                return (
                  <Grid item key={day} xs={1}>
                    <Box sx={{
                      minHeight: 80, border: '1px solid #f0f0f0', borderRadius: 1, m: 0.25, p: 0.5,
                      bgcolor: isToday(day) ? 'primary.50' : dayDeadlines.length > 0 ? '#fffbeb' : 'white',
                      borderColor: isToday(day) ? 'primary.main' : dayDeadlines.length > 0 ? '#fbbf24' : '#f0f0f0',
                      borderWidth: isToday(day) || dayDeadlines.length > 0 ? 2 : 1,
                    }}>
                      <Typography variant="caption" fontWeight={isToday(day) ? 'bold' : 'normal'} color={isToday(day) ? 'primary' : 'text.primary'}>
                        {day}
                      </Typography>
                      {dayDeadlines.length > 0 && (
                        <Box mt={0.5}>
                          <Chip label={dayDeadlines.length} size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#f59e0b', color: 'white' }} />
                        </Box>
                      )}
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          </Paper>
        </Grid>

        {/* Upcoming Deadlines Sidebar */}
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              Upcoming Deadlines
            </Typography>
            {loading ? (
              <Typography color="text.secondary">Loading...</Typography>
            ) : upcomingDeadlines.length === 0 ? (
              <Alert severity="info">No upcoming deadlines this month</Alert>
            ) : (
              <Box sx={{ maxHeight: 500, overflowY: 'auto' }}>
                {upcomingDeadlines.slice(0, 20).map(u => {
                  const deadline = new Date(u.basic_info['Deadline to Apply']);
                  const daysLeft = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
                  const urgency = daysLeft <= 3 ? 'error' : daysLeft <= 7 ? 'warning' : 'info';
                  return (
                    <Card key={u.id} sx={{ mb: 1.5, cursor: 'pointer', '&:hover': { boxShadow: 2 } }} onClick={() => navigate(`/universities/${u.id}`)}>
                      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                          <Box flex={1}>
                            <Typography variant="subtitle2" fontWeight="bold" noWrap>{u.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </Typography>
                          </Box>
                          <Chip
                            label={daysLeft <= 0 ? 'Passed' : `${daysLeft}d left`}
                            size="small"
                            color={urgency}
                            sx={{ fontWeight: 'bold' }}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DeadlineCalendar;
