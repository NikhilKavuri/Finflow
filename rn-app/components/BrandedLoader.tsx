import React, { useEffect } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export function BrandedLoader() {
  const pulse = useSharedValue(0);
  const spinnerRotation = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    spinnerRotation.value = withRepeat(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.3, 0.7]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.9, 1.1]) }],
  }));

  const spinnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spinnerRotation.value}deg` }],
  }));

  return (
    <View style={styles.loadingContainer}>
      <Animated.View style={[styles.loaderGlow, glowStyle]} />

      <MaskedView
        maskElement={
          <Text style={styles.loaderLogoMask}>FinFlow</Text>
        }
      >
        <LinearGradient
          colors={["#8b6fff", "#b8ff57"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.loaderLogoGradient}
        >
          <Text style={[styles.loaderLogoMask, { opacity: 0 }]}>FinFlow</Text>
        </LinearGradient>
      </MaskedView>

      <Animated.View style={[styles.loaderSpinner, spinnerStyle]} />
      <Text style={styles.loaderSubtext}>Loading your finances...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0a0a0f",
  },
  loaderGlow: {
    position: "absolute",
    width: SCREEN_WIDTH * 0.5,
    height: SCREEN_WIDTH * 0.5,
    borderRadius: 9999,
    backgroundColor: "rgba(108, 71, 255, 0.15)",
  },
  loaderLogoMask: {
    fontSize: 36,
    fontWeight: "900",
    textAlign: "center",
  },
  loaderLogoGradient: {
    alignItems: "center",
  },
  loaderSpinner: {
    marginTop: 24,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderTopColor: "#8b6fff",
  },
  loaderSubtext: {
    marginTop: 16,
    color: "#5a5a6e",
    fontSize: 12,
    fontWeight: "500",
  },
});
