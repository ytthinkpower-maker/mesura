import { Modal, Pressable, StyleSheet, Text, View, type ModalProps } from 'react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  BrandBorderWidth,
  BrandColor,
  BrandRadius,
  BrandSpace,
  BrandType,
} from '@/constants/brand';

export type SheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Shown at the top of the sheet. Short — this is a decision, not a page. */
  title: string;
  /** One quiet line under the title, when the title needs help. */
  subtitle?: string;
  children: React.ReactNode;
} & Pick<ModalProps, 'onDismiss'>;

/**
 * A panel that comes up from the bottom, closed by tapping away from it.
 *
 * Built on the platform `Modal` rather than a sheet library: the core loop has
 * to work in Expo Go, and nothing here needs gestures that a tap cannot do.
 * The backdrop fades with the modal while the panel slides, so the dimming
 * never appears to arrive from below.
 */
export function Sheet({ visible, onClose, title, subtitle, children, onDismiss }: SheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
      onDismiss={onDismiss}>
      <View style={styles.root}>
        <Pressable
          style={styles.backdrop}
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={onClose}
        />
        <Animated.View
          entering={SlideInDown.duration(240)}
          style={[styles.panel, { paddingBottom: insets.bottom + BrandSpace.xl }]}>
          <View style={styles.grabber} />
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          <View style={styles.body}>{children}</View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(25, 28, 27, 0.35)',
  },
  panel: {
    backgroundColor: BrandColor.paper,
    borderTopLeftRadius: BrandRadius.card * 2,
    borderTopRightRadius: BrandRadius.card * 2,
    borderTopWidth: BrandBorderWidth,
    borderTopColor: BrandColor.line,
    paddingHorizontal: BrandSpace.xl,
    paddingTop: BrandSpace.md,
    gap: BrandSpace.xs,
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: BrandRadius.pill,
    backgroundColor: BrandColor.line,
    marginBottom: BrandSpace.lg,
  },
  title: {
    ...BrandType.title,
    color: BrandColor.ink,
  },
  subtitle: {
    ...BrandType.body,
    color: BrandColor.inkMuted,
  },
  body: {
    marginTop: BrandSpace.lg,
    gap: BrandSpace.md,
  },
});
