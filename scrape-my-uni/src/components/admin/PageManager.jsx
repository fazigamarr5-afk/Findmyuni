import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext.jsx';
import {
  Box, Typography, Button, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, CircularProgress,
  Alert, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Select, MenuItem, InputLabel, FormControl,
  Grid, Card, CardContent, Chip, Switch, Tooltip, FormControlLabel,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  DragIndicator as DragIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';
import { pageService } from '../../services/page.service.js';

// ============================================================
// PAGE MANAGER — CMS pages like About, Contact, FAQ, etc.
// ============================================================
const PageManager = () => {
  const { showToast } = useToast();

  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // create | edit
  const [selectedPage, setSelectedPage] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    meta_title: '',
    meta_description: '',
    cover_image: '',
    template: 'default',
    published: true,
    show_in_nav: false,
    nav_order: 0,
  });

  // ============================================================
  // DATA FETCHING
  // ============================================================
  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    setLoading(true);
    try {
      const data = await pageService.getAllPages();
      setPages(data);
    } catch (err) {
      console.error('Error fetching pages:', err);
      setError('Failed to load pages: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // DIALOG HANDLERS
  // ============================================================
  const handleCreate = () => {
    setDialogMode('create');
    setSelectedPage(null);
    setFormData({
      title: '',
      slug: '',
      content: '',
      meta_title: '',
      meta_description: '',
      cover_image: '',
      template: 'default',
      published: true,
      show_in_nav: false,
      nav_order: 0,
    });
    setOpenDialog(true);
  };

  const handleEdit = (page) => {
    setDialogMode('edit');
    setSelectedPage(page);
    setFormData({
      title: page.title || '',
      slug: page.slug || '',
      content: page.content || '',
      meta_title: page.meta_title || '',
      meta_description: page.meta_description || '',
      cover_image: page.cover_image || '',
      template: page.template || 'default',
      published: page.published !== false,
      show_in_nav: page.show_in_nav || false,
      nav_order: page.nav_order || 0,
    });
    setOpenDialog(true);
  };

  const handleFormChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleContentChange = (e) => {
    setFormData(prev => ({ ...prev, content: e.target.value }));
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      showToast('Title is required', 'error');
      return;
    }
    setSaving(true);
    try {
      if (dialogMode === 'create') {
        await pageService.createPage(formData);
        showToast('Page created successfully', 'success');
      } else {
        await pageService.updatePage(selectedPage.id, formData);
        showToast('Page updated successfully', 'success');
      }
      setOpenDialog(false);
      fetchPages();
    } catch (err) {
      showToast('Error saving page: ' + (err.message || 'Unknown'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (page) => {
    if (!window.confirm(`Delete page "${page.title}"? This cannot be undone.`)) return;
    try {
      await pageService.deletePage(page.id);
      showToast('Page deleted', 'success');
      fetchPages();
    } catch (err) {
      showToast('Error deleting page: ' + err.message, 'error');
    }
  };

  const handleTogglePublished = async (page) => {
    try {
      await pageService.updatePage(page.id, { published: !page.published });
      showToast(`Page ${page.published ? 'unpublished' : 'published'}`, 'success');
      fetchPages();
    } catch (err) {
      showToast('Error toggling page status', 'error');
    }
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
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h5" fontWeight="bold">📄 Site Pages</Typography>
            <Typography variant="body2" color="textSecondary">
              Manage static pages like About, Contact, FAQ, Terms, Privacy Policy, etc.
            </Typography>
          </Box>
          <Box display="flex" gap={1}>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchPages}>Refresh</Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>New Page</Button>
          </Box>
        </Box>
      </Paper>

      {/* Pages Table */}
      <Paper sx={{ overflow: 'hidden' }}>
        {pages.length === 0 ? (
          <Box p={4} textAlign="center">
            <Typography variant="h6" color="textSecondary" gutterBottom>No pages yet</Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Create your first page to get started with the CMS.
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>Create Page</Button>
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Order</strong></TableCell>
                  <TableCell><strong>Title</strong></TableCell>
                  <TableCell><strong>Slug</strong></TableCell>
                  <TableCell><strong>Template</strong></TableCell>
                  <TableCell><strong>In Nav</strong></TableCell>
                  <TableCell><strong>Published</strong></TableCell>
                  <TableCell><strong>Updated</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pages.map((page) => (
                  <TableRow key={page.id} hover sx={{ opacity: page.published ? 1 : 0.6 }}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <DragIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2">{page.nav_order || 0}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{page.title}</TableCell>
                    <TableCell>
                      <Chip size="small" label={`/${page.slug}`} variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={page.template} color="primary" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      {page.show_in_nav ? (
                        <Chip size="small" label="Yes" color="success" />
                      ) : (
                        <Chip size="small" label="No" color="default" />
                      )}
                    </TableCell>
                    <TableCell>
                      {page.published ? (
                        <VisibilityIcon color="success" fontSize="small" />
                      ) : (
                        <VisibilityOffIcon color="disabled" fontSize="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      {page.updated_at ? new Date(page.updated_at).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Page">
                        <IconButton size="small" color="info" href={`/pages/${page.slug}`} target="_blank">
                          <OpenInNewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={page.published ? 'Unpublish' : 'Publish'}>
                        <IconButton size="small" color="warning" onClick={() => handleTogglePublished(page)}>
                          {page.published ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" color="primary" onClick={() => handleEdit(page)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => handleDelete(page)}>
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
      {/* CREATE / EDIT DIALOG */}
      {/* ============================================================ */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {dialogMode === 'create' ? '📄 Create New Page' : '📄 Edit Page'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            {/* Left column: Content */}
            <Grid item xs={12} md={8}>
              <TextField
                autoFocus margin="dense" name="title" label="Page Title"
                fullWidth value={formData.title} onChange={handleFormChange}
                helperText="Used for display and auto-generating the URL slug"
              />
              <TextField
                margin="dense" name="slug" label="URL Slug"
                fullWidth value={formData.slug} onChange={handleFormChange}
                helperText={dialogMode === 'create' ? 'Auto-generated from title if left empty' : `Page URL: /pages/${formData.slug}`}
                placeholder="e.g., about-us, contact, faq"
              />
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
                Page Content (Markdown supported)
              </Typography>
              <TextField
                name="content" label="Page Content"
                multiline fullWidth
                minRows={15}
                value={formData.content} onChange={handleContentChange}
                sx={{ fontFamily: 'monospace', '& textarea': { fontSize: 14, lineHeight: 1.6 } }}
                placeholder="# Heading&#10;&#10;Write your page content here...&#10;&#10;## Sub-heading&#10;&#10;- List item 1&#10;- List item 2"
              />
            </Grid>

            {/* Right column: Settings */}
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom fontWeight="bold">Publishing</Typography>
                <FormControlLabel
                  control={<Switch checked={formData.published} onChange={handleFormChange} name="published" />}
                  label="Published"
                />
                <FormControlLabel
                  control={<Switch checked={formData.show_in_nav} onChange={handleFormChange} name="show_in_nav" />}
                  label="Show in Navigation"
                />
                <TextField
                  margin="dense" name="nav_order" label="Nav Order"
                  type="number" fullWidth size="small"
                  value={formData.nav_order} onChange={handleFormChange}
                  helperText="Lower numbers appear first"
                />
              </Card>

              <Card sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom fontWeight="bold">Template</Typography>
                <FormControl fullWidth size="small" margin="dense">
                  <InputLabel>Template</InputLabel>
                  <Select name="template" value={formData.template} onChange={handleFormChange} label="Template">
                    <MenuItem value="default">Default</MenuItem>
                    <MenuItem value="wide">Wide (Full Width)</MenuItem>
                    <MenuItem value="sidebar">With Sidebar</MenuItem>
                    <MenuItem value="landing">Landing Page</MenuItem>
                  </Select>
                </FormControl>
              </Card>

              <Card sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom fontWeight="bold">Cover Image</Typography>
                <TextField
                  margin="dense" name="cover_image" label="Image URL"
                  fullWidth size="small"
                  value={formData.cover_image} onChange={handleFormChange}
                  placeholder="https://example.com/image.jpg"
                />
              </Card>

              <Card sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom fontWeight="bold">SEO</Typography>
                <TextField
                  margin="dense" name="meta_title" label="Meta Title"
                  fullWidth size="small"
                  value={formData.meta_title} onChange={handleFormChange}
                  helperText="Leave empty to use page title"
                />
                <TextField
                  margin="dense" name="meta_description" label="Meta Description"
                  multiline rows={2} fullWidth size="small"
                  value={formData.meta_description} onChange={handleFormChange}
                  helperText="Recommended: 150-160 characters"
                />
              </Card>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpenDialog(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary" disabled={saving}>
            {saving ? 'Saving...' : dialogMode === 'create' ? 'Create Page' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PageManager;
