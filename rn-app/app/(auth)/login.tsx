import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
  FadeIn,
  FadeOut,
  SlideInDown,
  Layout,
  interpolate,
  runOnJS,
} from "react-native-reanimated";
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
} from "@/lib/firebase";
import Svg, { Path } from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type AuthMode = "signin" | "signup";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// Google "G" logo component with proper colors
function GoogleLogo({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </Svg>
  );
}

// Animated loading spinner
function LoadingSpinner({ color = "#fff", size = 18 }: { color?: string; size?: number }) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 800, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 2,
          borderColor: "rgba(255,255,255,0.2)",
          borderTopColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Animation values
  const containerOpacity = useSharedValue(0);
  const containerTranslateY = useSharedValue(30);
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const submitScale = useSharedValue(1);
  const glowPulse = useSharedValue(0);

  // Mount animations
  useEffect(() => {
    // Logo animation
    logoScale.value = withDelay(
      100,
      withSpring(1, { damping: 15, stiffness: 150 })
    );
    logoOpacity.value = withDelay(
      100,
      withTiming(1, { duration: 500 })
    );

    // Container slide up
    containerOpacity.value = withTiming(1, {
      duration: 600,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
    containerTranslateY.value = withTiming(0, {
      duration: 600,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });

    // Background glow pulse
    glowPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ translateY: containerTranslateY.value }],
  }));

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const submitAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: submitScale.value }],
  }));

  const glowTopStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowPulse.value, [0, 1], [0.6, 1]),
    transform: [{ scale: interpolate(glowPulse.value, [0, 1], [1, 1.05]) }],
  }));

  const glowBottomStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowPulse.value, [0, 1], [0.5, 0.8]),
    transform: [{ scale: interpolate(glowPulse.value, [0, 1], [1, 1.08]) }],
  }));

  const switchMode = useCallback(() => {
    setMode((m) => (m === "signin" ? "signup" : "signin"));
    setError("");
  }, []);

  const handleAuth = useCallback(async () => {
    setError("");

    if (!email.trim()) { setError("Email is required."); return; }
    if (!password.trim()) { setError("Password is required."); return; }
    if (mode === "signup" && !name.trim()) { setError("Name is required."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }

    setLoading(true);

    try {
      if (mode === "signup") {
        await signUpWithEmail(email.trim(), password, name.trim());
      } else {
        await signInWithEmail(email.trim(), password);
      }
    } catch (err: any) {
      const msg = err?.message || "Authentication failed";
      // Clean up Firebase error messages
      if (msg.includes("auth/invalid-credential") || msg.includes("auth/wrong-password")) {
        setError("Invalid email or password.");
      } else if (msg.includes("auth/email-already-in-use")) {
        setError("This email is already registered.");
      } else if (msg.includes("auth/user-not-found")) {
        setError("No account found with this email.");
      } else if (msg.includes("auth/invalid-email")) {
        setError("Please enter a valid email address.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [email, password, name, mode]);

  const handleGoogleAuth = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      const msg = err?.message || "Google Sign-In failed";
      if (!msg.includes("cancelled")) {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const onSubmitPressIn = useCallback(() => {
    if (!loading) {
      submitScale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
    }
  }, [loading]);

  const onSubmitPressOut = useCallback(() => {
    submitScale.value = withSpring(1, { damping: 15, stiffness: 400 });
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        {/* Background glow effects */}
        <Animated.View style={[styles.glowTopLeft, glowTopStyle]} />
        <Animated.View style={[styles.glowBottomRight, glowBottomStyle]} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <Animated.View style={[styles.formWrapper, containerAnimatedStyle]}>
            {/* Logo with gradient text */}
            <Animated.View style={[styles.header, logoAnimatedStyle]}>
              <MaskedView
                maskElement={
                  <Text style={styles.logoMask}>FinFlow</Text>
                }
              >
                <LinearGradient
                  colors={["#8b6fff", "#b8ff57"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.logoGradient}
                >
                  <Text style={[styles.logoMask, { opacity: 0 }]}>FinFlow</Text>
                </LinearGradient>
              </MaskedView>
              <Text style={styles.subtitleText}>
                Smart expense tracking, simplified.
              </Text>
            </Animated.View>

            {/* Card */}
            <Animated.View style={styles.card} layout={Layout.duration(300)}>
              {/* Mode Toggle */}
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  onPress={() => !loading && mode !== "signin" && switchMode()}
                  style={[
                    styles.toggleButton,
                    mode === "signin" && styles.toggleButtonActive,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      mode === "signin" && styles.toggleTextActive,
                    ]}
                  >
                    Sign In
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => !loading && mode !== "signup" && switchMode()}
                  style={[
                    styles.toggleButton,
                    mode === "signup" && styles.toggleButtonActive,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      mode === "signup" && styles.toggleTextActive,
                    ]}
                  >
                    Sign Up
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Error Message with animation */}
              {error ? (
                <Animated.View
                  entering={FadeIn.duration(200)}
                  exiting={FadeOut.duration(200)}
                  style={styles.errorContainer}
                >
                  <Text style={styles.errorText}>{error}</Text>
                </Animated.View>
              ) : null}

              {/* Form */}
              <View style={styles.form}>
                {/* Name Input (Sign Up Only) */}
                {mode === "signup" && (
                  <Animated.View
                    entering={FadeIn.duration(250).springify()}
                    exiting={FadeOut.duration(200)}
                    layout={Layout.springify()}
                  >
                    <View style={styles.inputContainer}>
                      <Feather
                        name="user"
                        size={16}
                        color="#5a5a6e"
                        style={styles.inputIcon}
                      />
                      <TextInput
                        placeholder="Full name"
                        placeholderTextColor="#5a5a6e"
                        value={name}
                        onChangeText={setName}
                        editable={!loading}
                        style={styles.input}
                        autoCapitalize="words"
                      />
                    </View>
                  </Animated.View>
                )}

                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <Feather
                    name="mail"
                    size={16}
                    color="#5a5a6e"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="Email address"
                    placeholderTextColor="#5a5a6e"
                    value={email}
                    onChangeText={setEmail}
                    editable={!loading}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    style={styles.input}
                  />
                </View>

                {/* Password Input */}
                <View style={styles.inputContainer}>
                  <Feather
                    name="lock"
                    size={16}
                    color="#5a5a6e"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="Password"
                    placeholderTextColor="#5a5a6e"
                    value={password}
                    onChangeText={setPassword}
                    editable={!loading}
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    style={[styles.input, { paddingRight: 44 }]}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Feather
                      name={showPassword ? "eye-off" : "eye"}
                      size={16}
                      color="#5a5a6e"
                    />
                  </TouchableOpacity>
                </View>

                {/* Submit Button */}
                <Animated.View style={submitAnimatedStyle}>
                  <TouchableOpacity
                    onPress={handleAuth}
                    onPressIn={onSubmitPressIn}
                    onPressOut={onSubmitPressOut}
                    disabled={loading}
                    activeOpacity={1}
                    style={[
                      styles.submitButtonWrapper,
                      loading && { opacity: 0.6 },
                    ]}
                  >
                    <LinearGradient
                      colors={["#6c47ff", "#8b6fff"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.submitGradient}
                    >
                      {loading ? (
                        <LoadingSpinner color="#fff" size={18} />
                      ) : (
                        <>
                          <Text style={styles.submitText}>
                            {mode === "signin" ? "Sign In" : "Create Account"}
                          </Text>
                          <Feather name="arrow-right" size={16} color="white" />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              </View>

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google Sign-In Button */}
              <TouchableOpacity
                onPress={handleGoogleAuth}
                disabled={loading}
                activeOpacity={0.7}
                style={[
                  styles.googleButton,
                  loading && { opacity: 0.5 },
                ]}
              >
                <GoogleLogo size={18} />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Footer */}
            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>
                {mode === "signin"
                  ? "Don't have an account? "
                  : "Already have an account? "}
              </Text>
              <TouchableOpacity onPress={switchMode} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.footerActionText}>
                  {mode === "signin" ? "Sign up" : "Sign in"}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0f",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  formWrapper: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
    zIndex: 10,
    paddingVertical: 40,
  },

  // Header / Logo
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoMask: {
    fontSize: 38,
    fontWeight: "900",
    textAlign: "center",
  },
  logoGradient: {
    alignItems: "center",
  },
  subtitleText: {
    color: "#5a5a6e",
    fontSize: 14,
    marginTop: 8,
  },

  // Card
  card: {
    backgroundColor: "rgba(20, 20, 27, 0.8)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
    elevation: 12,
  },

  // Toggle
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#0f0f16",
    borderRadius: 12,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    marginBottom: 24,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleButtonActive: {
    backgroundColor: "rgba(108, 71, 255, 0.2)",
    shadowColor: "#6c47ff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 2,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#5a5a6e",
  },
  toggleTextActive: {
    color: "#8b6fff",
  },

  // Error
  errorContainer: {
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "rgba(255, 79, 107, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 79, 107, 0.2)",
    borderRadius: 12,
  },
  errorText: {
    fontSize: 12,
    color: "#ff4f6b",
  },

  // Form
  form: {
    gap: 14,
  },
  inputContainer: {
    position: "relative",
    justifyContent: "center",
  },
  inputIcon: {
    position: "absolute",
    left: 14,
    zIndex: 10,
  },
  input: {
    width: "100%",
    backgroundColor: "#1a1a24",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
    paddingLeft: 44,
    paddingRight: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: "#ffffff",
  },
  eyeIcon: {
    position: "absolute",
    right: 14,
    zIndex: 10,
  },

  // Submit
  submitButtonWrapper: {
    marginTop: 4,
    borderRadius: 12,
    overflow: "hidden",
  },
  submitGradient: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  submitText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },

  // Divider
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  dividerText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#5a5a6e",
    letterSpacing: 2,
  },

  // Google
  googleButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 12,
  },
  googleButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },

  // Footer
  footerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  footerText: {
    color: "#5a5a6e",
    fontSize: 11,
  },
  footerActionText: {
    color: "#8b6fff",
    fontWeight: "700",
    fontSize: 11,
  },

  // Background glows
  glowTopLeft: {
    position: "absolute",
    top: "-20%",
    left: "-10%",
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.7,
    borderRadius: 9999,
    backgroundColor: "rgba(108, 71, 255, 0.12)",
  },
  glowBottomRight: {
    position: "absolute",
    bottom: "-15%",
    right: "-10%",
    width: SCREEN_WIDTH * 0.6,
    height: SCREEN_WIDTH * 0.6,
    borderRadius: 9999,
    backgroundColor: "rgba(184, 255, 87, 0.06)",
  },
});
