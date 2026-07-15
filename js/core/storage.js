const KEY="blacksmith_v060";
export const DEFAULT_STATE={used:0,day:"",weapons:[],blueprints:[]};

export function loadState(){
  try{
    const parsed=JSON.parse(localStorage.getItem(KEY)||"{}");
    return {...DEFAULT_STATE,...parsed,
      weapons:Array.isArray(parsed.weapons)?parsed.weapons:[],
      blueprints:Array.isArray(parsed.blueprints)?parsed.blueprints:[]
    };
  }catch{return {...DEFAULT_STATE}}
}
export function saveState(state){localStorage.setItem(KEY,JSON.stringify(state))}
