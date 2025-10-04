import { AuthGuard } from '@/components/AuthGuard';
import { colors, fonts } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { apiService, PhysicsTopic } from '@/services/api';
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
  const [topics, setTopics] = useState<PhysicsTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSimulationTopics();
  }, []);

  const loadSimulationTopics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📡 Loading simulation topics from API...');
      const response = await apiService.getSimulationTopics();
      
      if (response.status === 'success' && response.data) {
        const simulationTopics = response.data.topics || [];
        
        // ✅ Filter 4 topik yang diinginkan: hukum-newton, energi-kinetik, momentum, gaya-gesek
        const targetSlugs = ['hukum-newton', 'energi-kinetik', 'momentum', 'gaya-gesek'];
        const filteredTopics = simulationTopics.filter(topic => 
          targetSlugs.includes(topic.slug)
        );
        
        setTopics(filteredTopics);
        console.log('✅ Simulation topics loaded:', filteredTopics.length);
        
        if (filteredTopics.length === 0) {
          setError('No simulation topics available. Please check with administrator.');
        }
      } else {
        throw new Error(response.message || 'Failed to load topics');
      }
    } catch (error: any) {
      console.error('❌ Failed to load simulation topics:', error);
      setError(error.message || 'Unable to load simulation topics. Please check your connection and try again.');
      setTopics([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSimulationTopics();
    setRefreshing(false);
  };

  const handleTopicPress = (topic: PhysicsTopic) => {
    console.log('🔍 Topic pressed:', topic.name, topic.slug);
    
    // ✅ Untuk gaya-gesek gunakan simulasi WebView Matter.js
    if (topic.slug === 'gaya-gesek') {
      router.push({
        pathname: '/simulasi/webview/[slug]',
        params: { slug: topic.slug }
      });
    } else {
      // ✅ Untuk topic lain (sedang dikembangkan), gunakan route standard
      router.push({
        pathname: '/simulasi/[slug]',
        params: { slug: topic.slug }
      });
    }
  };

  const filteredTopics = topics.filter(topic =>
    topic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (topic.description && topic.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return '#10B981';
      case 'intermediate': return '#F59E0B';
      case 'advanced': return '#EF4444';
      default: return colors.muted;
    }
  };

  const getTopicIcon = (topic: PhysicsTopic) => {
    if (topic.icon) return topic.icon;
    // ✅ Icons untuk 4 topik
    switch (topic.slug) {
      case 'hukum-newton': return '⚡';
      case 'energi-kinetik': return '💫';
      case 'momentum': return '🎯';
      case 'gaya-gesek': return '🔥';
      default: return '🔬';
    }
  };

  const getTopicStatus = (topic: PhysicsTopic) => {
    // ✅ Gaya gesek ready dengan WebView, yang lain dalam pengembangan
    if (topic.slug === 'gaya-gesek') {
      return {
        label: 'Ready',
        color: '#10B981',
        description: 'Interactive simulation available'
      };
    } else {
      return {
        label: 'In Development',
        color: '#F59E0B',
        description: 'Coming soon'
      };
    }
  };

  const renderTopicItem = ({ item }: { item: PhysicsTopic }) => {
    const status = getTopicStatus(item);
    
    return (
      <TouchableOpacity
        style={styles.topicCard}
        onPress={() => handleTopicPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.topicHeader}>
          <View style={styles.topicIconContainer}>
            <Text style={styles.topicIcon}>{getTopicIcon(item)}</Text>
          </View>
          <View style={styles.topicInfo}>
            <Text style={styles.topicName}>{item.name}</Text>
            <Text style={styles.topicSubtitle}>{item.subtitle}</Text>
            {item.description && (
              <Text style={styles.topicDescription}>{item.description}</Text>
            )}
            
            <View style={styles.topicMeta}>
              <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(item.difficulty) + '20' }]}>
                <Text style={[styles.difficultyText, { color: getDifficultyColor(item.difficulty) }]}>
                  {item.difficulty}
                </Text>
              </View>
              <Text style={styles.duration}>⏱️ {item.estimated_duration} min</Text>
            </View>
          </View>
        </View>
        
        {/* Status Badge */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
          <Text style={styles.statusDescription}>{status.description}</Text>
        </View>
      </TouchableOpacity>
    );
  };

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
          Interactive physics simulations
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

      {/* Error State */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadSimulationTopics}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Topics List */}
      {!error && (
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
                {searchQuery ? 'Try different keywords' : 'No simulation topics available'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

export default function SimulationScreen() {
  return (
    <AuthGuard>
      <SimulationContent />
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

  // Error
  errorContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: fonts.sizes.subtitle,
    fontFamily: fonts.title,
    color: colors.primary,
    marginBottom: 8,
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
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
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
    marginBottom: 16,
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
  topicSubtitle: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: colors.secondary,
    marginBottom: 4,
  },
  topicDescription: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.body,
    color: colors.text,
    lineHeight: 18,
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
    fontFamily: fonts.body,
  },
  duration: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.body,
    color: colors.muted,
  },

  // Status
  statusContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.muted + '20',
    paddingTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.body,
  },
  statusDescription: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.body,
    color: colors.muted,
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