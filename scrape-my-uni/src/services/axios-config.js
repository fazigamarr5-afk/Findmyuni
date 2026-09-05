import axios from 'axios';

// Create an Axios instance with the correct base URL
// Production: same-origin /api (fail fast → services fall back to Supabase).
// Dev: localhost:8000 (Vite proxy). Override with VITE_API_URL when a real
// backend is deployed.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// A real API answers with JSON. If a 200 comes back with any other content
// type (e.g. hosting rewrites serving index.html), reject it so callers hit
// their catch block and fall back to Supabase instead of parsing HTML as data.
api.interceptors.response.use(
  (response) => {
    const data = response.data;
    const contentType = String(response.headers?.['content-type'] || '');
    // Only reject when there is actually a non-JSON body (HTML pages, text).
    // Empty bodies (204/205) and pre-parsed JSON objects pass through.
    const hasHtmlishBody = typeof data === 'string' && data.trim() !== '';
    if (hasHtmlishBody && !contentType.includes('application/json')) {
      return Promise.reject(
        new Error(`Non-JSON API response (content-type: ${contentType || 'none'})`)
      );
    }
    return response;
  },
  (error) => Promise.reject(error)
);

export default api; 