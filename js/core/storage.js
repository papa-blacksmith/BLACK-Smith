const KEY="blacksmith_v060";

export const DEFAULT_STATE={
  used:0,
  day:"",
  weapons:[],
  blueprints:[],
  oreInventory:Array(64).fill(null)
};

export function loadState(){
  try{
    const parsed=JSON.parse(localStorage.getItem(KEY)||"{}");

    return {
      ...DEFAULT_STATE,
      ...parsed,
      weapons:Array.isArray(parsed.weapons)?parsed.weapons:[],
      blueprints:Array.isArray(parsed.blueprints)?parsed.blueprints:[],
      oreInventory:Array.isArray(parsed.oreInventory)
        ? parsed.oreInventory.slice(0,64)
        : Array(64).fill(null)
    };
  }catch{
    return {
      ...DEFAULT_STATE,
      weapons:[],
      blueprints:[],
      oreInventory:Array(64).fill(null)
    };
  }
}

export function saveState(state){
  localStorage.setItem(KEY,JSON.stringify(state));
}
