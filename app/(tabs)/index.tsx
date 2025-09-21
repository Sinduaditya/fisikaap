import { colors, fonts } from '@/constants/theme';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const router = useRouter();

  const features = [
    {
      id: 1,
      title: "Gaya Gesek",
      description: "Pelajari konsep gaya gesek dengan simulasi interaktif",
      icon: "⚡",
      color: "#FF6B6B",
      onPress: () => router.push("/simulasi")
    },
    {
      id: 2,
      title: "Gerak Parabola",
      description: "Eksplorasi gerak proyektil dan lintasan benda",
      icon: "🌙",
      color: "#4ECDC4",
      onPress: () => console.log("Coming soon")
    },
    {
      id: 3,
      title: "Hukum Newton",
      description: "Memahami hukum-hukum dasar gerak benda",
      icon: "🎯",
      color: "#45B7D1",
      onPress: () => console.log("Coming soon")
    },
    {
      id: 4,
      title: "Energi Kinetik",
      description: "Simulasi energi gerak dan transformasinya",
      icon: "⚡",
      color: "#96CEB4",
      onPress: () => console.log("Coming soon")
    }
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Selamat Datang! 👋</Text>
            <Text style={styles.subtitle}>Mari belajar fisika dengan cara yang menyenangkan</Text>
          </View>
          <Image source={require("@/assets/icon/profile.png")} style={styles.avatar} />
        </View>
      </View>

      {/* Hero Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>🧪 PhysicsPlay</Text>
          <Text style={styles.heroDescription}>
            Eksplorasi dunia fisika melalui simulasi interaktif yang dirancang khusus untuk pembelajaran yang efektif dan menyenangkan.
          </Text>
          <TouchableOpacity style={styles.heroButton} onPress={() => router.push("/simulasi")}>
            <Text style={styles.heroButtonText}>Mulai Belajar</Text>
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
          <Text style={styles.statNumber}>5+</Text>
          <Text style={styles.statLabel}>Simulasi</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>100%</Text>
          <Text style={styles.statLabel}>Interaktif</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>24/7</Text>
          <Text style={styles.statLabel}>Akses</Text>
        </View>
      </View>

      {/* Features Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📚 Topik Pembelajaran</Text>
        <Text style={styles.sectionSubtitle}>Pilih topik yang ingin kamu pelajari</Text>
        
        <View style={styles.featuresGrid}>
          {features.map((feature) => (
            <TouchableOpacity 
              key={feature.id} 
              style={[styles.featureCard, { borderLeftColor: feature.color }]}
              onPress={feature.onPress}
              activeOpacity={0.8}
            >
              <View style={styles.featureHeader}>
                <View style={[styles.featureIcon, { backgroundColor: feature.color + "20" }]}>
                  <Text style={styles.featureEmoji}>{feature.icon}</Text>
                </View>
                <Text style={styles.featureArrow}>›</Text>
              </View>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
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
  
  // Header Styles
  header: {
    backgroundColor: colors.card,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    fontSize: fonts.sizes.title,
    fontFamily: fonts.title,
    color: colors.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.body,
    color: colors.muted,
    maxWidth: "80%",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: colors.primary + "30",
  },

  // Hero Card Styles
  heroCard: {
    backgroundColor: colors.primary,
    marginHorizontal: 20,
    marginTop: 35,
    borderRadius: 20,
    padding: 24,
    flexDirection: "row",
    alignItems: "center",
    elevation: 6,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  heroContent: {
    flex: 1,
    paddingRight: 16,
  },
  heroTitle: {
    fontSize: fonts.sizes.subtitle,
    fontFamily: fonts.title,
    color: "#FFFFFF",
    marginBottom: 8,
  },
  heroDescription: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.body,
    color: "#FFFFFF",
    opacity: 0.9,
    lineHeight: 20,
    marginBottom: 16,
  },
  heroButton: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  heroButtonText: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.bodySemiBold,
    color: colors.primary,
  },
  heroImageContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  heroImageBackground: {
    width: 80,
    height: 80,
    backgroundColor: "#FFFFFF",
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
    marginBottom: 16,
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
    alignItems: "center",
    marginBottom: 12,
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
  },

});