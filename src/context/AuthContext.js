import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApi } from "../api/auth";
import {
  registerForPushNotifications,
  savePushTokenToServer,
} from "../utils/pushNotification";
import * as Notifications from "expo-notifications";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const savedToken = await AsyncStorage.getItem("auth_token");
        const savedUser = await AsyncStorage.getItem("auth_user");
        if (savedToken && savedUser) {
          setToken(savedToken);
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          // Đăng ký push token lại khi khởi động app
          if (parsedUser.role === "rescue_team") {
            registerAndSavePushToken();
          }
        }
      } catch (e) {
        await AsyncStorage.multiRemove(["auth_token", "auth_user"]);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();

    // Lắng nghe notification khi app đang mở
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("📬 Notification received:", notification);
      });

    // Lắng nghe khi user bấm vào notification
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        console.log("👆 Notification tapped:", data);
      });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  const registerAndSavePushToken = async () => {
    try {
      const pushToken = await registerForPushNotifications();
      if (pushToken) {
        await savePushTokenToServer(pushToken);
        console.log("✅ Push token saved:", pushToken);
      }
    } catch (e) {
      console.error("Failed to register push token:", e);
    }
  };

  const login = async (email, password) => {
    const res = await authApi.login(email, password);
    const { token: newToken, user: newUser } = res.data;
    await AsyncStorage.setItem("auth_token", newToken);
    await AsyncStorage.setItem("auth_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);

    // Đăng ký push token cho rescue_team
    if (newUser.role === "rescue_team") {
      setTimeout(() => registerAndSavePushToken(), 1000);
    }

    return newUser;
  };

  const register = async (username, email, password) => {
    await authApi.register(username, email, password);
    return login(email, password);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(["auth_token", "auth_user"]);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
