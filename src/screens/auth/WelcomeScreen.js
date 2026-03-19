import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ImageBackground,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { COLORS } from "../../constants";

export default function WelcomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top App Bar */}
        <View style={styles.topBar}>
          <Text style={styles.topBarTitle}>CỨU HỘ VIỆT NAM</Text>
        </View>

        {/* High-impact cover image */}
        <View style={styles.heroWrapper}>
          <ImageBackground
            source={{
              uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuABZF17voPeFoJzUhOTrDo4YTQVm_9INDOntcZs2C-RtqevONS-_itJfVar5z9V0KKoJvu8ud9AioTlDO3IaP5catMdB6n06DsDRNCrXAV-_8kWVhALUF-G6znOTNEIRCNgesJ8mi2TFKeoBsOLZOFSgKgdDLyR-C_fIQA9-_cVsRmZr5c_2BzrUJwotZQiwLwXKq3-6T2ek4nxSHOzVznsqV13-Nl59R9gDcRRAsKqur8xuju20S12R6a-sLKarO8N_YYQqNhX-rE",
            }}
            style={styles.heroImage}
            resizeMode="cover"
          >
            <View style={styles.heroOverlay} />
          </ImageBackground>
        </View>

        {/* Central glass card */}
        <View style={styles.cardWrapper}>
          <View style={styles.infoCard}>
            <View style={styles.infoBadge}>
              <Text style={styles.infoBadgeText}>HỆ THỐNG PHẢN ỨNG NHANH</Text>
            </View>
            <Text style={styles.infoTitle}>Sẵn sàng hỗ trợ cộng đồng</Text>
            <Text style={styles.infoSubtitle}>
              Hệ thống quản lý cứu hộ chuyên nghiệp tối ưu cho doanh nghiệp vận
              tải và cứu hộ khẩn cấp.
            </Text>
          </View>
        </View>

        {/* Main auth actions */}
        <View style={styles.authActions}>
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => navigation.navigate("Login")}
            activeOpacity={0.9}
          >
            <Text style={styles.loginBtnText}>ĐĂNG NHẬP</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.registerBtn}
            onPress={() => navigation.navigate("Register")}
            activeOpacity={0.9}
          >
            <Text style={styles.registerBtnText}>Tạo tài khoản mới</Text>
          </TouchableOpacity>
        </View>

        {/* Guest & footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={() => navigation.navigate("GuestTabs")}
            activeOpacity={0.7}
          >
            <Text style={styles.guestText}>Tiếp tục không cần đăng nhập</Text>
          </TouchableOpacity>
          <View style={styles.footerBrand}>
            <Text style={styles.footerBrandTitle}>CỨU HỘ VIỆT NAM</Text>
            <Text style={styles.footerBrandSub}>
              Hệ thống điều phối &amp; hỗ trợ nhân đạo
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7f8",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,127,255,0.12)",
  },
  topBarTitle: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: 0.5,
  },
  heroWrapper: {
    width: "100%",
  },
  heroImage: {
    width: "100%",
    height: 260,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,23,42,0.2)",
  },
  cardWrapper: {
    marginTop: -80,
    paddingHorizontal: 16,
  },
  infoCard: {
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",
    paddingVertical: 18,
    paddingHorizontal: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10,
  },
  infoBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "rgba(0,127,255,0.06)",
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  infoBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primary,
    letterSpacing: 1.5,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 6,
  },
  infoSubtitle: {
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 22,
  },
  authActions: {
    marginTop: 24,
    paddingHorizontal: 24,
    gap: 12,
  },
  loginBtn: {
    height: 56,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 9,
  },
  loginBtnText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  registerBtn: {
    height: 56,
    borderRadius: 14,
    backgroundColor: "#1e293b",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#020617",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  registerBtnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  footer: {
    marginTop: 24,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  guestText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  footerBrand: {
    marginTop: 16,
    alignItems: "center",
    opacity: 0.7,
  },
  footerBrandTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "#6b7280",
  },
  footerBrandSub: {
    fontSize: 11,
    color: "#9ca3af",
  },
});
