// components/CardSimulasi.tsx
import React from "react";
import {
    GestureResponderEvent,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { colors, fonts } from "../constants/theme";

type Props = {
  title: string;
  subtitle?: string;
  onPress?: (e: GestureResponderEvent) => void;
};

export default function CardSimulasi({ title, subtitle, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={onPress}>
      <View>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    color: colors.primary,
    fontSize: fonts.subtitle,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 6,
    color: colors.muted,
    fontSize: fonts.body,
  },
});
