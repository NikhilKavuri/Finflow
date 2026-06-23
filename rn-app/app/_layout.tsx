import "../globals.css";
import { Stack, useRouter, useSegments } from "expo-router";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { useEffect, useState, useCallback } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { LinearGradient } from "expo-linear-gradient";
import { BrandedLoader } from "@/components/BrandedLoader";

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
        router.replace("/(app)/home");
      }
    }
  }, [user, initializing, segments]);

  if (initializing) {
    return (
      <>
        <StatusBar style="light" />
        <BrandedLoader />
      </>
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
          animationDuration: 250,
        }}
      >
        <Stack.Screen
          name="(auth)"
          options={{
            animation: "fade",
          }}
        />
        <Stack.Screen
          name="(app)"
          options={{
            animation: "fade",
          }}
        />
        <Stack.Screen
          name="modals/add-expense"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
            animationDuration: 300,
          }}
        />
        <Stack.Screen
          name="modals/bank-modal"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
            animationDuration: 300,
          }}
        />
      </Stack>
    </>
  );
}

