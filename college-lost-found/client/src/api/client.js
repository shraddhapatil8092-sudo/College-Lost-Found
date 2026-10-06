import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('college-lost-found-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use((response) => {
  if (response.data?.success === true && Object.hasOwn(response.data, 'data')) {
    response.data = response.data.data;
  }
  return response;
});

export function getApiError(error, fallback = 'Something went wrong. Please try again.') {
  const responseError = error.response?.data;
  const detail = responseError?.error?.details?.[0]?.message;
  return detail || responseError?.message || fallback;
}

export default api;