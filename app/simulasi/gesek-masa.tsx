// app/simulasi/gesek-massa.tsx
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "../../constants/theme";

export default function GesekMassa(){
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gaya Gesek - Pengaruh Massa</Text>
      <Text style={styles.desc}>(Placeholder) Nanti isi WebView simulasi</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:colors.background,padding:20},
  title:{fontSize:fonts.title,color:colors.primary,fontWeight:"800"},
  desc:{marginTop:8,color:colors.muted}
});
