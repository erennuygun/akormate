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

// Repertuvar türleri
export interface RepertoireType {
  _id: string;
  name: string;
  userId: string;
  songs: Song[];
  created_at: string;
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

export const getSongs = async (search?: string, options: { tag?: string; random?: boolean } = {}): Promise<Song[]> => {
  try {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (options.tag) params.append('tag', options.tag);
    if (options.random) params.append('random', 'true');

    const response = await api.get(`songs?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching songs:', error);
    return [];
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
    
    console.log('Login yanıtı:', { token: token ? 'Token var' : 'Token yok', user });
    
    // Ensure we have a valid user object with an ID
    if (!user || !user._id) {
      throw new Error('Invalid user data received from server');
    }
    
    // Convert MongoDB _id to id for consistency
    const userData = {
      ...user,
      id: user._id,
      token // Token'ı user nesnesine ekle
    };
    
    // Token'ı kaydet
    if (token) {
      console.log('Token kaydediliyor...');
      await AsyncStorage.setItem('token', token);
      setToken(token);
      
      // Token’ın kaydedildiğini kontrol et
      const storedToken = await AsyncStorage.getItem('token');
      console.log('Token kaydedildi mi:', storedToken ? 'Evet' : 'Hayır');
      console.log('API headers:', api.defaults.headers);
    } else {
      console.error('Token alınamadı!');
    }

    return userData;
  } catch (error) {
    console.error('Giriş yapılırken detaylı hata:', error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    // Önce API'ye logout isteği gönder
    const token = await AsyncStorage.getItem('token');
    if (token) {
      await api.post('/users/logout');
    }
    
    // Sonra local storage ve API instance’ı temizle
    await AsyncStorage.removeItem('token');
    clearToken();
  } catch (error) {
    console.error('Çıkış yapılırken hata:', error);
    // Hata olsa bile token’ı temizle
    await AsyncStorage.removeItem('token');
    clearToken();
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
    const token = await AsyncStorage.getItem('token');
    console.log('Token durumu:', token ? 'Token var' : 'Token yok');

    if (!token) {
      throw new Error('Bu işlem için giriş yapmanız gerekiyor');
    }

    // API instance’ın mevcut durumunu kontrol et
    console.log('API headers:', api.defaults.headers);

    const response = await api.post(`/favorites/${songId}`);
    console.log('Favori ekleme yanıtı:', response.data);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('Sunucu yanıtı:', error.response.status, error.response.data);
    }
    console.error('Favorilere eklerken detaylı hata:', error);
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
    // MongoDB _id’yi id’ye dönüştür
    return response.data.map((song: any) => ({
      ...song,
      id: song._id || song.id // Eğer _id varsa onu kullan, yoksa mevcut id’yi koru
    }));
  } catch (error) {
    console.error('Favorileri getirirken hata:', error);
    throw error;
  }
};

export const createRepertoire = async (name: string, songIds: string[]) => {
  try {
    const response = await api.post('/users/repertoires', {
      name,
      songIds
    });
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const getRepertoires = async () => {
  try {
    const response = await api.get('/users/repertoires');
    return response.data;
  } catch (error: any) {
    console.error('Repertuvarlar getirilirken hata detayı:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      headers: error.config?.headers,
      data: error.response?.data
    });
    throw error;
  }
};

export const updateRepertoire = async (id: string, data: { name?: string; songs?: Song[] }) => {
  try {
    const response = await api.put(`/users/repertoires/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Repertuar güncellenirken hata:', error);
    throw error;
  }
};

export const deleteRepertoire = async (id: string) => {
  try {
    const response = await api.delete(`/users/repertoires/${id}`);
    return response.data;
  } catch (error) {
    console.error('Repertuar silinirken hata:', error);
    throw error;
  }
};

export const addSongToRepertoire = async (repertoireId: string, songId: string) => {
  try {
    const response = await api.post(`/users/repertoires/${repertoireId}/songs`, { songId });
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

export const getArtists = async (): Promise<string[]> => {
  try {
    const response = await api.get('/songs/artists');
    return response.data;
  } catch (error) {
    console.error('Sanatçıları getirirken hata:', error);
    throw error;
  }
};

export const getArtistSongs = async (artistName: string): Promise<Song[]> => {
  try {
    const response = await api.get(`/songs/artist/${encodeURIComponent(artistName)}`);
    return response.data.map((song: any) => ({
      ...song,
      id: song._id
    }));
  } catch (error) {
    console.error('Sanatçı şarkılarını getirirken hata:', error);
    throw error;
  }
};

export const getRandomArtists = async (): Promise<Song[]> => {
  try {
    const response = await api.get('/songs/random-artists');
    return response.data;
  } catch (error) {
    console.error('Error fetching random artists:', error);
    return [];
  }
};

// Repertuvar oluşturma
export const createRepertoireNew = async (name: string, songs: Song[]) => {
  try {
    const response = await api.post('/users/repertoires', { name, songs });
    return response.data;
  } catch (error) {
    console.error('Repertuvar oluşturulurken hata:', error);
    throw error;
  }
};

// Repertuar detaylarını getir
export const getRepertoireDetails = async (id: string) => {
  try {
    const response = await api.get(`/users/repertoires/${id}`);
    return response.data;
  } catch (error) {
    console.error('Repertuar detayları alınırken hata:', error);
    throw error;
  }
};

// Kullanıcı profili güncelleme
export const updateUserInDB = async (userId: string, data: { name?: string; photoData?: string }) => {
  try {
    const response = await api.put(`/users/${userId}`, data);
    return response.data;
  } catch (error) {
    console.error('Kullanıcı güncellenirken hata:', error);
    throw error;
  }
};
