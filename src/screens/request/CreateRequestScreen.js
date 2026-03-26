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
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { requestsApi } from "../../api/requests";
import MapView, { Marker } from "react-native-maps";
import { uploadImage } from "../../api/upload";
import { useAuth } from "../../context/AuthContext";
import { COLORS, CATEGORIES, PRIORITIES, DISTRICTS } from "../../constants";
import { GUEST_REQUEST_IDS_KEY } from "../../utils/deviceGuestRequests";

const CATEGORY_CONFIG = {
  rescue: {
    icon: "medical-services",
    label: "Cứu hộ",
  },
  relief: {
    icon: "inventory-2",
    label: "Cứu trợ",
  },
};

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

export default function CreateRequestScreen({ navigation }) {
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
  const [mediaUris, setMediaUris] = useState([]);

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
        address: null,
      });
    } catch (e) {
      Alert.alert("Lỗi", "Không lấy được vị trí GPS. Vui lòng thử lại.");
    } finally {
      setGpsLoading(false);
    }
  };

  const openMapPicker = () => {
    navigation.navigate("MapPicker", {
      initialLatitude: gpsCoords?.latitude,
      initialLongitude: gpsCoords?.longitude,
      onConfirm: (result) => {
        setGpsCoords({
          latitude: result.latitude,
          longitude: result.longitude,
          address: result.address,
        });
      },
    });
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

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Cần quyền",
        "Cho phép truy cập thư viện ảnh để đính kèm ảnh.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.length) {
      setMediaUris((prev) =>
        [...prev, ...result.assets.map((a) => a.uri)].slice(0, 10),
      );
    }
  };

  const removeMediaUri = (index) => {
    setMediaUris((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      Alert.alert("Thiếu thông tin", err);
      return;
    }
    setSubmitting(true);
    try {
      let media_urls = [];
      if (mediaUris.length > 0) {
        const urls = await Promise.all(mediaUris.map((uri) => uploadImage(uri)));
        media_urls = urls.filter(Boolean);

        if (media_urls.length !== mediaUris.length) {
          throw new Error(
            "Một số ảnh chưa upload thành công. Vui lòng kiểm tra kết nối và thử lại.",
          );
        }
      }
      const res = await requestsApi.create({
        ...form,
        num_people: parseInt(form.num_people) || 1,
        location_type: "gps",
        latitude: gpsCoords.latitude,
        longitude: gpsCoords.longitude,
        address: gpsCoords.address || null,
        media_urls,
      });

      // Chỉ lưu local khi là guest
      if (!user) {
        const newId = res.data.id;
        const existing = await AsyncStorage.getItem(GUEST_REQUEST_IDS_KEY);
        const ids = existing ? JSON.parse(existing) : [];
        ids.unshift(newId);
        await AsyncStorage.setItem(
          GUEST_REQUEST_IDS_KEY,
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
      setMediaUris([]);
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

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: COLORS.grayLight }}
      edges={["top", "bottom"]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerBar}>
            <TouchableOpacity
              style={styles.headerBack}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <MaterialIcons name="arrow-back" size={20} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Tạo yêu cầu cứu hộ</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Thông tin khẩn cấp</Text>
              <Text style={styles.progressStep}>Bước 1 / 2</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={styles.progressBarFill} />
            </View>
          </View>

          {/* Loại hình cứu hộ */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>
              Loại hình cứu hộ <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => {
                const cfg = CATEGORY_CONFIG[cat.value] || {};
                const isActive = form.category === cat.value;
                return (
                  <TouchableOpacity
                    key={cat.value}
                    style={[
                      styles.categoryCard,
                      isActive && styles.categoryCardActive,
                    ]}
                    onPress={() => update("category", cat.value)}
                    activeOpacity={0.9}
                  >
                    <MaterialIcons
                      name={cfg.icon || "emergency"}
                      size={32}
                      color={isActive ? COLORS.primary : COLORS.textLight}
                      style={{ marginBottom: 6 }}
                    />
                    <Text
                      style={[
                        styles.categoryCardLabel,
                        isActive && styles.categoryCardLabelActive,
                      ]}
                    >
                      {cfg.label || cat.label.replace(/^[^\wÀ-ỹ]+?\s*/, "")}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
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
              Mô tả tình trạng <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Nhập chi tiết tình huống cần cứu hộ..."
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

          {/* Đính kèm ảnh */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Đính kèm ảnh (tùy chọn)</Text>
            <TouchableOpacity
              style={styles.addPhotoBtn}
              onPress={pickImages}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name="add-photo-alternate"
                size={24}
                color={COLORS.primary}
              />
              <Text style={styles.addPhotoText}>Chọn ảnh từ thư viện</Text>
              {mediaUris.length > 0 && (
                <Text style={styles.addPhotoCount}>{mediaUris.length} ảnh</Text>
              )}
            </TouchableOpacity>
            {mediaUris.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.mediaPreviewRow}
              >
                {mediaUris.map((uri, index) => (
                  <View key={index} style={styles.mediaPreviewWrap}>
                    <Image source={{ uri }} style={styles.mediaPreview} />
                    <TouchableOpacity
                      style={styles.mediaRemove}
                      onPress={() => removeMediaUri(index)}
                    >
                      <MaterialIcons
                        name="close"
                        size={16}
                        color={COLORS.white}
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
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
              <Text style={styles.fieldLabel}>Mức độ ưu tiên</Text>
              <View style={styles.prioritySegment}>
                {["low", "medium", "high", "urgent"]
                  .map((value) => PRIORITIES.find((p) => p.value === value))
                  .filter(Boolean)
                  .map((p) => {
                    const isActive = form.priority === p.value;
                    const labels = {
                      low: "Thấp",
                      medium: "TB",
                      high: "Cao",
                      urgent: "Khẩn",
                    };
                    return (
                      <TouchableOpacity
                        key={p.value}
                        style={[
                          styles.priorityBtn,
                          isActive && styles.priorityBtnActive,
                        ]}
                        onPress={() => update("priority", p.value)}
                        activeOpacity={0.9}
                      >
                        <Text
                          style={[
                            styles.priorityBtnText,
                            isActive && styles.priorityBtnTextActive,
                          ]}
                        >
                          {labels[p.value]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
              </View>
            </View>
          </View>

          {/* Vị trí GPS */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>
              Vị trí <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.locationHeaderRow}>
              <Text style={styles.locationLabel}>Vị trí hiện tại</Text>
              <View style={styles.locationStatus}>
                <View
                  style={[
                    styles.locationDot,
                    {
                      backgroundColor: gpsCoords ? COLORS.success : COLORS.gray,
                    },
                  ]}
                />
                <Text style={styles.locationStatusText}>
                  {gpsCoords ? "Đã xác định vị trí" : "Chưa có vị trí"}
                </Text>
              </View>
            </View>

            <View style={styles.mapPreview}>
              {gpsCoords ? (
                <MapView
                  style={StyleSheet.absoluteFillObject}
                  initialRegion={{
                    latitude: gpsCoords.latitude,
                    longitude: gpsCoords.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                  region={{
                    latitude: gpsCoords.latitude,
                    longitude: gpsCoords.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                  scrollEnabled={false}
                  zoomEnabled={false}
                >
                  <Marker
                    coordinate={{
                      latitude: gpsCoords.latitude,
                      longitude: gpsCoords.longitude,
                    }}
                    pinColor={COLORS.primary}
                  />
                </MapView>
              ) : (
                <View style={styles.mapPreviewInner}>
                  <MaterialIcons
                    name="map"
                    size={32}
                    color={COLORS.textLight}
                  />
                  <Text style={styles.mapPlaceholderText}>Chưa có vị trí</Text>
                </View>
              )}
              <View style={styles.mapPreviewControls}>
                {/* Nút lấy vị trí hiện tại */}
                <TouchableOpacity
                  style={styles.mapIconBtn}
                  onPress={getLocation}
                  disabled={gpsLoading}
                >
                  {gpsLoading ? (
                    <ActivityIndicator color={COLORS.text} size="small" />
                  ) : (
                    <MaterialIcons
                      name="my-location"
                      size={20}
                      color={COLORS.text}
                    />
                  )}
                </TouchableOpacity>
                {/* Nút chọn trên bản đồ */}
                <TouchableOpacity
                  style={styles.mapIconBtn}
                  onPress={openMapPicker}
                >
                  <MaterialIcons name="map" size={20} color={COLORS.text} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.gpsInfoRow}>
              {gpsCoords ? (
                <View>
                  <Text style={styles.gpsCords}>
                    {gpsCoords.latitude.toFixed(5)},{" "}
                    {gpsCoords.longitude.toFixed(5)}
                  </Text>
                  {gpsCoords.address ? (
                    <Text style={styles.gpsAddress} numberOfLines={2}>
                      📍 {gpsCoords.address}
                    </Text>
                  ) : null}
                </View>
              ) : (
                <Text style={styles.gpsWaiting}>Chưa có tọa độ GPS...</Text>
              )}
            </View>

            <View style={styles.districtRow}>
              <TouchableOpacity
                style={styles.selectBtn}
                onPress={() => setModal("district")}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.selectBtnText,
                    !form.district && styles.placeholder,
                  ]}
                >
                  {form.district || "Chọn quận/huyện tại TP.HCM..."}
                </Text>
                <MaterialIcons
                  name="expand-more"
                  size={18}
                  color={COLORS.textLight}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.95}
          >
            {submitting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <MaterialIcons name="send" size={22} color={COLORS.white} />
                <Text style={styles.submitBtnText}>GỬI YÊU CẦU CỨU HỘ</Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.submitHint}>
            Dữ liệu sẽ được gửi trực tiếp đến trung tâm cứu hộ
          </Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.grayLight },
  content: { padding: 16, paddingBottom: 40 },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  headerBack: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },
  headerSpacer: { width: 40, height: 40 },
  progressSection: {
    marginTop: 4,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  progressTitle: { fontSize: 13, fontWeight: "700", color: COLORS.primary },
  progressStep: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textLight,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 999,
    backgroundColor: COLORS.grayBorder,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    width: "50%",
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },
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
  categoryGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 4,
  },
  categoryCard: {
    width: "48%",
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.grayBorder,
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "08",
  },
  categoryCardLabel: { fontSize: 13, fontWeight: "600", color: COLORS.text },
  categoryCardLabelActive: { color: COLORS.primary },
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
  addPhotoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primary + "40",
  },
  addPhotoText: { fontSize: 14, color: COLORS.primary, fontWeight: "600" },
  addPhotoCount: { fontSize: 12, color: COLORS.textLight, marginLeft: 4 },
  mediaPreviewRow: { marginTop: 8, maxHeight: 88 },
  mediaPreviewWrap: { marginRight: 8, position: "relative" },
  mediaPreview: { width: 72, height: 72, borderRadius: 8 },
  mediaRemove: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  row2: { flexDirection: "row", gap: 10 },
  gpsCords: {
    fontSize: 12,
    color: COLORS.textLight,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  gpsAddress: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
    lineHeight: 16,
  },
  gpsWaiting: { fontSize: 13, color: COLORS.textLight },
  prioritySegment: {
    flexDirection: "row",
    padding: 2,
    backgroundColor: "hsl(210, 5%, 95%)",
    borderRadius: 14,
    gap: 4,
  },
  priorityBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 10,
    alignItems: "center",
  },
  priorityBtnActive: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  priorityBtnText: { fontSize: 11, fontWeight: "700", color: COLORS.textLight },
  priorityBtnTextActive: { color: COLORS.white },
  locationHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  locationLabel: { fontSize: 13, fontWeight: "600", color: COLORS.text },
  locationStatus: { flexDirection: "row", alignItems: "center", gap: 6 },
  locationDot: { width: 8, height: 8, borderRadius: 4 },
  locationStatusText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.success,
  },
  mapPreview: {
    height: 160,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
    backgroundColor: "#e5e7eb",
    overflow: "hidden",
    marginBottom: 8,
  },
  mapPreviewInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  mapPreviewControls: {
    position: "absolute",
    right: 10,
    bottom: 10,
    flexDirection: "column",
    gap: 8,
  },
  mapIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  gpsInfoRow: { marginTop: 4 },
  districtRow: { marginTop: 8 },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginTop: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  submitBtnText: { color: COLORS.white, fontSize: 16, fontWeight: "800" },
  submitHint: {
    fontSize: 10,
    color: COLORS.textLight,
    textAlign: "center",
    marginTop: 8,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
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
