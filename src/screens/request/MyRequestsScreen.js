import React, { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { useAuth } from "../../context/AuthContext";
import { requestsApi } from "../../api/requests";
import { getDeviceLinkedRequestIds } from "../../utils/deviceGuestRequests";
import { STATUS_CONFIG, CATEGORIES } from "../../constants";

const C = {
  primary: "#007fff",
  background: "#ffffff",
  text: "#0f172a",
  textMuted: "hsl(210, 5%, 50%)",
  mutedGray: "hsl(210, 5%, 85%)",
  cardBorder: "hsl(210, 5%, 92%)",
  white: "#ffffff",
};

const STATUS_ICONS = {
  new: "schedule",
  pending_verification: "pending-actions",
  on_mission: "local-shipping",
  completed: "check-circle",
  rejected: "cancel",
};

const StatusFilter = ({ selected, onSelect }) => {
  const options = [
    { value: "", label: "Tất cả", icon: "grid-view" },
    { value: "new", label: "Mới", icon: "fiber-new" },
    { value: "pending_verification", label: "Đang xét", icon: "pageview" },
    { value: "on_mission", label: "Đang cứu", icon: "emergency" },
    { value: "completed", label: "Xong", icon: "check-circle" },
    { value: "rejected", label: "Từ chối", icon: "cancel" },
  ];
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterScroll}
      style={styles.filterContainer}
    >
      {options.map((o) => {
        const isActive = selected === o.value;
        return (
          <TouchableOpacity
            key={o.value}
            style={[styles.filterItem, isActive && styles.filterItemActive]}
            onPress={() => onSelect(o.value)}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.filterIconCircle,
                isActive ? styles.filterIconCircleActive : styles.filterIconCircleInactive,
              ]}
            >
              <MaterialIcons
                name={o.icon}
                size={20}
                color={isActive ? C.white : C.textMuted}
              />
            </View>
            <Text
              style={[
                styles.filterLabel,
                isActive && styles.filterLabelActive,
              ]}
              numberOfLines={1}
            >
              {o.label}
            </Text>
            <View
              style={[
                styles.filterUnderline,
                isActive && styles.filterUnderlineActive,
              ]}
            />
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const MyRequestCard = ({ item, onPress }) => {
  const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.new;
  const category = CATEGORIES.find((c) => c.value === item.category);
  const iconName = STATUS_ICONS[item.status] || "schedule";

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
          <MaterialIcons name={iconName} size={12} color={status.color} />
          <Text style={[styles.statusPillText, { color: status.color }]}>
            {status.label}
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
        <View style={styles.footerRow}>
          <MaterialIcons name="location-on" size={14} color={C.textMuted} />
          <Text style={styles.footerMeta}>{item.district}</Text>
        </View>
        {item.phone_number ? (
          <View style={styles.footerRow}>
            <MaterialIcons name="call" size={14} color={C.textMuted} />
            <Text style={styles.footerMeta}>{item.phone_number}</Text>
          </View>
        ) : null}
        <Text style={styles.footerDate}>
          {new Date(item.created_at).toLocaleDateString("vi-VN")}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default function MyRequestsScreen({ navigation }) {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
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
        let list = Array.isArray(res.data) ? res.data : [];

        const deviceIds = await getDeviceLinkedRequestIds(user.id);
        const seen = new Set(list.map((r) => r.id));
        const toFetch = deviceIds.filter((id) => id && !seen.has(id));

        if (toFetch.length > 0) {
          const settled = await Promise.allSettled(
            toFetch.map((id) =>
              requestsApi.getById(id).then((r) => r?.data ?? null),
            ),
          );
          for (const s of settled) {
            if (s.status !== "fulfilled" || !s.value) continue;
            const item = s.value;
            if (!item?.id || seen.has(item.id)) continue;
            seen.add(item.id);
            list.push(item);
          }
        }

        if (status) {
          list = list.filter((r) => r.status === status);
        }

        list.sort(
          (a, b) =>
            new Date(b.created_at || 0) - new Date(a.created_at || 0),
        );
        setRequests(list);
      } catch (e) {
        console.error(e);
      }
    },
    [user.id, statusFilter],
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        setLoading(true);
        await fetchMyRequests(statusFilter);
        if (active) setLoading(false);
      })();
      return () => {
        active = false;
      };
    }, [fetchMyRequests, statusFilter]),
  );

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn chắc chắn muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      { text: "Đăng xuất", style: "destructive", onPress: logout },
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyRequests(statusFilter);
    setRefreshing(false);
  };

  const goToCreateRequest = () => {
    navigation.navigate("CreateRequest");
  };

  const paddingTop = Math.max(insets.top, 12);
  const paddingBottom = (insets.bottom || 24) + 80;

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={[styles.centered, { paddingTop }]}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyCircle}>
        <View style={styles.emptyIconWrap}>
          <MaterialIcons
            name="menu-book"
            size={56}
            color={C.mutedGray}
          />
          <View style={styles.emptyIconBadge}>
            <MaterialIcons name="info" size={24} color={C.primary} />
          </View>
        </View>
      </View>
      <Text style={styles.emptyTitle}>Chưa có yêu cầu nào</Text>
      <Text style={styles.emptyText}>
        Các yêu cầu cứu hộ hoặc cứu trợ bạn đã gửi sẽ hiển thị tại đây để bạn
        dễ dàng theo dõi.
      </Text>
      <TouchableOpacity
        style={styles.createBtn}
        onPress={goToCreateRequest}
        activeOpacity={0.95}
      >
        <MaterialIcons name="add-circle" size={22} color={C.white} />
        <Text style={styles.createBtnText}>Tạo yêu cầu cứu hộ mới</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop, paddingBottom },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>Yêu cầu của tôi</Text>
              <Text style={styles.subtitle}>
                Quản lý các yêu cầu trợ giúp và cứu nạn
              </Text>
            </View>
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <MaterialIcons name="logout" size={18} color={C.textMuted} />
              <Text style={styles.logoutText}>Thoát</Text>
            </TouchableOpacity>
          </View>
          <StatusFilter selected={statusFilter} onSelect={setStatusFilter} />
        </View>

        {requests.length > 0 && (
          <TouchableOpacity
            style={styles.createBtnTop}
            onPress={goToCreateRequest}
            activeOpacity={0.95}
          >
            <MaterialIcons name="add-circle" size={22} color={C.white} />
            <Text style={styles.createBtnText}>Tạo yêu cầu cứu hộ mới</Text>
          </TouchableOpacity>
        )}

        {requests.length === 0 ? (
          renderEmptyState()
        ) : (
          <View style={styles.listSection}>
            <Text style={styles.listSubtitle}>
              {requests.length} yêu cầu
            </Text>
            {requests.map((item) => (
              <MyRequestCard
                key={item.id}
                item={item}
                onPress={(r) =>
                  navigation.navigate("RequestDetail", { id: r.id })
                }
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingHorizontal: 16,
    maxWidth: 448,
    alignSelf: "center",
    width: "100%",
    flexGrow: 1,
  },
  header: { marginBottom: 24 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: C.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: C.textMuted,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "hsl(210, 5%, 96%)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  logoutText: {
    fontSize: 12,
    fontWeight: "700",
    color: C.textMuted,
  },
  filterContainer: { marginHorizontal: -16 },
  filterScroll: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 16,
    paddingBottom: 4,
  },
  filterItem: {
    width: 60,
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 4,
    paddingBottom: 6,
  },
  filterItemActive: {},
  filterIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  filterIconCircleInactive: {
    backgroundColor: "hsl(210, 5%, 96%)",
  },
  filterIconCircleActive: {
    backgroundColor: C.primary,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: C.textMuted,
  },
  filterLabelActive: {
    color: C.primary,
  },
  filterUnderline: {
    marginTop: 2,
    width: 16,
    height: 3,
    borderRadius: 999,
    backgroundColor: "transparent",
  },
  filterUnderlineActive: {
    backgroundColor: C.primary,
  },
  createBtnTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    paddingVertical: 16,
    backgroundColor: C.primary,
    borderRadius: 10,
    marginBottom: 24,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  createBtnText: {
    color: C.white,
    fontSize: 16,
    fontWeight: "700",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyCircle: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: "hsl(210, 5%, 96%)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  emptyIconWrap: { position: "relative" },
  emptyIconBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: C.white,
    padding: 4,
    borderRadius: 999,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: C.text,
    marginBottom: 12,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 16,
    color: C.textMuted,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
    maxWidth: 280,
  },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    maxWidth: 320,
    paddingVertical: 16,
    backgroundColor: C.primary,
    borderRadius: 10,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  listSection: { marginBottom: 24 },
  listSubtitle: {
    fontSize: 13,
    color: C.textMuted,
    marginBottom: 16,
  },
  card: {
    backgroundColor: C.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.cardBorder,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  cardCategory: {
    fontSize: 15,
    fontWeight: "700",
    color: C.text,
    flex: 1,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  statusPillText: { fontSize: 12, fontWeight: "600" },
  cardDesc: {
    fontSize: 14,
    color: C.textMuted,
    lineHeight: 20,
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
    backgroundColor: C.mutedGray,
    borderWidth: 1.5,
    borderColor: C.mutedGray,
  },
  progressDotFilled: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  progressDotRejected: {
    backgroundColor: "#ef4444",
    borderColor: "#ef4444",
  },
  progressLine: { flex: 1, height: 2, backgroundColor: C.mutedGray },
  progressLineFilled: { backgroundColor: C.primary },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 10,
    color: C.textMuted,
    flex: 1,
    textAlign: "center",
  },
  cardFooter: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: C.cardBorder,
    paddingTop: 12,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  footerMeta: { fontSize: 12, color: C.textMuted },
  footerDate: { fontSize: 12, color: C.textMuted, marginLeft: "auto" },
});
