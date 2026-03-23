import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect } from "@react-navigation/native";

import { useAuth } from "../../context/AuthContext";
import { COLORS } from "../../constants";
import {
  VOLUNTEER_SUPPORT_TYPES,
  VOLUNTEER_STATUS,
} from "../../constants/volunteer";
import { fetchMyVolunteerRegistrations } from "../../api/volunteer";

const C = {
  primary: COLORS.primary,
  text: "#0f172a",
  textMuted: "hsl(210, 5%, 50%)",
  cardBorder: "hsl(210, 5%, 92%)",
  white: "#ffffff",
};

function typeLabel(value) {
  return VOLUNTEER_SUPPORT_TYPES.find((t) => t.value === value)?.label || value;
}

export default function VolunteerListScreen({ navigation }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) return;
    const res = await fetchMyVolunteerRegistrations(user.id);
    setItems(res.data || []);
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      let a = true;
      (async () => {
        setLoading(true);
        await load();
        if (a) setLoading(false);
      })();
      return () => {
        a = false;
      };
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const paddingTop = Math.max(insets.top, 12);
  const paddingBottom = (insets.bottom || 24) + 88;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop, paddingBottom },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Tình nguyện cứu trợ</Text>
          <Text style={styles.subtitle}>
            Đăng ký tham gia hỗ trợ đợt cứu trợ tại khu vực bạn có thể giúp.
          </Text>
        </View>

        <View style={styles.notice}>
          <MaterialIcons name="info-outline" size={18} color={C.primary} />
          <Text style={styles.noticeText}>
            Giao diện mẫu — dữ liệu lưu trên máy. Khi có API backend, chỉ cần
            nối lớp gọi trong{" "}
            <Text style={styles.noticeMono}>src/api/volunteer.js</Text>.
          </Text>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={C.primary} />
          </View>
        ) : items.length === 0 ? (
          <View style={styles.empty}>
            <MaterialIcons name="volunteer-activism" size={56} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>Chưa có đăng ký nào</Text>
            <Text style={styles.emptySub}>
              Bấm nút bên dưới để tạo đăng ký tình nguyện tham gia cứu trợ.
            </Text>
          </View>
        ) : (
          items.map((item) => {
            const st = VOLUNTEER_STATUS[item.status] || VOLUNTEER_STATUS.pending;
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                activeOpacity={0.88}
                onPress={() =>
                  navigation.navigate("VolunteerDetail", { id: item.id })
                }
              >
                <View style={styles.cardTop}>
                  <Text style={styles.cardType} numberOfLines={1}>
                    {typeLabel(item.support_type)}
                  </Text>
                  <View style={[styles.pill, { backgroundColor: st.bg }]}>
                    <Text style={[styles.pillText, { color: st.color }]}>
                      {st.label}
                    </Text>
                  </View>
                </View>
                <View style={styles.cardRow}>
                  <MaterialIcons name="place" size={16} color={C.textMuted} />
                  <Text style={styles.cardMeta}>{item.district}</Text>
                </View>
                <Text style={styles.cardDate}>
                  {new Date(item.created_at).toLocaleString("vi-VN")}
                </Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { bottom: (insets.bottom || 16) + 16 }]}
        activeOpacity={0.9}
        onPress={() => navigation.navigate("VolunteerRegister")}
      >
        <MaterialIcons name="add" size={28} color={C.white} />
        <Text style={styles.fabText}>Đăng ký</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  scrollContent: { paddingHorizontal: 16 },
  header: { marginBottom: 12 },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: C.text,
    marginBottom: 6,
  },
  subtitle: { fontSize: 14, color: C.textMuted, lineHeight: 20 },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#BBDEFB",
  },
  noticeText: { flex: 1, fontSize: 12, color: C.text, lineHeight: 18 },
  noticeMono: { fontFamily: "monospace", fontSize: 11, color: C.primary },
  centered: { paddingVertical: 48, alignItems: "center" },
  empty: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 17,
    fontWeight: "700",
    color: C.text,
  },
  emptySub: {
    marginTop: 8,
    fontSize: 14,
    color: C.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  card: {
    backgroundColor: C.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 8,
  },
  cardType: { flex: 1, fontSize: 16, fontWeight: "700", color: C.text },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  pillText: { fontSize: 11, fontWeight: "700" },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  cardMeta: { fontSize: 13, color: C.textMuted },
  cardDate: { marginTop: 8, fontSize: 12, color: "#94a3b8" },
  fab: {
    position: "absolute",
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 28,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  fabText: { color: C.white, fontWeight: "800", fontSize: 15 },
});
