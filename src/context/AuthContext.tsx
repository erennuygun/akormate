import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useSegments, useRootNavigationState } from 'expo-router';
import { updateUserInDB } from '../db/database';

export interface User {
  _id: string;
  email: string;
  name?: string;
  photoURL?: string;
  token?: string;
  tokens?: Array<{ token: string; createdAt: string; _id: string }>;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (userData: any) => Promise<void>;
  signUp: (userData: any) => Promise<void>;
  signOut: () => Promise<void>;
  checkAndNavigateToProfile: () => void;
  updateUserProfile: (profileData: { displayName?: string; photoURL?: string }) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const segments = useSegments();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (userData: any) => {
    try {
      // En son oluşturulan token'ı al
      const latestToken = userData.tokens && userData.tokens.length > 0 
        ? userData.tokens[userData.tokens.length - 1].token 
        : null;

      if (!latestToken) {
        throw new Error('Token bulunamadı');
      }

      // Token'ı user nesnesine ekle
      const userWithToken = {
        ...userData,
        token: latestToken
      };

      // Token'ı ayrı olarak sakla
      await AsyncStorage.setItem('token', latestToken);
      await AsyncStorage.setItem('user', JSON.stringify(userWithToken));
      setUser(userWithToken);
      router.replace('/chords'); // Akorlar sayfasına yönlendir
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signUp = async (userData: any) => {
    // TO DO: implement sign up logic
  };

  const signOut = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      setUser(null);
      router.replace('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const checkAndNavigateToProfile = () => {
    if (!user) {
      router.push('/auth/login');
    } else {
      router.push('/profile');
    }
  };

  const updateUserProfile = async (profileData: { displayName?: string; photoURL?: string }) => {
    try {
      if (!user) throw new Error('Kullanıcı bulunamadı');

      // MongoDB'de kullanıcı bilgilerini güncelle
      const updatedUser = await updateUserInDB(user._id, {
        name: profileData.displayName,
        photoData: profileData.photoURL,
      });

      // AsyncStorage ve state'i güncelle
      const newUserData = {
        ...user,
        name: updatedUser.name,
        photoURL: updatedUser.photoURL,
      };
      await AsyncStorage.setItem('user', JSON.stringify(newUserData));
      setUser(newUserData);

      return newUserData;
    } catch (error) {
      console.error('Profil güncellenirken hata:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signIn, 
      signUp,
      signOut,
      checkAndNavigateToProfile,
      updateUserProfile
    }}>
      {loading ? null : children}
    </AuthContext.Provider>
  );
}