export class ForgeSystem {
  constructor({
    types,
    rarities,
    normalizeShape,
    fingerprint,
    getState,
    saveState,
    getShape,
    getSelectedType,
    getRemaining,
    go,
    toast,
    getElement = (id) => document.getElementById(id)
  }) {
    this.types = types;
    this.rarities = rarities;
    this.normalizeShape = normalizeShape;
    this.fingerprint = fingerprint;

    this.getState = getState;
    this.saveState = saveState;
    this.getShape = getShape;
    this.getSelectedType = getSelectedType;
    this.getRemaining = getRemaining;

    this.go = go;
    this.toast = toast;
    this.$ = getElement;

    this.context = null;
    this.step = 0;
    this.quality = 50;

    this.stepNames = ["加熱", "鍛打", "成形", "焼入れ", "仕上げ", "完成"];
    this.stepTexts = [
      "素材を赤熱させます",
      "芯を鍛えます",
      "輪郭を整えます",
      "硬度を定着させます",
      "刃と刻印を仕上げます",
      "最後の一打を入れます"
    ];
  }

  rollRarity() {
    const roll = Math.random() * 100;
    let accumulated = 0;

    for (const rarity of this.rarities) {
      accumulated += Number(rarity.probability) || 0;
      if (roll < accumulated) return rarity;
    }

    return this.rarities.at(-1);
  }

  start() {
    const state = this.getState();

    if (this.getRemaining() <= 0) {
      this.toast("本日の鍛造回数を使い切りました");
      return false;
    }

    if (state.weapons.length >= 14) {
      this.toast("保管庫が満杯です");
      return false;
    }

    const selectedType = this.getSelectedType();
    const shape = this.getShape();

    this.context = {
      shape: this.normalizeShape({
        ...shape,
        weaponType: selectedType
      }),
      type: this.types[selectedType]
    };

    this.step = 0;
    this.quality = 50;

    this.go("process");
    this.renderProcess();
    return true;
  }

  renderProcess() {
    if (!this.context) return;

    const steps = this.$("steps");
    const processText = this.$("processText");
    const advanceButton = this.$("advanceForge");
    const processIcon = this.$("processIcon");
    const quality = this.$("quality");

    if (steps) {
      steps.innerHTML = this.stepNames
        .map(
          (name, index) =>
            `<div class="step ${index === this.step ? "active" : ""}">${name}</div>`
        )
        .join("");
    }

    if (processText) {
      processText.textContent = this.stepTexts[this.step];
    }

    if (advanceButton) {
      advanceButton.textContent =
        this.step === this.stepNames.length - 1
          ? "完成させる"
          : `${this.stepNames[this.step]}する`;
    }

    if (processIcon) {
      processIcon.textContent =
        this.step < 1
          ? "🔥"
          : this.step < 4
            ? this.context.type.icon
            : "✨";
    }

    if (quality) {
      quality.textContent = String(this.quality);
    }
  }

  advance() {
    if (!this.context) {
      this.toast("鍛造データがありません");
      return;
    }

    this.quality = Math.min(
      100,
      this.quality + Math.floor(Math.random() * 8) + 4
    );

    if (this.step < this.stepNames.length - 1) {
      this.step += 1;
      this.renderProcess();
      return;
    }

    const rarity = this.rollRarity();
    const state = this.getState();

    const weapon = {
      id: String(Date.now()),
      name:
        ["黒鉄", "灼熱", "蒼雷", "月影"][Math.floor(Math.random() * 4)] +
        "の" +
        this.context.type.name,
      type: this.context.type.name,
      icon: this.context.type.icon,
      rarity: rarity.name,
      color: rarity.color,
      attack: Math.round(
        (80 + Math.random() * 70) * rarity.multiplier
      ),
      quality: this.quality,
      shape: this.context.shape,
      shapeId: this.fingerprint(this.context.shape)
    };

    state.weapons.unshift(weapon);
    state.used += 1;

    this.saveState();
    this.showWeapon(weapon);
  }

  showWeapon(weapon) {
    const sheet = this.$("modalSheet");
    const modal = this.$("modal");

    if (!sheet || !modal) return;

    sheet.innerHTML = `
      <h2>${weapon.name}</h2>
      <div class="process-view">${weapon.icon}</div>
      <div class="row">
        <span>レアリティ</span>
        <b style="color:${weapon.color}">${weapon.rarity}</b>
      </div>
      <div class="row">
        <span>攻撃力</span>
        <b>${weapon.attack}</b>
      </div>
      <div class="row">
        <span>品質</span>
        <b>${weapon.quality}</b>
      </div>
      <div class="row">
        <span>形状ID</span>
        <b>${weapon.shapeId}</b>
      </div>
      <button class="primary mt12" id="closeModal">閉じる</button>
    `;

    modal.classList.add("show");

    const closeButton = this.$("closeModal");
    if (closeButton) {
      closeButton.onclick = () => modal.classList.remove("show");
    }
  }
}
