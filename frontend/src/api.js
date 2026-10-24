import axios from 'axios';

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === '127.0.0.1') return 'http://127.0.0.1:8000';
    if (host === 'localhost') return 'http://localhost:8000';
    if (host) return `http://${host}:8000`;
  }
  return 'http://127.0.0.1:8000';
};

const API_BASE_URL = getBaseUrl();

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export const api = {
  // Health check
  getHealth: async () => {
    const res = await apiClient.get('/health');
    return res.data;
  },

  // Metadata for dropdowns & bounds
  getMetadata: async () => {
    const res = await apiClient.get('/metadata');
    return res.data;
  },

  // Model metrics, comparisons, and chart points
  getModelInfo: async () => {
    const res = await apiClient.get('/model-info');
    return res.data;
  },

  // Predict price
  predict: async (payload) => {
    const res = await apiClient.post('/predict', payload);
    return res.data;
  },

  // History with optional search and limit
  getHistory: async (params = {}) => {
    const res = await apiClient.get('/history', { params });
    return res.data;
  },

  // Delete single history item
  deleteHistoryItem: async (id) => {
    const res = await apiClient.delete(`/history/${id}`);
    return res.data;
  },

  // Clear all history
  clearHistory: async () => {
    const res = await apiClient.delete('/history');
    return res.data;
  },

  // Forecast future depreciation trajectory
  forecast: async (payload) => {
    const res = await apiClient.post('/forecast', payload);
    return res.data;
  },

  // Side-by-side vehicle comparison
  compare: async (payload) => {
    const res = await apiClient.post('/compare', payload);
    return res.data;
  },

  // Resale retention brand recommendations
  getRecommendations: async (params) => {
    const res = await apiClient.get('/recommendations', { params });
    return res.data;
  },
};

export default api;
