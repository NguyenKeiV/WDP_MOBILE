import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  ScrollView,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { COLORS } from "../constants";

const { width, height } = Dimensions.get("window");

const BASE_URL = "https://wdp-be-x41z.onrender.com";

const formatDate = (d) =>
  new Date(d).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

export default function CampaignPoster({ campaign, onClose }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(60)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 65,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 60,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  const imageUrl = campaign.image_url
    ? campaign.image_url.startsWith("http")
      ? campaign.image_url
      : `${BASE_URL}${campaign.image_url}`
    : null;

  return (
    <Modal transparent animationType="none" visible statusBarTranslucent>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View
          style={[styles.poster, { transform: [{ translateY: slideAnim }] }]}
        >
          {/* Nút X góc trên trái */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={handleClose}
            activeOpacity={0.8}
          >
            <MaterialIcons name="close" size={20} color={COLORS.white} />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            {/* Ảnh poster */}
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={styles.image}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <MaterialIcons
                  name="volunteer-activism"
                  size={72}
                  color={COLORS.white}
                />
              </View>
            )}

            {/* Badge */}
            <View style={styles.badge}>
              <MaterialIcons name="campaign" size={14} color={COLORS.white} />
              <Text style={styles.badgeText}>SỰ KIỆN QUYÊN GÓP</Text>
            </View>

            {/* Nội dung */}
            <View style={styles.content}>
              <Text style={styles.title}>{campaign.title}</Text>

              {campaign.description ? (
                <Text style={styles.description}>{campaign.description}</Text>
              ) : null}

              <View style={styles.infoBox}>
                {campaign.address ? (
                  <View style={styles.infoRow}>
                    <View style={styles.infoIcon}>
                      <MaterialIcons
                        name="location-on"
                        size={16}
                        color={COLORS.primary}
                      />
                    </View>
                    <Text style={styles.infoText}>{campaign.address}</Text>
                  </View>
                ) : null}

                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <MaterialIcons
                      name="event"
                      size={16}
                      color={COLORS.primary}
                    />
                  </View>
                  <Text style={styles.infoText}>
                    {formatDate(campaign.start_date)} —{" "}
                    {formatDate(campaign.end_date)}
                  </Text>
                </View>
              </View>

              {/* Nút đóng */}
              <TouchableOpacity
                style={styles.dismissBtn}
                onPress={handleClose}
                activeOpacity={0.85}
              >
                <Text style={styles.dismissBtnText}>Đã hiểu, đóng lại</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  poster: {
    width: width - 40,
    maxHeight: height * 0.85,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 20,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  closeBtn: {
    position: "absolute",
    top: 12,
    left: 12,
    zIndex: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: 220,
  },
  imagePlaceholder: {
    width: "100%",
    height: 220,
    backgroundColor: "#E53935",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 190,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E53935",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  content: {
    padding: 20,
    paddingTop: 28,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.black,
    lineHeight: 28,
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: COLORS.textLight,
    lineHeight: 22,
    marginBottom: 16,
  },
  infoBox: {
    backgroundColor: "#F5F7FA",
    borderRadius: 12,
    padding: 14,
    gap: 10,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  infoIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 20,
    paddingTop: 4,
  },
  dismissBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  dismissBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "700",
  },
});
