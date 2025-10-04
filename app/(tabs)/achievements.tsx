import { colors, fonts } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { Achievement, apiService } from '@/services/api';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface UserAchievement extends Achievement {
  is_earned: boolean;
  earned_at?: string;
  progress?: {
    current: number;
    target: number;
    percentage: number;
  };
}

type FilterType = 'all' | 'earned' | 'available' | 'locked';

export default function AchievementsScreen() {
  const router = useRouter();
  const { user } = useAuth();

  // State management
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<any[]>([]);
  const [combinedAchievements, setCombinedAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    earned: 0,
    available: 0,
    totalXP: 0,
    earnedXP: 0,
  });

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      setLoading(true);

      // ✅ Gunakan API dari api.ts
      const [allResponse, userResponse] = await Promise.allSettled([
        apiService.getAchievements(),        // ✅ GET /api/achievements
        apiService.getUserAchievements(),    // ✅ GET /api/user/achievements
      ]);

      let achievements: Achievement[] = [];
      let userAchievs: any[] = [];

      // Handle all achievements response
      if (allResponse.status === 'fulfilled' && 
          allResponse.value.status === 'success' && 
          allResponse.value.data) {
        achievements = allResponse.value.data.achievements || [];
        console.log('✅ All achievements loaded:', achievements.length);
      } else {
        console.log('⚠️ All achievements API failed, using mock data');
        achievements = getMockAchievements();
      }

      // Handle user achievements response
      if (userResponse.status === 'fulfilled' && 
          userResponse.value.status === 'success' && 
          userResponse.value.data) {
        userAchievs = userResponse.value.data.achievements || [];
        console.log('✅ User achievements loaded:', userAchievs.length);
      } else {
        console.log('⚠️ User achievements API failed, using mock data');
        userAchievs = getMockUserAchievements();
      }

      // Combine data
      const combined = combineAchievements(achievements, userAchievs);
      
      setAllAchievements(achievements);
      setUserAchievements(userAchievs);
      setCombinedAchievements(combined);
      calculateStats(combined);

    } catch (error) {
      console.error('❌ Failed to load achievements:', error);
      // Fallback dengan mock data
      loadMockAchievements();
    } finally {
      setLoading(false);
    }
  };

  const loadMockAchievements = () => {
    console.log('🔄 Loading mock achievements...');
    const mockAll = getMockAchievements();
    const mockUser = getMockUserAchievements();
    const combined = combineAchievements(mockAll, mockUser);
    
    setAllAchievements(mockAll);
    setUserAchievements(mockUser);
    setCombinedAchievements(combined);
    calculateStats(combined);
  };

  const getMockAchievements = (): Achievement[] => [
    {
      id: 1,
      name: "First Steps",
      description: "Complete your first physics simulation",
      icon: "🚀",
      xp_reward: 50,
      criteria: { simulations_completed: 1 }
    },
    {
      id: 2,
      name: "Physics Explorer",
      description: "Complete 5 different physics simulations",
      icon: "🔬",
      xp_reward: 100,
      criteria: { simulations_completed: 5 }
    },
    {
      id: 3,
      name: "Newton's Apprentice",
      description: "Master all Newton's Law simulations",
      icon: "⚡",
      xp_reward: 150,
      criteria: { topic_completed: "newton-laws" }
    },
    {
      id: 4,
      name: "Perfect Score",
      description: "Get 100% score in any simulation",
      icon: "🎯",
      xp_reward: 75,
      criteria: { perfect_score: 1 }
    },
    {
      id: 5,
      name: "Consistent Learner",
      description: "Study for 7 consecutive days",
      icon: "📅",
      xp_reward: 200,
      criteria: { streak_days: 7 }
    },
    {
      id: 6,
      name: "Speed Runner",
      description: "Complete a simulation in under 30 seconds",
      icon: "⚡",
      xp_reward: 100,
      criteria: { fast_completion: 30 }
    },
    {
      id: 7,
      name: "Knowledge Seeker",
      description: "Reach 1000 total XP",
      icon: "🏆",
      xp_reward: 250,
      criteria: { total_xp: 1000 }
    },
    {
      id: 8,
      name: "Physics Master",
      description: "Complete all available topics",
      icon: "👑",
      xp_reward: 500,
      criteria: { all_topics_completed: true }
    }
  ];

  const getMockUserAchievements = () => [
    {
      achievement_id: 1,
      earned_at: "2024-01-15T10:30:00Z",
      progress: { current: 1, target: 1, percentage: 100 }
    },
    {
      achievement_id: 2,
      earned_at: "2024-01-18T14:20:00Z", 
      progress: { current: 5, target: 5, percentage: 100 }
    },
    {
      achievement_id: 4,
      earned_at: "2024-01-20T09:15:00Z",
      progress: { current: 1, target: 1, percentage: 100 }
    },
    // Progress achievements (not earned yet)
    {
      achievement_id: 3,
      earned_at: null,
      progress: { current: 2, target: 3, percentage: 67 }
    },
    {
      achievement_id: 5,
      earned_at: null,
      progress: { current: 3, target: 7, percentage: 43 }
    },
    {
      achievement_id: 7,
      earned_at: null,
      progress: { current: 750, target: 1000, percentage: 75 }
    }
  ];

  const combineAchievements = (allAchievements: Achievement[], userAchievements: any[]): UserAchievement[] => {
    return allAchievements.map(achievement => {
      const userProgress = userAchievements.find(ua => ua.achievement_id === achievement.id);
      
      return {
        ...achievement,
        is_earned: !!userProgress?.earned_at,
        earned_at: userProgress?.earned_at,
        progress: userProgress?.progress
      };
    });
  };

  const calculateStats = (achievements: UserAchievement[]) => {
    const total = achievements.length;
    const earned = achievements.filter(a => a.is_earned).length;
    const available = achievements.filter(a => !a.is_earned && a.progress).length;
    const totalXP = achievements.reduce((sum, a) => sum + a.xp_reward, 0);
    const earnedXP = achievements.filter(a => a.is_earned).reduce((sum, a) => sum + a.xp_reward, 0);

    setStats({ total, earned, available, totalXP, earnedXP });
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAchievements();
    setRefreshing(false);
  }, []);

  const handleAchievementPress = (achievement: UserAchievement) => {
    console.log('🏆 Achievement pressed:', achievement.name);
    // Could navigate to achievement detail or show modal
  };

  // Filter achievements
  const filteredAchievements = combinedAchievements.filter(achievement => {
    switch (selectedFilter) {
      case 'earned':
        return achievement.is_earned;
      case 'available':
        return !achievement.is_earned && achievement.progress;
      case 'locked':
        return !achievement.is_earned && !achievement.progress;
      default:
        return true;
    }
  });

  const getAchievementCardStyle = (achievement: UserAchievement) => {
    if (achievement.is_earned) {
      return [styles.achievementCard, styles.achievementCardEarned];
    } else if (achievement.progress) {
      return [styles.achievementCard, styles.achievementCardAvailable];
    } else {
      return [styles.achievementCard, styles.achievementCardLocked];
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const renderFilter = (filter: FilterType, label: string, count: number) => (
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
        {label} ({count})
      </Text>
    </TouchableOpacity>
  );

  const renderAchievementItem = ({ item }: { item: UserAchievement }) => (
    <TouchableOpacity
      style={getAchievementCardStyle(item)}
      onPress={() => handleAchievementPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.achievementHeader}>
        <View style={styles.achievementIconContainer}>
          <Text style={[
            styles.achievementIcon,
            !item.is_earned && !item.progress && styles.achievementIconLocked
          ]}>
            {item.is_earned ? item.icon : (!item.progress ? '🔒' : item.icon)}
          </Text>
          {item.is_earned && (
            <View style={styles.earnedBadge}>
              <Text style={styles.earnedIcon}>✓</Text>
            </View>
          )}
        </View>
        
        <View style={styles.achievementReward}>
          <Text style={styles.xpIcon}>⭐</Text>
          <Text style={styles.xpText}>{item.xp_reward} XP</Text>
        </View>
      </View>

      <Text style={[
        styles.achievementTitle,
        !item.is_earned && !item.progress && styles.achievementTitleLocked
      ]}>
        {item.name}
      </Text>
      
      <Text style={[
        styles.achievementDescription,
        !item.is_earned && !item.progress && styles.achievementDescriptionLocked
      ]}>
        {item.description}
      </Text>

      {/* Progress Bar */}
      {item.progress && !item.is_earned && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { width: `${item.progress.percentage}%` }
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {item.progress.current}/{item.progress.target} ({item.progress.percentage}%)
          </Text>
        </View>
      )}

      {/* Earned Date */}
      {item.is_earned && item.earned_at && (
        <View style={styles.earnedContainer}>
          <Text style={styles.earnedIcon}>🎉</Text>
          <Text style={styles.earnedText}>
            Earned on {formatDate(item.earned_at)}
          </Text>
        </View>
      )}

      {/* Locked State */}
      {!item.is_earned && !item.progress && (
        <View style={styles.lockedContainer}>
          <Text style={styles.lockedText}>🔒 Locked</Text>
        </View>
      )}
    </TouchableOpacity>
  );


  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏆 Prestasi</Text>
        <Text style={styles.headerSubtitle}>
          Kumpulkan semua achievement dalam perjalanan belajar fisika
        </Text>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.earned}</Text>
            <Text style={styles.statLabel}>Earned</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.earnedXP}</Text>
            <Text style={styles.statLabel}>XP Earned</Text>
          </View>
        </View>

        {/* Progress Overview */}
        <View style={styles.progressOverview}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Progress Overview</Text>
            <Text style={styles.progressPercentage}>
              {Math.round((stats.earned / stats.total) * 100)}%
            </Text>
          </View>
          <View style={styles.overallProgressBar}>
            <View 
              style={[
                styles.overallProgressFill,
                { width: `${(stats.earned / stats.total) * 100}%` }
              ]}
            />
          </View>
          <Text style={styles.progressDescription}>
            {stats.earned} of {stats.total} achievements completed
          </Text>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {renderFilter('all', 'All', stats.total)}
            {renderFilter('earned', 'Earned', stats.earned)}
            {renderFilter('available', 'Available', stats.available)}
            {renderFilter('locked', 'Locked', stats.total - stats.earned - stats.available)}
          </ScrollView>
        </View>

        {/* Achievements List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading achievements...</Text>
          </View>
        ) : (
          <View style={styles.achievementsList}>
            <FlatList
              data={filteredAchievements}
              renderItem={renderAchievementItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyTitle}>🎯 No achievements found</Text>
                  <Text style={styles.emptyMessage}>
                    {selectedFilter === 'earned' && 'Complete simulations to earn achievements!'}
                    {selectedFilter === 'available' && 'Keep learning to unlock new achievements!'}
                    {selectedFilter === 'locked' && 'All achievements are unlocked!'}
                  </Text>
                </View>
              }
            />
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={{ height: 120 }} />
      </ScrollView>
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

  // Stats
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  statNumber: {
    fontSize: fonts.sizes.subtitle,
    fontFamily: fonts.title,
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: fonts.sizes.caption,
    fontFamily: fonts.body,
    color: colors.muted,
  },

  // Progress Overview
  progressOverview: {
    backgroundColor: colors.card,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: colors.text,
  },
  progressPercentage: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: colors.primary,
  },
  overallProgressBar: {
    height: 8,
    backgroundColor: colors.muted + '30',
    borderRadius: 4,
    marginBottom: 8,
  },
  overallProgressFill: {
    height: 8,
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressDescription: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.body,
    color: colors.muted,
  },

  // Filter
  filterContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
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
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: colors.muted,
  },

  // Achievements List
  achievementsList: {
    paddingHorizontal: 20,
  },
  achievementCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  achievementCardEarned: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  achievementCardAvailable: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  achievementCardLocked: {
    opacity: 0.6,
    borderLeftWidth: 4,
    borderLeftColor: colors.muted,
  },

  // Achievement Content
  achievementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  achievementIconContainer: {
    position: 'relative',
  },
  achievementIcon: {
    fontSize: 32,
  },
  achievementIconLocked: {
    opacity: 0.5,
  },
  earnedBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  earnedIcon: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  achievementReward: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  xpIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  xpText: {
    fontSize: fonts.sizes.caption,
    fontFamily: fonts.body,
    color: colors.primary,
  },
  achievementTitle: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: colors.primary,
    marginBottom: 6,
  },
  achievementTitleLocked: {
    color: colors.muted,
  },
  achievementDescription: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.body,
    color: colors.muted,
    lineHeight: 20,
    marginBottom: 12,
  },
  achievementDescriptionLocked: {
    color: colors.muted + '80',
  },

  // Progress
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.muted + '30',
    borderRadius: 3,
    marginBottom: 4,
  },
  progressFill: {
    height: 6,
    backgroundColor: '#F59E0B',
    borderRadius: 3,
  },
  progressText: {
    fontSize: fonts.sizes.caption,
    fontFamily: fonts.body,
    color: colors.muted,
  },

  // States
  earnedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  earnedText: {
    fontSize: fonts.sizes.caption,
    fontFamily: fonts.body,
    color: '#10B981',
  },
  lockedContainer: {
    alignItems: 'center',
  },
  lockedText: {
    fontSize: fonts.sizes.caption,
    fontFamily: fonts.body,
    color: colors.muted,
  },

  // Empty State
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