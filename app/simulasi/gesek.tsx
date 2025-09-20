// app/simulasi/gesek.tsx
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import CardSimulasi from "../../components/CardSimulasi";
import { colors, fonts } from "../../constants/theme";

export default function Gesek() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <IconSymbol name="chevron.left" size={24} color={colors.primary} />
          <Text style={styles.backText}>Kembali</Text>
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.title}>Gaya Gesek</Text>
          <Text style={styles.subtitle}>Pilih sub-bab untuk mulai simulasi</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <CardSimulasi
          title="📐 Bidang Miring"
          subtitle="Belajar N = m·g·cosθ dan gaya gesek"
          onPress={() => router.push("/simulasi/gesek-miring")}
        />
        <CardSimulasi
          title="🌊 Bidang Tidak Rata"
          subtitle="Pengaruh permukaan tidak rata pada gesekan"
          onPress={() => router.push("/simulasi/gesek-rata")}
        />
        <CardSimulasi
          title="📦 Massa Benda"
          subtitle="Pengaruh massa pada gaya normal & gesek"
          onPress={() => router.push("/simulasi/gesek-masa")}
        />
        
        {/* Info card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 Tips</Text>
          <Text style={styles.infoText}>
            Setiap simulasi dirancang untuk membantu memahami konsep gaya gesek 
            dengan pendekatan interaktif dan visual.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: 4,
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: fonts.title,
    fontWeight: "800",
    color: colors.primary,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: { 
    color: colors.muted, 
    fontSize: 16,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  infoCard: {
    backgroundColor: colors.accent + '20', // Semi-transparent accent color
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  infoTitle: {
    fontSize: fonts.subtitle,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 8,
  },
  infoText: {
    color: colors.text,
    lineHeight: 20,
    fontSize: 14,
  },
});