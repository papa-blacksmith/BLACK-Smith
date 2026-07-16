import {
  ORE_CATALOG,
  ORE_DEFINITIONS,
  ORE_RARITIES
} from "./OreInventorySystem.js";

export const ORE_GACHA_COUNT = 5;

export const ORE_GACHA_RATES = [
  { rarity: "UNCOMMON", probability: 70 },
  { rarity: "RARE", probability: 15 },
  { rarity: "EPIC", probability: 8 },
  { rarity: "LEGENDARY", probability: 5 },
  { rarity: "MYTHIC", probability: 2 }
];

export const ORE_EFFECT_RULES = {
  UNCOMMON: {
    procRate: 0.5,
    type: "flatAttack",
    min: 0.1,
    max: 1.0
  },
  RARE: {
    procRate: 0.25,
    type: "flatAttack",
    min: 0.1,
    max: 3.0
  },
  EPIC: {
    procRate: 1.0,
    type: "rarityBoost",
    amount: 0.001
  },
  LEGENDARY: {
    procRate: 1.0,
    type: "flatAttack",
    min: 0.1,
    max: 3.0
  },
  MYTHIC: {
    procRate: 0.5,
    type: "percentAttack",
    min: 0.1,
    max: 3.0
  }
};

export function getDailyOreKey(date = new Date()) {
  const target = new Date(date);

  if (target.getHours() < 5) {
    target.setDate(target.getDate() - 1);
  }

  return [
    target.getFullYear(),
    String(target.getMonth() + 1).padStart(2, "0"),
    String(target.getDate()).padStart(2, "0")
  ].join("-");
}

export function getNextOreResetAt(date = new Date()) {
  const next = new Date(date);
  next.setHours(5, 0, 0, 0);

  if (date >= next) {
    next.setDate(next.getDate() + 1);
  }

  return next;
}

function rollRarity(random = Math.random) {
  const roll = random() * 100;
  let accumulated = 0;

  for (const entry of ORE_GACHA_RATES) {
    accumulated += entry.probability;
    if (roll < accumulated) return entry.rarity;
  }

  return "MYTHIC";
}

function randomOreFromRarity(rarity, random = Math.random) {
  const candidates = ORE_CATALOG.filter((ore) => ore.rarity === rarity);
  if (!candidates.length) return null;

  return candidates[Math.floor(random() * candidates.length)];
}

export function drawDailyOres(random = Math.random) {
  return Array.from({ length: ORE_GACHA_COUNT }, () => {
    const rarity = rollRarity(random);
    const ore = randomOreFromRarity(rarity, random);

    return ore ? ore.id : null;
  }).filter(Boolean);
}

export function normalizeOreDailyState(state) {
  const key = getDailyOreKey();

  if (state.oreDailyKey !== key) {
    state.oreDailyKey = key;
    state.oreDailyClaimed = false;
    state.oreDailyResults = [];
  }

  if (!Array.isArray(state.oreDailyResults)) {
    state.oreDailyResults = [];
  }

  state.oreDailyClaimed = state.oreDailyClaimed === true;
  return state;
}

export function canReceiveOreResults(inventory, oreIds) {
  const clone = new inventory.constructor(inventory.toJSON());

  return oreIds.every((oreId) => {
    return clone.addOre(oreId, 1).overflow === 0;
  });
}

export function receiveOreResults(inventory, oreIds) {
  const added = [];

  for (const oreId of oreIds) {
    const result = inventory.addOre(oreId, 1);
    if (result.added !== 1) {
      return { success: false, added };
    }
    added.push(oreId);
  }

  return { success: true, added };
}

export function getOreResultDetails(oreIds) {
  return oreIds
    .map((id) => ORE_DEFINITIONS[id])
    .filter(Boolean)
    .map((ore) => ({
      ...ore,
      rarityLabel: ORE_RARITIES[ore.rarity]?.label || ore.rarity
    }));
}

export function evaluateForgeOreEffects(
  oreIds,
  random = Math.random
) {
  const effects = {
    flatAttack: 0,
    percentAttack: 0,
    rarityBoostPerTier: 0,
    activations: []
  };

  for (const oreId of oreIds.filter(Boolean)) {
    const ore = ORE_DEFINITIONS[oreId];
    const rule = ORE_EFFECT_RULES[ore?.rarity];

    if (!ore || !rule) continue;

    const activated = random() * 100 < rule.procRate;
    if (!activated) continue;

    if (rule.type === "flatAttack") {
      const value = randomRange(rule.min, rule.max, random);
      effects.flatAttack += value;
      effects.activations.push({
        oreId,
        oreName: ore.name,
        rarity: ore.rarity,
        type: rule.type,
        value
      });
    }

    if (rule.type === "percentAttack") {
      const value = randomRange(rule.min, rule.max, random);
      effects.percentAttack += value;
      effects.activations.push({
        oreId,
        oreName: ore.name,
        rarity: ore.rarity,
        type: rule.type,
        value
      });
    }

    if (rule.type === "rarityBoost") {
      effects.rarityBoostPerTier += rule.amount;
      effects.activations.push({
        oreId,
        oreName: ore.name,
        rarity: ore.rarity,
        type: rule.type,
        value: rule.amount
      });
    }
  }

  effects.flatAttack = round(effects.flatAttack, 3);
  effects.percentAttack = round(effects.percentAttack, 3);
  effects.rarityBoostPerTier = round(
    effects.rarityBoostPerTier,
    6
  );

  return effects;
}

export function adjustWeaponRarities(
  rarities,
  rarityBoostPerTier
) {
  const boost = Math.max(0, Number(rarityBoostPerTier) || 0);
  if (!boost) return rarities.map((rarity) => ({ ...rarity }));

  const nonCommonCount = rarities.filter(
    (rarity) => rarity.name !== "COMMON"
  ).length;

  const totalBoost = boost * nonCommonCount;

  return rarities.map((rarity) => {
    if (rarity.name === "COMMON") {
      return {
        ...rarity,
        probability: Math.max(
          0,
          Number(rarity.probability) - totalBoost
        )
      };
    }

    return {
      ...rarity,
      probability: Number(rarity.probability) + boost
    };
  });
}

function randomRange(min, max, random) {
  return round(min + random() * (max - min), 3);
}

function round(value, digits) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
