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
  on_mission: {
    label: "Đang cứu hộ",
    color: COLORS.primary,
    bg: COLORS.primary + "1A",
    icon: "local-shipping",
  },
  completed: {
    label: "Hoàn thành",
    color: "#388E3C",
    bg: "#E8F5E9",
    icon: "check-circle",
  },
  pending_verification: {
    label: "Chờ phân công",
    color: "#F57C00",
    bg: "#FFF3E0",
    icon: "pending-actions",
  },
};

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

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      { text: "Đăng xuất", style: "destructive", onPress: logout },
    ]);
  };

  const onMissionCount = missions.filter(
    (m) => m.status === "on_mission",
  ).length;
  const completedCount = missions.filter(
    (m) => m.status === "completed",
  ).length;

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
          {/* Tên đội + quận */}
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

          {/* Đội trưởng */}
          <View style={styles.leaderRow}>
            <MaterialIcons name="person" size={14} color={COLORS.textLight} />
            <Text style={styles.leaderText}>
              Đội trưởng:{" "}
              <Text style={styles.leaderName}>
                {team.leader_account?.username || "—"}
              </Text>
            </Text>
          </View>

          {/* SĐT */}
          <View style={styles.leaderRow}>
            <MaterialIcons name="call" size={14} color={COLORS.textLight} />
            <Text style={styles.leaderText}>{team.phone_number || "—"}</Text>
          </View>

          {/* Trạng thái */}
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

      <Text style={styles.missionCount}>
        {onMissionCount} đang thực hiện
        {completedCount > 0 ? " · " + completedCount + " hoàn thành" : ""}
      </Text>
    </View>
  );

  const paddingBottom = (insets.bottom || 24) + 24;

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <FlatList
        data={missions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MissionCard
            item={item}
            onPress={(m) =>
              navigation.navigate("MissionDetail", { mission: m, team })
            }
          />
        )}
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
  teamInfoMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  teamInfoText: { fontSize: 13, color: COLORS.textLight },
  leaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  leaderText: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  leaderName: {
    fontWeight: "700",
    color: COLORS.text,
  },
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
  missionCount: { fontSize: 13, color: COLORS.textLight, marginBottom: 8 },
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
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoItem: { fontSize: 12, color: COLORS.textLight },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: COLORS.grayLight,
    paddingTop: 8,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
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
