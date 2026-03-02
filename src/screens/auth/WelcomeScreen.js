import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { COLORS } from "../../constants";

export default function WelcomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroIcon}>🚨</Text>
          <Text style={styles.appName}>Hệ Thống Cứu Hộ</Text>
          <Text style={styles.subtitle}>
            Kết nối người dân với lực lượng cứu hộ nhanh chóng và hiệu quả
          </Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          {[
            { icon: "📍", text: "Gửi yêu cầu cứu hộ với vị trí GPS chính xác" },
            {
              icon: "📋",
              text: "Theo dõi trạng thái yêu cầu theo thời gian thực",
            },
            { icon: "🚒", text: "Kết nối trực tiếp với đội cứu hộ gần nhất" },
          ].map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>

        {/* Buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.primaryBtnText}>Đăng nhập</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate("Register")}
          >
            <Text style={styles.secondaryBtnText}>Tạo tài khoản mới</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.guestBtn}
            onPress={() => navigation.navigate("GuestTabs")}
          >
            <Text style={styles.guestBtnText}>
              Tiếp tục không cần đăng nhập →
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { flex: 1, padding: 28, justifyContent: "space-between" },
  hero: { alignItems: "center", marginTop: 40 },
  heroIcon: { fontSize: 80, marginBottom: 16 },
  appName: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.primary,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textLight,
    textAlign: "center",
    lineHeight: 22,
  },
  features: { gap: 16 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  featureIcon: { fontSize: 28 },
  featureText: { fontSize: 14, color: COLORS.text, flex: 1, lineHeight: 20 },
  buttons: { gap: 12, marginBottom: 16 },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
  },
  primaryBtnText: { color: COLORS.white, fontSize: 16, fontWeight: "700" },
  secondaryBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
  },
  secondaryBtnText: { color: COLORS.primary, fontSize: 16, fontWeight: "600" },
  guestBtn: { alignItems: "center", padding: 12 },
  guestBtnText: { color: COLORS.textLight, fontSize: 14, fontWeight: "500" },
});
