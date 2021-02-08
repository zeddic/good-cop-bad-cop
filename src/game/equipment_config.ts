import {DEFIBRILLATOR} from './equipment_cards/defibrillator';
import {EVIDENCE_BAG} from './equipment_cards/evidence_bag';
import {METAL_DETECTOR} from './equipment_cards/metal_detector';
import {POLYGRAPH} from './equipment_cards/polygraph';
import {TRUTH_SERUM} from './equipment_cards/truth_serum';
import {EquipmentCardConfig, EquipmentCardType} from './models';

const EQUIPMENT_CONFIGS: EquipmentCardConfig[] = [
  DEFIBRILLATOR,
  EVIDENCE_BAG,
  METAL_DETECTOR,
  POLYGRAPH,
  TRUTH_SERUM,
];

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
