import Axios from 'axios';
import type { AxiosRequestConfig } from 'axios';
import { getToken, removeToken } from '@/utils/auth';

export const AXIOS_INSTANCE = Axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

AXIOS_INSTANCE.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.method && ['post', 'put', 'patch'].includes(config.method)) {
      config.headers['Idempotency-Key'] = crypto.randomUUID();
    }
    return config;
  },
  (error) => Promise.reject(error),
);

AXIOS_INSTANCE.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url ?? '';
      // 로그인 엔드포인트의 401은 가로채지 않음 (잘못된 자격 증명)
      if (requestUrl !== '/api/v1/auth/token') {
        removeToken();
        window.dispatchEvent(new CustomEvent('auth:expired'));
        return Promise.reject(new Error('인증이 만료되었습니다. 다시 로그인해주세요.'));
      }
    }
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('요청 시간이 초과되었습니다. 다시 시도해주세요.'));
    }
    if (!error.response) {
      return Promise.reject(new Error('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.'));
    }
    const message = error.response?.data?.detail || '예상치 못한 오류가 발생했습니다';
    return Promise.reject(new Error(message));
  },
);

export const customInstance = <T>(config: AxiosRequestConfig): Promise<T> => {
  const promise = AXIOS_INSTANCE(config).then(({ data }) => data);
  return promise;
};

export default customInstance;
