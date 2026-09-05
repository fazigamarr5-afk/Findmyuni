import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, Button, Paper, TextField, Grid,
  Card, CardContent, Divider, Switch, FormControlLabel, FormControl,
  InputLabel, Select, MenuItem, Chip, Alert
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Publish as PublishIcon,
  Image as ImageIcon,
  Title as TitleIcon,
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  FormatListBulleted as ListIcon,
  FormatQuote as QuoteIcon,
  Code as CodeIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { blogService } from '../services/blog.service.js';
import { supabase } from '../supabase';

const BlogCreate = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checked, setChecked] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: 'general',
    tags: [],
    cover_image: '',
    author_name: currentUser?.user_metadata?.display_name || currentUser?.email?.split('@')[0] || 'Admin',
    meta_title: '',
    meta_description: '',
    published: true,
    featured: false,
  });
  const [tagInput, setTagInput] = useState('');

  // Check admin status
  React.useEffect(() => {
    const check = async () => {
      if (!currentUser) { setChecked(true); return; }
      try {
        const { data } = await supabase
          .from('admins').select('id').eq('email', currentUser.email.toLowerCase()).maybeSingle();
        setIsAdmin(!!data);
      } catch { setIsAdmin(false); }
      setChecked(true);
    };
    check();
  }, [currentUser]);

  const handleFormChange = (e) => {
    const { name, value, checked: c, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? c : value }));
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const insertMarkdown = (before, after = '') => {
    const el = document.querySelector('[name="content"]');
    if (!el) return;
    const s = el.selectionStart, e = el.selectionEnd;
    const sel = formData.content.substring(s, e);
    const txt = formData.content.substring(0, s) + before + sel + after + formData.content.substring(e);
    setFormData(prev => ({ ...prev, content: txt }));
    setTimeout(() => { el.focus(); el.setSelectionRange(s + before.length, s + before.length + sel.length); }, 0);
  };

  const handleSave = async (publish = true) => {
    if (!formData.title.trim()) { showToast('Title is required', 'error'); return; }
    if (!formData.content.trim()) { showToast('Content is required', 'error'); return; }
    setSaving(true);
    try {
      const wc = formData.content.split(/\s+/).filter(Boolean).length;
      const data = { ...formData, published: publish, read_time_minutes: Math.max(1, Math.ceil(wc / 200)) };
      if (publish) {
        await blogService.createPost(data);
        showToast('Blog post published!', 'success');
      } else {
        await blogService.createPost({ ...data, published: false });
        showToast('Draft saved', 'success');
      }
      navigate('/blog');
    } catch (err) {
      showToast('Error: ' + (err.message || 'Unknown'), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (checked && !isAdmin) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Alert severity="error">You need admin access to create blog posts.</Alert>
        <Button onClick={() => navigate('/')} sx={{ mt: 2 }}>Go Home</Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button startIcon={<BackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>Back</Button>
      <Typography variant="h4" fontWeight="bold" gutterBottom>📝 Write New Blog Post</Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <TextField
          autoFocus fullWidth placeholder="Enter post title..."
          value={formData.title} onChange={handleFormChange} name="title" variant="standard"
          sx={{ mb: 2, '& .MuiInputBase-input': { fontSize: 24, fontWeight: 'bold' } }}
        />
        <TextField
          fullWidth placeholder="Brief excerpt / summary..."
          value={formData.excerpt} onChange={handleFormChange} name="excerpt"
          multiline rows={2} size="small" sx={{ mb: 2 }}
        />
        <Divider sx={{ my: 2 }} />
        <Box display="flex" gap={0.5} mb={1}>
          <BoldIcon fontSize="small" sx={{ cursor: 'pointer', p: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '44px', minHeight: '44px' }} onClick={() => insertMarkdown('**', '**')} />
          <ItalicIcon fontSize="small" sx={{ cursor: 'pointer', p: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '44px', minHeight: '44px' }} onClick={() => insertMarkdown('*', '*')} />
          <ListIcon fontSize="small" sx={{ cursor: 'pointer', p: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '44px', minHeight: '44px' }} onClick={() => insertMarkdown('- ', '')} />
          <QuoteIcon fontSize="small" sx={{ cursor: 'pointer', p: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '44px', minHeight: '44px' }} onClick={() => insertMarkdown('> ', '')} />
          <CodeIcon fontSize="small" sx={{ cursor: 'pointer', p: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '44px', minHeight: '44px' }} onClick={() => insertMarkdown('```\n', '\n```')} />
          <Typography variant="caption" color="textSecondary" sx={{ ml: 1, alignSelf: 'center' }}>
            ~{formData.content.split(/\s+/).filter(Boolean).length} words
          </Typography>
        </Box>
        <TextField
          name="content" multiline fullWidth minRows={18}
          value={formData.content} onChange={handleFormChange}
          placeholder="Write your blog post here using Markdown..."
          sx={{ '& textarea': { fontFamily: 'monospace', fontSize: 14, lineHeight: 1.7 } }}
        />
      </Paper>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Settings</Typography>
            <FormControl fullWidth size="small" margin="dense">
              <InputLabel>Category</InputLabel>
              <Select name="category" value={formData.category} onChange={handleFormChange} label="Category">
                {['general','admissions','scholarships','programs','rankings','tips','news','guides','comparison','career'].map(c => (
                  <MenuItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box display="flex" gap={0.5} mt={1}>
              <TextField size="small" placeholder="Add tag..." value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                sx={{ flex: 1 }} />
              <Button variant="outlined" size="small" onClick={handleAddTag}>Add</Button>
            </Box>
            <Box display="flex" gap={0.5} mt={1} flexWrap="wrap">
              {formData.tags.map(tag => <Chip key={tag} label={tag} size="small" onDelete={() => handleRemoveTag(tag)} />)}
            </Box>
            <TextField fullWidth size="small" name="cover_image" label="Cover Image URL" value={formData.cover_image}
              onChange={handleFormChange} sx={{ mt: 1 }} />
            {formData.cover_image && (
              <img src={formData.cover_image} alt="" style={{ width: '100%', maxHeight: 120, objectFit: 'cover', borderRadius: 8, marginTop: 8 }} />
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Publish</Typography>
            <FormControlLabel
              control={<Switch checked={formData.published} onChange={handleFormChange} name="published" />}
              label="Published" />
            <FormControlLabel
              control={<Switch checked={formData.featured} onChange={handleFormChange} name="featured" />}
              label="Featured" />
            <Box display="flex" gap={1} mt={2}>
              <Button variant="outlined" onClick={() => handleSave(false)} disabled={saving}>Save Draft</Button>
              <Button variant="contained" startIcon={<PublishIcon />} onClick={() => handleSave(true)} disabled={saving}>
                {saving ? 'Publishing...' : 'Publish'}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default BlogCreate;
