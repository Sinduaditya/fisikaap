// services/api.ts - Final Fixed Version
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const BASE_URL = 'http://192.168.41.114:8000/api';

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
  difficulty: 'beginner' | 'intermediate' | 'advanced';
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

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      // Check if response is ok first
      if (!response.ok) {
        // Handle different status codes
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;

          // Handle 401 specifically
          if (response.status === 401) {
            await AsyncStorage.multiRemove(['userToken', 'isLoggedIn', 'userEmail', 'userName']);
            Alert.alert('Session Expired', 'Please login again');
          }

          throw new Error(errorMessage);
        } catch (jsonError) {
          // If JSON parsing fails, throw with status text
          throw new Error(errorMessage);
        }
      }

      // Try to parse JSON response
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
        timeout: 15000, // 15 second timeout
      });

      console.log(`📡 Response Status: ${response.status} ${response.statusText}`);

      return await this.handleResponse<T>(response);

    } catch (error) {
      console.error(`❌ API Error for ${endpoint}:`, error);

      // Handle different types of errors
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

  // Health Check
  async healthCheck(): Promise<ApiResponse> {
    return this.makeRequest('/health');
  }

  // Authentication
  async register(name: string, email: string, password: string): Promise<ApiResponse<{ user: User, token: string }>> {
    return this.makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  }

  async login(email: string, password: string): Promise<ApiResponse<{ user: User, token: string }>> {
    return this.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getProfile(): Promise<ApiResponse<{ user: User }>> {
    return this.makeRequest('/auth/profile');
  }

  async logout(): Promise<ApiResponse> {
    return this.makeRequest('/auth/logout', {
      method: 'POST',
    });
  }

  // User Data
  async getUser(): Promise<ApiResponse<{ user: User }>> {
    return this.makeRequest('/user');
  }

  async getUserStats(): Promise<ApiResponse<{ stats: any }>> {
    return this.makeRequest('/user/stats');
  }

  async getUserProgress(): Promise<ApiResponse<{ progress: UserProgress[] }>> {
    return this.makeRequest('/user/progress');
  }

  // Physics Topics
  async getTopics(): Promise<ApiResponse<{ topics: PhysicsTopic[] }>> {
    return this.makeRequest('/topics');
  }

  async getTopicBySlug(slug: string): Promise<ApiResponse<{ topic: PhysicsTopic }>> {
    return this.makeRequest(`/topics/${slug}`);
  }

  // Simulation
  async getSimulationTopics(): Promise<ApiResponse<{ topics: PhysicsTopic[] }>> {
    return this.makeRequest('/simulation/topics');
  }

  async getTopicQuestion(topicSlug: string): Promise<ApiResponse<{ question: SimulationQuestion }>> {
    return this.makeRequest(`/simulation/topics/${topicSlug}/question`);
  }

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

  async getSimulationAttempts(perPage: number = 20): Promise<ApiResponse<{ attempts: any }>> {
    return this.makeRequest(`/simulation/attempts?per_page=${perPage}`);
  }

  async getSimulationPerformance(): Promise<ApiResponse<{ performance: any }>> {
    return this.makeRequest('/simulation/performance');
  }

  // Achievements
  async getAchievements(): Promise<ApiResponse<{ achievements: Achievement[] }>> {
    return this.makeRequest('/achievements');
  }

  async getAvailableAchievements(): Promise<ApiResponse<{ available_achievements: Achievement[] }>> {
    return this.makeRequest('/achievements/available');
  }

  // Leaderboard
  async getLeaderboard(limit: number = 50): Promise<ApiResponse<{ leaderboard: any[], current_user_rank: number, current_user: any }>> {
    return this.makeRequest(`/leaderboard?limit=${limit}`);
  }

  // Daily Challenges
  async getDailyChallenge(): Promise<ApiResponse<{ challenge: any }>> {
    return this.makeRequest('/challenges/daily');
  }

  // Test connection utility
  async testConnection(): Promise<{ success: boolean, message: string }> {
    try {
      console.log(`🧪 Testing connection to: ${BASE_URL}`);

      const response = await fetch(`${BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: 10000,
      });

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

      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        return {
          success: false,
          message: `❌ Cannot connect to server.\n\nPlease check:\n• Server is running: php artisan serve --host=0.0.0.0 --port=8000\n• Your IP: ${BASE_URL}\n• Network connection\n• Firewall settings`
        };
      } else {
        return {
          success: false,
          message: `❌ Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}\nURL: ${BASE_URL}`
        };
      }
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