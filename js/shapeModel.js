export const DEFAULT_SHAPE = Object.freeze({
  version: 2,
  weaponType: 0,
  length: 60,
  width: 45,
  thickness: 35,
  curve: 25,
  twist: 0,
  tip: 50,
  notch: 0,
  ornament: 20,
  material: "黒鉄",
  color: "#d9dce4",
  points: [
    { x: 0.08, y: 0.56, inX: -0.05, inY: 0.00, outX: 0.08, outY: -0.03, smooth: true },
    { x: 0.30, y: 0.47, inX: -0.08, inY: 0.03, outX: 0.09, outY: -0.03, smooth: true },
    { x: 0.62, y: 0.42, inX: -0.09, inY: 0.02, outX: 0.09, outY: 0.02, smooth: true },
    { x: 0.90, y: 0.50, inX: -0.08, inY: -0.02, outX: 0.04, outY: 0.00, smooth: true }
  ]
});

export function cloneShape(shape = DEFAULT_SHAPE) {
  return JSON.parse(JSON.stringify(shape));
}

export function normalizeShape(input = {}) {
  const base = cloneShape(DEFAULT_SHAPE);
  const result = { ...base, ...input };

  const clamp = (value, min, max, fallback) => {
    const num = Number(value);
    return Number.isFinite(num) ? Math.min(max, Math.max(min, num)) : fallback;
  };

  result.version = 2;
  result.weaponType = Math.round(clamp(result.weaponType, 0, 8, 0));
  result.length = clamp(result.length, 20, 100, 60);
  result.width = clamp(result.width, 10, 100, 45);
  result.thickness = clamp(result.thickness, 5, 100, 35);
  result.curve = clamp(result.curve, 0, 100, 25);
  result.twist = clamp(result.twist, -50, 50, 0);
  result.tip = clamp(result.tip, 0, 100, 50);
  result.notch = clamp(result.notch, 0, 100, 0);
  result.ornament = clamp(result.ornament, 0, 100, 20);
  result.material = typeof result.material === "string" ? result.material.slice(0, 30) : "黒鉄";
  result.color = /^#[0-9a-fA-F]{6}$/.test(result.color || "") ? result.color : "#d9dce4";

  const sourcePoints = Array.isArray(result.points) ? result.points.slice(0, 12) : [];
  const legacy = sourcePoints.length >= 2 ? sourcePoints : cloneShape(DEFAULT_SHAPE).points;

  result.points = legacy.map((p, i) => {
    const previous = legacy[Math.max(0, i - 1)] || p;
    const next = legacy[Math.min(legacy.length - 1, i + 1)] || p;
    const fallbackInX = -Math.max(0.035, Math.abs((p?.x ?? 0) - (previous?.x ?? 0)) * 0.35);
    const fallbackOutX = Math.max(0.035, Math.abs((next?.x ?? 1) - (p?.x ?? 0)) * 0.35);
    return {
      x: clamp(p?.x, 0.02, 0.98, i / Math.max(1, legacy.length - 1)),
      y: clamp(p?.y, 0.05, 0.95, 0.5),
      inX: clamp(p?.inX, -0.35, 0.35, fallbackInX),
      inY: clamp(p?.inY, -0.35, 0.35, 0),
      outX: clamp(p?.outX, -0.35, 0.35, fallbackOutX),
      outY: clamp(p?.outY, -0.35, 0.35, 0),
      smooth: p?.smooth !== false
    };
  }).sort((a, b) => a.x - b.x);

  return result;
}

export function serializeShape(shape) {
  return JSON.stringify(normalizeShape(shape));
}

export function deserializeShape(raw) {
  try {
    return normalizeShape(typeof raw === "string" ? JSON.parse(raw) : raw);
  } catch {
    return cloneShape(DEFAULT_SHAPE);
  }
}

export function shapeFingerprint(shape) {
  const normalized = normalizeShape(shape);
  const text = serializeShape(normalized);
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `SHP-${(hash >>> 0).toString(36).toUpperCase()}`;
}
