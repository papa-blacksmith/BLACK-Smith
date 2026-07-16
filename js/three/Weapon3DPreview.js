
import * as THREE from "https://esm.sh/three@0.169.0";
import { OrbitControls } from "https://esm.sh/three@0.169.0/examples/jsm/controls/OrbitControls.js";
import { sampleWeaponGeometry } from "../features/editor.js";

const CAD_SAMPLE_COUNT = 360;
const MIN_POINT_DISTANCE = 0.45;
const MAX_REPAIR_PASSES = 80;

export class Weapon3DPreview {
  constructor({
    container,
    getShape,
    getActivePart,
    onStatus = () => {}
  }) {
    this.container = container;
    this.getShape = getShape;
    this.getActivePart = getActivePart;
    this.onStatus = onStatus;

    this.updateQueued = false;
    this.updateDirty = false;
    this.forceNextUpdate = false;
    this.disposed = false;
    this.lastSignature = "";

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      36,
      1,
      0.1,
      5000
    );
    this.camera.position.set(45, 90, 430);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, 2)
    );
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = "";
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(
      this.camera,
      this.renderer.domElement
    );
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enablePan = true;
    this.controls.minDistance = 100;
    this.controls.maxDistance = 1200;

    this.weaponRoot = new THREE.Group();
    this.weaponRoot.rotation.x = -0.22;
    this.scene.add(this.weaponRoot);

    this.addLights();
    this.addGround();

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);

    this.resize();
    this.rebuild(true);
    this.animate();
  }

  addLights() {
    this.scene.add(
      new THREE.HemisphereLight(0xa8d2ff, 0x1c1108, 1.55)
    );

    const key = new THREE.DirectionalLight(0xffdf9b, 4.1);
    key.position.set(180, 240, 320);
    key.castShadow = true;
    this.scene.add(key);

    const rim = new THREE.DirectionalLight(0x6eaaff, 2.5);
    rim.position.set(-260, 90, -160);
    this.scene.add(rim);

    const warm = new THREE.PointLight(0xff8f3c, 2.1, 900);
    warm.position.set(-220, -20, 180);
    this.scene.add(warm);
  }

  addGround() {
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(290, 64),
      new THREE.MeshStandardMaterial({
        color: 0x0a1018,
        roughness: 0.9,
        transparent: true,
        opacity: 0.78
      })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -105;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const grid = new THREE.GridHelper(
      580,
      22,
      0x62491f,
      0x243142
    );
    grid.position.y = -104;
    grid.material.transparent = true;
    grid.material.opacity = 0.42;
    this.scene.add(grid);
  }

  resize() {
    const width = Math.max(
      280,
      this.container.clientWidth || 800
    );
    const height = Math.max(
      280,
      this.container.clientHeight || 420
    );

    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  scheduleUpdate(force = false) {
    if (this.disposed) return;

    this.updateDirty = true;
    this.forceNextUpdate = this.forceNextUpdate || force;

    if (this.updateQueued) return;

    this.updateQueued = true;
    requestAnimationFrame(() => this.flushUpdateQueue());
  }

  flushUpdateQueue() {
    if (this.disposed) return;

    const force = this.forceNextUpdate;
    this.forceNextUpdate = false;
    this.updateDirty = false;

    this.rebuild(force);

    if (this.updateDirty || this.forceNextUpdate) {
      requestAnimationFrame(() => this.flushUpdateQueue());
      return;
    }

    this.updateQueued = false;
  }

  rebuild(force = false) {
    const part = this.getActivePart?.();
    const shape = part?.shape || this.getShape?.();
    if (!shape) return;

    const signature = JSON.stringify({
      id: part?.id || "active",
      points: shape.points,
      width: shape.width,
      thickness: shape.thickness,
      tip: shape.tip,
      asymmetric: shape.asymmetric,
      edgeStyle: shape.edgeStyle,
      serration: shape.serration,
      color: shape.color,
      glow: shape.glow
    });

    if (!force && signature === this.lastSignature) return;

    try {
      const sampled = sampleWeaponGeometry(
        shape,
        CAD_SAMPLE_COUNT
      );

      const rawContour = sanitizeContour(sampled.contour);
      if (rawContour.length < 3) {
        throw new Error("輪郭頂点が不足しています");
      }

      const repaired = repairPolygon(rawContour);
      const contour = simplifyContour(repaired);

      if (contour.length < 3) {
        throw new Error("輪郭の修復に失敗しました");
      }

      if (hasSelfIntersection(contour)) {
        throw new Error("輪郭の自己交差を解消できません");
      }

      const newMesh = buildCADMesh(contour, shape);
      newMesh.userData.partId = part?.id || "active";
      newMesh.userData.partLabel =
        part?.label || "選択中パーツ";

      const oldChildren = [...this.weaponRoot.children];
      this.weaponRoot.add(newMesh);

      oldChildren.forEach((object) => {
        this.weaponRoot.remove(object);
        disposeObject(object);
      });

      this.lastSignature = signature;
      this.centerWeapon();

      const repairedCount = Math.max(
        0,
        rawContour.length - contour.length
      );

      this.onStatus(
        `CAD同期済み・${contour.length}頂点` +
        (repairedCount ? `・整理${repairedCount}` : ""),
        "ok"
      );
    } catch (error) {
      console.warn("CADメッシュ同期を保留しました", error);
      this.onStatus(
        `CAD同期保留：${error.message}`,
        "warning"
      );
      // 前回の正常メッシュを維持する。
    }
  }

  centerWeapon() {
    const box = new THREE.Box3().setFromObject(this.weaponRoot);
    if (box.isEmpty()) return;

    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    this.weaponRoot.position.set(
      -center.x,
      -center.y + 5,
      -center.z
    );

    const dimension = Math.max(
      size.x,
      size.y,
      size.z,
      100
    );
    const distance = clamp(dimension * 1.55, 220, 900);

    this.camera.position.set(
      distance * 0.16,
      distance * 0.25,
      distance
    );
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  resetView() {
    this.scheduleUpdate(true);
    this.weaponRoot.rotation.set(-0.22, 0.08, 0);
    this.centerWeapon();
  }

  animate() {
    if (this.disposed) return;

    requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

function buildCADMesh(contourInput, shape) {
  let contour = contourInput.map((point) => ({
    x: point.x,
    y: point.y
  }));

  // Earcut/ShapeUtilsで安定する向きへ統一する。
  if (signedArea(contour) < 0) {
    contour = [...contour].reverse();
  }

  const bounds = contourBounds(contour);
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  const width = Math.max(1, bounds.maxX - bounds.minX);
  const height = Math.max(1, bounds.maxY - bounds.minY);

  const localContour = contour.map((point) => ({
    x: point.x - centerX,
    y: -(point.y - centerY)
  }));

  const vectors = localContour.map(
    (point) => new THREE.Vector2(point.x, point.y)
  );

  const faces = THREE.ShapeUtils.triangulateShape(vectors, []);
  if (!faces.length) {
    throw new Error("三角形分割結果が空です");
  }

  const baseDepth = clamp(
    Number(shape.thickness || 22) * 0.72,
    4,
    58
  );

  const positions = [];
  const uvs = [];
  const indices = [];
  const front = [];
  const back = [];

  for (let index = 0; index < localContour.length; index += 1) {
    const point = localContour[index];
    const t = clamp(
      (point.x - (-width / 2)) / width,
      0,
      1
    );

    // 刃先へ向かって厚みを段階的に絞る。
    const tipFactor = Math.max(
      0.13,
      1 - Math.pow(t, 5) * 0.84
    );

    // 外周に近い箇所は少し薄くして刃らしい断面にする。
    const normalizedY = Math.min(
      1,
      Math.abs(point.y) / Math.max(1, height / 2)
    );
    const edgeFactor = 1 - normalizedY * 0.32;

    const halfDepth =
      baseDepth * tipFactor * edgeFactor / 2;

    const u = t;
    const v = clamp(
      (point.y + height / 2) / height,
      0,
      1
    );

    front.push(positions.length / 3);
    positions.push(point.x, point.y, halfDepth);
    uvs.push(u, v);

    back.push(positions.length / 3);
    positions.push(point.x, point.y, -halfDepth);
    uvs.push(u, v);
  }

  // 表面・裏面。
  for (const face of faces) {
    const [a, b, c] = face;

    indices.push(front[a], front[b], front[c]);
    indices.push(back[c], back[b], back[a]);
  }

  // 外周側面。
  const count = localContour.length;
  for (let index = 0; index < count; index += 1) {
    const next = (index + 1) % count;

    indices.push(
      front[index],
      back[index],
      front[next]
    );
    indices.push(
      front[next],
      back[index],
      back[next]
    );
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setAttribute(
    "uv",
    new THREE.Float32BufferAttribute(uvs, 2)
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  const material = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(shape.color || "#cfd5df"),
    metalness: 0.93,
    roughness: 0.2,
    clearcoat: 0.48,
    clearcoatRoughness: 0.17,
    emissive: new THREE.Color(
      shape.color || "#ffffff"
    ),
    emissiveIntensity: clamp(
      Number(shape.glow || 0) / 180,
      0,
      0.55
    ),
    side: THREE.DoubleSide
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
}

function sanitizeContour(points) {
  const output = [];

  for (const point of points || []) {
    const current = {
      x: Number(point?.x),
      y: Number(point?.y)
    };

    if (
      !Number.isFinite(current.x) ||
      !Number.isFinite(current.y)
    ) {
      continue;
    }

    const previous = output.at(-1);

    if (
      previous &&
      Math.hypot(
        current.x - previous.x,
        current.y - previous.y
      ) < MIN_POINT_DISTANCE
    ) {
      continue;
    }

    output.push(current);
  }

  if (output.length > 2) {
    const first = output[0];
    const last = output.at(-1);

    if (
      Math.hypot(
        first.x - last.x,
        first.y - last.y
      ) < MIN_POINT_DISTANCE
    ) {
      output.pop();
    }
  }

  return output;
}

function simplifyContour(points) {
  if (points.length < 4) return points;

  const output = [];
  const count = points.length;

  for (let index = 0; index < count; index += 1) {
    const previous = points[
      (index - 1 + count) % count
    ];
    const current = points[index];
    const next = points[(index + 1) % count];

    const area = Math.abs(cross(previous, current, next));
    const distance = pointLineDistance(
      current,
      previous,
      next
    );

    // ほぼ同一直線上の余分な頂点だけ除去。
    if (area < 0.08 && distance < 0.22) {
      continue;
    }

    output.push(current);
  }

  return output.length >= 3 ? output : points;
}

function repairPolygon(points) {
  let repaired = [...points];
  let pass = 0;

  while (
    pass < MAX_REPAIR_PASSES &&
    hasSelfIntersection(repaired)
  ) {
    const intersection = findFirstIntersection(repaired);
    if (!intersection) break;

    const { firstIndex, secondIndex } = intersection;

    // 交差する2辺の間を反転し、交差をほどく2-opt修復。
    const start = firstIndex + 1;
    const end = secondIndex;

    repaired = [
      ...repaired.slice(0, start),
      ...repaired.slice(start, end + 1).reverse(),
      ...repaired.slice(end + 1)
    ];

    repaired = sanitizeContour(repaired);
    pass += 1;
  }

  return repaired;
}

function findFirstIntersection(points) {
  const count = points.length;

  for (let firstIndex = 0; firstIndex < count; firstIndex += 1) {
    const a1 = points[firstIndex];
    const a2 = points[(firstIndex + 1) % count];

    for (
      let secondIndex = firstIndex + 2;
      secondIndex < count;
      secondIndex += 1
    ) {
      if (
        firstIndex === 0 &&
        secondIndex === count - 1
      ) {
        continue;
      }

      const b1 = points[secondIndex];
      const b2 = points[(secondIndex + 1) % count];

      if (segmentsIntersect(a1, a2, b1, b2)) {
        return { firstIndex, secondIndex };
      }
    }
  }

  return null;
}

function hasSelfIntersection(points) {
  return Boolean(findFirstIntersection(points));
}

function segmentsIntersect(a, b, c, d) {
  const abC = cross(a, b, c);
  const abD = cross(a, b, d);
  const cdA = cross(c, d, a);
  const cdB = cross(c, d, b);

  return (
    ((abC > 0 && abD < 0) ||
      (abC < 0 && abD > 0)) &&
    ((cdA > 0 && cdB < 0) ||
      (cdA < 0 && cdB > 0))
  );
}

function cross(a, b, c) {
  return (
    (b.x - a.x) * (c.y - a.y) -
    (b.y - a.y) * (c.x - a.x)
  );
}

function pointLineDistance(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;

  if (!lengthSquared) {
    return Math.hypot(
      point.x - start.x,
      point.y - start.y
    );
  }

  const t = clamp(
    (
      (point.x - start.x) * dx +
      (point.y - start.y) * dy
    ) / lengthSquared,
    0,
    1
  );

  const projectionX = start.x + t * dx;
  const projectionY = start.y + t * dy;

  return Math.hypot(
    point.x - projectionX,
    point.y - projectionY
  );
}

function signedArea(points) {
  let area = 0;

  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];

    area += (
      current.x * next.y -
      next.x * current.y
    );
  }

  return area / 2;
}

function contourBounds(points) {
  return {
    minX: Math.min(...points.map((point) => point.x)),
    maxX: Math.max(...points.map((point) => point.x)),
    minY: Math.min(...points.map((point) => point.y)),
    maxY: Math.max(...points.map((point) => point.y))
  };
}

function disposeObject(object) {
  object.traverse?.((node) => {
    node.geometry?.dispose?.();

    if (Array.isArray(node.material)) {
      node.material.forEach(
        (material) => material.dispose?.()
      );
    } else {
      node.material?.dispose?.();
    }
  });
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
