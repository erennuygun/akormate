import axios from 'axios';
import { router } from 'expo-router';

let currentToken: string | null = null;

// API URL'ini environment variable'dan al, yoksa default değeri kullan
const API_URL = process.env.API_URL || 'http://192.168.1.23:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  withCredentials: true
});

// Request interceptor - token eklemek için
api.interceptors.request.use(
  (config) => {
    if (currentToken) {
      // Bearer token formatını düzgün şekilde ayarla
      config.headers.Authorization = `Bearer ${currentToken}`;
      console.log('Token gönderiliyor:', config.headers.Authorization);
    } else {
      console.log('Token bulunamadı');
    }
    return config;
  },
  (error) => {
    console.error('API isteği hatası:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - hata yönetimi için
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Sunucu yanıtı ile gelen hata
      console.error('Sunucu hatası:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
      
      // 401 hatası gelirse token'ı temizle ve yönlendir
      if (error.response.status === 401) {
        console.log('Token geçersiz, temizleniyor');
        clearToken();
        // React Native için uygun yönlendirme
        router.replace('/auth/login');
      }
    } else if (error.request) {
      // İstek yapıldı ama yanıt alınamadı
      console.error('Yanıt alınamadı:', error.request);
    } else {
      // İstek oluşturulurken hata
      console.error('İstek hatası:', error.message);
    }
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout');
    } else if (!error.response) {
      console.error('Network error:', error.message);
    }
    return Promise.reject(error);
  }
);

export const setToken = (token: string) => {
  if (!token) {
    console.error('Geçersiz token');
    return;
  }
  console.log('Token ayarlanıyor');
  currentToken = token;
};

export const clearToken = () => {
  console.log('Token temizleniyor');
  currentToken = null;
};

// API sağlık kontrolü
export const checkApiHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data.status === 'ok';
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
};

export default api;
