import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Container, Box, Typography, Grid, Card, CardContent, CardMedia,
  Chip, Button, Divider, Skeleton, Alert, Breadcrumbs, Link, Avatar,
  List, ListItem, ListItemText
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  CalendarToday as CalendarIcon, AccessTime as TimeIcon,
  Visibility as ViewsIcon, ArrowBack as BackIcon,
  Share as ShareIcon, Facebook as FacebookIcon,
  Twitter as TwitterIcon, Link as LinkIcon,
  TrendingUp as TrendingIcon
} from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import { blogService } from '../services/blog.service.js';

const ArticleContent = styled(Box)(({ theme }) => ({
  fontSize: '1.1rem',
  lineHeight: 1.8,
  color: theme.palette.text.primary,
  '& h2': { fontSize: '1.6rem', fontWeight: 700, marginTop: '2rem', marginBottom: '1rem', color: theme.palette.primary.main },
  '& h3': { fontSize: '1.3rem', fontWeight: 600, marginTop: '1.5rem', marginBottom: '0.75rem' },
  '& p': { marginBottom: '1.2rem' },
  '& ul, & ol': { paddingLeft: '1.5rem', marginBottom: '1.2rem' },
  '& li': { marginBottom: '0.5rem' },
  '& strong': { color: theme.palette.primary.dark },
  '& blockquote': {
    borderLeft: `4px solid ${theme.palette.primary.main}`,
    paddingLeft: '1rem',
    marginLeft: 0,
    fontStyle: 'italic',
    color: theme.palette.text.secondary,
    backgroundColor: theme.palette.action.hover,
    padding: '1rem',
    borderRadius: '0 8px 8px 0',
    marginBottom: '1.2rem',
  },
  '& a': { color: theme.palette.primary.main, textDecoration: 'underline' },
  '& table': { width: '100%', borderCollapse: 'collapse', marginBottom: '1.2rem' },
  '& th, & td': { border: `1px solid ${theme.palette.divider}`, padding: '0.75rem', textAlign: 'left' },
  '& th': { backgroundColor: theme.palette.action.hover, fontWeight: 600 },
}));

// ============================================================
// BLOG POST PAGE
// ============================================================
const BlogPost = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPost();
  }, [slug]);

  const loadPost = async () => {
    try {
      setLoading(true);
      setError('');
      
      const fetchedPost = await blogService.getPostBySlug(slug);
      setPost(fetchedPost);
      
      // Increment views
      blogService.incrementViews(fetchedPost.id);
      
      // Load related posts
      const recent = await blogService.getRecentPosts(4, slug);
      setRelatedPosts(recent);
    } catch (err) {
      console.error('Error loading blog post:', err);
      setError('Blog post not found or has been removed.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  const handleShare = (platform) => {
    const url = window.location.href;
    const title = post?.title || '';
    
    if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'copy') {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  const renderTableOfContents = () => {
    if (!post?.content) return null;
    const headings = [];
    const regex = /#{2,3}\s+(.+)/g;
    let match;
    while ((match = regex.exec(post.content)) !== null) {
      headings.push(match[1].replace(/[*_`]/g, ''));
    }
    if (headings.length < 2) return null;

    return (
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>📑 Table of Contents</Typography>
          <List dense>
            {headings.map((h, i) => (
              <ListItem key={i} sx={{ pl: 0 }}>
                <ListItemText
                  primary={h}
                  primaryTypographyProps={{
                    variant: 'body2',
                    sx: {
                      cursor: 'pointer',
                      '&:hover': { color: 'primary.main' },
                    }
                  }}
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    );
  };

  // ============================================================
  // RENDER
  // ============================================================
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Skeleton variant="text" width="60%" height={40} />
        <Skeleton variant="text" width="40%" height={20} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3, mb: 3 }} />
        <Skeleton variant="text" width="100%" height={24} />
        <Skeleton variant="text" width="100%" height={24} />
        <Skeleton variant="text" width="80%" height={24} />
      </Container>
    );
  }

  if (error || !post) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 3 }}>{error || 'Post not found'}</Alert>
        <Button component={RouterLink} to="/blog" startIcon={<BackIcon />}>Back to Blog</Button>
      </Container>
    );
  }

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const metaTitle = post.meta_title || `${post.title} | FindMyUni Blog`;
  const metaDesc = post.meta_description || post.excerpt || '';

  return (
    <>
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDesc} />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={shareUrl} />
        {post.cover_image && <meta property="og:image" content={post.cover_image} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDesc} />
        {post.cover_image && <meta name="twitter:image" content={post.cover_image} />}
        <link rel="canonical" href={`https://findmyuni.site/blog/${post.slug}`} />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: post.title,
            description: metaDesc,
            author: { '@type': 'Person', name: post.author_name || 'FindMyUni Team' },
            datePublished: post.created_at,
            dateModified: post.updated_at,
            image: post.cover_image,
            publisher: { '@type': 'Organization', name: 'FindMyUni' },
          })}
        </script>
      </Helmet>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link component={RouterLink} to="/" underline="hover" color="inherit">Home</Link>
          <Link component={RouterLink} to="/blog" underline="hover" color="inherit">Blog</Link>
          <Typography color="text.primary" noWrap sx={{ maxWidth: 300 }}>{post.title}</Typography>
        </Breadcrumbs>

        <Grid container spacing={4}>
          {/* Main Content */}
          <Grid item xs={12} md={8}>
            {/* Article Header */}
            <Box mb={3}>
              <Box display="flex" gap={1} mb={2} flexWrap="wrap">
                <Chip label={post.category} color="primary" />
                {post.featured && <Chip label="Featured" color="secondary" />}
                {(post.tags || []).map((tag) => (
                  <Chip key={tag} label={tag} variant="outlined" size="small" />
                ))}
              </Box>
              
              <Typography variant="h3" fontWeight="bold" gutterBottom sx={{ lineHeight: 1.3 }}>
                {post.title}
              </Typography>
              
              {post.excerpt && (
                <Typography variant="h6" color="textSecondary" sx={{ mb: 2, fontStyle: 'italic' }}>
                  {post.excerpt}
                </Typography>
              )}

              {/* Author & Meta */}
              <Box display="flex" alignItems="center" gap={2} mb={3}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  {(post.author_name || 'F')[0]}
                </Avatar>
                <Box>
                  <Typography variant="body2" fontWeight="bold">{post.author_name || 'FindMyUni Team'}</Typography>
                  <Box display="flex" gap={2} alignItems="center" color="text.secondary">
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <CalendarIcon sx={{ fontSize: 14 }} />
                      <Typography variant="caption">{formatDate(post.created_at)}</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <TimeIcon sx={{ fontSize: 14 }} />
                      <Typography variant="caption">{post.read_time_minutes || 5} min read</Typography>
                    </Box>
                    {post.views > 0 && (
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <ViewsIcon sx={{ fontSize: 14 }} />
                        <Typography variant="caption">{post.views} views</Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Cover Image */}
            {post.cover_image && (
              <Box mb={4}>
                <CardMedia
                  component="img"
                  height="400"
                  image={post.cover_image}
                  alt={post.title}
                  sx={{ borderRadius: 3, objectFit: 'cover' }}
                />
              </Box>
            )}

            {/* Article Content */}
            <ArticleContent>
              <div dangerouslySetInnerHTML={{ __html: formatContent(post.content) }} />
            </ArticleContent>

            {/* Share Buttons */}
            <Box mt={4} p={3} sx={{ backgroundColor: 'action.hover', borderRadius: 3 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>Share this article</Typography>
              <Box display="flex" gap={1}>
                <Button variant="outlined" startIcon={<TwitterIcon />} onClick={() => handleShare('twitter')} size="small">
                  Twitter
                </Button>
                <Button variant="outlined" startIcon={<FacebookIcon />} onClick={() => handleShare('facebook')} size="small">
                  Facebook
                </Button>
                <Button variant="outlined" startIcon={<LinkIcon />} onClick={() => handleShare('copy')} size="small">
                  Copy Link
                </Button>
              </Box>
            </Box>

            {/* Back to Blog */}
            <Box mt={3}>
              <Button component={RouterLink} to="/blog" startIcon={<BackIcon />}>
                Back to All Articles
              </Button>
            </Box>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            {/* Table of Contents */}
            {renderTableOfContents()}

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    <TrendingIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Related Articles
                  </Typography>
                  {relatedPosts.map((rp) => (
                    <Box key={rp.id} mb={2}>
                      <Box display="flex" gap={1}>
                        {rp.cover_image && (
                          <CardMedia
                            component="img"
                            width={80}
                            height={60}
                            image={rp.cover_image}
                            alt={rp.title}
                            sx={{ borderRadius: 1, objectFit: 'cover', flexShrink: 0 }}
                          />
                        )}
                        <Box>
                          <Typography
                            variant="body2" fontWeight="bold"
                            component={RouterLink} to={`/blog/${rp.slug}`}
                            sx={{ textDecoration: 'none', color: 'inherit', '&:hover': { color: 'primary.main' } }}
                            display="-webkit-box" overflow="hidden" WebkitBoxOrient="vertical" WebkitLineClamp={2}
                          >
                            {rp.title}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {formatDate(rp.created_at)}
                          </Typography>
                        </Box>
                      </Box>
                      <Divider sx={{ mt: 1.5 }} />
                    </Box>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* CTA Card */}
            <Card sx={{ mt: 3, borderRadius: 3, background: 'linear-gradient(135deg, #1a237e, #0d47a1)', color: '#fff' }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  🎓 Find Your Perfect University
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
                  Explore 336 Pakistani universities with programs, rankings, deadlines, and scholarships.
                </Typography>
                <Button variant="contained" color="secondary" component={RouterLink} to="/universities" fullWidth>
                  Browse Universities
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </>
  );
};

// ============================================================
// HELPERS
// ============================================================

/** Convert markdown-ish content to basic HTML */
function formatContent(text) {
  if (!text) return '';
  let html = text
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    // Bold / italic
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Lists
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    // Paragraphs
    .replace(/\n\n/g, '</p><p>')
    // Line breaks
    .replace(/\n/g, '<br>');
  
  // Wrap list items
  html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
  // Remove nested ul
  html = html.replace(/<\/ul>\s*<ul>/g, '');
  
  return `<p>${html}</p>`;
}

export default BlogPost;
