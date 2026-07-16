const KEY="blacksmith_v060";

export const DEFAULT_STATE={
  used:0,
  day:"",
  weapons:[],
  blueprints:[],
  oreInventory:Array(64).fill(null),
  oreDailyKey:"",
  oreDailyClaimed:false,
  oreDailyResults:[],
  exploration:{
    active:null,
    pendingRewards:[],
    history:[]
  }
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
        : [],
      exploration:
        parsed.exploration &&
        typeof parsed.exploration === "object"
          ? {
              active:
                parsed.exploration.active &&
                typeof parsed.exploration.active === "object"
                  ? parsed.exploration.active
                  : null,
              pendingRewards:Array.isArray(
                parsed.exploration.pendingRewards
              )
                ? parsed.exploration.pendingRewards.filter(Boolean)
                : [],
              history:Array.isArray(parsed.exploration.history)
                ? parsed.exploration.history.slice(0,20)
                : []
            }
          : {
              active:null,
              pendingRewards:[],
              history:[]
            }
    };
  }catch{
    return {
      ...DEFAULT_STATE,
      weapons:[],
      blueprints:[],
      oreInventory:Array(64).fill(null),
      oreDailyResults:[],
      exploration:{
        active:null,
        pendingRewards:[],
        history:[]
      }
    };
  }
}

export function saveState(state){
  localStorage.setItem(KEY,JSON.stringify(state));
}
