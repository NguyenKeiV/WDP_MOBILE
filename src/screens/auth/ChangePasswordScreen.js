import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { COLORS } from "../../constants";
import { authApi } from "../../api/auth";

const C = {
  primary: COLORS.primary,
  text: "#0f172a",
  textMuted: "#64748b",
  cardBorder: "#e2e8f0",
  white: "#ffffff",
};

export default function ChangePasswordScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập mật khẩu hiện tại.");
      return;
    }
    if (!newPassword.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập mật khẩu mới.");
      return;
    }
    if (newPassword.trim().length < 6) {
      Alert.alert("Thông báo", "Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Thông báo", "Mật khẩu mới và xác nhận mật khẩu không khớp.");
      return;
    }
    if (currentPassword === newPassword) {
      Alert.alert("Thông báo", "Mật khẩu mới phải khác mật khẩu hiện tại.");
      return;
    }

    setLoading(true);
    try {
      await authApi.changePassword(currentPassword.trim(), newPassword.trim());
      Alert.alert("Thành công", "Đổi mật khẩu thành công!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert("Lỗi", e.message || "Không thể đổi mật khẩu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const paddingTop = Math.max(insets.top, 12);

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: paddingTop + 16 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Đổi mật khẩu</Text>
          <Text style={styles.subtitle}>
            Nhập mật khẩu hiện tại và mật khẩu mới để thay đổi.
          </Text>

          <View style={styles.form}>
            {/* Current Password */}
            <View style={styles.field}>
              <Text style={styles.label}>Mật khẩu hiện tại</Text>
              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <MaterialIcons name="lock-outline" size={18} color="#9ca3af" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập mật khẩu hiện tại"
                  placeholderTextColor="#9ca3af"
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry={!showCurrent}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  onPress={() => setShowCurrent(!showCurrent)}
                  style={styles.eyeBtn}
                  activeOpacity={0.8}
                >
                  <MaterialIcons
                    name={showCurrent ? "visibility-off" : "visibility"}
                    size={20}
                    color="#9ca3af"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* New Password */}
            <View style={styles.field}>
              <Text style={styles.label}>Mật khẩu mới</Text>
              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <MaterialIcons name="lock" size={18} color="#9ca3af" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Ít nhất 6 ký tự"
                  placeholderTextColor="#9ca3af"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNew}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  onPress={() => setShowNew(!showNew)}
                  style={styles.eyeBtn}
                  activeOpacity={0.8}
                >
                  <MaterialIcons
                    name={showNew ? "visibility-off" : "visibility"}
                    size={20}
                    color="#9ca3af"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.field}>
              <Text style={styles.label}>Xác nhận mật khẩu mới</Text>
              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <MaterialIcons name="lock-clock" size={18} color="#9ca3af" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập lại mật khẩu mới"
                  placeholderTextColor="#9ca3af"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirm(!showConfirm)}
                  style={styles.eyeBtn}
                  activeOpacity={0.8}
                >
                  <MaterialIcons
                    name={showConfirm ? "visibility-off" : "visibility"}
                    size={20}
                    color="#9ca3af"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleChangePassword}
              disabled={loading}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator color={C.white} />
              ) : (
                <Text style={styles.submitBtnText}>Xác nhận đổi mật khẩu</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelBtnText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: C.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: C.textMuted,
    marginBottom: 24,
    lineHeight: 20,
  },
  form: { gap: 16 },
  field: { gap: 6 },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1f2933",
    marginLeft: 2,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.cardBorder,
    backgroundColor: C.white,
    paddingHorizontal: 12,
  },
  inputIcon: { paddingRight: 8, alignItems: "center", justifyContent: "center" },
  input: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 14,
    color: C.text,
  },
  eyeBtn: { paddingLeft: 4, paddingVertical: 6 },
  submitBtn: {
    marginTop: 8,
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: {
    color: C.white,
    fontSize: 15,
    fontWeight: "700",
  },
  cancelBtn: {
    marginTop: 4,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: C.textMuted,
  },
});
