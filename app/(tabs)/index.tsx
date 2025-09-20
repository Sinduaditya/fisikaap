import { colors, fonts } from '@/constants/theme';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.header}>Selamat Datang!</Text>
        <Text style={styles.desc}>
          Aplikasi Simulasi Fisika untuk pembelajaran interaktif.
        </Text>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🧪 Fisika Interaktif</Text>
          <Text style={styles.cardDesc}>
            Pelajari konsep fisika melalui simulasi yang menarik dan mudah dipahami.
          </Text>
          <Image source={require("@/assets/icon/profile.png")} style={styles.image} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📱 Mudah Digunakan</Text>
          <Text style={styles.cardDesc}>
            Interface yang ramah pengguna untuk pengalaman belajar yang optimal.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  image: {
    width: '100%',
    height: 200,
    marginTop: 16,
    borderRadius: 12,
  },
  inner: {
    padding: 20,
    paddingTop: 50,
  },
  header: {
    fontSize: fonts.title,
    fontWeight: "800",
    color: colors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  desc: {
    color: colors.muted,
    marginBottom: 24,
    textAlign: 'center',
    fontSize: 16,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: fonts.subtitle,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 8,
  },
  cardDesc: {
    color: colors.text,
    lineHeight: 20,
  },
});