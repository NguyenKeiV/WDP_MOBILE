import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import apiClient from "../api/client";

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
      return null;
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
      return null;
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
    return tokenData.data;
  } catch (error) {
    console.error(
      "❌ Error registering for push notifications:",
      error.message,
    );
    return null;
  }
}

export async function savePushTokenToServer(token) {
  try {
    await apiClient.put("/users/push-token", { token });
    console.log("✅ Token saved to server");
  } catch (error) {
    console.error("❌ Failed to save push token:", error.message);
    console.error("❌ Error details:", JSON.stringify(error?.response?.data));
  }
}
