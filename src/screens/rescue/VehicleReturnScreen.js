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
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { vehicleRequestsApi } from "../../api/vehicleRequests";
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
  rejected: {
    label: "Bị từ chối",
    color: "#757575",
    bg: "#F5F5F5",
    icon: "cancel",
  },
};

function VehicleRequestCard({ item, onReturn, returning }) {
  const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
  const typeIcon = VEHICLE_TYPE_ICONS[item.vehicle_type] || "commute";
  const typeLabel = VEHICLE_TYPE_LABELS[item.vehicle_type] || item.vehicle_type;

  const assignedVehicles = item.assigned_vehicles || [];

  return (
    <View style={styles.card}>
      {/* Header */}
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

      {/* Lý do */}
      <View style={styles.reasonRow}>
        <MaterialIcons name="info-outline" size={14} color={COLORS.textLight} />
        <Text style={styles.reasonText} numberOfLines={2}>
          {item.reason}
        </Text>
      </View>

      {/* Xe được gán */}
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

      {/* Thời gian */}
      <Text style={styles.timeText}>
        {"Tạo lúc: " + new Date(item.created_at).toLocaleString("vi-VN")}
      </Text>

      {/* Nút trả xe — chỉ hiện khi approved */}
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

      {/* Banner đã trả */}
      {item.status === "returned" && (
        <View style={styles.returnedBanner}>
          <MaterialIcons name="check-circle" size={18} color="#388E3C" />
          <Text style={styles.returnedText}>Xe đã được trả thành công</Text>
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

  const fetchRequests = useCallback(async () => {
    try {
      // Lấy cả approved và returned để team xem lịch sử
      const [approvedRes, returnedRes] = await Promise.allSettled([
        vehicleRequestsApi.getAll({ status: "approved" }),
        vehicleRequestsApi.getAll({ status: "returned" }),
      ]);

      const approved =
        approvedRes.status === "fulfilled" ? approvedRes.value?.data || [] : [];
      const returned =
        returnedRes.status === "fulfilled" ? returnedRes.value?.data || [] : [];

      // Gộp và sắp xếp: approved trước, returned sau
      const all = [...approved, ...returned].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at),
      );

      setRequests(all);
    } catch (e) {
      console.error("fetchRequests error:", e.message);
    }
  }, []);

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

  const handleReturn = (item) => {
    const vehicleNames =
      item.assigned_vehicles?.map((v) => v.name).join(", ") ||
      VEHICLE_TYPE_LABELS[item.vehicle_type];

    Alert.alert(
      "Xác nhận trả xe",
      "Bạn xác nhận đã trả xe về kho?\n\n" + vehicleNames,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xác nhận trả xe",
          style: "default",
          onPress: () => confirmReturn(item.id),
        },
      ],
    );
  };

  const confirmReturn = async (requestId) => {
    setReturningId(requestId);
    try {
      await vehicleRequestsApi.reportReturn(requestId);
      // Cập nhật local state ngay lập tức
      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId ? { ...r, status: "returned" } : r,
        ),
      );
      Alert.alert(
        "✅ Thành công",
        "Đã báo cáo trả xe. Phương tiện đã được cập nhật về trạng thái sẵn sàng.",
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
            <Text style={styles.subtitle}>
              Báo cáo trả xe sau khi hoàn thành nhiệm vụ
            </Text>

            {/* Stats */}
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
            </View>

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
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <MaterialIcons
                name="local-shipping"
                size={48}
                color={COLORS.gray}
              />
            </View>
            <Text style={styles.emptyTitle}>Không có yêu cầu phương tiện</Text>
            <Text style={styles.emptyText}>
              Các yêu cầu phương tiện của đội sẽ xuất hiện ở đây
            </Text>
          </View>
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
    marginBottom: 4,
  },
  subtitle: { fontSize: 14, color: COLORS.textLight, marginBottom: 16 },

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
