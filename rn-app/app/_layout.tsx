import "../globals.css";
import { Stack, useRouter, useSegments } from "expo-router";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useEffect, useState, useCallback } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<any>(null);

  const hideSplash = useCallback(async () => {
    try {
      await SplashScreen.hideAsync();
    } catch {
      // Splash screen may have already been hidden
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (initializing) {
        setInitializing(false);
        await hideSplash();
      }
    });

    return unsubscribe;
  }, []);

  // Handle navigation based on auth state and current segment
  useEffect(() => {
    if (initializing) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!user) {
      // User is not signed in and not in auth group — redirect to login
      if (!inAuthGroup) {
        router.replace("/(auth)/login");
      }
    } else {
      // User is signed in but on auth screen or index screen — redirect to app
      if (inAuthGroup || segments.length === 0 || segments[0] === "index") {
        router.replace("/(app)/overview");
      }
    }
  }, [user, initializing, segments]);

  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#0a0a0f" },
          animation: "fade",
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
        <Stack.Screen 
          name="modals/add-expense" 
          options={{ 
            presentation: "modal", 
            animation: "slide_from_bottom" 
          }} 
        />
        <Stack.Screen 
          name="modals/bank-modal" 
          options={{ 
            presentation: "modal", 
            animation: "slide_from_bottom" 
          }} 
        />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0a0e27",
  },
});
