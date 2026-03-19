import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { requestsApi } from "../../api/requests";
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
        <Text style={styles.footerDate}>
          {new Date(item.created_at).toLocaleDateString("vi-VN")}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default function GuestRequestsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchGuestRequests = useCallback(async () => {
    try {
      const existing = await AsyncStorage.getItem("guest_request_ids");
      const ids = existing ? JSON.parse(existing) : [];

      if (ids.length === 0) {
        setRequests([]);
        return;
      }

      const results = await Promise.allSettled(
        ids.map((id) => requestsApi.getById(id).then((res) => res.data)),
      );

      const validRequests = results
        .filter((r) => r.status === "fulfilled")
        .map((r) => r.value);

      setRequests(validRequests);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchGuestRequests();
      setLoading(false);
    };
    init();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGuestRequests();
    setRefreshing(false);
  };

  const paddingTop = Math.max(insets.top, 12);
  const paddingBottom = (insets.bottom || 24) + 40;

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Yêu cầu của tôi</Text>
      <Text style={styles.subtitle}>
        {requests.length} yêu cầu trên thiết bị này
      </Text>
      <View style={styles.noticeBanner}>
        <Text style={styles.noticeText}>
          Đăng nhập để theo dõi yêu cầu trên nhiều thiết bị
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.noticeLink}>Đăng nhập</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </SafeAreaView>
    );
  }

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
        {renderHeader()}

        {requests.length === 0 ? (
          <View style={styles.empty}>
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
              Các yêu cầu bạn tạo sẽ xuất hiện ở đây.
            </Text>
          </View>
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
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: {
    paddingHorizontal: 16,
    maxWidth: 448,
    alignSelf: "center",
    width: "100%",
    flexGrow: 1,
  },
  header: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: "700", color: C.text, marginBottom: 4 },
  subtitle: {
    fontSize: 14,
    color: C.textMuted,
    marginBottom: 12,
  },
  noticeBanner: {
    backgroundColor: C.primary + "10",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: C.primary + "30",
  },
  noticeText: { fontSize: 13, color: C.text, marginBottom: 6 },
  noticeLink: {
    fontSize: 13,
    color: C.primary,
    fontWeight: "700",
    textDecorationLine: "underline",
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
  empty: {
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
    maxWidth: 280,
  },
});
