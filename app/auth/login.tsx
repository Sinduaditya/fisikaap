import { colors, fonts } from "@/constants/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Data dummy untuk testing
const DUMMY_USERS = [
  { email: "admin@test.com", password: "123456", name: "Admin Test" },
  { email: "user@test.com", password: "password", name: "User Test" },
  { email: "sindu@test.com", password: "12345", name: "Sindu" },
];

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Email dan password harus diisi!");
      return;
    }

    setLoading(true);

    try {
      // Simulasi API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Cek dummy data
      const user = DUMMY_USERS.find(
        (u) =>
          u.email.toLowerCase() === email.toLowerCase() &&
          u.password === password
      );

      if (user) {
        // Login berhasil - simpan data ke AsyncStorage
        await AsyncStorage.multiSet([
          ["isLoggedIn", "true"],
          ["userEmail", user.email],
          ["userName", user.name],
          ["userToken", "dummy_token_" + Date.now()],
        ]);

        console.log("✅ Login successful for:", user.name);

        Alert.alert("Berhasil", `Selamat datang, ${user.name}!`, [
          { text: "OK", onPress: () => router.replace("/(tabs)") },
        ]);
      } else {
        Alert.alert("Error", "Email atau password salah!");
      }
    } catch (error) {
      Alert.alert("Error", "Terjadi kesalahan saat login");
      console.error("❌ Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fillDummyData = (userIndex: number) => {
    setEmail(DUMMY_USERS[userIndex].email);
    setPassword(DUMMY_USERS[userIndex].password);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Selamat Datang Kembali!</Text>
          <Text style={styles.subtitle}>Silakan masuk ke akun Anda</Text>
        </View>

        {/* Dummy data buttons untuk testing */}
        <View style={styles.dummySection}>
          <Text style={styles.dummyTitle}>🧪 Data Testing:</Text>
          {DUMMY_USERS.map((user, index) => (
            <TouchableOpacity
              key={index}
              style={styles.dummyButton}
              onPress={() => fillDummyData(index)}
            >
              <Text style={styles.dummyText}>{user.name}</Text>
              <Text style={styles.dummyEmail}>{user.email}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.muted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.muted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            autoCorrect={false}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Memproses..." : "Masuk"}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.push("/auth/register")}>
          <Text style={styles.link}>Belum punya akun? Daftar sekarang</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Update bagian styles di app/auth/login.tsx
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: fonts.sizes.title,
    fontFamily: fonts.title, // Baloo2 Bold
    color: colors.primary,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body, // Nunito Regular
    color: colors.muted,
    textAlign: "center",
  },
  dummySection: {
    marginBottom: 30,
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accent + "30",
  },
  dummyTitle: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.subtitle, // Baloo2 SemiBold
    color: colors.primary,
    marginBottom: 12,
    textAlign: "center",
  },
  dummyButton: {
    backgroundColor: colors.accent + "20",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: "center",
  },
  dummyText: {
    color: colors.primary,
    fontSize: fonts.sizes.small,
    fontFamily: fonts.bodySemiBold, // Nunito SemiBold
  },
  dummyEmail: {
    color: colors.muted,
    fontSize: fonts.sizes.caption,
    fontFamily: fonts.body, // Nunito Regular
    marginTop: 2,
  },
  form: {
    marginBottom: 20,
  },
  input: {
    padding: 16,
    borderWidth: 1,
    borderColor: colors.muted + "50",
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: colors.card,
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body, // Nunito Regular
    color: colors.text,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonDisabled: {
    backgroundColor: colors.muted,
    elevation: 0,
    shadowOpacity: 0,
  },
  buttonText: {
    color: "#fff",
    fontFamily: fonts.bodyBold, // Nunito Bold
    fontSize: fonts.sizes.body,
  },
  link: {
    color: colors.accent,
    textAlign: "center",
    fontSize: fonts.sizes.body,
    fontFamily: fonts.bodySemiBold, // Nunito SemiBold
  },
});
