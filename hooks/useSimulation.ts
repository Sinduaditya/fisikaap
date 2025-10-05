import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { apiService, SimulationQuestion, PhysicsTopic } from '@/services/api';
import { SimulationState, FeedbackData, SubmissionData } from '@/types/simulation';

export const useSimulation = (topicSlug: string) => {
  const [state, setState] = useState<SimulationState>({
    currentQuestion: null,
    questions: [],
    currentQuestionIndex: 0,
    completedQuestions: [],
    topic: null,
    loading: true,
    submitting: false,
    webViewReady: false,
    feedback: null,
    showFeedback: false,
  });

  // ✅ Load initial data
  const loadSimulationData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      const response = await apiService.getCompleteSimulationData(topicSlug);
      
      setState(prev => ({
        ...prev,
        topic: response.topic,
        questions: response.questions,
        currentQuestion: response.currentQuestion,
        completedQuestions: response.completedQuestions,
        currentQuestionIndex: 0,
        loading: false,
      }));
      
      console.log('✅ Simulation data loaded:', response.topic.name);
    } catch (error) {
      console.error('❌ Failed to load simulation data:', error);
      setState(prev => ({ ...prev, loading: false }));
      Alert.alert('Error', 'Failed to load simulation. Please try again.');
    }
  }, [topicSlug]);

  // ✅ Submit answer with auto progression
  const submitAnswer = useCallback(async (submissionData: SubmissionData) => {
    if (!state.currentQuestion || state.submitting) return;
    
    try {
      setState(prev => ({ ...prev, submitting: true }));
      
      const response = await apiService.submitAnswerWithProgression(
        state.currentQuestion.id,
        submissionData.user_answer,
        submissionData.time_taken,
        submissionData.simulation_data
      );
      
      if (response.status === 'success' && response.data) {
        const feedbackData: FeedbackData = {
          is_correct: response.data.is_correct,
          score_earned: response.data.score_earned,
          feedback: response.data.feedback,
          next_question: response.data.next_question,
          topic_completed: response.data.topic_completed,
          auto_progression: response.data.auto_progression,
        };
        
        setState(prev => ({
          ...prev,
          feedback: feedbackData,
          showFeedback: true,
          submitting: false,
        }));
        
        // ✅ Auto progression if correct
        if (feedbackData.is_correct && feedbackData.next_question) {
          setTimeout(() => {
            moveToNextQuestion(feedbackData.next_question!);
          }, 2000); // Show feedback for 2 seconds
        } else if (feedbackData.topic_completed) {
          setTimeout(() => {
            handleTopicCompletion();
          }, 2000);
        }
        
        console.log('✅ Answer submitted successfully');
      }
    } catch (error) {
      console.error('❌ Submit answer error:', error);
      setState(prev => ({ ...prev, submitting: false }));
      Alert.alert('Error', 'Failed to submit answer. Please try again.');
    }
  }, [state.currentQuestion, state.submitting]);

  // ✅ Move to next question
  const moveToNextQuestion = useCallback((nextQuestion: SimulationQuestion) => {
    const nextIndex = state.questions.findIndex(q => q.id === nextQuestion.id);
    
    setState(prev => ({
      ...prev,
      currentQuestion: nextQuestion,
      currentQuestionIndex: nextIndex,
      completedQuestions: [...prev.completedQuestions, prev.currentQuestion?.id || 0],
      showFeedback: false,
      feedback: null,
    }));
    
    console.log('➡️ Moving to next question:', nextQuestion.question_text);
  }, [state.questions]);

  // ✅ Handle topic completion
  const handleTopicCompletion = useCallback(() => {
    Alert.alert(
      '🎉 Congratulations!',
      `You have completed all questions in ${state.topic?.name}!`,
      [
        {
          text: 'Continue Learning',
          onPress: () => {
            // Navigate back or to next topic
            console.log('Topic completed successfully');
          },
        },
      ]
    );
  }, [state.topic]);

  // ✅ Retry current question
  const retryQuestion = useCallback(() => {
    setState(prev => ({
      ...prev,
      showFeedback: false,
      feedback: null,
    }));
  }, []);

  // ✅ WebView ready handler
  const handleWebViewReady = useCallback(() => {
    setState(prev => ({ ...prev, webViewReady: true }));
  }, []);

  // ✅ Load initial data on mount
  useEffect(() => {
    loadSimulationData();
  }, [loadSimulationData]);

  return {
    ...state,
    submitAnswer,
    retryQuestion,
    handleWebViewReady,
    loadSimulationData,
  };
};