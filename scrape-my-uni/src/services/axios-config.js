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

export default api; 