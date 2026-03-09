import React, { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
} from "react-native";
import * as Location from "expo-location";
import { requestsApi } from "../../api/requests";
import { useAuth } from "../../context/AuthContext";
import { COLORS, CATEGORIES, PRIORITIES, DISTRICTS } from "../../constants";

const SelectModal = ({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}) => (
  <Modal visible={visible} transparent animationType="slide">
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalClose}>✕</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={options}
          keyExtractor={(item) => item.value || item}
          renderItem={({ item }) => {
            const val = item.value !== undefined ? item.value : item;
            const label = item.label || item;
            const isSelected = selected === val;
            return (
              <TouchableOpacity
                style={[
                  styles.modalOption,
                  isSelected && styles.modalOptionSelected,
                ]}
                onPress={() => {
                  onSelect(val);
                  onClose();
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    isSelected && styles.modalOptionTextSelected,
                  ]}
                >
                  {label}
                </Text>
                {isSelected && <Text style={{ color: COLORS.primary }}>✓</Text>}
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </View>
  </Modal>
);

export default function CreateRequestScreen() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    category: "",
    district: "",
    phone_number: "",
    description: "",
    num_people: "1",
    priority: "medium",
    location_type: "gps",
  });
  const [gpsCoords, setGpsCoords] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modal, setModal] = useState(null);
  const [success, setSuccess] = useState(false);

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const getLocation = async () => {
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Không có quyền",
          "Hãy cho phép ứng dụng truy cập vị trí trong cài đặt",
        );
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setGpsCoords({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    } catch (e) {
      Alert.alert("Lỗi", "Không lấy được vị trí GPS. Vui lòng thử lại.");
    } finally {
      setGpsLoading(false);
    }
  };

  useEffect(() => {
    getLocation();
  }, []);

  const validate = () => {
    if (!form.category) return "Vui lòng chọn loại yêu cầu";
    if (!form.district) return "Vui lòng chọn quận/huyện";
    if (!form.phone_number.trim()) return "Vui lòng nhập số điện thoại";
    if (form.description.trim().length < 10)
      return "Mô tả phải có ít nhất 10 ký tự";
    const numPeople = parseInt(form.num_people);
    if (!numPeople || numPeople < 1) return "Số người phải ít nhất là 1";
    if (!gpsCoords) return "Chưa lấy được tọa độ GPS. Vui lòng thử lại.";
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      Alert.alert("Thiếu thông tin", err);
      return;
    }
    setSubmitting(true);
    try {
      const res = await requestsApi.create({
        ...form,
        num_people: parseInt(form.num_people) || 1,
        location_type: "gps",
        latitude: gpsCoords.latitude,
        longitude: gpsCoords.longitude,
      });

      // Chỉ lưu local khi là guest
      if (!user) {
        const newId = res.data.id;
        const existing = await AsyncStorage.getItem("guest_request_ids");
        const ids = existing ? JSON.parse(existing) : [];
        ids.unshift(newId);
        await AsyncStorage.setItem(
          "guest_request_ids",
          JSON.stringify(ids.slice(0, 50)),
        );
      }

      setSuccess(true);
      setForm({
        category: "",
        district: "",
        phone_number: "",
        description: "",
        num_people: "1",
        priority: "medium",
        location_type: "gps",
      });
      setGpsCoords(null);
    } catch (e) {
      Alert.alert("Gửi thất bại", e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <View style={styles.successContainer}>
        <Text style={styles.successIcon}>✅</Text>
        <Text style={styles.successTitle}>Đã gửi yêu cầu!</Text>
        <Text style={styles.successSub}>
          Yêu cầu của bạn đã được ghi nhận. Chúng tôi sẽ xử lý sớm nhất có thể.
        </Text>
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => {
            setSuccess(false);
            getLocation();
          }}
        >
          <Text style={styles.newBtnText}>+ Tạo yêu cầu mới</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const selectedPriority = PRIORITIES.find((p) => p.value === form.priority);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.screenTitle}>🆘 Tạo yêu cầu cứu hộ</Text>
        <Text style={styles.screenSub}>
          Điền đầy đủ thông tin để chúng tôi hỗ trợ bạn nhanh nhất
        </Text>

        {/* Loại yêu cầu — 2 nút inline */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>
            Loại yêu cầu <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.categoryRow}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.categoryBtn,
                  form.category === cat.value && {
                    backgroundColor: cat.color,
                    borderColor: cat.color,
                  },
                ]}
                onPress={() => update("category", cat.value)}
              >
                <Text
                  style={[
                    styles.categoryBtnText,
                    form.category === cat.value && { color: COLORS.white },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quận/Huyện */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>
            Quận/Huyện <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={styles.selectBtn}
            onPress={() => setModal("district")}
          >
            <Text
              style={[
                styles.selectBtnText,
                !form.district && styles.placeholder,
              ]}
            >
              {form.district || "Chọn quận/huyện tại TP.HCM..."}
            </Text>
            <Text>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Số điện thoại */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>
            Số điện thoại <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="0912 345 678"
            value={form.phone_number}
            onChangeText={(v) => update("phone_number", v)}
            keyboardType="phone-pad"
          />
        </View>

        {/* Mô tả */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>
            Mô tả tình huống <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Mô tả chi tiết tình huống, số người, tình trạng..."
            value={form.description}
            onChangeText={(v) => update("description", v)}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>
            {form.description.length} ký tự (tối thiểu 10)
          </Text>
        </View>

        {/* Số người & Mức ưu tiên */}
        <View style={styles.row2}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>Số người</Text>
            <TextInput
              style={styles.input}
              value={form.num_people}
              onChangeText={(v) =>
                update("num_people", v.replace(/[^0-9]/g, ""))
              }
              keyboardType="number-pad"
            />
          </View>
          <View style={[styles.field, { flex: 2 }]}>
            <Text style={styles.fieldLabel}>Mức ưu tiên</Text>
            <TouchableOpacity
              style={styles.selectBtn}
              onPress={() => setModal("priority")}
            >
              <Text style={styles.selectBtnText}>
                {selectedPriority?.label || "—"}
              </Text>
              <Text>▼</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* GPS */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>
            Vị trí GPS <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.gpsBox}>
            {gpsCoords ? (
              <>
                <Text style={styles.gpsSuccess}>✅ Đã lấy tọa độ</Text>
                <Text style={styles.gpsCords}>
                  📍 {gpsCoords.latitude.toFixed(5)},{" "}
                  {gpsCoords.longitude.toFixed(5)}
                </Text>
              </>
            ) : (
              <Text style={styles.gpsWaiting}>📡 Chưa có tọa độ...</Text>
            )}
            <TouchableOpacity
              style={styles.gpsBtn}
              onPress={getLocation}
              disabled={gpsLoading}
            >
              {gpsLoading ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <Text style={styles.gpsBtnText}>
                  🔄 {gpsCoords ? "Cập nhật" : "Lấy vị trí"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.submitBtnText}>🆘 Gửi yêu cầu cứu hộ</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <SelectModal
        visible={modal === "district"}
        title="Chọn Quận/Huyện tại TP.HCM"
        options={DISTRICTS}
        selected={form.district}
        onSelect={(v) => update("district", v)}
        onClose={() => setModal(null)}
      />
      <SelectModal
        visible={modal === "priority"}
        title="Chọn mức ưu tiên"
        options={PRIORITIES}
        selected={form.priority}
        onSelect={(v) => update("priority", v)}
        onClose={() => setModal(null)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.grayLight },
  content: { padding: 16, paddingBottom: 40 },
  screenTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.primary,
    marginBottom: 4,
  },
  screenSub: { fontSize: 13, color: COLORS.textLight, marginBottom: 20 },
  field: { marginBottom: 14 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 6,
  },
  required: { color: COLORS.primary },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.grayBorder,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
  },
  textarea: { height: 100, paddingTop: 12 },
  charCount: {
    fontSize: 11,
    color: COLORS.textLight,
    textAlign: "right",
    marginTop: 4,
  },
  categoryRow: { flexDirection: "row", gap: 10 },
  categoryBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: COLORS.grayBorder,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  categoryBtnText: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  selectBtn: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.grayBorder,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectBtnText: { fontSize: 15, color: COLORS.text },
  placeholder: { color: "#BDBDBD" },
  row2: { flexDirection: "row", gap: 10 },
  gpsBox: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.grayBorder,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  gpsSuccess: { fontSize: 14, fontWeight: "600", color: COLORS.success },
  gpsCords: {
    fontSize: 12,
    color: COLORS.textLight,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  gpsWaiting: { fontSize: 14, color: COLORS.textLight },
  gpsBtn: {
    backgroundColor: COLORS.secondary,
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
    marginTop: 4,
  },
  gpsBtnText: { color: COLORS.white, fontWeight: "600", fontSize: 14 },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 18,
    alignItems: "center",
    marginTop: 8,
  },
  submitBtnText: { color: COLORS.white, fontSize: 17, fontWeight: "800" },
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: COLORS.white,
  },
  successIcon: { fontSize: 72, marginBottom: 16 },
  successTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.success,
    marginBottom: 12,
  },
  successSub: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  newBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    paddingHorizontal: 32,
  },
  newBtnText: { color: COLORS.white, fontWeight: "700", fontSize: 15 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayBorder,
  },
  modalTitle: { fontSize: 16, fontWeight: "700", color: COLORS.black },
  modalClose: { fontSize: 18, color: COLORS.gray, padding: 4 },
  modalOption: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
  },
  modalOptionSelected: { backgroundColor: COLORS.primaryLight },
  modalOptionText: { fontSize: 15, color: COLORS.text },
  modalOptionTextSelected: { color: COLORS.primary, fontWeight: "600" },
});
