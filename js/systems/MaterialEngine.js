
export const MATERIAL_PRESETS = {
  DEFAULT: {
    id: "DEFAULT",
    name: "標準鋼",
    color: "#bcc7d3",
    edgeColor: "#edf5ff",
    metalness: 0.9,
    roughness: 0.24,
    clearcoat: 0.42,
    clearcoatRoughness: 0.18,
    transmission: 0,
    opacity: 1,
    emissive: "#000000",
    emissiveIntensity: 0,
    iridescence: 0
  },
  IRON: {
    id: "IRON",
    name: "鉄",
    color: "#78828d",
    edgeColor: "#cfd7df",
    metalness: 0.92,
    roughness: 0.46,
    clearcoat: 0.14,
    clearcoatRoughness: 0.42,
    transmission: 0,
    opacity: 1,
    emissive: "#000000",
    emissiveIntensity: 0,
    iridescence: 0
  },
  COPPER: {
    id: "COPPER",
    name: "銅",
    color: "#b8643d",
    edgeColor: "#ffc29a",
    metalness: 0.88,
    roughness: 0.32,
    clearcoat: 0.3,
    clearcoatRoughness: 0.24,
    transmission: 0,
    opacity: 1,
    emissive: "#160500",
    emissiveIntensity: 0.03,
    iridescence: 0
  },
  SILVER: {
    id: "SILVER",
    name: "銀",
    color: "#dfe9f2",
    edgeColor: "#ffffff",
    metalness: 1,
    roughness: 0.12,
    clearcoat: 0.58,
    clearcoatRoughness: 0.1,
    transmission: 0,
    opacity: 1,
    emissive: "#13212e",
    emissiveIntensity: 0.05,
    iridescence: 0
  },
  GOLD: {
    id: "GOLD",
    name: "金",
    color: "#d8a52f",
    edgeColor: "#ffe89a",
    metalness: 1,
    roughness: 0.18,
    clearcoat: 0.5,
    clearcoatRoughness: 0.12,
    transmission: 0,
    opacity: 1,
    emissive: "#2b1600",
    emissiveIntensity: 0.05,
    iridescence: 0
  },
  OBSIDIAN: {
    id: "OBSIDIAN",
    name: "黒曜石",
    color: "#11151c",
    edgeColor: "#7b8da8",
    metalness: 0.28,
    roughness: 0.08,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    transmission: 0.12,
    opacity: 0.94,
    emissive: "#101a28",
    emissiveIntensity: 0.12,
    iridescence: 0.08
  },
  MITHRIL: {
    id: "MITHRIL",
    name: "ミスリル",
    color: "#8ec9f0",
    edgeColor: "#ecfbff",
    metalness: 1,
    roughness: 0.1,
    clearcoat: 0.7,
    clearcoatRoughness: 0.08,
    transmission: 0.03,
    opacity: 1,
    emissive: "#1b6da1",
    emissiveIntensity: 0.15,
    iridescence: 0.12
  },
  ORICHALCUM: {
    id: "ORICHALCUM",
    name: "オリハルコン",
    color: "#78b85c",
    edgeColor: "#f3e88c",
    metalness: 0.96,
    roughness: 0.17,
    clearcoat: 0.62,
    clearcoatRoughness: 0.09,
    transmission: 0,
    opacity: 1,
    emissive: "#214f20",
    emissiveIntensity: 0.12,
    iridescence: 0.22
  },
  FIRE: {
    id: "FIRE",
    name: "炎属性鉱物",
    color: "#4e1b12",
    edgeColor: "#ffb15b",
    metalness: 0.78,
    roughness: 0.28,
    clearcoat: 0.32,
    clearcoatRoughness: 0.2,
    transmission: 0,
    opacity: 1,
    emissive: "#ff3b12",
    emissiveIntensity: 0.78,
    iridescence: 0.02
  },
  ICE: {
    id: "ICE",
    name: "氷属性鉱物",
    color: "#7cccf2",
    edgeColor: "#f2fdff",
    metalness: 0.35,
    roughness: 0.08,
    clearcoat: 0.9,
    clearcoatRoughness: 0.05,
    transmission: 0.28,
    opacity: 0.9,
    emissive: "#4dbce8",
    emissiveIntensity: 0.38,
    iridescence: 0.12
  },
  MAGIC: {
    id: "MAGIC",
    name: "魔晶系鉱物",
    color: "#6e4b9a",
    edgeColor: "#ddbcff",
    metalness: 0.62,
    roughness: 0.16,
    clearcoat: 0.74,
    clearcoatRoughness: 0.08,
    transmission: 0.08,
    opacity: 0.98,
    emissive: "#8d3eff",
    emissiveIntensity: 0.62,
    iridescence: 0.18
  },
  HOLY: {
    id: "HOLY",
    name: "聖属性鉱物",
    color: "#e6ddbd",
    edgeColor: "#fffbd8",
    metalness: 0.84,
    roughness: 0.12,
    clearcoat: 0.8,
    clearcoatRoughness: 0.06,
    transmission: 0.04,
    opacity: 1,
    emissive: "#ffe56a",
    emissiveIntensity: 0.32,
    iridescence: 0.12
  },
  RAINBOW: {
    id: "RAINBOW",
    name: "虹色鉱石",
    color: "#b9d8ff",
    edgeColor: "#ffffff",
    metalness: 0.9,
    roughness: 0.1,
    clearcoat: 0.86,
    clearcoatRoughness: 0.04,
    transmission: 0.02,
    opacity: 1,
    emissive: "#8d7bff",
    emissiveIntensity: 0.24,
    iridescence: 1
  },
  PHILOSOPHER: {
    id: "PHILOSOPHER",
    name: "賢者の石",
    color: "#8f1018",
    edgeColor: "#ffc9b7",
    metalness: 0.58,
    roughness: 0.14,
    clearcoat: 0.84,
    clearcoatRoughness: 0.06,
    transmission: 0.08,
    opacity: 1,
    emissive: "#ff1f2e",
    emissiveIntensity: 1,
    iridescence: 0.3
  }
};

export function resolveOreMaterial(oreName = "") {
  const name = String(oreName);

  if (/賢者の石/.test(name)) return MATERIAL_PRESETS.PHILOSOPHER;
  if (/虹色鉱石|レインボー/.test(name)) return MATERIAL_PRESETS.RAINBOW;
  if (/ミスリル/.test(name)) return MATERIAL_PRESETS.MITHRIL;
  if (/オリハルコン/.test(name)) return MATERIAL_PRESETS.ORICHALCUM;
  if (/黒曜石/.test(name)) return MATERIAL_PRESETS.OBSIDIAN;
  if (/金/.test(name)) return MATERIAL_PRESETS.GOLD;
  if (/銀/.test(name)) return MATERIAL_PRESETS.SILVER;
  if (/銅/.test(name)) return MATERIAL_PRESETS.COPPER;
  if (/鉄|スチール|メタル/.test(name)) return MATERIAL_PRESETS.IRON;
  if (/炎|紅蓮|獄炎|ファイヤー/.test(name)) return MATERIAL_PRESETS.FIRE;
  if (/氷|アイシス|グラシス|ウォーター/.test(name)) return MATERIAL_PRESETS.ICE;
  if (/魔晶|デプス|ダーク|虚無|メランジェ/.test(name)) return MATERIAL_PRESETS.MAGIC;
  if (/ホーリー|精霊|ライトニング|月光/.test(name)) return MATERIAL_PRESETS.HOLY;

  return MATERIAL_PRESETS.DEFAULT;
}

export function createWeaponMaterialProfile(forgeOres = []) {
  const ores = Array.isArray(forgeOres)
    ? forgeOres.filter(Boolean)
    : [];

  if (!ores.length) {
    return {
      id: "DEFAULT",
      name: "標準鋼",
      primary: { ...MATERIAL_PRESETS.DEFAULT },
      secondary: null,
      accents: [],
      sourceOres: []
    };
  }

  const profiles = ores.map((ore) => {
    const name = typeof ore === "string"
      ? ore
      : ore.name || "";

    return {
      oreName: name,
      rarity: typeof ore === "object" ? ore.rarity : "",
      preset: resolveOreMaterial(name)
    };
  });

  const rarityPriority = {
    MYTHIC: 6,
    LEGENDARY: 5,
    EPIC: 4,
    RARE: 3,
    UNCOMMON: 2,
    COMMON: 1
  };

  profiles.sort((a, b) => {
    const rarityDifference =
      (rarityPriority[b.rarity] || 0) -
      (rarityPriority[a.rarity] || 0);

    if (rarityDifference) return rarityDifference;

    return materialPriority(b.preset.id) - materialPriority(a.preset.id);
  });

  const primary = profiles[0]?.preset || MATERIAL_PRESETS.DEFAULT;
  const secondary = profiles.find(
    (entry) => entry.preset.id !== primary.id
  )?.preset || null;

  return {
    id: secondary
      ? `${primary.id}_${secondary.id}`
      : primary.id,
    name: secondary
      ? `${primary.name} × ${secondary.name}`
      : primary.name,
    primary: { ...primary },
    secondary: secondary ? { ...secondary } : null,
    accents: profiles.slice(1, 5).map((entry) => ({
      oreName: entry.oreName,
      presetId: entry.preset.id,
      color: entry.preset.edgeColor,
      emissive: entry.preset.emissive,
      emissiveIntensity: entry.preset.emissiveIntensity
    })),
    sourceOres: profiles.map((entry) => ({
      name: entry.oreName,
      rarity: entry.rarity,
      presetId: entry.preset.id
    }))
  };
}

export function blendMaterialProfile(profile, partRole = "blade") {
  const primary = profile?.primary || MATERIAL_PRESETS.DEFAULT;
  const secondary = profile?.secondary;

  if (!secondary) return { ...primary };

  const weight = partRole === "blade" ? 0.22 : 0.38;

  return {
    ...primary,
    name: `${primary.name} / ${secondary.name}`,
    color: mixHex(primary.color, secondary.color, weight),
    edgeColor: mixHex(primary.edgeColor, secondary.edgeColor, weight),
    roughness: mix(primary.roughness, secondary.roughness, weight),
    metalness: mix(primary.metalness, secondary.metalness, weight),
    clearcoat: mix(primary.clearcoat, secondary.clearcoat, weight),
    clearcoatRoughness: mix(
      primary.clearcoatRoughness,
      secondary.clearcoatRoughness,
      weight
    ),
    transmission: mix(primary.transmission, secondary.transmission, weight),
    opacity: mix(primary.opacity, secondary.opacity, weight),
    emissive: mixHex(primary.emissive, secondary.emissive, weight),
    emissiveIntensity: Math.max(
      primary.emissiveIntensity,
      secondary.emissiveIntensity * weight
    ),
    iridescence: Math.max(primary.iridescence, secondary.iridescence)
  };
}

function materialPriority(id) {
  return {
    PHILOSOPHER: 100,
    RAINBOW: 90,
    ORICHALCUM: 80,
    MITHRIL: 75,
    MAGIC: 70,
    FIRE: 65,
    ICE: 60,
    HOLY: 58,
    OBSIDIAN: 50,
    GOLD: 40,
    SILVER: 35,
    COPPER: 20,
    IRON: 15,
    DEFAULT: 0
  }[id] || 0;
}

function mix(a, b, weight) {
  return Number(a || 0) * (1 - weight) + Number(b || 0) * weight;
}

function mixHex(first, second, weight) {
  const a = hexToRgb(first);
  const b = hexToRgb(second);

  return rgbToHex({
    r: Math.round(mix(a.r, b.r, weight)),
    g: Math.round(mix(a.g, b.g, weight)),
    b: Math.round(mix(a.b, b.b, weight))
  });
}

function hexToRgb(hex) {
  const normalized = String(hex || "#000000")
    .replace("#", "")
    .padEnd(6, "0")
    .slice(0, 6);

  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16)
  };
}

function rgbToHex({ r, g, b }) {
  return `#${[r, g, b]
    .map((value) => Math.max(0, Math.min(255, value))
      .toString(16)
      .padStart(2, "0"))
    .join("")}`;
}
