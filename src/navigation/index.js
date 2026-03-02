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

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ icon, focused }) {
  return (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{icon}</Text>
  );
}

// Tab cho user đã đăng nhập (role: user)
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

// Tab cho guest
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

// Tab cho rescue team
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
          // Đã đăng nhập — phân theo role
          user.role === "rescue_team" ? (
            <>
              <Stack.Screen name="RescueTeamTabs" component={RescueTeamTabs} />
              <Stack.Screen
                name="MissionDetail"
                component={MissionDetailScreen}
                options={{ headerShown: true, title: "Chi tiết nhiệm vụ" }}
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
            </>
          )
        ) : (
          // Chưa đăng nhập
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
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
