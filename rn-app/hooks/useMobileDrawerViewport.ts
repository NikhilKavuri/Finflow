import { useEffect, useState } from "react";
import { Dimensions } from "react-native";

export function useMobileDrawerViewport() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(Dimensions.get("window").height);

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setViewportHeight(window.height);
      
      // Calculate keyboard height from viewport change
      const screenHeight = Dimensions.get("screen").height;
      const keyboardHeight = screenHeight - window.height;
      setKeyboardHeight(Math.max(0, keyboardHeight));
    });

    return () => subscription?.remove();
  }, []);

  return {
    keyboardHeight,
    viewportHeight,
    offsetBottom: keyboardHeight > 0 ? keyboardHeight + 10 : 0,
  };
}

export function useScreenDimensions() {
  const [dimensions, setDimensions] = useState({
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setDimensions({
        width: window.width,
        height: window.height,
      });
    });

    return () => subscription?.remove();
  }, []);

  return dimensions;
}

export function useIsLandscape() {
  const { width, height } = useScreenDimensions();
  return width > height;
}

export function useIsMobile() {
  const { width } = useScreenDimensions();
  return width < 768;
}

export function useIsTablet() {
  const { width } = useScreenDimensions();
  return width >= 768 && width < 1024;
}
