// filepath: [profile.tsx](http://_vscodecontentref_/0)
import { colors, fonts } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { apiService, User } from "@/services/api";
import AsyncStorage from '@react-native-async-storage/async-storage';
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

interface ProfileStats {
  totalSimulations: number;
  averageScore: number;
  totalTimeSpent: number;
  streakDays: number;
  achievementsCount: number;
  topicsCompleted: number;
}

export default function ProfileScreen() {
  const { user, logout: authLogout } = useAuth(); // ✅ Langsung gunakan user tanpa cek auth
  const router = useRouter();

  // State management
  const [profileData, setProfileData] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<ProfileStats>({
    totalSimulations: 0,
    averageScore: 0,
    totalTimeSpent: 0,
    streakDays: 0,
    achievementsCount: 0,
    topicsCompleted: 0,
  });

  // ✅ Update profileData when user changes
  useEffect(() => {
    if (user) {
      setProfileData(user);
      calculateStats(user);
    }
  }, [user]);

  // ✅ Langsung load profile data tanpa cek auth
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        loadProfileData();
      }
    }, [user])
  );

  const loadProfileData = async () => {
    // ✅ Guard clause - pastikan user ada
    if (!user) {
      console.warn('⚠️ No user data available for profile loading');
      return;
    }

    try {
      setLoading(true);

      // ✅ Gunakan getProfile dari api.ts
      const response = await apiService.getProfile();
      
      if (response.status === 'success' && response.data) {
        const userData = response.data.user;
        setProfileData(userData);
        calculateStats(userData);
        console.log('✅ Profile data loaded:', userData.name);
      } else {
        console.log('⚠️ Profile API failed, using existing user data');
        setProfileData(user);
        calculateStats(user);
      }

    } catch (error) {
      console.error('❌ Failed to load profile:', error);
      // ✅ Fallback ke user data dari context
      setProfileData(user);
      calculateStats(user);
    } finally {
      setLoading(false);
    }
  };

  const loadMockProfile = () => {
    // ✅ Provide better fallback values
    const mockProfile: User = {
      id: 1,
      name: "Demo User",
      email: "demo@physicsplay.com",
      level: 5,
      total_xp: 1250,
      streak_count: 7,
      last_login_streak: new Date().toISOString(),
      achievements: [],
      progress: [],
    };
    
    setProfileData(mockProfile);
    calculateStats(mockProfile);
  };

  const calculateStats = (userData: User) => {
    // ✅ Guard clause - pastikan userData ada
    if (!userData) {
      console.warn('⚠️ No user data provided for stats calculation');
      return;
    }

    // Calculate stats from user data and progress
    const achievements = userData.achievements || [];
    const progress = userData.progress || [];
    
    const mockStats: ProfileStats = {
      totalSimulations: progress.reduce((sum, p) => sum + (p.completed_questions || 0), 0) || 23,
      averageScore: progress.length > 0 
        ? Math.round(progress.reduce((sum, p) => sum + (p.best_score || 0), 0) / progress.length)
        : 87,
      totalTimeSpent: 145, // minutes - mock data
      streakDays: userData.streak_count || 0,
      achievementsCount: achievements.length || 8,
      topicsCompleted: progress.filter(p => p.is_completed).length || 4,
    };
    
    setStats(mockStats);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProfileData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      "Konfirmasi Logout",
      "Apakah Anda yakin ingin keluar dari akun ini?",
      [
        { 
          text: "Batal", 
          style: "cancel" 
        },
        { 
          text: "Ya, Keluar", 
          style: "destructive",
          onPress: performLogout
        },
      ]
    );
  };

  const performLogout = async () => {
    try {
      setLoading(true);
      console.log('🚪 Starting logout process...');
      
      // 1. ✅ Clear ALL AsyncStorage data first
      await AsyncStorage.clear();
      console.log('✅ AsyncStorage cleared completely');
      
      // 2. Try API logout (optional, jangan biarkan gagal)
      try {
        await apiService.logout();
        console.log('✅ API logout successful');
      } catch (apiError) {
        console.warn('⚠️ API logout failed, but continuing with local logout:', apiError);
      }
      
      // 3. Call AuthContext logout (untuk update state)
      try {
        await authLogout();
        console.log('✅ AuthContext logout successful');
      } catch (contextError) {
        console.warn('⚠️ AuthContext logout failed, but storage is cleared:', contextError);
      }
      
      // 4. ✅ Force navigate dengan delay untuk memastikan
      setTimeout(() => {
        router.replace("/onboarding");
        console.log('✅ Navigation to onboarding completed');
      }, 100);
      
    } catch (error) {
      console.error('❌ Logout error:', error);
      
      // ✅ Emergency fallback - force clear everything
      try {
        await AsyncStorage.clear();
        setTimeout(() => {
          router.replace("/onboarding");
        }, 100);
        console.log('✅ Emergency logout completed');
      } catch (emergencyError) {
        console.error('❌ Emergency logout failed:', emergencyError);
        Alert.alert(
          "Logout Error", 
          "Terjadi kesalahan saat logout. Silakan restart aplikasi.",
          [
            {
              text: "OK",
              onPress: () => {
                // Force navigate anyway
                router.replace("/onboarding");
              }
            }
          ]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const forceReset = async () => {
    try {
      console.log('🔧 Force reset initiated...');
      await AsyncStorage.clear();
      router.replace("/onboarding");
      console.log('✅ Force reset completed');
    } catch (error) {
      console.error('❌ Force reset failed:', error);
      Alert.alert("Error", "Failed to reset. Please restart the app.");
    }
  };

  

  const handleViewAchievements = () => {
    router.push('/(tabs)/achievements');
  };

  const handleViewProgress = () => {
    router.push('/(tabs)/topics');
  };

  const getInitials = (name: string) => {
    if (!name || typeof name !== 'string') return 'U';
    
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getLevelProgress = (xp: number) => {
    const safeXP = xp || 0;
    const baseXP = 100;
    const currentLevel = Math.floor(safeXP / baseXP) + 1;
    const xpInCurrentLevel = safeXP % baseXP;
    const xpForNextLevel = baseXP;
    const progressPercentage = (xpInCurrentLevel / xpForNextLevel) * 100;
    
    return {
      currentLevel,
      xpInCurrentLevel,
      xpForNextLevel,
      progressPercentage: Math.min(progressPercentage, 100)
    };
  };

  const formatTime = (minutes: number) => {
    const safeMins = minutes || 0;
    const hours = Math.floor(safeMins / 60);
    const mins = safeMins % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // ✅ Show loading while auth is still checking


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
              <Text style={styles.levelText}>Level {levelProgress.currentLevel}</Text>
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

      {/* Stats Grid */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🎯</Text>
            <Text style={styles.statNumber}>{stats.totalSimulations}</Text>
            <Text style={styles.statLabel}>Simulations</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📊</Text>
            <Text style={styles.statNumber}>{stats.averageScore}%</Text>
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
      </View>

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
          onPress={handleViewProgress}
        >
          <Text style={styles.actionIcon}>📈</Text>
          <Text style={styles.actionText}>Learning Progress</Text>
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

      {/* ✅ Debug Button - Hapus di production */}
      <TouchableOpacity 
        style={styles.debugButton} 
        onPress={forceReset}
      >
        <Text style={styles.debugText}>🔧 Force Reset (Debug)</Text>
      </TouchableOpacity>

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
          Last login: {profileData.last_login_streak ? 
            new Date(profileData.last_login_streak).toLocaleDateString('id-ID') : 
            'Unknown'
          }
        </Text>
      </View>

      {/* Bottom Spacing */}
      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

// ✅ Styles tetap sama
const styles = StyleSheet.create({
  // ... (styles tetap sama seperti sebelumnya)
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
    fontFamily: fonts.bodySemiBold,
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
  editButton: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.bodySemiBold,
    color: '#FFFFFF',
    opacity: 0.9,
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
    fontFamily: fonts.bodySemiBold,
  },
  xpText: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.bodySemiBold,
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
    fontFamily: fonts.bodySemiBold,
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
    fontFamily: fonts.bodySemiBold,
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
    fontFamily: fonts.bodySemiBold,
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

  // Debug Button
  debugButton: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: "#9333EA",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  debugText: {
    color: "#FFFFFF",
    fontSize: fonts.sizes.small,
    fontFamily: fonts.bodySemiBold,
  },

  // Logout Button
  logoutButton: {
    marginHorizontal: 20,
    marginTop: 16,
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
    fontFamily: fonts.bodySemiBold,
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
    fontFamily: fonts.bodySemiBold,
    marginBottom: 4,
  },
  footerSubtext: {
    color: colors.muted,
    fontSize: fonts.sizes.caption,
    fontFamily: fonts.body,
    opacity: 0.7,
  },
});