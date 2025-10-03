import { colors, fonts } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { apiService, PhysicsTopic } from '@/services/api';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface UserStats {
  total_xp: number;
  level: number;
  streak_days: number;
  last_activity_date: string;
  total_achievements: number;
  completed_topics: number;
  total_attempts: number;
  correct_attempts: number;
  accuracy_rate: number;
  average_score: number;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  // State management
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [topics, setTopics] = useState<PhysicsTopic[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [recentAttempts, setRecentAttempts] = useState<any[]>([]);

  // Load data on component mount
  useEffect(() => {
      loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // ✅ Gunakan API yang ada dari api.ts
      const [topicsResponse, userResponse, attemptsResponse] = await Promise.all([
        apiService.getTopics(),          // ✅ GET /api/topics
        apiService.getUser(),            // ✅ GET /api/user  
        apiService.getUserAttempts(),    // ✅ GET /api/user/attempts
      ]);

      // Set topics dari API
      if (topicsResponse.status === 'success' && topicsResponse.data) {
        setTopics(topicsResponse.data.topics || []);
        console.log('✅ Loaded topics:', topicsResponse.data.topics.length);
      }

      // Set user data (karena /user/stats tidak ada, pakai user data)
      if (userResponse.status === 'success' && userResponse.data) {
        const userData = userResponse.data.user;
        
        // Create stats from user data
        setUserStats({
          total_xp: userData.total_xp || 0,
          level: userData.level || 1,
          streak_days: userData.streak_count || 0,
          last_activity_date: userData.last_login_streak || '',
          total_achievements: userData.achievements?.length || 0,
          completed_topics: userData.progress?.filter(p => p.is_completed).length || 0,
          total_attempts: 0, // Will be filled from attempts
          correct_attempts: 0,
          accuracy_rate: 0,
          average_score: 0,
        });
        console.log('✅ Loaded user data:', userData.name);
      }

      // Set recent attempts
      if (attemptsResponse.status === 'success' && attemptsResponse.data) {
        const attempts = attemptsResponse.data.attempts || [];
        setRecentAttempts(attempts.slice(0, 5)); // Latest 5 attempts
        
        // Update stats with attempts data
        if (attempts.length > 0) {
          const correctAttempts = attempts.filter((a: any) => a.is_correct).length;
          const totalScore = attempts.reduce((sum: number, a: any) => sum + (a.score_earned || 0), 0);
          
          setUserStats(prev => prev ? {
            ...prev,
            total_attempts: attempts.length,
            correct_attempts: correctAttempts,
            accuracy_rate: Math.round((correctAttempts / attempts.length) * 100),
            average_score: Math.round(totalScore / attempts.length),
          } : null);
        }
        console.log('✅ Loaded attempts:', attempts.length);
      }

    } catch (error) {
      console.error('❌ Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

 

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleTopicPress = (topic: PhysicsTopic) => {
    console.log('🔍 Topic pressed:', topic.name, topic.slug);
    // Navigate to simulation screen with topic slug
    router.push({
      pathname: '/simulasi/[slug]',
      params: { slug: topic.slug }
    });
  };

  const handleStartLearning = () => {
    if (topics.length > 0) {
      // Navigate to first available topic
      const firstTopic = topics[0];
      handleTopicPress(firstTopic);
    } else {
      // Fallback to topics page
      router.push('/(tabs)/topics');
    }
  };

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
    // Default icons based on topic name/slug
    if (topic.name?.includes('Newton') || topic.slug?.includes('newton')) return '⚡';
    if (topic.name?.includes('Energi') || topic.slug?.includes('energi')) return '💫';
    if (topic.name?.includes('Gesek') || topic.slug?.includes('gesek')) return '🔥';
    if (topic.name?.includes('Momentum') || topic.slug?.includes('momentum')) return '🎯';
    return '🔬';
  };

  const getTopicColor = (index: number) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFA726', '#AB47BC'];
    return colors[index % colors.length];
  };

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>
              Halo, {user?.name || 'Learner'}! 👋
            </Text>
            <Text style={styles.subtitle}>
              {userStats ? 
                `Level ${userStats.level} • ${userStats.total_xp} XP` :
                'Mari belajar fisika dengan cara yang menyenangkan'
              }
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0)?.toUpperCase() || '👤'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Hero Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>PhysicsPlay</Text>
          <Text style={styles.heroDescription}>
            Eksplorasi dunia fisika melalui simulasi interaktif yang dirancang khusus untuk pembelajaran yang efektif dan menyenangkan.
          </Text>
          <TouchableOpacity style={styles.heroButton} onPress={handleStartLearning}>
            <Text style={styles.heroButtonText}>
              {loading ? 'Loading...' : 'Mulai Belajar'}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.heroImageContainer}>
          <View style={styles.heroImageBackground}>
            <Text style={styles.heroEmoji}>🔬</Text>
          </View>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {userStats ? userStats.completed_topics : topics.length}
          </Text>
          <Text style={styles.statLabel}>
            {userStats ? 'Selesai' : 'Topics'}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {userStats ? `${userStats.accuracy_rate}%` : '100%'}
          </Text>
          <Text style={styles.statLabel}>
            Akurasi
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {userStats ? `${userStats.streak_days}` : '0'}
          </Text>
          <Text style={styles.statLabel}>
            Streak
          </Text>
        </View>
      </View>

      {/* Topics Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>📚 Topik Terbaru</Text>
            <Text style={styles.sectionSubtitle}>
              Pilih topik yang ingin kamu pelajari
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/topics')}>
            <Text style={styles.seeAllText}>Lihat Semua</Text>
          </TouchableOpacity>
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Memuat topik...</Text>
          </View>
        ) : (
          <View style={styles.featuresGrid}>
            {topics.slice(0, 3).map((topic, index) => (
              <TouchableOpacity 
                key={topic.id} 
                style={[
                  styles.featureCard, 
                  { borderLeftColor: getTopicColor(index) }
                ]}
                onPress={() => handleTopicPress(topic)}
                activeOpacity={0.8}
              >
                <View style={styles.featureHeader}>
                  <View style={[
                    styles.featureIcon, 
                    { backgroundColor: getTopicColor(index) + "20" }
                  ]}>
                    <Text style={styles.featureEmoji}>
                      {getTopicIcon(topic)}
                    </Text>
                  </View>
                  <View style={styles.featureHeaderRight}>
                    <View style={[
                      styles.difficultyBadge,
                      { backgroundColor: getDifficultyColor(topic.difficulty) + "20" }
                    ]}>
                      <Text style={[
                        styles.difficultyText,
                        { color: getDifficultyColor(topic.difficulty) }
                      ]}>
                        {topic.difficulty === 'Beginner' ? 'Pemula' :
                         topic.difficulty === 'Intermediate' ? 'Menengah' : 'Lanjut'}
                      </Text>
                    </View>
                    <Text style={styles.featureArrow}>›</Text>
                  </View>
                </View>
                
                <Text style={styles.featureTitle}>{topic.name}</Text>
                <Text style={styles.featureDescription}>
                  {topic.subtitle || 'Simulasi fisika interaktif'}
                </Text>
                
                {/* Progress indicator */}
                {topic.progress && (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill,
                          { 
                            width: `${topic.progress.progress_percentage}%`,
                            backgroundColor: getTopicColor(index)
                          }
                        ]}
                      />
                    </View>
                    <Text style={styles.progressText}>
                      {topic.progress.progress_percentage}% selesai
                    </Text>
                  </View>
                )}

                <View style={styles.topicMeta}>
                  <Text style={styles.topicDuration}>
                    ⏱️ {topic.estimated_duration} min
                  </Text>
                  {topic.progress && (
                    <Text style={styles.topicScore}>
                      🏆 {topic.progress.best_score}/100
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Recent Activity */}
      {recentAttempts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📈 Aktivitas Terbaru</Text>
          <View style={styles.activityList}>
            {recentAttempts.slice(0, 3).map((attempt, index) => (
              <View key={attempt.id || index} style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Text style={styles.activityEmoji}>
                    {attempt.is_correct ? '✅' : '❌'}
                  </Text>
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>
                    {attempt.question?.topic?.name || 'Simulasi'}
                  </Text>
                  <Text style={styles.activitySubtitle}>
                    Skor: {attempt.score_earned} • {attempt.is_correct ? 'Benar' : 'Salah'}
                  </Text>
                </View>
                <Text style={styles.activityTime}>
                  {new Date(attempt.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short'
                  })}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🚀 Aksi Cepat</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/achievements')}
          >
            <Text style={styles.actionIcon}>🏆</Text>
            <Text style={styles.actionText}>Prestasi</Text>
            {userStats && (
              <Text style={styles.actionSubtext}>
                {userStats.total_achievements} earned
              </Text>
            )}
          </TouchableOpacity>
          
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Text style={styles.actionIcon}>📈</Text>
            <Text style={styles.actionText}>Progress</Text>
            {userStats && (
              <Text style={styles.actionSubtext}>
                Level {userStats.level}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Spacing */}
      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  // Auth Prompt Styles
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
    textAlign: 'center',
  },
  authMessage: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
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
    fontFamily: fonts.bodySemiBold,
  },
  
  // Header Styles
  header: {
    backgroundColor: colors.primary,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    fontSize: fonts.sizes.title,
    fontFamily: fonts.title,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.body,
    color: '#FFFFFF',
    opacity: 0.9,
    maxWidth: "90%",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontFamily: fonts.bodySemiBold,
    color: colors.primary,
  },

  // Hero Card Styles
  heroCard: {
    backgroundColor: colors.card,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    padding: 24,
    flexDirection: "row",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  heroContent: {
    flex: 1,
    paddingRight: 16,
  },
  heroTitle: {
    fontSize: fonts.sizes.subtitle,
    fontFamily: fonts.title,
    color: colors.primary,
    marginBottom: 8,
  },
  heroDescription: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.body,
    color: colors.muted,
    lineHeight: 20,
    marginBottom: 16,
  },
  heroButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  heroButtonText: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.bodySemiBold,
    color: '#FFFFFF',
  },
  heroImageContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  heroImageBackground: {
    width: 80,
    height: 80,
    backgroundColor: colors.primary + "20",
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  heroEmoji: {
    fontSize: 36,
  },

  // Stats Styles
  statsContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
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

  // Section Styles
  section: {
    paddingHorizontal: 20,
    marginTop: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  seeAllText: {
    fontFamily: fonts.bodySemiBold,
    color: colors.accent,
    marginTop: 15,
  },

  // Loading Styles
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: fonts.sizes.small,
    fontFamily: fonts.body,
    color: colors.muted,
  },

  // Features Grid Styles
  featuresGrid: {
    gap: 12,
  },
  featureCard: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 16,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  featureHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  featureHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  featureEmoji: {
    fontSize: 20,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: fonts.sizes.caption,
    fontFamily: fonts.bodySemiBold,
  },
  featureArrow: {
    fontSize: 24,
    color: colors.muted,
    fontFamily: fonts.body,
  },
  featureTitle: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.subtitle,
    color: colors.primary,
    marginBottom: 6,
  },
  featureDescription: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.body,
    color: colors.muted,
    lineHeight: 18,
    marginBottom: 12,
  },
  topicMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topicDuration: {
    fontSize: fonts.sizes.caption,
    fontFamily: fonts.body,
    color: colors.muted,
  },
  topicScore: {
    fontSize: fonts.sizes.caption,
    fontFamily: fonts.bodySemiBold,
    color: colors.accent,
  },

  // Progress Styles
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.muted + "30",
    borderRadius: 2,
    marginBottom: 4,
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  progressText: {
    fontSize: fonts.sizes.caption,
    fontFamily: fonts.body,
    color: colors.muted,
  },

  // Activity Styles
  activityList: {
    marginTop: 12,
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityEmoji: {
    fontSize: 18,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.bodySemiBold,
    color: colors.text,
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: fonts.sizes.caption,
    fontFamily: fonts.body,
    color: colors.muted,
  },
  activityTime: {
    fontSize: fonts.sizes.caption,
    fontFamily: fonts.body,
    color: colors.muted,
  },

  // Quick Actions Styles
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  actionText: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.bodySemiBold,
    color: colors.primary,
    marginBottom: 2,
  },
  actionSubtext: {
    fontSize: fonts.sizes.caption,
    fontFamily: fonts.body,
    color: colors.muted,
  },
});