import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { COLORS } from "../../constants";
import { VOLUNTEER_INVITATION_STATUS } from "../../constants/volunteer";
import { volunteerCampaignApi } from "../../api/volunteerCampaign";

const C = {
  primary: COLORS.primary,
  text: "#0f172a",
  textMuted: "hsl(210, 5%, 50%)",
  cardBorder: "hsl(210, 5%, 92%)",
  white: "#ffffff",
  success: "#2E7D32",
  successBg: "#E8F5E9",
  danger: "#B71C1C",
  dangerBg: "#FFEBEE",
};

function formatVietnameseDateTime(isoString) {
  if (!isoString) return "—";
  const date = new Date(isoString);
  return (
    date.toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "numeric",
      month: "numeric",
      year: "numeric",
    }) +
    " lúc " +
    date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    })
  );
}

export default function InvitationDetailScreen({ route, navigation }) {
  const { invitation: initialInvitation } = route.params;
  const insets = useSafeAreaInsets();

  const [invitation, setInvitation] = useState(
    initialInvitation || null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [declineModalVisible, setDeclineModalVisible] = useState(false);
  const [declinedReason, setDeclinedReason] = useState("");

  const handleAccept = async () => {
    Alert.alert(
      "Xác nhận tham gia",
      "Bạn có chắc muốn tham gia đợt tình nguyện này?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Tham gia",
          onPress: async () => {
            setSubmitting(true);
            try {
              const res = await volunteerCampaignApi.respondToInvitation(
                invitation.id,
                { accept: true },
              );
              setInvitation(res.data);
              Alert.alert(
                "Thành công",
                res.message ||
                  "Bạn đã xác nhận tham gia đợt tình nguyện",
              );
            } catch (e) {
              Alert.alert(
                "Lỗi",
                e.message || "Không thể xác nhận. Vui lòng thử lại.",
              );
            } finally {
              setSubmitting(false);
            }
          },
        },
      ],
    );
  };

  const handleDecline = async () => {
    if (declinedReason.trim().length < 3) {
      Alert.alert(
        "Thông báo",
        "Vui lòng nhập lý do từ chối (ít nhất 3 ký tự).",
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await volunteerCampaignApi.respondToInvitation(
        invitation.id,
        { accept: false, declined_reason: declinedReason.trim() },
      );
      setInvitation(res.data);
      setDeclineModalVisible(false);
      setDeclinedReason("");
    } catch (e) {
      Alert.alert(
        "Lỗi",
        e.message || "Không thể từ chối. Vui lòng thử lại.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!invitation) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={{ color: C.textMuted }}>Không có dữ liệu lời mời</Text>
      </SafeAreaView>
    );
  }

  const campaign = invitation.campaign || {};
  const status = invitation.status || "pending";
  const st =
    VOLUNTEER_INVITATION_STATUS[status] ||
    VOLUNTEER_INVITATION_STATUS.pending;
  const isPending = status === "pending";
  const isAccepted = status === "accepted";
  const isDeclined = status === "declined";

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statusBanner}>
          <View style={[styles.pill, { backgroundColor: st.bg }]}>
            <Text style={[styles.pillText, { color: st.color }]}>{st.label}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>{campaign.title}</Text>
          {!!campaign.description && (
            <Text style={styles.description}>{campaign.description}</Text>
          )}
        </View>

        {!!campaign.location && (
          <View style={styles.detailRow}>
            <MaterialIcons name="place" size={20} color={C.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>Địa điểm</Text>
              <Text style={styles.detailValue}>{campaign.location}</Text>
            </View>
          </View>
        )}

        {!!campaign.district && (
          <View style={styles.detailRow}>
            <MaterialIcons name="map" size={20} color={C.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>Khu vực</Text>
              <Text style={styles.detailValue}>{campaign.district}</Text>
            </View>
          </View>
        )}

        {!!campaign.scheduled_at && (
          <View style={styles.detailRow}>
            <MaterialIcons name="event" size={20} color={C.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>Ngày giờ bắt đầu</Text>
              <Text style={styles.detailValue}>
                {formatVietnameseDateTime(campaign.scheduled_at)}
              </Text>
            </View>
          </View>
        )}

        {!!campaign.end_at && (
          <View style={styles.detailRow}>
            <MaterialIcons name="event-busy" size={20} color={C.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>Ngày giờ kết thúc</Text>
              <Text style={styles.detailValue}>
                {formatVietnameseDateTime(campaign.end_at)}
              </Text>
            </View>
          </View>
        )}

        {!!campaign.max_volunteers && (
          <View style={styles.detailRow}>
            <MaterialIcons name="group" size={20} color={C.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>Số lượng tình nguyện viên tối đa</Text>
              <Text style={styles.detailValue}>{campaign.max_volunteers} người</Text>
            </View>
          </View>
        )}

        {isAccepted && (
          <View style={styles.acceptedBanner}>
            <MaterialIcons name="check-circle" size={28} color={C.success} />
            <Text style={styles.acceptedText}>Bạn đã xác nhận tham gia</Text>
          </View>
        )}

        {isDeclined && !!invitation?.declined_reason && (
          <View style={styles.declinedBanner}>
            <MaterialIcons name="cancel" size={28} color={C.danger} />
            <View style={{ flex: 1 }}>
              <Text style={styles.declinedBannerTitle}>Bạn đã từ chối</Text>
              <Text style={styles.declinedBannerReason}>
                Lý do: {invitation.declined_reason}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {isPending && (
        <View style={[styles.actionBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity
            style={[styles.btnDecline, submitting && styles.btnDisabled]}
            activeOpacity={0.8}
            disabled={submitting}
            onPress={() => setDeclineModalVisible(true)}
          >
            <Text style={styles.btnDeclineText}>Không tham gia</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btnAccept, submitting && styles.btnDisabled]}
            activeOpacity={0.8}
            disabled={submitting}
            onPress={handleAccept}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={C.white} />
            ) : (
              <Text style={styles.btnAcceptText}>Tham gia</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={declineModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeclineModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Lý do từ chối</Text>
            <Text style={styles.modalSubtitle}>
              Vui lòng cho chúng tôi biết lý do bạn không thể tham gia.
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="VD: Trùng lịch công tác"
              placeholderTextColor="#94a3b8"
              value={declinedReason}
              onChangeText={setDeclinedReason}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => {
                  setDeclineModalVisible(false);
                  setDeclinedReason("");
                }}
              >
                <Text style={styles.modalBtnCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtnSubmit, submitting && styles.btnDisabled]}
                disabled={submitting}
                onPress={handleDecline}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={C.white} />
                ) : (
                  <Text style={styles.modalBtnSubmitText}>Gửi</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8fafc" },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16 },
  statusBanner: { marginBottom: 16, flexDirection: "row" },
  pill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
  pillText: { fontSize: 12, fontWeight: "700" },
  section: { marginBottom: 20 },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: C.text,
    lineHeight: 28,
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: C.textMuted,
    lineHeight: 22,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    marginBottom: 18,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: C.cardBorder,
  },
  detailLabel: {
    fontSize: 12,
    color: C.textMuted,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    color: C.text,
    lineHeight: 20,
  },
  acceptedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: C.successBg,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  acceptedText: {
    fontSize: 15,
    fontWeight: "700",
    color: C.success,
    flex: 1,
  },
  declinedBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: C.dangerBg,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  declinedBannerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: C.danger,
    marginBottom: 4,
  },
  declinedBannerReason: {
    fontSize: 14,
    color: C.danger,
    lineHeight: 20,
  },
  actionBar: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: C.cardBorder,
    backgroundColor: C.white,
  },
  btnDecline: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: C.danger,
    alignItems: "center",
  },
  btnDeclineText: { fontSize: 15, fontWeight: "700", color: C.danger },
  btnAccept: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: C.success,
    alignItems: "center",
  },
  btnAcceptText: { fontSize: 15, fontWeight: "700", color: C.white },
  btnDisabled: { opacity: 0.6 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: C.text,
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 14,
    color: C.textMuted,
    marginBottom: 16,
    lineHeight: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: C.text,
    backgroundColor: "#f8fafc",
    minHeight: 80,
    marginBottom: 16,
  },
  modalActions: { flexDirection: "row", gap: 12 },
  modalBtnCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.cardBorder,
    alignItems: "center",
  },
  modalBtnCancelText: { fontSize: 15, fontWeight: "700", color: C.textMuted },
  modalBtnSubmit: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: C.danger,
    alignItems: "center",
  },
  modalBtnSubmitText: { fontSize: 15, fontWeight: "700", color: C.white },
});
