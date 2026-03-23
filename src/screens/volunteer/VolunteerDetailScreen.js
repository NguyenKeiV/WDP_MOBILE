import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { useAuth } from "../../context/AuthContext";
import { COLORS } from "../../constants";
import {
  VOLUNTEER_SUPPORT_TYPES,
  VOLUNTEER_STATUS,
} from "../../constants/volunteer";
import { fetchVolunteerRegistrationById } from "../../api/volunteer";

const C = { text: "#0f172a", textMuted: "hsl(210, 5%, 50%)", border: "#e2e8f0" };

function typeLabel(value) {
  return VOLUNTEER_SUPPORT_TYPES.find((t) => t.value === value)?.label || value;
}

export default function VolunteerDetailScreen({ route }) {
  const { id } = route.params;
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id || !id) return;
    try {
      const res = await fetchVolunteerRegistrationById(user.id, id);
      setItem(res.data ?? null);
    } catch {
      setItem(null);
    }
  }, [user?.id, id]);

  useEffect(() => {
    let a = true;
    (async () => {
      setLoading(true);
      await load();
      if (a) setLoading(false);
    })();
    return () => {
      a = false;
    };
  }, [load]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!item) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.err}>Không tìm thấy đăng ký.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const st = VOLUNTEER_STATUS[item.status] || VOLUNTEER_STATUS.pending;

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.statusBanner, { backgroundColor: st.bg }]}>
          <MaterialIcons name="flag" size={22} color={st.color} />
          <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Hình thức hỗ trợ</Text>
          <Text style={styles.cardValue}>{typeLabel(item.support_type)}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Khu vực</Text>
          <View style={styles.row}>
            <MaterialIcons name="place" size={20} color={COLORS.primary} />
            <Text style={styles.cardValue}>{item.district}</Text>
          </View>
        </View>

        {item.note ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Ghi chú của bạn</Text>
            <Text style={styles.note}>{item.note}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Thời gian gửi</Text>
          <Text style={styles.cardValue}>
            {new Date(item.created_at).toLocaleString("vi-VN")}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Phản hồi điều phối</Text>
          <Text style={styles.hint}>
            {item.coordinator_note ||
              "Chưa có — khi có backend, nội dung duyệt / hướng dẫn sẽ hiển thị tại đây."}
          </Text>
        </View>

        <View style={styles.footerHint}>
          <MaterialIcons name="build" size={16} color={C.textMuted} />
          <Text style={styles.footerHintText}>
            Phản hồi điều phối cập nhật khi điều phối xử lý trên hệ thống quản trị.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafc" },
  scroll: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  err: { color: C.textMuted, fontSize: 15 },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 16,
    borderRadius: 14,
    marginBottom: 14,
  },
  statusText: { fontSize: 17, fontWeight: "800" },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: C.textMuted,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  cardValue: { fontSize: 16, fontWeight: "700", color: C.text },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  note: { fontSize: 15, color: C.text, lineHeight: 22 },
  hint: { fontSize: 14, color: C.textMuted, lineHeight: 21 },
  footerHint: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  footerHintText: { flex: 1, fontSize: 12, color: C.textMuted, lineHeight: 18 },
});
