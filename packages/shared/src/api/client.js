import axios from 'axios';

const createClient = (baseURL, onUnauthorized) => {
  const api = axios.create({
    baseURL: baseURL || 'http://localhost:5000/api',
  });

  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401 && onUnauthorized) {
        onUnauthorized();
      }
      return Promise.reject(error);
    }
  );

  return api;
};

export default createClient;
