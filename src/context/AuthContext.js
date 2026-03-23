import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApi } from "../api/auth";
import { promoteGuestRequestIdsToDeviceUser } from "../utils/deviceGuestRequests";
import {
  registerForPushNotifications,
  savePushTokenToServer,
  configureNotificationActions,
} from "../utils/pushNotification";

const AuthContext = createContext(null);

const PUSH_FALLBACK_TEXT =
  "Chưa đăng ký nhận thông báo. Vui lòng đăng nhập lại.";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pushReady, setPushReady] = useState(false);
  const [pushFallbackMessage, setPushFallbackMessage] = useState("");

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const savedToken = await AsyncStorage.getItem("auth_token");
        const savedUser = await AsyncStorage.getItem("auth_user");
        if (savedToken && savedUser) {
          setToken(savedToken);
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          configureNotificationActions();
          registerAndSavePushToken();
        }
      } catch (e) {
        await AsyncStorage.multiRemove(["auth_token", "auth_user"]);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  const registerAndSavePushToken = async () => {
    try {
      const registration = await registerForPushNotifications();
      if (!registration?.ok || !registration?.token) {
        const reason = registration?.reason || "Cannot register push token";
        console.log("⚠️ Push registration skipped:", reason);
        setPushReady(false);
        setPushFallbackMessage(PUSH_FALLBACK_TEXT);
        return false;
      }

      const saveResult = await savePushTokenToServer(registration.token);
      if (!saveResult?.ok) {
        console.log("⚠️ Push token save skipped:", saveResult?.reason);
        setPushReady(false);
        setPushFallbackMessage(PUSH_FALLBACK_TEXT);
        return false;
      }

      setPushReady(true);
      setPushFallbackMessage("");
      console.log("✅ Push token saved:", registration.token);
      return true;
    } catch (e) {
      console.error("Failed to register push token:", e);
      setPushReady(false);
      setPushFallbackMessage(PUSH_FALLBACK_TEXT);
      return false;
    }
  };

  const login = async (email, password) => {
    const res = await authApi.login(email, password);
    const { token: newToken, user: newUser } = res.data;
    await AsyncStorage.setItem("auth_token", newToken);
    await AsyncStorage.setItem("auth_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    configureNotificationActions();

    let promotedGuestCount = 0;
    if (newUser.role === "user") {
      try {
        promotedGuestCount = await promoteGuestRequestIdsToDeviceUser(
          newUser.id,
        );
      } catch (e) {
        console.warn("Promote guest requests to device user:", e?.message || e);
      }
    }

    // Đăng ký push token cho user đã đăng nhập
    setTimeout(() => registerAndSavePushToken(), 300);

    return { user: newUser, promotedGuestCount };
  };

  const register = async (username, email, password) => {
    await authApi.register(username, email, password);
    return login(email, password);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(["auth_token", "auth_user"]);
    setToken(null);
    setUser(null);
    setPushReady(false);
    setPushFallbackMessage("");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        pushReady,
        pushFallbackMessage,
      }}
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
