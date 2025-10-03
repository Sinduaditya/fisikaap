import { AuthGuard } from '@/components/AuthGuard';
import { colors, fonts } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { apiService, SimulationTopic } from '@/services/api';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

function SimulationContent() {
  const router = useRouter();
  const { user } = useAuth();

  // State management
  const [topics, setTopics] = useState<SimulationTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadSimulationTopics();
  }, []);

  const loadSimulationTopics = async () => {
    try {
      setLoading(true);
      
      const response = await apiService.getSimulationTopics();
      
      if (response.status === 'success' && response.data) {
        const simulationTopics = response.data.topics || [];
        setTopics(simulationTopics);
        console.log('✅ Simulation topics loaded:', simulationTopics.length);
      } else {
        console.log('⚠️ API failed, loading mock data');
        loadMockTopics();
      }
    } catch (error) {
      console.error('❌ Failed to load simulation topics:', error);
      loadMockTopics();
    } finally {
      setLoading(false);
    }
  };

  const loadMockTopics = () => {
    const mockTopics: SimulationTopic[] = [
      {
        id: 1,
        name: "Hukum Newton",
        slug: "hukum-newton",
        description: "Simulasi gerak benda dengan berbagai gaya",
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
      },
      {
        id: 2,
        name: "Energi Kinetik",
        slug: "energi-kinetik",
        description: "Simulasi energi kinetik dan potensial",
        icon: "🔋",
        difficulty: "Intermediate",
        estimated_duration: 20,
        question_count: 4,
        progress: {
          completed_questions: 0,
          total_questions: 4,
          best_score: 0,
          is_completed: false,
          progress_percentage: 0,
        }
      },
      {
        id: 3,
        name: "Gelombang",
        slug: "gelombang",
        description: "Simulasi propagasi gelombang",
        icon: "🌊",
        difficulty: "Advanced",
        estimated_duration: 25,
        question_count: 6,
        progress: {
          completed_questions: 0,
          total_questions: 6,
          best_score: 0,
          is_completed: false,
          progress_percentage: 0,
        }
      },
    ];
    
    setTopics(mockTopics);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSimulationTopics();
    setRefreshing(false);
  };

  const handleTopicPress = (topic: SimulationTopic) => {
    console.log('🔍 Topic pressed:', topic.name, topic.slug);
    router.push({
      pathname: '/simulasi/[slug]',
      params: { slug: topic.slug }
    });
  };

  const filteredTopics = topics.filter(topic =>
    topic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    topic.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return '#10B981';
      case 'intermediate': return '#F59E0B';
      case 'advanced': return '#EF4444';
      default: return colors.muted;
    }
  };

  const renderTopicItem = ({ item }: { item: SimulationTopic }) => (
    <TouchableOpacity
      style={styles.topicCard}
      onPress={() => handleTopicPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.topicHeader}>
        <View style={styles.topicIconContainer}>
          <Text style={styles.topicIcon}>{item.icon}</Text>
        </View>
        <View style={styles.topicInfo}>
          <Text style={styles.topicName}>{item.name}</Text>
          <Text style={styles.topicDescription}>{item.description}</Text>
          <View style={styles.topicMeta}>
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(item.difficulty) + '20' }]}>
              <Text style={[styles.difficultyText, { color: getDifficultyColor(item.difficulty) }]}>
                {item.difficulty}
              </Text>
            </View>
            <Text style={styles.duration}>⏱️ {item.estimated_duration} min</Text>
            <Text style={styles.questionCount}>📝 {item.question_count} soal</Text>
          </View>
        </View>
      </View>
      
      {item.progress && (
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressText}>
              Progress: {item.progress.completed_questions}/{item.progress.total_questions}
            </Text>
            <Text style={styles.progressPercentage}>
              {item.progress.progress_percentage}%
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { width: `${item.progress.progress_percentage}%` }
              ]}
            />
          </View>
          {item.progress.best_score > 0 && (
            <Text style={styles.bestScore}>
              Best Score: {item.progress.best_score}/100
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading simulations...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🔬 Simulasi Fisika</Text>
        <Text style={styles.headerSubtitle}>
          {topics.length} simulasi interaktif tersedia
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Cari simulasi..."
          placeholderTextColor={colors.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Topics List */}
      <FlatList
        data={filteredTopics}
        renderItem={renderTopicItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>🔍 No simulations found</Text>
            <Text style={styles.emptyMessage}>
              {searchQuery ? 'Try different keywords' : 'Check back later for new content'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

export default function SimulationScreen() {
  return (
      <SimulationContent />
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

  // Header
  header: {
    backgroundColor: colors.primary,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
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

  // Search
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  searchInput: {
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: colors.text,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },

  // List
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  topicCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  topicHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  topicIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  topicIcon: {
    fontSize: 24,
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
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
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
    marginTop: 16,
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
});