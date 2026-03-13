import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { requestsApi } from "../../api/requests";
import { COLORS, STATUS_CONFIG, CATEGORIES, PRIORITIES } from "../../constants";

const STATUS_ICONS = {
  new: "schedule",
  pending_verification: "pending-actions",
  verified: "verified-user",
  on_mission: "local-shipping",
  completed: "check-circle",
  rejected: "cancel",
};

export default function RequestDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { id } = route.params;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    requestsApi
      .getById(id)
      .then((res) => setData(res.data))
      .catch(() => navigation.goBack())
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!data) return null;

  const status = STATUS_CONFIG[data.status] || STATUS_CONFIG.new;
  const category = CATEGORIES.find((c) => c.value === data.category);
  const priority = PRIORITIES.find((p) => p.value === data.priority);
  const statusIcon = STATUS_ICONS[data.status] || "info";
  const contentPadding = { paddingBottom: (insets.bottom || 24) + 24 };

  const Row = ({ icon, label, value, valueStyle }) => (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <MaterialIcons name={icon} size={16} color={COLORS.primary} />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Text
        style={[styles.rowValue, valueStyle]}
        numberOfLines={2}
        ellipsizeMode="tail"
      >
        {value || "—"}
      </Text>
    </View>
  );

  // Map hiển thị thuần chữ, không emoji/icon dẫn
  const friendlyCategory =
    data.category === "rescue"
      ? "Cứu hộ"
      : data.category === "relief"
      ? "Cứu trợ"
      : category?.label?.replace(/^[^\wÀ-ỹ]+?\s*/, "") || data.category;

  let friendlyPriority = "";
  switch (priority?.value) {
    case "urgent":
      friendlyPriority = "KHẨN CẤP";
      break;
    case "high":
      friendlyPriority = "CAO";
      break;
    case "medium":
      friendlyPriority = "TRUNG BÌNH";
      break;
    case "low":
      friendlyPriority = "THẤP";
      break;
    default:
      friendlyPriority =
        priority?.label?.replace(/^[^\wÀ-ỹ]+?\s*/, "").toUpperCase() || "";
  }
  const priorityColor = priority?.color || COLORS.danger || "#ef4444";

  const timelineEvents = [];
  if (data.created_at) {
    timelineEvents.push({
      key: "created",
      color: COLORS.primary,
      label: "Yêu cầu được tạo",
      date: new Date(data.created_at),
    });
  }
  if (data.verified_at) {
    timelineEvents.push({
      key: "verified",
      color: COLORS.primary,
      label: "Đã xác minh thông tin",
      date: new Date(data.verified_at),
    });
  }
  if (data.assigned_at) {
    timelineEvents.push({
      key: "assigned",
      color: COLORS.primary,
      label: "Đội cứu hộ đã tiếp nhận",
      date: new Date(data.assigned_at),
    });
  }
  if (data.completed_at) {
    timelineEvents.push({
      key: "completed",
      color: "#10b981",
      label: "Hoàn thành hỗ trợ",
      date: new Date(data.completed_at),
    });
  }

  const formatTimeline = (date) => {
    const time = date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const d = date.toLocaleDateString("vi-VN");
    return `${time} - ${d}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBack}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name="arrow-back"
            size={20}
            color={COLORS.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết yêu cầu cứu trợ</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, contentPadding]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.statusBanner, { backgroundColor: status.bg }]}>
          <MaterialIcons name={statusIcon} size={20} color={status.color} />
          <Text style={[styles.statusText, { color: status.color }]}>
            {status.label}
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
          <MaterialIcons name="info" size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Thông tin yêu cầu</Text>
          </View>
          <Row
            icon="label"
            label="Loại yêu cầu"
            value={friendlyCategory}
          />
          <Row icon="location-on" label="Quận/Huyện" value={data.district} />
          <Row icon="groups" label="Số người" value={`${data.num_people} người`} />
          {priority && (
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Text style={styles.rowLabel}>Mức ưu tiên</Text>
              </View>
              <View
                style={[
                  styles.priorityChip,
                  {
                    borderColor: priorityColor,
                    backgroundColor: priorityColor + "10",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.priorityChipText,
                    { color: priorityColor },
                  ]}
                >
                  {friendlyPriority}
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
          <MaterialIcons
            name="description"
            size={18}
            color={COLORS.primary}
          />
            <Text style={styles.sectionTitle}>Mô tả tình huống</Text>
          </View>
          <Text style={styles.description}>
            “{data.description}”
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
          <MaterialIcons
            name="place"
            size={18}
            color={COLORS.primary}
          />
            <Text style={styles.sectionTitle}>Vị trí</Text>
          </View>
          {data.location_type === "gps" ? (
            <>
              <Row icon="satellite-alt" label="Loại" value="GPS" />
              <Row
                icon="my-location"
                label="Tọa độ"
                value={`${data.latitude}, ${data.longitude}`}
              />
              <View style={styles.mapPreview}>
                <View style={styles.mapPreviewInner}>
                  <MaterialIcons
                    name="location-on"
                    size={40}
                    color={COLORS.danger || "#ef4444"}
                  />
                  <View style={styles.mapPreviewShadow} />
                </View>
              </View>
              <TouchableOpacity
                style={styles.mapBtn}
                onPress={() =>
                  Linking.openURL(
                    `https://www.google.com/maps?q=${data.latitude},${data.longitude}`,
                  )
                }
              >
                <MaterialIcons
                  name="map"
                  size={18}
                  color={COLORS.primary}
                />
                <Text style={styles.mapBtnText}>Xem trên Google Maps</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Row icon="home" label="Địa chỉ" value={data.address} />
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
          <MaterialIcons name="person" size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Người gửi yêu cầu</Text>
          </View>
          <View style={styles.requesterRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.requesterName}>
                {data.creator?.username || "Người dùng ẩn danh"}
              </Text>
              <Text style={styles.requesterRole}>Cư dân địa phương</Text>
            </View>
            <TouchableOpacity
              style={styles.requesterCallBtn}
              onPress={() => Linking.openURL(`tel:${data.phone_number}`)}
              activeOpacity={0.85}
            >
              <MaterialIcons name="call" size={18} color={COLORS.primary} />
              <Text style={styles.requesterCallText}>{data.phone_number}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {data.assigned_team && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons
                name="groups"
                size={18}
                color={COLORS.primary}
              />
              <Text style={styles.sectionTitle}>Đội cứu hộ</Text>
            </View>
            <Row icon="badge" label="Tên đội" value={data.assigned_team.name} />
            <Row
              icon="location-city"
              label="Quận"
              value={data.assigned_team.district}
            />

            <TouchableOpacity
              onPress={() =>
                Linking.openURL(`tel:${data.assigned_team.phone_number}`)
              }
              activeOpacity={0.8}
            >
              <Row
                icon="phone"
                label="Liên hệ đội"
                value={data.assigned_team.phone_number}
                valueStyle={{
                  color: COLORS.secondary,
                  textDecorationLine: "underline",
                }}
              />
            </TouchableOpacity>
          </View>
        )}

        {data.notes && (
          <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons
              name="notes"
              size={18}
              color={COLORS.primary}
            />
            <Text style={styles.sectionTitle}>Ghi chú nội bộ</Text>
          </View>
          <Text style={styles.noteText}>{data.notes}</Text>
          </View>
        )}

        {timelineEvents.length > 0 && (
          <View style={styles.timelineSection}>
            <View style={styles.timeline}>
              {timelineEvents.map((e, idx) => {
                const isLast = idx === timelineEvents.length - 1;
                return (
                  <View key={e.key} style={styles.timelineItem}>
                    <View style={styles.timelineLeft}>
                      <View
                        style={[
                          styles.timelineDot,
                          isLast && styles.timelineDotSuccess,
                        ]}
                      />
                      {!isLast && <View style={styles.timelineLine} />}
                    </View>
                    <View style={styles.timelineContent}>
                      <Text
                        style={[
                          styles.timelineTime,
                          isLast && styles.timelineTimeSuccess,
                        ]}
                      >
                        {formatTimeline(e.date)}
                      </Text>
                      <Text
                        style={[
                          styles.timelineLabel,
                          isLast && styles.timelineLabelStrong,
                        ]}
                      >
                        {e.label}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.grayLight },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { padding: 16, paddingBottom: 32 },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148, 163, 184, 0.25)",
  },
  headerBack: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(148, 163, 184, 0.1)",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  headerSpacer: { width: 40, height: 40 },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  statusText: { fontSize: 16, fontWeight: "700" },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textLight,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148, 163, 184, 0.15)",
    paddingBottom: 4,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  rowLabel: { fontSize: 12, color: COLORS.textLight },
  rowValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: "600",
    marginLeft: 12,
    maxWidth: "55%",
    textAlign: "right",
  },
  description: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 22,
    fontStyle: "italic",
  },
  mapBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
  },
  mapBtnText: { color: COLORS.primary, fontWeight: "600", fontSize: 14 },
  timestamps: { gap: 6 },
  noteText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    backgroundColor: "rgba(148, 163, 184, 0.06)",
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(148, 163, 184, 0.6)",
    padding: 10,
  },
  requesterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  requesterName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },
  requesterRole: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  requesterCallBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primary + "10",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  requesterCallText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
  },
  priorityChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  priorityChipText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  mapPreview: {
    height: 160,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#e5e7eb",
    marginTop: 8,
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  mapPreviewInner: {
    alignItems: "center",
    justifyContent: "center",
  },
  mapPreviewShadow: {
    width: 28,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(0,0,0,0.2)",
    marginTop: -6,
  },
  timelineSection: {
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  timeline: {
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.primary + "33",
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  timelineLeft: {
    width: 32,
    alignItems: "center",
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  timelineDotSuccess: {
    backgroundColor: "#10b981",
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: COLORS.primary + "33",
    marginTop: 2,
  },
  timelineContent: {
    flex: 1,
    paddingLeft: 4,
    gap: 2,
  },
  timelineTime: {
    fontSize: 11,
    color: COLORS.textLight,
  },
  timelineTimeSuccess: {
    color: "#10b981",
    fontWeight: "700",
  },
  timelineLabel: {
    fontSize: 13,
    color: COLORS.text,
  },
  timelineLabelStrong: {
    fontWeight: "700",
  },
});
