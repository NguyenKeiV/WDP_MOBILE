import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { COLORS } from "../../constants";

export default function InventoryScreen() {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <MaterialIcons name="inventory-2" size={64} color={COLORS.gray} />
        </View>
        <Text style={styles.title}>Kiểm kê vật phẩm</Text>
        <Text style={styles.sub}>
          Chức năng đang được cập nhật. Bạn sẽ xem được danh sách vật phẩm đã phân cho đội khi backend hỗ trợ.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.grayLight },
  content: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  title: { fontSize: 20, fontWeight: "800", color: COLORS.black, marginBottom: 10 },
  sub: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: "center",
    lineHeight: 22,
  },
});
