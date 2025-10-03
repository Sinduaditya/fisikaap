import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
// const BASE_URL = 'http://192.168.41.158:8000/api';
// const BASE_URL = 'http://192.168.56.1:8000/api';
const BASE_URL = 'http://192.168.1.5:8000/api';

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export interface User {
  id: number;
  name: string;
  email: string;
  level: number;
  total_xp: number;
  streak_count: number;
  last_login_streak: string;
  achievements?: Achievement[];
  progress?: UserProgress[];
}

export interface PhysicsTopic {
  id: number;
  name: string;
  slug: string;
  subtitle: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimated_duration: number;
  icon: string;
  order_index: number;
  progress?: {
    completed_questions: number;
    total_questions: number;
    best_score: number;
    is_completed: boolean;
    progress_percentage: number;
  };
}

export interface SimulationQuestion {
  id: number;
  question_text: string;
  simulation_type: string;
  parameters: Record<string, any>;
  evaluation_criteria: Record<string, any>;
  hints: string[];
  max_score: number;
}

export interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
  criteria: Record<string, any>;
  is_earned?: boolean;
  earned_at?: string;
}

export interface UserProgress {
  id: number;
  physics_topic_id: number;
  completed_questions: number;
  total_questions: number;
  best_score: number;
  is_completed: boolean;
  last_attempt_at: string;
  topic?: PhysicsTopic;
}

export interface SimulationAttempt {
  id: number;
  simulation_question_id: number;
  user_answer: Record<string, any>;
  is_correct: boolean;
  score_earned: number;
  attempt_number: number;
  time_taken: number;
  created_at: string;
  question?: {
    topic?: PhysicsTopic;
  };
}

class ApiService {
  getBaseUrl(): string {
    return BASE_URL;
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('userToken');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

   private async clearExpiredToken(): Promise<void> {
    try {
      console.log('🧹 Clearing expired token data');
      await AsyncStorage.multiRemove([
        'userToken', 
        'isLoggedIn', 
        'userEmail', 
        'userName',
        'userData'
      ]);
    } catch (error) {
      console.error('❌ Error clearing expired token:', error);
    }
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;

          // ✅ Handle token expiry gracefully
          if (response.status === 401) {
            console.warn('🔑 Token expired or invalid:', errorMessage);
            
            // Clear expired token immediately
            await this.clearExpiredToken();
            
            // ✅ Create specific error for token expiry
            const tokenError = new Error('Token expired');
            (tokenError as any).isTokenExpired = true;
            throw tokenError;
          }

          throw new Error(errorMessage);
        } catch (jsonError) {
          // ✅ Still handle 401 even if JSON parsing fails
          if (response.status === 401) {
            await this.clearExpiredToken();
            const tokenError = new Error('Authentication expired');
            (tokenError as any).isTokenExpired = true;
            throw tokenError;
          }
          throw new Error(errorMessage);
        }
      }

      try {
        const data = await response.json();
        return data;
      } catch (jsonError) {
        console.error('JSON parsing error:', jsonError);
        throw new Error('Invalid JSON response from server');
      }

    } catch (error) {
      console.error('handleResponse error:', error);
      throw error;
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${BASE_URL}${endpoint}`;
      console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);

      const headers = await this.getAuthHeaders();

      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      console.log(`📡 Response Status: ${response.status} ${response.statusText}`);

      return await this.handleResponse<T>(response);

    } catch (error) {
      console.error(`❌ API Error for ${endpoint}:`, error);

      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        throw new Error('Unable to connect to server. Please check your internet connection.');
      } else if (error instanceof Error && error.message.includes('timeout')) {
        throw new Error('Request timed out. Please try again.');
      } else if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('An unexpected error occurred');
      }
    }
  }

  // ============= SESUAI ROUTE LIST =============

  // ✅ GET|HEAD api/health
  async healthCheck(): Promise<ApiResponse> {
    return this.makeRequest('/health');
  }

  // ✅ POST api/auth/register
  async register(name: string, email: string, password: string): Promise<ApiResponse<{ user: User, token: string }>> {
    return this.makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  }

  // ✅ POST api/auth/login
  async login(email: string, password: string): Promise<ApiResponse<{ user: User, token: string }>> {
    return this.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  // ✅ GET|HEAD api/auth/profile
  async getProfile(): Promise<ApiResponse<{ user: User }>> {
    try {
      return await this.makeRequest('/auth/profile');
    } catch (error: any) {
      if (error.isTokenExpired) {
        console.log('🔑 Profile request failed due to expired token');
        // Don't throw error, let caller handle it gracefully
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  }

  // ✅ POST api/auth/logout
  async logout(): Promise<ApiResponse> {
    try {
      const token = await this.getAuthToken();
      
      // ✅ If no token, consider logout successful
      if (!token) {
        console.log('✅ No token found, logout considered successful');
        return {
          status: 'success',
          message: 'Logout successful (no token)',
        };
      }

      return await this.makeRequest('/auth/logout', {
        method: 'POST',
      });
    } catch (error: any) {
      console.warn('⚠️ API logout failed:', error.message);
      
      // ✅ Even if API logout fails, clear local token
      await this.clearExpiredToken();
      
      // ✅ Return success for logout (local cleanup is what matters)
      return {
        status: 'success',
        message: 'Logout completed (local cleanup)',
      };
    }
  }

  // ✅ GET|HEAD api/user
  async getUser(): Promise<ApiResponse<{ user: User }>> {
    return this.makeRequest('/user');
  }

  // ✅ GET|HEAD api/user/achievements
  async getUserAchievements(): Promise<ApiResponse<{ achievements: any[] }>> {
    return this.makeRequest('/user/achievements');
  }

  // ✅ GET|HEAD api/user/progress
  async getUserProgress(): Promise<ApiResponse<{ progress: UserProgress[] }>> {
    return this.makeRequest('/user/progress');
  }

  // ✅ GET|HEAD api/user/attempts
  async getUserAttempts(): Promise<ApiResponse<{ attempts: SimulationAttempt[] }>> {
    return this.makeRequest('/user/attempts');
  }

  // ✅ GET|HEAD api/topics
  async getTopics(): Promise<ApiResponse<{ topics: PhysicsTopic[] }>> {
    return this.makeRequest('/topics');
  }

  // ✅ GET|HEAD api/topics/{slug}
  async getTopicBySlug(slug: string): Promise<ApiResponse<{ topic: PhysicsTopic }>> {
    return this.makeRequest(`/topics/${slug}`);
  }

  // ✅ GET|HEAD api/topics/{slug}/questions
  async getTopicQuestions(slug: string): Promise<ApiResponse<{ questions: SimulationQuestion[] }>> {
    return this.makeRequest(`/topics/${slug}/questions`);
  }

  // ✅ GET|HEAD api/simulation/topics
  async getSimulationTopics(): Promise<ApiResponse<{ topics: PhysicsTopic[] }>> {
    return this.makeRequest('/simulation/topics');
  }

  // ✅ GET|HEAD api/simulation/topics/{topicSlug}/question
  async getTopicQuestion(topicSlug: string): Promise<ApiResponse<{ question: SimulationQuestion }>> {
    return this.makeRequest(`/simulation/topics/${topicSlug}/question`);
  }

  // ✅ POST api/simulation/questions/{questionId}/submit
  async submitAnswer(
    questionId: number,
    userAnswer: Record<string, any>,
    timeTaken: number,
    simulationData: Record<string, any>
  ): Promise<ApiResponse<{ is_correct: boolean, score_earned: number, total_xp: number, feedback: any }>> {
    return this.makeRequest(`/simulation/questions/${questionId}/submit`, {
      method: 'POST',
      body: JSON.stringify({
        user_answer: userAnswer,
        time_taken: timeTaken,
        simulation_data: simulationData,
      }),
    });
  }

  // ✅ GET|HEAD api/achievements
  async getAchievements(): Promise<ApiResponse<{ achievements: Achievement[] }>> {
    return this.makeRequest('/achievements');
  }

  // ✅ GET|HEAD api/challenges/daily
  async getDailyChallenge(): Promise<ApiResponse<{ challenge: any }>> {
    return this.makeRequest('/challenges/daily');
  }

  // ✅ GET|HEAD api/challenges
  async getChallenges(): Promise<ApiResponse<{ challenges: any[] }>> {
    return this.makeRequest('/challenges');
  }

  // ============= UTILITY METHODS =============

  async testConnection(): Promise<{ success: boolean, message: string }> {
    try {
      console.log(`🧪 Testing connection to: ${BASE_URL}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: `✅ Connected successfully!\nServer: ${data.message || 'API is running'}\nURL: ${BASE_URL}`
        };
      } else {
        return {
          success: false,
          message: `❌ Server responded with ${response.status}: ${response.statusText}\nURL: ${BASE_URL}`
        };
      }
    } catch (error) {
      console.error('Connection test failed:', error);

      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          message: `❌ Connection timeout after 5 seconds.\nURL: ${BASE_URL}`
        };
      } else if (error instanceof TypeError && error.message.includes('Network request failed')) {
        return {
          success: false,
          message: `❌ Cannot connect to server.\n\nPlease check:\n• Server is running\n• Network connection\n• URL: ${BASE_URL}`
        };
      } else {
        return {
          success: false,
          message: `❌ Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}\nURL: ${BASE_URL}`
        };
      }
    }
  }

  async validateToken(): Promise<boolean> {
    try {
      const token = await this.getAuthToken();
      if (!token) return false;

      const response = await this.getProfile();
      return response.status === 'success';
    } catch (error: any) {
      if (error.isTokenExpired || error.message.includes('Session expired')) {
        return false;
      }
      console.warn('Token validation failed:', error);
      return false;
    }
  }

  // Mock methods for offline development
  async mockLogin(email: string, password: string): Promise<ApiResponse<{ user: User, token: string }>> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (email === 'admin@test.com' && password === 'password123') {
      const mockUser: User = {
        id: 1,
        name: 'Test User',
        email: 'admin@test.com',
        level: 5,
        total_xp: 1250,
        streak_count: 3,
        last_login_streak: new Date().toISOString(),
      };

      return {
        status: 'success',
        message: 'Login successful',
        data: {
          user: mockUser,
          token: 'mock-jwt-token-' + Date.now(),
        },
      };
    } else {
      throw new Error('Invalid credentials. Use: admin@test.com / password123');
    }
  }

  async mockRegister(name: string, email: string, password: string): Promise<ApiResponse<{ user: User, token: string }>> {
    await new Promise(resolve => setTimeout(resolve, 1500));

    const mockUser: User = {
      id: Date.now(),
      name,
      email,
      level: 1,
      total_xp: 0,
      streak_count: 0,
      last_login_streak: new Date().toISOString(),
    };

    return {
      status: 'success',
      message: 'Registration successful',
      data: {
        user: mockUser,
        token: 'mock-jwt-token-' + Date.now(),
      },
    };
  }

  // Login with automatic fallback to mock
  async loginWithFallback(email: string, password: string): Promise<ApiResponse<{ user: User, token: string }>> {
    try {
      return await this.login(email, password);
    } catch (error) {
      console.warn('🔄 Real API failed, trying mock login:', error);
      Alert.alert(
        'Using Demo Mode',
        'Real API unavailable. Demo credentials:\n• Email: admin@test.com\n• Password: password123',
        [{ text: 'OK' }]
      );
      return await this.mockLogin(email, password);
    }
  }

  // Register with automatic fallback to mock
  async registerWithFallback(name: string, email: string, password: string): Promise<ApiResponse<{ user: User, token: string }>> {
    try {
      return await this.register(name, email, password);
    } catch (error) {
      console.warn('🔄 Real API failed, using mock registration:', error);
      Alert.alert('Demo Mode', 'Real API unavailable. Using demo registration.');
      return await this.mockRegister(name, email, password);
    }
  }
}

export const apiService = new ApiService();