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
import { useAuth } from "../../context/AuthContext";
import { requestsApi } from "../../api/requests";
import { COLORS, STATUS_CONFIG, CATEGORIES } from "../../constants";

const StatusFilter = ({ selected, onSelect }) => {
  const options = [
    { value: "", label: "Tất cả" },
    { value: "new", label: "🆕 Mới" },
    { value: "pending_verification", label: "⏳ Đang xét" },
    { value: "on_mission", label: "🚨 Đang cứu" },
    { value: "completed", label: "✔️ Hoàn thành" },
    { value: "rejected", label: "❌ Từ chối" },
  ];
  return (
    <View style={styles.filterRow}>
      {options.map((o) => (
        <TouchableOpacity
          key={o.value}
          style={[styles.chip, selected === o.value && styles.chipActive]}
          onPress={() => onSelect(o.value)}
        >
          <Text
            style={[
              styles.chipText,
              selected === o.value && styles.chipTextActive,
            ]}
          >
            {o.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const MyRequestCard = ({ item, onPress }) => {
  const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.new;
  const category = CATEGORIES.find((c) => c.value === item.category);

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
        <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusPillText, { color: status.color }]}>
            {status.icon} {status.label}
          </Text>
        </View>
      </View>

      <Text style={styles.cardDesc} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.progressContainer}>
        {["new", "pending_verification", "on_mission", "completed"].map(
          (s, i) => {
            const steps = [
              "new",
              "pending_verification",
              "on_mission",
              "completed",
            ];
            const currentIndex = steps.indexOf(item.status);
            const isRejected = item.status === "rejected";
            const isFilled = isRejected ? false : i <= currentIndex;
            return (
              <View
                key={s}
                style={{ flex: 1, flexDirection: "row", alignItems: "center" }}
              >
                <View
                  style={[
                    styles.progressDot,
                    isFilled && styles.progressDotFilled,
                    isRejected && i === 0 && styles.progressDotRejected,
                  ]}
                />
                {i < 3 && (
                  <View
                    style={[
                      styles.progressLine,
                      isFilled && i < currentIndex && styles.progressLineFilled,
                    ]}
                  />
                )}
              </View>
            );
          },
        )}
      </View>
      <View style={styles.progressLabels}>
        {["Mới", "Đang xét", "Cứu hộ", "Hoàn thành"].map((l) => (
          <Text key={l} style={styles.progressLabel}>
            {l}
          </Text>
        ))}
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.footerMeta}>📍 {item.province_city}</Text>
        <Text style={styles.footerMeta}>📞 {item.phone_number}</Text>
        <Text style={styles.footerDate}>
          {new Date(item.created_at).toLocaleDateString("vi-VN")}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default function MyRequestsScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");

  const fetchMyRequests = useCallback(
    async (status = statusFilter) => {
      try {
        const params = { limit: 50 };
        if (status) params.status = status;
        const res = await requestsApi.getMyRequests(user.id, params);
        setRequests(res.data || []);
      } catch (e) {
        console.error(e);
      }
    },
    [user.id, statusFilter],
  );

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchMyRequests(statusFilter);
      setLoading(false);
    };
    init();
  }, [statusFilter]);

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      { text: "Đăng xuất", style: "destructive", onPress: logout },
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyRequests(statusFilter);
    setRefreshing(false);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View>
          <Text style={styles.title}>📋 Yêu cầu của tôi</Text>
          <Text style={styles.subtitle}>{requests.length} yêu cầu</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>
      <StatusFilter selected={statusFilter} onSelect={setStatusFilter} />
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
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MyRequestCard
            item={item}
            onPress={(r) => navigation.navigate("RequestDetail", { id: r.id })}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>Chưa có yêu cầu nào</Text>
            <Text style={styles.emptyText}>
              Bạn chưa tạo yêu cầu cứu hộ nào. Hãy tạo yêu cầu khi cần hỗ trợ.
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
  title: { fontSize: 22, fontWeight: "800", color: COLORS.black },
  subtitle: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 2,
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.grayBorder,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 12, color: COLORS.text, fontWeight: "500" },
  chipTextActive: { color: COLORS.white },
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
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 8,
  },
  statusPillText: { fontSize: 11, fontWeight: "600" },
  cardDesc: {
    fontSize: 13,
    color: COLORS.textLight,
    lineHeight: 18,
    marginBottom: 12,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.grayBorder,
    borderWidth: 1.5,
    borderColor: COLORS.grayBorder,
  },
  progressDotFilled: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  progressDotRejected: {
    backgroundColor: COLORS.danger,
    borderColor: COLORS.danger,
  },
  progressLine: { flex: 1, height: 2, backgroundColor: COLORS.grayBorder },
  progressLineFilled: { backgroundColor: COLORS.primary },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  progressLabel: {
    fontSize: 9,
    color: COLORS.textLight,
    flex: 1,
    textAlign: "center",
  },
  cardFooter: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
    borderTopWidth: 1,
    borderTopColor: COLORS.grayLight,
    paddingTop: 8,
  },
  footerMeta: { fontSize: 11, color: COLORS.gray },
  footerDate: { fontSize: 11, color: COLORS.gray, marginLeft: "auto" },
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
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  logoutBtn: {
    backgroundColor: COLORS.grayLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  logoutText: {
    fontSize: 12,
    color: COLORS.danger,
    fontWeight: "600",
  },
});
