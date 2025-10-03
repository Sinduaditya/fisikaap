import { AuthGuard } from '@/components/AuthGuard';
import { colors, fonts } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { apiService, SimulationQuestion, SimulationTopic } from '@/services/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

function TopicSimulationContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  // State management
  const [topic, setTopic] = useState<SimulationTopic | null>(null);
  const [questions, setQuestions] = useState<SimulationQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (slug) {
      loadTopicData();
    }
  }, [slug]);

  const loadTopicData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading topic data for slug:', slug);

      // Try to get topic questions from API
      const response = await apiService.getTopicQuestions(slug);
      
      if (response.status === 'success' && response.data) {
        const { topic: topicData, questions: questionsData } = response.data;
        setTopic(topicData);
        setQuestions(questionsData || []);
        console.log('✅ Topic data loaded:', topicData.name);
      } else {
        console.log('⚠️ API failed, loading mock data');
        loadMockData();
      }

    } catch (error) {
      console.error('❌ Failed to load topic data:', error);
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = () => {
    const mockTopic: SimulationTopic = {
      id: 1,
      name: "Hukum Newton",
      slug: "hukum-newton",
      description: "Simulasi gerak benda dengan berbagai gaya dan percepatan",
      icon: "⚡",
      difficulty: "Beginner",
      estimated_duration: 15,
      question_count: 5,
      progress: {
        completed_questions: 2,
        total_questions: 5,
        best_score: 85,
        is_completed: false,
        progress_percentage: 40,
      }
    };

    const mockQuestions: SimulationQuestion[] = [
      {
        id: 1,
        question_text: "Sebuah benda bermassa 5 kg didorong dengan gaya 20 N. Berapa percepatan yang dialami benda tersebut?",
        simulation_type: "force_motion",
        parameters: {
          mass: { min: 1, max: 10, unit: 'kg', default: 5 },
          force: { min: 5, max: 50, unit: 'N', default: 20 },
          friction: { min: 0, max: 0.5, unit: 'coefficient', default: 0 }
        },
        evaluation_criteria: {
          acceleration_tolerance: 0.1,
          expected_formula: "a = F / m"
        },
        hints: [
          "Gunakan Hukum Newton II: F = ma",
          "Percepatan = Gaya / Massa",
          "Satuan percepatan adalah m/s²"
        ],
        max_score: 100
      },
      {
        id: 2,
        question_text: "Benda yang sama didorong dengan gaya 20 N di atas permukaan dengan koefisien gesek 0.1. Berapa percepatan yang dialami?",
        simulation_type: "force_motion_friction",
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
          "Jangan lupa memperhitungkan gaya gesek",
          "Gaya gesek = μ × m × g",
          "Gaya bersih = Gaya dorong - Gaya gesek"
        ],
        max_score: 100
      },
      // Add more questions...
    ];

    setTopic(mockTopic);
    setQuestions(mockQuestions);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTopicData();
    setRefreshing(false);
  };

  const handleQuestionPress = (question: SimulationQuestion) => {
    console.log('🔍 Question pressed:', question.id);
    router.push({
      pathname: '/simulasi/question/[id]',
      params: { 
        id: question.id.toString(),
        topicSlug: slug,
        questionData: JSON.stringify(question)
      }
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return '#10B981';
      case 'intermediate': return '#F59E0B';
      case 'advanced': return '#EF4444';
      default: return colors.muted;
    }
  };

  const renderQuestionItem = ({ item, index }: { item: SimulationQuestion; index: number }) => (
    <TouchableOpacity
      style={styles.questionCard}
      onPress={() => handleQuestionPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.questionHeader}>
        <View style={styles.questionNumber}>
          <Text style={styles.questionNumberText}>{index + 1}</Text>
        </View>
        <View style={styles.questionInfo}>
          <Text style={styles.questionTitle}>Soal {index + 1}</Text>
          <Text style={styles.questionPreview} numberOfLines={2}>
            {item.question_text}
          </Text>
          <View style={styles.questionMeta}>
            <Text style={styles.simulationType}>🔬 {item.simulation_type}</Text>
            <Text style={styles.maxScore}>Max: {item.max_score} pts</Text>
          </View>
        </View>
        <Text style={styles.questionArrow}>›</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading topic...</Text>
        </View>
      </View>
    );
  }

  if (!topic) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>❌ Topic Not Found</Text>
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerBackButton}
          onPress={() => router.back()}
        >
          <Text style={styles.headerBackButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{topic.icon} {topic.name}</Text>
          <Text style={styles.headerSubtitle}>{topic.description}</Text>
        </View>
      </View>

      {/* Topic Info */}
      <View style={styles.topicInfoCard}>
        <View style={styles.topicMeta}>
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(topic.difficulty) + '20' }]}>
            <Text style={[styles.difficultyText, { color: getDifficultyColor(topic.difficulty) }]}>
              {topic.difficulty}
            </Text>
          </View>
          <Text style={styles.duration}>⏱️ {topic.estimated_duration} min</Text>
          <Text style={styles.questionCount}>📝 {topic.question_count} soal</Text>
        </View>
        
        {topic.progress && (
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressText}>
                Progress: {topic.progress.completed_questions}/{topic.progress.total_questions}
              </Text>
              <Text style={styles.progressPercentage}>
                {topic.progress.progress_percentage}%
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { width: `${topic.progress.progress_percentage}%` }
                ]}
              />
            </View>
            {topic.progress.best_score > 0 && (
              <Text style={styles.bestScore}>
                Best Score: {topic.progress.best_score}/100
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Questions List */}
      <View style={styles.questionsSection}>
        <Text style={styles.sectionTitle}>📝 Daftar Soal Simulasi</Text>
        <FlatList
          data={questions}
          renderItem={renderQuestionItem}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>📝 No questions available</Text>
              <Text style={styles.emptyMessage}>
                Questions for this topic are being prepared
              </Text>
            </View>
          }
        />
      </View>
    </View>
  );
}

export default function TopicSimulationScreen() {
  return (
    <AuthGuard>
      <TopicSimulationContent />
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
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: fonts.sizes.title,
    fontFamily: fonts.title,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: '#FFFFFF',
    opacity: 0.9,
  },

  // Topic Info
  topicInfoCard: {
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
  topicMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.bodySemiBold,
  },
  duration: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.body,
    color: colors.muted,
  },
  questionCount: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.body,
    color: colors.muted,
  },

  // Progress
  progressContainer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.muted + '20',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.bodySemiBold,
    color: colors.text,
  },
  progressPercentage: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.bodySemiBold,
    color: colors.primary,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.muted + '30',
    borderRadius: 3,
    marginBottom: 8,
  },
  progressFill: {
    height: 6,
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  bestScore: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.body,
    color: colors.accent,
  },

  // Questions
  questionsSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: fonts.sizes.subtitle,
    fontFamily: fonts.title,
    color: colors.primary,
    marginBottom: 16,
  },
  questionCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  questionNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  questionNumberText: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.bodySemiBold,
    color: colors.primary,
  },
  questionInfo: {
    flex: 1,
  },
  questionTitle: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.bodySemiBold,
    color: colors.primary,
    marginBottom: 4,
  },
  questionPreview: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.body,
    color: colors.text,
    lineHeight: 18,
    marginBottom: 8,
  },
  questionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  simulationType: {
    fontSize: fonts.sizes.caption,
    fontFamily: fonts.body,
    color: colors.muted,
  },
  maxScore: {
    fontSize: fonts.sizes.caption,
    fontFamily: fonts.bodySemiBold,
    color: colors.accent,
  },
  questionArrow: {
    fontSize: 20,
    color: colors.muted,
    marginLeft: 8,
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: fonts.sizes.subtitle,
    fontFamily: fonts.title,
    color: colors.primary,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: colors.muted,
    textAlign: 'center',
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