import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect } from "@react-navigation/native";

import { COLORS } from "../../constants";
import { VOLUNTEER_INVITATION_STATUS } from "../../constants/volunteer";
import { volunteerCampaignApi } from "../../api/volunteerCampaign";

const TABS = [
  { key: "all", label: "Tất cả" },
  { key: "pending", label: "Chờ phản hồi" },
  { key: "accepted", label: "Đã nhận" },
  { key: "declined", label: "Đã từ chối" },
];

const C = {
  primary: COLORS.primary,
  text: "#0f172a",
  textMuted: "hsl(210, 5%, 50%)",
  cardBorder: "hsl(210, 5%, 92%)",
  white: "#ffffff",
};

function formatVietnameseDate(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  const dayName = date.toLocaleDateString("vi-VN", { weekday: "long" });
  const dateStr = date.toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
  const timeStr = date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${dateStr} lúc ${timeStr}`;
}

function InvitationCard({ item, onPress }) {
  const campaign = item.campaign || {};
  const st =
    VOLUNTEER_INVITATION_STATUS[item.status] ||
    VOLUNTEER_INVITATION_STATUS.pending;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.88}
      onPress={() => onPress(item)}
    >
      <View style={styles.cardTop}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {campaign.title}
        </Text>
        <View style={[styles.pill, { backgroundColor: st.bg }]}>
          <Text style={[styles.pillText, { color: st.color }]}>{st.label}</Text>
        </View>
      </View>

      {!!campaign.description && (
        <Text style={styles.cardDesc} numberOfLines={2}>
          {campaign.description}
        </Text>
      )}

      <View style={styles.cardRow}>
        <MaterialIcons name="place" size={15} color={C.textMuted} />
        <Text style={styles.cardMeta}>{campaign.location || campaign.district || "—"}</Text>
      </View>

      {!!campaign.scheduled_at && (
        <View style={styles.cardRow}>
          <MaterialIcons name="schedule" size={15} color={C.textMuted} />
          <Text style={styles.cardMeta}>{formatVietnameseDate(campaign.scheduled_at)}</Text>
        </View>
      )}

      {item.status === "declined" && !!item.declined_reason && (
        <View style={styles.declinedReasonRow}>
          <MaterialIcons name="info-outline" size={14} color="#C62828" />
          <Text style={styles.declinedReason}>
            Lý do từ chối: {item.declined_reason}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function MyInvitationsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState("all");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    const params = activeTab === "all" ? {} : { status: activeTab };
    const res = await volunteerCampaignApi.getMyInvitations(params);
    return Array.isArray(res.data) ? res.data : res.data?.data ?? [];
  }, [activeTab]);

  const load = useCallback(async () => {
    try {
      const data = await fetchData();
      setItems(data);
    } catch {
      setItems([]);
    }
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        setLoading(true);
        await load();
        if (active) setLoading(false);
      })();
      return () => {
        active = false;
      };
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleCardPress = (item) => {
    navigation.navigate("InvitationDetail", { invitation: item });
  };

  const paddingBottom = (insets.bottom || 24) + 80;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <Text style={styles.title}>Lời mời của tôi</Text>
        <Text style={styles.subtitle}>
          Các đợt tình nguyện bạn được mời tham gia
        </Text>
      </View>

      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            activeOpacity={0.8}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <MaterialIcons name="mail-outline" size={56} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>Chưa có lời mời nào</Text>
          <Text style={styles.emptySub}>
            {activeTab === "all"
              ? "Bạn chưa được mời tham gia đợt tình nguyện nào."
              : "Không có lời mời nào ở trạng thái này."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <InvitationCard item={item} onPress={handleCardPress} />
          )}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom },
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { paddingHorizontal: 16, paddingBottom: 4 },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: C.text,
    marginBottom: 6,
  },
  subtitle: { fontSize: 14, color: C.textMuted, lineHeight: 20 },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 6,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.cardBorder,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "700",
    color: C.textMuted,
  },
  tabTextActive: {
    color: C.white,
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
  listContent: { paddingHorizontal: 16, paddingTop: 4 },
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
    marginBottom: 6,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: C.text,
    lineHeight: 22,
  },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  pillText: { fontSize: 11, fontWeight: "700" },
  cardDesc: {
    fontSize: 13,
    color: C.textMuted,
    marginBottom: 8,
    lineHeight: 18,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  cardMeta: { fontSize: 13, color: C.textMuted },
  declinedReasonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#FFCDD2",
  },
  declinedReason: { fontSize: 12, color: "#C62828", flex: 1 },
});
