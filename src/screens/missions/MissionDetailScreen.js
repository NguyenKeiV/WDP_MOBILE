import React, { useState, useEffect, useRef } from "react";
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
  Dimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import * as Location from "expo-location";
import { missionsApi } from "../../api/missions";
import { COLORS, CATEGORIES } from "../../constants";

const { width } = Dimensions.get("window");

const PRIORITY_CONFIG = {
  urgent: { label: "🔴 Khẩn cấp", color: "#E53935", bg: "#FFEBEE" },
  high: { label: "🟠 Cao", color: "#F57C00", bg: "#FFF3E0" },
  medium: { label: "🟡 Trung bình", color: "#F9A825", bg: "#FFFDE7" },
  low: { label: "🟢 Thấp", color: "#388E3C", bg: "#E8F5E9" },
};

async function fetchRoute(fromLat, fromLng, toLat, toLng) {
  try {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`,
      { headers: { "User-Agent": "RescueApp/1.0" } },
    );
    const data = await res.json();
    if (data.routes && data.routes.length > 0) {
      const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => ({
        latitude: lat,
        longitude: lng,
      }));
      const distance = (data.routes[0].distance / 1000).toFixed(1);
      const duration = Math.round(data.routes[0].duration / 60);
      return { coords, distance, duration };
    }
    return null;
  } catch {
    return null;
  }
}

export default function MissionDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { mission, team } = route.params;
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [myLocation, setMyLocation] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const mapRef = useRef(null);

  const category = CATEGORIES.find((c) => c.value === mission.category);
  const priority = PRIORITY_CONFIG[mission.priority];

  const targetLat = parseFloat(mission.latitude);
  const targetLng = parseFloat(mission.longitude);
  const hasGps = !isNaN(targetLat) && !isNaN(targetLng);

  useEffect(() => {
    if (hasGps) initRouting();
  }, []);

  const initRouting = async () => {
    setLoadingRoute(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = loc.coords;
      setMyLocation({ latitude, longitude });

      const result = await fetchRoute(
        latitude,
        longitude,
        targetLat,
        targetLng,
      );
      if (result) {
        setRouteCoords(result.coords);
        setRouteInfo({ distance: result.distance, duration: result.duration });

        // Fit map to show both points
        setTimeout(() => {
          mapRef.current?.fitToCoordinates(
            [
              { latitude, longitude },
              { latitude: targetLat, longitude: targetLng },
            ],
            {
              edgePadding: { top: 60, right: 40, bottom: 40, left: 40 },
              animated: true,
            },
          );
        }, 500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRoute(false);
    }
  };

  const handleCall = () => {
    Linking.openURL(`tel:${mission.phone_number}`);
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

  const contentPadding = { paddingBottom: (insets.bottom || 24) + 24 };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, contentPadding]}
        showsVerticalScrollIndicator={false}
      >
        {/* Status banner */}
        <View style={styles.statusBanner}>
          <MaterialIcons name="local-shipping" size={24} color={COLORS.primary} />
          <Text style={styles.statusBannerText}>Đang thực hiện cứu hộ</Text>
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

        {/* Map inline */}
        {hasGps && (
          <View style={styles.card}>
            <View style={styles.mapHeader}>
              <Text style={styles.sectionTitle}>Bản đồ chỉ đường</Text>
              <TouchableOpacity onPress={() => setShowMap((v) => !v)}>
                <Text style={styles.toggleMap}>
                  {showMap ? "Thu gọn" : "Mở rộng"}
                </Text>
              </TouchableOpacity>
            </View>

            {showMap && (
              <>
                {/* Route info */}
                {routeInfo && (
                  <View style={styles.routeInfo}>
                    <View style={styles.routeInfoItem}>
                      <Text style={styles.routeInfoIcon}>📏</Text>
                      <Text style={styles.routeInfoText}>
                        {routeInfo.distance} km
                      </Text>
                    </View>
                    <View style={styles.routeInfoDivider} />
                    <View style={styles.routeInfoItem}>
                      <Text style={styles.routeInfoIcon}>⏱️</Text>
                      <Text style={styles.routeInfoText}>
                        ~{routeInfo.duration} phút
                      </Text>
                    </View>
                    <View style={styles.routeInfoDivider} />
                    <View style={styles.routeInfoItem}>
                      <Text style={styles.routeInfoIcon}>🚗</Text>
                      <Text style={styles.routeInfoText}>Đường bộ</Text>
                    </View>
                  </View>
                )}

                {loadingRoute && (
                  <View style={styles.mapLoading}>
                    <ActivityIndicator color={COLORS.primary} />
                    <Text style={styles.mapLoadingText}>
                      Đang tải tuyến đường...
                    </Text>
                  </View>
                )}

                <MapView
                  ref={mapRef}
                  style={styles.map}
                  initialRegion={{
                    latitude: targetLat,
                    longitude: targetLng,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                  }}
                  showsUserLocation
                  showsMyLocationButton={false}
                >
                  {/* Marker nạn nhân */}
                  <Marker
                    coordinate={{ latitude: targetLat, longitude: targetLng }}
                    title="Vị trí nạn nhân"
                    description={mission.address || mission.district}
                    pinColor="red"
                  />

                  {/* Marker vị trí đội */}
                  {myLocation && (
                    <Marker
                      coordinate={myLocation}
                      title="Vị trí của bạn"
                      pinColor="blue"
                    />
                  )}

                  {/* Đường đi */}
                  {routeCoords.length > 0 && (
                    <Polyline
                      coordinates={routeCoords}
                      strokeColor={COLORS.primary}
                      strokeWidth={4}
                      lineDashPattern={[0]}
                    />
                  )}
                </MapView>

                <TouchableOpacity
                  style={styles.refreshRouteBtn}
                  onPress={initRouting}
                >
                  <Text style={styles.refreshRouteBtnText}>
                    🔄 Cập nhật tuyến đường
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* Description */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="description" size={18} color={COLORS.textLight} />
            <Text style={styles.sectionTitle}>Mô tả tình huống</Text>
          </View>
          <Text style={styles.descText}>{mission.description}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <MaterialIcons name="groups" size={16} color={COLORS.textLight} />
              <Text style={styles.metaValue}>{mission.num_people} người</Text>
            </View>
            <View style={styles.metaItem}>
              <MaterialIcons
                name="location-on"
                size={16}
                color={COLORS.textLight}
              />
              <Text style={styles.metaValue}>{mission.district}</Text>
            </View>
          </View>
        </View>

        {/* Contact */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="call" size={18} color={COLORS.textLight} />
            <Text style={styles.sectionTitle}>Liên hệ người cần cứu hộ</Text>
          </View>
          <TouchableOpacity style={styles.contactBtn} onPress={handleCall}>
            <MaterialIcons name="call" size={22} color={COLORS.white} />
            <Text style={styles.contactBtnText}>Gọi {mission.phone_number}</Text>
          </TouchableOpacity>
        </View>

        {/* Location text */}
        {hasGps && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <MaterialIcons
                name="location-on"
                size={18}
                color={COLORS.textLight}
              />
              <Text style={styles.sectionTitle}>Vị trí GPS</Text>
            </View>
            <Text style={styles.coordText}>
              {targetLat.toFixed(6)}, {targetLng.toFixed(6)}
            </Text>
            {mission.address && (
              <Text style={styles.addressText}>{mission.address}</Text>
            )}
          </View>
        )}

        {/* Team info */}
        {team && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="groups" size={18} color={COLORS.textLight} />
              <Text style={styles.sectionTitle}>Thông tin đội</Text>
            </View>
            <Text style={styles.teamName}>{team.name}</Text>
            <View style={styles.teamInfoRow}>
              <MaterialIcons name="person" size={16} color={COLORS.textLight} />
              <Text style={styles.teamInfo}>Đội trưởng: {team.leader_name}</Text>
            </View>
            <View style={styles.teamInfoRow}>
              <MaterialIcons name="call" size={16} color={COLORS.textLight} />
              <Text style={styles.teamInfo}>{team.phone_number}</Text>
            </View>
            <View style={styles.teamInfoRow}>
              <MaterialIcons
                name="location-on"
                size={16}
                color={COLORS.textLight}
              />
              <Text style={styles.teamInfo}>{team.district}</Text>
            </View>
          </View>
        )}

        {/* Time */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="schedule" size={18} color={COLORS.textLight} />
            <Text style={styles.sectionTitle}>Thời gian</Text>
          </View>
          <View style={styles.timeRow}>
            <MaterialIcons name="event" size={16} color={COLORS.textLight} />
            <Text style={styles.timeText}>
              Tạo lúc: {new Date(mission.created_at).toLocaleString("vi-VN")}
            </Text>
          </View>
          {mission.assigned_at && (
            <View style={styles.timeRow}>
              <MaterialIcons
                name="assignment"
                size={16}
                color={COLORS.textLight}
              />
              <Text style={styles.timeText}>
                Phân công:{" "}
                {new Date(mission.assigned_at).toLocaleString("vi-VN")}
              </Text>
            </View>
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
              <>
                <MaterialIcons
                  name="check-circle"
                  size={24}
                  color={COLORS.white}
                />
                <Text style={styles.completeBtnText}>Hoàn thành nhiệm vụ</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {completed && (
          <View style={styles.completedBanner}>
            <MaterialIcons
              name="check-circle"
              size={32}
              color="#388E3C"
            />
            <Text style={styles.completedText}>Nhiệm vụ đã hoàn thành</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.grayLight },
  content: { padding: 16, paddingBottom: 40 },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: COLORS.primary + "15",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.primary + "30",
  },
  statusBannerText: { color: COLORS.primary, fontWeight: "700", fontSize: 16 },
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

  mapHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  toggleMap: { fontSize: 13, color: COLORS.primary, fontWeight: "600" },
  routeInfo: {
    flexDirection: "row",
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    alignItems: "center",
    justifyContent: "space-around",
  },
  routeInfoItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  routeInfoIcon: { fontSize: 14 },
  routeInfoText: { fontSize: 13, fontWeight: "600", color: COLORS.text },
  routeInfoDivider: { width: 1, height: 20, backgroundColor: "#DDD" },
  mapLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
  },
  mapLoadingText: { fontSize: 13, color: COLORS.textLight },
  map: {
    width: "100%",
    height: 280,
    borderRadius: 12,
    overflow: "hidden",
  },
  refreshRouteBtn: {
    marginTop: 10,
    alignItems: "center",
    padding: 8,
  },
  refreshRouteBtnText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "600",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textLight,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  descText: { fontSize: 14, color: COLORS.text, lineHeight: 22, marginBottom: 12 },
  metaRow: { flexDirection: "row", gap: 24 },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaLabel: { fontSize: 12, color: COLORS.textLight },
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
    marginBottom: 4,
  },
  addressText: { fontSize: 13, color: COLORS.textLight, lineHeight: 18 },
  teamName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.black,
    marginBottom: 6,
  },
  teamInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  teamInfo: { fontSize: 13, color: COLORS.text },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  timeText: { fontSize: 13, color: COLORS.text },
  completeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#388E3C",
    borderRadius: 14,
    padding: 18,
    marginTop: 8,
  },
  completeBtnText: { color: COLORS.white, fontSize: 17, fontWeight: "800" },
  completedBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#E8F5E9",
    borderRadius: 14,
    padding: 18,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#388E3C30",
  },
  completedText: { color: "#388E3C", fontSize: 17, fontWeight: "800" },
});
