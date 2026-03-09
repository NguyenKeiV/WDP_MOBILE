import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, ActivityIndicator, View } from "react-native";

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
import MapPickerScreen from "../screens/request/MapPickerScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ icon, focused }) {
  return (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{icon}</Text>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: COLORS.grayBorder,
          paddingBottom: 8,
          paddingTop: 4,
          height: 60,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tab.Screen
        name="MyRequests"
        component={MyRequestsScreen}
        options={{
          tabBarLabel: "Yêu cầu của tôi",
          tabBarIcon: ({ focused }) => <TabIcon icon="📋" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="CreateRequest"
        component={CreateRequestScreen}
        options={{
          tabBarLabel: "Tạo yêu cầu",
          tabBarIcon: ({ focused }) => <TabIcon icon="🆘" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

function GuestTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: COLORS.grayBorder,
          paddingBottom: 8,
          paddingTop: 4,
          height: 60,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tab.Screen
        name="CreateRequest"
        component={CreateRequestScreen}
        options={{
          tabBarLabel: "Tạo yêu cầu",
          tabBarIcon: ({ focused }) => <TabIcon icon="🆘" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="GuestRequests"
        component={GuestRequestsScreen}
        options={{
          tabBarLabel: "Của tôi",
          tabBarIcon: ({ focused }) => <TabIcon icon="📋" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="LoginPrompt"
        component={LoginScreen}
        options={{
          tabBarLabel: "Đăng nhập",
          tabBarIcon: ({ focused }) => <TabIcon icon="👤" focused={focused} />,
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
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: COLORS.grayBorder,
          paddingBottom: 8,
          paddingTop: 4,
          height: 60,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tab.Screen
        name="Missions"
        component={MissionsScreen}
        options={{
          tabBarLabel: "Nhiệm vụ",
          tabBarIcon: ({ focused }) => <TabIcon icon="🚒" focused={focused} />,
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
                options={{ headerShown: true, title: "Chi tiết yêu cầu" }}
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
              options={{ headerShown: true, title: "Chi tiết yêu cầu" }}
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
