import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { BrandColor, BrandSpace, BrandType } from '@/constants/brand';

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
 * Fills in spruce — including when the week is won — and only turns rose
 * once the user is over target.
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

  const trackPath = arcPath(center, radius, startAngle, startAngle + sweep);
  const progressPath =
    filled > 0 ? arcPath(center, radius, startAngle, startAngle + sweep * filled) : null;

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: target, now: current }}
      accessibilityLabel={`${current} of ${target} this week`}
      style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Path
          d={trackPath}
          stroke={BrandColor.spruceSoft}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
        />
        {progressPath ? (
          <Path
            d={progressPath}
            stroke={isOver ? BrandColor.rose : BrandColor.spruce}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
          />
        ) : null}
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
