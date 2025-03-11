import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useSegments, useRootNavigationState } from 'expo-router';
import { updateUserInDB } from '../db/database';
import SessionExpiredModal from '../../components/SessionExpiredModal';
import { Buffer } from 'buffer';

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
  checkTokenExpiration: () => Promise<boolean>;
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
  const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false);
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
      // Token kontrolü
      const token = userData.token;
      
      if (!token) {
        throw new Error('Token bulunamadı');
      }

      // Token'ı user nesnesine ekle
      const userWithToken = {
        ...userData,
        token
      };

      // Token'ı ayrı olarak sakla
      await AsyncStorage.setItem('token', token);
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

  const checkTokenExpiration = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.log('No token found');
        setShowSessionExpiredModal(true);
        await signOut();
        return true;
      }

      // Token'ı decode et ve exp kontrolü yap
      const base64Url = token.split('.')[1];
      if (!base64Url) {
        console.log('Invalid token format');
        setShowSessionExpiredModal(true);
        await signOut();
        return true;
      }

      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const decodedPayload = Buffer.from(base64, 'base64').toString('utf8');
      const { exp } = JSON.parse(decodedPayload);

      if (!exp) {
        console.log('Token does not contain expiration');
        setShowSessionExpiredModal(true);
        await signOut();
        return true;
      }

      const expired = Date.now() >= exp * 1000;
      console.log('Token expiration check:', { expired, now: Date.now(), exp: exp * 1000 });

      if (expired) {
        console.log('Token is expired');
        setShowSessionExpiredModal(true);
        await signOut();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Token expiration check error:', error);
      setShowSessionExpiredModal(true);
      await signOut();
      return true;
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      if (!segments) return;

      const inAuthGroup = segments[0] === 'auth';
      console.log('Current segment:', segments[0], 'inAuthGroup:', inAuthGroup);
      
      // Protected routes için token kontrolü
      if (!inAuthGroup && user) {
        console.log('Checking token expiration for protected route');
        const isExpired = await checkTokenExpiration();
        if (isExpired) {
          console.log('Token expired, showing modal and redirecting to login');
          router.replace('/auth/login');
        }
      }
    };

    checkAuth();
  }, [segments, user]);

  const handleSessionExpiredModalClose = () => {
    setShowSessionExpiredModal(false);
    router.replace('/auth/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        checkAndNavigateToProfile,
        updateUserProfile,
        checkTokenExpiration,
      }}
    >
      {children}
      <SessionExpiredModal
        visible={showSessionExpiredModal}
        onClose={handleSessionExpiredModalClose}
      />
    </AuthContext.Provider>
  );
}