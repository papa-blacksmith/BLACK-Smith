import * as THREE from "https://esm.sh/three@0.169.0";
import { OrbitControls } from "https://esm.sh/three@0.169.0/examples/jsm/controls/OrbitControls.js";
import { sampleWeaponGeometry } from "../features/editor.js";

export class Weapon3DPreview {
  constructor({ container, getShape, getActivePart, onStatus = () => {} }) {
    this.container = container;
    this.getShape = getShape;
    this.getActivePart = getActivePart;
    this.onStatus = onStatus;
    this.updateQueued = false;
    this.disposed = false;
    this.lastSignature = "";

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(36, 1, 0.1, 5000);
    this.camera.position.set(45, 90, 430);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    container.innerHTML = "";
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
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
    this.scene.add(new THREE.HemisphereLight(0xa8d2ff, 0x1c1108, 1.5));
    const key = new THREE.DirectionalLight(0xffdf9b, 4.0);
    key.position.set(180, 240, 320);
    key.castShadow = true;
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0x6eaaff, 2.5);
    rim.position.set(-260, 90, -160);
    this.scene.add(rim);
    const warm = new THREE.PointLight(0xff8f3c, 2.0, 900);
    warm.position.set(-220, -20, 180);
    this.scene.add(warm);
  }

  addGround() {
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(290, 64),
      new THREE.MeshStandardMaterial({
        color: 0x0a1018,
        roughness: .9,
        transparent: true,
        opacity: .78
      })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -105;
    ground.receiveShadow = true;
    this.scene.add(ground);
    const grid = new THREE.GridHelper(580, 22, 0x62491f, 0x243142);
    grid.position.y = -104;
    grid.material.transparent = true;
    grid.material.opacity = .42;
    this.scene.add(grid);
  }

  resize() {
    const width = Math.max(280, this.container.clientWidth || 800);
    const height = Math.max(280, this.container.clientHeight || 420);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  scheduleUpdate() {
    if (this.updateQueued || this.disposed) return;
    this.updateQueued = true;
    requestAnimationFrame(() => {
      this.updateQueued = false;
      this.rebuild(false);
    });
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
      const sampled = sampleWeaponGeometry(shape, 300);
      const contour = sanitizeContour(sampled.contour);
      if (contour.length < 3) throw new Error("輪郭頂点が不足しています");
      if (hasSelfIntersection(contour)) {
        throw new Error("2D輪郭が自己交差しています");
      }

      const newMesh = buildExactMesh(contour, sampled, shape);
      newMesh.userData.partId = part?.id || "active";
      newMesh.userData.partLabel = part?.label || "選択中パーツ";

      const oldChildren = [...this.weaponRoot.children];
      this.weaponRoot.add(newMesh);
      oldChildren.forEach((object) => {
        this.weaponRoot.remove(object);
        disposeObject(object);
      });

      this.lastSignature = signature;
      this.centerWeapon();
      this.onStatus(`同期済み・${contour.length}頂点`, "ok");
    } catch (error) {
      console.warn("3D同期を保留しました", error);
      this.onStatus(`同期保留：${error.message}`, "warning");
      // 前回の正常メッシュは消さない。
    }
  }

  centerWeapon() {
    const box = new THREE.Box3().setFromObject(this.weaponRoot);
    if (box.isEmpty()) return;
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    this.weaponRoot.position.set(-center.x, -center.y + 5, -center.z);
    const dimension = Math.max(size.x, size.y, size.z, 100);
    const distance = clamp(dimension * 1.55, 220, 900);
    this.camera.position.set(distance * .16, distance * .25, distance);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  resetView() {
    this.weaponRoot.rotation.set(-.22, .08, 0);
    this.centerWeapon();
  }

  animate() {
    if (this.disposed) return;
    requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

function buildExactMesh(contourInput, sampled, shape) {
  let contour = contourInput.map((point) => new THREE.Vector2(point.x, point.y));
  if (signedArea(contour) < 0) contour = contour.reverse();

  const triangles = THREE.ShapeUtils.triangulateShape(contour, []);
  if (!triangles.length) throw new Error("三角形分割に失敗しました");

  const box = contourBounds(contour);
  const centerX = (box.minX + box.maxX) / 2;
  const centerY = (box.minY + box.maxY) / 2;
  const length = Math.max(1, box.maxX - box.minX);
  const baseDepth = clamp(Number(shape.thickness || 22) * .72, 4, 58);
  const count = contour.length;
  const positions = [];
  const uvs = [];

  for (let side = 0; side < 2; side += 1) {
    for (const point of contour) {
      const t = clamp((point.x - box.minX) / length, 0, 1);
      const tipDepth = Math.max(.12, 1 - Math.pow(t, 5) * .86);
      const z = (side === 0 ? 1 : -1) * baseDepth * tipDepth / 2;
      positions.push(point.x - centerX, -(point.y - centerY), z);
      uvs.push((point.x - box.minX) / Math.max(1, box.maxX - box.minX),
        (point.y - box.minY) / Math.max(1, box.maxY - box.minY));
    }
  }

  const indices = [];
  for (const tri of triangles) {
    indices.push(tri[0], tri[1], tri[2]);
    indices.push(count + tri[2], count + tri[1], count + tri[0]);
  }

  for (let i = 0; i < count; i += 1) {
    const next = (i + 1) % count;
    indices.push(i, next, count + next);
    indices.push(i, count + next, count + i);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  const material = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(shape.color || "#cfd5df"),
    metalness: .92,
    roughness: .21,
    clearcoat: .45,
    clearcoatRoughness: .18,
    emissive: new THREE.Color(shape.color || "#ffffff"),
    emissiveIntensity: clamp(Number(shape.glow || 0) / 180, 0, .55),
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
    const current = { x: Number(point.x), y: Number(point.y) };
    if (!Number.isFinite(current.x) || !Number.isFinite(current.y)) continue;
    const previous = output.at(-1);
    if (previous && Math.hypot(current.x - previous.x, current.y - previous.y) < .25) {
      continue;
    }
    output.push(current);
  }
  if (output.length > 2) {
    const first = output[0], last = output.at(-1);
    if (Math.hypot(first.x - last.x, first.y - last.y) < .25) output.pop();
  }
  return output;
}

function hasSelfIntersection(points) {
  const count = points.length;
  for (let i = 0; i < count; i += 1) {
    const a1 = points[i], a2 = points[(i + 1) % count];
    for (let j = i + 1; j < count; j += 1) {
      if (Math.abs(i - j) <= 1) continue;
      if (i === 0 && j === count - 1) continue;
      const b1 = points[j], b2 = points[(j + 1) % count];
      if (segmentsIntersect(a1, a2, b1, b2)) return true;
    }
  }
  return false;
}

function segmentsIntersect(a, b, c, d) {
  const cross = (p, q, r) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  const abC = cross(a, b, c), abD = cross(a, b, d);
  const cdA = cross(c, d, a), cdB = cross(c, d, b);
  return ((abC > 0 && abD < 0) || (abC < 0 && abD > 0))
    && ((cdA > 0 && cdB < 0) || (cdA < 0 && cdB > 0));
}

function signedArea(points) {
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i], b = points[(i + 1) % points.length];
    area += a.x * b.y - b.x * a.y;
  }
  return area / 2;
}

function contourBounds(points) {
  return {
    minX: Math.min(...points.map((p) => p.x)),
    maxX: Math.max(...points.map((p) => p.x)),
    minY: Math.min(...points.map((p) => p.y)),
    maxY: Math.max(...points.map((p) => p.y))
  };
}

function disposeObject(object) {
  object.traverse?.((node) => {
    node.geometry?.dispose?.();
    if (Array.isArray(node.material)) node.material.forEach((m) => m.dispose?.());
    else node.material?.dispose?.();
  });
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
