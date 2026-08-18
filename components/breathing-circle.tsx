import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { BrandColor, BrandSpace } from '@/constants/brand';

/**
 * The pace of the breath, in milliseconds. 4 in, 4 held, 6 out — a longer
 * exhale than inhale, which is the part that actually settles a nervous
 * system. One cycle is 14 seconds.
 */
export const BREATH_IN_MS = 4000;
export const BREATH_HOLD_MS = 4000;
export const BREATH_OUT_MS = 6000;
export const BREATH_CYCLE_MS = BREATH_IN_MS + BREATH_HOLD_MS + BREATH_OUT_MS;

export type BreathPhase = 'in' | 'hold' | 'out' | 'done';

/** What the circle says during each phase. */
export const BREATH_LABEL: Record<BreathPhase, string> = {
  in: 'Breathe in',
  hold: 'Hold',
  out: 'Breathe out',
  done: 'Rest',
};

/** How small the circle gets at the bottom of a breath, as a fraction of `size`. */
const MIN_SCALE = 0.55;
/** Where it settles once the ninety seconds are up. */
const REST_SCALE = 0.78;

export type BreathingCircleProps = {
  /** Which part of the breath is happening now. Drives the animation. */
  phase: BreathPhase;
  /** Outer diameter in points, at full expansion. */
  size?: number;
  /** Rendered in the middle, at a fixed size — it must not scale with the ring. */
  children?: React.ReactNode;
};

/**
 * A circle that breathes: it expands over four seconds, holds for four, and
 * contracts over six.
 *
 * The phase is passed in rather than owned here, because the screen also
 * counts the ninety seconds down and the two must never disagree — a circle
 * contracting under the word "Hold" is worse than no guide at all. One clock
 * drives both.
 */
export function BreathingCircle({ phase, size = 200, children }: BreathingCircleProps) {
  const scale = useSharedValue(MIN_SCALE);

  useEffect(() => {
    if (phase === 'in') {
      scale.value = withTiming(1, {
        duration: BREATH_IN_MS,
        easing: Easing.inOut(Easing.ease),
      });
    } else if (phase === 'out') {
      scale.value = withTiming(MIN_SCALE, {
        duration: BREATH_OUT_MS,
        easing: Easing.inOut(Easing.ease),
      });
    } else if (phase === 'done') {
      scale.value = withTiming(REST_SCALE, {
        duration: 1200,
        easing: Easing.out(Easing.ease),
      });
    }
    // 'hold' deliberately does nothing: holding is the absence of movement.
  }, [phase, scale]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View style={[styles.frame, { width: size, height: size }]}>
      {/* The faint outer ring marks full expansion, so the breath has a target. */}
      <View
        style={[styles.track, { width: size, height: size, borderRadius: size / 2 }]}
        pointerEvents="none"
      />
      <Animated.View
        style={[
          styles.circle,
          { width: size, height: size, borderRadius: size / 2 },
          animatedStyle,
        ]}
        pointerEvents="none"
      />
      <View style={styles.center} pointerEvents="none">
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: BrandColor.spruceSoft,
  },
  circle: {
    position: 'absolute',
    backgroundColor: BrandColor.spruceSoft,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: BrandSpace.xs,
  },
});
