export interface WebViewMessage {
  type: 'SUBMIT_ANSWER' | 'WEBVIEW_READY' | 'QUESTION_LOADED' | 'ERROR';
  data: any;
  timestamp?: number;
}

export interface SubmissionData {
  user_answer: Record<string, any>;
  simulation_data: Record<string, any>;
  time_taken: number;
  question_id?: number;
}

export interface FeedbackData {
  is_correct: boolean;
  score_earned: number;
  feedback: string;
  next_question?: import('../services/api').SimulationQuestion;
  topic_completed: boolean;
  auto_progression?: boolean;
}

export interface SimulationState {
  currentQuestion: import('../services/api').SimulationQuestion | null;
  questions: import('../services/api').SimulationQuestion[];
  currentQuestionIndex: number;
  completedQuestions: number[];
  topic: import('../services/api').PhysicsTopic | null;
  loading: boolean;
  submitting: boolean;
  webViewReady: boolean;
  feedback: FeedbackData | null;
  showFeedback: boolean;
}