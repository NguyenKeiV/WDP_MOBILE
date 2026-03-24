import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { missionsApi } from "../../api/missions";
import { useAuth } from "../../context/AuthContext";
import { COLORS, CATEGORIES } from "../../constants";

const PRIORITY_CONFIG = {
  urgent: { label: "🔴 Khẩn cấp", color: "#E53935" },
  high: { label: "🟠 Cao", color: "#F57C00" },
  medium: { label: "🟡 Trung bình", color: "#F9A825" },
  low: { label: "🟢 Thấp", color: "#388E3C" },
};

const STATUS_MISSION_CONFIG = {
  assigned: {
    label: "Chờ xác nhận",
    color: "#F57C00",
    bg: "#FFF3E0",
    icon: "pending-actions",
  },
  on_mission: {
    label: "Đang cứu hộ",
    color: COLORS.primary,
    bg: COLORS.primary + "1A",
    icon: "local-shipping",
  },
  verified: {
    label: "Chờ điều phối xác nhận",
    color: "#4F46E5",
    bg: "#EEF2FF",
    icon: "pending-actions",
  },
  completed: {
    label: "Hoàn thành",
    color: "#388E3C",
    bg: "#E8F5E9",
    icon: "check-circle",
  },
};

// Card cho nhiệm vụ đang chờ xác nhận
const PendingMissionCard = ({ item, onAccept, onReject, loading }) => {
  const category = CATEGORIES.find((c) => c.value === item.category);
  const priority = PRIORITY_CONFIG[item.priority];

  return (
    <View style={[styles.card, styles.pendingCard]}>
      {/* Banner nổi bật */}
      <View style={styles.pendingBanner}>
        <MaterialIcons
          name="notification-important"
          size={16}
          color="#F57C00"
        />
        <Text style={styles.pendingBannerText}>
          Nhiệm vụ mới — cần xác nhận
        </Text>
      </View>

      <View style={styles.cardTop}>
        <Text style={styles.cardCategory}>
          {category?.label || item.category}
        </Text>
        {priority && (
          <View style={[styles.priorityBadge, { borderColor: priority.color }]}>
            <Text style={[styles.priorityText, { color: priority.color }]}>
              {priority.label}
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.cardDesc} numberOfLines={3}>
        {item.description}
      </Text>

      <View style={styles.cardInfo}>
        <View style={styles.infoRow}>
          <MaterialIcons
            name="location-on"
            size={14}
            color={COLORS.textLight}
          />
          <Text style={styles.infoItem}>{item.district}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialIcons name="groups" size={14} color={COLORS.textLight} />
          <Text style={styles.infoItem}>{item.num_people} người</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialIcons name="call" size={14} color={COLORS.textLight} />
          <Text style={styles.infoItem}>{item.phone_number}</Text>
        </View>
      </View>

      {/* 2 nút: Nhận & Từ chối */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.rejectBtn, loading && { opacity: 0.6 }]}
          onPress={() => onReject(item)}
          disabled={loading}
          activeOpacity={0.85}
        >
          <MaterialIcons name="close" size={18} color="#E53935" />
          <Text style={styles.rejectBtnText}>Từ chối</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.acceptBtn, loading && { opacity: 0.6 }]}
          onPress={() => onAccept(item)}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <MaterialIcons name="check" size={18} color={COLORS.white} />
              <Text style={styles.acceptBtnText}>Nhận nhiệm vụ</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Card cho nhiệm vụ đang thực hiện / hoàn thành
const MissionCard = ({ item, onPress }) => {
  const category = CATEGORIES.find((c) => c.value === item.category);
  const priority = PRIORITY_CONFIG[item.priority];
  const missionStatus =
    STATUS_MISSION_CONFIG[item.status] || STATUS_MISSION_CONFIG.on_mission;

  return (
    <TouchableOpacity
      style={[styles.card, item.status === "completed" && { opacity: 0.7 }]}
      onPress={() => onPress(item)}
      activeOpacity={0.85}
    >
      <View style={styles.cardTop}>
        <Text style={styles.cardCategory}>
          {category?.label || item.category}
        </Text>
        {priority && (
          <View style={[styles.priorityBadge, { borderColor: priority.color }]}>
            <Text style={[styles.priorityText, { color: priority.color }]}>
              {priority.label}
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.cardDesc} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.cardInfo}>
        <View style={styles.infoRow}>
          <MaterialIcons
            name="location-on"
            size={14}
            color={COLORS.textLight}
          />
          <Text style={styles.infoItem}>{item.district}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialIcons name="groups" size={14} color={COLORS.textLight} />
          <Text style={styles.infoItem}>{item.num_people} người</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialIcons name="call" size={14} color={COLORS.textLight} />
          <Text style={styles.infoItem}>{item.phone_number}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.footerRow}>
          <MaterialIcons name="schedule" size={14} color={COLORS.textLight} />
          <Text style={styles.footerDate}>
            {new Date(item.assigned_at || item.created_at).toLocaleString(
              "vi-VN",
            )}
          </Text>
        </View>
        <View
          style={[styles.statusBadge, { backgroundColor: missionStatus.bg }]}
        >
          <MaterialIcons
            name={missionStatus.icon}
            size={12}
            color={missionStatus.color}
          />
          <Text
            style={[styles.statusBadgeText, { color: missionStatus.color }]}
          >
            {missionStatus.label}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function MissionsScreen({ navigation }) {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [team, setTeam] = useState(null);
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // id đang xử lý

  // Modal từ chối
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectingMission, setRejectingMission] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);

  const fetchMissions = useCallback(async () => {
    try {
      const res = await missionsApi.getMyTeamMissions();
      setTeam(res.data.team);
      setMissions(res.data.missions || []);
    } catch (e) {
      Alert.alert("Lỗi", e.message);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchMissions();
      setLoading(false);
    };
    init();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMissions();
    setRefreshing(false);
  };

  // Nhận nhiệm vụ
  const handleAccept = async (mission) => {
    Alert.alert(
      "Xác nhận nhận nhiệm vụ",
      `Đội sẽ nhận nhiệm vụ tại ${mission.district}. Bạn chắc chắn?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Nhận nhiệm vụ",
          onPress: async () => {
            setActionLoading(mission.id);
            try {
              await missionsApi.acceptMission(mission.id);
              Alert.alert(
                "✅ Thành công",
                "Đã nhận nhiệm vụ. Chúc đội hoàn thành tốt!",
              );
              fetchMissions();
            } catch (e) {
              Alert.alert("Lỗi", e.message);
            } finally {
              setActionLoading(null);
            }
          },
        },
      ],
    );
  };

  // Mở modal từ chối
  const handleRejectPress = (mission) => {
    setRejectingMission(mission);
    setRejectReason("");
    setRejectModal(true);
  };

  // Xác nhận từ chối
  const handleRejectConfirm = async () => {
    if (!rejectReason.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập lý do từ chối");
      return;
    }
    setRejectLoading(true);
    try {
      await missionsApi.rejectMission(rejectingMission.id, rejectReason.trim());
      setRejectModal(false);
      setRejectingMission(null);
      setRejectReason("");
      Alert.alert("Đã từ chối", "Yêu cầu đã được trả lại cho điều phối viên.");
      fetchMissions();
    } catch (e) {
      Alert.alert("Lỗi", e.message);
    } finally {
      setRejectLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      { text: "Đăng xuất", style: "destructive", onPress: logout },
    ]);
  };

  // Phân loại missions
  const pendingMissions = missions.filter((m) => m.status === "assigned");
  const activeMissions = missions.filter(
    (m) => m.status === "on_mission" || m.status === "verified",
  );
  const completedMissions = missions.filter((m) => m.status === "completed");

  const paddingBottom = (insets.bottom || 24) + 24;

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View>
          <Text style={styles.title}>Nhiệm vụ của đội</Text>
          {team && <Text style={styles.teamName}>{team.name}</Text>}
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <MaterialIcons name="exit-to-app" size={18} color={COLORS.primary} />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>

      {team && (
        <View style={styles.teamCard}>
          <View style={styles.teamInfoRow}>
            <View style={styles.teamIconWrap}>
              <MaterialIcons name="groups" size={18} color={COLORS.primary} />
            </View>
            <View style={styles.teamInfoBody}>
              <Text style={styles.teamLeader}>{team.name}</Text>
              <View style={styles.teamInfoMeta}>
                <MaterialIcons
                  name="location-on"
                  size={12}
                  color={COLORS.textLight}
                />
                <Text style={styles.teamInfoText}>{team.district || "—"}</Text>
              </View>
            </View>
          </View>
          <View style={styles.leaderRow}>
            <MaterialIcons name="person" size={14} color={COLORS.textLight} />
            <Text style={styles.leaderText}>
              Đội trưởng:{" "}
              <Text style={styles.leaderName}>
                {team.leader_account?.username || "—"}
              </Text>
            </Text>
          </View>
          <View style={styles.leaderRow}>
            <MaterialIcons name="call" size={14} color={COLORS.textLight} />
            <Text style={styles.leaderText}>{team.phone_number || "—"}</Text>
          </View>
          <View
            style={[
              styles.teamStatus,
              {
                backgroundColor:
                  team.status === "on_mission" ? "#FFEBEE" : "#E8F5E9",
              },
            ]}
          >
            <MaterialIcons
              name={
                team.status === "on_mission" ? "local-shipping" : "check-circle"
              }
              size={14}
              color={team.status === "on_mission" ? "#E53935" : "#388E3C"}
            />
            <Text
              style={[
                styles.teamStatusText,
                { color: team.status === "on_mission" ? "#E53935" : "#388E3C" },
              ]}
            >
              {team.status === "on_mission" ? "Đang nhiệm vụ" : "Sẵn sàng"}
            </Text>
          </View>
        </View>
      )}

      {/* Thống kê nhanh */}
      <View style={styles.statsRow}>
        {pendingMissions.length > 0 && (
          <View
            style={[
              styles.statBadge,
              { backgroundColor: "#FFF3E0", borderColor: "#F57C00" },
            ]}
          >
            <Text style={[styles.statNum, { color: "#F57C00" }]}>
              {pendingMissions.length}
            </Text>
            <Text style={[styles.statLabel, { color: "#F57C00" }]}>
              Chờ xác nhận
            </Text>
          </View>
        )}
        {activeMissions.length > 0 && (
          <View
            style={[
              styles.statBadge,
              {
                backgroundColor: COLORS.primary + "15",
                borderColor: COLORS.primary,
              },
            ]}
          >
            <Text style={[styles.statNum, { color: COLORS.primary }]}>
              {activeMissions.length}
            </Text>
            <Text style={[styles.statLabel, { color: COLORS.primary }]}>
              Đang thực hiện
            </Text>
          </View>
        )}
        {completedMissions.length > 0 && (
          <View
            style={[
              styles.statBadge,
              { backgroundColor: "#E8F5E9", borderColor: "#388E3C" },
            ]}
          >
            <Text style={[styles.statNum, { color: "#388E3C" }]}>
              {completedMissions.length}
            </Text>
            <Text style={[styles.statLabel, { color: "#388E3C" }]}>
              Hoàn thành
            </Text>
          </View>
        )}
      </View>

      {/* Section label */}
      {pendingMissions.length > 0 && (
        <Text style={styles.sectionLabel}>
          ⏳ Chờ xác nhận ({pendingMissions.length})
        </Text>
      )}
    </View>
  );

  // Render từng item theo loại
  const renderItem = ({ item }) => {
    if (item.status === "assigned") {
      return (
        <PendingMissionCard
          item={item}
          onAccept={handleAccept}
          onReject={handleRejectPress}
          loading={actionLoading === item.id}
        />
      );
    }
    return (
      <MissionCard
        item={item}
        onPress={(m) =>
          navigation.navigate("MissionDetail", { mission: m, team })
        }
      />
    );
  };

  // Separator giữa pending và active
  const renderSeparator = ({ leadingItem }) => {
    const idx = missions.indexOf(leadingItem);
    const nextItem = missions[idx + 1];
    if (leadingItem?.status === "assigned" && nextItem?.status !== "assigned") {
      return (
        <Text style={styles.sectionLabel}>🚨 Đang thực hiện / Hoàn thành</Text>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // Sắp xếp: assigned trước, on_mission, completed sau
  const sortedMissions = [
    ...pendingMissions,
    ...activeMissions,
    ...completedMissions,
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <FlatList
        data={sortedMissions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={renderSeparator}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <MaterialIcons name="assignment" size={48} color={COLORS.gray} />
            </View>
            <Text style={styles.emptyTitle}>Không có nhiệm vụ nào</Text>
            <Text style={styles.emptyText}>
              Đội của bạn hiện không có nhiệm vụ nào
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

      {/* Modal nhập lý do từ chối */}
      <Modal
        visible={rejectModal}
        transparent
        animationType="slide"
        onRequestClose={() => !rejectLoading && setRejectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Lý do từ chối</Text>
            <Text style={styles.modalSub}>
              Yêu cầu tại {rejectingMission?.district} sẽ được trả lại cho điều
              phối viên.
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nhập lý do từ chối (bắt buộc)..."
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setRejectModal(false)}
                disabled={rejectLoading}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalConfirmBtn,
                  rejectLoading && { opacity: 0.6 },
                ]}
                onPress={handleRejectConfirm}
                disabled={rejectLoading}
              >
                {rejectLoading ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.modalConfirmText}>Xác nhận từ chối</Text>
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
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { padding: 16, paddingBottom: 32 },
  header: { paddingTop: 24, marginBottom: 8 },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  title: { fontSize: 22, fontWeight: "800", color: COLORS.black },
  teamName: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "600",
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primary + "1A",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  logoutText: { fontSize: 12, color: COLORS.primary, fontWeight: "700" },

  teamCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.grayLight,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  teamInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  teamIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  teamInfoBody: { flex: 1 },
  teamLeader: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 2,
  },
  teamInfoMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  teamInfoText: { fontSize: 13, color: COLORS.textLight },
  leaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  leaderText: { fontSize: 13, color: COLORS.textLight },
  leaderName: { fontWeight: "700", color: COLORS.text },
  teamStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 4,
  },
  teamStatusText: { fontSize: 12, fontWeight: "700" },

  statsRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  statBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    minWidth: 80,
  },
  statNum: { fontSize: 20, fontWeight: "800" },
  statLabel: { fontSize: 11, fontWeight: "600" },

  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textLight,
    marginBottom: 8,
    marginTop: 4,
  },

  // Pending card
  pendingCard: { borderWidth: 2, borderColor: "#F57C00" },
  pendingBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFF3E0",
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  pendingBannerText: { fontSize: 12, fontWeight: "700", color: "#E65100" },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 6 },
  rejectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#E53935",
  },
  rejectBtnText: { color: "#E53935", fontWeight: "700", fontSize: 14 },
  acceptBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#388E3C",
  },
  acceptBtnText: { color: COLORS.white, fontWeight: "700", fontSize: 14 },

  // Normal card
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  cardCategory: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.black,
    flex: 1,
  },
  priorityBadge: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  priorityText: { fontSize: 11, fontWeight: "600" },
  cardDesc: {
    fontSize: 13,
    color: COLORS.textLight,
    lineHeight: 18,
    marginBottom: 10,
  },
  cardInfo: { gap: 6, marginBottom: 10 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  infoItem: { fontSize: 12, color: COLORS.textLight },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: COLORS.grayLight,
    paddingTop: 8,
  },
  footerRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  footerDate: { fontSize: 11, color: COLORS.textLight },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: { fontSize: 11, fontWeight: "600" },

  // Empty
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

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalBox: { backgroundColor: COLORS.white, borderRadius: 16, padding: 20 },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.black,
    marginBottom: 4,
  },
  modalSub: { fontSize: 13, color: COLORS.textLight, marginBottom: 14 },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    marginBottom: 16,
  },
  modalActions: { flexDirection: "row", gap: 10 },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: COLORS.grayLight,
    alignItems: "center",
  },
  modalCancelText: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#E53935",
    alignItems: "center",
  },
  modalConfirmText: { fontSize: 14, fontWeight: "700", color: COLORS.white },
});
