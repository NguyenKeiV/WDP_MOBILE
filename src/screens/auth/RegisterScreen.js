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

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleRegister = async () => {
    const { username, email, password, confirm } = form;
    if (!username.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin");
      return;
    }
    if (password !== confirm) {
      Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Lỗi", "Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }
    setLoading(true);
    try {
      await register(username.trim(), email.trim(), password);
    } catch (e) {
      Alert.alert("Đăng ký thất bại", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#F5F8FA" }}
      edges={["top", "bottom"]}
    >
      <ImageBackground
        source={{
          uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCONi-LYcWNirkL8ocuYSsAQrrUwSdb2TaGxeeGchILldp8YBQaT-W0pM1MNPvOvomSPQS6yv8D-Yv29v08CQ7VHI1q0NVwfS8clJxIP16xYQrb7hblypeoD82sQn-YhUC7HkQ1s5_cwgA6Pi0yvHND_75iE7Q7h7pCJPZUZkjE-4CifgLiyMSoO-A3WgJV7Jhj_WuAwhBWqpTVUTJNIt-xi2TK5X3RfNpdyexxN_SgggYcRmQWzTFzOVSjW3fUcQCBPl9LYodsy8k",
        }}
        style={styles.bgImage}
        resizeMode="cover"
      >
        <View style={styles.bgGradient} />
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
                    color="#333842"
                  />
                </View>
              </TouchableOpacity>
              <Text style={styles.topLabel}>CỨU HỘ VIỆT NAM</Text>
              <View style={{ width: 40 }} />
            </View>

            <View style={styles.hero}>
              <Text style={styles.title}>Tạo tài khoản</Text>
              <Text style={styles.subtitle}>
                Gia nhập đội ngũ cứu trợ công nghệ cao
              </Text>
            </View>

            <View style={styles.card}>
              <View style={styles.form}>
                <View style={styles.field}>
                  <Text style={styles.label}>Họ và tên</Text>
                  <View style={styles.inputRow}>
                    <MaterialIcons
                      name="person-outline"
                      size={20}
                      color="#99A1AA"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Nguyễn Văn A"
                      placeholderTextColor="#99A1AA"
                      value={form.username}
                      onChangeText={(v) => update("username", v)}
                      autoCapitalize="words"
                    />
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Email</Text>
                  <View style={styles.inputRow}>
                    <MaterialIcons
                      name="mail-outline"
                      size={20}
                      color="#99A1AA"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="example@rescue.vn"
                      placeholderTextColor="#99A1AA"
                      value={form.email}
                      onChangeText={(v) => update("email", v)}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Mật khẩu</Text>
                  <View style={styles.inputRow}>
                    <MaterialIcons
                      name="lock-outline"
                      size={20}
                      color="#99A1AA"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••"
                      placeholderTextColor="#99A1AA"
                      value={form.password}
                      onChangeText={(v) => update("password", v)}
                      secureTextEntry={!showPass}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPass(!showPass)}
                      activeOpacity={0.8}
                    >
                      <MaterialIcons
                        name={showPass ? "visibility-off" : "visibility"}
                        size={20}
                        color="#99A1AA"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Xác nhận mật khẩu</Text>
                  <View style={styles.inputRow}>
                    <MaterialIcons
                      name="enhanced-encryption"
                      size={20}
                      color="#99A1AA"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••"
                      placeholderTextColor="#99A1AA"
                      value={form.confirm}
                      onChangeText={(v) => update("confirm", v)}
                      secureTextEntry={!showPass}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.registerBtn, loading && { opacity: 0.7 }]}
                  onPress={handleRegister}
                  disabled={loading}
                  activeOpacity={0.9}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <>
                      <Text style={styles.registerBtnText}>ĐĂNG KÝ NGAY</Text>
                      <MaterialIcons
                        name="arrow-forward"
                        size={18}
                        color={COLORS.white}
                      />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate("Login")}
              style={styles.loginLink}
              activeOpacity={0.8}
            >
              <Text style={styles.loginLinkText}>
                Bạn đã có tài khoản?
                <Text style={styles.loginLinkHighlight}> Đăng nhập ngay</Text>
              </Text>
            </TouchableOpacity>
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
  bgGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(245,248,250,0.7)",
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  topLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 3,
    textTransform: "uppercase",
    color: "#ffffff",
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  hero: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#333842",
    textAlign: "left",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: "#99A1AA",
  },
  card: {
    borderRadius: 16,
    padding: 18,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
    shadowColor: "#1793BB",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 8,
  },
  form: { rowGap: 14 },
  field: {
    rowGap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: "800",
    color: "#333842",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginLeft: 2,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 6,
  },
  inputIcon: {
    marginHorizontal: 6,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    fontSize: 14,
    color: "#111827",
  },
  registerBtn: {
    marginTop: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 9,
  },
  registerBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 1,
  },
  loginLink: {
    marginTop: 24,
    alignItems: "center",
  },
  loginLinkText: {
    fontSize: 13,
    color: "#99A1AA",
  },
  loginLinkHighlight: {
    color: COLORS.primary,
    fontWeight: "700",
  },
});
