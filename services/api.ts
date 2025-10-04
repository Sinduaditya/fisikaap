import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://192.168.1.5:8000/api';

// ============= INTERFACES SESUAI REQUIREMENT.TXT =============

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

// ✅ users table - FIXED field names sesuai requirement
export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at?: string;
  level: number;
  total_xp: number;
  streak_days: number; // ✅ FIXED: streak_days bukan streak_count
  last_activity_date?: string; // ✅ FIXED: last_activity_date bukan last_login_streak
  created_at?: string;
  updated_at?: string;
}

// ✅ physics_topics table - sesuai requirement
export interface PhysicsTopic {
  id: number;
  name: string;
  slug: string;
  subtitle: string;
  description?: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimated_duration: number;
  icon?: string;
  order_index: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// ✅ simulation_questions table - FIXED difficulty field
export interface SimulationQuestion {
  id: number;
  physics_topic_id: number;
  question_text: string;
  simulation_type: string;
  parameters: Record<string, any>;
  evaluation_criteria: Record<string, any>;
  hints?: string[]; // ✅ nullable
  max_score: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'; // ✅ ADDED missing field
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  topic?: PhysicsTopic;
}

// ✅ achievements table - FIXED missing fields
export interface Achievement {
  id: number;
  name: string;
  slug: string; // ✅ ADDED missing field
  description: string;
  icon: string;
  criteria: Record<string, any>;
  xp_reward: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary'; // ✅ ADDED missing field
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// ✅ user_achievements table - sesuai requirement
export interface UserAchievement {
  id: number;
  user_id: number;
  achievement_id: number;
  earned_at: string;
  created_at?: string;
  updated_at?: string;
  achievement: Achievement;
}

// ✅ user_progress table - FIXED field names
export interface UserProgress {
  id: number;
  user_id: number;
  physics_topic_id: number;
  completed_questions: number;
  total_questions: number;
  total_score: number; // ✅ ADDED missing field
  best_score: number;
  first_attempt_at?: string; // ✅ ADDED missing field
  last_attempt_at?: string;
  is_completed: boolean;
  created_at?: string;
  updated_at?: string;
  topic?: PhysicsTopic;
}

// ✅ simulation_attempts table - FIXED field names
export interface SimulationAttempt {
  id: number;
  user_id: number;
  simulation_question_id: number;
  user_answer: Record<string, any>;
  correct_answer: Record<string, any>; // ✅ ADDED missing field
  is_correct: boolean;
  score_earned: number;
  attempt_number: number;
  time_taken?: number; // ✅ nullable dalam requirement
  simulation_data?: Record<string, any>; // ✅ ADDED missing field
  created_at: string;
  updated_at?: string;
  question?: {
    id: number;
    question_text: string;
    topic?: PhysicsTopic;
  };
}

// ✅ daily_challenges table - sesuai requirement
export interface DailyChallenge {
  id: number;
  challenge_date: string;
  simulation_question_id: number;
  xp_multiplier: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  question?: SimulationQuestion;
}

// ============= API SERVICE CLASS =============

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

          if (response.status === 401) {
            console.warn('🔑 Token expired or invalid:', errorMessage);
            await this.clearExpiredToken();
            const tokenError = new Error('Token expired');
            (tokenError as any).isTokenExpired = true;
            throw tokenError;
          }

          throw new Error(errorMessage);
        } catch (jsonError) {
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

  // ============= PUBLIC ROUTES (NO AUTH) =============

  // ✅ GET /health
  async healthCheck(): Promise<ApiResponse<{ message: string; version: string; timestamp: string }>> {
    return this.makeRequest('/health');
  }

  // ✅ POST /auth/register
  async register(name: string, email: string, password: string): Promise<ApiResponse<{ user: User, token: string }>> {
    return this.makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  }

  // ✅ POST /auth/login
  async login(email: string, password: string): Promise<ApiResponse<{ user: User, token: string }>> {
    return this.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  // ============= PROTECTED ROUTES (AUTH REQUIRED) =============

  // ✅ GET /auth/profile
  async getProfile(): Promise<ApiResponse<{ user: User }>> {
    try {
      return await this.makeRequest('/auth/profile');
    } catch (error: any) {
      if (error.isTokenExpired) {
        console.log('🔑 Profile request failed due to expired token');
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  }

  // ✅ POST /auth/logout
  async logout(): Promise<ApiResponse> {
    try {
      const token = await this.getAuthToken();
      
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
      await this.clearExpiredToken();
      return {
        status: 'success',
        message: 'Logout completed (local cleanup)',
      };
    }
  }

  // ============= USER DATA ROUTES =============

  // ✅ GET /user
  async getUser(): Promise<ApiResponse<{ user: User }>> {
    return this.makeRequest('/user');
  }

  // ✅ GET /user/achievements
  async getUserAchievements(): Promise<ApiResponse<{ achievements: UserAchievement[] }>> {
    return this.makeRequest('/user/achievements');
  }

  // ✅ GET /user/progress
  async getUserProgress(): Promise<ApiResponse<{ progress: UserProgress[] }>> {
    return this.makeRequest('/user/progress');
  }

  // ✅ GET /user/attempts
  async getUserAttempts(): Promise<ApiResponse<{ attempts: SimulationAttempt[] }>> {
    return this.makeRequest('/user/attempts');
  }

  // ============= SIMULATION ROUTES =============

  // ✅ GET /simulation/topics
  async getSimulationTopics(): Promise<ApiResponse<{ topics: PhysicsTopic[] }>> {
    return this.makeRequest('/simulation/topics');
  }

  // ✅ GET /simulation/topics/{topicSlug}/question
  async getTopicQuestion(topicSlug: string): Promise<ApiResponse<{ question: SimulationQuestion }>> {
    return this.makeRequest(`/simulation/topics/${topicSlug}/question`);
  }

  // ✅ POST /simulation/questions/{questionId}/submit
  async submitAnswer(
    questionId: number,
    userAnswer: Record<string, any>,
    timeTaken: number,
    simulationData?: Record<string, any>
  ): Promise<ApiResponse<{ 
    is_correct: boolean; 
    score_earned: number; 
    total_xp: number; 
    feedback: any;
    attempt: SimulationAttempt;
  }>> {
    return this.makeRequest(`/simulation/questions/${questionId}/submit`, {
      method: 'POST',
      body: JSON.stringify({
        user_answer: userAnswer,
        time_taken: timeTaken,
        simulation_data: simulationData || {},
      }),
    });
  }

  // ============= PHYSICS TOPICS ROUTES =============

  // ✅ GET /topics
  async getTopics(): Promise<ApiResponse<{ topics: PhysicsTopic[] }>> {
    return this.makeRequest('/topics');
  }

  // ✅ GET /topics/{slug}
  async getTopicBySlug(slug: string): Promise<ApiResponse<{ topic: PhysicsTopic }>> {
    return this.makeRequest(`/topics/${slug}`);
  }

  // ✅ GET /topics/{slug}/questions
  async getTopicQuestions(slug: string): Promise<ApiResponse<{ questions: SimulationQuestion[] }>> {
    return this.makeRequest(`/topics/${slug}/questions`);
  }

  // ============= ACHIEVEMENTS ROUTES =============

  // ✅ GET /achievements
  async getAchievements(): Promise<ApiResponse<{ achievements: Achievement[] }>> {
    return this.makeRequest('/achievements');
  }

  // ============= DAILY CHALLENGES ROUTES =============

  // ✅ GET /challenges/daily
  async getDailyChallenge(): Promise<ApiResponse<{ challenge: DailyChallenge | null }>> {
    return this.makeRequest('/challenges/daily');
  }

  // ✅ GET /challenges
  async getChallenges(): Promise<ApiResponse<{ challenges: DailyChallenge[] }>> {
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
}

export const apiService = new ApiService();