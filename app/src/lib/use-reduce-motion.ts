import { useReducedMotion } from "react-native-reanimated";

/**
 * Returns `true` when the user has enabled "Remove animations" in
 * Android accessibility settings. Continuous/looping animations
 * (VU meter, shockwave) should be frozen; transitional UI feedback
 * (PressableScale, sheet open/close) stays unchanged.
 */
export function useReduceMotion(): boolean {
  return useReducedMotion();
}
