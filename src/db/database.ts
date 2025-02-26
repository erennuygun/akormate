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
    const songs = await AsyncStorage.getItem('songs');
    const users = await AsyncStorage.getItem('users');
    const repertoires = await AsyncStorage.getItem('repertoires');
    
    if (!songs) {
      await AsyncStorage.setItem('songs', JSON.stringify([]));
    }
    if (!users) {
      await AsyncStorage.setItem('users', JSON.stringify([]));
    }
    if (!repertoires) {
      await AsyncStorage.setItem('repertoires', JSON.stringify([]));
    }
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

export const saveSong = async (song: Song) => {
  try {
    const songs = await AsyncStorage.getItem('songs');
    const existingSongs: Song[] = songs ? JSON.parse(songs) : [];
    
    const newSong = {
      ...song,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    };
    
    existingSongs.unshift(newSong);
    await AsyncStorage.setItem('songs', JSON.stringify(existingSongs));
    return newSong.id;
  } catch (error) {
    console.error('Error saving song:', error);
    throw error;
  }
};

export const getAllSongs = async () => {
  try {
    const songs = await AsyncStorage.getItem('songs');
    return songs ? JSON.parse(songs) : [];
  } catch (error) {
    console.error('Error getting songs:', error);
    throw error;
  }
};

export const getSongById = async (id: string) => {
  try {
    const songs = await AsyncStorage.getItem('songs');
    const allSongs: Song[] = songs ? JSON.parse(songs) : [];
    return allSongs.find(song => song.id === id);
  } catch (error) {
    console.error('Error getting song:', error);
    throw error;
  }
};

export const registerUser = async (email: string, password: string): Promise<User> => {
  try {
    const users = JSON.parse(await AsyncStorage.getItem('users') || '[]');
    const existingUser = users.find((u: User) => u.email === email);
    
    if (existingUser) {
      throw new Error('User already exists');
    }

    const newUser: User = {
      id: Date.now().toString(),
      email,
      password, // In a real app, this should be hashed
      created_at: new Date().toISOString(),
    };

    users.push(newUser);
    await AsyncStorage.setItem('users', JSON.stringify(users));
    return newUser;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

export const loginUser = async (email: string, password: string): Promise<User> => {
  try {
    const users = JSON.parse(await AsyncStorage.getItem('users') || '[]');
    const user = users.find((u: User) => u.email === email && u.password === password);
    
    if (!user) {
      throw new Error('Invalid credentials');
    }

    return user;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

export const addToFavorites = async (userId: string, songId: string) => {
  try {
    const users = JSON.parse(await AsyncStorage.getItem('users') || '[]');
    const userIndex = users.findIndex((u: User) => u.id === userId);
    
    if (userIndex === -1) throw new Error('Kullanıcı bulunamadı');
    
    if (!users[userIndex].favorites) {
      users[userIndex].favorites = [];
    }
    
    if (!users[userIndex].favorites.includes(songId)) {
      users[userIndex].favorites.push(songId);
      await AsyncStorage.setItem('users', JSON.stringify(users));
    }
    
    return users[userIndex].favorites;
  } catch (error) {
    console.error('Error adding to favorites:', error);
    throw error;
  }
};

export const removeFromFavorites = async (userId: string, songId: string) => {
  try {
    const users = JSON.parse(await AsyncStorage.getItem('users') || '[]');
    const userIndex = users.findIndex((u: User) => u.id === userId);
    
    if (userIndex === -1) throw new Error('Kullanıcı bulunamadı');
    
    if (users[userIndex].favorites) {
      users[userIndex].favorites = users[userIndex].favorites.filter((id: string) => id !== songId);
      await AsyncStorage.setItem('users', JSON.stringify(users));
    }
    
    return users[userIndex].favorites;
  } catch (error) {
    console.error('Error removing from favorites:', error);
    throw error;
  }
};

export const getFavorites = async (userId: string) => {
  try {
    const users = JSON.parse(await AsyncStorage.getItem('users') || '[]');
    const user = users.find((u: User) => u.id === userId);
    
    if (!user) throw new Error('Kullanıcı bulunamadı');
    
    const songs = JSON.parse(await AsyncStorage.getItem('songs') || '[]');
    return songs.filter((song: Song) => user.favorites?.includes(song.id));
  } catch (error) {
    console.error('Error getting favorites:', error);
    throw error;
  }
};

export const createRepertoire = async (userId: string, name: string) => {
  try {
    const repertoires = JSON.parse(await AsyncStorage.getItem('repertoires') || '[]');
    const newRepertoire: Repertoire = {
      id: Date.now().toString(),
      userId,
      name,
      songs: [],
      created_at: new Date().toISOString(),
    };
    
    repertoires.push(newRepertoire);
    await AsyncStorage.setItem('repertoires', JSON.stringify(repertoires));
    return newRepertoire;
  } catch (error) {
    console.error('Error creating repertoire:', error);
    throw error;
  }
};

export const getUserRepertoires = async (userId: string) => {
  try {
    const repertoires = JSON.parse(await AsyncStorage.getItem('repertoires') || '[]');
    return repertoires.filter((rep: Repertoire) => rep.userId === userId);
  } catch (error) {
    console.error('Error getting user repertoires:', error);
    throw error;
  }
};

export const addSongToRepertoire = async (repertoireId: string, songId: string) => {
  try {
    const repertoires = JSON.parse(await AsyncStorage.getItem('repertoires') || '[]');
    const repIndex = repertoires.findIndex((r: Repertoire) => r.id === repertoireId);
    
    if (repIndex === -1) throw new Error('Repertuar bulunamadı');
    
    if (!repertoires[repIndex].songs.includes(songId)) {
      repertoires[repIndex].songs.push(songId);
      await AsyncStorage.setItem('repertoires', JSON.stringify(repertoires));
    }
    
    return repertoires[repIndex];
  } catch (error) {
    console.error('Error adding song to repertoire:', error);
    throw error;
  }
};

export const savePrivateSong = async (song: Omit<PrivateSong, 'id' | 'created_at'>) => {
  try {
    const songs = JSON.parse(await AsyncStorage.getItem('songs') || '[]');
    const newSong: PrivateSong = {
      ...song,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      isPrivate: true,
    };
    
    songs.push(newSong);
    await AsyncStorage.setItem('songs', JSON.stringify(songs));
    return newSong;
  } catch (error) {
    console.error('Error saving private song:', error);
    throw error;
  }
};

export const getUserPrivateSongs = async (userId: string) => {
  try {
    const songs = JSON.parse(await AsyncStorage.getItem('songs') || '[]');
    return songs.filter((song: PrivateSong) => song.userId === userId && song.isPrivate);
  } catch (error) {
    console.error('Error getting user private songs:', error);
    throw error;
  }
};
