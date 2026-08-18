import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { BrandColor, BrandSpace, BrandType } from '@/constants/brand';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Long enough to read as movement, short enough that a second drink logged
 * straight after does not feel like waiting. Eased out, never bounced: the
 * reward here is calm, not a confetti cannon.
 */
const FILL_DURATION_MS = 700;

export type ProgressRingProps = {
  /** Drinks logged so far this week. */
  current: number;
  /** The number the user set for the week. */
  target: number;
  /** Outer diameter in points. */
  size?: number;
  /** Ring thickness in points. */
  strokeWidth?: number;
  /** Size of the open gap at the top, in degrees. */
  gapAngle?: number;
  /** Replaces the default number stack in the middle of the ring. */
  children?: React.ReactNode;
};

/** Angles run clockwise from 12 o'clock, which is where the gap is centred. */
function pointOnRing(center: number, radius: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: center + radius * Math.sin(rad),
    y: center - radius * Math.cos(rad),
  };
}

function arcPath(center: number, radius: number, startAngle: number, endAngle: number) {
  const start = pointOnRing(center, radius, startAngle);
  const end = pointOnRing(center, radius, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

/**
 * The weekly number, drawn as a ring with an open gap at the top.
 *
 * Fills in spruce — including when the week is won — and only turns rose once
 * the user is over target. The fill is one path drawn to full length and
 * revealed by its dash offset, which is what lets it animate smoothly instead
 * of being re-cut on every render.
 */
export function ProgressRing({
  current,
  target,
  size = 200,
  strokeWidth = 14,
  gapAngle = 64,
  children,
}: ProgressRingProps) {
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const sweep = 360 - gapAngle;
  const startAngle = gapAngle / 2;

  const ratio = target > 0 ? current / target : 0;
  const isOver = ratio > 1;
  const filled = Math.max(0, Math.min(ratio, 1));

  const path = arcPath(center, radius, startAngle, startAngle + sweep);
  const arcLength = radius * ((sweep * Math.PI) / 180);

  /**
   * Starts empty on every mount so the first paint after the week loads is the
   * ring filling, rather than a ring that was already full.
   */
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(filled, {
      duration: FILL_DURATION_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [filled, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: arcLength * (1 - progress.value),
  }));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: target, now: current }}
      accessibilityLabel={`${current} of ${target} this week`}
      style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Path
          d={path}
          stroke={BrandColor.spruceSoft}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
        />
        <AnimatedPath
          d={path}
          stroke={isOver ? BrandColor.rose : BrandColor.spruce}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={[arcLength, arcLength]}
          animatedProps={animatedProps}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        {children ?? (
          <>
            <Text style={[styles.value, isOver && styles.valueOver]}>{current}</Text>
            <Text style={styles.caption}>of {target} this week</Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: BrandSpace.xs,
  },
  value: {
    ...BrandType.numeric,
    color: BrandColor.spruce,
  },
  valueOver: {
    color: BrandColor.rose,
  },
  caption: {
    ...BrandType.caption,
    color: BrandColor.inkMuted,
  },
});
