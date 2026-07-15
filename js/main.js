import { TYPES, RARITIES } from "./core/data.js";
import { loadState, saveState } from "./core/storage.js";
import { DEFAULT_SHAPE, cloneShape, normalizeShape, fingerprint } from "./core/shapeModel.js";
import { drawEditor, eventToLocal } from "./features/editor.js";

const $=id=>document.getElementById(id);
let state=loadState(),shape=cloneShape(DEFAULT_SHAPE),selectedType=0,selectedPoint=0;
let dragIndex=null,dragHandle=null,forgeCtx=null,forgeStep=0,quality=50;

const toast=msg=>{const el=$("toast");el.textContent=msg;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),1600)};
const dayKey=()=>{const d=new Date();if(d.getHours()<5)d.setDate(d.getDate()-1);return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`};
const maxForges=()=>3;
const remaining=()=>Math.max(0,maxForges()-state.used);

function resetDaily(){const key=dayKey();if(state.day!==key){state.day=key;state.used=0;saveState(state)}}
function go(id){document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));$(id).classList.add("active");document.querySelectorAll(".nav button").forEach(b=>b.classList.toggle("active",b.dataset.go===id));render();scrollTo(0,0)}
function enter(){ $("nav").style.display="grid";go("home") }

function renderTypes(){
  $("weaponTypes").innerHTML=TYPES.map((t,i)=>`<button class="type-button ${i===selectedType?"active":""}" data-type="${i}">${t.icon}<br><small>${t.name}</small></button>`).join("");
}
function renderControls(){
  const controls=[["width","幅",10,100],["thickness","厚み",5,100],["tip","刃先",0,100],["curve","反り",0,100]];
  $("shapeControls").innerHTML=`<div class="shape-grid">${controls.map(([k,l,min,max])=>`
    <div class="shape-control"><label><span>${l}</span><b>${Math.round(shape[k])}</b></label>
    <input type="range" min="${min}" max="${max}" value="${shape[k]}" data-shape="${k}"></div>`).join("")}</div>
    <div class="material-row"><select id="material">${["黒鉄","鋼","炎鋼","氷晶鋼","雷鋼","ミスリル"].map(m=>`<option ${shape.material===m?"selected":""}>${m}</option>`).join("")}</select>
    <input id="color" type="color" value="${shape.color}"></div>`;
}
function renderBlueprints(){
  $("blueprintCount").textContent=state.blueprints.length;
  $("blueprintList").innerHTML=state.blueprints.map((b,i)=>`<button class="card menu" data-load-blueprint="${i}">
    <span>📐</span><span><b>${b.name}</b><small>${TYPES[b.shape.weaponType].name} / ${fingerprint(b.shape)}</small></span><span>読込</span></button>`).join("");
}
function renderInventory(){
  $("inventoryCount").textContent=state.weapons.length;
  $("inventoryGrid").innerHTML=state.weapons.map((w,i)=>`<button class="weapon-card" data-weapon="${i}">
    <span class="badge" style="color:${w.color}">${w.rarity}</span><div class="icon">${w.icon}</div><b>${w.name}</b><small>${w.type}</small></button>`).join("")||'<div>まだ武器がありません</div>';
}
function render(){
  resetDaily();
  $("forgeRemaining").textContent=`${remaining()}/${maxForges()}`;
  $("forgeCounter").textContent=`${remaining()}/${maxForges()}`;
  $("heroWeapon").textContent=state.weapons[0]?.icon||"⚔️";
  renderTypes();renderControls();renderBlueprints();renderInventory();
  drawEditor($("weaponEditor"),shape,selectedPoint,TYPES[selectedType].name);
}
function save(){saveState(state);render()}
function saveBlueprint(name=$("blueprintName").value||"無銘の設計図"){
  state.blueprints.unshift({id:String(Date.now()),name,shape:normalizeShape({...shape,weaponType:selectedType})});
  save();toast("設計図を保存しました");
}
function loadBlueprint(i){const b=state.blueprints[i];if(!b)return;shape=normalizeShape(b.shape);selectedType=shape.weaponType;$("blueprintName").value=b.name;go("forge");toast("設計図を読み込みました")}
function rollRarity(){let r=Math.random()*100,a=0;for(const x of RARITIES){a+=x.probability;if(r<a)return x}return RARITIES.at(-1)}
function startForge(){if(remaining()<=0)return toast("本日の鍛造回数を使い切りました");if(state.weapons.length>=14)return toast("保管庫が満杯です");forgeCtx={shape:normalizeShape({...shape,weaponType:selectedType}),type:TYPES[selectedType]};forgeStep=0;quality=50;go("process");renderProcess()}
function renderProcess(){const names=["加熱","鍛打","成形","焼入れ","仕上げ","完成"],texts=["素材を赤熱させます","芯を鍛えます","輪郭を整えます","硬度を定着させます","刃と刻印を仕上げます","最後の一打を入れます"];$("steps").innerHTML=names.map((n,i)=>`<div class="step ${i===forgeStep?"active":""}">${n}</div>`).join("");$("processText").textContent=texts[forgeStep];$("advanceForge").textContent=forgeStep===5?"完成させる":names[forgeStep]+"する";$("processIcon").textContent=forgeStep<1?"🔥":forgeStep<4?forgeCtx.type.icon:"✨";$("quality").textContent=quality}
function advanceForge(){quality=Math.min(100,quality+Math.floor(Math.random()*8)+4);if(forgeStep<5){forgeStep++;renderProcess();return}const rarity=rollRarity();const w={id:String(Date.now()),name:["黒鉄","灼熱","蒼雷","月影"][Math.floor(Math.random()*4)]+"の"+forgeCtx.type.name,type:forgeCtx.type.name,icon:forgeCtx.type.icon,rarity:rarity.name,color:rarity.color,attack:Math.round((80+Math.random()*70)*rarity.multiplier),quality,shape:forgeCtx.shape,shapeId:fingerprint(forgeCtx.shape)};state.weapons.unshift(w);state.used++;save();showWeapon(w)}
function showWeapon(w){$("modalSheet").innerHTML=`<h2>${w.name}</h2><div class="process-view">${w.icon}</div><div class="row"><span>レアリティ</span><b style="color:${w.color}">${w.rarity}</b></div><div class="row"><span>攻撃力</span><b>${w.attack}</b></div><div class="row"><span>品質</span><b>${w.quality}</b></div><div class="row"><span>形状ID</span><b>${w.shapeId}</b></div><button class="primary mt12" id="closeModal">閉じる</button>`;$("modal").classList.add("show");$("closeModal").onclick=()=>$("modal").classList.remove("show")}

function addPoint(){if(shape.points.length>=12)return toast("最大12点です");const p=[...shape.points].sort((a,b)=>a.x-b.x);let idx=0,gap=-1;for(let i=0;i<p.length-1;i++){const g=p[i+1].x-p[i].x;if(g>gap){gap=g;idx=i}}const a=p[idx],b=p[idx+1];p.splice(idx+1,0,{x:(a.x+b.x)/2,y:(a.y+b.y)/2,inX:-.05,inY:0,outX:.05,outY:0,smooth:true});shape.points=p;selectedPoint=idx+1;render()}
function removePoint(){if(shape.points.length<=2)return toast("最低2点必要です");shape.points.splice(selectedPoint,1);selectedPoint=Math.max(0,Math.min(selectedPoint,shape.points.length-1));render()}
function smoothPoint(){const p=shape.points[selectedPoint];p.smooth=true;const lenIn=Math.hypot(p.inX,p.inY)||.08,lenOut=Math.hypot(p.outX,p.outY)||.08,angle=Math.atan2(p.outY,p.outX);p.outX=Math.cos(angle)*lenOut;p.outY=Math.sin(angle)*lenOut;p.inX=-Math.cos(angle)*lenIn;p.inY=-Math.sin(angle)*lenIn;render()}
function cornerPoint(){shape.points[selectedPoint].smooth=false;render()}
function mirror(){shape.points=shape.points.map(p=>({...p,x:1-p.x,inX:-p.outX,inY:p.outY,outX:-p.inX,outY:p.inY})).sort((a,b)=>a.x-b.x);render()}
function reset(){shape=cloneShape(DEFAULT_SHAPE);shape.weaponType=selectedType;selectedPoint=0;render()}

function bindEditor(){
  const svg=$("weaponEditor");
  svg.addEventListener("pointerdown",e=>{
    const h=e.target.closest("[data-handle]"),a=e.target.closest(".anchor"),t=h||a;if(!t)return;
    dragIndex=Number(t.dataset.index);selectedPoint=dragIndex;dragHandle=h?.dataset.handle||null;svg.setPointerCapture?.(e.pointerId);render();e.preventDefault();
  });
  svg.addEventListener("pointermove",e=>{
    if(dragIndex===null)return;
    const local=eventToLocal(svg,e),p=shape.points[dragIndex];if(!p)return;
    if(dragHandle){
      const hx=Math.max(-.35,Math.min(.35,(local.x-110)/760-p.x)),hy=Math.max(-.35,Math.min(.35,(local.y-55)/250-p.y));
      p[dragHandle+"X"]=hx;p[dragHandle+"Y"]=hy;
      if(p.smooth){const o=dragHandle==="in"?"out":"in",ol=Math.hypot(p[o+"X"],p[o+"Y"])||Math.hypot(hx,hy),l=Math.hypot(hx,hy)||1;p[o+"X"]=-hx/l*ol;p[o+"Y"]=-hy/l*ol;}
    }else{
      p.x=Math.max(.02,Math.min(.98,(local.x-110)/760));p.y=Math.max(.05,Math.min(.95,(local.y-55)/250));shape.points.sort((a,b)=>a.x-b.x);dragIndex=shape.points.indexOf(p);selectedPoint=dragIndex;
    }
    drawEditor(svg,shape,selectedPoint,TYPES[selectedType].name);e.preventDefault();
  });
  const stop=()=>{dragIndex=null;dragHandle=null};svg.addEventListener("pointerup",stop);svg.addEventListener("pointercancel",stop);
}

document.addEventListener("click",e=>{
  const g=e.target.closest("[data-go]");if(g)go(g.dataset.go);
  const t=e.target.closest("[data-type]");if(t){selectedType=Number(t.dataset.type);shape.weaponType=selectedType;render();}
  const b=e.target.closest("[data-load-blueprint]");if(b)loadBlueprint(Number(b.dataset.loadBlueprint));
  const w=e.target.closest("[data-weapon]");if(w)showWeapon(state.weapons[Number(w.dataset.weapon)]);
  if(e.target===$("modal"))$("modal").classList.remove("show");
});
document.addEventListener("input",e=>{const k=e.target.dataset?.shape;if(k){shape[k]=Number(e.target.value);render()}if(e.target.id==="material"){shape.material=e.target.value;render()}if(e.target.id==="color"){shape.color=e.target.value;render()}});
$("enterButton").onclick=enter;$("addPoint").onclick=addPoint;$("removePoint").onclick=removePoint;$("smoothPoint").onclick=smoothPoint;$("cornerPoint").onclick=cornerPoint;$("mirrorShape").onclick=mirror;$("resetShape").onclick=reset;$("saveBlueprint").onclick=()=>saveBlueprint();$("saveBlueprintFromForge").onclick=()=>saveBlueprint(`${TYPES[selectedType].name}設計図`);$("startForge").onclick=startForge;$("advanceForge").onclick=advanceForge;
bindEditor();resetDaily();render();
