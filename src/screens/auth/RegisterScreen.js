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
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.white }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>← Quay lại</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Tạo tài khoản</Text>
          <Text style={styles.subtitle}>
            Đăng ký để theo dõi yêu cầu của bạn
          </Text>
        </View>

        <View style={styles.form}>
          {[
            {
              key: "username",
              label: "Tên người dùng",
              placeholder: "Nguyễn Văn A",
              keyboard: "default",
            },
            {
              key: "email",
              label: "Email",
              placeholder: "example@email.com",
              keyboard: "email-address",
            },
          ].map(({ key, label, placeholder, keyboard }) => (
            <View key={key}>
              <Text style={styles.label}>{label}</Text>
              <TextInput
                style={styles.input}
                placeholder={placeholder}
                value={form[key]}
                onChangeText={(v) => update(key, v)}
                keyboardType={keyboard}
                autoCapitalize="none"
              />
            </View>
          ))}

          <Text style={styles.label}>Mật khẩu</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Ít nhất 6 ký tự"
              value={form.password}
              onChangeText={(v) => update("password", v)}
              secureTextEntry={!showPass}
            />
            <TouchableOpacity
              onPress={() => setShowPass(!showPass)}
              style={styles.eyeBtn}
            >
              <Text style={{ fontSize: 18 }}>{showPass ? "🙈" : "👁️"}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Xác nhận mật khẩu</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập lại mật khẩu"
            value={form.confirm}
            onChangeText={(v) => update("confirm", v)}
            secureTextEntry={!showPass}
          />

          <TouchableOpacity
            style={[styles.registerBtn, loading && { opacity: 0.7 }]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.registerBtnText}>Đăng ký</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate("Login")}
          style={styles.loginLink}
        >
          <Text style={styles.loginLinkText}>
            Đã có tài khoản?{" "}
            <Text style={{ color: COLORS.primary, fontWeight: "700" }}>
              Đăng nhập
            </Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24 },
  backBtn: { marginBottom: 16, marginTop: 8 },
  backText: { color: COLORS.primary, fontSize: 15, fontWeight: "600" },
  header: { marginBottom: 28 },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.black,
    marginBottom: 6,
  },
  subtitle: { fontSize: 14, color: COLORS.textLight },
  form: { rowGap: 4 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.grayBorder,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    backgroundColor: COLORS.grayLight,
    marginBottom: 14,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.grayBorder,
    borderRadius: 12,
    backgroundColor: COLORS.grayLight,
    marginBottom: 14,
  },
  passwordInput: { flex: 1, padding: 14, fontSize: 15 },
  eyeBtn: { padding: 14 },
  registerBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  registerBtnText: { color: COLORS.white, fontSize: 16, fontWeight: "700" },
  loginLink: { alignItems: "center", marginTop: 24 },
  loginLinkText: { fontSize: 14, color: COLORS.textLight },
});
