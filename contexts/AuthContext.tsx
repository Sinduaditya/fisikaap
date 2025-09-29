// contexts/AuthContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { apiService, User } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        const response = await apiService.getProfile();
        if (response.status === 'success' && response.data) {
          setUser(response.data.user);
        } else {
          await clearAuthData();
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      await clearAuthData();
    } finally {
      setLoading(false);
    }
  };

  const clearAuthData = async () => {
    setUser(null);
    await AsyncStorage.multiRemove([
      'userToken',
      'isLoggedIn',
      'userEmail',
      'userName'
    ]);
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await apiService.login(email, password);
      
      if (response.status === 'success' && response.data) {
        const { user, token } = response.data;
        
        // Save to AsyncStorage
        await AsyncStorage.multiSet([
          ['userToken', token],
          ['isLoggedIn', 'true'],
          ['userEmail', user.email],
          ['userName', user.name],
        ]);
        
        setUser(user);
        return true;
      } else {
        Alert.alert('Login Failed', response.message || 'Invalid credentials');
        return false;
      }
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert('Login Error', error.message || 'Network error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await apiService.register(name, email, password);
      
      if (response.status === 'success' && response.data) {
        const { user, token } = response.data;
        
        // Save to AsyncStorage
        await AsyncStorage.multiSet([
          ['userToken', token],
          ['isLoggedIn', 'true'],
          ['userEmail', user.email],
          ['userName', user.name],
        ]);
        
        setUser(user);
        Alert.alert('Success', 'Registration successful!');
        return true;
      } else {
        Alert.alert('Registration Failed', response.message || 'Registration failed');
        return false;
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      Alert.alert('Registration Error', error.message || 'Network error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await apiService.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      await clearAuthData();
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await apiService.getUser();
      if (response.status === 'success' && response.data) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    refreshUser,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};