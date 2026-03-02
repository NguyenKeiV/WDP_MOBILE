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
import { missionsApi } from "../../api/missions";
import { useAuth } from "../../context/AuthContext";
import { COLORS, CATEGORIES } from "../../constants";

const PRIORITY_CONFIG = {
  urgent: { label: "🔴 Khẩn cấp", color: "#E53935" },
  high: { label: "🟠 Cao", color: "#F57C00" },
  medium: { label: "🟡 Trung bình", color: "#F9A825" },
  low: { label: "🟢 Thấp", color: "#388E3C" },
};

const MissionCard = ({ item, onPress }) => {
  const category = CATEGORIES.find((c) => c.value === item.category);
  const priority = PRIORITY_CONFIG[item.priority];

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(item)}
      activeOpacity={0.85}
    >
      <View style={styles.cardTop}>
        <Text style={styles.cardCategory}>
          {category?.label || item.category}
        </Text>
        <View style={[styles.priorityBadge, { borderColor: priority?.color }]}>
          <Text style={[styles.priorityText, { color: priority?.color }]}>
            {priority?.label}
          </Text>
        </View>
      </View>

      <Text style={styles.cardDesc} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.cardInfo}>
        <Text style={styles.infoItem}>📍 {item.province_city}</Text>
        <Text style={styles.infoItem}>👥 {item.num_people} người</Text>
        <Text style={styles.infoItem}>📞 {item.phone_number}</Text>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.footerDate}>
          🕐{" "}
          {new Date(item.assigned_at || item.created_at).toLocaleString(
            "vi-VN",
          )}
        </Text>
        <View style={styles.onMissionBadge}>
          <Text style={styles.onMissionText}>🚨 Đang cứu hộ</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function MissionsScreen({ navigation }) {
  const { user, logout } = useAuth();
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

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View>
          <Text style={styles.title}>🚒 Nhiệm vụ của đội</Text>
          {team && <Text style={styles.teamName}>{team.name}</Text>}
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>
      {team && (
        <View style={styles.teamInfo}>
          <Text style={styles.teamInfoText}>👨‍✈️ {team.leader_name}</Text>
          <Text style={styles.teamInfoText}>📍 {team.province_city}</Text>
          <View
            style={[
              styles.teamStatus,
              {
                backgroundColor:
                  team.status === "on_mission" ? "#FFEBEE" : "#E8F5E9",
              },
            ]}
          >
            <Text
              style={[
                styles.teamStatusText,
                { color: team.status === "on_mission" ? "#E53935" : "#388E3C" },
              ]}
            >
              {team.status === "on_mission"
                ? "🚨 Đang nhiệm vụ"
                : "✅ Sẵn sàng"}
            </Text>
          </View>
        </View>
      )}
      <Text style={styles.missionCount}>
        {missions.length} nhiệm vụ đang thực hiện
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.emptyTitle}>Không có nhiệm vụ nào</Text>
            <Text style={styles.emptyText}>
              Đội của bạn hiện không có nhiệm vụ đang thực hiện
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
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.grayLight },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { padding: 16, paddingBottom: 32 },
  header: { paddingTop: 36, marginBottom: 8 },
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
    backgroundColor: COLORS.grayLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  logoutText: { fontSize: 12, color: COLORS.danger, fontWeight: "600" },
  teamInfo: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 6,
  },
  teamInfoText: { fontSize: 13, color: COLORS.text },
  teamStatus: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
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
  cardInfo: { gap: 4, marginBottom: 10 },
  infoItem: { fontSize: 12, color: COLORS.gray },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: COLORS.grayLight,
    paddingTop: 8,
  },
  footerDate: { fontSize: 11, color: COLORS.gray },
  onMissionBadge: {
    backgroundColor: "#FFEBEE",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  onMissionText: { fontSize: 11, color: COLORS.primary, fontWeight: "600" },
  empty: { alignItems: "center", paddingVertical: 48 },
  emptyIcon: { fontSize: 56, marginBottom: 12 },
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
