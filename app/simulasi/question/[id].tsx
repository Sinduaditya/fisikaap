import { AuthGuard } from '@/components/AuthGuard';
import { colors, fonts } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { apiService, SimulationQuestion } from '@/services/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface SimulationParams {
  mass: number;
  force: number;
  friction: number;
}

interface SimulationResult {
  acceleration: number;
  velocity: number;
  displacement: number;
  time: number;
}

function QuestionContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { id, topicSlug, questionData } = useLocalSearchParams<{
    id: string;
    topicSlug: string;
    questionData: string;
  }>();

  // State management
  const [question, setQuestion] = useState<SimulationQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [currentHint, setCurrentHint] = useState(0);
  const [startTime] = useState(Date.now());

  // Simulation state
  const [simulationParams, setSimulationParams] = useState<SimulationParams>({
    mass: 5,
    force: 20,
    friction: 0,
  });
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);

  // Animation
  const animationValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadQuestion();
  }, []);

  const loadQuestion = async () => {
    try {
      setLoading(true);

      // Try to use passed question data first
      if (questionData) {
        try {
          const parsedQuestion = JSON.parse(questionData);
          setQuestion(parsedQuestion);
          console.log('✅ Question loaded from params:', parsedQuestion.id);
          return;
        } catch (parseError) {
          console.warn('⚠️ Failed to parse question data, loading from API');
        }
      }

      // Fallback to API or mock
      const mockQuestion: SimulationQuestion = {
        id: parseInt(id),
        question_text: "Sebuah benda bermassa 5 kg didorong dengan gaya 20 N di atas permukaan dengan koefisien gesek 0.1. Berapa percepatan yang dialami benda tersebut?",
        simulation_type: "force_motion",
        parameters: {
          mass: { min: 1, max: 10, unit: 'kg', default: 5 },
          force: { min: 5, max: 50, unit: 'N', default: 20 },
          friction: { min: 0, max: 0.5, unit: 'coefficient', default: 0.1 }
        },
        evaluation_criteria: {
          acceleration_tolerance: 0.1,
          expected_formula: "a = (F - μmg) / m"
        },
        hints: [
          "Gunakan Hukum Newton II: F = ma",
          "Jangan lupa memperhitungkan gaya gesek: f = μmg",
          "Gaya bersih = Gaya dorong - Gaya gesek",
          "Percepatan = Gaya bersih / Massa"
        ],
        max_score: 100
      };

      setQuestion(mockQuestion);
      console.log('✅ Mock question loaded');

    } catch (error) {
      console.error('❌ Failed to load question:', error);
      Alert.alert('Error', 'Failed to load question. Please try again.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const runSimulation = () => {
    if (!question) return;

    setIsSimulating(true);

    // Animate simulation
    Animated.sequence([
      Animated.timing(animationValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: false,
      }),
      Animated.timing(animationValue, {
        toValue: 0,
        duration: 500,
        useNativeDriver: false,
      }),
    ]).start(() => {
      setIsSimulating(false);
    });

    // Calculate physics
    setTimeout(() => {
      const { mass, force, friction } = simulationParams;
      const g = 9.8; // gravitational acceleration
      
      // Calculate forces
      const frictionForce = friction * mass * g;
      const netForce = force - frictionForce;
      const acceleration = netForce / mass;
      
      // Calculate motion (assuming 2 seconds of motion)
      const time = 2;
      const velocity = acceleration * time;
      const displacement = 0.5 * acceleration * time * time;

      setSimulationResult({
        acceleration: Math.round(acceleration * 100) / 100,
        velocity: Math.round(velocity * 100) / 100,
        displacement: Math.round(displacement * 100) / 100,
        time,
      });

      console.log('🧮 Simulation result:', { acceleration, velocity, displacement });
    }, 1000);
  };

  const submitAnswer = async () => {
    if (!question || !userAnswer.trim()) {
      Alert.alert('Error', 'Please enter your answer first.');
      return;
    }

    try {
      setSubmitting(true);
      
      const timeTaken = Math.round((Date.now() - startTime) / 1000); // seconds
      const answerValue = parseFloat(userAnswer);
      
      console.log('📝 Submitting answer:', {
        questionId: question.id,
        userAnswer: answerValue,
        timeTaken,
        simulationParams,
        simulationResult
      });

      // Try API submission
      try {
        const response = await apiService.submitAnswer(
          question.id,
          { acceleration: answerValue },
          timeTaken,
          {
            parameters: simulationParams,
            result: simulationResult
          }
        );

        if (response.status === 'success' && response.data) {
          const { is_correct, score_earned, total_xp, feedback } = response.data;
          
          showResultAlert(is_correct, score_earned, total_xp, feedback);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (apiError) {
        console.warn('⚠️ API submission failed, using mock evaluation:', apiError);
        evaluateAnswerMock(answerValue, timeTaken);
      }

    } catch (error) {
      console.error('❌ Failed to submit answer:', error);
      Alert.alert('Error', 'Failed to submit answer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const evaluateAnswerMock = (answerValue: number, timeTaken: number) => {
    // Mock evaluation logic
    const correctAnswer = simulationResult?.acceleration || 0;
    const tolerance = question?.evaluation_criteria.acceleration_tolerance || 0.1;
    const isCorrect = Math.abs(answerValue - correctAnswer) <= tolerance;
    
    let score = 0;
    if (isCorrect) {
      score = Math.max(60, 100 - timeTaken); // Base score with time penalty
    } else {
      const errorPercentage = Math.abs(answerValue - correctAnswer) / correctAnswer;
      score = Math.max(0, 50 - errorPercentage * 100);
    }

    const xpGained = Math.round(score * 0.5); // XP based on score
    
    showResultAlert(
      isCorrect, 
      Math.round(score), 
      (user?.total_xp || 0) + xpGained,
      {
        correct_answer: correctAnswer,
        explanation: isCorrect 
          ? "Excellent! Your answer is correct." 
          : `The correct answer is ${correctAnswer} m/s². ${question?.evaluation_criteria.expected_formula || ''}`
      }
    );
  };

  const showResultAlert = (isCorrect: boolean, score: number, totalXP: number, feedback: any) => {
    const title = isCorrect ? '🎉 Correct!' : '❌ Incorrect';
    const message = `Score: ${score}/100\nTotal XP: ${totalXP}\n\n${feedback.explanation || ''}`;
    
    Alert.alert(title, message, [
      {
        text: 'Continue',
        onPress: () => {
          // Navigate back to topic or next question
          router.back();
        }
      }
    ]);
  };

  const nextHint = () => {
    if (question && currentHint < question.hints.length - 1) {
      setCurrentHint(currentHint + 1);
    }
  };

  const prevHint = () => {
    if (currentHint > 0) {
      setCurrentHint(currentHint - 1);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading question...</Text>
        </View>
      </View>
    );
  }

  if (!question) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>❌ Question Not Found</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerBackButton}
          onPress={() => router.back()}
        >
          <Text style={styles.headerBackButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Question {question.id}</Text>
        <TouchableOpacity 
          style={styles.hintButton}
          onPress={() => setShowHints(!showHints)}
        >
          <Text style={styles.hintButtonText}>💡 Hints</Text>
        </TouchableOpacity>
      </View>

      {/* Question */}
      <View style={styles.questionCard}>
        <Text style={styles.questionTitle}>📝 Soal Simulasi</Text>
        <Text style={styles.questionText}>{question.question_text}</Text>
        <Text style={styles.maxScore}>Max Score: {question.max_score} points</Text>
      </View>

      {/* Hints */}
      {showHints && (
        <View style={styles.hintsCard}>
          <View style={styles.hintsHeader}>
            <Text style={styles.hintsTitle}>💡 Hint {currentHint + 1}/{question.hints.length}</Text>
            <View style={styles.hintsNavigation}>
              <TouchableOpacity 
                style={[styles.hintNavButton, currentHint === 0 && styles.hintNavButtonDisabled]}
                onPress={prevHint}
                disabled={currentHint === 0}
              >
                <Text style={styles.hintNavButtonText}>←</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.hintNavButton, currentHint === question.hints.length - 1 && styles.hintNavButtonDisabled]}
                onPress={nextHint}
                disabled={currentHint === question.hints.length - 1}
              >
                <Text style={styles.hintNavButtonText}>→</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.hintText}>{question.hints[currentHint]}</Text>
        </View>
      )}

      {/* Simulation Controls */}
      <View style={styles.simulationCard}>
        <Text style={styles.simulationTitle}>🔬 Simulasi Parameter</Text>
        
        <View style={styles.parameterContainer}>
          <View style={styles.parameter}>
            <Text style={styles.parameterLabel}>Massa (kg)</Text>
            <TextInput
              style={styles.parameterInput}
              value={simulationParams.mass.toString()}
              onChangeText={(text) => setSimulationParams(prev => ({
                ...prev,
                mass: parseFloat(text) || 0
              }))}
              keyboardType="numeric"
              placeholder="5"
            />
          </View>
          
          <View style={styles.parameter}>
            <Text style={styles.parameterLabel}>Gaya (N)</Text>
            <TextInput
              style={styles.parameterInput}
              value={simulationParams.force.toString()}
              onChangeText={(text) => setSimulationParams(prev => ({
                ...prev,
                force: parseFloat(text) || 0
              }))}
              keyboardType="numeric"
              placeholder="20"
            />
          </View>
          
          <View style={styles.parameter}>
            <Text style={styles.parameterLabel}>Koef. Gesek</Text>
            <TextInput
              style={styles.parameterInput}
              value={simulationParams.friction.toString()}
              onChangeText={(text) => setSimulationParams(prev => ({
                ...prev,
                friction: parseFloat(text) || 0
              }))}
              keyboardType="numeric"
              placeholder="0.1"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.simulateButton, isSimulating && styles.simulateButtonDisabled]}
          onPress={runSimulation}
          disabled={isSimulating}
        >
          {isSimulating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.simulateButtonText}>🚀 Run Simulation</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Simulation Visualization */}
      {isSimulating && (
        <View style={styles.visualizationCard}>
          <Text style={styles.visualizationTitle}>🎬 Simulasi Berjalan...</Text>
          <View style={styles.visualizationContainer}>
            <Animated.View
              style={[
                styles.movingObject,
                {
                  transform: [{
                    translateX: animationValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 200],
                    }),
                  }],
                },
              ]}
            >
              <Text style={styles.objectText}>📦</Text>
            </Animated.View>
          </View>
        </View>
      )}

      {/* Simulation Results */}
      {simulationResult && (
        <View style={styles.resultsCard}>
          <Text style={styles.resultsTitle}>📊 Hasil Simulasi</Text>
          <View style={styles.resultsGrid}>
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>Percepatan</Text>
              <Text style={styles.resultValue}>{simulationResult.acceleration} m/s²</Text>
            </View>
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>Kecepatan Akhir</Text>
              <Text style={styles.resultValue}>{simulationResult.velocity} m/s</Text>
            </View>
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>Jarak Tempuh</Text>
              <Text style={styles.resultValue}>{simulationResult.displacement} m</Text>
            </View>
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>Waktu</Text>
              <Text style={styles.resultValue}>{simulationResult.time} s</Text>
            </View>
          </View>
        </View>
      )}

      {/* Answer Section */}
      <View style={styles.answerCard}>
        <Text style={styles.answerTitle}>✏️ Jawaban Anda</Text>
        <Text style={styles.answerQuestion}>
          Berapa percepatan yang dialami benda? (dalam m/s²)
        </Text>
        <TextInput
          style={styles.answerInput}
          value={userAnswer}
          onChangeText={setUserAnswer}
          keyboardType="numeric"
          placeholder="Masukkan jawaban Anda..."
          placeholderTextColor={colors.muted}
        />
        
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={submitAnswer}
          disabled={submitting || !userAnswer.trim()}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>📤 Submit Answer</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Bottom Spacing */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

export default function QuestionScreen() {
  return (
    <AuthGuard>
      <QuestionContent />
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: colors.muted,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: fonts.sizes.title,
    fontFamily: fonts.title,
    color: colors.primary,
    marginBottom: 24,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerBackButton: {
    marginRight: 16,
  },
  headerBackButtonText: {
    color: '#FFFFFF',
    fontSize: fonts.sizes.body,
    fontFamily: fonts.bodySemiBold,
  },
  headerTitle: {
    flex: 1,
    fontSize: fonts.sizes.title,
    fontFamily: fonts.title,
    color: '#FFFFFF',
  },
  hintButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  hintButtonText: {
    color: '#FFFFFF',
    fontSize: fonts.sizes.small,
    fontFamily: fonts.bodySemiBold,
  },

  // Cards
  questionCard: {
    backgroundColor: colors.card,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  questionTitle: {
    fontSize: fonts.sizes.subtitle,
    fontFamily: fonts.title,
    color: colors.primary,
    marginBottom: 12,
  },
  questionText: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 12,
  },
  maxScore: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.bodySemiBold,
    color: colors.accent,
  },

  // Hints
  hintsCard: {
    backgroundColor: colors.card,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  hintsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  hintsTitle: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.bodySemiBold,
    color: colors.primary,
  },
  hintsNavigation: {
    flexDirection: 'row',
    gap: 8,
  },
  hintNavButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintNavButtonDisabled: {
    backgroundColor: colors.muted,
  },
  hintNavButtonText: {
    color: '#FFFFFF',
    fontSize: fonts.sizes.body,
    fontFamily: fonts.bodySemiBold,
  },
  hintText: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: colors.text,
    lineHeight: 22,
  },

  // Simulation
  simulationCard: {
    backgroundColor: colors.card,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  simulationTitle: {
    fontSize: fonts.sizes.subtitle,
    fontFamily: fonts.title,
    color: colors.primary,
    marginBottom: 16,
  },
  parameterContainer: {
    gap: 12,
    marginBottom: 20,
  },
  parameter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  parameterLabel: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.bodySemiBold,
    color: colors.text,
    flex: 1,
  },
  parameterInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.muted + '40',
    textAlign: 'center',
  },
  simulateButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  simulateButtonDisabled: {
    backgroundColor: colors.muted,
    elevation: 0,
    shadowOpacity: 0,
  },
  simulateButtonText: {
    color: '#FFFFFF',
    fontSize: fonts.sizes.body,
    fontFamily: fonts.bodySemiBold,
  },

  // Visualization
  visualizationCard: {
    backgroundColor: colors.card,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  visualizationTitle: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.bodySemiBold,
    color: colors.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  visualizationContainer: {
    height: 100,
    backgroundColor: colors.background,
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 20,
    position: 'relative',
  },
  movingObject: {
    position: 'absolute',
    left: 20,
  },
  objectText: {
    fontSize: 32,
  },

  // Results
  resultsCard: {
    backgroundColor: colors.card,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  resultsTitle: {
    fontSize: fonts.sizes.subtitle,
    fontFamily: fonts.title,
    color: colors.primary,
    marginBottom: 16,
  },
  resultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  resultItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.body,
    color: colors.muted,
    marginBottom: 4,
    textAlign: 'center',
  },
  resultValue: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.bodySemiBold,
    color: colors.primary,
    textAlign: 'center',
  },

  // Answer
  answerCard: {
    backgroundColor: colors.card,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  answerTitle: {
    fontSize: fonts.sizes.subtitle,
    fontFamily: fonts.title,
    color: colors.primary,
    marginBottom: 8,
  },
  answerQuestion: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: colors.text,
    marginBottom: 16,
    lineHeight: 22,
  },
  answerInput: {
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.muted + '40',
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: colors.accent,
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  submitButtonDisabled: {
    backgroundColor: colors.muted,
    elevation: 0,
    shadowOpacity: 0,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: fonts.sizes.body,
    fontFamily: fonts.bodySemiBold,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: fonts.sizes.body,
    fontFamily: fonts.bodySemiBold,
  },
});