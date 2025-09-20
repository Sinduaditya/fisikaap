// app/(tabs)/profile.tsx
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "../../constants/theme";

export default function Profile() {
  const name = "Sindu";
  const email = "sindu@example.com";

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Image
          source={require("../../assets/images/avatar.png")}
          style={styles.avatar}
        />
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.email}>{email}</Text>
      </View>

      <View style={{ marginTop: 20, paddingHorizontal: 20 }}>
        <Text style={styles.helpTitle}>Tentang Aplikasi</Text>
        <Text style={styles.helpText}>
          Aplikasi edukasi fisika ramah anak. Fokus sekarang: Gaya Gesek.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: 48 },
  card: {
    marginHorizontal: 20,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    elevation: 2,
  },
  avatar: { width: 96, height: 96, borderRadius: 48, marginBottom: 12 },
  name: { fontSize: fonts.title, fontWeight: "800", color: colors.primary },
  email: { marginTop: 4, color: colors.muted },
  helpTitle: { fontWeight: "800", color: colors.primary, fontSize: fonts.subtitle },
  helpText: { color: colors.muted },
});
