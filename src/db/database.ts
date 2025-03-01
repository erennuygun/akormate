import api, { setToken, clearToken } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Song {
  id?: string;
  title: string;
  artist: string;
  originalKey: string;
  chords: string;
  created_at?: string;
}

interface User {
  id?: string;
  email: string;
  password: string;
  created_at?: string;
  favorites?: string[]; // Beğenilen şarkıların ID'leri
}

interface Repertoire {
  id: string;
  userId: string;
  name: string;
  songs: string[]; // Şarkı ID'leri
  created_at: string;
}

interface PrivateSong extends Song {
  userId: string;
  isPrivate: boolean;
}

export const initDatabase = async () => {
  try {
    const response = await api.get('/health');
    return response.status === 200;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

export const saveSong = async (song: Song) => {
  try {
    const response = await api.post('/songs', song);
    return response.data;
  } catch (error) {
    console.error('Şarkı kaydedilirken hata:', error);
    throw error;
  }
};

export const getSongs = async (search?: string, options?: { tag?: string; random?: boolean }) => {
  try {
    let url = '/songs';
    const params = new URLSearchParams();
    
    if (search) {
      params.append('search', search);
    }
    if (options?.tag) {
      params.append('tag', options.tag);
    }
    if (options?.random) {
      params.append('random', 'true');
    }

    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }

    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error getting songs:', error);
    throw error;
  }
};

export const getSongById = async (id: string) => {
  try {
    const response = await api.get(`/songs/${id}`);
    return response.data;
  } catch (error) {
    console.error('Şarkı getirilirken hata:', error);
    throw error;
  }
};

export const registerUser = async (email: string, password: string): Promise<User> => {
  try {
    const response = await api.post('/users', { email, password });
    const { token, user } = response.data;
    setToken(token);
    return user;
  } catch (error) {
    console.error('Kullanıcı kaydedilirken hata:', error);
    throw error;
  }
};

export const loginUser = async (email: string, password: string): Promise<User> => {
  try {
    const response = await api.post('/users/login', { email, password });
    const { token, user } = response.data;
    
    // Ensure we have a valid user object with an ID
    if (!user || !user._id) {
      throw new Error('Invalid user data received from server');
    }
    
    // Convert MongoDB _id to id for consistency
    const userData = {
      ...user,
      id: user._id
    };
    
    setToken(token);
    return userData;
  } catch (error) {
    console.error('Giriş yapılırken hata:', error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await api.post('/users/logout');
    clearToken();
  } catch (error) {
    console.error('Çıkış yapılırken hata:', error);
    throw error;
  }
};

export const checkIsFavorite = async (songId: string) => {
  try {
    // Kullanıcı giriş yapmamışsa false döndür
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      return false;
    }

    const response = await api.get(`/favorites/check/${songId}`);
    return response.data.isFavorite;
  } catch (error) {
    // 401 hatası (unauthorized) gelirse false döndür
    if (error.response?.status === 401) {
      return false;
    }
    console.error('Favori kontrolü yaparken hata:', error);
    return false;
  }
};

export const addToFavorites = async (songId: string) => {
  try {
    // Kullanıcı giriş yapmamışsa hata fırlat
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('Bu işlem için giriş yapmanız gerekiyor');
    }

    const response = await api.post(`/favorites/${songId}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error('Bu işlem için giriş yapmanız gerekiyor');
    }
    console.error('Favorilere eklerken hata:', error);
    throw error;
  }
};

export const removeFromFavorites = async (songId: string) => {
  try {
    // Kullanıcı giriş yapmamışsa hata fırlat
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('Bu işlem için giriş yapmanız gerekiyor');
    }

    const response = await api.delete(`/favorites/${songId}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error('Bu işlem için giriş yapmanız gerekiyor');
    }
    console.error('Favorilerden çıkarırken hata:', error);
    throw error;
  }
};

export const getFavorites = async () => {
  try {
    const response = await api.get('/favorites');
    return response.data;
  } catch (error) {
    console.error('Favorileri getirirken hata:', error);
    throw error;
  }
};

export const createRepertoire = async (userId: string, name: string) => {
  try {
    const response = await api.post('/repertoires', { userId, name });
    return response.data;
  } catch (error) {
    console.error('Repertuar oluşturulurken hata:', error);
    throw error;
  }
};

export const getUserRepertoires = async (userId: string) => {
  try {
    const response = await api.get(`/repertoires/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Kullanıcı repertuarları getirilirken hata:', error);
    throw error;
  }
};

export const addSongToRepertoire = async (repertoireId: string, songId: string) => {
  try {
    const response = await api.post(`/repertoires/${repertoireId}/songs`, { songId });
    return response.data;
  } catch (error) {
    console.error('Şarkı repertuara eklenirken hata:', error);
    throw error;
  }
};

export const savePrivateSong = async (song: Omit<PrivateSong, 'id' | 'created_at'>) => {
  try {
    const response = await api.post('/songs/private', song);
    return response.data;
  } catch (error) {
    console.error('Özel şarkı kaydedilirken hata:', error);
    throw error;
  }
};

export const getUserPrivateSongs = async (userId: string) => {
  try {
    const response = await api.get(`/songs/private/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Kullanıcı özel şarkıları getirilirken hata:', error);
    throw error;
  }
};
