import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import apiClient from "../api/client";

export const CHARITY_NOTIFICATION_CATEGORY_ID = "charity_campaign_actions";

export async function configureNotificationActions() {
  try {
    await Notifications.setNotificationCategoryAsync(
      CHARITY_NOTIFICATION_CATEGORY_ID,
      [
        {
          identifier: "view_campaign_detail",
          buttonTitle: "Xem chi tiết",
          options: { opensAppToForeground: true },
        },
      ],
    );
  } catch (error) {
    console.log("⚠️ Cannot set notification category:", error?.message);
  }
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications() {
  try {
    console.log("📱 isDevice:", Device.isDevice);
    console.log("📱 Platform:", Platform.OS);

    if (!Device.isDevice) {
      console.log("Push notifications only work on physical devices");
      return {
        ok: false,
        token: null,
        reason: "Push notifications only work on physical devices",
      };
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    console.log("🔔 Existing permission status:", existingStatus);

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log("🔔 New permission status:", status);
    }

    if (finalStatus !== "granted") {
      console.log("❌ Permission not granted");
      return {
        ok: false,
        token: null,
        reason: "Permission not granted",
      };
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF0000",
      });
    }

    // Thử lấy token không cần projectId (Expo Go)
    console.log("🔔 Getting push token...");
    const tokenData = await Notifications.getExpoPushTokenAsync();
    console.log("✅ Token data:", tokenData);
    return {
      ok: true,
      token: tokenData.data,
      reason: null,
    };
  } catch (error) {
    console.error(
      "❌ Error registering for push notifications:",
      error.message,
    );
    return {
      ok: false,
      token: null,
      reason: error?.message || "Unknown registration error",
    };
  }
}

export async function savePushTokenToServer(token) {
  try {
    await apiClient.put("/users/push-token", { token });
    console.log("✅ Token saved to server");
    return { ok: true, reason: null };
  } catch (error) {
    console.error("❌ Failed to save push token:", error.message);
    console.error("❌ Error details:", JSON.stringify(error?.response?.data));
    return {
      ok: false,
      reason: error?.message || "Cannot save token",
    };
  }
}
