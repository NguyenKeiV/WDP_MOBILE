import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  FlatList,
  Keyboard,
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
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=vi`,
      { headers: { "User-Agent": "RescueApp/1.0" } },
    );
    const data = await res.json();
    return (
      data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
    );
  } catch {
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  }
}

async function searchAddress(query) {
  try {
    const encoded = encodeURIComponent(query + ", Việt Nam");
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=5&accept-language=vi&countrycodes=vn`,
      { headers: { "User-Agent": "RescueApp/1.0" } },
    );
    const data = await res.json();
    return data.map((item) => ({
      display_name: item.display_name,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
    }));
  } catch {
    return [];
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

  // Search
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchTimeout = useRef(null);

  useEffect(() => {
    initLocation();
  }, []);

  const initLocation = async () => {
    setLoadingLocation(true);
    try {
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
    Keyboard.dismiss();
    setSearchResults([]);
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setMarker({ latitude, longitude });
    setLoadingAddress(true);
    try {
      const addr = await reverseGeocode(latitude, longitude);
      setAddress(addr);
      setSearchText("");
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
      setSearchText("");
      setSearchResults([]);
      setLoadingAddress(false);
    } catch (e) {
      Alert.alert("Lỗi", "Không thể lấy vị trí hiện tại");
    }
  };

  const handleSearchChange = (text) => {
    setSearchText(text);
    setSearchResults([]);

    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (text.trim().length < 3) return;

    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchAddress(text);
        setSearchResults(results);
      } finally {
        setSearching(false);
      }
    }, 600);
  };

  const handleSelectResult = async (result) => {
    Keyboard.dismiss();
    setSearchResults([]);
    setSearchText(result.display_name);

    const { latitude, longitude } = result;
    const newRegion = {
      latitude,
      longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
    setMarker({ latitude, longitude });
    setAddress(result.display_name);
    mapRef.current?.animateToRegion(newRegion, 500);
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

      {/* Search box */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm địa chỉ..."
            value={searchText}
            onChangeText={handleSearchChange}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searching && (
            <ActivityIndicator size="small" color={COLORS.primary} />
          )}
        </View>

        {/* Search results dropdown */}
        {searchResults.length > 0 && (
          <FlatList
            style={styles.searchResults}
            data={searchResults}
            keyExtractor={(_, i) => i.toString()}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.searchResultItem}
                onPress={() => handleSelectResult(item)}
              >
                <Text style={styles.searchResultIcon}>📍</Text>
                <Text style={styles.searchResultText} numberOfLines={2}>
                  {item.display_name}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      {/* Instruction */}
      {searchResults.length === 0 && (
        <View style={styles.instructionBox}>
          <Text style={styles.instructionText}>
            Bấm vào bản đồ hoặc tìm địa chỉ để chọn vị trí
          </Text>
        </View>
      )}

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
  loadingText: { fontSize: 14, color: "#888" },
  map: { flex: 1 },

  searchContainer: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    zIndex: 10,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.97)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 5,
    gap: 8,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 14, color: "#222" },
  searchResults: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 200,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    gap: 8,
  },
  searchResultIcon: { fontSize: 14, marginTop: 1 },
  searchResultText: { fontSize: 13, color: "#333", flex: 1, lineHeight: 18 },

  instructionBox: {
    position: "absolute",
    top: 72,
    left: 16,
    right: 16,
    backgroundColor: "rgba(255,255,255,0.90)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: "center",
  },
  instructionText: { fontSize: 12, color: "#555", textAlign: "center" },

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
  coordLabel: { fontSize: 12, fontWeight: "700", color: "#333", width: 80 },
  coordText: { fontSize: 12, color: "#666", flex: 1 },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 16,
  },
  addressText: { fontSize: 13, color: "#333", flex: 1, lineHeight: 18 },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  confirmBtnDisabled: { opacity: 0.6 },
  confirmBtnText: { color: COLORS.white, fontWeight: "700", fontSize: 15 },
  cancelBtn: { alignItems: "center", paddingVertical: 8 },
  cancelBtnText: { fontSize: 14, color: "#888" },
  noMarker: { alignItems: "center", paddingVertical: 16, marginBottom: 10 },
  noMarkerText: { fontSize: 13, color: "#888" },
});
