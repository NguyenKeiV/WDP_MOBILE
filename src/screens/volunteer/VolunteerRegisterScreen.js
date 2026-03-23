import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { useAuth } from "../../context/AuthContext";
import { COLORS, DISTRICTS } from "../../constants";
import { VOLUNTEER_SUPPORT_TYPES } from "../../constants/volunteer";
import { createVolunteerRegistration } from "../../api/volunteer";

const C = {
  text: "#0f172a",
  textMuted: "hsl(210, 5%, 50%)",
  border: "hsl(210, 5%, 88%)",
  white: "#ffffff",
};

export default function VolunteerRegisterScreen({ navigation }) {
  const { user } = useAuth();
  const [supportType, setSupportType] = useState(
    VOLUNTEER_SUPPORT_TYPES[0].value,
  );
  const [district, setDistrict] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [districtModal, setDistrictModal] = useState(false);

  const submit = async () => {
    if (!district) {
      Alert.alert("Thiếu thông tin", "Vui lòng chọn khu vực bạn có thể hỗ trợ.");
      return;
    }
    if (!user?.id) {
      Alert.alert("Lỗi", "Không xác định được tài khoản.");
      return;
    }
    setSubmitting(true);
    try {
      await createVolunteerRegistration(user.id, {
        support_type: supportType,
        district,
        note: note.trim() || null,
      });
      Alert.alert("Đã gửi", "Đăng ký tình nguyện đã được gửi lên hệ thống.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert("Lỗi", e?.message || "Không thể lưu.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.label}>Hình thức hỗ trợ</Text>
          <View style={styles.chipWrap}>
            {VOLUNTEER_SUPPORT_TYPES.map((t) => {
              const active = supportType === t.value;
              return (
                <TouchableOpacity
                  key={t.value}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setSupportType(t.value)}
                >
                  <MaterialIcons
                    name={t.icon}
                    size={18}
                    color={active ? COLORS.white : COLORS.primary}
                  />
                  <Text
                    style={[styles.chipText, active && styles.chipTextActive]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>Khu vực có thể tham gia</Text>
          <TouchableOpacity
            style={styles.selectBtn}
            onPress={() => setDistrictModal(true)}
          >
            <MaterialIcons name="place" size={22} color={COLORS.primary} />
            <Text
              style={[styles.selectText, !district && styles.selectPlaceholder]}
            >
              {district || "Chọn quận / huyện"}
            </Text>
            <MaterialIcons name="expand-more" size={22} color={C.textMuted} />
          </TouchableOpacity>

          <Text style={styles.label}>Kỹ năng / ghi chú (tuỳ chọn)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ví dụ: có xe tải nhỏ, kinh nghiệm sơ cấp cứu..."
            placeholderTextColor={C.textMuted}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.submitBtn, submitting && { opacity: 0.75 }]}
            onPress={submit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={C.white} />
            ) : (
              <>
                <MaterialIcons name="send" size={20} color={C.white} />
                <Text style={styles.submitText}>Gửi đăng ký</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={districtModal}
        animationType="slide"
        transparent
        onRequestClose={() => setDistrictModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn khu vực</Text>
              <TouchableOpacity onPress={() => setDistrictModal(false)}>
                <MaterialIcons name="close" size={24} color={C.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={DISTRICTS}
              keyExtractor={(item) => item}
              renderItem={({ item: d }) => (
                <TouchableOpacity
                  style={styles.modalRow}
                  onPress={() => {
                    setDistrict(d);
                    setDistrictModal(false);
                  }}
                >
                  <Text style={styles.modalRowText}>{d}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafc" },
  scroll: { padding: 16, paddingBottom: 32 },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: C.textMuted,
    marginBottom: 8,
    marginTop: 4,
  },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.white,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: { fontSize: 13, fontWeight: "600", color: C.text, maxWidth: 200 },
  chipTextActive: { color: C.white },
  selectBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  selectText: { flex: 1, fontSize: 15, color: C.text, fontWeight: "600" },
  selectPlaceholder: { color: C.textMuted, fontWeight: "500" },
  input: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    minHeight: 100,
    marginBottom: 24,
    color: C.text,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
  },
  submitText: { color: C.white, fontSize: 16, fontWeight: "800" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalBox: {
    backgroundColor: C.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "70%",
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  modalTitle: { fontSize: 17, fontWeight: "800", color: C.text },
  modalRow: { paddingVertical: 14, paddingHorizontal: 16 },
  modalRowText: { fontSize: 16, color: C.text },
});
