import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
  Image,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as ImagePicker from "expo-image-picker";
import { vehicleRequestsApi } from "../../api/vehicleRequests";
import { missionsApi } from "../../api/missions";
import { uploadImage } from "../../api/upload";
import { COLORS } from "../../constants";

const VEHICLE_TYPE_LABELS = {
  car: "Ô tô",
  boat: "Xuồng / Thuyền",
  helicopter: "Trực thăng",
  truck: "Xe tải",
  motorcycle: "Xe máy",
  other: "Khác",
};

const VEHICLE_TYPE_ICONS = {
  car: "directions-car",
  boat: "directions-boat",
  helicopter: "flight",
  truck: "local-shipping",
  motorcycle: "two-wheeler",
  other: "commute",
};

const STATUS_CONFIG = {
  pending: {
    label: "Chờ duyệt",
    color: "#F57C00",
    bg: "#FFF3E0",
    icon: "pending-actions",
  },
  approved: {
    label: "Đã được cấp",
    color: COLORS.primary,
    bg: COLORS.primary + "15",
    icon: "check-circle",
  },
  returned: {
    label: "Đã trả xe",
    color: "#388E3C",
    bg: "#E8F5E9",
    icon: "assignment-return",
  },
  pending_return: {
    label: "Chờ quản lý xác nhận",
    color: "#4F46E5",
    bg: "#EEF2FF",
    icon: "pending-actions",
  },
  rejected: {
    label: "Bị từ chối",
    color: "#757575",
    bg: "#F5F5F5",
    icon: "cancel",
  },
};

const RETURN_CHECKLIST_OPTIONS = [
  "Vệ sinh phương tiện",
  "Kiểm tra máy",
  "Bàn giao chìa khóa",
  "Nạp nhiên liệu",
];

function VehicleRequestCard({ item, onReturn, returning }) {
  const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
  const typeIcon = VEHICLE_TYPE_ICONS[item.vehicle_type] || "commute";
  const typeLabel = VEHICLE_TYPE_LABELS[item.vehicle_type] || item.vehicle_type;
  const assignedVehicles = item.assigned_vehicles || [];

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={styles.typeIconWrap}>
            <MaterialIcons name={typeIcon} size={24} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.cardTitle}>{typeLabel}</Text>
            <Text style={styles.cardSub}>
              Số lượng yêu cầu: {item.quantity_needed}
            </Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
          <MaterialIcons
            name={statusCfg.icon}
            size={12}
            color={statusCfg.color}
          />
          <Text style={[styles.statusText, { color: statusCfg.color }]}>
            {statusCfg.label}
          </Text>
        </View>
      </View>

      <View style={styles.reasonRow}>
        <MaterialIcons name="info-outline" size={14} color={COLORS.textLight} />
        <Text style={styles.reasonText} numberOfLines={2}>
          {item.reason}
        </Text>
      </View>

      {assignedVehicles.length > 0 && (
        <View style={styles.vehicleList}>
          <Text style={styles.vehicleListTitle}>Xe được cấp:</Text>
          {assignedVehicles.map((v) => (
            <View key={v.id} style={styles.vehicleItem}>
              <MaterialIcons
                name={VEHICLE_TYPE_ICONS[v.type] || "commute"}
                size={14}
                color={COLORS.textLight}
              />
              <Text style={styles.vehicleItemText}>
                {v.name}
                {v.license_plate ? " · " + v.license_plate : ""}
              </Text>
              <View
                style={[
                  styles.vehicleStatusDot,
                  {
                    backgroundColor:
                      v.status === "in_use" ? COLORS.primary : "#388E3C",
                  },
                ]}
              />
            </View>
          ))}
        </View>
      )}

      <Text style={styles.timeText}>
        {"Tạo lúc: " + new Date(item.created_at).toLocaleString("vi-VN")}
      </Text>

      {item.status === "approved" && (
        <TouchableOpacity
          style={[styles.returnBtn, returning && { opacity: 0.7 }]}
          onPress={() => onReturn(item)}
          disabled={returning}
          activeOpacity={0.85}
        >
          {returning ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <>
              <MaterialIcons
                name="assignment-return"
                size={20}
                color={COLORS.white}
              />
              <Text style={styles.returnBtnText}>Báo cáo đã trả xe</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {item.status === "returned" && (
        <View style={styles.returnedBanner}>
          <MaterialIcons name="check-circle" size={18} color="#388E3C" />
          <Text style={styles.returnedText}>Xe đã được trả thành công</Text>
        </View>
      )}

      {item.status === "pending_return" && (
        <View style={styles.pendingReturnBanner}>
          <MaterialIcons name="pending-actions" size={18} color="#4F46E5" />
          <Text style={styles.pendingReturnText}>Chờ quản lý xác nhận</Text>
        </View>
      )}
    </View>
  );
}

export default function VehicleReturnScreen() {
  const insets = useSafeAreaInsets();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [returningId, setReturningId] = useState(null);
  const [myTeamId, setMyTeamId] = useState(null);
  const [myTeamName, setMyTeamName] = useState("");
  const [fetchError, setFetchError] = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnTarget, setReturnTarget] = useState(null);
  const [checklist, setChecklist] = useState([]);
  const [fuelLevel, setFuelLevel] = useState("");
  const [damageReport, setDamageReport] = useState("");
  const [returnNotes, setReturnNotes] = useState("");
  const [returnPhotoUris, setReturnPhotoUris] = useState([]);

  // ── Sửa: lấy team_id từ endpoint missions trước, rồi mới filter vehicle requests
  const fetchRequests = useCallback(async () => {
    try {
      setFetchError(null);

      // Bước 1: lấy thông tin team của rescue_team đang đăng nhập
      let teamId = myTeamId;
      let teamName = myTeamName;

      if (!teamId) {
        const missionRes = await missionsApi.getMyTeamMissions();
        const team = missionRes?.data?.team;
        if (!team?.id) {
          setFetchError("Tài khoản chưa được liên kết với đội nào.");
          setRequests([]);
          return;
        }
        teamId = team.id;
        teamName = team.name || "";
        setMyTeamId(teamId);
        setMyTeamName(teamName);
      }

      // Bước 2: lấy vehicle requests của team mình (approved + pending_return + returned)
      const [approvedRes, pendingReturnRes, returnedRes] = await Promise.allSettled([
        vehicleRequestsApi.getAll({ status: "approved", team_id: teamId }),
        vehicleRequestsApi.getAll({ status: "pending_return", team_id: teamId }),
        vehicleRequestsApi.getAll({ status: "returned", team_id: teamId }),
      ]);

      const approved =
        approvedRes.status === "fulfilled" ? approvedRes.value?.data || [] : [];
      const pendingReturn =
        pendingReturnRes.status === "fulfilled"
          ? pendingReturnRes.value?.data || []
          : [];
      const returned =
        returnedRes.status === "fulfilled" ? returnedRes.value?.data || [] : [];

      // Gộp và sắp xếp
      const all = [...approved, ...pendingReturn, ...returned].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at),
      );

      setRequests(all);
    } catch (e) {
      console.error("fetchRequests error:", e.message);
      setFetchError("Không thể tải danh sách phương tiện. Vui lòng thử lại.");
    }
  }, [myTeamId, myTeamName]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchRequests();
      setLoading(false);
    };
    init();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRequests();
    setRefreshing(false);
  };

  const resetReturnForm = () => {
    setChecklist([]);
    setFuelLevel("");
    setDamageReport("");
    setReturnNotes("");
    setReturnPhotoUris([]);
  };

  const handleReturn = (item) => {
    setReturnTarget(item);
    resetReturnForm();
    setShowReturnModal(true);
  };

  const toggleChecklist = (label) => {
    setChecklist((prev) =>
      prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label],
    );
  };

  const pickReturnPhotos = () => {
    Alert.alert("Đính kèm ảnh", "Chọn nguồn ảnh", [
      {
        text: "📷 Chụp ảnh",
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== "granted") {
            Alert.alert("Cần quyền", "Cho phép truy cập camera.");
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
            allowsEditing: true,
          });
          if (!result.canceled && result.assets?.length) {
            setReturnPhotoUris((prev) =>
              [...prev, ...result.assets.map((a) => a.uri)].slice(0, 10),
            );
          }
        },
      },
      {
        text: "🖼️ Thư viện",
        onPress: async () => {
          const { status } =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== "granted") {
            Alert.alert("Cần quyền", "Cho phép truy cập thư viện ảnh.");
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.8,
          });
          if (!result.canceled && result.assets?.length) {
            setReturnPhotoUris((prev) =>
              [...prev, ...result.assets.map((a) => a.uri)].slice(0, 10),
            );
          }
        },
      },
      { text: "Hủy", style: "cancel" },
    ]);
  };

  const confirmReturn = async () => {
    if (!returnTarget?.id) return;
    setReturningId(returnTarget.id);
    try {
      const photoUrls =
        returnPhotoUris.length > 0
          ? (await Promise.all(returnPhotoUris.map((uri) => uploadImage(uri)))).filter(
              Boolean,
            )
          : [];
      await vehicleRequestsApi.reportReturn(returnTarget.id, {
        checklist_items: checklist,
        fuel_level: fuelLevel?.trim() || undefined,
        damage_report: damageReport?.trim() || undefined,
        return_notes: returnNotes?.trim() || undefined,
        media_urls: photoUrls,
      });
      setRequests((prev) =>
        prev.map((r) =>
          r.id === returnTarget.id ? { ...r, status: "pending_return" } : r,
        ),
      );
      setShowReturnModal(false);
      setReturnTarget(null);
      Alert.alert(
        "✅ Thành công",
        "Đã gửi báo cáo trả xe. Trạng thái đã chuyển sang chờ quản lý xác nhận.",
      );
    } catch (e) {
      Alert.alert(
        "Lỗi",
        e.message || "Không thể báo cáo trả xe. Vui lòng thử lại.",
      );
    } finally {
      setReturningId(null);
    }
  };

  const approvedCount = requests.filter((r) => r.status === "approved").length;
  const pendingReturnCount = requests.filter(
    (r) => r.status === "pending_return",
  ).length;
  const returnedCount = requests.filter((r) => r.status === "returned").length;
  const paddingBottom = (insets.bottom || 24) + 24;

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <VehicleRequestCard
            item={item}
            onReturn={handleReturn}
            returning={returningId === item.id}
          />
        )}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Quản lý phương tiện</Text>
            {myTeamName ? (
              <Text style={styles.teamNameText}>Đội: {myTeamName}</Text>
            ) : null}
            <Text style={styles.subtitle}>
              Báo cáo trả xe sau khi hoàn thành nhiệm vụ
            </Text>

            {fetchError ? (
              <View style={styles.errorBanner}>
                <MaterialIcons name="error-outline" size={16} color="#B71C1C" />
                <Text style={styles.errorText}>{fetchError}</Text>
              </View>
            ) : (
              <View style={styles.statsRow}>
                <View
                  style={[
                    styles.statCard,
                    { backgroundColor: COLORS.primary + "15" },
                  ]}
                >
                  <Text style={[styles.statNum, { color: COLORS.primary }]}>
                    {approvedCount}
                  </Text>
                  <Text style={styles.statLabel}>Đang sử dụng</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: "#E8F5E9" }]}>
                  <Text style={[styles.statNum, { color: "#388E3C" }]}>
                    {returnedCount}
                  </Text>
                  <Text style={styles.statLabel}>Đã trả</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: "#EEF2FF" }]}>
                  <Text style={[styles.statNum, { color: "#4F46E5" }]}>
                    {pendingReturnCount}
                  </Text>
                  <Text style={styles.statLabel}>Chờ xác nhận</Text>
                </View>
              </View>
            )}

            {approvedCount > 0 && (
              <View style={styles.alertBanner}>
                <MaterialIcons name="info" size={16} color={COLORS.primary} />
                <Text style={styles.alertText}>
                  Bạn đang có {approvedCount} xe cần trả sau khi hoàn thành
                  nhiệm vụ
                </Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          !fetchError ? (
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <MaterialIcons
                  name="local-shipping"
                  size={48}
                  color={COLORS.gray}
                />
              </View>
              <Text style={styles.emptyTitle}>
                Không có yêu cầu phương tiện
              </Text>
              <Text style={styles.emptyText}>
                Các yêu cầu phương tiện của đội sẽ xuất hiện ở đây
              </Text>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        contentContainerStyle={[styles.listContent, { paddingBottom }]}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={showReturnModal}
        transparent
        animationType="slide"
        onRequestClose={() => !returningId && setShowReturnModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Báo cáo trả xe</Text>
            <Text style={styles.modalSub}>
              Hoàn tất checklist trước khi bàn giao phương tiện.
            </Text>

            <Text style={styles.fieldLabel}>Checklist</Text>
            <View style={styles.checklistWrap}>
              {RETURN_CHECKLIST_OPTIONS.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.checkItem,
                    checklist.includes(item) && styles.checkItemActive,
                  ]}
                  onPress={() => toggleChecklist(item)}
                >
                  <MaterialIcons
                    name={
                      checklist.includes(item)
                        ? "check-box"
                        : "check-box-outline-blank"
                    }
                    size={18}
                    color={
                      checklist.includes(item) ? COLORS.primary : COLORS.textLight
                    }
                  />
                  <Text style={styles.checkItemText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Mức nhiên liệu (vd: 70%)"
              value={fuelLevel}
              onChangeText={setFuelLevel}
            />
            <TextInput
              style={styles.input}
              placeholder="Báo cáo hư hỏng (nếu có)"
              value={damageReport}
              onChangeText={setDamageReport}
            />
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Ghi chú bàn giao"
              value={returnNotes}
              onChangeText={setReturnNotes}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity style={styles.photoBtn} onPress={pickReturnPhotos}>
              <MaterialIcons name="add-a-photo" size={18} color={COLORS.primary} />
              <Text style={styles.photoBtnText}>Đính kèm ảnh</Text>
              {returnPhotoUris.length > 0 && (
                <Text style={styles.photoCount}>{returnPhotoUris.length} ảnh</Text>
              )}
            </TouchableOpacity>

            {returnPhotoUris.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.photoRow}
              >
                {returnPhotoUris.map((uri, idx) => (
                  <Image key={idx} source={{ uri }} style={styles.photoThumb} />
                ))}
              </ScrollView>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowReturnModal(false)}
                disabled={!!returningId}
              >
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, returningId && { opacity: 0.7 }]}
                onPress={confirmReturn}
                disabled={!!returningId}
              >
                {returningId ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.submitBtnText}>Gửi báo cáo</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.grayLight },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: { fontSize: 14, color: COLORS.textLight },
  listContent: { padding: 16 },

  header: { marginBottom: 16 },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.black,
    marginBottom: 2,
  },
  teamNameText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "600",
    marginBottom: 4,
  },
  subtitle: { fontSize: 14, color: COLORS.textLight, marginBottom: 16 },

  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFEBEE",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#EF9A9A",
    marginBottom: 12,
  },
  errorText: { fontSize: 13, color: "#B71C1C", flex: 1, lineHeight: 18 },

  statsRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  statNum: { fontSize: 28, fontWeight: "800" },
  statLabel: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },

  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.primary + "10",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.primary + "30",
  },
  alertText: { fontSize: 13, color: COLORS.primary, flex: 1, lineHeight: 18 },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  typeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: COLORS.black },
  cardSub: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: { fontSize: 11, fontWeight: "600" },

  reasonRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginBottom: 10,
  },
  reasonText: {
    fontSize: 13,
    color: COLORS.textLight,
    flex: 1,
    lineHeight: 18,
  },

  vehicleList: {
    backgroundColor: COLORS.grayLight,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  vehicleListTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textLight,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  vehicleItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  vehicleItemText: { fontSize: 13, color: COLORS.text, flex: 1 },
  vehicleStatusDot: { width: 8, height: 8, borderRadius: 4 },

  timeText: { fontSize: 11, color: COLORS.textLight, marginBottom: 10 },

  returnBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 4,
  },
  returnBtnText: { color: COLORS.white, fontWeight: "700", fontSize: 15 },

  returnedBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#E8F5E9",
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#388E3C30",
  },
  returnedText: { fontSize: 13, color: "#388E3C", fontWeight: "600" },
  pendingReturnBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#EEF2FF",
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#6366F140",
  },
  pendingReturnText: { fontSize: 13, color: "#4F46E5", fontWeight: "600" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 16,
  },
  modalBox: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    maxHeight: "88%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.black,
    marginBottom: 4,
  },
  modalSub: { fontSize: 13, color: COLORS.textLight, marginBottom: 12 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textLight,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  checklistWrap: { marginBottom: 12, gap: 8 },
  checkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
    borderRadius: 10,
    backgroundColor: COLORS.grayLight,
  },
  checkItemActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "12",
  },
  checkItemText: { fontSize: 13, color: COLORS.text, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 10,
  },
  textarea: { minHeight: 72, textAlignVertical: "top" },
  photoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 10,
  },
  photoBtnText: { fontSize: 14, color: COLORS.primary, fontWeight: "700" },
  photoCount: { fontSize: 12, color: COLORS.textLight },
  photoRow: { marginTop: 10, marginBottom: 12 },
  photoThumb: { width: 64, height: 64, borderRadius: 8, marginRight: 8 },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: COLORS.grayLight,
  },
  cancelBtnText: { fontSize: 14, color: COLORS.text, fontWeight: "600" },
  submitBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
  },
  submitBtnText: { fontSize: 14, color: COLORS.white, fontWeight: "700" },

  empty: { alignItems: "center", paddingVertical: 48 },
  emptyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "hsl(210, 5%, 96%)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.black,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textLight,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 24,
  },
});
