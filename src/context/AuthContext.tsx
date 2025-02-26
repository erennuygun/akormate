import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useSegments, useRootNavigationState } from 'expo-router';

interface AuthContextType {
  user: any | null;
  isLoading: boolean;
  signIn: (userData: any) => Promise<void>;
  signOut: () => Promise<void>;
  checkAndNavigateToProfile: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
      setIsLoading(false);
    }
  };

  const signIn = async (userData: any) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      if (segments[0] === 'auth') {
        router.replace('/');
      }
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await AsyncStorage.removeItem('user');
      setUser(null);
      if (segments[0] !== 'auth') {
        router.replace('/auth/login');
      }
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const checkAndNavigateToProfile = () => {
    if (!user) {
      router.push('/auth/login');
    } else {
      router.push('/profile');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      signIn, 
      signOut,
      checkAndNavigateToProfile 
    }}>
      {isLoading ? null : children}
    </AuthContext.Provider>
  );
}
