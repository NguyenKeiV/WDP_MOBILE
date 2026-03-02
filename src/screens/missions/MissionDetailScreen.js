import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
} from "react-native";
import { missionsApi } from "../../api/missions";
import { COLORS, CATEGORIES } from "../../constants";

const PRIORITY_CONFIG = {
  urgent: { label: "🔴 Khẩn cấp", color: "#E53935", bg: "#FFEBEE" },
  high: { label: "🟠 Cao", color: "#F57C00", bg: "#FFF3E0" },
  medium: { label: "🟡 Trung bình", color: "#F9A825", bg: "#FFFDE7" },
  low: { label: "🟢 Thấp", color: "#388E3C", bg: "#E8F5E9" },
};

export default function MissionDetailScreen({ route, navigation }) {
  const { mission, team } = route.params;
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);

  const category = CATEGORIES.find((c) => c.value === mission.category);
  const priority = PRIORITY_CONFIG[mission.priority];

  const handleCall = () => {
    Linking.openURL(`tel:${mission.phone_number}`);
  };

  const handleOpenMap = () => {
    const lat = parseFloat(mission.latitude);
    const lng = parseFloat(mission.longitude);
    if (lat && lng) {
      const url =
        Platform.OS === "ios"
          ? `maps://?q=${lat},${lng}`
          : `geo:${lat},${lng}?q=${lat},${lng}`;
      Linking.openURL(url);
    }
  };

  const handleComplete = () => {
    Alert.alert(
      "✔️ Hoàn thành nhiệm vụ",
      "Xác nhận đội đã hoàn thành nhiệm vụ cứu hộ này?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xác nhận hoàn thành",
          style: "default",
          onPress: async () => {
            setCompleting(true);
            try {
              await missionsApi.complete(mission.id);
              setCompleted(true);
              Alert.alert(
                "✅ Thành công",
                "Nhiệm vụ đã được hoàn thành. Đội của bạn đã trở về trạng thái sẵn sàng.",
                [{ text: "OK", onPress: () => navigation.goBack() }],
              );
            } catch (e) {
              Alert.alert("Lỗi", e.message);
            } finally {
              setCompleting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Status banner */}
      <View style={styles.statusBanner}>
        <Text style={styles.statusBannerText}>🚨 Đang thực hiện cứu hộ</Text>
      </View>

      {/* Category & Priority */}
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <Text style={styles.categoryText}>
            {category?.label || mission.category}
          </Text>
          {priority && (
            <View
              style={[styles.priorityBadge, { backgroundColor: priority.bg }]}
            >
              <Text style={[styles.priorityText, { color: priority.color }]}>
                {priority.label}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Description */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📝 Mô tả tình huống</Text>
        <Text style={styles.descText}>{mission.description}</Text>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Số người</Text>
            <Text style={styles.metaValue}>👥 {mission.num_people} người</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Khu vực</Text>
            <Text style={styles.metaValue}>📍 {mission.province_city}</Text>
          </View>
        </View>
      </View>

      {/* Contact */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📞 Liên hệ người cần cứu hộ</Text>
        <TouchableOpacity style={styles.contactBtn} onPress={handleCall}>
          <Text style={styles.contactBtnText}>
            📞 Gọi {mission.phone_number}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Location */}
      {mission.latitude && mission.longitude && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>📍 Vị trí GPS</Text>
          <Text style={styles.coordText}>
            {parseFloat(mission.latitude).toFixed(5)},{" "}
            {parseFloat(mission.longitude).toFixed(5)}
          </Text>
          <TouchableOpacity style={styles.mapBtn} onPress={handleOpenMap}>
            <Text style={styles.mapBtnText}>🗺️ Mở Google Maps</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Team info */}
      {team && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🚒 Thông tin đội</Text>
          <Text style={styles.teamName}>{team.name}</Text>
          <Text style={styles.teamInfo}>👨‍✈️ Đội trưởng: {team.leader_name}</Text>
          <Text style={styles.teamInfo}>📞 {team.phone_number}</Text>
          <Text style={styles.teamInfo}>📍 {team.province_city}</Text>
        </View>
      )}

      {/* Time */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>🕐 Thời gian</Text>
        <Text style={styles.timeText}>
          Tạo lúc: {new Date(mission.created_at).toLocaleString("vi-VN")}
        </Text>
        {mission.assigned_at && (
          <Text style={styles.timeText}>
            Phân công lúc:{" "}
            {new Date(mission.assigned_at).toLocaleString("vi-VN")}
          </Text>
        )}
      </View>

      {/* Complete button */}
      {!completed && (
        <TouchableOpacity
          style={[styles.completeBtn, completing && { opacity: 0.7 }]}
          onPress={handleComplete}
          disabled={completing}
        >
          {completing ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.completeBtnText}>✔️ Hoàn thành nhiệm vụ</Text>
          )}
        </TouchableOpacity>
      )}

      {completed && (
        <View style={styles.completedBanner}>
          <Text style={styles.completedText}>✅ Nhiệm vụ đã hoàn thành</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.grayLight },
  content: { padding: 16, paddingBottom: 40 },
  statusBanner: {
    backgroundColor: "#FFEBEE",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  statusBannerText: { color: COLORS.primary, fontWeight: "700", fontSize: 15 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.black,
    flex: 1,
  },
  priorityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  priorityText: { fontSize: 12, fontWeight: "700" },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textLight,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  descText: { fontSize: 14, color: COLORS.text, lineHeight: 22 },
  metaRow: { flexDirection: "row", gap: 16, marginTop: 12 },
  metaItem: { flex: 1 },
  metaLabel: { fontSize: 11, color: COLORS.textLight, marginBottom: 2 },
  metaValue: { fontSize: 13, color: COLORS.text, fontWeight: "600" },
  contactBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },
  contactBtnText: { color: COLORS.white, fontWeight: "700", fontSize: 15 },
  coordText: {
    fontSize: 13,
    color: COLORS.text,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    marginBottom: 10,
  },
  mapBtn: {
    backgroundColor: "#1565C0",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  mapBtnText: { color: COLORS.white, fontWeight: "700", fontSize: 14 },
  teamName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.black,
    marginBottom: 6,
  },
  teamInfo: { fontSize: 13, color: COLORS.text, marginBottom: 3 },
  timeText: { fontSize: 13, color: COLORS.text, marginBottom: 4 },
  completeBtn: {
    backgroundColor: "#388E3C",
    borderRadius: 14,
    padding: 18,
    alignItems: "center",
    marginTop: 8,
  },
  completeBtnText: { color: COLORS.white, fontSize: 17, fontWeight: "800" },
  completedBanner: {
    backgroundColor: "#E8F5E9",
    borderRadius: 14,
    padding: 18,
    alignItems: "center",
    marginTop: 8,
  },
  completedText: { color: "#388E3C", fontSize: 17, fontWeight: "800" },
});
