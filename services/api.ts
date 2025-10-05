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
  avatar?: string;
  level: number;
  total_xp: number;
  streak_days: number;
  last_activity_date?: string;
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

// ✅ simulation_questions table - complete fields
export interface SimulationQuestion {
  id: number;
  physics_topic_id: number;
  question_text: string;
  simulation_type: string;
  parameters: Record<string, any>;
  evaluation_criteria: Record<string, any>;
  hints?: string[];
  max_score: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  topic?: PhysicsTopic;
}

// ✅ achievements table - complete fields
export interface Achievement {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  criteria: Record<string, any>;
  xp_reward: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// ✅ user_achievements table
export interface UserAchievement {
  id: number;
  user_id: number;
  achievement_id: number;
  earned_at: string;
  created_at?: string;
  updated_at?: string;
  achievement: Achievement;
}

// ✅ user_progress table - complete fields
export interface UserProgress {
  id: number;
  user_id: number;
  physics_topic_id: number;
  completed_questions: number;
  total_questions: number;
  total_score: number;
  best_score: number;
  first_attempt_at?: string;
  last_attempt_at?: string;
  is_completed: boolean;
  created_at?: string;
  updated_at?: string;
  topic?: PhysicsTopic;
}

// ✅ simulation_attempts table - complete fields
export interface SimulationAttempt {
  id: number;
  user_id: number;
  simulation_question_id: number;
  user_answer: Record<string, any>;
  correct_answer: Record<string, any>;
  is_correct: boolean;
  score_earned: number;
  attempt_number: number;
  time_taken?: number;
  simulation_data?: Record<string, any>;
  created_at: string;
  updated_at?: string;
  question?: {
    id: number;
    question_text: string;
    topic?: PhysicsTopic;
  };
}

// ✅ daily_challenges table
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

// ============= NEW INTERFACES FOR SIMULATION FLOW =============

export interface TopicDetailResponse {
  topic: PhysicsTopic;
  questions_count: number;
  user_progress?: UserProgress;
  simulation_view: string;
}

export interface TopicQuestionsResponse {
  topic: PhysicsTopic;
  questions: SimulationQuestion[];
  user_progress?: UserProgress;
  simulation_view: string;
}

export interface SimulationViewResponse {
  topic: PhysicsTopic;
  simulation_view: string;
  simulation_url: string;
}

export interface QuestionResponse {
  question: SimulationQuestion;
  attempt_number: number;
  simulation_view: string;
}

export interface SubmitAnswerResponse {
  attempt: SimulationAttempt;
  is_correct: boolean;
  score_earned: number;
  feedback: string;
}

export interface NextQuestionResponse {
  next_question?: SimulationQuestion;
  topic_completed: boolean;
  message?: string;
}

// ============= SIMULATION SPECIFIC INTERFACES =============

export interface CompleteSimulationData {
  topic: PhysicsTopic;
  questions: SimulationQuestion[];
  currentQuestion: SimulationQuestion;
  completedQuestions: number[];
  simulationUrl: string;
  progress?: UserProgress;
}

export interface SubmitAnswerWithProgressionResponse {
  attempt: SimulationAttempt;
  is_correct: boolean;
  score_earned: number;
  feedback: string;
  next_question?: SimulationQuestion;
  topic_completed: boolean;
  auto_progression: boolean;
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

  // ✅ GET /user/progress/{topicSlug}
  async getUserTopicProgress(topicSlug: string): Promise<ApiResponse<{ progress: UserProgress; topic: PhysicsTopic }>> {
    return this.makeRequest(`/user/progress/${topicSlug}`);
  }

  // ============= SIMULATION ROUTES (NEW & UPDATED) =============

  // ✅ GET /simulation/topics - Enhanced
  async getSimulationTopics(): Promise<ApiResponse<{ topics: PhysicsTopic[] }>> {
    return this.makeRequest('/simulation/topics');
  }

  // ✅ GET /simulation/topics/{topicSlug} - NEW
  async getTopicDetail(topicSlug: string): Promise<ApiResponse<TopicDetailResponse>> {
    return this.makeRequest(`/simulation/topics/${topicSlug}`);
  }

  // ✅ GET /simulation/topics/{topicSlug}/questions - NEW
  async getTopicQuestions(topicSlug: string): Promise<ApiResponse<TopicQuestionsResponse>> {
    return this.makeRequest(`/simulation/topics/${topicSlug}/questions`);
  }

  // ✅ GET /simulation/topics/{topicSlug}/simulation - NEW
  async getSimulationView(topicSlug: string): Promise<ApiResponse<SimulationViewResponse>> {
    return this.makeRequest(`/simulation/topics/${topicSlug}/simulation`);
  }

  // ✅ GET /simulation/questions/{questionId} - NEW
  async getQuestion(questionId: number): Promise<ApiResponse<QuestionResponse>> {
    return this.makeRequest(`/simulation/questions/${questionId}`);
  }

  // ✅ GET /simulation/topics/{topicSlug}/progress
  async getTopicProgress(topicSlug: string): Promise<ApiResponse<{
    topic: PhysicsTopic;
    total_questions: number;
    completed_questions: number;
    progress_percentage: number;
    is_completed: boolean;
    user_progress?: UserProgress;
  }>> {
    return this.makeRequest(`/simulation/topics/${topicSlug}/progress`);
  }

  // ✅ POST /simulation/questions/{questionId}/submit - Enhanced with auto progression
  async submitAnswerWithProgression(
    questionId: number,
    userAnswer: Record<string, any>,
    timeTaken?: number,
    simulationData?: Record<string, any>
  ): Promise<ApiResponse<SubmitAnswerWithProgressionResponse>> {
    return this.makeRequest(`/simulation/questions/${questionId}/submit`, {
      method: 'POST',
      body: JSON.stringify({
        user_answer: userAnswer,
        time_taken: timeTaken,
        simulation_data: simulationData || {},
        auto_progression: true, // Enable auto progression
      }),
    });
  }

  // ✅ POST /simulation/questions/{questionId}/submit - Regular submit
  async submitAnswer(
    questionId: number,
    userAnswer: Record<string, any>,
    timeTaken?: number,
    simulationData?: Record<string, any>
  ): Promise<ApiResponse<SubmitAnswerResponse>> {
    return this.makeRequest(`/simulation/questions/${questionId}/submit`, {
      method: 'POST',
      body: JSON.stringify({
        user_answer: userAnswer,
        time_taken: timeTaken,
        simulation_data: simulationData || {},
      }),
    });
  }

  // ✅ GET /simulation/questions/{questionId}/next - NEW
  async getNextQuestion(questionId: number): Promise<ApiResponse<NextQuestionResponse>> {
    return this.makeRequest(`/simulation/questions/${questionId}/next`);
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
  async getTopicQuestionsBySlug(slug: string): Promise<ApiResponse<{ questions: SimulationQuestion[] }>> {
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

  // ============= SIMULATION FLOW HELPER METHODS =============

  /**
   * ✅ Get complete simulation data for a topic (FIXED VERSION)
   */
  async getCompleteSimulationData(topicSlug: string): Promise<CompleteSimulationData> {
    try {
      // Get topic and questions in parallel
      const [topicResponse, questionsResponse] = await Promise.all([
        this.getTopicBySlug(topicSlug),
        this.getTopicQuestions(topicSlug),
      ]);

      if (topicResponse.status !== 'success' || !topicResponse.data) {
        throw new Error('Failed to load topic');
      }

      if (questionsResponse.status !== 'success' || !questionsResponse.data) {
        throw new Error('Failed to load questions');
      }

      const topic = topicResponse.data.topic;
      const questions = questionsResponse.data.questions || [];
      
      if (questions.length === 0) {
        throw new Error('No questions available for this topic');
      }

      const currentQuestion = questions[0]; // Start with first question
      const completedQuestions: number[] = []; // TODO: Get from user progress API
      const simulationUrl = `${BASE_URL.replace('/api', '')}/simulation/${topicSlug}`;

      // Optionally get user progress
      let progress: UserProgress | undefined;
      try {
        const progressResponse = await this.getUserTopicProgress(topicSlug);
        if (progressResponse.status === 'success' && progressResponse.data) {
          progress = progressResponse.data.progress;
        }
      } catch (progressError) {
        console.warn('Could not load user progress:', progressError);
      }

      return {
        topic,
        questions,
        currentQuestion,
        completedQuestions,
        simulationUrl,
        progress,
      };
    } catch (error) {
      console.error('Failed to get complete simulation data:', error);
      throw error;
    }
  }

  /**
   * ✅ Complete simulation flow: Get topic detail + questions + simulation view
   */
  async getCompleteTopicData(topicSlug: string): Promise<{
    topicDetail: TopicDetailResponse;
    questions: TopicQuestionsResponse;
    simulationView: SimulationViewResponse;
  }> {
    const [topicDetailResponse, questionsResponse, simulationViewResponse] = await Promise.all([
      this.getTopicDetail(topicSlug),
      this.getTopicQuestions(topicSlug),
      this.getSimulationView(topicSlug)
    ]);

    if (topicDetailResponse.status !== 'success' || !topicDetailResponse.data) {
      throw new Error('Failed to fetch topic detail');
    }
    if (questionsResponse.status !== 'success' || !questionsResponse.data) {
      throw new Error('Failed to fetch topic questions');
    }
    if (simulationViewResponse.status !== 'success' || !simulationViewResponse.data) {
      throw new Error('Failed to fetch simulation view');
    }

    return {
      topicDetail: topicDetailResponse.data,
      questions: questionsResponse.data,
      simulationView: simulationViewResponse.data
    };
  }

  /**
   * ✅ Submit answer and get next question in one call
   */
  async submitAnswerAndGetNext(
    questionId: number,
    userAnswer: Record<string, any>,
    timeTaken?: number,
    simulationData?: Record<string, any>
  ): Promise<{
    submitResult: SubmitAnswerResponse;
    nextQuestion?: NextQuestionResponse;
  }> {
    const submitResponse = await this.submitAnswer(questionId, userAnswer, timeTaken, simulationData);
    
    if (submitResponse.status !== 'success' || !submitResponse.data) {
      throw new Error('Failed to submit answer');
    }

    let nextQuestion: NextQuestionResponse | undefined;
    
    // Only get next question if current answer is correct
    if (submitResponse.data.is_correct) {
      try {
        const nextResponse = await this.getNextQuestion(questionId);
        if (nextResponse.status === 'success' && nextResponse.data) {
          nextQuestion = nextResponse.data;
        }
      } catch (error) {
        console.warn('Failed to get next question:', error);
      }
    }

    return {
      submitResult: submitResponse.data,
      nextQuestion
    };
  }
}

// ============= EXPORT SINGLETON INSTANCE =============

export const apiService = new ApiService();
