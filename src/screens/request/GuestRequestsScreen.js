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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { requestsApi } from "../../api/requests";
import { COLORS, STATUS_CONFIG, CATEGORIES } from "../../constants";

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
        <Text style={styles.footerMeta}>📍 {item.district}</Text>
        <Text style={styles.footerDate}>
          {new Date(item.created_at).toLocaleDateString("vi-VN")}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default function GuestRequestsScreen({ navigation }) {
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

      // Fetch từng request theo ID
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

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>📋 Yêu cầu của tôi</Text>
      <Text style={styles.subtitle}>
        {requests.length} yêu cầu trên thiết bị này
      </Text>
      <View style={styles.noticeBanner}>
        <Text style={styles.noticeText}>
          💡 Đăng nhập để theo dõi yêu cầu trên nhiều thiết bị
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.noticeLink}>Đăng nhập →</Text>
        </TouchableOpacity>
      </View>
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
              Các yêu cầu bạn tạo sẽ xuất hiện ở đây
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
  noticeBanner: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 6,
  },
  noticeText: { fontSize: 13, color: COLORS.text },
  noticeLink: { fontSize: 13, color: COLORS.primary, fontWeight: "700" },
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
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: COLORS.grayLight,
    paddingTop: 8,
  },
  footerMeta: { fontSize: 11, color: COLORS.gray },
  footerDate: { fontSize: 11, color: COLORS.gray },
  empty: { alignItems: "center", paddingVertical: 48 },
  emptyIcon: { fontSize: 56, marginBottom: 12 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.black,
    marginBottom: 6,
  },
  emptyText: { fontSize: 13, color: COLORS.textLight, textAlign: "center" },
});
