import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, ActivityIndicator, View, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { useAuth } from "../context/AuthContext";
import { COLORS } from "../constants";

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

const TAB_COLORS = {
  primary: COLORS.primary,
  active: COLORS.primary,
  inactive: "#94a3b8",
  border: "#e2e8f0",
  bg: "rgba(255,255,255,0.95)",
};

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
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  labelActive: {
    fontWeight: "800",
  },
});

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

function MainTabs() {
  const { user } = useAuth();
  const isCitizen = user?.role === "user";

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: TAB_COLORS.active,
        tabBarInactiveTintColor: TAB_COLORS.inactive,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: TAB_COLORS.border,
          backgroundColor: TAB_COLORS.bg,
          paddingBottom: 8,
          paddingTop: 12,
          height: 64,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: { display: "none" },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="MyRequests"
        component={MyRequestsScreen}
        options={{
          tabBarLabel: "Yêu cầu của tôi",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="assignment" focused={focused} label="Yêu cầu" />
          ),
        }}
      />
      <Tab.Screen
        name="CreateRequest"
        component={CreateRequestScreen}
        options={{
          tabBarLabel: "Tạo yêu cầu",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="add-circle" focused={focused} label="Tạo yêu cầu" />
          ),
        }}
      />
      {isCitizen ? (
        <Tab.Screen
          name="Volunteer"
          component={VolunteerTabStack}
          options={{
            tabBarLabel: "Tình nguyện",
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
  );
}

function GuestTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: TAB_COLORS.active,
        tabBarInactiveTintColor: TAB_COLORS.inactive,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: TAB_COLORS.border,
          backgroundColor: TAB_COLORS.bg,
          paddingBottom: 8,
          paddingTop: 12,
          height: 64,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: { display: "none" },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="CreateRequest"
        component={CreateRequestScreen}
        options={{
          tabBarLabel: "Tạo yêu cầu",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="add-circle" focused={focused} label="Tạo yêu cầu" />
          ),
        }}
      />
      <Tab.Screen
        name="GuestRequests"
        component={GuestRequestsScreen}
        options={{
          tabBarLabel: "Của tôi",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="list" focused={focused} label="Của tôi" />
          ),
        }}
      />
      <Tab.Screen
        name="LoginPrompt"
        component={LoginScreen}
        options={{
          tabBarLabel: "Đăng nhập",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="person" focused={focused} label="Đăng nhập" />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function RescueTeamTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: TAB_COLORS.active,
        tabBarInactiveTintColor: TAB_COLORS.inactive,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: TAB_COLORS.border,
          backgroundColor: TAB_COLORS.bg,
          paddingBottom: 8,
          paddingTop: 12,
          height: 64,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: { display: "none" },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Missions"
        component={MissionsScreen}
        options={{
          tabBarLabel: "Nhiệm vụ",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="assignment" focused={focused} label="Nhiệm vụ" />
          ),
        }}
      />
      <Tab.Screen
        name="Inventory"
        component={InventoryScreen}
        options={{
          tabBarLabel: "Kiểm kê",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="inventory-2" focused={focused} label="Kiểm kê" />
          ),
        }}
      />
      <Tab.Screen
        name="VehicleReturn"
        component={VehicleReturnScreen}
        options={{
          tabBarLabel: "Thu hồi xe",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="local-shipping" focused={focused} label="Thu hồi xe" />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
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
              options={{ headerShown: true, title: "Chọn vị trí trên bản đồ" }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
