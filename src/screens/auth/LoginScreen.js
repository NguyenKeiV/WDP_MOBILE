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
  ImageBackground,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { useAuth } from "../../context/AuthContext";
import { COLORS } from "../../constants";

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin");
      return;
    }
    setLoading(true);
    try {
      const { promotedGuestCount } = await login(email.trim(), password);
      if (promotedGuestCount > 0) {
        Alert.alert(
          "Đã gộp yêu cầu",
          `Đã chuyển ${promotedGuestCount} yêu cầu tạo khi chưa đăng nhập vào danh sách trên thiết bị này. Trên máy khác, các yêu cầu đó sẽ không hiển thị cùng tài khoản.`,
        );
      }
    } catch (e) {
      Alert.alert("Đăng nhập thất bại", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#f5f7f8" }}
      edges={["top", "bottom"]}
    >
      <ImageBackground
        source={{
          uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuDSji9eOwZ2ClZ8npwEfbFUm74KqRl3gZwBu3_zQ5OydNZsFVy9o817JZsWOsphPh-VoJnhv9jbtQofh3f-LmIpEbkc7tcGWSNofxl2T9Kz0fzGNnjTGhAoEelXUxIjbR_L5hQ7XRx8CIpsQrAcLdFj6r5xHESnZHfyTCEtNS6B2BMny_fFiNlVXFcv1nFnZFA85Kc_4WG_hv4ypxoYlyRZDZdSOAOhAD5ETV43uUgJNs6aUctio3ZnEaQX_TNT6o-_h4yEuf3a3Zk",
        }}
        style={styles.bgImage}
        resizeMode="cover"
      >
        <View style={styles.bgOverlay} />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.topRow}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
              >
                <View style={styles.backCircle}>
                  <MaterialIcons
                    name="arrow-back-ios-new"
                    size={18}
                    color="#0f172a"
                  />
                </View>
              </TouchableOpacity>
              <Text style={styles.topTitle}>CỨU HỘ VIỆT NAM</Text>
            </View>

            <View style={styles.main}>
              <View style={styles.heroHeader}>
                <View style={styles.heroIconWrap}>
                  <MaterialIcons
                    name="medical-services"
                    size={32}
                    color={COLORS.white}
                  />
                </View>
                <Text style={styles.heroTitle}>Chào mừng trở lại</Text>
              </View>

              <View style={styles.card}>
                <View style={styles.form}>
                  <View style={styles.field}>
                    <Text style={styles.label}>Email</Text>
                    <View style={styles.inputGroup}>
                      <View style={styles.inputIcon}>
                        <MaterialIcons
                          name="person-outline"
                          size={18}
                          color="#9ca3af"
                        />
                      </View>
                      <TextInput
                        style={styles.input}
                        placeholder="Nhập tài khoản của bạn"
                        placeholderTextColor="#9ca3af"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.label}>Mật khẩu</Text>
                    <View style={styles.inputGroup}>
                      <View style={styles.inputIcon}>
                        <MaterialIcons
                          name="lock-outline"
                          size={18}
                          color="#9ca3af"
                        />
                      </View>
                      <TextInput
                        style={styles.input}
                        placeholder="••••••••"
                        placeholderTextColor="#9ca3af"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeBtn}
                        activeOpacity={0.8}
                      >
                        <MaterialIcons
                          name={showPassword ? "visibility-off" : "visibility"}
                          size={20}
                          color="#9ca3af"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
                    onPress={handleLogin}
                    disabled={loading}
                    activeOpacity={0.9}
                  >
                    {loading ? (
                      <ActivityIndicator color={COLORS.white} />
                    ) : (
                      <Text style={styles.loginBtnText}>ĐĂNG NHẬP</Text>
                    )}
                  </TouchableOpacity>

                  <View style={styles.footerLinks}>
                    <Text style={styles.footerText}>
                      Chưa có tài khoản?{" "}
                      <Text
                        style={styles.footerLink}
                        onPress={() => navigation.navigate("Register")}
                      >
                        Đăng ký ngay
                      </Text>
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bgImage: {
    flex: 1,
  },
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  backCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#0f172a",
    marginRight: 48,
  },
  main: {
    flex: 1,
    justifyContent: "center",
    paddingBottom: 24,
  },
  heroHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  heroIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0f172a",
  },
  heroSubtitle: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "500",
    color: "#4b5563",
  },
  card: {
    borderRadius: 20,
    padding: 18,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10,
  },
  form: { rowGap: 14 },
  field: {
    rowGap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1f2933",
    marginLeft: 2,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "rgba(255,255,255,0.8)",
    paddingHorizontal: 12,
  },
  inputIcon: {
    paddingRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111827",
  },
  eyeBtn: {
    paddingLeft: 4,
    paddingVertical: 6,
  },
  loginBtn: {
    marginTop: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 10,
  },
  loginBtnDisabled: { opacity: 0.7 },
  loginBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  footerLinks: {
    marginTop: 18,
    alignItems: "center",
  },
  footerText: {
    fontSize: 13,
    color: "#4b5563",
  },
  footerLink: {
    color: COLORS.primary,
    fontWeight: "800",
  },
});
