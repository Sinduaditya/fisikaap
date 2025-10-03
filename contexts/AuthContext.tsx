import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { apiService, User } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isInitialized: boolean;
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
  const [isInitialized, setIsInitialized] = useState(false);
  
  const authCheckInProgress = useRef(false);
  const mountedRef = useRef(true);
  const lastAuthCheck = useRef<number>(0);

  useEffect(() => {
    mountedRef.current = true;
    
    if (!isInitialized && !authCheckInProgress.current) {
      const now = Date.now();
      if (now - lastAuthCheck.current > 5000) {
        checkAuthStatus();
      }
    }

    return () => {
      mountedRef.current = false;
    };
  }, [isInitialized]);

  const checkAuthStatus = async () => {
    if (authCheckInProgress.current) {
      console.log('🔄 Auth check already in progress, skipping...');
      return;
    }

    authCheckInProgress.current = true;
    lastAuthCheck.current = Date.now();

    try {
      console.log('🔍 Starting auth status check...');
      
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        console.log('ℹ️ No token found, user not authenticated');
        if (mountedRef.current) {
          setUser(null);
          setLoading(false);
          setIsInitialized(true);
        }
        return;
      }

      console.log('✅ Token found, checking user data...');

      // ✅ Get cached user data first
      const cachedUser = await getStoredUserData();
      
      if (cachedUser && mountedRef.current) {
        setUser(cachedUser);
        setLoading(false);
        setIsInitialized(true);
        console.log('✅ Using cached user data:', cachedUser.name);
      }

      // ✅ Background refresh with token validation
      try {
        const response = await apiService.getProfile();
        
        if (response.status === 'success' && response.data && mountedRef.current) {
          const freshUser = response.data.user;
          
          if (!cachedUser || JSON.stringify(cachedUser) !== JSON.stringify(freshUser)) {
            setUser(freshUser);
            await cacheUserData(freshUser);
            console.log('✅ Profile updated from server:', freshUser.name);
          }
        }
      } catch (serverError: any) {
        console.warn('⚠️ Background profile refresh failed:', serverError.message);
        
        // ✅ Handle token expiry
        if (serverError.message?.includes('Session expired') || 
            serverError.message?.includes('Token expired')) {
          console.log('🔑 Token expired during background refresh, clearing auth');
          await clearAuthData();
          return;
        }
        
        // ✅ Other errors: keep cached data
        console.log('✅ Using cached data due to server error');
      }

    } catch (error) {
      console.error('❌ Auth check failed:', error);
      
      try {
        const cachedUser = await getStoredUserData();
        if (cachedUser && mountedRef.current) {
          setUser(cachedUser);
          setIsInitialized(true);
          console.log('✅ Using cached user data after error');
        } else {
          await clearAuthData();
        }
      } catch (cacheError) {
        console.error('❌ Cache recovery failed:', cacheError);
        if (mountedRef.current) {
          await clearAuthData();
        }
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setIsInitialized(true);
      }
      authCheckInProgress.current = false;
      console.log('✅ Auth check completed');
    }
  };

  const getStoredUserData = async (): Promise<User | null> => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('❌ Error getting stored user data:', error);
      return null;
    }
  };

  const cacheUserData = async (userData: User) => {
    try {
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
    } catch (error) {
      console.error('❌ Error caching user data:', error);
    }
  };

  const clearAuthData = async () => {
    console.log('🧹 Clearing auth data');
    if (mountedRef.current) {
      setUser(null);
      setIsInitialized(true);
    }
    try {
      await AsyncStorage.multiRemove([
        'userToken',
        'isLoggedIn',
        'userEmail',
        'userName',
        'userData'
      ]);
    } catch (error) {
      console.error('❌ Error clearing auth data:', error);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      console.log('🔐 Attempting login for:', email);
      
      const response = await apiService.login(email, password);
      
      if (response.status === 'success' && response.data) {
        const { user: userData, token } = response.data;
        
        await AsyncStorage.multiSet([
          ['userToken', token],
          ['isLoggedIn', 'true'],
          ['userEmail', userData.email],
          ['userName', userData.name],
          ['userData', JSON.stringify(userData)],
        ]);
        
        if (mountedRef.current) {
          setUser(userData);
          setIsInitialized(true);
        }
        
        console.log('✅ Login successful:', userData.name);
        return true;
      } else {
        Alert.alert('Login Failed', response.message || 'Invalid credentials');
        return false;
      }
    } catch (error: any) {
      console.error('❌ Login error:', error);
      Alert.alert('Login Error', error.message || 'Network error occurred');
      return false;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await apiService.register(name, email, password);
      
      if (response.status === 'success' && response.data) {
        const { user: userData, token } = response.data;
        
        await AsyncStorage.multiSet([
          ['userToken', token],
          ['isLoggedIn', 'true'],
          ['userEmail', userData.email],
          ['userName', userData.name],
          ['userData', JSON.stringify(userData)],
        ]);
        
        if (mountedRef.current) {
          setUser(userData);
          setIsInitialized(true);
        }
        
        Alert.alert('Success', 'Registration successful!');
        return true;
      } else {
        Alert.alert('Registration Failed', response.message || 'Registration failed');
        return false;
      }
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      Alert.alert('Registration Error', error.message || 'Network error occurred');
      return false;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  // ✅ Improved logout with better error handling
  const logout = async () => {
    try {
      setLoading(true);
      console.log('🚪 Starting logout process...');
      
      // ✅ 1. Clear local data first (most important)
      await clearAuthData();
      console.log('✅ Local auth data cleared');
      
      // ✅ 2. Try API logout (optional, don't fail if it doesn't work)
      try {
        const response = await apiService.logout();
        console.log('✅ API logout response:', response.message);
      } catch (apiError: any) {
        console.warn('⚠️ API logout failed (but local logout succeeded):', apiError.message);
        // Don't throw error - local logout is what matters
      }
      
      console.log('✅ Logout completed successfully');
      
    } catch (error) {
      console.error('❌ Logout error:', error);
      
      // ✅ Emergency fallback - force clear everything
      try {
        await AsyncStorage.clear();
        if (mountedRef.current) {
          setUser(null);
          setIsInitialized(true);
        }
        console.log('✅ Emergency logout completed');
      } catch (emergencyError) {
        console.error('❌ Emergency logout failed:', emergencyError);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const refreshUser = async () => {
    try {
      console.log('🔄 Refreshing user data...');
      const response = await apiService.getProfile();
      if (response.status === 'success' && response.data && mountedRef.current) {
        setUser(response.data.user);
        await cacheUserData(response.data.user);
        console.log('✅ User data refreshed');
      }
    } catch (error: any) {
      console.error('❌ Refresh user error:', error);
      
      // ✅ Handle token expiry during refresh
      if (error.message?.includes('Session expired') || 
          error.message?.includes('Token expired')) {
        console.log('🔑 Token expired during refresh, logging out');
        await logout();
      }
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isInitialized,
    login,
    register,
    logout,
    refreshUser,
    isAuthenticated: !!user && isInitialized,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};