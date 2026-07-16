const KEY="blacksmith_v060";

export const DEFAULT_STATE={
  used:0,
  day:"",
  weapons:[],
  blueprints:[],
  oreInventory:Array(64).fill(null),
  oreDailyKey:"",
  oreDailyClaimed:false,
  oreDailyResults:[]
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
        ? [...parsed.oreInventory.slice(0,64), ...Array(64).fill(null)]
            .slice(0,64)
        : Array(64).fill(null),
      oreDailyKey:typeof parsed.oreDailyKey==="string"
        ? parsed.oreDailyKey
        : "",
      oreDailyClaimed:parsed.oreDailyClaimed===true,
      oreDailyResults:Array.isArray(parsed.oreDailyResults)
        ? parsed.oreDailyResults.filter(Boolean).slice(0,5)
        : []
    };
  }catch{
    return {
      ...DEFAULT_STATE,
      weapons:[],
      blueprints:[],
      oreInventory:Array(64).fill(null),
      oreDailyResults:[]
    };
  }
}

export function saveState(state){
  localStorage.setItem(KEY,JSON.stringify(state));
}
