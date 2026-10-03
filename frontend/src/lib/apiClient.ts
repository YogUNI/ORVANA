import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Interceptor untuk menyematkan Access Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('orvana_access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Interceptor untuk unwrap data dan penanganan galat
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error: AxiosError<{ error?: { code?: string; message?: string } }>) => {
    const errorData = error.response?.data?.error;
    const message = errorData?.message || 'Terjadi kendala pada jaringan, silakan coba lagi.';
    return Promise.reject(new Error(message));
  },
);
