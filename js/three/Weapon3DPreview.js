
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/controls/OrbitControls.js";

export class Weapon3DPreview {
  constructor({ container, getShape, getParts }) {
    this.container = container;
    this.getShape = getShape;
    this.getParts = getParts;

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
    this.controls.minDistance = 120;
    this.controls.maxDistance = 1100;

    this.weaponRoot = new THREE.Group();
    this.weaponRoot.rotation.x = -0.18;
    this.scene.add(this.weaponRoot);

    this.addLights();
    this.addGround();

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);

    this.updateQueued = false;
    this.disposed = false;

    this.resize();
    this.rebuild();
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
      new THREE.CircleGeometry(270, 64),
      new THREE.MeshStandardMaterial({
        color: 0x0a1018,
        roughness: 0.9,
        transparent: true,
        opacity: 0.78
      })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -92;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const grid = new THREE.GridHelper(540, 20, 0x62491f, 0x243142);
    grid.position.y = -91;
    grid.material.transparent = true;
    grid.material.opacity = 0.42;
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
      this.rebuild();
    });
  }

  rebuild() {
    const currentShape = this.getShape?.();
    if (!currentShape) return;

    this.clearWeapon();

    const sourceParts = this.getParts?.();
    const parts = Array.isArray(sourceParts) && sourceParts.length
      ? sourceParts.filter((part) => part.visible !== false)
      : [{ id: "blade", label: "刀身", shape: currentShape, transform: {} }];

    for (let index = 0; index < parts.length; index += 1) {
      const mesh = this.createPart(parts[index], index);
      if (mesh) this.weaponRoot.add(mesh);
    }

    this.centerWeapon();
  }

  createPart(part, index) {
    const id = String(part.id || "").toLowerCase();
    const label = String(part.label || "");
    const shape = part.shape || this.getShape?.();

    if (isGrip(id, label)) return this.createGrip(shape, part);
    if (isPommel(id, label)) return this.createPommel(shape, part, index);
    if (isGuard(id, label)) return this.createGuard(shape, part, index);
    return this.createBlade(shape, part, index);
  }

  createBlade(shape, part, index) {
    const outline = createOutline(shape);
    if (outline.length < 3) return null;

    const path = new THREE.Shape();
    path.moveTo(outline[0].x, outline[0].y);
    outline.slice(1).forEach((point) => path.lineTo(point.x, point.y));
    path.closePath();

    const depth = clamp(Number(shape.thickness || 22) * 0.72, 4, 54);
    const geometry = new THREE.ExtrudeGeometry(path, {
      depth,
      bevelEnabled: true,
      bevelThickness: Math.min(5, depth * 0.24),
      bevelSize: Math.min(5.5, depth * 0.28),
      bevelSegments: 3,
      curveSegments: 12,
      steps: 1
    });

    geometry.center();
    taperTipAndEdge(geometry);
    geometry.computeVertexNormals();

    const mesh = new THREE.Mesh(
      geometry,
      metalMaterial(shape, index, true)
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    applyTransform(mesh, part.transform);
    return mesh;
  }

  createGuard(shape, part, index) {
    const width = clamp(Number(shape.width || 55) * 1.65, 52, 180);
    const height = clamp(Number(shape.thickness || 28) * 1.15, 18, 75);
    const depth = clamp(Number(shape.depth || 20), 8, 42);

    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth, 4, 2, 2),
      metalMaterial(shape, index, false)
    );
    mesh.position.x = -150;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    applyTransform(mesh, part.transform);
    return mesh;
  }

  createGrip(shape, part) {
    const radius = clamp(Number(shape.width || 22) * 0.48, 7, 20);
    const length = clamp(Number(shape.length || 115), 70, 190);
    const geometry = new THREE.CylinderGeometry(
      radius * 0.9,
      radius,
      length,
      20,
      4
    );
    geometry.rotateZ(Math.PI / 2);

    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        color: 0x4a241a,
        roughness: 0.74,
        metalness: 0.14
      })
    );
    mesh.position.x = -235;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    applyTransform(mesh, part.transform);
    return mesh;
  }

  createPommel(shape, part, index) {
    const radius = clamp(Number(shape.width || 38) * 0.5, 8, 28);
    const geometry = new THREE.SphereGeometry(radius, 24, 16);
    geometry.scale(1.05, 0.92, 0.92);

    const mesh = new THREE.Mesh(
      geometry,
      metalMaterial(shape, index, false)
    );
    mesh.position.x = -315;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    applyTransform(mesh, part.transform);
    return mesh;
  }

  centerWeapon() {
    const box = new THREE.Box3().setFromObject(this.weaponRoot);
    if (box.isEmpty()) return;

    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    this.weaponRoot.position.sub(center);
    this.weaponRoot.position.y += 4;

    const dimension = Math.max(size.x, size.y, size.z, 100);
    const distance = clamp(dimension * 1.65, 230, 850);
    this.camera.position.set(distance * 0.18, distance * 0.28, distance);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  resetView() {
    this.camera.position.set(45, 90, 430);
    this.controls.target.set(0, 0, 0);
    this.weaponRoot.rotation.set(-0.18, 0.08, 0);
    this.controls.update();
  }

  clearWeapon() {
    while (this.weaponRoot.children.length) {
      const object = this.weaponRoot.children.pop();
      object.traverse?.((node) => {
        node.geometry?.dispose?.();
        if (Array.isArray(node.material)) {
          node.material.forEach((material) => material.dispose?.());
        } else {
          node.material?.dispose?.();
        }
      });
    }
  }

  animate() {
    if (this.disposed) return;
    requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

function createOutline(shape) {
  const points = Array.isArray(shape.points) ? shape.points : [];
  if (points.length < 2) {
    return [
      new THREE.Vector2(-130, -24),
      new THREE.Vector2(130, -9),
      new THREE.Vector2(185, 0),
      new THREE.Vector2(130, 9),
      new THREE.Vector2(-130, 24)
    ];
  }

  const sorted = points.map((point, index) => ({
    x: Number(point.x ?? index * 120),
    y: Number(point.y ?? 180),
    width: Number(point.width ?? 1),
    upper: Number(point.upper ?? 1),
    lower: Number(point.lower ?? 1)
  })).sort((a, b) => a.x - b.x);

  const minX = Math.min(...sorted.map((point) => point.x));
  const maxX = Math.max(...sorted.map((point) => point.x));
  const centerY = sorted.reduce((sum, point) => sum + point.y, 0) / sorted.length;
  const sourceLength = Math.max(1, maxX - minX);
  const targetLength = clamp(sourceLength * 0.62, 240, 520);
  const xScale = targetLength / sourceLength;
  const baseWidth = clamp(Number(shape.width || 45), 10, 120) * 0.7;

  const top = [];
  const bottom = [];

  sorted.forEach((point, index) => {
    const t = sorted.length <= 1 ? 0 : index / (sorted.length - 1);
    const x = (point.x - minX) * xScale - targetLength * 0.5;
    const curve = -(point.y - centerY) * 0.6;
    const tip = Math.max(0.055, 1 - Math.pow(t, 7) * 0.96);
    const width = baseWidth * clamp(point.width, 0.08, 2.2) * tip;

    top.push(new THREE.Vector2(
      x,
      curve + width * clamp(point.upper, 0.08, 2.2)
    ));
    bottom.push(new THREE.Vector2(
      x,
      curve - width * clamp(point.lower, 0.08, 2.2)
    ));
  });

  return [...top, ...bottom.reverse()];
}

function taperTipAndEdge(geometry) {
  const position = geometry.attributes.position;
  const box = new THREE.Box3().setFromBufferAttribute(position);
  const length = Math.max(1, box.max.x - box.min.x);

  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const y = position.getY(index);
    const z = position.getZ(index);
    const t = clamp((x - box.min.x) / length, 0, 1);
    const tipFactor = 1 - Math.pow(t, 5) * 0.82;
    const edgeFactor = 1 - Math.min(0.44, Math.abs(y) / 160);
    position.setZ(index, z * Math.max(0.16, tipFactor * edgeFactor));
  }

  position.needsUpdate = true;
}

function metalMaterial(shape, index, blade) {
  const materialName = String(shape.material || "");
  let color = [0xb9c3cf, 0xd1a44f, 0x8da6c2, 0xaeb9c5][index % 4];

  if (materialName.includes("金")) color = 0xd3a63f;
  if (materialName.includes("銀")) color = 0xd7e2ed;
  if (materialName.includes("黒")) color = 0x4c5868;
  if (materialName.includes("ミスリル")) color = 0x87badf;
  if (materialName.includes("オリハルコン")) color = 0x7fbd84;

  return new THREE.MeshPhysicalMaterial({
    color,
    metalness: blade ? 0.92 : 0.82,
    roughness: blade ? 0.2 : 0.3,
    clearcoat: 0.45,
    clearcoatRoughness: 0.18
  });
}

function applyTransform(mesh, transform = {}) {
  mesh.position.x += clamp(Number(transform.x) || 0, -380, 380) * 0.55;
  mesh.position.y += clamp(Number(transform.y) || 0, -180, 180) * -0.55;
  mesh.rotation.z += THREE.MathUtils.degToRad(
    -clamp(Number(transform.rotation) || 0, -180, 180)
  );
  mesh.scale.x *= clamp(Number(transform.scaleX) || 1, 0.15, 2.5);
  mesh.scale.y *= clamp(Number(transform.scaleY) || 1, 0.15, 2.5);
}

function isGrip(id, label) {
  return ["grip", "grips", "shaft"].some((key) => id.includes(key))
    || /柄|グリップ|長柄/.test(label);
}

function isGuard(id, label) {
  return ["guard", "guards", "habaki"].some((key) => id.includes(key))
    || /鍔|鎺|ガード/.test(label);
}

function isPommel(id, label) {
  return ["pommel", "buttcap", "butt_cap"].some((key) => id.includes(key))
    || /ポンメル|柄頭|石突|柄尻/.test(label);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
