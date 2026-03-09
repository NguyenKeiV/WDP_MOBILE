import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { COLORS } from "../../constants";

const INITIAL_REGION = {
  latitude: 10.7769,
  longitude: 106.7009,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

async function reverseGeocode(latitude, longitude) {
  try {
    const results = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (results && results.length > 0) {
      const r = results[0];
      const parts = [
        r.streetNumber,
        r.street,
        r.subregion || r.district,
        r.city,
        r.region,
      ].filter(Boolean);
      return parts.join(", ");
    }
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  } catch {
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  }
}

export default function MapPickerScreen({ navigation, route }) {
  const { onConfirm, initialLatitude, initialLongitude } = route.params || {};
  const mapRef = useRef(null);

  const [region, setRegion] = useState(INITIAL_REGION);
  const [marker, setMarker] = useState(null);
  const [address, setAddress] = useState("");
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    initLocation();
  }, []);

  const initLocation = async () => {
    setLoadingLocation(true);
    try {
      // Nếu có vị trí ban đầu (edit mode)
      if (initialLatitude && initialLongitude) {
        const lat = parseFloat(initialLatitude);
        const lng = parseFloat(initialLongitude);
        const newRegion = {
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setRegion(newRegion);
        setMarker({ latitude: lat, longitude: lng });
        const addr = await reverseGeocode(lat, lng);
        setAddress(addr);
        return;
      }

      // Lấy vị trí hiện tại
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLoadingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;
      const newRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(newRegion);
      setMarker({ latitude, longitude });

      const addr = await reverseGeocode(latitude, longitude);
      setAddress(addr);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleMapPress = async (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setMarker({ latitude, longitude });
    setLoadingAddress(true);
    try {
      const addr = await reverseGeocode(latitude, longitude);
      setAddress(addr);
    } finally {
      setLoadingAddress(false);
    }
  };

  const handleMyLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Lỗi", "Không có quyền truy cập vị trí");
        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const { latitude, longitude } = location.coords;
      const newRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(newRegion);
      setMarker({ latitude, longitude });
      mapRef.current?.animateToRegion(newRegion, 500);
      setLoadingAddress(true);
      const addr = await reverseGeocode(latitude, longitude);
      setAddress(addr);
      setLoadingAddress(false);
    } catch (e) {
      Alert.alert("Lỗi", "Không thể lấy vị trí hiện tại");
    }
  };

  const handleConfirm = async () => {
    if (!marker) {
      Alert.alert("Chưa chọn vị trí", "Vui lòng bấm vào bản đồ để chọn vị trí");
      return;
    }
    setConfirming(true);
    try {
      onConfirm({
        latitude: marker.latitude,
        longitude: marker.longitude,
        address,
      });
      navigation.goBack();
    } finally {
      setConfirming(false);
    }
  };

  if (loadingLocation) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang lấy vị trí...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        onPress={handleMapPress}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {marker && (
          <Marker
            coordinate={marker}
            title="Vị trí cần cứu hộ"
            description={address}
            pinColor={COLORS.primary}
          />
        )}
      </MapView>

      {/* Top instruction */}
      <View style={styles.instructionBox}>
        <Text style={styles.instructionText}>
          📍 Bấm vào bản đồ để chọn vị trí cần cứu hộ
        </Text>
      </View>

      {/* My location button */}
      <TouchableOpacity style={styles.myLocationBtn} onPress={handleMyLocation}>
        <Text style={styles.myLocationIcon}>🎯</Text>
      </TouchableOpacity>

      {/* Bottom panel */}
      <View style={styles.bottomPanel}>
        {marker ? (
          <>
            <View style={styles.coordRow}>
              <Text style={styles.coordLabel}>📍 Tọa độ:</Text>
              <Text style={styles.coordText}>
                {marker.latitude.toFixed(6)}, {marker.longitude.toFixed(6)}
              </Text>
            </View>

            <View style={styles.addressRow}>
              <Text style={styles.coordLabel}>🏠 Địa chỉ:</Text>
              {loadingAddress ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Text style={styles.addressText} numberOfLines={2}>
                  {address || "Đang xác định địa chỉ..."}
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.confirmBtn,
                confirming && styles.confirmBtnDisabled,
              ]}
              onPress={handleConfirm}
              disabled={confirming}
            >
              <Text style={styles.confirmBtnText}>
                {confirming ? "Đang xác nhận..." : "✅ Xác nhận vị trí này"}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.noMarker}>
            <Text style={styles.noMarkerText}>
              Chưa chọn vị trí — bấm vào bản đồ
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelBtnText}>Hủy</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: { fontSize: 14, color: COLORS.textLight },
  map: { flex: 1 },
  instructionBox: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  instructionText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: "600",
    textAlign: "center",
  },
  myLocationBtn: {
    position: "absolute",
    right: 16,
    bottom: 260,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  myLocationIcon: { fontSize: 22 },
  bottomPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  coordRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  coordLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.text,
    width: 80,
  },
  coordText: { fontSize: 12, color: COLORS.textLight, flex: 1 },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 16,
  },
  addressText: { fontSize: 13, color: COLORS.text, flex: 1, lineHeight: 18 },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  confirmBtnDisabled: { opacity: 0.6 },
  confirmBtnText: { color: COLORS.white, fontWeight: "700", fontSize: 15 },
  cancelBtn: {
    alignItems: "center",
    paddingVertical: 8,
  },
  cancelBtnText: { fontSize: 14, color: COLORS.textLight },
  noMarker: { alignItems: "center", paddingVertical: 16, marginBottom: 10 },
  noMarkerText: { fontSize: 13, color: COLORS.textLight },
});
