import Axios from 'axios';
import type { AxiosRequestConfig } from 'axios';

export const AXIOS_INSTANCE = Axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

AXIOS_INSTANCE.interceptors.request.use((config) => {
  if (config.method && ['post', 'put', 'patch'].includes(config.method)) {
    config.headers['Idempotency-Key'] = crypto.randomUUID();
  }
  return config;
});

AXIOS_INSTANCE.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail || 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  },
);

export const customInstance = <T>(config: AxiosRequestConfig): Promise<T> => {
  const promise = AXIOS_INSTANCE(config).then(({ data }) => data);
  return promise;
};

export default customInstance;
