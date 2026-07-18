import { createWeaponMaterialProfile } from "../systems/MaterialEngine.js";
import {
  evaluateForgeOreEffects,
  adjustWeaponRarities
} from "../systems/OreGachaSystem.js";

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
    getForgeOres = () => [],
    validateForgeOres = () => true,
    consumeForgeOres = () => true,
    oreDefinitions = {},
    go,
    toast,
    getElement = (id) => document.getElementById(id),
    onForgeStep = () => {},
    onForgeComplete = () => {}
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
    this.getForgeOres = getForgeOres;
    this.validateForgeOres = validateForgeOres;
    this.consumeForgeOres = consumeForgeOres;
    this.oreDefinitions = oreDefinitions;

    this.go = go;
    this.toast = toast;
    this.$ = getElement;
    this.onForgeStep = onForgeStep;
    this.onForgeComplete = onForgeComplete;

    this.context = null;
    this.step = 0;
    this.quality = 50;
    this.completed = false;
    this.advancing = false;

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

  rollRarity(rarities = this.rarities) {
    const roll = Math.random() * 100;
    let accumulated = 0;

    for (const rarity of rarities) {
      accumulated += Number(rarity.probability) || 0;
      if (roll < accumulated) return rarity;
    }

    return rarities.at(-1);
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

    if (!this.validateForgeOres()) {
      this.toast("選択した鉱物の所持数が足りません");
      return false;
    }

    const selectedType = this.getSelectedType();
    const shape = this.getShape();
    const forgeOres = this.getForgeOres();

    this.context = {
      shape: this.normalizeShape({
        ...shape,
        weaponType: selectedType
      }),
      type: this.types[selectedType],
      forgeOres
    };

    this.step = 0;
    this.quality = 50;
    this.completed = false;
    this.advancing = false;

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
      advanceButton.textContent = this.completed
        ? "鍛造完了"
        : this.step === this.stepNames.length - 1
          ? "完成させる"
          : `${this.stepNames[this.step]}する`;

      advanceButton.disabled = this.completed || this.advancing;
      advanceButton.setAttribute(
        "aria-disabled",
        String(this.completed || this.advancing)
      );
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

    if (this.completed || this.advancing) {
      return;
    }

    this.advancing = true;
    this.renderProcess();

    try {
      this.onForgeStep(this.step, this.context);

      this.quality = Math.min(
        100,
        this.quality + Math.floor(Math.random() * 8) + 4
      );

      if (this.step < this.stepNames.length - 1) {
        this.step += 1;
        return;
      }

      const oreEffects = evaluateForgeOreEffects(
        this.context.forgeOres
      );
      const adjustedRarities = adjustWeaponRarities(
        this.rarities,
        oreEffects.rarityBoostPerTier
      );
      const rarity = this.rollRarity(adjustedRarities);
      const state = this.getState();

      if (this.getRemaining() <= 0) {
        this.toast("本日の鍛造回数を使い切りました");
        return;
      }

      if (state.weapons.length >= 14) {
        this.toast("保管庫が満杯です");
        return;
      }

      if (!this.validateForgeOres()) {
        this.toast("選択した鉱物の所持数が足りません");
        return;
      }

      if (!this.consumeForgeOres()) {
        this.toast("鉱物の消費に失敗しました");
        return;
      }

      const baseAttack =
        (80 + Math.random() * 70) * rarity.multiplier;
      const attackAfterFlat =
        baseAttack + oreEffects.flatAttack;
      const finalAttack =
        attackAfterFlat *
        (1 + oreEffects.percentAttack / 100);

      const materialProfile = createWeaponMaterialProfile(
        this.context.forgeOres.map((oreId) => {
          const ore = this.oreDefinitions[oreId];
          return ore ? {
            name: ore.name,
            rarity: ore.rarity
          } : null;
        }).filter(Boolean)
      );

      const weapon = {
        id: `${Date.now()}-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`,
        name:
          ["黒鉄", "灼熱", "蒼雷", "月影"][Math.floor(Math.random() * 4)] +
          "の" +
          this.context.type.name,
        type: this.context.type.name,
        icon: this.context.type.icon,
        rarity: rarity.name,
        color: rarity.color,
        attack: Math.round(finalAttack * 100) / 100,
        baseAttack: Math.round(baseAttack * 100) / 100,
        oreEffects,
        materialProfile,
        forgeOres: this.context.forgeOres.map((oreId) => {
          const ore = this.oreDefinitions[oreId];
          return ore ? {
            id: ore.id,
            name: ore.name,
            rarity: ore.rarity
          } : null;
        }).filter(Boolean),
        quality: this.quality,
        shape: structuredClone(this.context.shape),
        shapeId: this.fingerprint(this.context.shape),
        forgedAt: new Date().toISOString()
      };

      state.weapons.unshift(weapon);
      state.used += 1;

      this.completed = true;
      this.saveState();
      this.onForgeComplete(weapon);
      this.showWeapon(weapon);
    } finally {
      this.advancing = false;
      this.renderProcess();
    }
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
        <span>基本攻撃力</span>
        <b>${weapon.baseAttack ?? weapon.attack}</b>
      </div>
      <div class="row">
        <span>最終攻撃力</span>
        <b>${weapon.attack}</b>
      </div>
      <div class="row">
        <span>品質</span>
        <b>${weapon.quality}</b>
      </div>
      <div class="row">
        <span>使用鉱物</span>
        <b>${weapon.forgeOres.length
          ? weapon.forgeOres.map((ore) => ore.name).join(" / ")
          : "デフォルト（コモン）"
        }</b>
      </div>
      <div class="row">
        <span>鉱物効果</span>
        <b>${weapon.oreEffects.activations.length
          ? weapon.oreEffects.activations.map((effect) =>
              effect.type === "percentAttack"
                ? `${effect.oreName} 攻撃+${effect.value}%`
                : effect.type === "rarityBoost"
                  ? `${effect.oreName} 上位確率+${effect.value}%`
                  : `${effect.oreName} 攻撃+${effect.value}`
            ).join("<br>")
          : "発動なし"
        }</b>
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
