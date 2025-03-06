import axios from 'axios';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

let currentToken: string | null = null;

// API URL'ini environment variable'dan al, yoksa default değeri kullan
export const API_URL = 'http://192.168.1.23:5000/api';
export const ASSETS_URL = 'http://192.168.1.23:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  withCredentials: false
});

// Uygulama başladığında token'ı AsyncStorage'dan yükle
const loadStoredToken = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      setToken(token);
    }
  } catch (error) {
    console.error('Token yüklenirken hata:', error);
  }
};

loadStoredToken();

// Request interceptor - token eklemek için
api.interceptors.request.use(
  async (config) => {
    // Her istekte token'ı AsyncStorage'dan al
    const token = await AsyncStorage.getItem('token');
    if (token) {
      // Bearer token formatını ekle
      config.headers.Authorization = `Bearer ${token}`;
      currentToken = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - 401 hatalarını yakala
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token geçersiz, kullanıcıyı logout yap
      await AsyncStorage.removeItem('token');
      clearToken();
      router.replace('/auth/login');
    }
    return Promise.reject(error);
  }
);

export const setToken = (token: string) => {
  currentToken = token;
};

export const clearToken = () => {
  currentToken = null;
};

export const checkApiHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('API sağlık kontrolü hatası:', error);
    throw error;
  }
};

export default api;
