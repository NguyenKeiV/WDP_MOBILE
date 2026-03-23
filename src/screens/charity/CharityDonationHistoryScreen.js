import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect } from "@react-navigation/native";

import { charityHistoryApi } from "../../api/charityHistory";
import { COLORS } from "../../constants";

function formatDate(date) {
  if (!date) return "-";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function isValidVNPhone(phone) {
  return /^0\d{9}$/.test(String(phone || "").trim());
}

function ItemRow({ item }) {
  return (
    <View style={styles.itemRow}>
      <Text style={styles.itemName}>{item.supply_name || "Vật phẩm"}</Text>
      <Text style={styles.itemQty}>
        {item.quantity} {item.unit || ""}
      </Text>
    </View>
  );
}

function HistoryCard({ history }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.receiptWrap}>
          <MaterialIcons name="receipt-long" size={16} color={COLORS.primary} />
          <Text style={styles.receipt}>{history.receipt_code || "-"}</Text>
        </View>
        <Text style={styles.importDate}>{formatDate(history.import_date)}</Text>
      </View>

      <View style={styles.metaRow}>
        <MaterialIcons name="person" size={14} color="#64748b" />
        <Text style={styles.metaText}>
          Người ghi nhận: {history.manager?.username || "-"}
        </Text>
      </View>

      <View style={styles.metaRow}>
        <MaterialIcons name="phone" size={14} color="#64748b" />
        <Text style={styles.metaText}>{history.donor_phone || "-"}</Text>
      </View>

      <View style={styles.divider} />
      <Text style={styles.sectionTitle}>Vật phẩm quyên góp</Text>

      {history.items?.length ? (
        history.items.map((item, index) => (
          <ItemRow
            key={`${history.receipt_code}-${item.supply_id || index}`}
            item={item}
          />
        ))
      ) : (
        <Text style={styles.emptyItems}>Không có dữ liệu vật phẩm</Text>
      )}
    </View>
  );
}

export default function CharityDonationHistoryScreen({ route }) {
  const insets = useSafeAreaInsets();
  const initialPhone = String(route?.params?.donorPhone || "").trim();

  const [phone, setPhone] = useState(initialPhone);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searched, setSearched] = useState(false);
  const [items, setItems] = useState([]);

  const load = useCallback(
    async (opts = { silent: false }) => {
      const targetPhone = String(phone || "").trim();

      if (!isValidVNPhone(targetPhone)) {
        if (!opts.silent) {
          Alert.alert(
            "Thiếu thông tin",
            "Vui lòng nhập số điện thoại hợp lệ (10 số, bắt đầu bằng 0).",
          );
        }
        return;
      }

      if (!opts.silent) setLoading(true);
      try {
        const res = await charityHistoryApi.getByPhone(targetPhone, {
          limit: 50,
        });
        setItems(Array.isArray(res?.data) ? res.data : []);
        setSearched(true);
      } catch (e) {
        Alert.alert("Lỗi", e?.message || "Không thể tải lịch sử quyên góp");
      } finally {
        if (!opts.silent) setLoading(false);
      }
    },
    [phone],
  );

  useFocusEffect(
    useCallback(() => {
      if (isValidVNPhone(initialPhone)) {
        load({ silent: true });
      }
    }, [initialPhone, load]),
  );

  const onRefresh = async () => {
    if (!isValidVNPhone(phone)) return;
    setRefreshing(true);
    try {
      const res = await charityHistoryApi.getByPhone(phone, { limit: 50 });
      setItems(Array.isArray(res?.data) ? res.data : []);
      setSearched(true);
    } catch (e) {
      Alert.alert("Lỗi", e?.message || "Không thể làm mới dữ liệu");
    } finally {
      setRefreshing(false);
    }
  };

  const paddingTop = Math.max(insets.top, 12);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.title}>Lịch sử quyên góp</Text>
        <Text style={styles.subtitle}>
          Nhập số điện thoại đã dùng khi quyên góp để xem các biên nhận.
        </Text>

        <View style={styles.searchCard}>
          <Text style={styles.inputLabel}>Số điện thoại người quyên góp</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Ví dụ: 0901234567"
            keyboardType="phone-pad"
            maxLength={10}
          />

          <TouchableOpacity
            style={styles.searchBtn}
            onPress={() => load()}
            activeOpacity={0.9}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <MaterialIcons name="search" size={18} color="#fff" />
                <Text style={styles.searchBtnText}>Xem lịch sử</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {searched && !loading && items.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons
              name="history-toggle-off"
              size={44}
              color="#94a3b8"
            />
            <Text style={styles.emptyTitle}>Chưa có lịch sử quyên góp</Text>
          </View>
        ) : null}

        {items.length > 0 ? (
          <View style={styles.listWrap}>
            <Text style={styles.resultText}>{items.length} biên nhận</Text>
            {items.map((history) => (
              <HistoryCard
                key={history.receipt_code || history.import_batch_id}
                history={history}
              />
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { paddingHorizontal: 16, paddingBottom: 28 },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: "#64748b",
    marginBottom: 14,
  },

  searchCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
    padding: 12,
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    color: "#0f172a",
    backgroundColor: "#fff",
  },
  searchBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    minHeight: 44,
  },
  searchBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  emptyState: {
    marginTop: 44,
    alignItems: "center",
    gap: 10,
  },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: "#475569" },

  listWrap: { gap: 10 },
  resultText: { fontSize: 12, color: "#64748b", marginBottom: 2 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 12,
    gap: 8,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  receiptWrap: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1 },
  receipt: { fontSize: 13, fontWeight: "800", color: "#1e293b" },
  importDate: { fontSize: 12, color: "#64748b" },

  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 13, color: "#334155" },

  divider: { height: 1, backgroundColor: "#e2e8f0", marginVertical: 2 },
  sectionTitle: { fontSize: 12, fontWeight: "700", color: "#64748b" },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  itemName: { flex: 1, fontSize: 14, color: "#0f172a" },
  itemQty: { fontSize: 13, fontWeight: "700", color: "#0f172a" },
  emptyItems: { fontSize: 13, color: "#94a3b8" },
});
