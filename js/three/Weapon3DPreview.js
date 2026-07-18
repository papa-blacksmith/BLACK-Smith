
import * as THREE from "https://esm.sh/three@0.169.0";
import { OrbitControls } from "https://esm.sh/three@0.169.0/examples/jsm/controls/OrbitControls.js";
import { sampleWeaponGeometry } from "../features/editor.js";
import { blendMaterialProfile } from "../systems/MaterialEngine.js";

const CAD_SAMPLE_COUNT = 360;
const MIN_POINT_DISTANCE = 0.45;
const MAX_REPAIR_PASSES = 80;

export class Weapon3DPreview {
  constructor({
    container,
    getShape,
    getActivePart,
    getParts = null,
    getWeaponType = () => 0,
    getMaterialProfile = () => null,
    onStatus = () => {}
  }) {
    this.container = container;
    this.getShape = getShape;
    this.getActivePart = getActivePart;
    this.getParts = getParts;
    this.getWeaponType = getWeaponType;
    this.getMaterialProfile = getMaterialProfile;
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
    const activePart = this.getActivePart?.();
    const currentShape = activePart?.shape || this.getShape?.();
    if (!currentShape) return;

    const sourceParts = this.getParts?.();
    const parts = Array.isArray(sourceParts) && sourceParts.length
      ? sourceParts.filter((part) => part.visible !== false && part.shape)
      : [activePart || {
          id: "blade",
          label: "刀身",
          shape: currentShape,
          transform: {}
        }];

    const weaponType = Number(this.getWeaponType?.() ?? 0);

    const signature = JSON.stringify({
      weaponType,
      materialProfile: this.getMaterialProfile?.(),
      parts: parts.map((part) => ({
        id: part.id,
        label: part.label,
        shape: {
          points: part.shape?.points,
          width: part.shape?.width,
          thickness: part.shape?.thickness,
          tip: part.shape?.tip,
          asymmetric: part.shape?.asymmetric,
          edgeStyle: part.shape?.edgeStyle,
          serration: part.shape?.serration,
          color: part.shape?.color,
          glow: part.shape?.glow
        },
        transform: part.transform,
        visible: part.visible
      }))
    });

    if (!force && signature === this.lastSignature) return;

    try {
      const materialProfile = this.getMaterialProfile?.();

      const generated = weaponType === 0
        ? this.buildOneHandSword(parts, materialProfile)
        : this.buildGenericWeapon(parts, materialProfile);

      const nextAssembly = generated.assembly;
      const totalVertices = generated.totalVertices;
      const repairedParts = generated.repairedParts;

      if (!nextAssembly?.children.length) {
        throw new Error("3D化できるパーツがありません");
      }

      const oldChildren = [...this.weaponRoot.children];
      this.weaponRoot.add(nextAssembly);

      oldChildren.forEach((object) => {
        this.weaponRoot.remove(object);
        disposeObject(object);
      });

      this.lastSignature = signature;
      this.centerWeapon();

      this.onStatus(
        `${weaponType === 0 ? "片手剣専用" : "共通"}同期済み・${parts.length}パーツ・${totalVertices}頂点` +
        (repairedParts ? `・修復${repairedParts}` : ""),
        "ok"
      );
    } catch (error) {
      console.warn("Weapon Assembly同期を保留しました", error);
      this.onStatus(
        `組立同期保留：${error.message}`,
        "warning"
      );
    }
  }


  buildGenericWeapon(parts, materialProfile = null) {
    const assembly = new THREE.Group();
    assembly.name = "GenericWeaponAssembly";

    let totalVertices = 0;
    let repairedParts = 0;

    parts.forEach((part, index) => {
      const result = this.buildPartObject(part, index, parts.length, materialProfile);
      if (!result?.object) return;

      totalVertices += result.vertexCount || 0;
      repairedParts += result.repaired ? 1 : 0;
      assembly.add(result.object);
    });

    return { assembly, totalVertices, repairedParts };
  }

  buildOneHandSword(parts, materialProfile = null) {
    const assembly = new THREE.Group();
    assembly.name = "OneHandSwordAssembly";

    const byId = Object.fromEntries(
      parts.map((part) => [String(part.id || "").toLowerCase(), part])
    );

    const bladePart = byId.blade || parts.find((part) =>
      /刀身|blade/i.test(`${part.id} ${part.label}`)
    );

    if (!bladePart?.shape) {
      throw new Error("片手剣の刀身パーツがありません");
    }

    const bladeResult = this.buildBladeForOneHandSword(bladePart, materialProfile);
    assembly.add(bladeResult.object);

    const bladeBox = new THREE.Box3().setFromObject(bladeResult.object);
    const bladeSize = bladeBox.getSize(new THREE.Vector3());
    const bladeBaseX = bladeBox.min.x;
    const bladeCenterY = (bladeBox.min.y + bladeBox.max.y) / 2;

    let totalVertices = bladeResult.vertexCount;
    let repairedParts = bladeResult.repaired ? 1 : 0;

    const guardPart = byId.guard || parts.find((part) =>
      /鍔|guard/i.test(`${part.id} ${part.label}`)
    );
    const gripPart = byId.grip || parts.find((part) =>
      /柄|grip|handle/i.test(`${part.id} ${part.label}`)
    );
    const pommelPart = byId.pommel || parts.find((part) =>
      /ポンメル|柄頭|pommel/i.test(`${part.id} ${part.label}`)
    );

    const guardThickness = clamp(
      Number(guardPart?.shape?.thickness || 28) * 0.72,
      12,
      46
    );
    const guardX = bladeBaseX - guardThickness * 0.34;

    if (guardPart?.visible !== false && guardPart?.shape) {
      const guard = buildOneHandSwordGuard(
        guardPart.shape,
        guardPart,
        guardX,
        bladeCenterY,
        materialProfile
      );
      assembly.add(guard);
      totalVertices += guard.geometry?.attributes?.position?.count || 0;
    }

    const gripLength = clamp(
      Number(gripPart?.shape?.length || 128),
      82,
      190
    );
    const gripCenterX = guardX - guardThickness * 0.55 - gripLength / 2;

    if (gripPart?.visible !== false && gripPart?.shape) {
      const grip = buildOneHandSwordGrip(
        gripPart.shape,
        gripPart,
        gripCenterX,
        bladeCenterY,
        gripLength,
        materialProfile
      );
      assembly.add(grip);
      totalVertices += grip.geometry?.attributes?.position?.count || 0;
    }

    if (pommelPart?.visible !== false && pommelPart?.shape) {
      const pommelX = gripCenterX - gripLength / 2 - 11;
      const pommel = buildOneHandSwordPommel(
        pommelPart.shape,
        pommelPart,
        pommelX,
        bladeCenterY,
        materialProfile
      );
      assembly.add(pommel);
      totalVertices += pommel.geometry?.attributes?.position?.count || 0;
    }

    // Blade-to-guard collar hides small gaps between independently generated meshes.
    const collar = buildSwordCollar(
      bladeBaseX - 2,
      bladeCenterY,
      clamp(bladeSize.y * 0.42, 11, 30),
      clamp(bladeSize.z * 1.15, 8, 30),
      bladePart.shape,
      materialProfile
    );
    assembly.add(collar);
    totalVertices += collar.geometry?.attributes?.position?.count || 0;

    assembly.userData.generator = "one-hand-sword";
    assembly.userData.weaponType = 0;

    return { assembly, totalVertices, repairedParts };
  }

  buildBladeForOneHandSword(part, materialProfile = null) {
    const shape = part.shape;
    const sampled = sampleWeaponGeometry(shape, CAD_SAMPLE_COUNT);
    const rawContour = sanitizeContour(sampled.contour);

    if (rawContour.length < 3) {
      throw new Error("片手剣の刀身輪郭が不足しています");
    }

    const repaired = repairPolygon(rawContour);
    const contour = simplifyContour(repaired);

    if (contour.length < 3 || hasSelfIntersection(contour)) {
      throw new Error("片手剣の刀身輪郭を修復できません");
    }

    const object = buildCADMesh(contour, shape, materialProfile, "blade");

    // CAD mesh is centered. Move its left edge to the assembly ROOT.
    object.geometry.computeBoundingBox();
    const localBox = object.geometry.boundingBox;
    if (localBox) {
      object.position.x -= localBox.min.x;
      object.position.y -= (localBox.min.y + localBox.max.y) / 2;
    }

    applyUserTransformOnly(object, part.transform);
    object.userData.partId = part.id || "blade";
    object.userData.partLabel = part.label || "刀身";

    return {
      object,
      vertexCount: object.geometry?.attributes?.position?.count || 0,
      repaired: contour.length !== rawContour.length
    };
  }

  buildPartObject(part, index, total, materialProfile = null) {
    const id = String(part.id || "").toLowerCase();
    const label = String(part.label || "");
    const shape = part.shape || this.getShape?.();

    if (!shape) return null;

    if (isGripPart(id, label)) {
      const object = buildGripPart(shape, part, index, materialProfile);
      return {
        object,
        vertexCount: object.geometry?.attributes?.position?.count || 0,
        repaired: false
      };
    }

    if (isPommelPart(id, label)) {
      const object = buildPommelPart(shape, part, index, materialProfile);
      return {
        object,
        vertexCount: object.geometry?.attributes?.position?.count || 0,
        repaired: false
      };
    }

    if (isGuardPart(id, label)) {
      const object = buildGuardPart(shape, part, index, materialProfile);
      return {
        object,
        vertexCount: object.geometry?.attributes?.position?.count || 0,
        repaired: false
      };
    }

    const sampled = sampleWeaponGeometry(shape, CAD_SAMPLE_COUNT);
    const rawContour = sanitizeContour(sampled.contour);

    if (rawContour.length < 3) {
      throw new Error(`${label || id}の輪郭頂点が不足`);
    }

    const repaired = repairPolygon(rawContour);
    const contour = simplifyContour(repaired);

    if (contour.length < 3) {
      throw new Error(`${label || id}の輪郭修復に失敗`);
    }

    if (hasSelfIntersection(contour)) {
      throw new Error(`${label || id}の自己交差を解消できません`);
    }

    const object = buildCADMesh(contour, shape, materialProfile, "blade");
    applyPartAssemblyTransform(object, part, id, label, index, total);

    object.userData.partId = part.id || `part-${index}`;
    object.userData.partLabel = part.label || "パーツ";

    return {
      object,
      vertexCount: object.geometry?.attributes?.position?.count || 0,
      repaired: contour.length !== rawContour.length
    };
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

function buildCADMesh(contourInput, shape, materialProfile = null, partRole = "blade") {
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

  const material = createMaterialFromProfile(
    materialProfile,
    partRole,
    shape
  );

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
}



function buildOneHandSwordGuard(shape, part, x, y, materialProfile = null) {
  const span = clamp(Number(shape.width || 55) * 1.65, 64, 155);
  const body = clamp(Number(shape.thickness || 28) * 0.9, 16, 48);
  const depth = clamp(Number(shape.depth || shape.thickness || 22) * 0.75, 9, 36);

  const outline = new THREE.Shape();
  outline.moveTo(-body * 0.45, span * 0.5);
  outline.quadraticCurveTo(0, span * 0.62, body * 0.45, span * 0.5);
  outline.lineTo(body * 0.34, span * 0.13);
  outline.quadraticCurveTo(body * 0.12, 0, body * 0.34, -span * 0.13);
  outline.lineTo(body * 0.45, -span * 0.5);
  outline.quadraticCurveTo(0, -span * 0.62, -body * 0.45, -span * 0.5);
  outline.lineTo(-body * 0.34, -span * 0.13);
  outline.quadraticCurveTo(-body * 0.12, 0, -body * 0.34, span * 0.13);
  outline.closePath();

  const geometry = new THREE.ExtrudeGeometry(outline, {
    depth,
    bevelEnabled: true,
    bevelThickness: 2.2,
    bevelSize: 2.2,
    bevelSegments: 3,
    curveSegments: 12
  });
  geometry.center();

  const mesh = new THREE.Mesh(
    geometry,
    createMaterialFromProfile(materialProfile, "guard", shape)
  );
  mesh.position.set(x, y, 0);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  applyUserTransformOnly(mesh, part.transform);
  mesh.userData.partId = part.id || "guard";
  return mesh;
}

function buildOneHandSwordGrip(shape, part, x, y, length, materialProfile = null) {
  const radius = clamp(Number(shape.width || 22) * 0.42, 7, 18);
  const geometry = new THREE.CylinderGeometry(
    radius * 0.88,
    radius,
    length,
    28,
    8
  );
  geometry.rotateZ(Math.PI / 2);

  const gripProfile = blendMaterialProfile(
    materialProfile,
    "grip"
  );
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(gripProfile.color).lerp(
      new THREE.Color("#351a14"),
      0.68
    ),
    roughness: 0.68,
    metalness: Math.min(0.28, gripProfile.metalness * 0.25),
    emissive: new THREE.Color(gripProfile.emissive),
    emissiveIntensity: gripProfile.emissiveIntensity * 0.18
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, 0);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  applyUserTransformOnly(mesh, part.transform);
  mesh.userData.partId = part.id || "grip";

  // Decorative wrap rings make the grip visually read as a handle.
  const group = new THREE.Group();
  group.add(mesh);
  const ringMaterial = new THREE.MeshStandardMaterial({
    color: 0x24130f,
    roughness: 0.62,
    metalness: 0.18
  });
  const ringCount = 8;

  for (let index = 0; index < ringCount; index += 1) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius * 1.02, 1.25, 8, 20),
      ringMaterial
    );
    ring.rotation.y = Math.PI / 2;
    ring.position.set(
      x - length / 2 + ((index + 0.5) / ringCount) * length,
      y,
      0
    );
    group.add(ring);
  }

  group.userData.partId = part.id || "grip";
  return group;
}

function buildOneHandSwordPommel(shape, part, x, y, materialProfile = null) {
  const radius = clamp(Number(shape.width || 38) * 0.43, 9, 24);
  const geometry = new THREE.SphereGeometry(radius, 28, 18);
  geometry.scale(1.12, 0.92, 0.92);

  const mesh = new THREE.Mesh(
    geometry,
    createMaterialFromProfile(materialProfile, "pommel", shape)
  );
  mesh.position.set(x, y, 0);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  applyUserTransformOnly(mesh, part.transform);
  mesh.userData.partId = part.id || "pommel";
  return mesh;
}

function buildSwordCollar(x, y, height, depth, shape, materialProfile = null) {
  const geometry = new THREE.BoxGeometry(10, height, depth);
  const mesh = new THREE.Mesh(
    geometry,
    createMaterialFromProfile(materialProfile, "collar", shape)
  );
  mesh.position.set(x, y, 0);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.partId = "blade-collar";
  return mesh;
}

function applyUserTransformOnly(object, transform = {}) {
  object.position.x += clamp(Number(transform.x) || 0, -500, 500) * 0.55;
  object.position.y -= clamp(Number(transform.y) || 0, -260, 260) * 0.55;
  object.rotation.z += THREE.MathUtils.degToRad(
    -clamp(Number(transform.rotation) || 0, -360, 360)
  );
  object.scale.x *= clamp(Number(transform.scaleX) || 1, 0.1, 3);
  object.scale.y *= clamp(Number(transform.scaleY) || 1, 0.1, 3);
}

function buildGuardPart(shape, part, index, materialProfile = null) {
  const width = clamp(Number(shape.width || 58) * 1.5, 48, 190);
  const height = clamp(Number(shape.thickness || 26) * 1.15, 16, 84);
  const depth = clamp(Number(shape.depth || 22), 8, 54);

  const geometry = new THREE.BoxGeometry(
    width,
    height,
    depth,
    6,
    3,
    3
  );

  const material = createMaterialFromProfile(materialProfile, "guard", shape);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  applyPartAssemblyTransform(
    mesh,
    part,
    "guard",
    part.label || "鍔",
    index,
    1
  );

  return mesh;
}

function buildGripPart(shape, part, index, materialProfile = null) {
  const radius = clamp(Number(shape.width || 22) * 0.44, 6, 22);
  const length = clamp(Number(shape.length || 120), 70, 220);

  const geometry = new THREE.CylinderGeometry(
    radius * 0.88,
    radius,
    length,
    24,
    5
  );
  geometry.rotateZ(Math.PI / 2);

  const material = new THREE.MeshStandardMaterial({
    color: 0x4b241a,
    roughness: 0.72,
    metalness: 0.16
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  applyPartAssemblyTransform(
    mesh,
    part,
    "grip",
    part.label || "柄",
    index,
    1
  );

  return mesh;
}

function buildPommelPart(shape, part, index, materialProfile = null) {
  const radius = clamp(Number(shape.width || 36) * 0.5, 7, 30);
  const geometry = new THREE.SphereGeometry(radius, 28, 18);
  geometry.scale(1.05, 0.92, 0.92);

  const material = createMaterialFromProfile(materialProfile, "pommel", shape);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  applyPartAssemblyTransform(
    mesh,
    part,
    "pommel",
    part.label || "ポンメル",
    index,
    1
  );

  return mesh;
}


function createMaterialFromProfile(
  materialProfile,
  partRole,
  shape = {}
) {
  const profile = blendMaterialProfile(
    materialProfile,
    partRole
  );

  const material = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(profile.color),
    metalness: clamp(profile.metalness, 0, 1),
    roughness: clamp(profile.roughness, 0.02, 1),
    clearcoat: clamp(profile.clearcoat, 0, 1),
    clearcoatRoughness: clamp(
      profile.clearcoatRoughness,
      0.01,
      1
    ),
    transmission: clamp(profile.transmission, 0, 0.9),
    opacity: clamp(profile.opacity, 0.2, 1),
    transparent:
      profile.opacity < 1 ||
      profile.transmission > 0,
    emissive: new THREE.Color(profile.emissive),
    emissiveIntensity: clamp(
      profile.emissiveIntensity +
      Number(shape.glow || 0) / 220,
      0,
      1.5
    ),
    iridescence: clamp(profile.iridescence, 0, 1),
    iridescenceIOR: 1.45,
    iridescenceThicknessRange: [100, 520],
    reflectivity: 0.92,
    side: THREE.DoubleSide
  });

  material.userData.materialProfile = {
    id: profile.id,
    name: profile.name,
    partRole
  };

  return material;
}

function createAssemblyMaterial(shape, index, blade) {
  const materialName = String(shape.material || "");
  let color = shape.color || "#cfd5df";

  if (materialName.includes("金")) color = "#d3a63f";
  if (materialName.includes("銀")) color = "#d7e2ed";
  if (materialName.includes("黒")) color = "#4c5868";
  if (materialName.includes("ミスリル")) color = "#87badf";
  if (materialName.includes("オリハルコン")) color = "#7fbd84";

  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color),
    metalness: blade ? 0.93 : 0.82,
    roughness: blade ? 0.2 : 0.3,
    clearcoat: 0.48,
    clearcoatRoughness: 0.17,
    emissive: new THREE.Color(color),
    emissiveIntensity: clamp(
      Number(shape.glow || 0) / 180,
      0,
      0.55
    ),
    side: THREE.DoubleSide
  });
}

function applyPartAssemblyTransform(
  object,
  part,
  id,
  label,
  index,
  total
) {
  const transform = part.transform || {};
  const key = `${id} ${label}`.toLowerCase();

  let baseX = 0;
  let baseY = 0;
  let baseZ = 0;

  if (isGuardPart(id, label)) {
    baseX = -165;
  } else if (isGripPart(id, label)) {
    baseX = -255;
  } else if (isPommelPart(id, label)) {
    baseX = -345;
  } else if (
    key.includes("head") ||
    /ヘッド|打撃面/.test(label)
  ) {
    baseX = 135;
  }

  object.position.x += baseX + clamp(
    Number(transform.x) || 0,
    -500,
    500
  ) * 0.55;

  object.position.y += baseY - clamp(
    Number(transform.y) || 0,
    -260,
    260
  ) * 0.55;

  object.position.z += baseZ + index * 0.35;

  object.rotation.z += THREE.MathUtils.degToRad(
    -clamp(Number(transform.rotation) || 0, -360, 360)
  );

  object.scale.x *= clamp(
    Number(transform.scaleX) || 1,
    0.1,
    3
  );

  object.scale.y *= clamp(
    Number(transform.scaleY) || 1,
    0.1,
    3
  );

  object.userData.socket = transform.socket || "root";
}

function isGuardPart(id, label) {
  return (
    ["guard", "guards", "habaki"].some((key) => id.includes(key)) ||
    /鍔|鎺|ガード/.test(label)
  );
}

function isGripPart(id, label) {
  return (
    ["grip", "grips", "shaft", "handle"].some((key) => id.includes(key)) ||
    /柄|グリップ|長柄|ハンドル/.test(label)
  );
}

function isPommelPart(id, label) {
  return (
    ["pommel", "buttcap", "butt_cap", "endcap"].some((key) => id.includes(key)) ||
    /ポンメル|柄頭|石突|柄尻/.test(label)
  );
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
