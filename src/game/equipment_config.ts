import {EVIDENCE_BAG} from './equipment_cards/evidence_bag';
import {TRUTH_SERUM} from './equipment_cards/truth_serum';
import {EquipmentCardConfig, EquipmentCardType} from './models';

// /**
//  * Template for easy/copy pasting.
//  */
// const TEMPLATE: EquipmentCardConfig = {
//   type: EquipmentCardType.EVIDENCE_BAG,
//   name: 'Some name',
//   description: 'Some description',
//   canPlay: (state: GameState, player: number) => {
//     return true;
//   },
//   play: (state: GameState, player: number) => {
//     return EquipmentCardResult.IN_PROGRESS;
//   },
//   onSelect: (state: GameState, selection: Selection, task: string) => {
//     return EquipmentCardResult.DONE;
//   },
// };

const EQUIPMENT_CONFIGS: EquipmentCardConfig[] = [EVIDENCE_BAG, TRUTH_SERUM];

const EQUIPMENT_CONFIGS_BY_TYPE = (() => {
  const map = new Map<EquipmentCardType, EquipmentCardConfig>();
  for (const config of EQUIPMENT_CONFIGS) {
    map.set(config.type, config);
  }
  return map;
})();

export function getEquipmentConfig(type: EquipmentCardType) {
  return EQUIPMENT_CONFIGS_BY_TYPE.get(type);
}
