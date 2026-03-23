import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ToastAndroid,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect } from "@react-navigation/native";

import { charityCampaignApi } from "../../api/charityCampaign";
import { COLORS } from "../../constants";

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function showToast(message) {
  if (Platform.OS === "android") {
    ToastAndroid.show(message, ToastAndroid.SHORT);
    return;
  }
  Alert.alert("Thông báo", message);
}

function SkeletonBox({ height }) {
  return <View style={[styles.skeleton, { height }]} />;
}

function LoadingSkeleton() {
  return (
    <View style={styles.skeletonWrap}>
      <SkeletonBox height={220} />
      <SkeletonBox height={30} />
      <SkeletonBox height={58} />
      <SkeletonBox height={58} />
      <SkeletonBox height={90} />
      <SkeletonBox height={58} />
    </View>
  );
}

export default function CharityCampaignDetailScreen({ route }) {
  const campaignId = route?.params?.campaign_id || route?.params?.campaignId;

  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorType, setErrorType] = useState(null); // null | network | not_found
  const [selectedPoster, setSelectedPoster] = useState(0);

  const load = useCallback(async () => {
    if (!campaignId) {
      setErrorType("not_found");
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorType(null);

    try {
      const res = await charityCampaignApi.getById(campaignId);
      setCampaign(res?.data || null);
      setSelectedPoster(0);
    } catch (e) {
      const status = e?.status || e?.response?.status;
      if (status === 404) {
        setErrorType("not_found");
      } else if ((e?.message || "").toLowerCase().includes("not found")) {
        setErrorType("not_found");
      } else {
        setErrorType("network");
        showToast("Lỗi mạng, vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const posterUrls = useMemo(() => {
    const raw = campaign?.poster_urls;
    if (!Array.isArray(raw)) return [];
    return raw.filter((item) => typeof item === "string" && item.trim());
  }, [campaign?.poster_urls]);

  const mainPosterUri = posterUrls[selectedPoster] || null;

  const statusConfig = useMemo(() => {
    const value = String(campaign?.status || "inactive").toLowerCase();
    if (value === "active") {
      return {
        label: "Đang hiệu lực",
        bg: "#E8F5E9",
        color: "#2E7D32",
      };
    }
    return {
      label: "Không hiệu lực",
      bg: "#FFF4E5",
      color: "#B45309",
    };
  }, [campaign?.status]);

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        {loading ? <LoadingSkeleton /> : null}

        {!loading && errorType === "not_found" ? (
          <View style={styles.stateWrap}>
            <MaterialIcons name="error-outline" size={46} color="#94a3b8" />
            <Text style={styles.stateTitle}>Không tìm thấy đợt quyên góp</Text>
          </View>
        ) : null}

        {!loading && errorType === "network" ? (
          <View style={styles.stateWrap}>
            <MaterialIcons name="wifi-off" size={46} color="#94a3b8" />
            <Text style={styles.stateTitle}>Không thể tải dữ liệu</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={load}>
              <Text style={styles.retryBtnText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!loading && !errorType && campaign ? (
          <>
            <View style={styles.posterWrap}>
              {mainPosterUri ? (
                <Image
                  source={{ uri: mainPosterUri }}
                  style={styles.posterMain}
                />
              ) : (
                <View style={styles.posterPlaceholder}>
                  <MaterialIcons
                    name="image-not-supported"
                    size={46}
                    color="#94a3b8"
                  />
                  <Text style={styles.posterPlaceholderText}>
                    Chưa có poster
                  </Text>
                </View>
              )}

              {posterUrls.length > 1 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.thumbList}
                >
                  {posterUrls.map((uri, index) => {
                    const active = index === selectedPoster;
                    return (
                      <TouchableOpacity
                        key={`${uri}-${index}`}
                        onPress={() => setSelectedPoster(index)}
                        style={[
                          styles.thumbItem,
                          active && styles.thumbItemActive,
                        ]}
                      >
                        <Image source={{ uri }} style={styles.thumbImage} />
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              ) : null}
            </View>

            <View style={styles.section}>
              <View style={styles.titleRow}>
                <Text style={styles.name}>{campaign.name || "-"}</Text>
                <View
                  style={[styles.badge, { backgroundColor: statusConfig.bg }]}
                >
                  <Text
                    style={[styles.badgeText, { color: statusConfig.color }]}
                  >
                    {statusConfig.label}
                  </Text>
                </View>
              </View>
            </View>

            {String(campaign.status).toLowerCase() !== "active" ? (
              <View style={styles.warningBox}>
                <MaterialIcons name="info-outline" size={18} color="#B45309" />
                <Text style={styles.warningText}>
                  Đợt này hiện không còn hiệu lực
                </Text>
              </View>
            ) : null}

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Thông tin địa điểm</Text>
              <Text style={styles.sectionValue}>{campaign.address || "-"}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Thời gian</Text>
              <Text style={styles.sectionValue}>
                {campaign.end_at
                  ? `${formatDate(campaign.start_at)} - ${formatDate(campaign.end_at)}`
                  : formatDate(campaign.start_at)}
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Lý do</Text>
              <Text style={styles.sectionValue}>{campaign.reason || "-"}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Tổ chức/Người tạo</Text>
              <Text style={styles.sectionValue}>
                {campaign.manager?.username || "-"}
              </Text>
            </View>
          </>
        ) : null}
      </ScrollView>

      {loading ? (
        <View style={styles.loadingFloat}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 16, paddingBottom: 40, gap: 12 },

  skeletonWrap: { gap: 12 },
  skeleton: {
    width: "100%",
    borderRadius: 12,
    backgroundColor: "#e2e8f0",
  },

  stateWrap: {
    marginTop: 80,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  stateTitle: { fontSize: 16, fontWeight: "700", color: "#334155" },
  retryBtn: {
    marginTop: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryBtnText: { color: "#fff", fontWeight: "700" },

  posterWrap: { gap: 10 },
  posterMain: { width: "100%", height: 220, borderRadius: 14 },
  posterPlaceholder: {
    width: "100%",
    height: 220,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#f1f5f9",
  },
  posterPlaceholderText: { fontSize: 13, color: "#64748b" },
  thumbList: { gap: 8 },
  thumbItem: {
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "transparent",
    overflow: "hidden",
  },
  thumbItemActive: { borderColor: COLORS.primary },
  thumbImage: { width: 70, height: 70 },

  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  name: { flex: 1, fontSize: 20, fontWeight: "800", color: "#0f172a" },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  badgeText: { fontWeight: "700", fontSize: 12 },

  warningBox: {
    borderWidth: 1,
    borderColor: "#FCD34D",
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  warningText: { color: "#92400E", fontSize: 13, fontWeight: "600" },

  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748b",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionValue: { fontSize: 15, color: "#0f172a", lineHeight: 22 },

  loadingFloat: {
    position: "absolute",
    right: 16,
    top: 16,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
