import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../context/ToastContext.jsx';
import {
  Box, Typography, Button, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, CircularProgress,
  Alert, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Select, MenuItem, InputLabel, FormControl,
  Grid, Card, CardContent, Chip, Switch, Tooltip, FormControlLabel,
  Divider, Tabs, Tab, Avatar, Badge
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  OpenInNew as OpenInNewIcon,
  Article as ArticleIcon,
  Category as CategoryIcon,
  Image as ImageIcon,
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  FormatListBulleted as ListIcon,
  FormatQuote as QuoteIcon,
  Code as CodeIcon,
  Title as TitleIcon
} from '@mui/icons-material';
import { blogService } from '../../services/blog.service.js';

// ============================================================
// BLOG MANAGER — WordPress-like blog post management
// ============================================================
const BlogManager = () => {
  const { showToast } = useToast();

  const [posts, setPosts] = useState([]);
  const [allPosts, setAllPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all'); // all, published, draft
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog / Editor state
  const [openEditor, setOpenEditor] = useState(false);
  const [editorMode, setEditorMode] = useState('create'); // create | edit
  const [selectedPost, setSelectedPost] = useState(null);
  const [editorTab, setEditorTab] = useState(0); // 0 = write, 1 = settings
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: 'general',
    tags: [],
    cover_image: '',
    author_name: 'FindMyUni Team',
    meta_title: '',
    meta_description: '',
    read_time_minutes: 5,
    published: true,
    featured: false,
  });
  const [tagInput, setTagInput] = useState('');

  // ============================================================
  // DATA FETCHING
  // ============================================================
  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    filterPosts();
  }, [allPosts, filterCategory, filterStatus, searchQuery]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [allPostsData, cats] = await Promise.all([
        blogService.getPosts({ page: 1, limit: 500, category: null, search: null }),
        blogService.getCategories().catch(() => []),
      ]);
      setAllPosts(allPostsData.posts || []);
      setCategories(cats);
    } catch (err) {
      console.error('Error fetching blog posts:', err);
      if (err.message?.includes('does not exist') || err.message?.includes('schema cache')) {
        setError('Blog table not set up. Run the SQL migration first.');
      } else {
        setError('Failed to load blog posts: ' + (err.message || ''));
      }
    } finally {
      setLoading(false);
    }
  };

  const filterPosts = () => {
    let filtered = [...allPosts];
    if (filterCategory !== 'all') {
      filtered = filtered.filter(p => p.category === filterCategory);
    }
    if (filterStatus === 'published') {
      filtered = filtered.filter(p => p.published);
    } else if (filterStatus === 'draft') {
      filtered = filtered.filter(p => !p.published);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.title?.toLowerCase().includes(q) ||
        p.excerpt?.toLowerCase().includes(q) ||
        (p.tags || []).some(t => t.toLowerCase().includes(q))
      );
    }
    setPosts(filtered);
  };

  // ============================================================
  // EDITOR HANDLERS
  // ============================================================
  const handleCreate = () => {
    setEditorMode('create');
    setSelectedPost(null);
    setEditorTab(0);
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      category: 'general',
      tags: [],
      cover_image: '',
      author_name: 'FindMyUni Team',
      meta_title: '',
      meta_description: '',
      read_time_minutes: 5,
      published: true,
      featured: false,
    });
    setTagInput('');
    setOpenEditor(true);
  };

  const handleEdit = (post) => {
    setEditorMode('edit');
    setSelectedPost(post);
    setEditorTab(0);
    setFormData({
      title: post.title || '',
      slug: post.slug || '',
      excerpt: post.excerpt || '',
      content: post.content || '',
      category: post.category || 'general',
      tags: post.tags || [],
      cover_image: post.cover_image || '',
      author_name: post.author_name || 'FindMyUni Team',
      meta_title: post.meta_title || '',
      meta_description: post.meta_description || '',
      read_time_minutes: post.read_time_minutes || 5,
      published: post.published !== false,
      featured: post.featured || false,
    });
    setTagInput('');
    setOpenEditor(true);
  };

  const handleFormChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
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

  const handleSave = async () => {
    if (!formData.title.trim()) {
      showToast('Title is required', 'error');
      return;
    }
    if (!formData.content.trim()) {
      showToast('Content is required', 'error');
      return;
    }
    setSaving(true);
    try {
      // Auto-calculate read time: ~200 words per minute
      const wordCount = formData.content.split(/\s+/).filter(Boolean).length;
      const readTime = Math.max(1, Math.ceil(wordCount / 200));
      const dataToSave = { ...formData, read_time_minutes: readTime };

      if (editorMode === 'create') {
        await blogService.createPost(dataToSave);
        showToast('Blog post created successfully!', 'success');
      } else {
        await blogService.updatePost(selectedPost.id, dataToSave);
        showToast('Blog post updated successfully!', 'success');
      }
      setOpenEditor(false);
      fetchAll();
    } catch (err) {
      showToast('Error saving post: ' + (err.message || 'Unknown'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (post) => {
    if (!window.confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    try {
      await blogService.deletePost(post.id);
      showToast('Post deleted', 'success');
      fetchAll();
    } catch (err) {
      showToast('Error deleting: ' + err.message, 'error');
    }
  };

  const handleToggleFeatured = async (post) => {
    try {
      await blogService.updatePost(post.id, { featured: !post.featured });
      showToast(`Post ${post.featured ? 'unfeatured' : 'featured'}`, 'success');
      fetchAll();
    } catch (err) {
      showToast('Error toggling featured', 'error');
    }
  };

  const handleTogglePublished = async (post) => {
    try {
      await blogService.updatePost(post.id, { published: !post.published });
      showToast(`Post ${post.published ? 'unpublished' : 'published'}`, 'success');
      fetchAll();
    } catch (err) {
      showToast('Error toggling publish status', 'error');
    }
  };

  // ============================================================
  // TOOLBAR INSERT HELPERS
  // ============================================================
  const insertMarkdown = useCallback((before, after = '') => {
    const textarea = document.querySelector('[name="content"]');
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = formData.content.substring(start, end);
    const newText = formData.content.substring(0, start) + before + selected + after + formData.content.substring(end);
    setFormData(prev => ({ ...prev, content: newText }));
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 0);
  }, [formData.content]);

  // ============================================================
  // STATISTICS
  // ============================================================
  const stats = {
    total: allPosts.length,
    published: allPosts.filter(p => p.published).length,
    drafts: allPosts.filter(p => !p.published).length,
    featured: allPosts.filter(p => p.featured).length,
    totalViews: allPosts.reduce((sum, p) => sum + (p.views || 0), 0),
  };

  // ============================================================
  // RENDER
  // ============================================================
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && <Alert severity={error.includes('not set up') ? 'info' : 'error'} sx={{ mb: 2 }} onClose={() => setError('')}>
        {error}
      </Alert>}

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Posts', value: stats.total, color: '#2196f3' },
          { label: 'Published', value: stats.published, color: '#4caf50' },
          { label: 'Drafts', value: stats.drafts, color: '#ff9800' },
          { label: 'Featured', value: stats.featured, color: '#9c27b0' },
          { label: 'Total Views', value: stats.totalViews, color: '#f44336' },
        ].map((s) => (
          <Grid item xs={6} sm={4} md={2.4} key={s.label}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h4" fontWeight="bold" color={s.color}>{s.value}</Typography>
              <Typography variant="caption" color="textSecondary">{s.label}</Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Header with filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h5" fontWeight="bold">📝 Blog Manager</Typography>
            <Typography variant="body2" color="textSecondary">
              Write and manage blog posts — like WordPress
            </Typography>
          </Box>
          <Box display="flex" gap={1} flexWrap="wrap">
            <TextField
              size="small" placeholder="Search posts..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ minWidth: 180 }}
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} label="Status">
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="published">Published</MenuItem>
                <MenuItem value="draft">Drafts</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Category</InputLabel>
              <Select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} label="Category">
                <MenuItem value="all">All</MenuItem>
                {categories.map(c => (
                  <MenuItem key={c.name} value={c.name}>{c.name} ({c.count})</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchAll}>Refresh</Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>New Post</Button>
          </Box>
        </Box>
      </Paper>

      {/* Posts Table */}
      <Paper sx={{ overflow: 'hidden' }}>
        {posts.length === 0 ? (
          <Box p={4} textAlign="center">
            <ArticleIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              {allPosts.length === 0 ? 'No blog posts yet' : 'No posts match your filters'}
            </Typography>
            {allPosts.length === 0 && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate} sx={{ mt: 1 }}>
                Write Your First Post
              </Button>
            )}
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Title</strong></TableCell>
                  <TableCell><strong>Category</strong></TableCell>
                  <TableCell><strong>Tags</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Views</strong></TableCell>
                  <TableCell><strong>Date</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.id} hover sx={{ opacity: post.published ? 1 : 0.6 }}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        {post.cover_image && (
                          <Avatar variant="rounded" src={post.cover_image} sx={{ width: 40, height: 40 }} />
                        )}
                        <Box>
                          <Typography variant="body2" fontWeight="bold" noWrap sx={{ maxWidth: 250 }}>
                            {post.title}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            /blog/{post.slug}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={post.category} color="primary" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={0.3} flexWrap="wrap">
                        {(post.tags || []).slice(0, 3).map(tag => (
                          <Chip key={tag} size="small" label={tag} sx={{ fontSize: 10, height: 20 }} />
                        ))}
                        {(post.tags || []).length > 3 && (
                          <Chip size="small" label={`+${post.tags.length - 3}`} sx={{ fontSize: 10, height: 20 }} />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={0.5}>
                        <Chip
                          size="small"
                          label={post.published ? 'Published' : 'Draft'}
                          color={post.published ? 'success' : 'warning'}
                        />
                        {post.featured && (
                          <Chip size="small" label="Featured" color="secondary" icon={<StarIcon sx={{ fontSize: 14 }} />} />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{post.views || 0}</TableCell>
                    <TableCell>
                      {post.created_at ? new Date(post.created_at).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Tooltip title={post.featured ? 'Unfeature' : 'Feature'}>
                        <IconButton size="small" color="secondary" onClick={() => handleToggleFeatured(post)}>
                          {post.featured ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View">
                        <IconButton size="small" color="info" href={`/blog/${post.slug}`} target="_blank">
                          <OpenInNewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={post.published ? 'Unpublish' : 'Publish'}>
                        <IconButton size="small" color="warning" onClick={() => handleTogglePublished(post)}>
                          {post.published ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" color="primary" onClick={() => handleEdit(post)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => handleDelete(post)}>
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
      </Paper>

      {/* ============================================================ */}
      {/* WORDPRESS-LIKE EDITOR DIALOG */}
      {/* ============================================================ */}
      <Dialog open={openEditor} onClose={() => setOpenEditor(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', borderBottom: 1, borderColor: 'divider' }}>
          {editorMode === 'create' ? '📝 New Blog Post' : '📝 Edit Blog Post'}
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {/* Editor Tabs */}
          <Tabs value={editorTab} onChange={(_, v) => setEditorTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
            <Tab label="✍️ Write" />
            <Tab label="⚙️ Settings" />
          </Tabs>

          {/* TAB 0: WRITE */}
          {editorTab === 0 && (
            <Box sx={{ p: 3 }}>
              {/* Title */}
              <TextField
                autoFocus fullWidth placeholder="Enter post title..."
                value={formData.title} onChange={handleFormChange} name="title"
                variant="standard"
                sx={{ mb: 2, '& .MuiInputBase-input': { fontSize: 24, fontWeight: 'bold' } }}
              />

              {/* Excerpt */}
              <TextField
                fullWidth placeholder="Write a brief excerpt / summary..."
                value={formData.excerpt} onChange={handleFormChange} name="excerpt"
                multiline rows={2} size="small" sx={{ mb: 2 }}
                helperText="Short description shown in post cards and SEO"
              />

              <Divider sx={{ my: 2 }} />

              {/* Markdown Toolbar */}
              <Box display="flex" gap={0.5} mb={1} flexWrap="wrap">
                <Tooltip title="Heading">
                  <IconButton size="small" onClick={() => insertMarkdown('## ', '')}><TitleIcon fontSize="small" /></IconButton>
                </Tooltip>
                <Tooltip title="Bold">
                  <IconButton size="small" onClick={() => insertMarkdown('**', '**')}><BoldIcon fontSize="small" /></IconButton>
                </Tooltip>
                <Tooltip title="Italic">
                  <IconButton size="small" onClick={() => insertMarkdown('*', '*')}><ItalicIcon fontSize="small" /></IconButton>
                </Tooltip>
                <Tooltip title="Bullet List">
                  <IconButton size="small" onClick={() => insertMarkdown('- ', '')}><ListIcon fontSize="small" /></IconButton>
                </Tooltip>
                <Tooltip title="Blockquote">
                  <IconButton size="small" onClick={() => insertMarkdown('> ', '')}><QuoteIcon fontSize="small" /></IconButton>
                </Tooltip>
                <Tooltip title="Code Block">
                  <IconButton size="small" onClick={() => insertMarkdown('```\n', '\n```')}><CodeIcon fontSize="small" /></IconButton>
                </Tooltip>
                <Typography variant="caption" color="textSecondary" sx={{ ml: 1, alignSelf: 'center' }}>
                  Markdown supported • ~{formData.content.split(/\s+/).filter(Boolean).length} words • ~{Math.max(1, Math.ceil(formData.content.split(/\s+/).filter(Boolean).length / 200))} min read
                </Typography>
              </Box>

              {/* Content Editor */}
              <TextField
                name="content"
                multiline fullWidth minRows={20}
                value={formData.content} onChange={handleFormChange}
                placeholder="Write your blog post content here...

## Section Heading

Write your content using **markdown** formatting:

- Bullet points for lists
- **Bold text** for emphasis
- *Italic text* for subtle emphasis
- > Blockquotes for highlighted text
- \`inline code\` for technical terms

### Sub-heading

More content here...

```code
Code blocks for snippets
```"
                sx={{
                  '& textarea': {
                    fontFamily: '"Fira Code", "Consolas", "Monaco", monospace',
                    fontSize: 14,
                    lineHeight: 1.7,
                    tabSize: 2,
                  }
                }}
              />
            </Box>
          )}

          {/* TAB 1: SETTINGS */}
          {editorTab === 1 && (
            <Box sx={{ p: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  {/* Cover Image */}
                  <Card sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      <ImageIcon sx={{ mr: 0.5, verticalAlign: 'middle' }} /> Cover Image
                    </Typography>
                    <TextField
                      fullWidth size="small" name="cover_image"
                      label="Image URL" value={formData.cover_image}
                      onChange={handleFormChange}
                      placeholder="https://example.com/cover.jpg"
                    />
                    {formData.cover_image && (
                      <Box mt={1}>
                        <img src={formData.cover_image} alt="Preview" style={{ width: '100%', maxHeight: 150, objectFit: 'cover', borderRadius: 8 }} />
                      </Box>
                    )}
                  </Card>

                  {/* Category & Tags */}
                  <Card sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      <CategoryIcon sx={{ mr: 0.5, verticalAlign: 'middle' }} /> Category & Tags
                    </Typography>
                    <FormControl fullWidth size="small" margin="dense">
                      <InputLabel>Category</InputLabel>
                      <Select name="category" value={formData.category} onChange={handleFormChange} label="Category">
                        <MenuItem value="general">General</MenuItem>
                        <MenuItem value="admissions">Admissions</MenuItem>
                        <MenuItem value="scholarships">Scholarships</MenuItem>
                        <MenuItem value="programs">Programs</MenuItem>
                        <MenuItem value="rankings">Rankings</MenuItem>
                        <MenuItem value="tips">Tips & Advice</MenuItem>
                        <MenuItem value="news">News</MenuItem>
                        <MenuItem value="guides">Guides</MenuItem>
                        <MenuItem value="comparison">Comparison</MenuItem>
                        <MenuItem value="career">Career</MenuItem>
                      </Select>
                    </FormControl>
                    <Box display="flex" gap={0.5} mt={1}>
                      <TextField
                        size="small" placeholder="Add tag..."
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                        sx={{ flex: 1 }}
                      />
                      <Button variant="outlined" size="small" onClick={handleAddTag}>Add</Button>
                    </Box>
                    <Box display="flex" gap={0.5} mt={1} flexWrap="wrap">
                      {formData.tags.map(tag => (
                        <Chip key={tag} label={tag} size="small" onDelete={() => handleRemoveTag(tag)} />
                      ))}
                    </Box>
                  </Card>

                  {/* Author */}
                  <Card sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Author</Typography>
                    <TextField
                      fullWidth size="small" name="author_name"
                      label="Author Name" value={formData.author_name}
                      onChange={handleFormChange}
                    />
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  {/* Publish Settings */}
                  <Card sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Publishing</Typography>
                    <FormControlLabel
                      control={<Switch checked={formData.published} onChange={handleFormChange} name="published" />}
                      label="Published"
                    />
                    <FormControlLabel
                      control={<Switch checked={formData.featured} onChange={handleFormChange} name="featured" />}
                      label="Featured Post"
                    />
                    <Typography variant="caption" color="textSecondary" display="block">
                      Featured posts appear at the top of the blog page
                    </Typography>
                  </Card>

                  {/* SEO Settings */}
                  <Card sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>SEO Settings</Typography>
                    <TextField
                      fullWidth size="small" name="slug" label="URL Slug"
                      value={formData.slug} onChange={handleFormChange}
                      helperText={`Blog URL: /blog/${formData.slug || 'post-slug'}`}
                      sx={{ mb: 1 }}
                    />
                    <TextField
                      fullWidth size="small" name="meta_title" label="Meta Title"
                      value={formData.meta_title} onChange={handleFormChange}
                      helperText="Leave empty to use post title"
                      sx={{ mb: 1 }}
                    />
                    <TextField
                      fullWidth size="small" name="meta_description" label="Meta Description"
                      multiline rows={2} value={formData.meta_description}
                      onChange={handleFormChange}
                      helperText="Recommended: 150-160 characters for Google"
                    />
                  </Card>

                  {/* Post Stats */}
                  <Card sx={{ p: 2 }}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Post Statistics</Typography>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" color="textSecondary">Word Count</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {formData.content.split(/\s+/).filter(Boolean).length}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" color="textSecondary">Read Time</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        ~{Math.max(1, Math.ceil(formData.content.split(/\s+/).filter(Boolean).length / 200))} min
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" color="textSecondary">Characters</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {formData.content.length}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="textSecondary">Tags</Typography>
                      <Typography variant="body2" fontWeight="bold">{formData.tags.length}</Typography>
                    </Box>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={() => setOpenEditor(false)} disabled={saving}>Cancel</Button>
          <Button onClick={() => { setFormData(prev => ({ ...prev, published: false })); }} disabled={saving}>
            Save as Draft
          </Button>
          <Button onClick={handleSave} variant="contained" color="primary" disabled={saving}>
            {saving ? 'Publishing...' : editorMode === 'create' ? 'Publish Post' : 'Update Post'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BlogManager;
