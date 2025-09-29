import { colors, fonts } from "@/constants/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

const slides = [
  {
    id: "1",
    title: "Belajar Fisika Jadi Seru",
    subtitle:
      "Temukan cara baru memahami konsep fisika melalui simulasi interaktif",
    image: require("@/assets/icon/onboarding_1.png"),
  },
  {
    id: "2",
    title: "Simulasi Interaktif",
    subtitle:
      "Mainkan dan eksperimen dengan berbagai simulasi fisika secara real-time",
    image: require("@/assets/icon/onboarding_2.png"),
  },
  {
    id: "3",
    title: "Jelajahi Dunia Fisika",
    subtitle:
      "Mulai perjalanan pembelajaran fisika yang menyenangkan sekarang juga!",
    image: require("@/assets/icon/onboarding_3.png"),
  },
];

export default function Onboarding() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const finishOnboarding = async () => {
    try {
      await AsyncStorage.setItem("hasSeenOnboarding", "true");
      console.log("✅ Onboarding finished, saved to AsyncStorage");
      router.replace("/auth/login");
    } catch (error) {
      console.error("❌ Error saving onboarding status:", error);
      router.replace("/auth/login");
    }
  };

  const nextSlide = () => {
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex });
      setCurrentIndex(nextIndex);
    } else {
      finishOnboarding();
    }
  };

  const skipOnboarding = () => {
    finishOnboarding();
  };

  const onViewableItemsChanged = ({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  };

  return (
    <View style={styles.container}>
      {/* Skip Button */}
      <TouchableOpacity style={styles.skipButton} onPress={skipOnboarding}>
        <Text style={styles.skipText}>Lewati</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <Image source={item.image} style={styles.image} />
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        )}
      />

      {/* Dots Indicator */}
      <View style={styles.dotsContainer}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor:
                  currentIndex === index ? colors.primary : colors.muted,
              },
            ]}
          />
        ))}
      </View>

      {/* Next/Start Button */}
      <TouchableOpacity style={styles.button} onPress={nextSlide}>
        <Text style={styles.buttonText}>
          {currentIndex === slides.length - 1 ? "Mulai Belajar" : "Lanjut"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// Update bagian styles di app/onboarding.tsx
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  skipButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  skipText: {
    color: colors.muted,
    fontSize: fonts.sizes.body,
    fontFamily: fonts.bodySemiBold,
    fontWeight: "600", // Explicit font weight
  },
  slide: {
    width,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  image: {
    width: 280,
    height: 280,
    marginBottom: 40,
    resizeMode: "contain",
  },
  title: {
    fontSize: fonts.sizes.title + 2, // Sedikit lebih besar
    fontFamily: fonts.title,
    fontWeight: "700", // Explicit bold
    color: colors.primary,
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    fontWeight: "500", // Medium weight
    color: colors.muted,
    textAlign: "center",
    lineHeight: 24,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  button: {
    backgroundColor: colors.primary,
    marginHorizontal: 40,
    padding: 18,
    borderRadius: 12,
    marginBottom: 50,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: fonts.sizes.body,
    fontFamily: fonts.bodyBold,
    fontWeight: "700", // Explicit bold
  },
});