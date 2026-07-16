export const ORE_INVENTORY_SIZE = 64;
export const ORE_STACK_LIMIT = 10;

export const ORE_DEFINITIONS = {
  iron: { id: "iron", name: "鉄鉱石", icon: "🪨", rarity: "COMMON", color: "#b8bcc4" },
  coal: { id: "coal", name: "石炭", icon: "⚫", rarity: "COMMON", color: "#717784" },
  copper: { id: "copper", name: "銅鉱石", icon: "🟤", rarity: "COMMON", color: "#c47b4f" },
  silver: { id: "silver", name: "銀鉱石", icon: "◻️", rarity: "UNCOMMON", color: "#dce4ef" },
  gold: { id: "gold", name: "金鉱石", icon: "🟡", rarity: "RARE", color: "#e8bd50" },
  mithril: { id: "mithril", name: "ミスリル鉱石", icon: "🔷", rarity: "EPIC", color: "#70baff" },
  fire: { id: "fire", name: "炎晶鉱", icon: "🔥", rarity: "EPIC", color: "#ff7259" },
  ice: { id: "ice", name: "氷晶鉱", icon: "❄️", rarity: "EPIC", color: "#84d7ff" },
  thunder: { id: "thunder", name: "雷晶鉱", icon: "⚡", rarity: "EPIC", color: "#f3d85d" },
  void: { id: "void", name: "虚無鉱", icon: "🟣", rarity: "LEGENDARY", color: "#b18cff" }
};

function makeEmptySlots() {
  return Array.from({ length: ORE_INVENTORY_SIZE }, () => null);
}

export class OreInventorySystem {
  constructor(initialSlots = null) {
    this.slots = this.normalizeSlots(initialSlots);
  }

  normalizeSlots(input) {
    const slots = makeEmptySlots();

    if (!Array.isArray(input)) return slots;

    input.slice(0, ORE_INVENTORY_SIZE).forEach((slot, index) => {
      if (!slot?.oreId) return;

      const amount = Math.max(
        1,
        Math.min(ORE_STACK_LIMIT, Number(slot.amount) || 1)
      );

      slots[index] = {
        oreId: String(slot.oreId),
        amount
      };
    });

    return slots;
  }

  addOre(oreId, amount = 1) {
    let remaining = Math.max(0, Math.floor(Number(amount) || 0));
    if (!remaining) return { added: 0, overflow: 0 };

    const requested = remaining;

    for (let index = 0; index < this.slots.length && remaining > 0; index += 1) {
      const slot = this.slots[index];

      if (!slot || slot.oreId !== oreId || slot.amount >= ORE_STACK_LIMIT) {
        continue;
      }

      const capacity = ORE_STACK_LIMIT - slot.amount;
      const moved = Math.min(capacity, remaining);

      slot.amount += moved;
      remaining -= moved;
    }

    for (let index = 0; index < this.slots.length && remaining > 0; index += 1) {
      if (this.slots[index]) continue;

      const moved = Math.min(ORE_STACK_LIMIT, remaining);
      this.slots[index] = { oreId, amount: moved };
      remaining -= moved;
    }

    return {
      added: requested - remaining,
      overflow: remaining
    };
  }

  removeOre(oreId, amount = 1) {
    let remaining = Math.max(0, Math.floor(Number(amount) || 0));
    if (!remaining) return 0;

    const requested = remaining;

    for (let index = this.slots.length - 1; index >= 0 && remaining > 0; index -= 1) {
      const slot = this.slots[index];
      if (!slot || slot.oreId !== oreId) continue;

      const removed = Math.min(slot.amount, remaining);
      slot.amount -= removed;
      remaining -= removed;

      if (slot.amount <= 0) {
        this.slots[index] = null;
      }
    }

    return requested - remaining;
  }

  countOre(oreId) {
    return this.slots.reduce(
      (total, slot) =>
        total + (slot?.oreId === oreId ? slot.amount : 0),
      0
    );
  }

  getUsedSlotCount() {
    return this.slots.filter(Boolean).length;
  }

  getFreeSlotCount() {
    return ORE_INVENTORY_SIZE - this.getUsedSlotCount();
  }

  canAdd(oreId, amount = 1) {
    const clone = new OreInventorySystem(this.toJSON());
    return clone.addOre(oreId, amount).overflow === 0;
  }

  clearSlot(index) {
    if (index < 0 || index >= ORE_INVENTORY_SIZE) return false;
    this.slots[index] = null;
    return true;
  }

  toJSON() {
    return this.slots.map((slot) =>
      slot ? { oreId: slot.oreId, amount: slot.amount } : null
    );
  }
}
