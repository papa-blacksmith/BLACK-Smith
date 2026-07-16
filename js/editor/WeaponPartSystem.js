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

function sanitizeTransform(transform = {}, socket = "root") {
  const clamp = (value, min, max, fallback) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(max, Math.max(min, number));
  };

  return {
    x: clamp(transform.x, -380, 380, 0),
    y: clamp(transform.y, -180, 180, 0),
    rotation: clamp(transform.rotation, -180, 180, 0),
    scaleX: clamp(transform.scaleX, .15, 2.5, 1),
    scaleY: clamp(transform.scaleY, .15, 2.5, 1),
    socket: transform.socket || socket
  };
}

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
      order: definitions.map((definition) => definition.id),
      visibility: Object.fromEntries(definitions.map((definition) => [definition.id, true])),
      locked: Object.fromEntries(definitions.map((definition) => [definition.id, false])),
      transforms: Object.fromEntries(definitions.map((definition, index) => [
        definition.id,
        {
          x: 0,
          y: 0,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          socket: index === 0 ? "root" : definitions[Math.max(0, index - 1)].id
        }
      ])),
      names: Object.fromEntries(definitions.map((definition) => [
        definition.id,
        definition.label
      ])),
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
      order: [...state.order],
      items: state.order.map((partId) => {
        const definition = definitions.find((item) => item.id === partId);
        return {
          id: partId,
          label: state.names[partId] || definition?.label || partId,
          icon: definition?.icon || "◆",
          shape: cloneShape(state.parts[partId]),
          visible: state.visibility[partId] !== false,
          locked: state.locked[partId] === true,
          transform: sanitizeTransform(state.transforms[partId], "root")
        };
      })
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
        state.visibility[item.id] = item.visible !== false;
        state.locked[item.id] = item.locked === true;
        state.names[item.id] = item.label || state.names[item.id] || item.id;
        state.transforms[item.id] = sanitizeTransform(
          item.transform,
          item.transform?.socket || "root"
        );
      }
    });

    if (Array.isArray(payload.order) && payload.order.length) {
      const valid = payload.order.filter((id) => state.parts[id]);
      const missing = Object.keys(state.parts).filter((id) => !valid.includes(id));
      state.order = [...valid, ...missing];
    }

    const validActive = payload.activePartId &&
      state.parts[payload.activePartId];

    state.activePartId = validActive
      ? payload.activePartId
      : this.getDefinitions(weaponType)[0].id;

    this.activeWeaponType = weaponType;
    this.activePartId = state.activePartId;
  }
  getState(weaponType = this.activeWeaponType) {
    return this.byWeaponType.get(weaponType);
  }

  getOrderedDefinitions(weaponType = this.activeWeaponType) {
    const state = this.getState(weaponType);
    const definitions = this.getDefinitions(weaponType);

    return (state?.order || definitions.map((item) => item.id))
      .map((id) => definitions.find((item) => item.id === id))
      .filter(Boolean);
  }

  getAllParts(currentShape) {
    this.saveCurrentShape(currentShape);
    const state = this.getState();

    return state.order.map((partId, layerIndex) => {
      const definition = this.getDefinitions().find((item) => item.id === partId);
      return {
        id: partId,
        label: state.names[partId] || definition?.label || partId,
        icon: definition?.icon || "◆",
        shape: cloneShape(state.parts[partId]),
        visible: state.visibility[partId] !== false,
        locked: state.locked[partId] === true,
        active: partId === this.activePartId,
        layerIndex,
        transform: sanitizeTransform(state.transforms[partId], "root")
      };
    });
  }

  isActivePartLocked() {
    const state = this.getState();
    return state?.locked?.[this.activePartId] === true;
  }

  toggleVisibility(partId, currentShape) {
    this.saveCurrentShape(currentShape);
    const state = this.getState();
    if (!state?.parts?.[partId]) return;
    state.visibility[partId] = !(state.visibility[partId] !== false);
  }

  toggleLock(partId, currentShape) {
    this.saveCurrentShape(currentShape);
    const state = this.getState();
    if (!state?.parts?.[partId]) return;
    state.locked[partId] = !(state.locked[partId] === true);
  }

  movePart(partId, direction, currentShape) {
    this.saveCurrentShape(currentShape);
    const state = this.getState();
    const index = state.order.indexOf(partId);
    if (index < 0) return;

    const nextIndex = Math.max(
      0,
      Math.min(state.order.length - 1, index + direction)
    );

    if (nextIndex === index) return;

    const [item] = state.order.splice(index, 1);
    state.order.splice(nextIndex, 0, item);
  }

  getActiveTransform() {
    const state = this.getState();
    const transform = sanitizeTransform(
      state.transforms[this.activePartId],
      "root"
    );
    state.transforms[this.activePartId] = transform;
    return { ...transform };
  }

  updateActiveTransform(patch, currentShape) {
    this.saveCurrentShape(currentShape);
    const state = this.getState();
    const current = state.transforms[this.activePartId] || {
      x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, socket: "root"
    };

    state.transforms[this.activePartId] = sanitizeTransform(
      {
        ...current,
        ...patch,
        socket: patch.socket ?? current.socket
      },
      current.socket || "root"
    );
  }

  resetActiveTransform(currentShape) {
    this.saveCurrentShape(currentShape);
    const state = this.getState();
    state.transforms[this.activePartId] = {
      x: 0,
      y: 0,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      socket: this.activePartId === state.order[0]
        ? "root"
        : state.order[Math.max(0, state.order.indexOf(this.activePartId) - 1)]
    };
  }

  renamePart(partId, name, currentShape) {
    this.saveCurrentShape(currentShape);
    const state = this.getState();
    if (!state?.parts?.[partId]) return false;

    const cleaned = String(name || "").trim().slice(0, 24);
    if (!cleaned) return false;

    state.names[partId] = cleaned;
    return true;
  }

  duplicatePart(partId, currentShape) {
    this.saveCurrentShape(currentShape);
    const state = this.getState();
    if (!state?.parts?.[partId]) return null;

    const originalIndex = state.order.indexOf(partId);
    const copyId = `${partId}_copy_${Date.now().toString(36)}`;

    state.parts[copyId] = cloneShape(state.parts[partId]);
    state.visibility[copyId] = true;
    state.locked[copyId] = false;
    state.transforms[copyId] = {
      ...(state.transforms[partId] || {
        x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, socket: "root"
      }),
      x: Number(state.transforms[partId]?.x || 0) + 18,
      y: Number(state.transforms[partId]?.y || 0) + 12
    };
    state.names[copyId] = `${state.names[partId] || partId} コピー`;

    state.order.splice(
      Math.max(0, originalIndex + 1),
      0,
      copyId
    );

    state.activePartId = copyId;
    this.activePartId = copyId;

    return copyId;
  }

  removePart(partId, currentShape) {
    this.saveCurrentShape(currentShape);
    const state = this.getState();
    if (!state?.parts?.[partId]) return false;
    if (state.order.length <= 1) return false;

    const index = state.order.indexOf(partId);

    delete state.parts[partId];
    delete state.visibility[partId];
    delete state.locked[partId];
    delete state.transforms[partId];
    delete state.names[partId];

    state.order = state.order.filter((id) => id !== partId);

    if (state.activePartId === partId) {
      const nextId =
        state.order[Math.min(index, state.order.length - 1)] ||
        state.order[0];

      state.activePartId = nextId;
      this.activePartId = nextId;
    }

    return true;
  }

  getPartShape(partId) {
    const state = this.getState();
    return state?.parts?.[partId]
      ? cloneShape(state.parts[partId])
      : null;
  }

}
