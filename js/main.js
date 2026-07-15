import { TYPES, RARITIES, DIFFICULTIES, BACKGROUNDS } from './systems.js';
import {
  DEFAULT_SHAPE,
  cloneShape,
  normalizeShape,
  shapeFingerprint
} from './shapeModel.js';

const STORAGE_KEY = 'blacksmith_repo_v060';
const DEFAULT_STATE = {
  used: 0,
  day: '',
  weapons: [],
  blueprints: [],
  backgrounds: [],
  explore: null,
  rank: 'F'
};

const $ = (id) => document.getElementById(id);

let state = loadState();
let selectedType = 0;
let blueprintType = 0;
let forgeContext = null;
let forgeStep = 0;
let quality = 50;
let selectedDifficulty = 0;
let currentShape = cloneShape(DEFAULT_SHAPE);

let draggedPointIndex = null;
let draggedHandle = null;
let selectedPointIndex = 0;

const STEP_NAMES = ['加熱', '鍛打', '成形', '焼入れ', '仕上げ', '完成'];

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const loaded = { ...DEFAULT_STATE, ...parsed };

    loaded.weapons = Array.isArray(loaded.weapons) ? loaded.weapons : [];
    loaded.backgrounds = Array.isArray(loaded.backgrounds) ? loaded.backgrounds : [];
    loaded.blueprints = Array.isArray(loaded.blueprints)
      ? loaded.blueprints.map((blueprint) => ({
          ...blueprint,
          shape: normalizeShape(
            blueprint.shape || { weaponType: Number(blueprint.type) || 0 }
          )
        }))
      : [];

    return loaded;
  } catch (error) {
    console.warn('セーブデータを読み込めなかったため初期化しました。', error);
    return { ...DEFAULT_STATE };
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('セーブに失敗しました。', error);
    showToast('セーブに失敗しました');
  }
  renderAll();
}

function dayKey() {
  const date = new Date();
  if (date.getHours() < 5) date.setDate(date.getDate() - 1);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function resetDailySafe() {
  const key = dayKey();
  if (state.day !== key) {
    state.day = key;
    state.used = 0;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn('日次更新の保存に失敗しました。', error);
    }
  }
}

function maxForges() {
  const rankBonus = ['SS', 'SSS', 'BLACK Smith'].includes(state.rank) ? 1 : 0;
  const blackSmithBonus = state.rank === 'BLACK Smith' ? 1 : 0;
  return 3 + rankBonus + blackSmithBonus;
}

function remainingForges() {
  return Math.max(0, maxForges() - state.used);
}

function showToast(message) {
  const element = $('toast');
  if (!element) return;
  element.textContent = message;
  element.classList.add('show');
  window.setTimeout(() => element.classList.remove('show'), 1700);
}

function go(page) {
  resetDailySafe();

  document.querySelectorAll('.screen').forEach((screen) => {
    screen.classList.remove('active');
  });

  const target = $(page);
  if (!target) {
    console.error(`画面 ${page} が見つかりません。`);
    return;
  }

  target.classList.add('active');

  document.querySelectorAll('.nav button').forEach((button) => {
    button.classList.toggle('active', button.dataset.page === page);
  });

  renderAll();
  window.scrollTo(0, 0);
}

function enterGame() {
  const nav = $('nav');
  if (nav) nav.style.display = 'grid';
  go('home');
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rollRarity() {
  let roll = Math.random() * 100;
  let total = 0;

  for (const rarity of RARITIES) {
    total += Number(rarity.probability) || 0;
    if (roll < total) return rarity;
  }

  return RARITIES.at(-1);
}

function rollBackground() {
  const roll = Math.random() * 100;
  let total = 0;

  for (const background of BACKGROUNDS) {
    total += Number(background.probability) || 0;
    if (roll < total) return background.name;
  }

  return null;
}

function rollSkill(type) {
  const roll = Math.random() * 100;

  if (roll >= 5) return { tier: 'ノースキル', atk: 0, agi: 0, active: null };

  const atk =
    roll < 0.5
      ? randomInt(100, 150)
      : roll < 1
        ? randomInt(80, 150)
        : randomInt(10, 150);

  const agi = roll < 0.5 ? randomInt(20, 50) : 0;
  let active = null;

  if (roll < 0.5 && Math.random() < 0.5) {
    const pool = ['ソウルインジェクション', '神殺し'];
    const specific = {
      ナックル: 'ヴェノムスプラッシュ',
      ハンマー: 'グラビティプレス',
      斧: 'グラビティプレス',
      大剣: 'レイジングスラッシュ',
      双剣: 'シャドウスタブ',
      ダガー: 'シャドウスタブ',
      槍: 'スパイラルランス'
    }[type];

    if (specific) pool.push(specific);
    active = pool[randomInt(0, pool.length - 1)];
  }

  return {
    tier:
      roll < 0.01
        ? '神域'
        : roll < 0.5
          ? '超希少'
          : roll < 1
            ? '希少'
            : '付与',
    atk,
    agi,
    active
  };
}

function createWeapon(type, source, shape) {
  const rarity = rollRarity();
  const cursed =
    ['F', 'E', 'D', 'C', 'B'].includes(state.rank) && Math.random() < 0.05;
  const transcended = Math.random() < 0.01;

  let name =
    ['黒鉄', '灼熱', '蒼雷', '月影', '星喰', '歪曲'][randomInt(0, 5)] +
    'の' +
    type.name;

  if (cursed) name = `呪われた${name}`;
  if (transcended) name = `超越した${name}`;

  const background = rollBackground();
  if (background && !state.backgrounds.includes(background)) {
    state.backgrounds.push(background);
  }

  const penalty = cursed ? 0.8 : 1;
  const boost = transcended ? 1.1 : 1;

  return {
    id: String(Date.now() + Math.random()),
    name,
    type: type.name,
    icon: type.icon,
    rarity: rarity.name,
    color: rarity.color,
    attack: Math.round(
      randomInt(80, 150) * rarity.multiplier * penalty * boost
    ),
    agility: Math.round(randomInt(20, 60) * penalty * boost),
    skill: rollSkill(type.name),
    background,
    source,
    shape: normalizeShape(shape),
    shapeFingerprint: shapeFingerprint(shape),
    quality,
    code:
      'BS-' +
      Math.random().toString(36).slice(2, 6).toUpperCase() +
      '-' +
      Math.random().toString(36).slice(2, 8).toUpperCase()
  };
}

function renderTypes() {
  const typeGrid = $('typeGrid');
  const blueprintGrid = $('bpTypeGrid');

  if (typeGrid) {
    typeGrid.innerHTML = TYPES.map(
      (type, index) => `
        <button class="choice ${index === selectedType ? 'active' : ''}"
          data-type="${index}" data-mode="forge">
          ${type.icon}<br><small>${type.name}</small>
        </button>`
    ).join('');
  }

  if (blueprintGrid) {
    blueprintGrid.innerHTML = TYPES.map(
      (type, index) => `
        <button class="choice ${index === blueprintType ? 'active' : ''}"
          data-type="${index}" data-mode="blueprint">
          ${type.icon}<br><small>${type.name}</small>
        </button>`
    ).join('');
  }

  if ($('typeLabel')) $('typeLabel').textContent = TYPES[selectedType].name;
  if ($('bpTypeLabel')) $('bpTypeLabel').textContent = TYPES[blueprintType].name;
}

function renderSharedShapeControls() {
  const host = $('sharedShapeControls');
  if (!host) return;

  const controls = [
    ['length', '長さ', 20, 100],
    ['width', '幅', 10, 100],
    ['thickness', '厚み', 5, 100],
    ['curve', '反り', 0, 100],
    ['twist', 'ねじれ', -50, 50],
    ['tip', '刃先', 0, 100],
    ['notch', '切れ込み', 0, 100],
    ['ornament', '装飾', 0, 100]
  ];

  host.innerHTML = `
    <div class="shape-grid">
      ${controls
        .map(
          ([key, label, min, max]) => `
            <div class="shape-control">
              <label><span>${label}</span><b>${Math.round(currentShape[key])}</b></label>
              <input type="range" min="${min}" max="${max}"
                value="${currentShape[key]}" data-shape-key="${key}">
            </div>`
        )
        .join('')}
    </div>
    <div class="control material-row">
      <select id="shapeMaterial">
        ${['黒鉄', '鋼', '炎鋼', '氷晶鋼', '雷鋼', 'ミスリル', '黒曜石']
          .map(
            (material) =>
              `<option ${currentShape.material === material ? 'selected' : ''}>${material}</option>`
          )
          .join('')}
      </select>
      <input id="shapeColor" type="color" value="${currentShape.color}">
    </div>`;
}

function cubicBezier(p0, p1, p2, p3, t) {
  const u = 1 - t;
  return {
    x:
      u * u * u * p0.x +
      3 * u * u * t * p1.x +
      3 * u * t * t * p2.x +
      t * t * t * p3.x,
    y:
      u * u * u * p0.y +
      3 * u * u * t * p1.y +
      3 * u * t * t * p2.y +
      t * t * t * p3.y
  };
}

function sampleBezierCenterline(shape) {
  const startX = 110;
  const usableX = 760;
  const startY = 55;
  const usableY = 250;

  const anchors = shape.points.map((point, index) => ({
    index,
    x: startX + point.x * usableX,
    y: startY + point.y * usableY,
    inX: startX + (point.x + point.inX) * usableX,
    inY: startY + (point.y + point.inY) * usableY,
    outX: startX + (point.x + point.outX) * usableX,
    outY: startY + (point.y + point.outY) * usableY
  }));

  const samples = [];

  for (let index = 0; index < anchors.length - 1; index += 1) {
    const start = anchors[index];
    const end = anchors[index + 1];

    for (let stepIndex = 0; stepIndex < 18; stepIndex += 1) {
      const t = stepIndex / 18;
      samples.push(
        cubicBezier(
          { x: start.x, y: start.y },
          { x: start.outX, y: start.outY },
          { x: end.inX, y: end.inY },
          { x: end.x, y: end.y },
          t
        )
      );
    }
  }

  const last = anchors.at(-1);
  samples.push({ x: last.x, y: last.y });

  return { anchors, samples };
}

function drawShape(svg, shapeInput) {
  if (!svg) return;

  const shape = normalizeShape(shapeInput);
  const type = TYPES[shape.weaponType] || TYPES[0];
  const { anchors, samples } = sampleBezierCenterline(shape);
  const baseWidth = 24 + shape.width * 0.72;

  const top = [];
  const bottom = [];

  samples.forEach((sample, index) => {
    const before = samples[Math.max(0, index - 1)];
    const after = samples[Math.min(samples.length - 1, index + 1)];
    const dx = after.x - before.x;
    const dy = after.y - before.y;
    const length = Math.hypot(dx, dy) || 1;
    const normalX = -dy / length;
    const normalY = dx / length;
    const taper =
      1 -
      (index / Math.max(1, samples.length - 1)) *
        Math.min(0.62, shape.tip / 145);
    const wave =
      Math.sin(
        (index / Math.max(1, samples.length - 1)) * Math.PI * 4
      ) *
      (shape.curve - 50) *
      0.08;
    const half = Math.max(3, (baseWidth * taper) / 2 + wave);

    top.push({
      x: sample.x + normalX * half,
      y: sample.y + normalY * half
    });
    bottom.push({
      x: sample.x - normalX * half,
      y: sample.y - normalY * half
    });
  });

  const tipBase = samples.at(-1);
  const previous = samples.at(-2) || tipBase;
  const tipDx = tipBase.x - previous.x;
  const tipDy = tipBase.y - previous.y;
  const tipDirectionLength = Math.hypot(tipDx, tipDy) || 1;
  const tipLength = 22 + shape.tip * 0.65;
  const tip = {
    x: tipBase.x + (tipDx / tipDirectionLength) * tipLength,
    y: tipBase.y + (tipDy / tipDirectionLength) * tipLength
  };

  const bladePath = [
    `M ${top[0].x} ${top[0].y}`,
    ...top.slice(1).map((point) => `L ${point.x} ${point.y}`),
    `L ${tip.x} ${tip.y}`,
    ...bottom.reverse().map((point) => `L ${point.x} ${point.y}`),
    'Z'
  ].join(' ');

  const notchIndex = Math.floor(samples.length * 0.62);
  const notchPoint = samples[notchIndex];
  const notchDepth = shape.notch * 0.28;
  const selected =
    Number.isInteger(selectedPointIndex) ? selectedPointIndex : -1;

  svg.innerHTML = `
    <defs>
      <linearGradient id="metal-${svg.id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffffff"/>
        <stop offset=".28" stop-color="${shape.color}"/>
        <stop offset=".68" stop-color="#6d7380"/>
        <stop offset="1" stop-color="#232832"/>
      </linearGradient>
    </defs>
    ${[1, 2, 3, 4, 5, 6, 7, 8, 9]
      .map(
        (index) =>
          `<line class="shape-grid-line" x1="${index * 100}" y1="0"
            x2="${index * 100}" y2="360"/>`
      )
      .join('')}
    ${[1, 2, 3]
      .map(
        (index) =>
          `<line class="shape-grid-line" x1="0" y1="${index * 90}"
            x2="1000" y2="${index * 90}"/>`
      )
      .join('')}
    <path d="${bladePath}" fill="url(#metal-${svg.id})"
      stroke="#f1d08a" stroke-width="${1 + shape.thickness / 35}"/>
    ${
      shape.notch > 3
        ? `<path d="M ${notchPoint.x} ${notchPoint.y - baseWidth * 0.35}
          l ${notchDepth} ${baseWidth * 0.32}
          l ${notchDepth} ${-baseWidth * 0.38}"
          fill="none" stroke="#10141c"
          stroke-width="${5 + shape.thickness / 18}"/>`
        : ''
    }
    <rect x="5" y="162" width="95" height="36" rx="10" fill="#40292a"/>
    <rect x="90" y="132" width="24" height="96" rx="8" fill="#ad7434"/>
    <circle cx="108" cy="180" r="${14 + shape.ornament / 10}"
      fill="none" stroke="#e6b85e" stroke-width="4"/>
    ${anchors
      .map(
        (anchor) => `
        <line class="bezier-handle-line" x1="${anchor.x}" y1="${anchor.y}"
          x2="${anchor.inX}" y2="${anchor.inY}"/>
        <line class="bezier-handle-line" x1="${anchor.x}" y1="${anchor.y}"
          x2="${anchor.outX}" y2="${anchor.outY}"/>
        <circle class="bezier-handle" data-handle="in"
          data-point-index="${anchor.index}" cx="${anchor.inX}"
          cy="${anchor.inY}" r="7" fill="#e6b85e"
          stroke="#171b24" stroke-width="3"/>
        <circle class="bezier-handle" data-handle="out"
          data-point-index="${anchor.index}" cx="${anchor.outX}"
          cy="${anchor.outY}" r="7" fill="#e6b85e"
          stroke="#171b24" stroke-width="3"/>
        <circle class="control-point ${anchor.index === selected ? 'selected' : ''}"
          data-point-index="${anchor.index}" cx="${anchor.x}"
          cy="${anchor.y}" r="10" fill="#f7f8fa"
          stroke="#171b24" stroke-width="4"/>`
      )
      .join('')}
    <text x="28" y="38" fill="#e6b85e" font-size="22">${type.name}</text>
    <text x="28" y="326" fill="#9aa4b4" font-size="17">${shapeFingerprint(shape)}</text>`;
}

function updatePreview() {
  currentShape.weaponType = selectedType;
  renderSharedShapeControls();
  drawShape($('forgeShapeSvg'), currentShape);

  const blueprintShape = normalizeShape({
    ...currentShape,
    weaponType: blueprintType
  });
  drawShape($('bpShapeSvg'), blueprintShape);

  if ($('forgePreview')) $('forgePreview').textContent = TYPES[selectedType].icon;
  if ($('bpPreview')) $('bpPreview').textContent = TYPES[blueprintType].icon;
}

function saveBlueprint() {
  const shape = normalizeShape({
    ...currentShape,
    weaponType: blueprintType
  });

  state.blueprints.unshift({
    id: String(Date.now() + Math.random()),
    name: $('bpName')?.value?.trim() || '無銘の設計図',
    type: blueprintType,
    shape,
    fingerprint: shapeFingerprint(shape),
    version: 2,
    createdAt: new Date().toISOString()
  });

  saveState();
  showToast('形状データ付き設計図を保存しました');
}

function loadBlueprint(index) {
  const blueprint = state.blueprints[index];
  if (!blueprint) return;

  currentShape = normalizeShape(
    blueprint.shape || { weaponType: blueprint.type }
  );
  selectedType = currentShape.weaponType;
  blueprintType = currentShape.weaponType;

  if ($('bpName')) $('bpName').value = blueprint.name;

  renderTypes();
  updatePreview();
  showToast(`設計図「${blueprint.name}」を読み込みました`);
}

function startForge(source) {
  if (remainingForges() <= 0) {
    showToast('本日の鍛造回数を使い切りました');
    return;
  }

  if (state.weapons.length >= 14) {
    showToast('保管庫が満杯です');
    return;
  }

  const typeIndex =
    source === '設計図鍛造' ? blueprintType : selectedType;

  forgeContext = {
    source,
    type: typeIndex,
    shape: normalizeShape({
      ...currentShape,
      weaponType: typeIndex
    })
  };

  forgeStep = 0;
  quality = 50;
  go('process');
}

function renderProcess() {
  if (!forgeContext) return;

  if ($('steps')) {
    $('steps').innerHTML = STEP_NAMES.map(
      (name, index) =>
        `<div class="step ${index === forgeStep ? 'active' : ''}">${name}</div>`
    ).join('');
  }

  const descriptions = [
    '素材を赤熱させます',
    '芯を鍛えます',
    '輪郭を整えます',
    '硬度を定着させます',
    '刃と刻印を仕上げます',
    '最後の一打を入れます'
  ];

  if ($('processText')) $('processText').textContent = descriptions[forgeStep];
  if ($('processBtn')) {
    $('processBtn').textContent =
      forgeStep === 5 ? '完成させる' : `${STEP_NAMES[forgeStep]}する`;
  }
  if ($('processIcon')) {
    $('processIcon').textContent =
      forgeStep < 1
        ? '🔥'
        : forgeStep < 4
          ? TYPES[forgeContext.type].icon
          : '✨';
  }
  if ($('quality')) $('quality').textContent = quality;
}

function advanceForge() {
  if (!forgeContext) return;

  quality = Math.min(100, quality + randomInt(4, 11));

  if (forgeStep < 5) {
    forgeStep += 1;
    renderProcess();
    return;
  }

  const weapon = createWeapon(
    TYPES[forgeContext.type],
    forgeContext.source,
    forgeContext.shape
  );

  state.weapons.unshift(weapon);
  state.used += 1;
  saveState();
  showWeapon(weapon);
}

function showWeapon(weapon) {
  const sheet = $('sheet');
  if (!sheet) return;

  sheet.innerHTML = `
    <h3 style="text-align:center">鍛造完了</h3>
    <div class="preview"><div class="bigWeapon">${weapon.icon}</div></div>
    <div style="text-align:center">
      <span class="badge" style="color:${weapon.color}">${weapon.rarity}</span>
      <h2>${weapon.name}</h2>
      ${
        weapon.background
          ? `<p style="color:#d9a8ff">特殊背景：${weapon.background}</p>`
          : ''
      }
    </div>
    <div class="row"><span>攻撃力</span><b>${weapon.attack}</b></div>
    <div class="row"><span>俊敏</span><b>${weapon.agility}</b></div>
    <div class="row"><span>品質</span><b>${weapon.quality}</b></div>
    <div class="row"><span>形状ID</span><b>${weapon.shapeFingerprint}</b></div>
    <div class="row"><span>スキル</span><b>${weapon.skill.tier}</b></div>
    ${
      weapon.skill.atk
        ? `<div class="row"><span>攻撃補正</span><b>+${weapon.skill.atk}%</b></div>`
        : ''
    }
    ${
      weapon.skill.agi
        ? `<div class="row"><span>俊敏補正</span><b>+${weapon.skill.agi}%</b></div>`
        : ''
    }
    ${
      weapon.skill.active
        ? `<div class="row"><span>アクティブ</span><b>${weapon.skill.active}</b></div>`
        : ''
    }
    <button class="primary mt12" data-close-modal>保管庫へ</button>`;

  $('modal')?.classList.add('show');
}

function renderInventory() {
  if ($('invCount')) $('invCount').textContent = state.weapons.length;
  if (!$('inventoryGrid')) return;

  $('inventoryGrid').innerHTML =
    state.weapons
      .map(
        (weapon, index) => `
          <button class="weaponCard" data-weapon-index="${index}">
            <span class="badge" style="color:${weapon.color}">${weapon.rarity}</span>
            <div class="icon">${weapon.icon}</div>
            <b>${weapon.name}</b>
            <small class="muted">${weapon.type}</small>
          </button>`
      )
      .join('') || '<div class="muted">まだ武器がありません</div>';
}

function renderExplore() {
  if (!$('exploreOptions')) return;

  $('exploreOptions').innerHTML = DIFFICULTIES.map(
    (difficulty, index) => `
      <div class="explore ${index === selectedDifficulty ? 'active' : ''}"
        data-diff="${index}">
        <b>${difficulty.name}</b>
        <span style="float:right">
          ${Math.round((difficulty.durationMs / 60000) * 10) / 10}分
        </span>
      </div>`
  ).join('');

  if (state.explore) {
    $('exploreOptions').style.display = 'none';
    if ($('exploreBtn')) $('exploreBtn').style.display = 'none';
    $('running')?.classList.remove('hidden');

    const now = Date.now();
    const done = now >= state.explore.end;
    const left = Math.max(0, state.explore.end - now);
    const total = state.explore.end - state.explore.start;

    if ($('runningLabel')) {
      $('runningLabel').textContent = done
        ? '探索から帰還しました'
        : `残り ${Math.ceil(left / 1000)}秒`;
    }

    if ($('progress')) {
      $('progress').style.width =
        `${done ? 100 : (1 - left / total) * 100}%`;
    }

    if ($('exploreStatus')) {
      $('exploreStatus').textContent = done ? '帰還済み' : '探索中';
    }
  } else {
    $('exploreOptions').style.display = 'block';
    if ($('exploreBtn')) $('exploreBtn').style.display = 'block';
    $('running')?.classList.add('hidden');
    if ($('exploreStatus')) $('exploreStatus').textContent = '待機中';
  }
}

function startExplore() {
  if (state.explore) {
    showToast('すでに探索中です');
    return;
  }

  const difficulty = DIFFICULTIES[selectedDifficulty];
  const now = Date.now();

  state.explore = {
    start: now,
    end: now + difficulty.durationMs,
    min: difficulty.rewardMin,
    max: difficulty.rewardMax
  };

  saveState();
}

function claimExplore() {
  if (!state.explore) return;

  if (Date.now() < state.explore.end) {
    showToast('まだ探索中です');
    return;
  }

  const amount = randomInt(state.explore.min, state.explore.max);
  state.explore = null;
  saveState();
  showToast(`鉱石を${amount}個獲得しました`);
}

function renderAll() {
  resetDailySafe();

  if ($('remainTop')) {
    $('remainTop').textContent = `${remainingForges()}/${maxForges()}`;
  }
  if ($('remainForge')) {
    $('remainForge').textContent = `${remainingForges()}/${maxForges()}`;
  }
  if ($('heroWeapon')) {
    $('heroWeapon').textContent = state.weapons[0]?.icon || '⚔️';
  }
  if ($('bpCount')) {
    $('bpCount').textContent = state.blueprints.length;
  }
  if ($('bpList')) {
    $('bpList').innerHTML = state.blueprints
      .map(
        (blueprint, index) => `
          <button class="card menu" data-blueprint-index="${index}">
            <span>📐</span>
            <span>
              <b>${blueprint.name}</b>
              <small>
                ${TYPES[blueprint.type]?.name || '不明'} /
                ${blueprint.fingerprint || shapeFingerprint(blueprint.shape)}
              </small>
            </span>
            <span>読込</span>
          </button>`
      )
      .join('');
  }
  if ($('bgCount')) {
    $('bgCount').textContent = state.backgrounds.length;
  }
  if ($('bgGrid')) {
    $('bgGrid').innerHTML = BACKGROUNDS.map(
      (background) => `
        <div class="weaponCard">
          <b>
            ${state.backgrounds.includes(background.name) ? background.name : '？？？？'}
          </b>
        </div>`
    ).join('');
  }

  renderTypes();
  updatePreview();
  renderInventory();
  renderExplore();

  if ($('process')?.classList.contains('active')) {
    renderProcess();
  }
}

function svgPointFromEvent(svg, event) {
  const point = svg.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;

  const matrix = svg.getScreenCTM();
  if (!matrix) return { x: 0, y: 0 };

  return point.matrixTransform(matrix.inverse());
}

function updateDraggedElement(svg, event) {
  if (draggedPointIndex === null) return;

  const local = svgPointFromEvent(svg, event);
  const point = currentShape.points[draggedPointIndex];
  if (!point) return;

  if (draggedHandle) {
    const handleX = Math.max(
      -0.35,
      Math.min(0.35, (local.x - 110) / 760 - point.x)
    );
    const handleY = Math.max(
      -0.35,
      Math.min(0.35, (local.y - 55) / 250 - point.y)
    );

    point[`${draggedHandle}X`] = handleX;
    point[`${draggedHandle}Y`] = handleY;

    if (point.smooth) {
      const opposite = draggedHandle === 'in' ? 'out' : 'in';
      const oppositeLength =
        Math.hypot(point[`${opposite}X`], point[`${opposite}Y`]) ||
        Math.hypot(handleX, handleY);
      const length = Math.hypot(handleX, handleY) || 1;

      point[`${opposite}X`] = (-handleX / length) * oppositeLength;
      point[`${opposite}Y`] = (-handleY / length) * oppositeLength;
    }
  } else {
    point.x = Math.max(0.02, Math.min(0.98, (local.x - 110) / 760));
    point.y = Math.max(0.05, Math.min(0.95, (local.y - 55) / 250));

    currentShape.points.sort((a, b) => a.x - b.x);
    draggedPointIndex = currentShape.points.indexOf(point);
    selectedPointIndex = draggedPointIndex;
  }

  updatePreview();
}

function addControlPoint() {
  if (currentShape.points.length >= 12) {
    showToast('制御点は最大12個です');
    return;
  }

  const points = [...currentShape.points].sort((a, b) => a.x - b.x);
  let bestIndex = 0;
  let bestGap = -1;

  for (let index = 0; index < points.length - 1; index += 1) {
    const gap = points[index + 1].x - points[index].x;
    if (gap > bestGap) {
      bestGap = gap;
      bestIndex = index;
    }
  }

  const start = points[bestIndex];
  const end = points[bestIndex + 1];

  points.splice(bestIndex + 1, 0, {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2,
    inX: -Math.max(0.035, (end.x - start.x) * 0.18),
    inY: 0,
    outX: Math.max(0.035, (end.x - start.x) * 0.18),
    outY: 0,
    smooth: true
  });

  currentShape.points = points;
  selectedPointIndex = bestIndex + 1;
  updatePreview();
  showToast('制御点を追加しました');
}

function removeControlPoint() {
  if (currentShape.points.length <= 2) {
    showToast('制御点は最低2個必要です');
    return;
  }

  currentShape.points.splice(selectedPointIndex, 1);
  selectedPointIndex = Math.max(
    0,
    Math.min(selectedPointIndex, currentShape.points.length - 1)
  );
  updatePreview();
  showToast('選択した制御点を削除しました');
}

function mirrorShape() {
  currentShape.points = currentShape.points
    .map((point) => ({
      ...point,
      x: 1 - point.x,
      inX: -point.outX,
      inY: point.outY,
      outX: -point.inX,
      outY: point.inY
    }))
    .sort((a, b) => a.x - b.x);

  currentShape.twist *= -1;
  updatePreview();
  showToast('形状を左右反転しました');
}

function resetCurrentShape() {
  const weaponType = selectedType;
  currentShape = cloneShape(DEFAULT_SHAPE);
  currentShape.weaponType = weaponType;
  selectedPointIndex = 0;
  updatePreview();
  showToast('形状を初期状態へ戻しました');
}

function smoothSelectedPoint() {
  const point = currentShape.points[selectedPointIndex];
  if (!point) {
    showToast('先に白い頂点を選択してください');
    return;
  }

  point.smooth = true;

  const outLength = Math.hypot(point.outX, point.outY) || 0.08;
  const inLength = Math.hypot(point.inX, point.inY) || 0.08;
  const angle = Math.atan2(point.outY, point.outX);

  point.outX = Math.cos(angle) * outLength;
  point.outY = Math.sin(angle) * outLength;
  point.inX = -Math.cos(angle) * inLength;
  point.inY = -Math.sin(angle) * inLength;

  updatePreview();
  showToast('選択点を滑らかな曲線にしました');
}

function cornerSelectedPoint() {
  const point = currentShape.points[selectedPointIndex];
  if (!point) {
    showToast('先に白い頂点を選択してください');
    return;
  }

  point.smooth = false;
  updatePreview();
  showToast('選択点を角として独立編集できます');
}

function bindShapeEditor(svg) {
  if (!svg) return;

  svg.addEventListener('pointerdown', (event) => {
    const handle = event.target.closest?.('[data-handle]');
    const anchor = event.target.closest?.('.control-point');
    const target = handle || anchor;

    if (!target) return;

    draggedPointIndex = Number(target.dataset.pointIndex);
    selectedPointIndex = draggedPointIndex;
    draggedHandle = handle?.dataset.handle || null;

    svg.setPointerCapture?.(event.pointerId);
    updatePreview();
    event.preventDefault();
  });

  svg.addEventListener('pointermove', (event) => {
    if (draggedPointIndex === null) return;
    updateDraggedElement(svg, event);
    event.preventDefault();
  });

  const stopDragging = () => {
    draggedPointIndex = null;
    draggedHandle = null;
  };

  svg.addEventListener('pointerup', stopDragging);
  svg.addEventListener('pointercancel', stopDragging);
}

function bindEvents() {
  document.addEventListener('click', (event) => {
    const goButton = event.target.closest('[data-go]');
    if (goButton) go(goButton.dataset.go);

    const navButton = event.target.closest('[data-page]');
    if (navButton) go(navButton.dataset.page);

    const typeButton = event.target.closest('[data-type]');
    if (typeButton) {
      if (typeButton.dataset.mode === 'forge') {
        selectedType = Number(typeButton.dataset.type);
        currentShape.weaponType = selectedType;
      } else {
        blueprintType = Number(typeButton.dataset.type);
      }
      renderTypes();
      updatePreview();
    }

    const difficultyButton = event.target.closest('[data-diff]');
    if (difficultyButton) {
      selectedDifficulty = Number(difficultyButton.dataset.diff);
      renderExplore();
    }

    const weaponButton = event.target.closest('[data-weapon-index]');
    if (weaponButton) {
      showWeapon(state.weapons[Number(weaponButton.dataset.weaponIndex)]);
    }

    const blueprintButton = event.target.closest('[data-blueprint-index]');
    if (blueprintButton) {
      loadBlueprint(Number(blueprintButton.dataset.blueprintIndex));
    }

    if (event.target.closest('[data-close-modal]')) {
      $('modal')?.classList.remove('show');
      go('inventory');
    }

    if (event.target === $('modal')) {
      $('modal').classList.remove('show');
    }
  });

  document.addEventListener('input', (event) => {
    const key = event.target.dataset?.shapeKey;

    if (key) {
      currentShape[key] = Number(event.target.value);
      updatePreview();
    }

    if (event.target.id === 'shapeMaterial') {
      currentShape.material = event.target.value;
      updatePreview();
    }

    if (event.target.id === 'shapeColor') {
      currentShape.color = event.target.value;
      updatePreview();
    }
  });

  document.querySelector('[data-action="enter"]')?.addEventListener('click', enterGame);
  document.querySelector('[data-action="save-blueprint"]')?.addEventListener('click', saveBlueprint);

  document
    .querySelector('[data-action="save-current-blueprint"]')
    ?.addEventListener('click', () => {
      blueprintType = selectedType;
      if ($('bpName')) $('bpName').value = `${TYPES[selectedType].name}設計図`;
      saveBlueprint();
    });

  document.querySelector('[data-action="add-point"]')?.addEventListener('click', addControlPoint);
  document.querySelector('[data-action="remove-point"]')?.addEventListener('click', removeControlPoint);
  document.querySelector('[data-action="mirror-shape"]')?.addEventListener('click', mirrorShape);
  document.querySelector('[data-action="reset-shape"]')?.addEventListener('click', resetCurrentShape);
  document.querySelector('[data-action="smooth-point"]')?.addEventListener('click', smoothSelectedPoint);
  document.querySelector('[data-action="corner-point"]')?.addEventListener('click', cornerSelectedPoint);

  document
    .querySelector('[data-action="start-free-forge"]')
    ?.addEventListener('click', () => startForge('自由鍛造'));

  document
    .querySelector('[data-action="start-blueprint-forge"]')
    ?.addEventListener('click', () => startForge('設計図鍛造'));

  document.querySelector('[data-action="advance-forge"]')?.addEventListener('click', advanceForge);
  document.querySelector('[data-action="start-explore"]')?.addEventListener('click', startExplore);
  document.querySelector('[data-action="claim-explore"]')?.addEventListener('click', claimExplore);

  bindShapeEditor($('forgeShapeSvg'));
  bindShapeEditor($('bpShapeSvg'));
}

function initialize() {
  resetDailySafe();
  bindEvents();
  renderAll();

  window.setInterval(() => {
    if ($('explore')?.classList.contains('active')) {
      renderExplore();
    }
  }, 1000);
}

initialize();
