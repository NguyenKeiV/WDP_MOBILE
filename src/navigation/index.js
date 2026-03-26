import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  NavigationContainer,
  createNavigationContainerRef,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, ActivityIndicator, View, StyleSheet, Alert } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Notifications from "expo-notifications";

import { useAuth } from "../context/AuthContext";
import { COLORS } from "../constants";
import { charityCampaignApi } from "../api/charityCampaign";
import CampaignPoster from "../components/CampaignPoster";
import CharityCampaignDetailScreen from "../screens/charity/CharityCampaignDetailScreen";
import CharityDonationHistoryScreen from "../screens/charity/CharityDonationHistoryScreen";
import { CHARITY_NOTIFICATION_CATEGORY_ID } from "../utils/pushNotification";

import WelcomeScreen from "../screens/auth/WelcomeScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import RequestDetailScreen from "../screens/home/RequestDetailScreen";
import CreateRequestScreen from "../screens/request/CreateRequestScreen";
import MyRequestsScreen from "../screens/request/MyRequestsScreen";
import GuestRequestsScreen from "../screens/request/GuestRequestsScreen";
import MissionsScreen from "../screens/missions/MissionsScreen";
import MissionDetailScreen from "../screens/missions/MissionDetailScreen";
import InventoryScreen from "../screens/rescue/InventoryScreen";
import VehicleReturnScreen from "../screens/rescue/VehicleReturnScreen";
import MapPickerScreen from "../screens/request/MapPickerScreen";
import VolunteerListScreen from "../screens/volunteer/VolunteerListScreen";
import VolunteerRegisterScreen from "../screens/volunteer/VolunteerRegisterScreen";
import VolunteerDetailScreen from "../screens/volunteer/VolunteerDetailScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const VolunteerStack = createNativeStackNavigator();
const navigationRef = createNavigationContainerRef();

const TAB_COLORS = {
  primary: COLORS.primary,
  active: COLORS.primary,
  inactive: "#94a3b8",
  border: "#e2e8f0",
  bg: "rgba(255,255,255,0.95)",
};

const TAB_BAR_STYLE = {
  borderTopWidth: 1,
  borderTopColor: TAB_COLORS.border,
  backgroundColor: TAB_COLORS.bg,
  paddingBottom: 8,
  paddingTop: 12,
  height: 64,
  elevation: 0,
  shadowOpacity: 0,
};

const TAB_SCREEN_OPTIONS = {
  headerShown: false,
  tabBarActiveTintColor: TAB_COLORS.active,
  tabBarInactiveTintColor: TAB_COLORS.inactive,
  tabBarStyle: TAB_BAR_STYLE,
  tabBarLabelStyle: { display: "none" },
  tabBarShowLabel: false,
};

function isCharityCampaignPayload(data) {
  if (!data || typeof data !== "object") return false;
  return data.type === "charity_campaign";
}

function resolveCampaignId(data) {
  if (!data || typeof data !== "object") return null;
  return data.campaign_id || data.campaignId || data.id || null;
}

function isVehicleReturnReminderPayload(data) {
  if (!data || typeof data !== "object") return false;
  return data.type === "mission_completed_return_vehicle";
}

async function buildCampaignNotificationBody(campaignId) {
  if (!campaignId) {
    return "Hãy xem chi tiết đợt quyên góp mới để tham gia.";
  }

  try {
    const res = await charityCampaignApi.getById(campaignId);
    const name = res?.data?.name;
    if (name) {
      return `Đợt quyên góp: ${name}`;
    }
  } catch {
    // ignore and fallback text
  }

  return "Hãy xem chi tiết đợt quyên góp mới để tham gia.";
}

function openCharityCampaignDetail(campaignId) {
  if (!campaignId) {
    Alert.alert("Thông báo", "Dữ liệu thông báo không hợp lệ");
    return;
  }

  if (!navigationRef.isReady()) return;

  navigationRef.navigate("CharityCampaignDetail", {
    campaign_id: campaignId,
  });
}

function openVehicleReturnTab() {
  if (!navigationRef.isReady()) return;
  navigationRef.navigate("RescueTeamTabs", { screen: "VehicleReturn" });
}

function TabBarIcon({ name, focused, label }) {
  const color = focused ? TAB_COLORS.active : TAB_COLORS.inactive;
  return (
    <View style={tabBarStyles.tabItem}>
      <MaterialIcons name={name} size={24} color={color} />
      <Text
        style={[
          tabBarStyles.label,
          { color },
          focused && tabBarStyles.labelActive,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const tabBarStyles = StyleSheet.create({
  tabItem: { alignItems: "center", justifyContent: "center", gap: 2 },
  label: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  labelActive: { fontWeight: "800" },
});

// ── Volunteer Stack ──────────────────────────────────────────────────────────
function VolunteerTabStack() {
  return (
    <VolunteerStack.Navigator
      screenOptions={{
        headerTintColor: COLORS.primary,
        headerTitleStyle: { fontWeight: "700" },
        headerShadowVisible: false,
      }}
    >
      <VolunteerStack.Screen
        name="VolunteerList"
        component={VolunteerListScreen}
        options={{ headerShown: false }}
      />
      <VolunteerStack.Screen
        name="VolunteerRegister"
        component={VolunteerRegisterScreen}
        options={{ title: "Đăng ký tình nguyện" }}
      />
      <VolunteerStack.Screen
        name="VolunteerDetail"
        component={VolunteerDetailScreen}
        options={{ title: "Chi tiết đăng ký" }}
      />
    </VolunteerStack.Navigator>
  );
}

// ── Main Tabs (user đã đăng nhập, role != rescue_team) ───────────────────────
function MainTabs() {
  const { user, pushReady, pushFallbackMessage } = useAuth();
  const isCitizen = user?.role === "user";

  const [activeCampaign, setActiveCampaign] = useState(null);
  const [showPoster, setShowPoster] = useState(false);

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const res = await charityCampaignApi.getActive();
        if (res?.data) {
          setActiveCampaign(res.data);
          setShowPoster(true);
        }
      } catch {
        // Không có campaign active → không hiện gì
      }
    };
    fetchCampaign();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {!pushReady && !!pushFallbackMessage ? (
        <View style={styles.pushFallbackBox}>
          <MaterialIcons name="notifications-off" size={16} color="#92400E" />
          <Text style={styles.pushFallbackText}>{pushFallbackMessage}</Text>
        </View>
      ) : null}

      <Tab.Navigator screenOptions={TAB_SCREEN_OPTIONS}>
        <Tab.Screen
          name="MyRequests"
          component={MyRequestsScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabBarIcon name="assignment" focused={focused} label="Yêu cầu" />
            ),
          }}
        />
        <Tab.Screen
          name="CreateRequest"
          component={CreateRequestScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabBarIcon
                name="add-circle"
                focused={focused}
                label="Tạo yêu cầu"
              />
            ),
          }}
        />
        {isCitizen ? (
          <Tab.Screen
            name="Volunteer"
            component={VolunteerTabStack}
            options={{
              tabBarIcon: ({ focused }) => (
                <TabBarIcon
                  name="volunteer-activism"
                  focused={focused}
                  label="Tình nguyện"
                />
              ),
            }}
          />
        ) : null}
      </Tab.Navigator>

      {showPoster && activeCampaign && (
        <CampaignPoster
          campaign={activeCampaign}
          onClose={() => setShowPoster(false)}
        />
      )}
    </View>
  );
}

// ── Guest Tabs ───────────────────────────────────────────────────────────────
function GuestTabs() {
  return (
    <Tab.Navigator screenOptions={TAB_SCREEN_OPTIONS}>
      <Tab.Screen
        name="CreateRequest"
        component={CreateRequestScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              name="add-circle"
              focused={focused}
              label="Tạo yêu cầu"
            />
          ),
        }}
      />
      <Tab.Screen
        name="GuestRequests"
        component={GuestRequestsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="list" focused={focused} label="Của tôi" />
          ),
        }}
      />
      <Tab.Screen
        name="LoginPrompt"
        component={LoginScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="person" focused={focused} label="Đăng nhập" />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// ── Rescue Team Tabs ─────────────────────────────────────────────────────────
function RescueTeamTabs() {
  return (
    <Tab.Navigator screenOptions={TAB_SCREEN_OPTIONS}>
      <Tab.Screen
        name="Missions"
        component={MissionsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="assignment" focused={focused} label="Nhiệm vụ" />
          ),
        }}
      />
      <Tab.Screen
        name="Inventory"
        component={InventoryScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="inventory-2" focused={focused} label="Kiểm kê" />
          ),
        }}
      />
      <Tab.Screen
        name="VehicleReturn"
        component={VehicleReturnScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              name="local-shipping"
              focused={focused}
              label="Thu hồi xe"
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// ── App Navigator (root) ─────────────────────────────────────────────────────
export default function AppNavigator() {
  const { user, loading, pushReady } = useAuth();
  const receivedListener = useRef(null);
  const responseListener = useRef(null);
  const pendingCampaignIdRef = useRef(null);

  const handleNotificationDeepLink = useCallback((data) => {
    if (isVehicleReturnReminderPayload(data)) {
      openVehicleReturnTab();
      Alert.alert(
        "Nhắc trả phương tiện",
        "Nhiệm vụ đã hoàn thành. Vui lòng vào mục Thu hồi xe để trả phương tiện.",
      );
      return;
    }

    if (!isCharityCampaignPayload(data)) return;

    const campaignId = resolveCampaignId(data);
    if (!campaignId) {
      Alert.alert("Thông báo", "Dữ liệu thông báo không hợp lệ");
      return;
    }

    if (!navigationRef.isReady()) {
      pendingCampaignIdRef.current = campaignId;
      return;
    }

    openCharityCampaignDetail(campaignId);
  }, []);

  useEffect(() => {
    if (!user || !pushReady) {
      console.log("ℹ️ Skip notification listeners: push token chưa sẵn sàng");
      return undefined;
    }

    receivedListener.current = Notifications.addNotificationReceivedListener(
      async (notification) => {
        const data = notification?.request?.content?.data;

        if (isVehicleReturnReminderPayload(data)) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "Nhắc trả phương tiện",
              body: "Nhiệm vụ đã hoàn thành. Vui lòng trả phương tiện về kho.",
              data,
            },
            trigger: null,
          });
          return;
        }

        if (!isCharityCampaignPayload(data)) return;

        const campaignId = resolveCampaignId(data);
        if (!campaignId) {
          Alert.alert("Thông báo", "Dữ liệu thông báo không hợp lệ");
          return;
        }

        const body = await buildCampaignNotificationBody(campaignId);
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Có đợt quyên góp mới",
            body,
            data: {
              type: "charity_campaign",
              campaign_id: campaignId,
            },
            categoryIdentifier: CHARITY_NOTIFICATION_CATEGORY_ID,
          },
          trigger: null,
        });
      },
    );

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response?.notification?.request?.content?.data;
        handleNotificationDeepLink(data);
      });

    Notifications.getLastNotificationResponseAsync().then((response) => {
      const data = response?.notification?.request?.content?.data;
      handleNotificationDeepLink(data);
    });

    return () => {
      receivedListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [user, pushReady, handleNotificationDeepLink]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        if (pendingCampaignIdRef.current) {
          openCharityCampaignDetail(pendingCampaignIdRef.current);
          pendingCampaignIdRef.current = null;
        }
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          user.role === "rescue_team" ? (
            <>
              <Stack.Screen name="RescueTeamTabs" component={RescueTeamTabs} />
              <Stack.Screen
                name="MissionDetail"
                component={MissionDetailScreen}
                options={{ headerShown: true, title: "Chi tiết nhiệm vụ" }}
              />
              <Stack.Screen
                name="MapPicker"
                component={MapPickerScreen}
                options={{
                  headerShown: true,
                  title: "Chọn vị trí trên bản đồ",
                }}
              />
              <Stack.Screen
                name="CharityCampaignDetail"
                component={CharityCampaignDetailScreen}
                options={{ headerShown: true, title: "Chi tiết đợt quyên góp" }}
              />
              <Stack.Screen
                name="CharityDonationHistory"
                component={CharityDonationHistoryScreen}
                options={{ headerShown: true, title: "Lịch sử quyên góp" }}
              />
            </>
          ) : (
            <>
              <Stack.Screen name="MainTabs" component={MainTabs} />
              <Stack.Screen
                name="RequestDetail"
                component={RequestDetailScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="MapPicker"
                component={MapPickerScreen}
                options={{
                  headerShown: true,
                  title: "Chọn vị trí trên bản đồ",
                }}
              />
              <Stack.Screen
                name="CharityCampaignDetail"
                component={CharityCampaignDetailScreen}
                options={{ headerShown: true, title: "Chi tiết đợt quyên góp" }}
              />
              <Stack.Screen
                name="CharityDonationHistory"
                component={CharityDonationHistoryScreen}
                options={{ headerShown: true, title: "Lịch sử quyên góp" }}
              />
            </>
          )
        ) : (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="GuestTabs" component={GuestTabs} />
            <Stack.Screen
              name="RequestDetail"
              component={RequestDetailScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="MapPicker"
              component={MapPickerScreen}
              options={{
                headerShown: true,
                title: "Chọn vị trí trên bản đồ",
              }}
            />
            <Stack.Screen
              name="CharityCampaignDetail"
              component={CharityCampaignDetailScreen}
              options={{ headerShown: true, title: "Chi tiết đợt quyên góp" }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  pushFallbackBox: {
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FCD34D",
    backgroundColor: "#FFFBEB",
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pushFallbackText: {
    flex: 1,
    fontSize: 12,
    color: "#92400E",
    fontWeight: "600",
  },
});
