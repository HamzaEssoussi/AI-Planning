import axios, { type AxiosRequestConfig } from 'axios';

const envApiUrl = import.meta.env.VITE_API_URL;
const API_URL = typeof window !== 'undefined' && envApiUrl?.includes('://backend:8000')
  ? ''
  : (envApiUrl || '');

console.info('API client baseURL:', API_URL || 'relative /api path');

const SESSION_ID = 'default';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  config.params = {
    ...config.params,
    session_id: SESSION_ID,
  };
  console.info('[api] request', config.method, config.baseURL ? config.baseURL + config.url : config.url, config.params, config.data);
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    console.info('[api] response success', response.status, response.config.method, response.config.url);
    return response;
  },
  (error) => {
    console.error('[api] response error', error?.response?.status, error?.config?.method, error?.config?.url, error?.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const api = {
  post: (path: string, data: any, config?: AxiosRequestConfig) => apiClient.post(path, data, config),
  get: (path: string, config?: AxiosRequestConfig) => apiClient.get(path, config),
};
