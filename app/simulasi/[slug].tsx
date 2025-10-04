import { AuthGuard } from '@/components/AuthGuard';
import { colors, fonts } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { apiService, PhysicsTopic, SimulationQuestion } from '@/services/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

function TopicSimulationContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  // State management
  const [topic, setTopic] = useState<PhysicsTopic | null>(null);
  const [questions, setQuestions] = useState<SimulationQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      loadTopicData();
    }
  }, [slug]);

  const loadTopicData = async () => {
    if (!slug) return;
    
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Loading topic data for slug:', slug);

      const [topicResponse, questionsResponse] = await Promise.allSettled([
        apiService.getTopicBySlug(slug),
        apiService.getTopicQuestions(slug)
      ]);

      if (topicResponse.status === 'fulfilled' && 
          topicResponse.value.status === 'success' && 
          topicResponse.value.data) {
        setTopic(topicResponse.value.data.topic);
        console.log('✅ Topic loaded:', topicResponse.value.data.topic.name);
      } else {
        throw new Error('Topic not found or API error');
      }

      if (questionsResponse.status === 'fulfilled' && 
          questionsResponse.value.status === 'success' && 
          questionsResponse.value.data) {
        setQuestions(questionsResponse.value.data.questions || []);
        console.log('✅ Questions loaded:', questionsResponse.value.data.questions?.length || 0);
      } else {
        console.log('⚠️ No questions available for this topic');
        setQuestions([]);
      }

    } catch (error: any) {
      console.error('❌ Failed to load topic data:', error);
      setError(error.message || 'Failed to load topic data. Please try again.');
    } finally {
      setLoading(false);
    }
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
        topicSlug: slug || '',
        questionData: JSON.stringify(question)
      }
    });
  };

  const handleStartSimulation = () => {
    if (!topic) return;
    
    // ✅ Only gaya-gesek has interactive simulation
    if (topic.slug === 'gaya-gesek') {
      router.push({
        pathname: '/simulasi/interactive/friction',
        params: { 
          slug: topic.slug
        }
      });
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return '#10B981';
      case 'intermediate': return '#F59E0B';
      case 'advanced': return '#EF4444';
      default: return colors.muted;
    }
  };

  const getTopicStatus = () => {
    if (!topic) return { label: 'Unknown', color: colors.muted, description: '' };
    
    if (topic.slug === 'gaya-gesek') {
      return {
        label: 'Siap',
        color: '#10B981',
        description: 'Simulasi interaktif tersedia'
      };
    } else {
      return {
        label: 'Dalam Pengembangan',
        color: '#F59E0B',
        description: 'Soal tersedia, simulasi segera hadir'
      };
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
            <Text style={styles.simulationType}>{item.simulation_type}</Text>
            <Text style={styles.maxScore}>Maksimal: {item.max_score} poin</Text>
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
          <Text style={styles.loadingText}>Memuat topik...</Text>
        </View>
      </View>
    );
  }

  if (error || !topic) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>
            {error ? 'Error' : 'Topik Tidak Ditemukan'}
          </Text>
          <Text style={styles.errorMessage}>
            {error || `Topik "${slug}" tidak tersedia atau masih dalam pengembangan.`}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={error ? loadTopicData : () => router.back()}>
            <Text style={styles.retryButtonText}>{error ? 'Coba Lagi' : 'Kembali'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const status = getTopicStatus();

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
          <Text style={styles.headerTitle}>{topic.name}</Text>
          <Text style={styles.headerSubtitle}>{topic.subtitle}</Text>
        </View>
      </View>

      <FlatList
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListHeaderComponent={
          <View>
            {/* Topic Info Card */}
            <View style={styles.topicCard}>
              <View style={styles.topicHeader}>
                <View style={styles.topicInfo}>
                  <Text style={styles.topicName}>{topic.name}</Text>
                  <Text style={styles.topicDescription}>{topic.description || topic.subtitle}</Text>
                  
                  <View style={styles.topicMeta}>
                    <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
                      <Text style={[styles.statusText, { color: status.color }]}>
                        {status.label}
                      </Text>
                    </View>
                    <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(topic.difficulty) + '20' }]}>
                      <Text style={[styles.difficultyText, { color: getDifficultyColor(topic.difficulty) }]}>
                        {topic.difficulty === 'Beginner' ? 'Pemula' :
                         topic.difficulty === 'Intermediate' ? 'Menengah' : 'Lanjut'}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={styles.statusDescription}>{status.description}</Text>
                </View>
              </View>

              {/* Topic Stats */}
              <View style={styles.topicStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{topic.estimated_duration} menit</Text>
                  <Text style={styles.statLabel}>Durasi</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{questions.length}</Text>
                  <Text style={styles.statLabel}>Soal</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {questions.reduce((sum, q) => sum + q.max_score, 0)}
                  </Text>
                  <Text style={styles.statLabel}>Skor Maksimal</Text>
                </View>
              </View>
            </View>

            {/* ✅ Action Buttons - Only show for gaya-gesek */}
            {topic.slug === 'gaya-gesek' && (
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.primaryButton}
                  onPress={handleStartSimulation}
                >
                  <Text style={styles.primaryButtonText}>Mulai Simulasi Interaktif</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ✅ Development note for other topics */}
            {topic.slug !== 'gaya-gesek' && (
              <View style={styles.developmentNote}>
                <Text style={styles.developmentNoteTitle}>Dalam Pengembangan</Text>
                <Text style={styles.developmentNoteText}>
                  Simulasi interaktif untuk topik ini sedang dalam pengembangan. 
                  Saat ini Anda dapat mengakses soal-soal latihan yang tersedia.
                </Text>
              </View>
            )}

            {/* Questions Section Header */}
            {questions.length > 0 && (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Soal Tersedia</Text>
                <Text style={styles.sectionSubtitle}>
                  Berlatih dengan {questions.length} soal dari API
                </Text>
              </View>
            )}
          </View>
        }
        data={questions}
        renderItem={renderQuestionItem}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>Belum Ada Soal</Text>
              <Text style={styles.emptyMessage}>
                Soal untuk topik ini sedang dipersiapkan. Silakan kembali lagi nanti!
              </Text>
            </View>
          )
        }
        ListFooterComponent={<View style={{ height: 100 }} />}
      />
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
  
  // Loading & Error States
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
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
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
    textAlign: 'center',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.body,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
  },

  // Content
  content: {
    flex: 1,
  },

  // Topic Card
  topicCard: {
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
  topicHeader: {
    marginBottom: 16,
  },
  topicInfo: {
    flex: 1,
  },
  topicName: {
    fontSize: fonts.sizes.subtitle,
    fontFamily: fonts.title,
    color: colors.primary,
    marginBottom: 4,
  },
  topicDescription: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  topicMeta: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: fonts.sizes.caption,
    fontFamily: fonts.body,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: fonts.sizes.caption,
    fontFamily: fonts.body,
  },
  statusDescription: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.body,
    color: colors.muted,
    fontStyle: 'italic',
  },

  // Topic Stats
  topicStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.background,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: colors.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: fonts.sizes.caption,
    fontFamily: fonts.body,
    color: colors.muted,
  },

  // Action Buttons (only for gaya-gesek)
  actionButtons: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
  },

  // Development Note (for non-friction topics)
  developmentNote: {
    backgroundColor: '#EBF8FF',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
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
  },

  // Section Header
  sectionHeader: {
    paddingHorizontal: 20,
    marginTop: 32,
    marginBottom: 16,
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

  // Question Cards
  questionCard: {
    backgroundColor: colors.card,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  questionNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  questionNumberText: {
    color: '#FFFFFF',
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
  },
  questionInfo: {
    flex: 1,
  },
  questionTitle: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
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
    justifyContent: 'space-between',
  },
  simulationType: {
    fontSize: fonts.sizes.caption,
    fontFamily: fonts.body,
    color: colors.muted,
  },
  maxScore: {
    fontSize: fonts.sizes.caption,
    fontFamily: fonts.body,
    color: colors.accent,
  },
  questionArrow: {
    fontSize: 24,
    color: colors.muted,
    marginLeft: 8,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: fonts.sizes.subtitle,
    fontFamily: fonts.title,
    color: colors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
});