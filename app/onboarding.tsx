import { colors, fonts } from "@/constants/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useRef } from "react";
import { Dimensions, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const { width } = Dimensions.get("window");

const slides = [
  { id: "1", title: "Belajar Fisika Jadi Seru", image: require("@/assets/icon/profile.png") },
  { id: "2", title: "Simulasi Interaktif", image: require("@/assets/icon/profile.png") },
  { id: "3", title: "Jelajahi Dunia Fisika", image: require("@/assets/icon/profile.png") },
];

export default function Onboarding() {
  const router = useRouter();
  const ref = useRef(null);

  const finishOnboarding = async () => {
    await AsyncStorage.setItem("hasSeenOnboarding", "true");
    router.replace("/auth/login");
  };

  return (
    <FlatList
      data={slides}
      keyExtractor={(item) => item.id}
      horizontal
      pagingEnabled
      renderItem={({ item, index }) => (
        <View style={styles.slide}>
          <Image source={item.image} style={styles.image} />
          <Text style={styles.title}>{item.title}</Text>
          {index === slides.length - 1 && (
            <TouchableOpacity style={styles.button} onPress={finishOnboarding}>
              <Text style={styles.buttonText}>Mulai Belajar</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  slide: { width, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  image: { width: 250, height: 250, marginBottom: 30, resizeMode: "contain" },
  title: { fontSize: fonts.title, fontWeight: "bold", color: colors.primary, textAlign: "center", marginBottom: 20 },
  button: { backgroundColor: colors.primary, padding: 15, borderRadius: 12, marginTop: 20 },
  buttonText: { color: "#fff", fontSize: fonts.body, fontWeight: "bold" },
});
