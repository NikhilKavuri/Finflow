import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, ScrollView, Platform, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { useRouter } from "expo-router";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Feather, AntDesign } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

type AuthMode = "signin" | "signup";

export default function LoginScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const switchMode = () => {
    setMode((m) => (m === "signin" ? "signup" : "signin"));
    setError("");
  };

  const handleAuth = async () => {
    setError("");

    if (!email.trim()) { setError("Email is required."); return; }
    if (!password.trim()) { setError("Password is required."); return; }
    if (mode === "signup" && !name.trim()) { setError("Name is required."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }

    setLoading(true);

    try {
      if (mode === "signup") {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
      router.replace("/(app)/overview");
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    Alert.alert("Coming Soon", "Google Sign-In native implementation is required for mobile.");
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        {/* Background glow effects */}
        <View style={styles.glowTopLeft} />
        <View style={styles.glowBottomRight} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formWrapper}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.logoText}>FinFlow</Text>
              <Text style={styles.subtitleText}>
                Smart expense tracking, simplified.
              </Text>
            </View>

            {/* Main Card */}
            <View style={styles.card}>
              
              {/* Mode Toggle */}
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  onPress={() => !loading && switchMode()}
                  style={[styles.toggleButton, mode === "signin" && styles.toggleButtonActive]}
                >
                  <Text style={[styles.toggleText, mode === "signin" && styles.toggleTextActive]}>
                    Sign In
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => !loading && switchMode()}
                  style={[styles.toggleButton, mode === "signup" && styles.toggleButtonActive]}
                >
                  <Text style={[styles.toggleText, mode === "signup" && styles.toggleTextActive]}>
                    Sign Up
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Error Message */}
              {error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* Form */}
              <View style={styles.form}>
                {/* Name Input (Sign Up Only) */}
                {mode === "signup" && (
                  <View style={styles.inputContainer}>
                    <Feather name="user" size={16} color="#5a5a6e" style={styles.inputIcon} />
                    <TextInput
                      placeholder="Full name"
                      placeholderTextColor="#5a5a6e"
                      value={name}
                      onChangeText={setName}
                      editable={!loading}
                      style={styles.input}
                    />
                  </View>
                )}

                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <Feather name="mail" size={16} color="#5a5a6e" style={styles.inputIcon} />
                  <TextInput
                    placeholder="Email address"
                    placeholderTextColor="#5a5a6e"
                    value={email}
                    onChangeText={setEmail}
                    editable={!loading}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.input}
                  />
                </View>

                {/* Password Input */}
                <View style={styles.inputContainer}>
                  <Feather name="lock" size={16} color="#5a5a6e" style={styles.inputIcon} />
                  <TextInput
                    placeholder="Password"
                    placeholderTextColor="#5a5a6e"
                    value={password}
                    onChangeText={setPassword}
                    editable={!loading}
                    secureTextEntry={!showPassword}
                    style={styles.input}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Feather
                      name={showPassword ? "eye-off" : "eye"}
                      size={16}
                      color="#5a5a6e"
                    />
                  </TouchableOpacity>
                </View>

                {/* Submit Button */}
                <TouchableOpacity onPress={handleAuth} disabled={loading} activeOpacity={0.8} style={styles.submitButtonWrapper}>
                  <LinearGradient
                    colors={['#6c47ff', '#8b6fff']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.submitGradient}
                  >
                    {loading ? (
                      <ActivityIndicator color="white" size="small" />
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
              </View>

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google Button */}
              <TouchableOpacity
                onPress={handleGoogleAuth}
                disabled={loading}
                activeOpacity={0.7}
                style={styles.googleButton}
              >
                <AntDesign name="google" size={18} color="white" style={styles.googleIcon} />
                <Text style={styles.googleButtonText}>
                  Continue with Google
                </Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>
                {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
              </Text>
              <TouchableOpacity onPress={switchMode}>
                <Text style={styles.footerActionText}>
                  {mode === "signin" ? "Sign up" : "Sign in"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
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
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoText: {
    color: "#ffffff",
    fontSize: 36,
    fontWeight: "900",
    marginBottom: 8,
  },
  subtitleText: {
    color: "#5a5a6e",
    fontSize: 14,
  },
  card: {
    backgroundColor: "rgba(20, 20, 27, 0.8)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 8,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#0f0f16",
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    marginBottom: 24,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleButtonActive: {
    backgroundColor: "rgba(108, 71, 255, 0.2)",
  },
  toggleText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#5a5a6e",
  },
  toggleTextActive: {
    color: "#8b6fff",
  },
  errorContainer: {
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "rgba(255, 79, 107, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 79, 107, 0.2)",
    borderRadius: 12,
  },
  errorText: {
    fontSize: 12,
    color: "#ff4f6b",
  },
  form: {
    gap: 14,
    width: "100%",
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
  submitButtonWrapper: {
    marginTop: 4,
  },
  submitGradient: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  submitText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 14,
    marginRight: 8,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  dividerText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#5a5a6e",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
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
  },
  googleIcon: {
    marginRight: 12,
  },
  googleButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  footerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 32,
  },
  footerText: {
    color: "#5a5a6e",
    fontSize: 12,
  },
  footerActionText: {
    color: "#8b6fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  glowTopLeft: {
    position: 'absolute',
    top: '-15%',
    left: '-20%',
    width: '60%',
    aspectRatio: 1,
    borderRadius: 9999,
    backgroundColor: 'rgba(108,71,255,0.06)',
  },
  glowBottomRight: {
    position: 'absolute',
    bottom: '-15%',
    right: '-20%',
    width: '50%',
    aspectRatio: 1,
    borderRadius: 9999,
    backgroundColor: 'rgba(184,255,87,0.03)',
  },
});
