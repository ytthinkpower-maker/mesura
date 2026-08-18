import { DrinkTypePicker } from '@/components/drink-type-picker';
import { Sheet } from '@/components/sheet';
import type { DrinkType } from '@/lib/database.types';

export type LogDrinkSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** The user's three most-logged types, from `quickTypesFrom`. */
  quickTypes: DrinkType[];
  /** Called with the chosen type. The sheet has already closed by then. */
  onSelect: (drinkType: DrinkType) => void;
};

/**
 * One tap logs a drink and the sheet closes itself.
 *
 * The buttons live in `DrinkTypePicker`, shared with the Urge screen, so that
 * logging a drink is the same gesture wherever it is reached from.
 */
export function LogDrinkSheet({ visible, onClose, quickTypes, onSelect }: LogDrinkSheetProps) {
  return (
    <Sheet visible={visible} onClose={onClose} title="Log a drink" subtitle="One tap. That's it.">
      <DrinkTypePicker
        quickTypes={quickTypes}
        resetKey={visible}
        onSelect={(drinkType) => {
          onClose();
          onSelect(drinkType);
        }}
      />
    </Sheet>
  );
}
