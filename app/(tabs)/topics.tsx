import { colors, fonts } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { apiService, PhysicsTopic } from '@/services/api';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
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

type FilterType = 'all' | 'beginner' | 'intermediate' | 'advanced';

export default function TopicsScreen() {
  const router = useRouter();
  const { user } = useAuth();

  // State management
  const [topics, setTopics] = useState<PhysicsTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');

  // Load topics on component mount
  useEffect(() => {
      loadTopics();
  }, []);

  const loadTopics = async () => {
    try {
      setLoading(true);
      
      const response = await apiService.getTopics();
      
      if (response.status === 'success' && response.data) {
        const topicsData = response.data.topics || [];
        console.log('✅ Topics loaded:', topicsData.length);
        setTopics(topicsData);
      } else {
        console.log('⚠️ Topics response:', response);
        loadMockTopics();
      }
    } catch (error) {
      console.error('❌ Failed to load topics:', error);
      loadMockTopics();
    } finally {
      setLoading(false);
    }
  };

  const loadMockTopics = () => {
    console.log('🔄 Loading mock topics...');
    const mockTopics: PhysicsTopic[] = [
      {
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
      {
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
      {
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
      {
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
    ];
    
    setTopics(mockTopics);
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTopics();
    setRefreshing(false);
  }, []);

  const handleTopicPress = (topic: PhysicsTopic) => {
    console.log('🔍 Topic selected:', topic.name, topic.slug);
    
    // Navigate to specific topic detail page
    router.push({
      pathname: '/topics/[slug]',
      params: { slug: topic.slug }
    });
  };

  // Filter dan search logic
  const filteredTopics = topics.filter(topic => {
    const matchesSearch = topic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         topic.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = selectedFilter === 'all' || 
                         topic.difficulty.toLowerCase() === selectedFilter;
    
    return matchesSearch && matchesFilter;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return '#10B981';
      case 'intermediate': return '#F59E0B';
      case 'advanced': return '#EF4444';
      default: return colors.primary;
    }
  };

  const getTopicIcon = (topic: PhysicsTopic) => {
    if (topic.icon) return topic.icon;
    // Default icons
    if (topic.name.includes('Newton')) return '⚡';
    if (topic.name.includes('Energi')) return '💫';
    if (topic.name.includes('Momentum')) return '🎯';
    if (topic.name.includes('Gesek')) return '🔥';
    return '🔬';
  };

  const getStatusIcon = (topic: PhysicsTopic) => {
    if (topic.progress?.is_completed) return '✅';
    if (topic.progress && topic.progress.progress_percentage > 0) return '🔄';
    return '🆕';
  };

  const renderFilter = (filter: FilterType, label: string) => (
    <TouchableOpacity
      key={filter}
      style={[
        styles.filterButton,
        selectedFilter === filter && styles.filterButtonActive
      ]}
      onPress={() => setSelectedFilter(filter)}
    >
      <Text style={[
        styles.filterText,
        selectedFilter === filter && styles.filterTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderTopicItem = ({ item, index }: { item: PhysicsTopic; index: number }) => (
    <TouchableOpacity
      style={styles.topicCard}
      onPress={() => handleTopicPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.topicHeader}>
        <View style={styles.topicIconContainer}>
          <Text style={styles.topicIcon}>{getTopicIcon(item)}</Text>
          <Text style={styles.statusIcon}>{getStatusIcon(item)}</Text>
        </View>
        
        <View style={styles.topicHeaderRight}>
          <View style={[
            styles.difficultyBadge,
            { backgroundColor: getDifficultyColor(item.difficulty) + '20' }
          ]}>
            <Text style={[
              styles.difficultyText,
              { color: getDifficultyColor(item.difficulty) }
            ]}>
              {item.difficulty === 'Beginner' ? 'Pemula' :
               item.difficulty === 'Intermediate' ? 'Menengah' : 'Lanjut'}
            </Text>
          </View>
          <Text style={styles.topicArrow}>›</Text>
        </View>
      </View>

      <View style={styles.topicContent}>
        <Text style={styles.topicTitle}>{item.name}</Text>
        <Text style={styles.topicSubtitle}>{item.subtitle}</Text>
        
        <View style={styles.topicMeta}>
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>⏱️</Text>
            <Text style={styles.metaText}>{item.estimated_duration} min</Text>
          </View>
          
          {item.progress && (
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>🏆</Text>
              <Text style={styles.metaText}>{item.progress.best_score}/100</Text>
            </View>
          )}
        </View>

        {/* Progress Bar */}
        {item.progress && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { 
                    width: `${item.progress.progress_percentage}%`,
                    backgroundColor: getDifficultyColor(item.difficulty)
                  }
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {item.progress.completed_questions}/{item.progress.total_questions} soal • {item.progress.progress_percentage}%
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );


  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📚 Topik Fisika</Text>
        <Text style={styles.headerSubtitle}>
          {topics.length} topik tersedia untuk dipelajari
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Cari topik fisika..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.muted}
          />
        </View>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {renderFilter('all', 'Semua')}
        {renderFilter('beginner', 'Pemula')}
        {renderFilter('intermediate', 'Menengah')}
        {renderFilter('advanced', 'Lanjut')}
      </View>

      {/* Topics List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Memuat topik...</Text>
        </View>
      ) : (
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
              <Text style={styles.emptyTitle}>😅 Tidak ada topik</Text>
              <Text style={styles.emptyMessage}>
                {searchQuery ? 
                  'Coba ubah kata kunci pencarian Anda' :
                  'Belum ada topik yang tersedia'
                }
              </Text>
            </View>
          }
        />
      )}
    </View>
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: colors.text,
  },

  // Filter
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.body,
    color: colors.muted,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },

  // Loading
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

  // List
  listContainer: {
    padding: 20,
    paddingBottom: 120, // Space for tab bar
  },

  // Topic Card
  topicCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  topicIconContainer: {
    position: 'relative',
  },
  topicIcon: {
    fontSize: 32,
  },
  statusIcon: {
    position: 'absolute',
    top: -4,
    right: -4,
    fontSize: 12,
  },
  topicHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: fonts.sizes.caption,
    fontFamily: fonts.body,
  },
  topicArrow: {
    fontSize: 24,
    color: colors.muted,
  },

  // Topic Content
  topicContent: {
    gap: 8,
  },
  topicTitle: {
    fontSize: fonts.sizes.subtitle,
    fontFamily: fonts.title,
    color: colors.primary,
  },
  topicSubtitle: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: colors.muted,
  },
  topicMeta: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaIcon: {
    fontSize: 14,
  },
  metaText: {
    fontSize: fonts.sizes.caption,
    fontFamily: fonts.body,
    color: colors.muted,
  },

  // Progress
  progressContainer: {
    marginTop: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.muted + '30',
    borderRadius: 3,
    marginBottom: 6,
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  progressText: {
    fontSize: fonts.sizes.caption,
    fontFamily: fonts.body,
    color: colors.muted,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
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