---
name: finflow-mobile-design-system
description: >
  FinFlow React Native mobile app design system reference. Contains the complete color palette, typography,
  component patterns, animation conventions, spacing rules, and screen layout patterns used throughout the app.
  Reference this skill whenever making UI changes to maintain visual consistency with the FinFlow brand.
---

# FinFlow Mobile Design System (React Native / Expo)

This document defines the complete design system for the FinFlow React Native mobile app. All UI changes
should follow these conventions to maintain consistency across the app and with the companion web app.

---

## Color Palette

### Backgrounds
| Token           | Value                           | Usage                              |
|-----------------|---------------------------------|------------------------------------|
| `bg-base`       | `#0a0a0f`                       | Screen backgrounds, tab bar        |
| `bg-card`       | `rgba(20, 20, 27, 0.8)`        | Cards, modal surfaces              |
| `bg-input`      | `#1a1a24`                       | Text inputs, search bars           |
| `bg-toggle`     | `#0f0f16`                       | Toggle containers, segmented controls |

### Accents
| Token           | Value        | Usage                              |
|-----------------|--------------|-------------------------------------|
| `accent`        | `#6c47ff`    | Gradient start, primary action bg   |
| `accent2`       | `#8b6fff`    | Gradient end, active tab text, links|
| `lime`          | `#b8ff57`    | Gradient text end, success accents  |
| `accent-glow`   | `rgba(108, 71, 255, 0.12-0.3)` | Background glow orbs   |
| `lime-glow`     | `rgba(184, 255, 87, 0.06)`     | Secondary glow orbs    |

### Text
| Token           | Value        | Usage                              |
|-----------------|--------------|-------------------------------------|
| `text-primary`  | `#ffffff`    | Headings, input text, button labels |
| `text-muted`    | `#5a5a6e`    | Subtitles, placeholders, disabled   |
| `text-secondary`| `#9898aa`    | Hover/active muted text             |

### Borders
| Token           | Value                           | Usage                              |
|-----------------|---------------------------------|------------------------------------|
| `border-subtle` | `rgba(255, 255, 255, 0.08)`    | Card borders, input borders, dividers |
| `border-softer` | `rgba(255, 255, 255, 0.06)`    | Toggle container border            |
| `border-tab`    | `rgba(255, 255, 255, 0.05)`    | Tab bar top border                 |

### Status Colors
| Token           | Value        | Usage                              |
|-----------------|--------------|-------------------------------------|
| `error`         | `#ff4f6b`    | Error text                         |
| `error-bg`      | `rgba(255, 79, 107, 0.1)`      | Error background         |
| `error-border`  | `rgba(255, 79, 107, 0.2)`      | Error border             |

---

## Typography

### Font Weights
- **900 (Black):** Logo, major headings
- **700 (Bold):** Button labels, toggle text, section headers
- **600 (SemiBold):** Google button text, secondary buttons
- **500 (Medium):** Body text, loader subtitles
- **400 (Regular):** Input text

### Font Sizes
| Element          | Size  | Weight | Style    |
|------------------|-------|--------|----------|
| Logo (`FinFlow`) | 38    | 900    | italic   |
| Page heading     | 28-32 | 700-900| normal   |
| Section heading  | 18-20 | 700    | normal   |
| Button text      | 14    | 700    | normal   |
| Input text       | 14    | 400    | normal   |
| Toggle text      | 12    | 700    | normal   |
| Footer text      | 11    | 400    | normal   |
| Divider text     | 10    | 600    | normal   |
| Tab label        | 10    | 700    | normal   |

### Gradient Text (Logo)
Use `@react-native-masked-view/masked-view` + `expo-linear-gradient`:
```tsx
<MaskedView maskElement={<Text style={logoStyle}>FinFlow</Text>}>
  <LinearGradient colors={["#8b6fff", "#b8ff57"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
    <Text style={[logoStyle, { opacity: 0 }]}>FinFlow</Text>
  </LinearGradient>
</MaskedView>
```

---

## Component Patterns

### Glassmorphic Card
```tsx
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
}
```

### Text Input (Dark with Icon)
```tsx
<View style={{ position: "relative", justifyContent: "center" }}>
  <Feather name="icon-name" size={16} color="#5a5a6e" style={{ position: "absolute", left: 14, zIndex: 10 }} />
  <TextInput
    placeholderTextColor="#5a5a6e"
    style={{
      backgroundColor: "#1a1a24",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.08)",
      borderRadius: 12,
      paddingLeft: 44,
      paddingRight: 16,
      paddingVertical: 14,
      fontSize: 14,
      color: "#ffffff",
    }}
  />
</View>
```

### Gradient Button
```tsx
<TouchableOpacity activeOpacity={1}>
  <LinearGradient
    colors={["#6c47ff", "#8b6fff"]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={{
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
    }}
  >
    <Text style={{ color: "#ffffff", fontWeight: "700", fontSize: 14 }}>Button Text</Text>
    <Feather name="arrow-right" size={16} color="white" />
  </LinearGradient>
</TouchableOpacity>
```

### Outlined Button (e.g. Google Sign-In)
```tsx
{
  paddingVertical: 14,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: "rgba(255, 255, 255, 0.08)",
  backgroundColor: "rgba(255, 255, 255, 0.03)",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: 12,
}
```

### Mode Toggle (Segmented Control)
```tsx
// Container
{
  flexDirection: "row",
  backgroundColor: "#0f0f16",
  borderRadius: 12,
  padding: 4,
  gap: 4,
  borderWidth: 1,
  borderColor: "rgba(255, 255, 255, 0.06)",
}

// Active button
{
  backgroundColor: "rgba(108, 71, 255, 0.2)",
  shadowColor: "#6c47ff",
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.15,
  shadowRadius: 12,
}

// Active text: color "#8b6fff"
// Inactive text: color "#5a5a6e"
```

### OR Divider
```tsx
<View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 20 }}>
  <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: "rgba(255, 255, 255, 0.06)" }} />
  <Text style={{ fontSize: 10, fontWeight: "600", color: "#5a5a6e", letterSpacing: 2 }}>OR</Text>
  <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: "rgba(255, 255, 255, 0.06)" }} />
</View>
```

### Error Banner
```tsx
{
  paddingHorizontal: 12,
  paddingVertical: 10,
  backgroundColor: "rgba(255, 79, 107, 0.1)",
  borderWidth: 1,
  borderColor: "rgba(255, 79, 107, 0.2)",
  borderRadius: 12,
}
// Text: fontSize: 12, color: "#ff4f6b"
```

---

## Animation Patterns

All animations use `react-native-reanimated`.

### Screen Mount
```tsx
// Container: fade-in + slide up
containerOpacity.value = withTiming(1, { duration: 600, easing: Easing.bezier(0.4, 0, 0.2, 1) });
containerTranslateY.value = withTiming(0, { duration: 600, easing: Easing.bezier(0.4, 0, 0.2, 1) });
// Initial values: opacity=0, translateY=30

// Logo: scale-in with delay
logoScale.value = withDelay(100, withSpring(1, { damping: 15, stiffness: 150 }));
logoOpacity.value = withDelay(100, withTiming(1, { duration: 500 }));
// Initial values: scale=0.8, opacity=0
```

### Button Press Feedback
```tsx
// onPressIn:
scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
// onPressOut:
scale.value = withSpring(1, { damping: 15, stiffness: 400 });
```

### Loading Spinner
```tsx
rotation.value = withRepeat(
  withTiming(360, { duration: 800, easing: Easing.linear }),
  -1, false
);
// Render: circular view with borderTopColor as accent, other borders as rgba(255,255,255,0.2)
```

### Background Glow Pulse
```tsx
pulse.value = withRepeat(
  withSequence(
    withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
    withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.ease) })
  ),
  -1, true
);
// Animate opacity between 0.6-1.0, scale between 1.0-1.05
```

### Element Enter/Exit
```tsx
// Use reanimated layout animations:
entering={FadeIn.duration(200)}
exiting={FadeOut.duration(200)}
layout={Layout.springify()}
// Or Layout.duration(300) for smoother layout shifts
```

### Screen Transitions
- Auth ↔ App: `animation: "fade"`, `animationDuration: 250`
- Modals: `animation: "slide_from_bottom"`, `animationDuration: 300`
- Auth screens: `animation: "fade"`, `animationDuration: 250`

---

## Spacing & Layout

### Border Radius
| Element       | Radius |
|---------------|--------|
| Cards         | 24     |
| Inputs        | 12     |
| Buttons       | 12     |
| Toggles (outer)| 12   |
| Toggle buttons| 8      |
| FAB           | 25 (half of 50w) |
| Glow orbs     | 9999   |

### Standard Padding
| Context        | Value  |
|----------------|--------|
| Screen horizontal| 24   |
| Card inner     | 24     |
| Input vertical | 14     |
| Input left (with icon)| 44 |
| Input right    | 16     |
| Button vertical| 14     |
| Toggle button vertical| 10 |

### Standard Gaps
| Context        | Value  |
|----------------|--------|
| Form fields    | 14     |
| Toggle buttons | 4      |
| Divider items  | 12     |
| Button icon    | 8      |
| Google icon    | 12     |

### Standard Margins
| Context        | Value  |
|----------------|--------|
| Logo to card   | 32     |
| Toggle to form | 24     |
| Error to form  | 16     |
| Divider vertical| 20   |
| Card to footer | 24     |

---

## Screen Layout Pattern

All screens follow this structure:
```tsx
<SafeAreaView style={{ flex: 1, backgroundColor: "#0a0a0f" }}>
  <KeyboardAvoidingView
    behavior={Platform.OS === "ios" ? "padding" : "height"}
    style={{ flex: 1 }}
  >
    <ScrollView
      contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      bounces={false}
    >
      {/* Content */}
    </ScrollView>
  </KeyboardAvoidingView>
</SafeAreaView>
```

---

## Icon System

- **Primary icon set:** `@expo/vector-icons/Feather`
- **Standard sizes:** 16 (inline/input icons), 20-24 (navigation/FAB), size prop from tab bar
- **Icon color (active):** `#8b6fff`
- **Icon color (inactive):** `#5a5a6e`
- **Icon color (on accent bg):** `#ffffff`

---

## Tab Bar

```tsx
tabBarStyle: {
  backgroundColor: "#0a0a0f",
  borderTopColor: "rgba(255, 255, 255, 0.05)",
  borderTopWidth: 1,
  paddingBottom: Platform.OS === "ios" ? 28 : 12,
  paddingTop: 12,
  height: Platform.OS === "ios" ? 92 : 72,
}
tabBarActiveTintColor: "#8b6fff"
tabBarInactiveTintColor: "#5a5a6e"
tabBarLabelStyle: { fontSize: 10, fontWeight: "700" }
```

### FAB (Center Add Button)
```tsx
{
  width: 50,
  height: 50,
  borderRadius: 25,
  // LinearGradient colors: ["#6c47ff", "#8b6fff"]
  shadowColor: "#6c47ff",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.4,
  shadowRadius: 8,
  borderWidth: 2,
  borderColor: "#0a0a0f",
}
```

---

## Background Glow Effects

Large translucent circles used for ambient lighting on dark screens:
```tsx
// Purple glow (top-left)
{
  position: "absolute",
  top: "-20%",
  left: "-10%",
  width: SCREEN_WIDTH * 0.7,
  height: SCREEN_WIDTH * 0.7,
  borderRadius: 9999,
  backgroundColor: "rgba(108, 71, 255, 0.12)",
}

// Lime glow (bottom-right)
{
  position: "absolute",
  bottom: "-15%",
  right: "-10%",
  width: SCREEN_WIDTH * 0.6,
  height: SCREEN_WIDTH * 0.6,
  borderRadius: 9999,
  backgroundColor: "rgba(184, 255, 87, 0.06)",
}
```

---

## Dependencies

| Package | Purpose |
|---------|---------|
| `react-native-reanimated` | All animations |
| `expo-linear-gradient` | Gradient buttons, gradient text |
| `@react-native-masked-view/masked-view` | Gradient text masking |
| `@expo/vector-icons` (Feather) | Icon system |
| `react-native-safe-area-context` | Safe area insets |
| `expo-auth-session` + `expo-web-browser` + `expo-crypto` | Google OAuth |
| `react-native-svg` | Custom SVGs (Google logo) |

---

## Refactoring & Component Extraction

When extracting UI components or refactoring screens to create shared components:

1. **Clean Up `StyleSheet`**: Always clean up the `StyleSheet.create` block in the original file to remove styles that were moved to the new component.
2. **Remove Obsolete Variable References**: Ensure that any variable references (like `SCREEN_WIDTH`, `Dimensions`, or local state) are removed from the original file if they are no longer used. Leaving obsolete references in the original file (e.g., inside an unused style block) will cause a runtime `ReferenceError` and crash the React Native bundler.
3. **Verify Expo Router Exports**: For `expo-router` files (like `_layout.tsx` or screen files), a crash during module evaluation (like a `ReferenceError`) will cause the default export to fail to register, resulting in a confusing `missing the required default export` error. Always double check your cleanup.

## React Rules of Hooks & Reanimated

When rendering lists of elements with Reanimated animations, never call `useAnimatedStyle` (or any other React hook) directly inside a `.map()` callback:
```tsx
// ❌ WRONG: Violates Rules of Hooks
{items.map(item => {
  const style = useAnimatedStyle(() => ({ ... })); // WILL CRASH!
  return <AnimatedView style={style} />
})}
```
Instead, **extract the individual item into a separate component** so the hook runs correctly inside its own component lifecycle:
```tsx
// ✅ CORRECT: Extract component
const AnimatedItem = ({ item }) => {
  const style = useAnimatedStyle(() => ({ ... }));
  return <AnimatedView style={style} />
};

// ... in your main component:
{items.map(item => <AnimatedItem key={item.id} item={item} />)}
```
