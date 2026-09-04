import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Container, Box, Typography, Button, Skeleton, Alert, Breadcrumbs, Link
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { ArrowBack as BackIcon } from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import { pageService } from '../services/page.service.js';

const PageContent = styled(Box)(({ theme }) => ({
  fontSize: '1.1rem',
  lineHeight: 1.8,
  color: theme.palette.text.primary,
  '& h1': { fontSize: '2rem', fontWeight: 700, marginTop: '0', marginBottom: '1.5rem', color: theme.palette.primary.main },
  '& h2': { fontSize: '1.6rem', fontWeight: 700, marginTop: '2rem', marginBottom: '1rem', color: theme.palette.primary.dark },
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
  '& hr': { border: 'none', borderTop: `1px solid ${theme.palette.divider}`, margin: '2rem 0' },
  '& img': { maxWidth: '100%', borderRadius: 2, marginBottom: '1rem' },
}));

/** Convert markdown-ish content to basic HTML */
function formatContent(text) {
  if (!text) return '';
  let html = text
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^---$/gm, '<hr>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');

  html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
  html = html.replace(/<\/ul>\s*<ul>/g, '');

  return `<p>${html}</p>`;
}

// ============================================================
// CMS PAGE VIEWER — renders any site page by slug
// ============================================================
const CmsPage = () => {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPage();
  }, [slug]);

  const loadPage = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await pageService.getPageBySlug(slug);
      setPage(data);
    } catch (err) {
      console.error('Error loading page:', err);
      setError('Page not found or has been removed.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Skeleton variant="text" width="60%" height={40} />
        <Skeleton variant="text" width="40%" height={20} sx={{ mb: 3 }} />
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
      </Container>
    );
  }

  if (error || !page) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 3 }}>{error || 'Page not found'}</Alert>
        <Button component={RouterLink} to="/" startIcon={<BackIcon />}>Back to Home</Button>
      </Container>
    );
  }

  const metaTitle = page.meta_title || `${page.title} | FindMyUni`;
  const metaDesc = page.meta_description || '';

  return (
    <>
      <Helmet>
        <title>{metaTitle}</title>
        {metaDesc && <meta name="description" content={metaDesc} />}
        <meta property="og:title" content={metaTitle} />
        {metaDesc && <meta property="og:description" content={metaDesc} />}
        <meta property="og:type" content="website" />
        {page.cover_image && <meta property="og:image" content={page.cover_image} />}
        <link rel="canonical" href={`https://findmyuni.com/pages/${page.slug}`} />
      </Helmet>

      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link component={RouterLink} to="/" underline="hover" color="inherit">Home</Link>
          <Typography color="text.primary">{page.title}</Typography>
        </Breadcrumbs>

        {/* Cover image */}
        {page.cover_image && (
          <Box mb={4}>
            <img
              src={page.cover_image}
              alt={page.title}
              style={{ width: '100%', maxHeight: 400, objectFit: 'cover', borderRadius: 12 }}
            />
          </Box>
        )}

        {/* Page content */}
        <PageContent>
          <div dangerouslySetInnerHTML={{ __html: formatContent(page.content) }} />
        </PageContent>

        {/* Back button */}
        <Box mt={4}>
          <Button component={RouterLink} to="/" startIcon={<BackIcon />}>
            Back to Home
          </Button>
        </Box>
      </Container>
    </>
  );
};

export default CmsPage;
