import { Tabs, useRouter } from "expo-router";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function AppLayout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#8b6fff",
        tabBarInactiveTintColor: "#5a5a6e",
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tabs.Screen
        name="overview"
        options={{
          title: "Overview",
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: "Feed",
          tabBarIcon: ({ color, size }) => (
            <Feather name="list" size={size} color={color} />
          ),
        }}
      />
      
      {/* The Center FAB */}
      <Tabs.Screen
        name="add_transaction_fake"
        options={{
          title: "",
          tabBarIcon: () => (
            <View style={styles.fabContainer}>
              <LinearGradient
                colors={["#6c47ff", "#8b6fff"]}
                style={styles.fab}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Feather name="plus" size={24} color="#fff" />
              </LinearGradient>
            </View>
          ),
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              activeOpacity={0.9}
              onPress={(e) => {
                e.preventDefault();
                router.push("/modals/add-expense");
              }}
              style={[props.style, { marginTop: Platform.OS === "ios" ? -10 : -15 }]}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="splits"
        options={{
          title: "Splits",
          tabBarIcon: ({ color, size }) => (
            <Feather name="users" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />

      {/* Hide accounts tab from the bar, we will access it via overview or profile */}
      <Tabs.Screen
        name="accounts"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#0a0a0f",
    borderTopColor: "rgba(255,255,255,0.05)",
    borderTopWidth: 1,
    paddingBottom: Platform.OS === "ios" ? 28 : 12,
    paddingTop: 12,
    height: Platform.OS === "ios" ? 92 : 72,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: "700",
    marginTop: 4,
  },
  tabBarItem: {
    paddingTop: 0,
  },
  fabContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  fab: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6c47ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 2,
    borderColor: "#0a0a0f",
  },
});
