// app/simulasi/gesek-rata.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, fonts } from "../../constants/theme";

export default function GesekRata(){
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gaya Gesek - Bidang Tidak Rata</Text>
      <Text style={styles.desc}>(Placeholder) Nanti isi WebView simulasi</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:colors.background,padding:20},
  title:{fontSize:fonts.title,color:colors.primary,fontWeight:"800"},
  desc:{marginTop:8,color:colors.muted}
});
