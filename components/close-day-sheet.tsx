import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/primary-button';
import { Sheet } from '@/components/sheet';
import { BrandColor, BrandRadius, BrandSpace, BrandType } from '@/constants/brand';
import type { DateKey } from '@/lib/database.types';
import { planVerdict } from '@/lib/days';

/** How long the zero-day state holds before the sheet gets out of the way. */
const CELEBRATION_MS = 1800;

export type CloseDaySheetProps = {
  visible: boolean;
  onClose: () => void;
  /** The day being closed. */
  dateKey: DateKey;
  /** "Today" or "Yesterday" — whichever this is. */
  dayLabel: string;
  /** Drinks logged on that day. */
  drinks: number;
  /** The plan made for that evening, if there was one. */
  intended: number | null;
  /** Confirms the count. Resolves once the row is written. */
  onConfirm: (dateKey: DateKey, drinks: number) => Promise<boolean>;
  /** Opens the entry editor, for when the count is not right. */
  onFix: () => void;
};

/**
 * The evening ritual: read a number, agree with it, done.
 *
 * One tap to open and one to confirm, because a ritual that takes longer than
 * five seconds stops being nightly. The count is shown, never asked for — the
 * app already knows, and asking would imply it did not trust the logging.
 *
 * A zero holds the sheet open for a moment in spruce before it leaves. It is
 * the only celebration in the flow, and it is deliberately brief: the reward
 * for an alcohol-free day is being told it counted, not being applauded.
 */
export function CloseDaySheet({
  visible,
  onClose,
  dateKey,
  dayLabel,
  drinks,
  intended,
  onConfirm,
  onFix,
}: CloseDaySheetProps) {
  const [busy, setBusy] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  // A reopened sheet always starts in the asking state, never mid-celebration.
  useEffect(() => {
    if (!visible) {
      setBusy(false);
      setCelebrating(false);
    }
  }, [visible]);

  useEffect(() => {
    if (!celebrating) return;
    const id = setTimeout(onClose, CELEBRATION_MS);
    return () => clearTimeout(id);
  }, [celebrating, onClose]);

  async function handleConfirm() {
    if (busy) return;
    setBusy(true);

    const saved = await onConfirm(dateKey, drinks);
    if (!saved) {
      setBusy(false);
      return;
    }

    if (drinks === 0) {
      setCelebrating(true);
      return;
    }

    onClose();
  }

  const verdict = intended === null ? null : planVerdict(intended, drinks);

  if (celebrating) {
    return (
      <Sheet visible={visible} onClose={onClose} title="A day with nothing in it">
        <View style={styles.celebration}>
          <Text style={styles.celebrationFigure}>0</Text>
          <Text style={styles.celebrationText}>
            An alcohol-free day, counted and kept. That is the whole thing.
          </Text>
        </View>
      </Sheet>
    );
  }

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={dayLabel === 'Today' ? 'Close the day' : `Close ${dayLabel.toLowerCase()}`}
      subtitle="Confirm the count and the day is done.">
      <View style={styles.countBlock}>
        <Text style={styles.count}>{drinks}</Text>
        <Text style={styles.countCaption}>
          {drinks === 1 ? 'drink logged' : 'drinks logged'} {dayLabel.toLowerCase()}
        </Text>
      </View>

      {verdict ? (
        <View style={[styles.verdict, verdict.tone === 'spruce' && styles.verdictSpruce]}>
          <Text
            style={[styles.verdictHeadline, verdict.tone === 'spruce' && styles.verdictOnSpruce]}>
            {verdict.headline}
          </Text>
          {verdict.caption ? (
            <Text
              style={[styles.verdictCaption, verdict.tone === 'spruce' && styles.verdictOnSpruce]}>
              {verdict.caption}
            </Text>
          ) : null}
        </View>
      ) : null}

      <PrimaryButton
        label={busy ? 'Saving…' : 'That is right'}
        disabled={busy}
        onPress={() => void handleConfirm()}
      />

      <Pressable
        accessibilityRole="button"
        onPress={onFix}
        disabled={busy}
        style={({ pressed }) => [styles.fixRow, pressed && styles.pressed]}>
        <Text style={styles.fixLabel}>Not right — fix the entries</Text>
      </Pressable>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  countBlock: {
    alignItems: 'center',
    gap: BrandSpace.xs,
    paddingVertical: BrandSpace.sm,
  },
  count: {
    ...BrandType.numeric,
    color: BrandColor.spruce,
  },
  countCaption: {
    ...BrandType.body,
    color: BrandColor.inkMuted,
  },
  verdict: {
    gap: BrandSpace.xs,
    padding: BrandSpace.lg,
    borderRadius: BrandRadius.card,
    backgroundColor: BrandColor.surface,
  },
  verdictSpruce: {
    backgroundColor: BrandColor.spruceSoft,
  },
  verdictHeadline: {
    ...BrandType.heading,
    color: BrandColor.ink,
  },
  verdictCaption: {
    ...BrandType.body,
    color: BrandColor.inkMuted,
  },
  /** On the spruce wash both lines are spruce — winning is always spruce. */
  verdictOnSpruce: {
    color: BrandColor.spruce,
  },
  fixRow: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fixLabel: {
    ...BrandType.label,
    color: BrandColor.inkMuted,
  },
  pressed: {
    opacity: 0.6,
  },
  celebration: {
    alignItems: 'center',
    gap: BrandSpace.md,
    paddingVertical: BrandSpace.xl,
  },
  celebrationFigure: {
    ...BrandType.numeric,
    color: BrandColor.spruce,
  },
  celebrationText: {
    ...BrandType.body,
    color: BrandColor.spruce,
    textAlign: 'center',
  },
});
