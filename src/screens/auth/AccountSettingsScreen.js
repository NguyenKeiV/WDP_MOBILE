import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { useAuth } from "../../context/AuthContext";
import { COLORS } from "../../constants";

const C = {
  primary: COLORS.primary,
  text: "#0f172a",
  textMuted: "#64748b",
  cardBorder: "#e2e8f0",
  white: "#ffffff",
  danger: "#B71C1C",
  dangerBg: "#FFEBEE",
};

function SettingRow({ icon, label, onPress, color = C.text, bg }) {
  return (
    <TouchableOpacity
      style={[styles.row, bg && { backgroundColor: bg }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View
        style={[
          styles.rowIcon,
          {
            backgroundColor:
              bg === C.dangerBg
                ? "rgba(183,28,28,0.1)"
                : "rgba(0,127,255,0.1)",
          },
        ]}
      >
        <MaterialIcons
          name={icon}
          size={20}
          color={bg === C.dangerBg ? C.danger : C.primary}
        />
      </View>
      <Text
        style={[
          styles.rowLabel,
          { color: bg === C.dangerBg ? C.danger : color },
        ]}
      >
        {label}
      </Text>
      <MaterialIcons
        name="chevron-right"
        size={22}
        color={bg === C.dangerBg ? C.danger : C.textMuted}
      />
    </TouchableOpacity>
  );
}

export default function AccountSettingsScreen({ navigation }) {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn chắc chắn muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: () => {
          logout();
          navigation.reset({
            index: 0,
            routes: [{ name: "Welcome" }],
          });
        },
      },
    ]);
  };

  const paddingTop = Math.max(insets.top, 12);
  const paddingBottom = (insets.bottom || 24) + 24;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>Cài đặt tài khoản</Text>

        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <MaterialIcons name="person" size={32} color={C.primary} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.username || "Người dùng"}</Text>
            <Text style={styles.userEmail}>{user?.email || ""}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>
                {user?.role === "rescue_team"
                  ? "Đội cứu hộ"
                  : user?.role === "manager"
                  ? "Quản lý"
                  : "Công dân"}
              </Text>
            </View>
          </View>
        </View>

        {/* Settings Section */}
        <Text style={styles.sectionTitle}>Bảo mật</Text>
        <View style={styles.section}>
          <SettingRow
            icon="lock-reset"
            label="Đổi mật khẩu"
            onPress={() => navigation.navigate("ChangePassword")}
          />
        </View>

        {/* Danger Zone */}
        <Text style={styles.sectionTitle}>Tài khoản</Text>
        <View style={styles.section}>
          <SettingRow
            icon="logout"
            label="Đăng xuất"
            onPress={handleLogout}
            color={C.danger}
            bg={C.dangerBg}
          />
        </View>

        {/* App info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>Cứu Hộ Việt Nam</Text>
          <Text style={styles.appVersion}>Phiên bản 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  screenTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: C.text,
    marginBottom: 20,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: C.cardBorder,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  userInfo: { flex: 1 },
  userName: {
    fontSize: 18,
    fontWeight: "700",
    color: C.text,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: C.textMuted,
    marginBottom: 6,
  },
  roleBadge: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 11,
    fontWeight: "700",
    color: C.primary,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: C.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
    marginLeft: 4,
  },
  section: {
    backgroundColor: C.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.cardBorder,
    marginBottom: 24,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.cardBorder,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },
  appInfo: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 8,
  },
  appName: {
    fontSize: 13,
    fontWeight: "700",
    color: C.textMuted,
  },
  appVersion: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 2,
  },
});