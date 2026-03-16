import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApi } from "../api/auth";
import { requestsApi } from "../api/requests";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const savedToken = await AsyncStorage.getItem("auth_token");
        const savedUser = await AsyncStorage.getItem("auth_user");
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }
      } catch (e) {
        await AsyncStorage.multiRemove(["auth_token", "auth_user"]);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login(email, password);
    const { token: newToken, user: newUser } = res.data;
    await AsyncStorage.setItem("auth_token", newToken);
    await AsyncStorage.setItem("auth_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    // Gắn yêu cầu tạo lúc guest vào tài khoản vừa đăng nhập
    try {
      const guestIds = await AsyncStorage.getItem("guest_request_ids");
      if (guestIds) {
        const ids = JSON.parse(guestIds);
        if (ids && ids.length > 0) {
          await requestsApi.linkToMe(ids);
          await AsyncStorage.removeItem("guest_request_ids");
        }
      }
    } catch (e) {
      // Không chặn login nếu link thất bại
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
