import { colors, fonts } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { apiService, PhysicsTopic, SimulationQuestion } from '@/services/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

export default function TopicDetailScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();

  // State management
  const [topic, setTopic] = useState<PhysicsTopic | null>(null);
  const [questions, setQuestions] = useState<SimulationQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [questionsLoading, setQuestionsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && slug) {
      loadTopicDetail();
    }
  }, [isAuthenticated, slug]);

  const loadTopicDetail = async () => {
    if (!slug) return;
    
    try {
      setLoading(true);
      
      // ✅ Gunakan API yang ada dari api.ts
      const [topicResponse, questionsResponse] = await Promise.allSettled([
        apiService.getTopicBySlug(slug),           // ✅ GET /api/topics/{slug}
        apiService.getTopicQuestions(slug),       // ✅ GET /api/topics/{slug}/questions
      ]);

      // Handle topic response
      if (topicResponse.status === 'fulfilled' && 
          topicResponse.value.status === 'success' && 
          topicResponse.value.data) {
        setTopic(topicResponse.value.data.topic);
        console.log('✅ Topic loaded:', topicResponse.value.data.topic.name);
      } else {
        console.log('⚠️ Topic API failed, using mock data');
        loadMockTopic();
      }

      // Handle questions response
      if (questionsResponse.status === 'fulfilled' && 
          questionsResponse.value.status === 'success' && 
          questionsResponse.value.data) {
        setQuestions(questionsResponse.value.data.questions || []);
        console.log('✅ Questions loaded:', questionsResponse.value.data.questions?.length || 0);
      } else {
        console.log('⚠️ Questions API failed, using mock data');
        loadMockQuestions();
      }

    } catch (error) {
      console.error('❌ Failed to load topic detail:', error);
      // Fallback dengan mock data
      loadMockTopic();
      loadMockQuestions();
    } finally {
      setLoading(false);
    }
  };

  const loadMockTopic = () => {
    const mockTopics = {
      'hukum-newton': {
        id: 1,
        name: "Hukum Newton II",
        slug: "hukum-newton",
        subtitle: "F = m × a",
        difficulty: "Beginner",
        estimated_duration: 15,
        icon: "⚡",
        order_index: 1,
        progress: {
          completed_questions: 3,
          total_questions: 5,
          best_score: 85,
          is_completed: false,
          progress_percentage: 60,
        }
      },
      'energi-kinetik': {
        id: 2,
        name: "Energi Kinetik",
        slug: "energi-kinetik",
        subtitle: "Ek = ½mv²",
        difficulty: "Intermediate",
        estimated_duration: 20,
        icon: "💫",
        order_index: 2,
        progress: {
          completed_questions: 0,
          total_questions: 4,
          best_score: 0,
          is_completed: false,
          progress_percentage: 0,
        }
      },
      'momentum': {
        id: 3,
        name: "Momentum",
        slug: "momentum",
        subtitle: "p = m × v",
        difficulty: "Advanced",
        estimated_duration: 25,
        icon: "🎯",
        order_index: 3,
        progress: {
          completed_questions: 1,
          total_questions: 6,
          best_score: 78,
          is_completed: false,
          progress_percentage: 17,
        }
      },
      'gaya-gesek': {
        id: 4,
        name: "Gaya Gesek",
        slug: "gaya-gesek",
        subtitle: "f = μN",
        difficulty: "Beginner",
        estimated_duration: 18,
        icon: "🔥",
        order_index: 4,
        progress: {
          completed_questions: 3,
          total_questions: 3,
          best_score: 92,
          is_completed: true,
          progress_percentage: 100,
        }
      },
    };

    const mockTopic = mockTopics[slug as keyof typeof mockTopics];
    if (mockTopic) {
      setTopic(mockTopic as PhysicsTopic);
    }
  };

  const loadMockQuestions = () => {
    const mockQuestions: SimulationQuestion[] = [
      {
        id: 1,
        question_text: "Sebuah balok bermassa 5 kg didorong dengan gaya 20 N. Berapa percepatan balok tersebut?",
        simulation_type: "force_calculation",
        parameters: {
          mass: 5,
          force: 20,
          friction: 0
        },
        evaluation_criteria: {
          expected_acceleration: 4,
          tolerance: 0.1
        },
        hints: [
          "Gunakan rumus F = m × a",
          "Ingat bahwa a = F / m",
          "Pastikan satuan sudah benar"
        ],
        max_score: 100
      },
      {
        id: 2,
        question_text: "Dua balok dengan massa berbeda dihubungkan dengan tali. Hitung percepatan sistem!",
        simulation_type: "connected_blocks",
        parameters: {
          mass1: 3,
          mass2: 7,
          applied_force: 30
        },
        evaluation_criteria: {
          expected_acceleration: 3,
          tolerance: 0.2
        },
        hints: [
          "Gunakan hukum Newton untuk sistem",
          "Total massa = m1 + m2",
          "a = F_total / m_total"
        ],
        max_score: 100
      },
      {
        id: 3,
        question_text: "Sebuah mobil bergerak dengan kecepatan konstan 60 km/h. Tiba-tiba direm dengan gaya 1000 N. Massa mobil 800 kg. Berapa percepatan pengereman?",
        simulation_type: "braking_force",
        parameters: {
          mass: 800,
          initial_velocity: 16.67, // 60 km/h in m/s
          braking_force: 1000
        },
        evaluation_criteria: {
          expected_acceleration: -1.25,
          tolerance: 0.1
        },
        hints: [
          "Gaya rem berlawanan arah gerak",
          "a = F / m, dengan F negatif",
          "Konversi km/h ke m/s jika perlu"
        ],
        max_score: 100
      }
    ];

    setQuestions(mockQuestions);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTopicDetail();
    setRefreshing(false);
  };

  const handleQuestionPress = (question: SimulationQuestion) => {
    console.log('🔍 Question selected:', question.id, question.simulation_type);
    
    // Navigate to question simulation screen
    router.push({
      pathname: '/simulasi/question/[id]',
      params: { 
        id: question.id.toString(),
        topicSlug: slug || '',
        topicName: topic?.name || ''
      }
    });
  };

  const handleStartSimulation = () => {
    if (!topic) return;
    
    console.log('🚀 Start simulation for topic:', topic.slug);
    
    // Navigate to simulation screen with topic
    router.push({
      pathname: '/simulasi/[slug]',
      params: { slug: topic.slug }
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner': return '#10B981';
      case 'intermediate': return '#F59E0B';
      case 'advanced': return '#EF4444';
      default: return colors.primary;
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner': return 'Pemula';
      case 'intermediate': return 'Menengah';
      case 'advanced': return 'Lanjut';
      default: return difficulty;
    }
  };

  const getTopicIcon = (topic: PhysicsTopic) => {
    if (topic.icon) return topic.icon;
    // Default icons
    if (topic.name?.includes('Newton')) return '⚡';
    if (topic.name?.includes('Energi')) return '💫';
    if (topic.name?.includes('Momentum')) return '🎯';
    if (topic.name?.includes('Gesek')) return '🔥';
    return '🔬';
  };

  const renderQuestionItem = ({ item, index }: { item: SimulationQuestion; index: number }) => (
    <TouchableOpacity
      style={styles.questionCard}
      onPress={() => handleQuestionPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.questionHeader}>
        <View style={styles.questionNumber}>
          <Text style={styles.questionNumberText}>{index + 1}</Text>
        </View>
        <View style={styles.questionMeta}>
          <View style={styles.typeTag}>
            <Text style={styles.typeText}>{item.simulation_type}</Text>
          </View>
          <Text style={styles.questionArrow}>›</Text>
        </View>
      </View>
      
      <Text style={styles.questionText}>{item.question_text}</Text>
      
      <View style={styles.questionFooter}>
        <View style={styles.hintCount}>
          <Text style={styles.hintIcon}>💡</Text>
          <Text style={styles.hintText}>{item.hints?.length || 0} hints</Text>
        </View>
        <View style={styles.scoreInfo}>
          <Text style={styles.scoreIcon}>🏆</Text>
          <Text style={styles.scoreText}>{item.max_score} pts</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.authPrompt}>
          <Text style={styles.authTitle}>🔐 Login Required</Text>
          <Text style={styles.authMessage}>
            Please login to access topic details and simulation questions
          </Text>
          <TouchableOpacity 
            style={styles.authButton} 
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.authButtonText}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Memuat detail topik...</Text>
        </View>
      </View>
    );
  }

  if (!topic) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>😅 Topik Tidak Ditemukan</Text>
          <Text style={styles.errorMessage}>
            Topik dengan slug "{slug}" tidak tersedia
          </Text>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Kembali</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Topik</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Topic Card */}
      <View style={styles.topicCard}>
        <View style={styles.topicHeader}>
          <View style={styles.topicIconContainer}>
            <Text style={styles.topicIcon}>{getTopicIcon(topic)}</Text>
          </View>
          <View style={styles.topicHeaderRight}>
            <View style={[
              styles.difficultyBadge,
              { backgroundColor: getDifficultyColor(topic.difficulty) + '20' }
            ]}>
              <Text style={[
                styles.difficultyText,
                { color: getDifficultyColor(topic.difficulty) }
              ]}>
                {getDifficultyLabel(topic.difficulty)}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.topicTitle}>{topic.name}</Text>
        <Text style={styles.topicSubtitle}>{topic.subtitle}</Text>

        <View style={styles.topicStats}>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>⏱️</Text>
            <Text style={styles.statText}>{topic.estimated_duration} min</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>📝</Text>
            <Text style={styles.statText}>{questions.length} soal</Text>
          </View>
          {topic.progress && (
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>🏆</Text>
              <Text style={styles.statText}>{topic.progress.best_score}/100</Text>
            </View>
          )}
        </View>

        {/* Progress Bar */}
        {topic.progress && (
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progress</Text>
              <Text style={styles.progressPercentage}>
                {topic.progress.progress_percentage}%
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { 
                    width: `${topic.progress.progress_percentage}%`,
                    backgroundColor: getDifficultyColor(topic.difficulty)
                  }
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {topic.progress.completed_questions}/{topic.progress.total_questions} soal selesai
            </Text>
          </View>
        )}

        {/* Action Button */}
        <TouchableOpacity 
          style={[
            styles.actionButton,
            { backgroundColor: getDifficultyColor(topic.difficulty) }
          ]}
          onPress={handleStartSimulation}
        >
          <Text style={styles.actionButtonText}>
            {topic.progress?.is_completed ? '🔄 Ulangi Simulasi' : '🚀 Mulai Simulasi'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Questions Section */}
      <View style={styles.questionsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📋 Daftar Soal</Text>
          <Text style={styles.sectionSubtitle}>
            {questions.length} soal simulasi tersedia
          </Text>
        </View>

        {questionsLoading ? (
          <View style={styles.questionsLoading}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Memuat soal...</Text>
          </View>
        ) : questions.length > 0 ? (
          <FlatList
            data={questions}
            renderItem={renderQuestionItem}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyQuestions}>
            <Text style={styles.emptyTitle}>📝 Belum Ada Soal</Text>
            <Text style={styles.emptyMessage}>
              Soal untuk topik ini sedang dalam pengembangan
            </Text>
          </View>
        )}
      </View>

      {/* Bottom Spacing */}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Auth Prompt
  authPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  authTitle: {
    fontSize: fonts.sizes.title,
    fontFamily: fonts.title,
    color: colors.primary,
    marginBottom: 12,
  },
  authMessage: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: 24,
  },
  authButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 20,
  },
  authButtonText: {
    color: '#FFFFFF',
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
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
    padding: 20,
  },
  errorTitle: {
    fontSize: fonts.sizes.title,
    fontFamily: fonts.title,
    color: colors.primary,
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: 24,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    fontFamily: fonts.body,
  },
  headerTitle: {
    fontSize: fonts.sizes.subtitle,
    fontFamily: fonts.title,
    color: '#FFFFFF',
  },
  headerSpacer: {
    width: 40,
  },

  // Topic Card
  topicCard: {
    backgroundColor: colors.card,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    padding: 24,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  topicIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicIcon: {
    fontSize: 28,
  },
  topicHeaderRight: {
    alignItems: 'flex-end',
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: fonts.sizes.caption,
    fontFamily: fonts.body,
  },
  topicTitle: {
    fontSize: fonts.sizes.title,
    fontFamily: fonts.title,
    color: colors.primary,
    marginBottom: 8,
  },
  topicSubtitle: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: colors.muted,
    marginBottom: 20,
  },
  topicStats: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statIcon: {
    fontSize: 16,
  },
  statText: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.body,
    color: colors.muted,
  },

  // Progress
  progressContainer: {
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: colors.text,
  },
  progressPercentage: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: colors.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.muted + '30',
    borderRadius: 4,
    marginBottom: 6,
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
  },
  progressText: {
    fontSize: fonts.sizes.caption,
    fontFamily: fonts.body,
    color: colors.muted,
  },

  // Action Button
  actionButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: '#FFFFFF',
  },

  // Questions Section
  questionsSection: {
    paddingHorizontal: 20,
    marginTop: 32,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: fonts.sizes.subtitle,
    fontFamily: fonts.title,
    color: colors.primary,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.body,
    color: colors.muted,
  },

  // Questions
  questionsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  questionCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionNumberText: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: '#FFFFFF',
  },
  questionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  typeTag: {
    backgroundColor: colors.secondary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    fontSize: fonts.sizes.caption,
    fontFamily: fonts.body,
    color: colors.secondary,
  },
  questionArrow: {
    fontSize: 20,
    color: colors.muted,
  },
  questionText: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 16,
  },
  questionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hintCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hintIcon: {
    fontSize: 14,
  },
  hintText: {
    fontSize: fonts.sizes.caption,
    fontFamily: fonts.body,
    color: colors.muted,
  },
  scoreInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scoreIcon: {
    fontSize: 14,
  },
  scoreText: {
    fontSize: fonts.sizes.caption,
    fontFamily: fonts.body,
    color: colors.accent,
  },

  // Empty State
  emptyQuestions: {
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
});