import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container, Box, Typography, Grid, Card, CardContent, CardMedia,
  CardActions, Button, TextField, Chip, InputAdornment, Pagination,
  CircularProgress, Alert, Divider, Skeleton
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Search as SearchIcon, CalendarToday as CalendarIcon,
  AccessTime as TimeIcon, Visibility as ViewsIcon,
  TrendingUp as TrendingIcon, ArrowForward as ArrowIcon,
  Category as CategoryIcon
} from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import { blogService } from '../services/blog.service.js';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 16,
  transition: 'transform 0.2s, box-shadow 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}));

const CategoryChip = styled(Chip)(({ theme, active }) => ({
  cursor: 'pointer',
  fontWeight: active ? 700 : 400,
  backgroundColor: active ? theme.palette.primary.main : 'transparent',
  color: active ? '#fff' : theme.palette.text.primary,
  border: active ? 'none' : `1px solid ${theme.palette.divider}`,
  '&:hover': {
    backgroundColor: active ? theme.palette.primary.dark : theme.palette.action.hover,
  },
}));

const HeroSection = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 50%, #01579b 100%)',
  color: '#fff',
  padding: theme.spacing(8, 0, 6),
  marginBottom: theme.spacing(4),
}));

// ============================================================
// BLOG LIST PAGE
// ============================================================
const BlogList = () => {
  const [posts, setPosts] = useState([]);
  const [featuredPosts, setFeaturedPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    loadInitial();
  }, []);

  useEffect(() => {
    loadPosts();
  }, [page, category, search]);

  const loadInitial = async () => {
    try {
      setLoading(true);
      const [featured, cats] = await Promise.all([
        blogService.getFeaturedPosts(3).catch(() => []),
        blogService.getCategories().catch(() => []),
      ]);
      setFeaturedPosts(featured);
      setCategories(cats);
      await loadPosts();
    } catch (err) {
      console.error('Error loading blog:', err);
      if (err.message?.includes('does not exist') || err.message?.includes('schema cache')) {
        setError('BLOG_NOT_SETUP');
      } else {
        setError('Failed to load blog posts');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      const result = await blogService.getPosts({
        page,
        limit: 9,
        category: category === 'all' ? null : category,
        search: search || null,
      });
      setPosts(result.posts);
      setTotalPages(result.totalPages);
    } catch (err) {
      console.error('Error loading posts:', err);
      if (err.message?.includes('does not exist') || err.message?.includes('schema cache')) {
        setError('BLOG_NOT_SETUP');
      } else {
        setError('Failed to load blog posts');
      }
      throw err; // Re-throw so loadInitial can catch it
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadPosts();
  };

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    setPage(1);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  // ============================================================
  // FEATURED POST CARD (large hero)
  // ============================================================
  const renderFeatured = () => {
    if (featuredPosts.length === 0) return null;
    const main = featuredPosts[0];
    
    return (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <StyledCard sx={{ cursor: 'pointer' }}>
            <CardMedia
              component="img"
              height="300"
              image={main.cover_image || 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800'}
              alt={main.title}
              sx={{ objectFit: 'cover' }}
            />
            <CardContent sx={{ flexGrow: 1 }}>
              <Box display="flex" gap={1} mb={1}>
                <Chip size="small" label={main.category} color="primary" variant="outlined" />
                {main.featured && <Chip size="small" label="Featured" color="secondary" />}
              </Box>
              <Typography variant="h5" fontWeight="bold" gutterBottom
                component={RouterLink} to={`/blog/${main.slug}`}
                sx={{ textDecoration: 'none', color: 'inherit', '&:hover': { color: 'primary.main' } }}>
                {main.title}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                {main.excerpt}
              </Typography>
              <Box display="flex" gap={2} alignItems="center" color="text.secondary">
                <Box display="flex" alignItems="center" gap={0.5}>
                  <CalendarIcon fontSize="small" />
                  <Typography variant="caption">{formatDate(main.created_at)}</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <TimeIcon fontSize="small" />
                  <Typography variant="caption">{main.read_time_minutes || 5} min read</Typography>
                </Box>
              </Box>
            </CardContent>
            <CardActions sx={{ px: 2, pb: 2 }}>
              <Button component={RouterLink} to={`/blog/${main.slug}`} endIcon={<ArrowIcon />}>
                Read Article
              </Button>
            </CardActions>
          </StyledCard>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Box display="flex" flexDirection="column" gap={2}>
            {featuredPosts.slice(1, 3).map((post) => (
              <StyledCard key={post.id} sx={{ cursor: 'pointer' }}>
                <CardMedia
                  component="img"
                  height="120"
                  image={post.cover_image || 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400'}
                  alt={post.title}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ py: 1.5 }}>
                  <Chip size="small" label={post.category} sx={{ mb: 1 }} />
                  <Typography variant="subtitle1" fontWeight="bold" noWrap
                    component={RouterLink} to={`/blog/${post.slug}`}
                    sx={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                    {post.title}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {formatDate(post.created_at)} · {post.read_time_minutes || 5} min
                  </Typography>
                </CardContent>
              </StyledCard>
            ))}
          </Box>
        </Grid>
      </Grid>
    );
  };

  // ============================================================
  // POST CARD
  // ============================================================
  const renderPostCard = (post) => (
    <Grid item xs={12} sm={6} md={4} key={post.id}>
      <StyledCard>
        <CardMedia
          component="img"
          height="180"
          image={post.cover_image || 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400'}
          alt={post.title}
          sx={{ objectFit: 'cover' }}
        />
        <CardContent sx={{ flexGrow: 1 }}>
          <Box display="flex" gap={0.5} mb={1} flexWrap="wrap">
            <Chip size="small" label={post.category} color="primary" variant="outlined" />
            {(post.tags || []).slice(0, 2).map((tag) => (
              <Chip key={tag} size="small" label={tag} variant="outlined" sx={{ fontSize: 11 }} />
            ))}
          </Box>
          <Typography variant="h6" fontWeight="bold" gutterBottom
            component={RouterLink} to={`/blog/${post.slug}`}
            sx={{
              textDecoration: 'none', color: 'inherit',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              overflow: 'hidden', '&:hover': { color: 'primary.main' },
            }}>
            {post.title}
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {post.excerpt}
          </Typography>
        </CardContent>
        <CardActions sx={{ px: 2, pb: 2, pt: 0, justifyContent: 'space-between' }}>
          <Box display="flex" gap={1.5} alignItems="center" color="text.secondary">
            <Box display="flex" alignItems="center" gap={0.5}>
              <CalendarIcon sx={{ fontSize: 14 }} />
              <Typography variant="caption">{formatDate(post.created_at)}</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={0.5}>
              <TimeIcon sx={{ fontSize: 14 }} />
              <Typography variant="caption">{post.read_time_minutes || 5}m</Typography>
            </Box>
          </Box>
          <Button component={RouterLink} to={`/blog/${post.slug}`} size="small" endIcon={<ArrowIcon />}>
            Read
          </Button>
        </CardActions>
      </StyledCard>
    </Grid>
  );

  // ============================================================
  // LOADING SKELETON
  // ============================================================
  const renderSkeleton = () => (
    <Grid container spacing={3}>
      {[...Array(6)].map((_, i) => (
        <Grid item xs={12} sm={6} md={4} key={i}>
          <Card sx={{ borderRadius: 3 }}>
            <Skeleton variant="rectangular" height={180} />
            <CardContent>
              <Skeleton variant="text" width="40%" height={20} />
              <Skeleton variant="text" width="90%" height={28} />
              <Skeleton variant="text" width="100%" height={20} />
              <Skeleton variant="text" width="70%" height={20} />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <>
      <Helmet>
        <title>Blog | FindMyUni — University Admissions Guide for Pakistan</title>
        <meta name="description" content="Expert guides on university admissions, scholarships, program comparisons, and education tips for Pakistani students. Stay updated with the latest admission news." />
        <meta property="og:title" content="Blog | FindMyUni" />
        <meta property="og:description" content="Expert guides on university admissions, scholarships, and education tips for Pakistani students." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://findmyuni.com/blog" />
      </Helmet>

      {/* Hero Section */}
      <HeroSection>
        <Container maxWidth="lg">
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            📚 University Admissions Blog
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, mb: 3 }}>
            Expert guides, tips, and news to help you navigate university admissions in Pakistan
          </Typography>
          
          {/* Search Bar */}
          <Box component="form" onSubmit={handleSearch} sx={{ maxWidth: 600 }}>
            <TextField
              fullWidth
              placeholder="Search articles... (e.g., NUST admissions, CS programs, scholarships)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#fff' }} />
                  </InputAdornment>
                ),
                sx: {
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  borderRadius: 3,
                  color: '#fff',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                  '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
                  '& input::placeholder': { color: 'rgba(255,255,255,0.7)' },
                },
              }}
            />
          </Box>
        </Container>
      </HeroSection>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {error === 'BLOG_NOT_SETUP' ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>📝 Blog Setup Required</Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>The blog table needs to be created in your Supabase database first.</Typography>
            <Typography variant="body2" sx={{ mb: 1 }}><strong>Step 1:</strong> Go to your <a href="https://supabase.com/dashboard" target="_blank">Supabase Dashboard</a> → SQL Editor</Typography>
            <Typography variant="body2" sx={{ mb: 1 }}><strong>Step 2:</strong> Run the SQL from <code>backend_project/scripts/create_blog_table.sql</code></Typography>
            <Typography variant="body2"><strong>Step 3:</strong> Run <code>python backend_project/scripts/seed_blog_posts.py</code> to add 10 SEO articles</Typography>
          </Alert>
        ) : error && (
          <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        )}

        {/* Categories */}
        <Box display="flex" gap={1} mb={4} flexWrap="wrap" alignItems="center">
          <CategoryIcon sx={{ color: 'text.secondary', mr: 1 }} />
          <CategoryChip label="All" active={category === 'all'} onClick={() => handleCategoryChange('all')} />
          {categories.map((cat) => (
            <CategoryChip
              key={cat.name}
              label={`${cat.name} (${cat.count})`}
              active={category === cat.name}
              onClick={() => handleCategoryChange(cat.name)}
            />
          ))}
        </Box>

        {loading ? (
          renderSkeleton()
        ) : (
          <>
            {/* Featured Posts */}
            {featuredPosts.length > 0 && category === 'all' && !search && renderFeatured()}

            {/* All Posts */}
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
              {search ? `Results for "${search}"` : category === 'all' ? 'All Articles' : category}
            </Typography>
            
            {posts.length === 0 ? (
              <Alert severity="info" sx={{ mb: 3 }}>
                No blog posts found. {search ? 'Try a different search term.' : 'Check back later for new content!'}
              </Alert>
            ) : (
              <Grid container spacing={3}>
                {posts.map(renderPostCard)}
              </Grid>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <Box display="flex" justifyContent="center" mt={4}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, p) => { setPage(p); window.scrollTo(0, 0); }}
                  color="primary"
                  size="large"
                />
              </Box>
            )}

            {/* Blog Stats */}
            <Box mt={6} p={4} sx={{ backgroundColor: 'action.hover', borderRadius: 3 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                📊 Blog Stats
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography variant="h4" fontWeight="bold" color="primary">
                    {categories.reduce((s, c) => s + c.count, 0)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">Total Articles</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="h4" fontWeight="bold" color="secondary">
                    {categories.length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">Categories</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    336
                  </Typography>
                  <Typography variant="body2" color="textSecondary">Universities Covered</Typography>
                </Grid>
              </Grid>
            </Box>
          </>
        )}
      </Container>
    </>
  );
};

export default BlogList;
