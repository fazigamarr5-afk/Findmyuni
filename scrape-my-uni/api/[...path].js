// Catch-all Vercel serverless function: any /api/* request with no real
// backend deployed gets a proper JSON error (instead of the SPA's index.html
// with a 200), so the frontend services fail fast and fall back to Supabase.
// When a FastAPI backend is deployed, set VITE_API_URL to its URL and this
// function becomes unused.
module.exports = (req, res) => {
  res.status(503).json({
    error: 'api_not_deployed',
    message: 'Backend API is not deployed; the app uses Supabase directly.',
  });
};
