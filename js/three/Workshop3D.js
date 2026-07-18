
import * as THREE from "https://esm.sh/three@0.169.0";
import { OrbitControls } from "https://esm.sh/three@0.169.0/examples/jsm/controls/OrbitControls.js";

export class Workshop3D {
  constructor({ container, onSelect = () => {} }) {
    this.container = container;
    this.onSelect = onSelect;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x090d12);
    this.camera = new THREE.PerspectiveCamera(48, 1, 0.1, 3000);
    this.camera.position.set(390, 250, 510);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;

    container.innerHTML = "";
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.target.set(0, 70, 0);
    this.controls.minDistance = 260;
    this.controls.maxDistance = 1000;
    this.controls.maxPolarAngle = Math.PI * 0.48;

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.hotspots = [];

    this.buildRoom();
    this.buildEquipment();
    this.addLights();

    this.renderer.domElement.addEventListener("click", (event) => this.pick(event));
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
    this.animate();
  }

  addLights() {
    this.scene.add(new THREE.HemisphereLight(0x8fb9d8, 0x201108, 0.8));
    const fire = new THREE.PointLight(0xff6423, 7, 620);
    fire.position.set(-120, 105, -55);
    fire.castShadow = true;
    this.scene.add(fire);

    const key = new THREE.DirectionalLight(0xffdd9c, 2.3);
    key.position.set(260, 380, 240);
    key.castShadow = true;
    this.scene.add(key);

    const blue = new THREE.PointLight(0x4d8dff, 1.5, 500);
    blue.position.set(230, 150, -170);
    this.scene.add(blue);
  }

  buildRoom() {
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(760, 560),
      new THREE.MeshStandardMaterial({ color: 0x22262c, roughness: 0.92, metalness: 0.05 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x29221d, roughness: 0.95 });
    const back = new THREE.Mesh(new THREE.BoxGeometry(760, 300, 24), wallMaterial);
    back.position.set(0, 150, -280);
    back.receiveShadow = true;
    this.scene.add(back);

    const left = new THREE.Mesh(new THREE.BoxGeometry(24, 300, 560), wallMaterial);
    left.position.set(-380, 150, 0);
    this.scene.add(left);

    const beamMaterial = new THREE.MeshStandardMaterial({ color: 0x422a1b, roughness: 0.85 });
    for (let x = -300; x <= 300; x += 150) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(18, 320, 18), beamMaterial);
      beam.position.set(x, 160, -264);
      this.scene.add(beam);
    }
  }

  buildEquipment() {
    this.addAnvil(-20, 42, 40);
    this.addForge(-145, 55, -95);
    this.addWorkbench(165, 45, 35);
    this.addStorage(265, 88, -175);
    this.addOreShelf(90, 92, -205);
    this.addNpc(-250, 75, 80);
  }

  addHotspot(object, id, label) {
    object.userData.hotspot = { id, label };
    this.hotspots.push(object);
    this.scene.add(object);
  }

  addAnvil(x, y, z) {
    const material = new THREE.MeshStandardMaterial({ color: 0x505a65, metalness: 0.9, roughness: 0.28 });
    const group = new THREE.Group();
    const top = new THREE.Mesh(new THREE.BoxGeometry(130, 32, 46), material);
    top.castShadow = true;
    top.position.y = 55;
    const horn = new THREE.Mesh(new THREE.ConeGeometry(23, 82, 4), material);
    horn.rotation.z = Math.PI / 2;
    horn.position.set(89, 56, 0);
    const base = new THREE.Mesh(new THREE.BoxGeometry(55, 90, 50), material);
    group.add(top, horn, base);
    group.position.set(x, y, z);
    group.traverse((node) => { if (node.isMesh) node.castShadow = true; });
    this.addHotspot(group, "anvil", "金床");
  }

  addForge(x, y, z) {
    const stone = new THREE.MeshStandardMaterial({ color: 0x393432, roughness: 0.94 });
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(150, 110, 105), stone);
    const mouth = new THREE.Mesh(
      new THREE.BoxGeometry(92, 52, 8),
      new THREE.MeshStandardMaterial({ color: 0x2a0802, emissive: 0xff3b08, emissiveIntensity: 2.5 })
    );
    mouth.position.set(0, 4, 56);
    group.add(body, mouth);
    group.position.set(x, y, z);
    this.addHotspot(group, "forge", "溶鉱炉");
  }

  addWorkbench(x, y, z) {
    const wood = new THREE.MeshStandardMaterial({ color: 0x59351f, roughness: 0.82 });
    const group = new THREE.Group();
    const top = new THREE.Mesh(new THREE.BoxGeometry(210, 18, 95), wood);
    top.position.y = 65;
    group.add(top);
    for (const sx of [-82, 82]) {
      for (const sz of [-34, 34]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(16, 68, 16), wood);
        leg.position.set(sx, 30, sz);
        group.add(leg);
      }
    }
    group.position.set(x, y, z);
    this.addHotspot(group, "workbench", "鍛冶台");
  }

  addStorage(x, y, z) {
    const material = new THREE.MeshStandardMaterial({ color: 0x4d301e, roughness: 0.86 });
    const group = new THREE.Group();
    const chest = new THREE.Mesh(new THREE.BoxGeometry(120, 75, 70), material);
    const lid = new THREE.Mesh(new THREE.BoxGeometry(126, 18, 76), material);
    lid.position.y = 46;
    group.add(chest, lid);
    group.position.set(x, y, z);
    this.addHotspot(group, "storage", "武器保管庫");
  }

  addOreShelf(x, y, z) {
    const wood = new THREE.MeshStandardMaterial({ color: 0x40291b, roughness: 0.9 });
    const group = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.BoxGeometry(170, 180, 42), wood);
    group.add(frame);
    const colors = [0x78c9ff, 0xff6d38, 0xb26dff, 0xffd85a, 0x76dd8b];
    colors.forEach((color, index) => {
      const crystal = new THREE.Mesh(
        new THREE.OctahedronGeometry(14 + index * 1.5),
        new THREE.MeshPhysicalMaterial({
          color,
          emissive: color,
          emissiveIntensity: 0.35,
          roughness: 0.12,
          metalness: 0.25,
          transmission: 0.18
        })
      );
      crystal.position.set(-55 + index * 28, -50 + (index % 2) * 65, 27);
      group.add(crystal);
    });
    group.position.set(x, y, z);
    this.addHotspot(group, "ores", "鉱石棚");
  }

  addNpc(x, y, z) {
    const group = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(22, 62, 8, 16),
      new THREE.MeshStandardMaterial({ color: 0x242d38, roughness: 0.75 })
    );
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(20, 20, 14),
      new THREE.MeshStandardMaterial({ color: 0xb98462, roughness: 0.7 })
    );
    head.position.y = 65;
    group.add(body, head);
    group.position.set(x, y, z);
    this.addHotspot(group, "npc", "工房の鍛冶師");
  }

  pick(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersections = this.raycaster.intersectObjects(this.hotspots, true);
    if (!intersections.length) return;

    let object = intersections[0].object;
    while (object && !object.userData.hotspot) object = object.parent;
    if (object?.userData.hotspot) this.onSelect(object.userData.hotspot);
  }

  resize() {
    const width = Math.max(300, this.container.clientWidth || 800);
    const height = Math.max(320, this.container.clientHeight || 520);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  resetView() {
    this.camera.position.set(390, 250, 510);
    this.controls.target.set(0, 70, 0);
    this.controls.update();
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
