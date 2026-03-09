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
import { requestsApi } from "../../api/requests";
import { COLORS, STATUS_CONFIG, CATEGORIES, PRIORITIES } from "../../constants";

export default function RequestDetailScreen({ route, navigation }) {
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
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!data) return null;

  const status = STATUS_CONFIG[data.status] || STATUS_CONFIG.new;
  const category = CATEGORIES.find((c) => c.value === data.category);
  const priority = PRIORITIES.find((p) => p.value === data.priority);

  const Row = ({ icon, label, value, valueStyle }) => (
    <View style={styles.row}>
      <Text style={styles.rowIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={[styles.rowValue, valueStyle]}>{value || "—"}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.statusBanner, { backgroundColor: status.bg }]}>
        <Text style={[styles.statusText, { color: status.color }]}>
          {status.icon} {status.label}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin yêu cầu</Text>
        <Row
          icon="🏷️"
          label="Loại yêu cầu"
          value={category?.label || data.category}
        />
        <Row icon="📍" label="Quận/Huyện" value={data.district} />
        <Row icon="👥" label="Số người" value={`${data.num_people} người`} />
        {priority && (
          <Row icon="⚡" label="Mức ưu tiên" value={priority.label} />
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mô tả tình huống</Text>
        <Text style={styles.description}>{data.description}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vị trí</Text>
        {data.location_type === "gps" ? (
          <>
            <Row icon="🛰️" label="Loại" value="GPS" />
            <Row
              icon="📌"
              label="Tọa độ"
              value={`${data.latitude}, ${data.longitude}`}
            />
            <TouchableOpacity
              style={styles.mapBtn}
              onPress={() =>
                Linking.openURL(
                  `https://www.google.com/maps?q=${data.latitude},${data.longitude}`,
                )
              }
            >
              <Text style={styles.mapBtnText}>🗺️ Xem trên Google Maps</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Row icon="📋" label="Địa chỉ" value={data.address} />
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Liên hệ</Text>
        <TouchableOpacity
          onPress={() => Linking.openURL(`tel:${data.phone_number}`)}
        >
          <Row
            icon="📞"
            label="Số điện thoại"
            value={data.phone_number}
            valueStyle={{
              color: COLORS.secondary,
              textDecorationLine: "underline",
            }}
          />
        </TouchableOpacity>
        {data.creator && (
          <Row icon="👤" label="Người tạo" value={data.creator.username} />
        )}
      </View>

      {data.assigned_team && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Đội cứu hộ</Text>
          <Row icon="🚒" label="Tên đội" value={data.assigned_team.name} />
          <Row icon="📍" label="Quận" value={data.assigned_team.district} />

          <TouchableOpacity
            onPress={() =>
              Linking.openURL(`tel:${data.assigned_team.phone_number}`)
            }
          >
            <Row
              icon="📞"
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
          <Text style={styles.sectionTitle}>Ghi chú</Text>
          <Text style={styles.description}>{data.notes}</Text>
        </View>
      )}

      <View style={[styles.section, styles.timestamps]}>
        <Text style={styles.timestamp}>
          🕐 Tạo lúc: {new Date(data.created_at).toLocaleString("vi-VN")}
        </Text>
        {data.verified_at && (
          <Text style={styles.timestamp}>
            ✅ Duyệt lúc: {new Date(data.verified_at).toLocaleString("vi-VN")}
          </Text>
        )}
        {data.assigned_at && (
          <Text style={styles.timestamp}>
            🚨 Phân công lúc:{" "}
            {new Date(data.assigned_at).toLocaleString("vi-VN")}
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.grayLight },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { padding: 16, paddingBottom: 32 },
  statusBanner: {
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
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
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  row: { flexDirection: "row", alignItems: "flex-start", marginBottom: 10 },
  rowIcon: { fontSize: 16, marginRight: 10, marginTop: 1 },
  rowLabel: { fontSize: 11, color: COLORS.textLight, marginBottom: 2 },
  rowValue: { fontSize: 14, color: COLORS.text, fontWeight: "500" },
  description: { fontSize: 14, color: COLORS.text, lineHeight: 22 },
  mapBtn: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    marginTop: 4,
  },
  mapBtnText: { color: COLORS.primary, fontWeight: "600", fontSize: 14 },
  timestamps: { gap: 6 },
  timestamp: { fontSize: 12, color: COLORS.textLight },
});
