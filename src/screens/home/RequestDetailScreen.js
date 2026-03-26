import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Platform,
  TextInput,
  Alert,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import MapView, { Marker } from "react-native-maps";

import { requestsApi } from "../../api/requests";
import { useAuth } from "../../context/AuthContext";
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
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [submittingConfirmation, setSubmittingConfirmation] = useState(false);

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

  const parseCitizenConfirmation = (value) => {
    if (!value) return null;

    if (typeof value === "object") {
      return {
        confirmed: typeof value.confirmed === "boolean" ? value.confirmed : null,
        feedback_notes:
          typeof value.feedback_notes === "string"
            ? value.feedback_notes.trim()
            : "",
        created_at: value.confirmed_at || value.created_at || value.updated_at || null,
      };
    }

    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        return {
          confirmed:
            typeof parsed.confirmed === "boolean" ? parsed.confirmed : null,
          feedback_notes:
            typeof parsed.feedback_notes === "string"
              ? parsed.feedback_notes.trim()
              : "",
          created_at:
            parsed.confirmed_at || parsed.created_at || parsed.updated_at || null,
        };
      } catch {
        return null;
      }
    }

    return null;
  };

  const status = STATUS_CONFIG[data.status] || STATUS_CONFIG.new;
  const category = CATEGORIES.find((c) => c.value === data.category);
  const priority = PRIORITIES.find((p) => p.value === data.priority);
  const statusIcon = STATUS_ICONS[data.status] || "info";
  const contentPadding = { paddingBottom: (insets.bottom || 24) + 24 };

  const citizenConfirmation = parseCitizenConfirmation(data.citizen_confirmation);
  const isCreatorUser =
    user?.role === "user" &&
    (user?.id === data.creator?.id ||
      user?.id === data.creator_id ||
      user?.id === data.user_id);
  const canCitizenConfirm =
    data.status === "completed" && isCreatorUser && !citizenConfirmation;
  const shouldShowCitizenConfirmationSection =
    (data.status === "completed" && isCreatorUser) || !!citizenConfirmation;

  const formatCitizenConfirmationTime = (isoString) => {
    if (!isoString) return null;
    const d = new Date(isoString);
    return d.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const submitCitizenConfirmation = async (confirmed) => {
    try {
      setSubmittingConfirmation(true);
      const trimmedFeedback = feedback.trim();
      const res = await requestsApi.citizenConfirmRescue(
        data.id,
        confirmed,
        trimmedFeedback,
      );

      const returnedRequest =
        res?.data && typeof res.data === "object" && res.data.id ? res.data : null;

      const nextConfirmation =
        returnedRequest?.citizen_confirmation || {
          confirmed,
          feedback_notes: trimmedFeedback,
          created_at: new Date().toISOString(),
        };

      setData((prev) => ({
        ...(prev || {}),
        ...(returnedRequest || {}),
        citizen_confirmation: nextConfirmation,
      }));

      Alert.alert(
        "Đã gửi xác nhận",
        confirmed
          ? "Cảm ơn bạn đã xác nhận đã nhận được hỗ trợ."
          : "Phản hồi của bạn đã được gửi để đội ngũ kiểm tra thêm.",
      );
    } catch (error) {
      Alert.alert(
        "Không thể gửi xác nhận",
        error?.message || "Vui lòng thử lại sau ít phút.",
      );
    } finally {
      setSubmittingConfirmation(false);
    }
  };

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
      label: "Yêu cầu được tạo",
      date: new Date(data.created_at),
    });
  }
  if (data.verified_at) {
    timelineEvents.push({
      key: "verified",
      label: "Đã xác minh thông tin",
      date: new Date(data.verified_at),
    });
  }
  if (data.assigned_at) {
    timelineEvents.push({
      key: "assigned",
      label: "Đội cứu hộ đã tiếp nhận",
      date: new Date(data.assigned_at),
    });
  }
  if (data.completed_at) {
    timelineEvents.push({
      key: "completed",
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

  const hasGps =
    data.location_type === "gps" &&
    data.latitude != null &&
    data.longitude != null &&
    !isNaN(parseFloat(data.latitude)) &&
    !isNaN(parseFloat(data.longitude));

  const targetLat = hasGps ? parseFloat(data.latitude) : null;
  const targetLng = hasGps ? parseFloat(data.longitude) : null;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBack}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={20} color={COLORS.text} />
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

        {/* Thông tin yêu cầu */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="info" size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Thông tin yêu cầu</Text>
          </View>
          <Row icon="label" label="Loại yêu cầu" value={friendlyCategory} />
          <Row icon="location-on" label="Quận/Huyện" value={data.district} />
          <Row
            icon="groups"
            label="Số người"
            value={`${data.num_people} người`}
          />
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
                  style={[styles.priorityChipText, { color: priorityColor }]}
                >
                  {friendlyPriority}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Mô tả */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons
              name="description"
              size={18}
              color={COLORS.primary}
            />
            <Text style={styles.sectionTitle}>Mô tả tình huống</Text>
          </View>
          <Text style={styles.description}>"{data.description}"</Text>
        </View>

        {/* Vị trí */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="place" size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Vị trí</Text>
          </View>

          {hasGps ? (
            <>
              <Row icon="satellite-alt" label="Loại" value="GPS" />
              <Row
                icon="my-location"
                label="Tọa độ"
                value={`${targetLat.toFixed(6)}, ${targetLng.toFixed(6)}`}
              />
              {/* Inline MapView thay vì nút Google Maps */}
              <MapView
                style={styles.inlineMap}
                initialRegion={{
                  latitude: targetLat,
                  longitude: targetLng,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
              >
                <Marker
                  coordinate={{ latitude: targetLat, longitude: targetLng }}
                  title="Vị trí nạn nhân"
                  description={data.address || data.district}
                  pinColor="red"
                />
              </MapView>
              {data.address && (
                <Text style={styles.addressText}>📍 {data.address}</Text>
              )}
            </>
          ) : (
            <Row icon="home" label="Địa chỉ" value={data.address} />
          )}
        </View>

        {/* Người gửi */}
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

        {/* Đội cứu hộ */}
        {data.assigned_team && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="groups" size={18} color={COLORS.primary} />
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

        {/* Xác nhận từ người dân */}
        {shouldShowCitizenConfirmationSection && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="fact-check" size={18} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Xác nhận từ người dân</Text>
            </View>

            {citizenConfirmation ? (
              <View style={styles.confirmationResultCard}>
                <View
                  style={[
                    styles.confirmationBadge,
                    citizenConfirmation.confirmed === true
                      ? styles.confirmationBadgeSuccess
                      : styles.confirmationBadgeWarning,
                  ]}
                >
                  <MaterialIcons
                    name={
                      citizenConfirmation.confirmed === true
                        ? "check-circle"
                        : "error-outline"
                    }
                    size={16}
                    color={
                      citizenConfirmation.confirmed === true ? "#047857" : "#b45309"
                    }
                  />
                  <Text
                    style={[
                      styles.confirmationBadgeText,
                      citizenConfirmation.confirmed === true
                        ? styles.confirmationBadgeTextSuccess
                        : styles.confirmationBadgeTextWarning,
                    ]}
                  >
                    {citizenConfirmation.confirmed === true
                      ? "Đã xác nhận đã nhận hỗ trợ"
                      : "Đã báo chưa được giải quyết đầy đủ"}
                  </Text>
                </View>

                {citizenConfirmation.feedback_notes ? (
                  <Text style={styles.confirmationFeedbackText}>
                    {citizenConfirmation.feedback_notes}
                  </Text>
                ) : (
                  <Text style={styles.confirmationMutedText}>Không có phản hồi thêm.</Text>
                )}

                {formatCitizenConfirmationTime(citizenConfirmation.created_at) && (
                  <Text style={styles.confirmationMetaText}>
                    Gửi lúc {formatCitizenConfirmationTime(citizenConfirmation.created_at)}
                  </Text>
                )}
              </View>
            ) : canCitizenConfirm ? (
              <>
                <Text style={styles.confirmationHint}>
                  Vui lòng xác nhận kết quả hỗ trợ để hệ thống cập nhật chính xác.
                </Text>

                <TextInput
                  value={feedback}
                  onChangeText={setFeedback}
                  placeholder="Nhập phản hồi thêm (không bắt buộc)"
                  placeholderTextColor={COLORS.textLight}
                  multiline
                  textAlignVertical="top"
                  style={styles.feedbackInput}
                />

                <View style={styles.confirmationActions}>
                  <TouchableOpacity
                    style={[
                      styles.confirmActionBtn,
                      styles.confirmActionBtnPrimary,
                      submittingConfirmation && styles.confirmActionBtnDisabled,
                    ]}
                    activeOpacity={0.88}
                    disabled={submittingConfirmation}
                    onPress={() => submitCitizenConfirmation(true)}
                  >
                    <MaterialIcons name="check-circle" size={18} color="#fff" />
                    <Text style={styles.confirmActionBtnPrimaryText}>Đã nhận hỗ trợ</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.confirmActionBtn,
                      styles.confirmActionBtnSecondary,
                      submittingConfirmation && styles.confirmActionBtnDisabled,
                    ]}
                    activeOpacity={0.88}
                    disabled={submittingConfirmation}
                    onPress={() => submitCitizenConfirmation(false)}
                  >
                    <MaterialIcons name="report-problem" size={18} color="#b45309" />
                    <Text style={styles.confirmActionBtnSecondaryText}>
                      Chưa giải quyết đủ
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <Text style={styles.confirmationHint}>
                Trạng thái này không thể gửi xác nhận từ tài khoản hiện tại.
              </Text>
            )}
          </View>
        )}

        {/* Timeline */}
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
  inlineMap: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 8,
    marginBottom: 8,
  },
  addressText: {
    fontSize: 13,
    color: COLORS.textLight,
    lineHeight: 18,
    marginTop: 4,
  },
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
  requesterName: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  requesterRole: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
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
  priorityChipText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.6 },
  timelineSection: { paddingHorizontal: 8, paddingTop: 8 },
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
  timelineLeft: { width: 32, alignItems: "center" },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  timelineDotSuccess: { backgroundColor: "#10b981" },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: COLORS.primary + "33",
    marginTop: 2,
  },
  timelineContent: { flex: 1, paddingLeft: 4, gap: 2 },
  timelineTime: { fontSize: 11, color: COLORS.textLight },
  timelineTimeSuccess: { color: "#10b981", fontWeight: "700" },
  timelineLabel: { fontSize: 13, color: COLORS.text },
  timelineLabelStrong: { fontWeight: "700" },
  confirmationHint: {
    fontSize: 13,
    color: COLORS.textLight,
    lineHeight: 19,
    marginBottom: 12,
  },
  feedbackInput: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.25)",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  confirmationActions: {
    flexDirection: "row",
    gap: 10,
  },
  confirmActionBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 12,
  },
  confirmActionBtnPrimary: {
    backgroundColor: "#10b981",
  },
  confirmActionBtnSecondary: {
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fdba74",
  },
  confirmActionBtnDisabled: {
    opacity: 0.6,
  },
  confirmActionBtnPrimaryText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.white,
  },
  confirmActionBtnSecondaryText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#b45309",
  },
  confirmationResultCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.2)",
    padding: 12,
  },
  confirmationBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    marginBottom: 10,
  },
  confirmationBadgeSuccess: {
    backgroundColor: "#ecfdf5",
  },
  confirmationBadgeWarning: {
    backgroundColor: "#fffbeb",
  },
  confirmationBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  confirmationBadgeTextSuccess: {
    color: "#047857",
  },
  confirmationBadgeTextWarning: {
    color: "#b45309",
  },
  confirmationFeedbackText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  confirmationMutedText: {
    fontSize: 13,
    color: COLORS.textLight,
    fontStyle: "italic",
  },
  confirmationMetaText: {
    marginTop: 10,
    fontSize: 12,
    color: COLORS.textLight,
  },
});
