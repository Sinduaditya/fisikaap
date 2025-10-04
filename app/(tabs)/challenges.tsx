import { colors, fonts } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface Challenge {
  id: number;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'special' | 'achievement';
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  xp_reward: number;
  bonus_reward?: number;
  requirements: Record<string, any>;
  deadline?: string;
  is_completed: boolean;
  is_available: boolean;
  progress?: {
    current: number;
    target: number;
    percentage: number;
  };
  completed_at?: string;
  expires_at?: string;
  icon: string;
}

interface DailyChallenge extends Challenge {
  streak_bonus: number;
  reset_time: string;
  time_remaining: string;
}

type FilterType = 'all' | 'available' | 'completed' | 'expired';

export default function ChallengesScreen() {
  const router = useRouter();
  const { user } = useAuth();

  // State management
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('available');
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    available: 0,
    totalXP: 0,
    earnedXP: 0,
  });

  useEffect(() => {
      loadChallenges();
  }, []);

  // Timer untuk daily challenge countdown
  useEffect(() => {
    let interval: number;
    
    if (dailyChallenge && dailyChallenge.expires_at) {
      interval = setInterval(() => {
        const remaining = calculateTimeRemaining(dailyChallenge.expires_at!);
        setTimeRemaining(remaining);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [dailyChallenge]);

  const loadChallenges = async () => {
    try {
      setLoading(true);

      // ✅ Gunakan API dari api.ts
      const [dailyResponse, challengesResponse] = await Promise.allSettled([
        apiService.getDailyChallenge(),    // ✅ GET /api/challenges/daily
        apiService.getChallenges(),        // ✅ GET /api/challenges
      ]);

      let daily: DailyChallenge | null = null;
      let allChallenges: Challenge[] = [];

      // Handle daily challenge response
      if (dailyResponse.status === 'fulfilled' && 
          dailyResponse.value.status === 'success' && 
          dailyResponse.value.data) {
        daily = dailyResponse.value.data.challenge;
        console.log('✅ Daily challenge loaded:', daily?.title);
      } else {
        console.log('⚠️ Daily challenge API failed, using mock data');
        daily = getMockDailyChallenge();
      }

      // Handle challenges response
      if (challengesResponse.status === 'fulfilled' && 
          challengesResponse.value.status === 'success' && 
          challengesResponse.value.data) {
        allChallenges = challengesResponse.value.data.challenges || [];
        console.log('✅ Challenges loaded:', allChallenges.length);
      } else {
        console.log('⚠️ Challenges API failed, using mock data');
        allChallenges = getMockChallenges();
      }

      setDailyChallenge(daily);
      setChallenges(allChallenges);
      calculateStats(allChallenges, daily);

    } catch (error) {
      console.error('❌ Failed to load challenges:', error);
      // Fallback dengan mock data
      loadMockChallenges();
    } finally {
      setLoading(false);
    }
  };

  const loadMockChallenges = () => {
    console.log('🔄 Loading mock challenges...');
    const mockDaily = getMockDailyChallenge();
    const mockChallenges = getMockChallenges();
    
    setDailyChallenge(mockDaily);
    setChallenges(mockChallenges);
    calculateStats(mockChallenges, mockDaily);
  };

  const getMockDailyChallenge = (): DailyChallenge => ({
    id: 1,
    title: "Daily Physics Explorer",
    description: "Complete 3 physics simulations today to earn bonus XP and maintain your streak!",
    type: 'daily',
    difficulty: 'medium',
    xp_reward: 100,
    bonus_reward: 50,
    requirements: {
      simulations_completed: 3,
      topics_required: ['any']
    },
    deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
    is_completed: false,
    is_available: true,
    progress: {
      current: 1,
      target: 3,
      percentage: 33
    },
    streak_bonus: 25,
    reset_time: "00:00 UTC",
    time_remaining: "18:45:32",
    expires_at: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(), // 18 hours from now
    icon: "⏰"
  });

  const getMockChallenges = (): Challenge[] => [
    {
      id: 2,
      title: "Newton's Master",
      description: "Complete all Newton's Laws simulations with 90% accuracy or higher",
      type: 'achievement',
      difficulty: 'hard',
      xp_reward: 300,
      requirements: {
        topic: 'newton-laws',
        min_accuracy: 90,
        complete_all: true
      },
      is_completed: false,
      is_available: true,
      progress: {
        current: 2,
        target: 5,
        percentage: 40
      },
      icon: "⚡"
    },
    {
      id: 3,
      title: "Speed Learner",
      description: "Complete any simulation in under 60 seconds",
      type: 'special',
      difficulty: 'medium',
      xp_reward: 150,
      requirements: {
        max_time: 60,
        any_simulation: true
      },
      is_completed: true,
      is_available: true,
      completed_at: "2024-01-15T10:30:00Z",
      icon: "🚀"
    },
    {
      id: 4,
      title: "Weekly Warrior",
      description: "Complete 20 simulations this week",
      type: 'weekly',
      difficulty: 'hard',
      xp_reward: 500,
      bonus_reward: 100,
      requirements: {
        simulations_per_week: 20
      },
      deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
      is_completed: false,
      is_available: true,
      progress: {
        current: 12,
        target: 20,
        percentage: 60
      },
      expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      icon: "🏆"
    },
    {
      id: 5,
      title: "Perfect Score Hunter",
      description: "Achieve 100% score in 5 different simulations",
      type: 'achievement',
      difficulty: 'expert',
      xp_reward: 750,
      requirements: {
        perfect_scores: 5,
        different_topics: true
      },
      is_completed: false,
      is_available: true,
      progress: {
        current: 3,
        target: 5,
        percentage: 60
      },
      icon: "🎯"
    },
    {
      id: 6,
      title: "Energy Explorer",
      description: "Complete all Energy-related simulations",
      type: 'achievement',
      difficulty: 'medium',
      xp_reward: 200,
      requirements: {
        topic_category: 'energy',
        complete_all: true
      },
      is_completed: true,
      is_available: true,
      completed_at: "2024-01-12T16:45:00Z",
      icon: "💫"
    }
  ];

  const calculateStats = (challenges: Challenge[], daily: DailyChallenge | null) => {
    const allChallenges = daily ? [daily, ...challenges] : challenges;
    
    const total = allChallenges.length;
    const completed = allChallenges.filter(c => c.is_completed).length;
    const available = allChallenges.filter(c => c.is_available && !c.is_completed).length;
    const totalXP = allChallenges.reduce((sum, c) => sum + c.xp_reward + (c.bonus_reward || 0), 0);
    const earnedXP = allChallenges.filter(c => c.is_completed).reduce((sum, c) => sum + c.xp_reward + (c.bonus_reward || 0), 0);

    setStats({ total, completed, available, totalXP, earnedXP });
  };

  const calculateTimeRemaining = (expiresAt: string): string => {
    const now = new Date().getTime();
    const expiry = new Date(expiresAt).getTime();
    const diff = expiry - now;

    if (diff <= 0) return "Expired";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadChallenges();
    setRefreshing(false);
  }, []);

  const handleChallengePress = (challenge: Challenge) => {
    console.log('🎯 Challenge pressed:', challenge.title);
    
    if (challenge.is_completed) {
      Alert.alert('Challenge Completed', `You have already completed "${challenge.title}"`);
      return;
    }

    if (!challenge.is_available) {
      Alert.alert('Challenge Locked', `"${challenge.title}" is not available yet.`);
      return;
    }

    // Navigate based on challenge requirements
    if (challenge.requirements.topic) {
      router.push({
        pathname: '/simulasi/[slug]',
        params: { slug: challenge.requirements.topic }
      });
    } else {
      router.push('/(tabs)/topics');
    }
  };

  const handleDailyChallengePress = () => {
    if (!dailyChallenge) return;
    
    if (dailyChallenge.is_completed) {
      Alert.alert(
        'Daily Challenge Completed! 🎉',
        `You've earned ${dailyChallenge.xp_reward + (dailyChallenge.bonus_reward || 0)} XP today!`
      );
      return;
    }

    // Navigate to simulation
    router.push('/(tabs)/topics');
  };

  // Filter challenges
  const filteredChallenges = challenges.filter(challenge => {
    switch (selectedFilter) {
      case 'available':
        return challenge.is_available && !challenge.is_completed;
      case 'completed':
        return challenge.is_completed;
      case 'expired':
        return challenge.deadline && new Date(challenge.deadline) < new Date();
      default:
        return true;
    }
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#10B981';
      case 'medium': return '#F59E0B';
      case 'hard': return '#EF4444';
      case 'expert': return '#8B5CF6';
      default: return colors.primary;
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Mudah';
      case 'medium': return 'Sedang';
      case 'hard': return 'Sulit';
      case 'expert': return 'Ahli';
      default: return difficulty;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'daily': return '📅';
      case 'weekly': return '📊';
      case 'special': return '⭐';
      case 'achievement': return '🏆';
      default: return '🎯';
    }
  };

  const renderFilter = (filter: FilterType, label: string) => {
    const count = filter === 'all' ? stats.total :
                 filter === 'available' ? stats.available :
                 filter === 'completed' ? stats.completed :
                 challenges.filter(c => c.deadline && new Date(c.deadline) < new Date()).length;

    return (
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
  };

  const renderChallengeItem = ({ item }: { item: Challenge }) => (
    <TouchableOpacity
      style={[
        styles.challengeCard,
        item.is_completed && styles.challengeCardCompleted,
        !item.is_available && styles.challengeCardLocked
      ]}
      onPress={() => handleChallengePress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.challengeHeader}>
        <View style={styles.challengeIconContainer}>
          <Text style={styles.challengeIcon}>
            {item.is_completed ? '✅' : item.icon}
          </Text>
          <Text style={styles.typeIcon}>{getTypeIcon(item.type)}</Text>
        </View>
        
        <View style={styles.challengeRewards}>
          <View style={[
            styles.difficultyBadge,
            { backgroundColor: getDifficultyColor(item.difficulty) + '20' }
          ]}>
            <Text style={[
              styles.difficultyText,
              { color: getDifficultyColor(item.difficulty) }
            ]}>
              {getDifficultyLabel(item.difficulty)}
            </Text>
          </View>
          <View style={styles.xpReward}>
            <Text style={styles.xpIcon}>⭐</Text>
            <Text style={styles.xpText}>
              {item.xp_reward}{item.bonus_reward ? `+${item.bonus_reward}` : ''} XP
            </Text>
          </View>
        </View>
      </View>

      <Text style={[
        styles.challengeTitle,
        !item.is_available && styles.challengeTitleLocked
      ]}>
        {item.title}
      </Text>
      
      <Text style={[
        styles.challengeDescription,
        !item.is_available && styles.challengeDescriptionLocked
      ]}>
        {item.description}
      </Text>

      {/* Progress Bar */}
      {item.progress && !item.is_completed && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { 
                  width: `${item.progress.percentage}%`,
                  backgroundColor: getDifficultyColor(item.difficulty)
                }
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {item.progress.current}/{item.progress.target} ({item.progress.percentage}%)
          </Text>
        </View>
      )}

      {/* Deadline */}
      {item.deadline && !item.is_completed && (
        <View style={styles.deadlineContainer}>
          <Text style={styles.deadlineIcon}>⏰</Text>
          <Text style={styles.deadlineText}>
            Ends: {new Date(item.deadline).toLocaleDateString('id-ID')}
          </Text>
        </View>
      )}

      {/* Completed Date */}
      {item.is_completed && item.completed_at && (
        <View style={styles.completedContainer}>
          <Text style={styles.completedIcon}>🎉</Text>
          <Text style={styles.completedText}>
            Completed: {new Date(item.completed_at).toLocaleDateString('id-ID')}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );


  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🎯 Tantangan</Text>
        <Text style={styles.headerSubtitle}>
          Complete challenges to earn bonus XP and unlock achievements
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
            <Text style={styles.statNumber}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.available}</Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.earnedXP}</Text>
            <Text style={styles.statLabel}>XP Earned</Text>
          </View>
        </View>

        {/* Daily Challenge */}
        {dailyChallenge && (
          <TouchableOpacity 
            style={[
              styles.dailyChallengeCard,
              dailyChallenge.is_completed && styles.dailyChallengeCompleted
            ]}
            onPress={handleDailyChallengePress}
            activeOpacity={0.9}
          >
            <View style={styles.dailyHeader}>
              <View style={styles.dailyTitleContainer}>
                <Text style={styles.dailyIcon}>⏰</Text>
                <View>
                  <Text style={styles.dailyTitle}>Daily Challenge</Text>
                  <Text style={styles.dailySubtitle}>{dailyChallenge.title}</Text>
                </View>
              </View>
              <View style={styles.dailyTimer}>
                <Text style={styles.timerText}>{timeRemaining}</Text>
                <Text style={styles.timerLabel}>remaining</Text>
              </View>
            </View>

            <Text style={styles.dailyDescription}>
              {dailyChallenge.description}
            </Text>

            {/* Daily Progress */}
            {dailyChallenge.progress && !dailyChallenge.is_completed && (
              <View style={styles.dailyProgressContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      { 
                        width: `${dailyChallenge.progress.percentage}%`,
                        backgroundColor: colors.accent
                      }
                    ]}
                  />
                </View>
                <Text style={styles.dailyProgressText}>
                  {dailyChallenge.progress.current}/{dailyChallenge.progress.target} simulations completed
                </Text>
              </View>
            )}

            <View style={styles.dailyRewards}>
              <View style={styles.rewardItem}>
                <Text style={styles.rewardIcon}>⭐</Text>
                <Text style={styles.rewardText}>
                  {dailyChallenge.xp_reward} XP
                </Text>
              </View>
              {dailyChallenge.bonus_reward && (
                <View style={styles.rewardItem}>
                  <Text style={styles.rewardIcon}>🎁</Text>
                  <Text style={styles.rewardText}>
                    +{dailyChallenge.bonus_reward} Bonus
                  </Text>
                </View>
              )}
              <View style={styles.rewardItem}>
                <Text style={styles.rewardIcon}>🔥</Text>
                <Text style={styles.rewardText}>
                  +{dailyChallenge.streak_bonus} Streak
                </Text>
              </View>
            </View>

            {dailyChallenge.is_completed && (
              <View style={styles.completedBanner}>
                <Text style={styles.completedBannerText}>✅ Daily Challenge Completed!</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {renderFilter('available', 'Available')}
            {renderFilter('completed', 'Completed')}
            {renderFilter('expired', 'Expired')}
            {renderFilter('all', 'All')}
          </ScrollView>
        </View>

        {/* Challenges List */}
        <View style={styles.challengesList}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading challenges...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredChallenges}
              renderItem={renderChallengeItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyTitle}>🎯 No challenges found</Text>
                  <Text style={styles.emptyMessage}>
                    {selectedFilter === 'available' && 'No challenges available right now. Check back later!'}
                    {selectedFilter === 'completed' && 'Complete some challenges to see them here!'}
                    {selectedFilter === 'expired' && 'No expired challenges found.'}
                  </Text>
                </View>
              }
            />
          )}
        </View>

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

  // Daily Challenge
  dailyChallengeCard: {
    backgroundColor: colors.card,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    padding: 24,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    borderLeftWidth: 6,
    borderLeftColor: colors.accent,
  },
  dailyChallengeCompleted: {
    borderLeftColor: '#10B981',
    backgroundColor: '#10B981' + '10',
  },
  dailyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  dailyTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dailyIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  dailyTitle: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: colors.accent,
    marginBottom: 2,
  },
  dailySubtitle: {
    fontSize: fonts.sizes.subtitle,
    fontFamily: fonts.title,
    color: colors.primary,
  },
  dailyTimer: {
    alignItems: 'center',
    backgroundColor: colors.accent + '20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  timerText: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.title,
    color: colors.accent,
  },
  timerLabel: {
    fontSize: fonts.sizes.caption,
    fontFamily: fonts.body,
    color: colors.muted,
  },
  dailyDescription: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: colors.muted,
    lineHeight: 22,
    marginBottom: 16,
  },
  dailyProgressContainer: {
    marginBottom: 16,
  },
  dailyProgressText: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.body,
    color: colors.muted,
    marginTop: 6,
  },
  dailyRewards: {
    flexDirection: 'row',
    gap: 16,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardIcon: {
    fontSize: 14,
  },
  rewardText: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.body,
    color: colors.primary,
  },
  completedBanner: {
    backgroundColor: '#10B981',
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  completedBannerText: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: '#FFFFFF',
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

  // Challenges List
  challengesList: {
    paddingHorizontal: 20,
  },
  challengeCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  challengeCardCompleted: {
    borderLeftColor: '#10B981',
    backgroundColor: '#10B981' + '05',
  },
  challengeCardLocked: {
    opacity: 0.6,
    borderLeftColor: colors.muted,
  },

  // Challenge Content
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  challengeIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  challengeIcon: {
    fontSize: 24,
  },
  typeIcon: {
    fontSize: 16,
    opacity: 0.7,
  },
  challengeRewards: {
    alignItems: 'flex-end',
    gap: 6,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: fonts.sizes.caption,
    fontFamily: fonts.body,
  },
  xpReward: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
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
  challengeTitle: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: colors.primary,
    marginBottom: 6,
  },
  challengeTitleLocked: {
    color: colors.muted,
  },
  challengeDescription: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.body,
    color: colors.muted,
    lineHeight: 20,
    marginBottom: 12,
  },
  challengeDescriptionLocked: {
    color: colors.muted + '80',
  },

  // Progress
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.muted + '30',
    borderRadius: 3,
    marginBottom: 4,
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

  // Deadline & Completed
  deadlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deadlineIcon: {
    fontSize: 14,
  },
  deadlineText: {
    fontSize: fonts.sizes.caption,
    fontFamily: fonts.body,
    color: '#F59E0B',
  },
  completedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  completedIcon: {
    fontSize: 14,
  },
  completedText: {
    fontSize: fonts.sizes.caption,
    fontFamily: fonts.body,
    color: '#10B981',
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