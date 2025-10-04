import { colors, fonts } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { apiService, SimulationAttempt, User, UserAchievement, UserProgress } from "@/services/api";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

// ✅ Interface sesuai dengan database fields yang tersedia
interface ProfileStats {
  totalSimulations: number;
  averageScore: number;
  totalTimeSpent: number; // dalam menit
  streakDays: number;
  achievementsCount: number;
  topicsCompleted: number;
  totalAttempts: number;
  bestScore: number;
}

export default function ProfileScreen() {
  const { user, logout: authLogout } = useAuth();
  const router = useRouter();

  // State management
  const [profileData, setProfileData] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [userAttempts, setUserAttempts] = useState<SimulationAttempt[]>([]);
  const [stats, setStats] = useState<ProfileStats>({
    totalSimulations: 0,
    averageScore: 0,
    totalTimeSpent: 0,
    streakDays: 0,
    achievementsCount: 0,
    topicsCompleted: 0,
    totalAttempts: 0,
    bestScore: 0,
  });

  // ✅ Update profileData when user changes
  useEffect(() => {
    if (user) {
      setProfileData(user);
      calculateBasicStats(user);
    }
  }, [user]);

  // ✅ Load complete profile data when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        loadCompleteProfileData();
      }
    }, [user])
  );

  const loadCompleteProfileData = async () => {
    if (!user) {
      console.warn('⚠️ No user data available for profile loading');
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 Loading complete profile data...');

      // ✅ Parallel API calls sesuai dengan available routes
      const [
        profileResponse,
        progressResponse,
        achievementsResponse,
        attemptsResponse
      ] = await Promise.allSettled([
        apiService.getProfile(),
        apiService.getUserProgress(),
        apiService.getUserAchievements(),
        apiService.getUserAttempts()
      ]);

      // ✅ Handle profile data
      if (profileResponse.status === 'fulfilled' && 
          profileResponse.value.status === 'success' && 
          profileResponse.value.data) {
        
        const userData = profileResponse.value.data.user;
        setProfileData(userData);
        console.log('✅ Profile data loaded:', userData.name);
      } else {
        console.log('⚠️ Profile API failed, using existing user data');
        setProfileData(user);
      }

      // ✅ Handle user progress
      if (progressResponse.status === 'fulfilled' && 
          progressResponse.value.status === 'success' && 
          progressResponse.value.data) {
        
        setUserProgress(progressResponse.value.data.progress);
        console.log('✅ User progress loaded:', progressResponse.value.data.progress.length, 'topics');
      }

      // ✅ Handle user achievements
      if (achievementsResponse.status === 'fulfilled' && 
          achievementsResponse.value.status === 'success' && 
          achievementsResponse.value.data) {
        
        setUserAchievements(achievementsResponse.value.data.achievements);
        console.log('✅ User achievements loaded:', achievementsResponse.value.data.achievements.length);
      }

      // ✅ Handle user attempts
      if (attemptsResponse.status === 'fulfilled' && 
          attemptsResponse.value.status === 'success' && 
          attemptsResponse.value.data) {
        
        setUserAttempts(attemptsResponse.value.data.attempts);
        console.log('✅ User attempts loaded:', attemptsResponse.value.data.attempts.length);
      }

      // ✅ Calculate comprehensive stats from all data
      calculateStatsFromData(
        profileData || user,
        progressResponse.status === 'fulfilled' && progressResponse.value.status === 'success' 
          ? progressResponse.value.data.progress : [],
        achievementsResponse.status === 'fulfilled' && achievementsResponse.value.status === 'success'
          ? achievementsResponse.value.data.achievements : [],
        attemptsResponse.status === 'fulfilled' && attemptsResponse.value.status === 'success'
          ? attemptsResponse.value.data.attempts : []
      );

    } catch (error: any) {
      console.error('❌ Failed to load profile data:', error);
      
      // ✅ Fallback to existing data
      setProfileData(user);
      calculateBasicStats(user);
      
      if (error.message?.includes('Session expired') || 
          error.message?.includes('Token expired')) {
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please login again.',
          [
            {
              text: 'Login',
              onPress: () => performLogout()
            }
          ]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ Calculate basic stats from user data only - FIXED field names
  const calculateBasicStats = (userData: User) => {
    if (!userData) {
      console.warn('⚠️ No user data provided for basic stats calculation');
      return;
    }

    const basicStats: ProfileStats = {
      totalSimulations: 0, // Will be calculated from progress data
      averageScore: 0, // Will be calculated from attempts data
      totalTimeSpent: 0, // Will be calculated from attempts data
      streakDays: userData.streak_days || 0, // ✅ FIXED: streak_days from users table
      achievementsCount: 0, // Will be calculated from achievements data
      topicsCompleted: 0, // Will be calculated from progress data
      totalAttempts: 0, // Will be calculated from attempts data
      bestScore: 0, // Will be calculated from progress data
    };
    
    setStats(basicStats);
  };

  // ✅ Calculate comprehensive stats from all API data - FIXED calculations
  const calculateStatsFromData = (
    userData: User,
    progress: UserProgress[],
    achievements: UserAchievement[],
    attempts: SimulationAttempt[]
  ) => {
    if (!userData) {
      console.warn('⚠️ No user data provided for comprehensive stats calculation');
      return;
    }

    // ✅ Calculate from user_progress table
    const totalSimulations = progress.reduce((sum, p) => sum + (p.completed_questions || 0), 0);
    const topicsCompleted = progress.filter(p => p.is_completed).length;
    const bestScore = progress.length > 0 
      ? Math.max(...progress.map(p => p.best_score || 0))
      : 0;

    // ✅ Calculate from simulation_attempts table - FIXED time calculation
    const totalAttempts = attempts.length;
    const totalTimeSpent = attempts.reduce((sum, attempt) => sum + (attempt.time_taken || 0), 0) / 60; // Convert to minutes
    const averageScore = totalAttempts > 0
      ? Math.round(attempts.reduce((sum, attempt) => sum + (attempt.score_earned || 0), 0) / totalAttempts)
      : 0;

    // ✅ Calculate from user_achievements table
    const achievementsCount = achievements.length;

    const comprehensiveStats: ProfileStats = {
      totalSimulations,
      averageScore,
      totalTimeSpent: Math.round(totalTimeSpent),
      streakDays: userData.streak_days || 0, // ✅ FIXED: streak_days from users table
      achievementsCount,
      topicsCompleted,
      totalAttempts,
      bestScore,
    };
    
    setStats(comprehensiveStats);
    console.log('✅ Comprehensive stats calculated:', comprehensiveStats);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCompleteProfileData();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: performLogout 
        }
      ]
    );
  };

  const performLogout = async () => {
    try {
      await authLogout();
      router.replace('/auth/login');
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  };

  const handleViewAchievements = () => {
    router.push('/(tabs)/achievements');
  };

  const handleViewProgress = () => {
    router.push('/(tabs)/progress');
  };

  const getInitials = (name?: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  };

  const getLevelProgress = (totalXp: number) => {
    const currentLevel = Math.floor(totalXp / 1000);
    const xpInCurrentLevel = totalXp % 1000;
    const xpForNextLevel = 1000;
    const progressPercentage = Math.round((xpInCurrentLevel / xpForNextLevel) * 100);
    
    return {
      currentLevel,
      xpInCurrentLevel,
      xpForNextLevel,
      progressPercentage
    };
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const forceReset = () => {
    setStats({
      totalSimulations: 0,
      averageScore: 0,
      totalTimeSpent: 0,
      streakDays: 0,
      achievementsCount: 0,
      topicsCompleted: 0,
      totalAttempts: 0,
      bestScore: 0,
    });
    setUserProgress([]);
    setUserAchievements([]);
    setUserAttempts([]);
    loadCompleteProfileData();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'Unknown';
    }
  };

  // ✅ Show loading if profile data is not ready
  if (!profileData) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  const levelProgress = getLevelProgress(profileData.total_xp);

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
        <Text style={styles.headerTitle}>👤 Profil Saya</Text>
        {loading && (
          <ActivityIndicator size="small" color="#FFFFFF" />
        )}
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {getInitials(profileData.name)}
            </Text>
          </View>
          <View style={styles.onlineIndicator} />
        </View>
        
        <View style={styles.profileInfo}>
          <Text style={styles.name}>{profileData.name || 'Unknown User'}</Text>
          <Text style={styles.email}>{profileData.email || 'No email'}</Text>
          
          <View style={styles.levelContainer}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>Level {profileData.level}</Text>
            </View>
            <Text style={styles.xpText}>
              {profileData.total_xp || 0} XP
            </Text>
          </View>
        </View>
      </View>

      {/* Level Progress */}
      <View style={styles.progressCard}>
        <Text style={styles.progressTitle}>Level Progress</Text>
        <View style={styles.levelProgressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { width: `${levelProgress.progressPercentage}%` }
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {levelProgress.xpInCurrentLevel}/{levelProgress.xpForNextLevel} XP to Level {levelProgress.currentLevel + 1}
          </Text>
        </View>
      </View>

      {/* Stats Grid - ✅ Using real data from database */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🎯</Text>
            <Text style={styles.statNumber}>{stats.totalSimulations}</Text>
            <Text style={styles.statLabel}>Simulations</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📊</Text>
            <Text style={styles.statNumber}>{stats.averageScore}</Text>
            <Text style={styles.statLabel}>Avg Score</Text>
          </View>
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>⏱️</Text>
            <Text style={styles.statNumber}>{formatTime(stats.totalTimeSpent)}</Text>
            <Text style={styles.statLabel}>Time Spent</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🔥</Text>
            <Text style={styles.statNumber}>{stats.streakDays}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🏆</Text>
            <Text style={styles.statNumber}>{stats.achievementsCount}</Text>
            <Text style={styles.statLabel}>Achievements</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>✅</Text>
            <Text style={styles.statNumber}>{stats.topicsCompleted}</Text>
            <Text style={styles.statLabel}>Topics Done</Text>
          </View>
        </View>

        {/* ✅ Additional stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📝</Text>
            <Text style={styles.statNumber}>{stats.totalAttempts}</Text>
            <Text style={styles.statLabel}>Total Attempts</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>⭐</Text>
            <Text style={styles.statNumber}>{stats.bestScore}</Text>
            <Text style={styles.statLabel}>Best Score</Text>
          </View>
        </View>
      </View>

      {/* Recent Activity */}
      {userAttempts.length > 0 && (
        <View style={styles.activityContainer}>
          <Text style={styles.sectionTitle}>📈 Recent Activity</Text>
          {userAttempts.slice(0, 3).map((attempt) => (
            <View key={attempt.id} style={styles.activityItem}>
              <Text style={styles.activityIcon}>
                {attempt.is_correct ? '✅' : '❌'}
              </Text>
              <View style={styles.activityInfo}>
                <Text style={styles.activityTitle}>
                  {attempt.question?.topic?.name || 'Simulation'}
                </Text>
                <Text style={styles.activityDesc}>
                  Score: {attempt.score_earned} • Attempt #{attempt.attempt_number} • {formatDate(attempt.created_at)}
                </Text>
              </View>
              <Text style={styles.activityScore}>
                {attempt.score_earned}pts
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Progress Summary */}
      {userProgress.length > 0 && (
        <View style={styles.progressContainer}>
          <Text style={styles.sectionTitle}>📚 Topic Progress</Text>
          {userProgress.slice(0, 3).map((progress) => (
            <View key={progress.id} style={styles.progressItem}>
              <View style={styles.progressInfo}>
                <Text style={styles.progressName}>
                  {progress.topic?.name || 'Unknown Topic'}
                </Text>
                <Text style={styles.progressDesc}>
                  {progress.completed_questions}/{progress.total_questions} questions • Best: {progress.best_score}%
                </Text>
              </View>
              <View style={styles.progressBadge}>
                <Text style={[
                  styles.progressStatus,
                  { color: progress.is_completed ? '#10B981' : colors.muted }
                ]}>
                  {progress.is_completed ? '✅' : '📊'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Streak Info */}
      {stats.streakDays > 0 && (
        <View style={styles.streakCard}>
          <View style={styles.streakHeader}>
            <Text style={styles.streakIcon}>🔥</Text>
            <Text style={styles.streakTitle}>Learning Streak</Text>
          </View>
          <Text style={styles.streakDescription}>
            You've been learning for {stats.streakDays} consecutive days! Keep it up!
          </Text>
          <Text style={styles.streakMotivation}>
            "Consistency is the key to mastering physics!"
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={handleViewAchievements}
        >
          <Text style={styles.actionIcon}>🏆</Text>
          <Text style={styles.actionText}>View Achievements</Text>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>
        
        
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => router.push('/(tabs)/challenges')}
        >
          <Text style={styles.actionIcon}>🎯</Text>
          <Text style={styles.actionText}>Daily Challenges</Text>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Debug Section */}
      {__DEV__ && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugTitle}>🔧 Debug Info</Text>
          <Text style={styles.debugText}>Progress items: {userProgress.length}</Text>
          <Text style={styles.debugText}>Achievements: {userAchievements.length}</Text>
          <Text style={styles.debugText}>Attempts: {userAttempts.length}</Text>
          <TouchableOpacity style={styles.debugButton} onPress={forceReset}>
            <Text style={styles.debugButtonText}>Force Reset</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Logout Button */}
      <TouchableOpacity 
        style={[styles.logoutButton, loading && styles.logoutButtonDisabled]} 
        onPress={handleLogout}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.logoutText}>Keluar dari Akun</Text>
        )}
      </TouchableOpacity>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>PhysicsPlay v1.0.0</Text>
        <Text style={styles.footerSubtext}>
          Last activity: {profileData.last_activity_date ? 
            formatDate(profileData.last_activity_date) : 
            'Unknown'
          }
        </Text>
      </View>

      {/* Bottom Spacing */}
      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

// ✅ Enhanced styles with new components
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background,
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

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },

  // Profile Card
  profileCard: {
    backgroundColor: colors.card,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 20,
  },
  avatar: { 
    width: 80, 
    height: 80, 
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontFamily: fonts.title,
    color: '#FFFFFF',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: colors.card,
  },
  profileInfo: {
    flex: 1,
  },
  name: { 
    fontSize: fonts.sizes.subtitle, 
    fontFamily: fonts.title,
    color: colors.primary,
    marginBottom: 4,
  },
  email: { 
    color: colors.muted,
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    marginBottom: 12,
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  levelBadge: {
    backgroundColor: colors.accent + "20",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  levelText: {
    color: colors.accent,
    fontSize: fonts.sizes.small,
    fontFamily: fonts.body,
  },
  xpText: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.body,
    color: colors.primary,
  },

  // Level Progress
  progressCard: {
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
  progressTitle: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: colors.primary,
    marginBottom: 12,
  },
  levelProgressContainer: {
    gap: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.muted + '30',
    borderRadius: 4,
  },
  progressFill: {
    height: 8,
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.body,
    color: colors.muted,
  },

  // Stats
  statsContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
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
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
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
    textAlign: 'center',
  },

  // Recent Activity
  activityContainer: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: fonts.sizes.subtitle,
    fontFamily: fonts.title,
    color: colors.primary,
    marginBottom: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 2,
  },
  activityIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: colors.primary,
    marginBottom: 2,
  },
  activityDesc: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.body,
    color: colors.muted,
  },
  activityScore: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.body,
    color: colors.accent,
  },

  // Progress Section
  progressContainer: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 2,
  },
  progressInfo: {
    flex: 1,
  },
  progressName: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: colors.primary,
    marginBottom: 2,
  },
  progressDesc: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.body,
    color: colors.muted,
  },
  progressBadge: {
    marginLeft: 12,
  },
  progressStatus: {
    fontSize: 20,
  },

  // Actions
  actionsContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  actionButton: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  actionIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  actionText: {
    flex: 1,
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: colors.primary,
  },
  actionArrow: {
    fontSize: 20,
    color: colors.muted,
  },

  // Streak Card
  streakCard: {
    backgroundColor: colors.card,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  streakIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  streakTitle: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: colors.primary,
  },
  streakDescription: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 8,
  },
  streakMotivation: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.body,
    color: colors.muted,
    fontStyle: 'italic',
  },

  // Debug
  debugContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    backgroundColor: colors.muted + '20',
    borderRadius: 8,
  },
  debugTitle: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: colors.primary,
    marginBottom: 8,
  },
  debugText: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.body,
    color: colors.muted,
    marginBottom: 2,
  },
  debugButton: {
    marginTop: 8,
    backgroundColor: "#9333EA",
    padding: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  debugButtonText: {
    color: "#FFFFFF",
    fontSize: fonts.sizes.small,
    fontFamily: fonts.body,
  },

  // Logout Button
  logoutButton: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: "#EF4444",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#EF4444",
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  logoutButtonDisabled: {
    backgroundColor: colors.muted,
    elevation: 0,
    shadowOpacity: 0,
  },
  logoutText: {
    color: "#FFFFFF",
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
  },

  // Footer
  footer: {
    alignItems: "center",
    paddingTop: 32,
    paddingBottom: 20,
  },
  footerText: {
    color: colors.muted,
    fontSize: fonts.sizes.caption,
    fontFamily: fonts.body,
    marginBottom: 4,
  },
  footerSubtext: {
    color: colors.muted,
    fontSize: fonts.sizes.caption,
    fontFamily: fonts.body,
    opacity: 0.7,
  },
});