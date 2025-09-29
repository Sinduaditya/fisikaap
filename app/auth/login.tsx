import { colors, fonts } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
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

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const testConnection = async () => {
  setLoading(true);
  try {
    Alert.alert("Test Connection", "API connection test - this is a placeholder function");
  } catch (error) {
    Alert.alert("Error", "Connection test failed");
  } finally {
    setLoading(false);
  }
};

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Email dan password harus diisi!");
      return;
    }

    if (!email.includes("@")) {
      Alert.alert("Error", "Format email tidak valid!");
      return;
    }

    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        router.replace("/(tabs)");
      }
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Selamat Datang Kembali! 👋</Text>
          <Text style={styles.subtitle}>Silakan masuk ke akun Anda</Text>
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
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.muted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            autoCorrect={false}
            editable={!loading}
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
        {/* Development Tools - Only show in dev mode */}
        {__DEV__ && (
          <View style={styles.devSection}>
            <Text style={styles.devTitle}>🛠️ Development Tools</Text>
            <TouchableOpacity
              style={styles.testButton}
              onPress={testConnection}
              disabled={loading}
            >
              <Text style={styles.testButtonText}>
                {loading ? "Testing..." : "Test API Connection"}
              </Text>
            </TouchableOpacity>
            <Text style={styles.devHint}>
              Demo: admin@test.com / password123
            </Text>
          </View>
        )}
        <TouchableOpacity onPress={() => router.push("/auth/register")}>
          <Text style={styles.link}>Belum punya akun? Daftar sekarang</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}



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
    fontFamily: fonts.title,
    color: colors.primary,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.bodyRegular,
    color: colors.muted,
    textAlign: "center",
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
    fontFamily: fonts.bodyRegular,
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
    fontFamily: fonts.bodyBold,
    fontSize: fonts.sizes.body,
  },
  link: {
    color: colors.accent,
    textAlign: "center",
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
  },
  devSection: {
  marginTop: 20,
  padding: 16,
  backgroundColor: colors.card,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: colors.info + "30",
},
devTitle: {
  fontSize: fonts.sizes.small,
  fontFamily: fonts.subtitle,
  color: colors.info,
  textAlign: "center",
  marginBottom: 12,
},
testButton: {
  backgroundColor: colors.info,
  padding: 12,
  borderRadius: 8,
  alignItems: "center",
  marginBottom: 8,
},
testButtonText: {
  color: "#fff",
  fontSize: fonts.sizes.small,
  fontFamily: fonts.body,
},
devHint: {
  fontSize: fonts.sizes.caption,
  fontFamily: fonts.bodyRegular,
  color: colors.muted,
  textAlign: "center",
  fontStyle: "italic",
},
});