import { useImperativeHandle, useRef, type Ref } from 'react';
import Svg, { Path, Rect, Text as SvgText } from 'react-native-svg';

import { BrandBorderWidth, BrandColor, BrandRadius } from '@/constants/brand';

/**
 * The card is drawn in a fixed coordinate space and scaled to fit, so every
 * number below is a constant and none of them depends on the screen.
 */
const CARD_WIDTH = 320;
const CARD_HEIGHT = 360;

const RING_CENTER_X = CARD_WIDTH / 2;
const RING_CENTER_Y = 160;
const RING_RADIUS = 82;
const RING_STROKE = 12;

/** The same open gap at the top that the weekly ring has. */
const GAP_ANGLE = 64;

export type MilestoneCardHandle = {
  /** Renders the card to a base64 PNG, or null if the view is not ready. */
  toPngBase64: () => Promise<string | null>;
};

export type MilestoneCardProps = {
  /** The milestone number, alone. */
  figure: string;
  /** What the number counts — "days in a row". */
  unit: string;
  /** Rendered width in points. The card keeps its own proportions. */
  width?: number;
  ref?: Ref<MilestoneCardHandle>;
};

function pointOnRing(angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: RING_CENTER_X + RING_RADIUS * Math.sin(rad),
    y: RING_CENTER_Y - RING_RADIUS * Math.cos(rad),
  };
}

/** One closed-but-for-the-gap arc, clockwise from just right of twelve. */
function ringPath(): string {
  const sweep = 360 - GAP_ANGLE;
  const start = pointOnRing(GAP_ANGLE / 2);
  const end = pointOnRing(GAP_ANGLE / 2 + sweep);
  return `M ${start.x} ${start.y} A ${RING_RADIUS} ${RING_RADIUS} 0 1 1 ${end.x} ${end.y}`;
}

/**
 * The image a milestone can be shared as.
 *
 * Drawn in SVG rather than captured from the screen, for two reasons. It keeps
 * the export inside `react-native-svg`, which is already in Expo Go, so no
 * native screenshot module is needed. And it makes the promise on the tin
 * literally true: the card can only contain what is drawn here, so there is no
 * way for a name, an email, a drink count, or a date to end up on an image the
 * user posts. The number, the ring, and the wordmark — nothing else exists to
 * leak.
 *
 * No `fontFamily` is set anywhere: the platform default inside SVG is the
 * system font, which is `BrandFont.ui` by another name, and naming it here
 * risks a fallback that renders the card in something else entirely.
 */
export function MilestoneCard({ figure, unit, width = CARD_WIDTH, ref }: MilestoneCardProps) {
  const svgRef = useRef<Svg>(null);

  useImperativeHandle(
    ref,
    () => ({
      toPngBase64: () =>
        new Promise<string | null>((resolve) => {
          const node = svgRef.current;
          if (!node?.toDataURL) {
            resolve(null);
            return;
          }
          node.toDataURL((data) => resolve(data || null));
        }),
    }),
    []
  );

  return (
    <Svg
      ref={svgRef}
      width={width}
      height={(width * CARD_HEIGHT) / CARD_WIDTH}
      viewBox={`0 0 ${CARD_WIDTH} ${CARD_HEIGHT}`}
      accessibilityLabel={`${figure} ${unit}`}>
      <Rect x={0} y={0} width={CARD_WIDTH} height={CARD_HEIGHT} fill={BrandColor.paper} />
      <Rect
        x={BrandBorderWidth / 2}
        y={BrandBorderWidth / 2}
        width={CARD_WIDTH - BrandBorderWidth}
        height={CARD_HEIGHT - BrandBorderWidth}
        rx={BrandRadius.card}
        fill="none"
        stroke={BrandColor.line}
        strokeWidth={BrandBorderWidth}
      />

      <Path
        d={ringPath()}
        stroke={BrandColor.spruce}
        strokeWidth={RING_STROKE}
        strokeLinecap="round"
        fill="none"
      />

      <SvgText
        x={RING_CENTER_X}
        y={RING_CENTER_Y + 16}
        textAnchor="middle"
        fontSize={56}
        fontWeight="700"
        fill={BrandColor.spruce}>
        {figure}
      </SvgText>
      <SvgText
        x={RING_CENTER_X}
        y={RING_CENTER_Y + 44}
        textAnchor="middle"
        fontSize={13}
        fontWeight="500"
        letterSpacing={0.6}
        fill={BrandColor.inkMuted}>
        {unit.toUpperCase()}
      </SvgText>

      <SvgText
        x={RING_CENTER_X}
        y={CARD_HEIGHT - 44}
        textAnchor="middle"
        fontSize={13}
        fontWeight="600"
        letterSpacing={4}
        fill={BrandColor.spruce}>
        MESURA
      </SvgText>
    </Svg>
  );
}
