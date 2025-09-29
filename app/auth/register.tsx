import { colors, fonts } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { register } = useAuth();

  const handleRegister = async () => {
    // Validation
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Semua field harus diisi!");
      return;
    }

    if (!email.includes("@")) {
      Alert.alert("Error", "Format email tidak valid!");
      return;
    }

    if (password.length < 8) {
      Alert.alert("Error", "Password minimal 8 karakter!");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Password dan konfirmasi password tidak sama!");
      return;
    }

    setLoading(true);

    try {
      const success = await register(name, email, password);
      if (success) {
        router.replace("/(tabs)");
      }
    } catch (error) {
      console.error("Registration error:", error);
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
          <Text style={styles.title}>Daftar Akun Baru 🚀</Text>
          <Text style={styles.subtitle}>Bergabunglah dalam petualangan fisika</Text>
        </View>

        <View style={styles.form}>
          <TextInput 
            style={styles.input} 
            placeholder="Nama Lengkap" 
            placeholderTextColor={colors.muted} 
            value={name} 
            onChangeText={setName}
            autoCapitalize="words"
            editable={!loading}
          />
          
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
            placeholder="Password (min. 8 karakter)" 
            placeholderTextColor={colors.muted} 
            secureTextEntry 
            value={password} 
            onChangeText={setPassword}
            autoCorrect={false}
            editable={!loading}
          />

          <TextInput 
            style={styles.input} 
            placeholder="Konfirmasi Password" 
            placeholderTextColor={colors.muted} 
            secureTextEntry 
            value={confirmPassword} 
            onChangeText={setConfirmPassword}
            autoCorrect={false}
            editable={!loading}
          />
          
          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Mendaftarkan..." : "Daftar Sekarang"}
            </Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity onPress={() => router.push("/auth/login")}>
          <Text style={styles.link}>Sudah punya akun? Masuk di sini</Text>
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
    textAlign: "center"
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
    fontSize: fonts.sizes.body
  },
  link: { 
    color: colors.accent, 
    textAlign: "center",
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
  },
});