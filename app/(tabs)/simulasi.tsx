// app/(tabs)/simulasi.tsx
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import CardSimulasi from "../../components/CardSimulasi";
import { colors, fonts } from "../../constants/theme";

export default function Simulasi() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.header}>Simulasi Fisika</Text>
        <Text style={styles.desc}>
          Untuk sekarang kita fokus pada tema <Text style={styles.bold}>Gaya
          Gesek</Text>. Klik untuk melihat sub-bab.
        </Text>

        <CardSimulasi
          title="⚡ Gaya Gesek"
          subtitle="Pelajari gesekan pada berbagai kondisi"
          onPress={() => router.push("/simulasi/gesek")}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inner: {
    padding: 20,
  },
  header: {
    fontSize: fonts.title,
    fontWeight: "800",
    color: colors.primary,
    marginBottom: 6,
  },
  desc: {
    color: colors.muted,
    marginBottom: 18,
  },
  bold: {
    color: colors.primary,
    fontWeight: "700",
  },
});
