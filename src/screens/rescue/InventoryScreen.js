import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { COLORS } from "../../constants";
import { suppliesApi } from "../../api/supplies";

const CATEGORY_CONFIG = {
  food: { label: "Lương thực", icon: "restaurant" },
  water: { label: "Nước uống", icon: "water-drop" },
  medicine: { label: "Y tế", icon: "medical-services" },
  clothing: { label: "Quần áo", icon: "checkroom" },
  equipment: { label: "Thiết bị", icon: "build" },
  other: { label: "Khác", icon: "inventory" },
};

function mapInventoryItem(item) {
  return {
    id: item?.supply?.id || `${item?.supply_id || "unknown"}`,
    name: item?.supply?.name || "Mặt hàng không xác định",
    category: item?.supply?.category || "other",
    unit: item?.supply?.unit || "đơn vị",
    total_received: Number(item?.total_received || 0),
    total_used: Number(item?.total_used || 0),
    remaining: Number(item?.remaining || 0),
  };
}

function aggregateFromDistributions(list) {
  const bucket = {};

  (Array.isArray(list) ? list : []).forEach((row) => {
    const id = row?.supply?.id || row?.supply_id;
    if (!id) return;

    if (!bucket[id]) {
      bucket[id] = {
        id,
        name: row?.supply?.name || "Mặt hàng không xác định",
        category: row?.supply?.category || "other",
        unit: row?.supply?.unit || "đơn vị",
        total_received: 0,
        total_used: 0,
        remaining: 0,
      };
    }

    const qty = Number(row?.quantity || 0);
    bucket[id].total_received += qty;
    bucket[id].remaining += qty;
  });

  return Object.values(bucket);
}

function SupplyCard({ item }) {
  const categoryCfg = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.other;
  const isOut = item.remaining <= 0;

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.supplyInfoWrap}>
          <View style={styles.iconBubble}>
            <MaterialIcons
              name={categoryCfg.icon}
              size={20}
              color={COLORS.primary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={styles.categoryText}>{categoryCfg.label}</Text>
          </View>
        </View>

        <View
          style={[
            styles.remainingBadge,
            isOut
              ? { backgroundColor: "#FEE2E2" }
              : { backgroundColor: COLORS.primaryLight },
          ]}
        >
          <Text
            style={[
              styles.remainingText,
              isOut ? { color: "#B71C1C" } : { color: COLORS.primary },
            ]}
          >
            Còn {item.remaining} {item.unit}
          </Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Đã cấp</Text>
          <Text style={styles.metricValue}>
            {item.total_received} {item.unit}
          </Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Đã dùng</Text>
          <Text style={styles.metricValue}>
            {item.total_used} {item.unit}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function InventoryScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [teamName, setTeamName] = useState("");
  const [items, setItems] = useState([]);

  const fetchInventory = useCallback(async () => {
    setFetchError("");

    try {
      const res = await suppliesApi.getMyTeamInventory();
      const payload = res?.data || res;
      const inventory = Array.isArray(payload?.inventory)
        ? payload.inventory
        : [];

      setTeamName(payload?.team?.name || "");
      setItems(inventory.map(mapInventoryItem));
      return;
    } catch (error) {
      try {
        const fallbackRes = await suppliesApi.getMyTeamDistributions({
          page: 1,
          limit: 200,
        });
        const fallbackData =
          fallbackRes?.data?.data || fallbackRes?.data || fallbackRes;
        const rows = Array.isArray(fallbackData) ? fallbackData : [];
        setItems(aggregateFromDistributions(rows));
        setTeamName("");
      } catch {
        setItems([]);
        setFetchError(
          error?.message ||
            "Không thể tải vật phẩm đội được cấp. Vui lòng thử lại.",
        );
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        setLoading(true);
        await fetchInventory();
        if (active) setLoading(false);
      })();

      return () => {
        active = false;
      };
    }, [fetchInventory]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInventory();
    setRefreshing(false);
  };

  const totalRemaining = items.reduce((sum, i) => sum + i.remaining, 0);
  const totalReceived = items.reduce((sum, i) => sum + i.total_received, 0);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải vật phẩm...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={[
          styles.listContent,
          items.length === 0 && !fetchError ? styles.listContentEmpty : null,
        ]}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Kiểm kê vật phẩm</Text>
            <Text style={styles.sub}>
              Vật phẩm manager đã cấp cho đội cứu trợ.
            </Text>

            {teamName ? (
              <Text style={styles.teamName}>Đội: {teamName}</Text>
            ) : null}

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
                    { backgroundColor: COLORS.primaryLight },
                  ]}
                >
                  <Text style={[styles.statNumber, { color: COLORS.primary }]}>
                    {items.length}
                  </Text>
                  <Text style={styles.statLabel}>Loại vật phẩm</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: "#E8F5E9" }]}>
                  <Text style={[styles.statNumber, { color: "#2E7D32" }]}>
                    {totalRemaining}
                  </Text>
                  <Text style={styles.statLabel}>Tổng còn lại</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: "#FFF8E1" }]}>
                  <Text style={[styles.statNumber, { color: "#F57F17" }]}>
                    {totalReceived}
                  </Text>
                  <Text style={styles.statLabel}>Tổng đã cấp</Text>
                </View>
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => <SupplyCard item={item} />}
        ListEmptyComponent={
          !fetchError ? (
            <View style={styles.emptyWrap}>
              <View style={styles.iconWrap}>
                <MaterialIcons
                  name="inventory-2"
                  size={64}
                  color={COLORS.gray}
                />
              </View>
              <Text style={styles.emptyTitle}>Chưa có vật phẩm được cấp</Text>
              <Text style={styles.emptySub}>
                Hiện chưa có vật phẩm nào được manager phân cho đội của bạn.
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.grayLight },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, color: COLORS.textLight, fontSize: 14 },

  listContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 36 },
  listContentEmpty: { flexGrow: 1 },

  header: { marginBottom: 12 },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.black,
    marginBottom: 6,
  },
  sub: { fontSize: 14, color: COLORS.textLight, lineHeight: 20 },
  teamName: {
    marginTop: 8,
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "700",
  },

  statsRow: { flexDirection: "row", gap: 8, marginTop: 14 },
  statCard: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  statNumber: { fontSize: 18, fontWeight: "800", marginBottom: 2 },
  statLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    fontWeight: "700",
    textTransform: "uppercase",
  },

  errorBanner: {
    marginTop: 14,
    backgroundColor: "#FFEBEE",
    borderWidth: 1,
    borderColor: "#FFCDD2",
    borderRadius: 10,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  errorText: { color: "#B71C1C", fontSize: 13, flex: 1, lineHeight: 18 },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  supplyInfoWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  iconBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontSize: 16, fontWeight: "700", color: COLORS.black },
  categoryText: { marginTop: 2, fontSize: 12, color: COLORS.textLight },

  remainingBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  remainingText: { fontSize: 12, fontWeight: "800" },

  metricsRow: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.grayBorder,
    paddingTop: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  metricItem: { flex: 1, alignItems: "center" },
  metricLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 2,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  metricValue: { fontSize: 14, color: COLORS.black, fontWeight: "700" },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.grayBorder,
    marginHorizontal: 6,
  },

  emptyWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.black,
    marginBottom: 10,
  },
  emptySub: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: "center",
    lineHeight: 22,
  },
});
