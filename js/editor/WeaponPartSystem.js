import { cloneShape, normalizeShape } from "../core/shapeModel.js";

export const WEAPON_PART_DEFINITIONS = {
  0: [
    { id: "blade", label: "刀身", icon: "🗡️" },
    { id: "guard", label: "鍔", icon: "✦" },
    { id: "grip", label: "柄", icon: "║" },
    { id: "pommel", label: "ポンメル", icon: "●" }
  ],
  1: [
    { id: "blade", label: "大刀身", icon: "⚔️" },
    { id: "guard", label: "大型鍔", icon: "✦" },
    { id: "grip", label: "長柄", icon: "║" },
    { id: "pommel", label: "柄頭", icon: "●" }
  ],
  2: [
    { id: "blade", label: "刀身", icon: "🗡️" },
    { id: "habaki", label: "鎺", icon: "▣" },
    { id: "guard", label: "鍔", icon: "✦" },
    { id: "grip", label: "柄", icon: "║" },
    { id: "pommel", label: "柄頭", icon: "●" }
  ],
  3: [
    { id: "bladeA", label: "右刀身", icon: "🗡️" },
    { id: "bladeB", label: "左刀身", icon: "🗡️" },
    { id: "guards", label: "鍔", icon: "✦" },
    { id: "grips", label: "柄", icon: "║" }
  ],
  4: [
    { id: "spearhead", label: "穂先", icon: "🔱" },
    { id: "shaft", label: "柄", icon: "│" },
    { id: "buttCap", label: "石突", icon: "◆" }
  ],
  5: [
    { id: "axeHead", label: "斧頭", icon: "🪓" },
    { id: "bladeEdge", label: "刃", icon: "◢" },
    { id: "shaft", label: "柄", icon: "│" },
    { id: "buttCap", label: "柄尻", icon: "◆" }
  ],
  6: [
    { id: "shaft", label: "柄", icon: "│" },
    { id: "hammerHead", label: "ヘッド", icon: "🔨" },
    { id: "strikeFace", label: "打撃面", icon: "▣" },
    { id: "backFace", label: "裏面", icon: "◀" }
  ],
  7: [
    { id: "blade", label: "短刀身", icon: "🔪" },
    { id: "guard", label: "鍔", icon: "✦" },
    { id: "grip", label: "柄", icon: "║" },
    { id: "pommel", label: "柄頭", icon: "●" }
  ],
  8: [
    { id: "frame", label: "外枠", icon: "⬡" },
    { id: "fingerHoles", label: "指穴", icon: "○" },
    { id: "grip", label: "グリップ", icon: "▰" },
    { id: "strikePlate", label: "打撃部", icon: "◆" }
  ]
};

const PART_DEFAULTS = {
  blade: { width: 45, thickness: 35, tip: 65, curve: 20 },
  bladeA: { width: 32, thickness: 25, tip: 78, curve: 22 },
  bladeB: { width: 32, thickness: 25, tip: 78, curve: 22 },
  spearhead: { width: 25, thickness: 28, tip: 100, curve: 5 },
  axeHead: { width: 68, thickness: 62, tip: 25, curve: 40 },
  bladeEdge: { width: 52, thickness: 35, tip: 70, curve: 25 },
  hammerHead: { width: 72, thickness: 78, tip: 5, curve: 0 },
  strikeFace: { width: 65, thickness: 82, tip: 0, curve: 0 },
  backFace: { width: 44, thickness: 50, tip: 35, curve: 10 },
  shaft: { width: 18, thickness: 22, tip: 5, curve: 0 },
  grip: { width: 22, thickness: 30, tip: 5, curve: 0 },
  grips: { width: 22, thickness: 30, tip: 5, curve: 0 },
  guard: { width: 55, thickness: 28, tip: 10, curve: 10 },
  guards: { width: 55, thickness: 28, tip: 10, curve: 10 },
  habaki: { width: 30, thickness: 38, tip: 5, curve: 0 },
  pommel: { width: 38, thickness: 45, tip: 5, curve: 10 },
  buttCap: { width: 30, thickness: 35, tip: 10, curve: 0 },
  frame: { width: 62, thickness: 50, tip: 10, curve: 15 },
  fingerHoles: { width: 42, thickness: 38, tip: 5, curve: 0 },
  strikePlate: { width: 58, thickness: 60, tip: 15, curve: 8 }
};

function makePartShape(partId, weaponType, baseShape) {
  const defaults = PART_DEFAULTS[partId] || {};
  return normalizeShape({
    ...cloneShape(baseShape),
    ...defaults,
    weaponType,
    partId,
    partLabel: partId,
    points: cloneShape(baseShape).points
  });
}

export class WeaponPartSystem {
  constructor(baseShape, weaponType = 0) {
    this.byWeaponType = new Map();
    this.activeWeaponType = weaponType;
    this.activePartId = null;
    this.ensureWeaponType(weaponType, baseShape);
  }

  getDefinitions(weaponType = this.activeWeaponType) {
    return WEAPON_PART_DEFINITIONS[weaponType] || WEAPON_PART_DEFINITIONS[0];
  }

  ensureWeaponType(weaponType, baseShape) {
    if (this.byWeaponType.has(weaponType)) return;

    const definitions = this.getDefinitions(weaponType);
    const parts = {};

    definitions.forEach((definition, index) => {
      parts[definition.id] = makePartShape(
        definition.id,
        weaponType,
        index === 0 ? baseShape : baseShape
      );
    });

    this.byWeaponType.set(weaponType, {
      activePartId: definitions[0].id,
      parts
    });

    if (weaponType === this.activeWeaponType) {
      this.activePartId = definitions[0].id;
    }
  }

  switchWeaponType(weaponType, currentShape) {
    this.saveCurrentShape(currentShape);
    this.ensureWeaponType(weaponType, currentShape);

    this.activeWeaponType = weaponType;
    const state = this.byWeaponType.get(weaponType);
    this.activePartId = state.activePartId;

    return cloneShape(state.parts[this.activePartId]);
  }

  switchPart(partId, currentShape) {
    this.saveCurrentShape(currentShape);

    const state = this.byWeaponType.get(this.activeWeaponType);
    if (!state?.parts[partId]) {
      throw new Error(`パーツ ${partId} が見つかりません。`);
    }

    state.activePartId = partId;
    this.activePartId = partId;

    return cloneShape(state.parts[partId]);
  }

  saveCurrentShape(shape) {
    const state = this.byWeaponType.get(this.activeWeaponType);
    if (!state || !this.activePartId) return;

    state.parts[this.activePartId] = normalizeShape({
      ...shape,
      weaponType: this.activeWeaponType,
      partId: this.activePartId
    });
  }

  getActiveDefinition() {
    return this.getDefinitions().find((part) => part.id === this.activePartId);
  }

  getPartsPayload(currentShape) {
    this.saveCurrentShape(currentShape);

    const state = this.byWeaponType.get(this.activeWeaponType);
    const definitions = this.getDefinitions();

    return {
      version: 1,
      activePartId: this.activePartId,
      order: definitions.map((part) => part.id),
      items: definitions.map((definition) => ({
        id: definition.id,
        label: definition.label,
        icon: definition.icon,
        shape: cloneShape(state.parts[definition.id]),
        visible: true,
        locked: false
      }))
    };
  }

  loadPartsPayload(weaponType, payload, fallbackShape) {
    this.ensureWeaponType(weaponType, fallbackShape);
    if (!payload?.items?.length) return;

    const state = this.byWeaponType.get(weaponType);
    payload.items.forEach((item) => {
      if (item?.id && item?.shape) {
        state.parts[item.id] = normalizeShape({
          ...item.shape,
          weaponType,
          partId: item.id
        });
      }
    });

    const validActive = payload.activePartId &&
      state.parts[payload.activePartId];

    state.activePartId = validActive
      ? payload.activePartId
      : this.getDefinitions(weaponType)[0].id;

    this.activeWeaponType = weaponType;
    this.activePartId = state.activePartId;
  }
}
