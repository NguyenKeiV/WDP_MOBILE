import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { useAuth } from "../../context/AuthContext";
import { requestsApi } from "../../api/requests";
import { COLORS, STATUS_CONFIG, CATEGORIES } from "../../constants";

const CategoryFilter = ({ selected, onSelect }) => {
  const all = [{ value: "", label: "Tất cả" }, ...CATEGORIES];
  return (
    <View style={styles.filterRow}>
      {all.map((c) => {
        const isActive = selected === c.value;
        return (
          <TouchableOpacity
            key={c.value}
            style={[styles.filterChip, isActive && styles.filterChipActive]}
            onPress={() => onSelect(c.value)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterChipText,
                isActive && styles.filterChipTextActive,
              ]}
            >
              {c.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const RequestCard = ({ item, onPress }) => {
  const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.new;
  const category = CATEGORIES.find((c) => c.value === item.category);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(item)}
      activeOpacity={0.85}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusText, { color: status.color }]}>
            {status.icon} {status.label}
          </Text>
        </View>
        {item.priority === "urgent" && (
          <View style={styles.urgentBadge}>
            <Text style={styles.urgentText}>🔴 Khẩn cấp</Text>
          </View>
        )}
      </View>

      <Text style={styles.cardCategory}>
        {category?.label || item.category}
      </Text>
      <Text style={styles.cardDesc} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.cardFooter}>
        <Text style={styles.cardMeta}>📍 {item.province_city}</Text>
        <Text style={styles.cardMeta}>👥 {item.num_people} người</Text>
        <Text style={styles.cardTime}>
          {new Date(item.created_at).toLocaleDateString("vi-VN")}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [category, setCategory] = useState("");
  const [stats, setStats] = useState(null);

  const fetchRequests = useCallback(
    async (pageNum = 1, cat = category, reset = false) => {
      try {
        const params = { page: pageNum, limit: 10 };
        if (cat) params.category = cat;
        const res = await requestsApi.getAll(params);
        const newData = res.data || [];
        setRequests((prev) =>
          reset || pageNum === 1 ? newData : [...prev, ...newData],
        );
        setHasMore(pageNum < (res.pagination?.totalPages || 1));
        setPage(pageNum);
      } catch (e) {
        console.error(e);
      }
    },
    [category],
  );

  const fetchStats = async () => {
    try {
      const res = await requestsApi.getStats();
      setStats(res.data);
    } catch {}
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchRequests(1, category, true), fetchStats()]);
      setLoading(false);
    };
    init();
  }, [category]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRequests(1, category, true);
    setRefreshing(false);
  };

  const onLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await fetchRequests(page + 1);
    setLoadingMore(false);
  };

  const renderHeader = () => (
    <View>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>Xin chào, {user?.username}</Text>
          <Text style={styles.greetingSub}>Hệ thống cứu hộ cộng đồng</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn} activeOpacity={0.8}>
          <MaterialIcons name="exit-to-app" size={18} color={COLORS.primary} />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>

      {stats && (
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: "#E3F2FD" }]}>
            <Text style={styles.statNum}>{stats.total}</Text>
            <Text style={styles.statLabel}>Tổng</Text>
          </View>
          {(stats.by_status || [])
            .filter((s) =>
              ["new", "on_mission", "completed"].includes(s.status),
            )
            .map((s) => {
              const cfg = STATUS_CONFIG[s.status];
              return (
                <View
                  key={s.status}
                  style={[styles.statCard, { backgroundColor: cfg.bg }]}
                >
                  <Text style={[styles.statNum, { color: cfg.color }]}>
                    {s.count}
                  </Text>
                  <Text style={styles.statLabel}>{cfg.label}</Text>
                </View>
              );
            })}
        </View>
      )}

      <Text style={styles.sectionTitle}>Yêu cầu cứu hộ</Text>
      <CategoryFilter selected={category} onSelect={setCategory} />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ marginTop: 12, color: COLORS.textLight }}>
            Đang tải...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const paddingTop = Math.max(insets.top, 16);
  const paddingBottom = (insets.bottom || 24) + 24;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RequestCard
            item={item}
            onPress={(r) => navigation.navigate("RequestDetail", { id: r.id })}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconCircle}>
              <MaterialIcons
                name="menu-book"
                size={48}
                color={COLORS.textLight}
              />
            </View>
            <Text style={styles.emptyText}>Không có yêu cầu nào</Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator color={COLORS.primary} style={{ padding: 16 }} />
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.3}
        contentContainerStyle={[styles.listContent, { paddingTop, paddingBottom }]}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.grayLight },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: {
    paddingHorizontal: 16,
    maxWidth: 448,
    alignSelf: "center",
    width: "100%",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  greeting: { fontSize: 18, fontWeight: "700", color: COLORS.black },
  greetingSub: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  logoutText: { color: COLORS.primary, fontSize: 13, fontWeight: "700" },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  statCard: { flex: 1, borderRadius: 12, padding: 10, alignItems: "center" },
  statNum: { fontSize: 20, fontWeight: "800", color: COLORS.primary },
  statLabel: {
    fontSize: 10,
    color: COLORS.textLight,
    marginTop: 2,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.black,
    marginBottom: 10,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.grayBorder,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: { fontSize: 12, color: COLORS.text, fontWeight: "500" },
  filterChipTextActive: { color: COLORS.white },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: "600" },
  urgentBadge: {
    backgroundColor: "#FFEBEE",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  urgentText: { fontSize: 11, fontWeight: "600", color: COLORS.danger },
  cardCategory: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.black,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: COLORS.textLight,
    lineHeight: 18,
    marginBottom: 8,
  },
  cardFooter: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  cardMeta: { fontSize: 11, color: COLORS.gray },
  cardTime: { fontSize: 11, color: COLORS.gray, marginLeft: "auto" },
  empty: { alignItems: "center", paddingVertical: 40 },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "hsl(210, 5%, 96%)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyText: { fontSize: 15, color: COLORS.textLight },
});
