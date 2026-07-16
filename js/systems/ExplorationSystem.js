
import {
  ORE_CATALOG,
  ORE_DEFINITIONS
} from "./OreInventorySystem.js";

export const EXPLORATION_DIFFICULTIES = [
  {
    id: "low",
    name: "下級",
    icon: "🌲",
    durationMs: 30_000,
    rewardMin: 3,
    rewardMax: 6,
    description: "近隣の採掘場。短時間で安全に鉱物を集めます。",
    rarityWeights: {
      COMMON: 72,
      UNCOMMON: 24,
      RARE: 3.5,
      EPIC: 0.45,
      LEGENDARY: 0.045,
      MYTHIC: 0.005
    }
  },
  {
    id: "middle",
    name: "中級",
    icon: "⛰️",
    durationMs: 60_000,
    rewardMin: 6,
    rewardMax: 12,
    description: "魔力を帯びた山岳地帯。希少鉱物の可能性があります。",
    rarityWeights: {
      COMMON: 58,
      UNCOMMON: 33,
      RARE: 7.5,
      EPIC: 1.25,
      LEGENDARY: 0.23,
      MYTHIC: 0.02
    }
  },
  {
    id: "high",
    name: "上級",
    icon: "🌋",
    durationMs: 180_000,
    rewardMin: 12,
    rewardMax: 22,
    description: "危険な火山鉱脈。上位素材を狙える探索です。",
    rarityWeights: {
      COMMON: 42,
      UNCOMMON: 38,
      RARE: 15,
      EPIC: 4,
      LEGENDARY: 0.9,
      MYTHIC: 0.1
    }
  },
  {
    id: "highest",
    name: "最上級",
    icon: "🐉",
    durationMs: 480_000,
    rewardMin: 22,
    rewardMax: 38,
    description: "竜脈の深層。非常に危険ですが報酬も大きくなります。",
    rarityWeights: {
      COMMON: 25,
      UNCOMMON: 36,
      RARE: 24,
      EPIC: 11,
      LEGENDARY: 3.5,
      MYTHIC: 0.5
    }
  },
  {
    id: "unknown",
    name: "？？？",
    icon: "🌌",
    durationMs: 900_000,
    rewardMin: 35,
    rewardMax: 60,
    description: "座標不明の異界鉱床。何が見つかるか分かりません。",
    rarityWeights: {
      COMMON: 12,
      UNCOMMON: 28,
      RARE: 28,
      EPIC: 20,
      LEGENDARY: 10,
      MYTHIC: 2
    }
  }
];

export function normalizeExplorationState(state) {
  if (!state.exploration || typeof state.exploration !== "object") {
    state.exploration = createEmptyExplorationState();
  }

  const exploration = state.exploration;

  exploration.active =
    exploration.active && typeof exploration.active === "object"
      ? exploration.active
      : null;

  exploration.pendingRewards = Array.isArray(exploration.pendingRewards)
    ? exploration.pendingRewards.filter((id) => ORE_DEFINITIONS[id])
    : [];

  exploration.history = Array.isArray(exploration.history)
    ? exploration.history.slice(0, 20)
    : [];

  return exploration;
}

export function createEmptyExplorationState() {
  return {
    active: null,
    pendingRewards: [],
    history: []
  };
}

export function startExploration(state, difficultyId, now = Date.now()) {
  const exploration = normalizeExplorationState(state);
  if (exploration.active) {
    return { success: false, reason: "already-active" };
  }

  const difficulty = EXPLORATION_DIFFICULTIES.find(
    (item) => item.id === difficultyId
  );

  if (!difficulty) {
    return { success: false, reason: "difficulty-not-found" };
  }

  exploration.active = {
    id: `EXP-${now.toString(36).toUpperCase()}`,
    difficultyId: difficulty.id,
    startedAt: now,
    endsAt: now + difficulty.durationMs,
    completed: false
  };

  return {
    success: true,
    active: exploration.active,
    difficulty
  };
}

export function updateExplorationCompletion(state, now = Date.now()) {
  const exploration = normalizeExplorationState(state);
  const active = exploration.active;

  if (!active || active.completed || now < active.endsAt) {
    return false;
  }

  const difficulty = EXPLORATION_DIFFICULTIES.find(
    (item) => item.id === active.difficultyId
  );

  if (!difficulty) {
    exploration.active = null;
    return false;
  }

  const amount = randomInteger(
    difficulty.rewardMin,
    difficulty.rewardMax
  );

  const rewards = Array.from(
    { length: amount },
    () => rollOre(difficulty.rarityWeights)
  ).filter(Boolean);

  active.completed = true;
  active.completedAt = now;
  active.rewards = rewards;
  exploration.pendingRewards.push(...rewards);

  exploration.history.unshift({
    id: active.id,
    difficultyId: active.difficultyId,
    completedAt: now,
    rewardCount: rewards.length
  });
  exploration.history = exploration.history.slice(0, 20);

  return true;
}

export function receivePendingExplorationRewards(state, inventory) {
  const exploration = normalizeExplorationState(state);
  if (!exploration.pendingRewards.length) {
    return {
      received: [],
      remaining: []
    };
  }

  const received = [];
  const remaining = [];

  for (const oreId of exploration.pendingRewards) {
    const result = inventory.addOre(oreId, 1);

    if (result.added === 1) {
      received.push(oreId);
    } else {
      remaining.push(oreId);
    }
  }

  exploration.pendingRewards = remaining;

  if (
    exploration.active?.completed &&
    remaining.length === 0
  ) {
    exploration.active = null;
  }

  return { received, remaining };
}

export function cancelExploration(state) {
  const exploration = normalizeExplorationState(state);

  if (!exploration.active || exploration.active.completed) {
    return false;
  }

  exploration.active = null;
  return true;
}

export function getActiveDifficulty(state) {
  const active = normalizeExplorationState(state).active;
  if (!active) return null;

  return EXPLORATION_DIFFICULTIES.find(
    (item) => item.id === active.difficultyId
  ) || null;
}

export function getExplorationRemainingMs(
  state,
  now = Date.now()
) {
  const active = normalizeExplorationState(state).active;
  if (!active) return 0;

  return Math.max(0, active.endsAt - now);
}

export function formatExplorationTime(milliseconds) {
  const totalSeconds = Math.max(
    0,
    Math.ceil(milliseconds / 1000)
  );
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function summarizeRewards(oreIds) {
  const summary = {};

  for (const oreId of oreIds) {
    summary[oreId] = (summary[oreId] || 0) + 1;
  }

  return Object.entries(summary)
    .map(([oreId, amount]) => ({
      ore: ORE_DEFINITIONS[oreId],
      amount
    }))
    .filter((entry) => entry.ore);
}

function rollOre(weights) {
  const rarity = weightedRarity(weights);
  const candidates = ORE_CATALOG.filter(
    (ore) => ore.rarity === rarity
  );

  if (!candidates.length) return null;

  return candidates[
    Math.floor(Math.random() * candidates.length)
  ].id;
}

function weightedRarity(weights) {
  const entries = Object.entries(weights);
  const total = entries.reduce(
    (sum, [, weight]) => sum + Number(weight || 0),
    0
  );

  let roll = Math.random() * total;

  for (const [rarity, weight] of entries) {
    roll -= Number(weight || 0);
    if (roll <= 0) return rarity;
  }

  return entries.at(-1)?.[0] || "COMMON";
}

function randomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
