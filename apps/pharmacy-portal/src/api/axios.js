import { createClient } from '@nhr/shared';

const api = createClient(
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  () => {
    // Shared onUnauthorized logic
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
);

export default api;
