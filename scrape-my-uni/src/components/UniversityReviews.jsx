import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Box, Typography, Rating, TextField, Button, Card, CardContent, Avatar, Dialog, DialogTitle, DialogContent, DialogActions, Chip, Divider, IconButton } from '@mui/material';
import { Star as StarIcon, ThumbUp as ThumbUpIcon, ThumbDown as ThumbDownIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';

const UniversityReviews = ({ universityId }) => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [myReview, setMyReview] = useState(null);
  const [form, setForm] = useState({ rating: 4, title: '', comment: '', pros: '', cons: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchReviews(); }, [universityId]);

  const fetchReviews = async () => {
    setLoading(true);
    const { data } = await supabase.from('reviews').select('*').eq('university_id', universityId).order('created_at', { ascending: false });
    setReviews(data || []);
    if (currentUser) {
      const mine = (data || []).find(r => r.user_id === currentUser.id);
      setMyReview(mine || null);
    }
    setLoading(false);
  };

  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : 0;
  const ratingCounts = [5, 4, 3, 2, 1].map(n => reviews.filter(r => r.rating === n).length);

  const handleSubmit = async () => {
    if (!form.rating || !form.comment.trim()) return;
    setSubmitting(true);
    try {
      if (myReview) {
        await supabase.from('reviews').update({ ...form, updated_at: new Date().toISOString() }).eq('id', myReview.id);
      } else {
        await supabase.from('reviews').insert({ user_id: currentUser.id, university_id: universityId, ...form });
      }
      setOpenDialog(false);
      setForm({ rating: 4, title: '', comment: '', pros: '', cons: '' });
      fetchReviews();
    } catch (e) { console.error(e); }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    await supabase.from('reviews').delete().eq('id', id);
    fetchReviews();
  };

  return (
    <Box>
      <Typography variant="h6" fontWeight="bold" mb={2}>{t('reviews')}</Typography>
      
      {/* Rating Summary */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Box display="flex" alignItems="center" gap={4} flexWrap="wrap">
          <Box textAlign="center">
            <Typography variant="h3" fontWeight="bold" color="primary">{avgRating}</Typography>
            <Rating value={parseFloat(avgRating)} readOnly precision={0.1} />
            <Typography variant="body2" color="text.secondary">{reviews.length} reviews</Typography>
          </Box>
          <Box flex={1} minWidth={200}>
            {[5, 4, 3, 2, 1].map((n, i) => (
              <Box key={n} display="flex" alignItems="center" gap={1} mb={0.5}>
                <Typography variant="body2" width={20}>{n}</Typography>
                <StarIcon fontSize="small" sx={{ color: '#f59e0b' }} />
                <Box flex={1} height={8} bgcolor="#e5e7eb" borderRadius={4} overflow="hidden">
                  <Box height="100%" bgcolor="#f59e0b" borderRadius={4} width={`${reviews.length ? (ratingCounts[i] / reviews.length * 100) : 0}%`} />
                </Box>
                <Typography variant="body2" color="text.secondary" width={20}>{ratingCounts[i]}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Card>

      {/* Write Review Button */}
      {currentUser && (
        <Button variant="outlined" startIcon={<EditIcon />} onClick={() => setOpenDialog(true)} sx={{ mb: 3 }}>
          {myReview ? t('editReview') : t('writeReview')}
        </Button>
      )}
      {!currentUser && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontStyle: 'italic' }}>
          Log in to write a review
        </Typography>
      )}

      {/* Reviews List */}
      {reviews.map(review => (
        <Card key={review.id} sx={{ mb: 2 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
              <Box display="flex" gap={1.5} alignItems="center">
                <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
                  {review.user_id?.charAt(0)?.toUpperCase() || 'U'}
                </Avatar>
                <Box>
                  <Typography variant="subtitle2">Student</Typography>
                  <Rating value={review.rating} readOnly size="small" />
                </Box>
              </Box>
              {currentUser && review.user_id === currentUser.id && (
                <IconButton size="small" color="error" sx={{ minWidth: '44px', minHeight: '44px' }} onClick={() => handleDelete(review.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
            {review.title && <Typography variant="subtitle1" fontWeight="bold" mt={1}>{review.title}</Typography>}
            <Typography variant="body2" mt={1}>{review.comment}</Typography>
            {review.pros && (
              <Box mt={1.5} display="flex" gap={1} alignItems="flex-start">
                <ThumbUpIcon fontSize="small" sx={{ color: 'success.main', mt: 0.3 }} />
                <Typography variant="body2" color="success.main"><b>Pros:</b> {review.pros}</Typography>
              </Box>
            )}
            {review.cons && (
              <Box mt={1} display="flex" gap={1} alignItems="flex-start">
                <ThumbDownIcon fontSize="small" sx={{ color: 'error.main', mt: 0.3 }} />
                <Typography variant="body2" color="error.main"><b>Cons:</b> {review.cons}</Typography>
              </Box>
            )}
            <Typography variant="caption" color="text.secondary" mt={1} display="block">
              {new Date(review.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </Typography>
          </CardContent>
        </Card>
      ))}

      {reviews.length === 0 && !loading && (
        <Box textAlign="center" py={4}>
          <Typography variant="body1" color="text.secondary">No reviews yet. Be the first to review!</Typography>
        </Box>
      )}

      {/* Review Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{myReview ? 'Edit Review' : 'Write a Review'}</DialogTitle>
        <DialogContent>
          <Box mb={2}>
            <Typography component="legend" mb={1}>Your Rating</Typography>
            <Rating value={form.rating} onChange={(e, v) => setForm({ ...form, rating: v })} size="large" />
          </Box>
          <TextField label="Title (optional)" fullWidth margin="normal" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <TextField label="Your Review *" fullWidth multiline rows={3} margin="normal" value={form.comment} onChange={e => setForm({ ...form, comment: e.target.value })} required />
          <TextField label="Pros (what you liked)" fullWidth margin="normal" value={form.pros} onChange={e => setForm({ ...form, pros: e.target.value })} />
          <TextField label="Cons (what could improve)" fullWidth margin="normal" value={form.cons} onChange={e => setForm({ ...form, cons: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={!form.rating || !form.comment.trim() || submitting}>
            {submitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UniversityReviews;
