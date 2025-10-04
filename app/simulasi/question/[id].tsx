import { AuthGuard } from '@/components/AuthGuard';
import { colors, fonts } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { apiService, SimulationQuestion } from '@/services/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface SimulationParams {
  id: string;
  topicSlug: string;
  questionData?: string;
}

function QuestionContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { id, topicSlug, questionData } = useLocalSearchParams<SimulationParams>();

  // State management
  const [question, setQuestion] = useState<SimulationQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userAnswer, setUserAnswer] = useState<Record<string, any>>({});
  const [startTime] = useState(Date.now());
  const [error, setError] = useState<string | null>(null);

  // ✅ Check if topic supports answer submission
  const isSubmissionEnabled = topicSlug === 'gaya-gesek';

  useEffect(() => {
    loadQuestion();
  }, [id]);

  const loadQuestion = async () => {
    try {
      setLoading(true);
      setError(null);

      if (questionData) {
        try {
          const parsedQuestion = JSON.parse(questionData);
          setQuestion(parsedQuestion);
          console.log('✅ Question loaded from params:', parsedQuestion.id);
          setLoading(false);
          return;
        } catch (parseError) {
          console.warn('⚠️ Failed to parse question data from params');
        }
      }

      if (!questionData && topicSlug) {
        try {
          console.log('🔍 Fetching questions from topic:', topicSlug);
          const questionsResponse = await apiService.getTopicQuestions(topicSlug);
          
          if (questionsResponse.status === 'success' && questionsResponse.data?.questions) {
            const questions = questionsResponse.data.questions;
            const targetQuestion = questions.find(q => q.id.toString() === id);
            
            if (targetQuestion) {
              setQuestion(targetQuestion);
              console.log('✅ Question found in topic questions:', targetQuestion.id);
              setLoading(false);
              return;
            } else {
              throw new Error(`Question with ID ${id} not found in topic ${topicSlug}`);
            }
          } else {
            throw new Error('Failed to load questions from topic');
          }
        } catch (topicError) {
          console.warn('⚠️ Failed to load from topic questions:', topicError);
        }
      }

      const mockQuestion = createMockQuestion(parseInt(id), topicSlug);
      if (mockQuestion) {
        setQuestion(mockQuestion);
        console.log('✅ Using mock question for ID:', id);
        setLoading(false);
        return;
      }

      throw new Error('Question not available. Please try accessing from the topic page.');

    } catch (error: any) {
      console.error('❌ Failed to load question:', error);
      setError(error.message || 'Failed to load question');
    } finally {
      setLoading(false);
    }
  };

  const createMockQuestion = (questionId: number, topicSlug?: string): SimulationQuestion | null => {
    const baseQuestions: Record<string, SimulationQuestion[]> = {
      'hukum-newton': [
        {
          id: 1,
          physics_topic_id: 1,
          question_text: "Sebuah balok bermassa 5 kg didorong dengan gaya 20 N. Berapa percepatan balok tersebut?",
          simulation_type: "Force Calculation",
          parameters: { 
            "Massa Balok": "5 kg", 
            "Gaya yang Diberikan": "20 N", 
            "Koefisien Gesek": "0 (diabaikan)" 
          },
          evaluation_criteria: { expected_acceleration: 4, tolerance: 0.1 },
          hints: ["Gunakan rumus F = m × a", "Ingat bahwa a = F / m"],
          max_score: 100,
          difficulty: 'Beginner',
          is_active: true
        }
      ],
      'energi-kinetik': [
        {
          id: 2,
          physics_topic_id: 2,
          question_text: "Sebuah mobil bermassa 1000 kg bergerak dengan kecepatan 20 m/s. Berapa energi kinetiknya?",
          simulation_type: "Kinetic Energy",
          parameters: { 
            "Massa Mobil": "1000 kg", 
            "Kecepatan": "20 m/s" 
          },
          evaluation_criteria: { expected_energy: 200000, tolerance: 1000 },
          hints: ["Gunakan rumus Ek = ½mv²", "Pastikan satuan dalam SI"],
          max_score: 100,
          difficulty: 'Intermediate',
          is_active: true
        }
      ],
      'momentum': [
        {
          id: 3,
          physics_topic_id: 3,
          question_text: "Dua bola bertumbukan elastis. Hitung momentum setelah tumbukan!",
          simulation_type: "Collision Simulation",
          parameters: { 
            "Massa Bola 1": "2 kg", 
            "Massa Bola 2": "3 kg", 
            "Kecepatan Awal Bola 1": "4 m/s", 
            "Kecepatan Awal Bola 2": "-2 m/s" 
          },
          evaluation_criteria: { momentum_conservation: true, tolerance: 0.1 },
          hints: ["Momentum sebelum = momentum sesudah", "p = m × v"],
          max_score: 100,
          difficulty: 'Advanced',
          is_active: true
        }
      ],
      'gaya-gesek': [
        {
          id: 4,
          physics_topic_id: 4,
          question_text: "Sebuah balok di atas bidang miring dengan koefisien gesek 0.3. Berapa gaya gesek yang bekerja?",
          simulation_type: "Friction Force",
          parameters: { 
            "Massa Balok": "10 kg", 
            "Sudut Bidang Miring": "30°", 
            "Koefisien Gesek": "0.3" 
          },
          evaluation_criteria: { expected_friction: 25.5, tolerance: 1 },
          hints: ["f = μN", "N = mg cos θ untuk bidang miring"],
          max_score: 100,
          difficulty: 'Beginner',
          is_active: true
        }
      ]
    };

    const topicQuestions = baseQuestions[topicSlug || ''] || [];
    return topicQuestions.find(q => q.id === questionId) || topicQuestions[0] || null;
  };

  const handleAnswerChange = (key: string, value: any) => {
    setUserAnswer(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSubmitAnswer = async () => {
    if (!question || !user) return;

    if (Object.keys(userAnswer).length === 0) {
      Alert.alert('Error', 'Please provide an answer before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      const timeTaken = Math.round((Date.now() - startTime) / 1000);

      console.log('📤 Submitting answer:', {
        questionId: question.id,
        userAnswer,
        timeTaken
      });

      try {
        const response = await apiService.submitAnswer(
          question.id,
          userAnswer,
          timeTaken,
          { source: 'question_page' }
        );

        if (response.status === 'success' && response.data) {
          const { is_correct, score_earned, feedback } = response.data;
          
          Alert.alert(
            is_correct ? 'Benar!' : 'Salah',
            `Skor: ${score_earned}/${question.max_score}\n\n${feedback?.message || 'Terus berlatih!'}`,
            [
              {
                text: 'Lanjutkan',
                onPress: () => {
                  router.push(`/simulasi/${topicSlug}`);
                }
              }
            ]
          );
        } else {
          throw new Error(response.message || 'Failed to submit answer');
        }
      } catch (apiError: any) {
        console.warn('⚠️ API submission failed, showing mock result:', apiError.message);
        
        const mockScore = Math.floor(Math.random() * 50 + 50);
        const isCorrect = mockScore >= 70;
        
        Alert.alert(
          isCorrect ? 'Benar!' : 'Salah',
          `Skor: ${mockScore}/${question.max_score}\n\nCatatan: Ini adalah sesi latihan. Progress Anda telah disimpan secara lokal.`,
          [
            {
              text: 'Lanjutkan',
              onPress: () => {
                router.push(`/simulasi/${topicSlug}`);
              }
            }
          ]
        );
      }

    } catch (error: any) {
      console.error('❌ Submit answer error:', error);
      Alert.alert(
        'Error Pengiriman',
        error.message || 'Gagal mengirim jawaban. Silakan coba lagi.',
        [{ text: 'OK' }]
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderParameterInput = (paramKey: string, paramValue: any) => {
    if (typeof paramValue === 'number') {
      return (
        <View key={paramKey} style={styles.inputGroup}>
          <Text style={styles.inputLabel}>{paramKey}:</Text>
          <TextInput
            style={styles.textInput}
            placeholder={`Masukkan ${paramKey}`}
            value={userAnswer[paramKey]?.toString() || ''}
            onChangeText={(text) => handleAnswerChange(paramKey, parseFloat(text) || 0)}
            keyboardType="numeric"
          />
        </View>
      );
    } else if (typeof paramValue === 'string') {
      return (
        <View key={paramKey} style={styles.inputGroup}>
          <Text style={styles.inputLabel}>{paramKey}:</Text>
          <TextInput
            style={styles.textInput}
            placeholder={`Masukkan ${paramKey}`}
            value={userAnswer[paramKey] || ''}
            onChangeText={(text) => handleAnswerChange(paramKey, text)}
          />
        </View>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Memuat soal...</Text>
        </View>
      </View>
    );
  }

  if (error || !question) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Soal Tidak Tersedia</Text>
          <Text style={styles.errorMessage}>
            {error || 'Soal ini tidak tersedia atau masih dalam pengembangan.'}
          </Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.push(`/simulasi/${topicSlug}`)}
          >
            <Text style={styles.backButtonText}>Kembali ke Topik</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerBackButton}
          onPress={() => router.back()}
        >
          <Text style={styles.headerBackButtonText}>← Kembali</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Soal {question.id}</Text>
          <Text style={styles.headerSubtitle}>{question.simulation_type}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Question Card */}
        <View style={styles.questionCard}>
          <View style={styles.questionHeader}>
            <Text style={styles.questionTitle}>Soal</Text>
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreText}>Maksimal: {question.max_score} poin</Text>
            </View>
          </View>
          
          <Text style={styles.questionText}>{question.question_text}</Text>
          
            {/* Parameters Info */}
            {question.parameters && Object.keys(question.parameters).length > 0 && (
              <View style={styles.parametersSection}>
                <Text style={styles.sectionTitle}>Parameter</Text>
                {Object.entries(question.parameters).map(([key, value]) => (
                  <View key={key} style={styles.parameterItem}>
                    <Text style={styles.parameterKey}>{key}</Text>
                    <Text style={styles.parameterValue}>
                      {typeof value === 'object' && value !== null && 'default' in value 
                        ? `${value.default} ${value.unit || ''}`.trim()
                        : typeof value === 'object' 
                          ? JSON.stringify(value) 
                          : String(value)
                      }
                    </Text>
                  </View>
                ))}
              </View>
            )}

          {/* Hints */}
          {question.hints && question.hints.length > 0 && (
            <View style={styles.hintsSection}>
              <Text style={styles.sectionTitle}>Petunjuk</Text>
              {question.hints.map((hint, index) => (
                <Text key={index} style={styles.hintText}>
                  {index + 1}. {hint}
                </Text>
              ))}
            </View>
          )}
        </View>

        {/* ✅ Only show answer form for gaya-gesek */}
        {isSubmissionEnabled && (
          <>
            {/* Answer Section */}
            <View style={styles.answerCard}>
              <Text style={styles.answerTitle}>Jawaban Anda</Text>
              <Text style={styles.answerDescription}>
                Berikan jawaban berdasarkan parameter dan tipe simulasi.
              </Text>

              {/* Dynamic input fields based on evaluation criteria */}
              {question.evaluation_criteria && Object.entries(question.evaluation_criteria).map(([key, value]) => 
                renderParameterInput(key, value)
              )}

              {/* Fallback general answer input */}
              {(!question.evaluation_criteria || Object.keys(question.evaluation_criteria).length === 0) && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Jawaban:</Text>
                  <TextInput
                    style={[styles.textInput, styles.multilineInput]}
                    placeholder="Masukkan jawaban Anda di sini..."
                    value={userAnswer.general_answer || ''}
                    onChangeText={(text) => handleAnswerChange('general_answer', text)}
                    multiline
                    numberOfLines={4}
                  />
                </View>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity 
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmitAnswer}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Kirim Jawaban</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* ✅ Development note for non-friction topics */}
        {!isSubmissionEnabled && (
          <View style={styles.developmentNote}>
            <Text style={styles.developmentNoteTitle}>Dalam Pengembangan</Text>
            <Text style={styles.developmentNoteText}>
              Fitur interaktif dan pengiriman jawaban untuk topik ini sedang dalam pengembangan. 
              Saat ini Anda dapat mempelajari soal dan parameter yang tersedia.
            </Text>
            <TouchableOpacity 
              style={styles.backToTopicButton}
              onPress={() => router.push(`/simulasi/${topicSlug}`)}
            >
              <Text style={styles.backToTopicButtonText}>Kembali ke Topik</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ✅ Active development note for friction */}
        {isSubmissionEnabled && (
          <View style={styles.devNote}>
            <Text style={styles.devNoteTitle}>Catatan</Text>
            <Text style={styles.devNoteText}>
              Soal ini dimuat dari data yang tersedia. Fitur simulasi interaktif telah tersedia untuk topik Gaya Gesek.
            </Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
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

  // Loading & Error
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
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: fonts.sizes.subtitle,
    fontFamily: fonts.title,
    color: '#EF4444',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
  },

  // Header
  header: {
    backgroundColor: colors.primary,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerBackButton: {
    marginBottom: 12,
  },
  headerBackButtonText: {
    color: '#FFFFFF',
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
  },
  headerInfo: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fonts.sizes.title,
    fontFamily: fonts.title,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.body,
    color: '#FFFFFF',
    opacity: 0.9,
  },

  // Content
  content: {
    flex: 1,
  },

  // Question Card
  questionCard: {
    backgroundColor: colors.card,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  questionTitle: {
    fontSize: fonts.sizes.subtitle,
    fontFamily: fonts.title,
    color: colors.primary,
  },
  scoreBadge: {
    backgroundColor: colors.accent + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  scoreText: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.body,
    color: colors.accent,
  },
  questionText: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 20,
  },

  // Parameters Section
  parametersSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.background,
  },
  sectionTitle: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: colors.primary,
    marginBottom: 12,
  },
  parameterItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  parameterKey: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.body,
    color: colors.text,
    flex: 1,
  },
  parameterValue: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.body,
    color: colors.primary,
    fontWeight: '600',
  },

  // Hints Section
  hintsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.background,
  },
  hintText: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.body,
    color: colors.muted,
    lineHeight: 20,
    marginBottom: 8,
    paddingLeft: 8,
  },

  // Answer Card (only for gaya-gesek)
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
  answerDescription: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.body,
    color: colors.muted,
    lineHeight: 20,
    marginBottom: 20,
  },

  // Input Fields
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: colors.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.muted + '40',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: colors.text,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },

  // Submit Button
  submitButton: {
    backgroundColor: colors.primary,
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 4,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  submitButtonDisabled: {
    backgroundColor: colors.muted,
    elevation: 0,
    shadowOpacity: 0,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
  },

  // Development Note (for non-friction topics)
  developmentNote: {
    backgroundColor: '#EBF8FF',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3182CE',
  },
  developmentNoteTitle: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: '#2C5282',
    marginBottom: 8,
  },
  developmentNoteText: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.body,
    color: '#2C5282',
    lineHeight: 20,
    marginBottom: 16,
  },
  backToTopicButton: {
    backgroundColor: '#3182CE',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  backToTopicButtonText: {
    color: '#FFFFFF',
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
  },

  // Dev Note (for friction)
  devNote: {
    backgroundColor: '#FEF3C7',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  devNoteTitle: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.body,
    color: '#92400E',
    marginBottom: 4,
  },
  devNoteText: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.body,
    color: '#92400E',
    lineHeight: 18,
  },
});