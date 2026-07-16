import { TYPES, RARITIES } from "./core/data.js";
import { loadState, saveState } from "./core/storage.js";
import { DEFAULT_SHAPE, cloneShape, normalizeShape, fingerprint } from "./core/shapeModel.js";
import { drawEditor, eventToLocal, createShapePreview } from "./features/editor.js";
import { ForgeSystem } from "./features/ForgeSystem.js";
import { EditorCore } from "./editor/EditorCore.js";

const $=id=>document.getElementById(id);
let state=loadState(),shape=cloneShape(DEFAULT_SHAPE),selectedType=0,selectedPoint=0;
let dragIndex=null,dragHandle=null,dragWidth=false;
let editorFramePending=false;
let contextWorldPoint=null;
let activeEditorTab="shape";
let undoStack=[],redoStack=[];
let editorCore=null;

const toast=msg=>{const el=$("toast");el.textContent=msg;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),1600)};
const snapshot=()=>JSON.stringify(normalizeShape(shape));
function pushHistory(){const s=snapshot();if(undoStack.at(-1)!==s)undoStack.push(s);if(undoStack.length>60)undoStack.shift();redoStack=[];}
function undo(){if(!undoStack.length)return toast("戻せる操作がありません");redoStack.push(snapshot());shape=normalizeShape(JSON.parse(undoStack.pop()));render();}
function redo(){if(!redoStack.length)return toast("進める操作がありません");undoStack.push(snapshot());shape=normalizeShape(JSON.parse(redoStack.pop()));render();}
const dayKey=()=>{const d=new Date();if(d.getHours()<5)d.setDate(d.getDate()-1);return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`};
const maxForges=()=>3;
const remaining=()=>Math.max(0,maxForges()-state.used);

function resetDaily(){const key=dayKey();if(state.day!==key){state.day=key;state.used=0;saveState(state)}}
function go(id){document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));$(id).classList.add("active");document.querySelectorAll(".nav button").forEach(b=>b.classList.toggle("active",b.dataset.go===id));render();scrollTo(0,0)}
function enter(){ $("nav").style.display="grid";go("home") }


function applyEditorCamera({x,y,zoom}){
  const svg=$("weaponEditor");
  if(!svg)return;

  const safeZoom=Math.max(.55,Math.min(4,Number(zoom)||1));
  const width=1000/safeZoom;
  const height=360/safeZoom;
  const viewX=(-x/safeZoom)+(1000-width)/2;
  const viewY=(-y/safeZoom)+(360-height)/2;

  svg.setAttribute("viewBox",`${viewX} ${viewY} ${width} ${height}`);

  const label=$("editorZoomLabel");
  if(label)label.textContent=`${Math.round(safeZoom*100)}%`;
}

function initializeEditorCore(){
  const svg=$("weaponEditor");
  if(!svg||editorCore)return;

  editorCore=new EditorCore({
    canvas:svg,
    initialDocument:{
      version:1,
      weaponType:selectedType,
      shape:normalizeShape(shape)
    },
    renderer:null,
    onCameraChange:applyEditorCamera
  });

  editorCore.initialize();
}


function bindCanvasControls(){
  const zoomIn=$("zoomInButton");
  const zoomOut=$("zoomOutButton");
  const reset=$("resetCameraButton");
  const stage=$("canvasStage");
  const svg=$("weaponEditor");

  zoomIn?.addEventListener("click",()=>{
    if(!editorCore)return;
    const rect=svg.getBoundingClientRect();
    editorCore.camera.setZoom(
      editorCore.camera.zoom*editorCore.camera.zoomStep,
      rect.width/2,
      rect.height/2
    );
  });

  zoomOut?.addEventListener("click",()=>{
    if(!editorCore)return;
    const rect=svg.getBoundingClientRect();
    editorCore.camera.setZoom(
      editorCore.camera.zoom/editorCore.camera.zoomStep,
      rect.width/2,
      rect.height/2
    );
  });

  reset?.addEventListener("click",()=>{
    editorCore?.camera.reset();
  });

  svg?.addEventListener("pointerdown",(event)=>{
    if(event.button===2)stage?.classList.add("is-panning");
  });

  window.addEventListener("pointerup",()=>{
    stage?.classList.remove("is-panning");
  });

  window.addEventListener("pointercancel",()=>{
    stage?.classList.remove("is-panning");
  });
}

function renderTypes(){
  $("weaponTypes").innerHTML=TYPES.map((t,i)=>`<button class="type-button ${i===selectedType?"active":""}" data-type="${i}">${t.icon}<br><small>${t.name}</small></button>`).join("");
}
function renderControls(){
  const controls=[["width","全体幅",10,100],["thickness","厚み",5,100],["tip","刃先",0,100],["curve","反り",0,100]];
  $("shapeControls").innerHTML=`<div class="shape-grid">${controls.map(([k,l,min,max])=>`
    <div class="shape-control"><label><span>${l}</span><b>${Math.round(shape[k])}</b></label>
    <input type="range" min="${min}" max="${max}" value="${shape[k]}" data-shape="${k}"></div>`).join("")}</div>
    <div class="material-row"><select id="material">${["黒鉄","鋼","炎鋼","氷晶鋼","雷鋼","ミスリル"].map(m=>`<option ${shape.material===m?"selected":""}>${m}</option>`).join("")}</select>
    <input id="color" type="color" value="${shape.color}"></div>`;
  renderAdvancedPanel();
}

function renderAdvancedPanel(){
  const host=$("advancedEditorPanel");
  if(!host)return;
  const p=shape.points[selectedPoint]||shape.points[0];

  if(activeEditorTab==="shape"){
    host.innerHTML=`<div class="advanced-panel"><div class="advanced-grid">
      <div class="advanced-control"><label><span>選択点の局所幅</span><b>${Math.round((p.width||1)*100)}%</b></label><input type="range" min="15" max="220" value="${(p.width||1)*100}" data-point-prop="width"></div>
      <div class="advanced-control"><label><span>上側幅</span><b>${Math.round((p.upper||1)*100)}%</b></label><input type="range" min="15" max="220" value="${(p.upper||1)*100}" data-point-prop="upper"></div>
      <div class="advanced-control"><label><span>下側幅</span><b>${Math.round((p.lower||1)*100)}%</b></label><input type="range" min="15" max="220" value="${(p.lower||1)*100}" data-point-prop="lower"></div>
      <div class="advanced-control"><label><span>左右非対称</span><b>${shape.asymmetric?"ON":"OFF"}</b></label><button class="secondary" data-toggle-asymmetry>${shape.asymmetric?"対称に戻す":"非対称にする"}</button></div>
    </div></div>`;
  }else if(activeEditorTab==="edge"){
    host.innerHTML=`<div class="advanced-panel"><div class="advanced-grid">
      <div class="advanced-control"><label><span>刃スタイル</span></label><select data-shape-select="edgeStyle">
        ${[["normal","通常"],["serrated","ギザ刃"],["broken","欠け刃"],["double","両刃"]].map(([v,l])=>`<option value="${v}" ${shape.edgeStyle===v?"selected":""}>${l}</option>`).join("")}</select></div>
      <div class="advanced-control"><label><span>ギザギザ強度</span><b>${Math.round(shape.serration)}</b></label><input type="range" min="0" max="100" value="${shape.serration}" data-shape="serration"></div>
      <div class="advanced-control"><label><span>穴</span><b>${shape.holes}</b></label><input type="range" min="0" max="6" value="${shape.holes}" data-shape="holes"></div>
      <div class="advanced-control"><label><span>棘</span><b>${shape.spikes}</b></label><input type="range" min="0" max="8" value="${shape.spikes}" data-shape="spikes"></div>
    </div></div>`;
  }else if(activeEditorTab==="ornament"){
    host.innerHTML=`<div class="advanced-panel"><div class="advanced-grid">
      <div class="advanced-control"><label><span>装飾タイプ</span></label><select data-shape-select="ornamentType">
        ${[["none","なし"],["gem","宝石"],["wing","翼"],["ring","リング"],["chain","チェーン"]].map(([v,l])=>`<option value="${v}" ${shape.ornamentType===v?"selected":""}>${l}</option>`).join("")}</select></div>
      <div class="advanced-control"><label><span>装飾サイズ</span><b>${Math.round(shape.ornamentSize)}</b></label><input type="range" min="0" max="100" value="${shape.ornamentSize}" data-shape="ornamentSize"></div>
      <div class="advanced-control"><label><span>発光</span><b>${Math.round(shape.glow)}</b></label><input type="range" min="0" max="100" value="${shape.glow}" data-shape="glow"></div>
      <div class="advanced-control"><label><span>ズーム</span><b>${Math.round(shape.zoom*100)}%</b></label><input type="range" min="65" max="180" value="${shape.zoom*100}" data-shape-zoom></div>
    </div></div>`;
  }else{
    host.innerHTML=`<div class="advanced-panel"><div class="preset-grid">
      ${[["straight","直剣"],["katana","刀"],["scythe","鎌"],["flame","炎刃"],["jagged","魔剣"],["spear","槍刃"]].map(([id,label])=>`<button class="preset-button" data-preset="${id}">${label}</button>`).join("")}
    </div></div>`;
  }
}
function renderBlueprints(){
  $("blueprintCount").textContent=state.blueprints.length;
  $("blueprintList").innerHTML=state.blueprints.map((b,i)=>`<button class="card menu" data-load-blueprint="${i}">
    <span>📐</span><span><b>${b.name}</b><small>${TYPES[b.shape.weaponType].name} / ${fingerprint(b.shape)}</small></span><span>読込</span></button>`).join("");
}
function renderInventory(){
  $("inventoryCount").textContent=state.weapons.length;
  $("inventoryGrid").innerHTML=state.weapons.map((w,i)=>`<button class="weapon-card" data-weapon="${i}">
    <span class="badge" style="color:${w.color}">${w.rarity}</span>
    <div class="inventory-preview">${w.shape ? createShapePreview(w.shape,w.type) : `<div class="icon">${w.icon}</div>`}</div>
    <b>${w.name}</b>
    <small>${w.type}</small>
    ${w.shapeId ? `<small class="shape-code">${w.shapeId}</small>` : ""}
  </button>`).join("")||'<div>まだ武器がありません</div>';
}
function render(){
  resetDaily();
  $("forgeRemaining").textContent=`${remaining()}/${maxForges()}`;
  $("forgeCounter").textContent=`${remaining()}/${maxForges()}`;
  $("heroWeapon").textContent=state.weapons[0]?.icon||"⚔️";
  renderTypes();renderControls();renderBlueprints();renderInventory();
  drawEditor($("weaponEditor"),shape,selectedPoint,TYPES[selectedType].name);
  editorCore?.setDocument({
    version:1,
    weaponType:selectedType,
    shape:normalizeShape(shape)
  },{addToHistory:false,reason:"external-sync"});
}
function save(){saveState(state);render()}
function saveBlueprint(name=$("blueprintName").value||"無銘の設計図"){
  state.blueprints.unshift({id:String(Date.now()),name,shape:normalizeShape({...shape,weaponType:selectedType})});
  save();toast("設計図を保存しました");
}
function loadBlueprint(i){const b=state.blueprints[i];if(!b)return;shape=normalizeShape(b.shape);selectedType=shape.weaponType;$("blueprintName").value=b.name;go("forge");toast("設計図を読み込みました")}

const forgeSystem = new ForgeSystem({
  types: TYPES,
  rarities: RARITIES,
  normalizeShape,
  fingerprint,
  getState: () => state,
  saveState: save,
  getShape: () => shape,
  getSelectedType: () => selectedType,
  getRemaining: remaining,
  go,
  toast,
  getElement: $
});

function addPoint(){if(shape.points.length>=12)return toast("最大12点です");pushHistory();const p=[...shape.points].sort((a,b)=>a.x-b.x);let idx=0,gap=-1;for(let i=0;i<p.length-1;i++){const g=p[i+1].x-p[i].x;if(g>gap){gap=g;idx=i}}const a=p[idx],b=p[idx+1];p.splice(idx+1,0,{x:(a.x+b.x)/2,y:(a.y+b.y)/2,inX:-.05,inY:0,outX:.05,outY:0,smooth:true});shape.points=p;selectedPoint=idx+1;render()}
function removePoint(){deleteSelectedPoint()}
function smoothPoint(){pushHistory();const p=shape.points[selectedPoint];p.smooth=true;const lenIn=Math.hypot(p.inX,p.inY)||.08,lenOut=Math.hypot(p.outX,p.outY)||.08,angle=Math.atan2(p.outY,p.outX);p.outX=Math.cos(angle)*lenOut;p.outY=Math.sin(angle)*lenOut;p.inX=-Math.cos(angle)*lenIn;p.inY=-Math.sin(angle)*lenIn;render()}
function cornerPoint(){pushHistory();shape.points[selectedPoint].smooth=false;render()}
function mirror(){pushHistory();shape.points=shape.points.map(p=>({...p,x:1-p.x,inX:-p.outX,inY:p.outY,outX:-p.inX,outY:p.inY})).sort((a,b)=>a.x-b.x);render()}
function reset(){pushHistory();shape=cloneShape(DEFAULT_SHAPE);shape.weaponType=selectedType;selectedPoint=0;render()}


function applyPreset(id){
  pushHistory();
  const presets={
    straight:{points:[{x:.08,y:.5,inX:-.04,inY:0,outX:.08,outY:0,smooth:true,width:1,upper:1,lower:1},{x:.4,y:.5,inX:-.08,inY:0,outX:.08,outY:0,smooth:true,width:1,upper:1,lower:1},{x:.72,y:.5,inX:-.08,inY:0,outX:.08,outY:0,smooth:true,width:.75,upper:1,lower:1},{x:.93,y:.5,inX:-.05,inY:0,outX:.03,outY:0,smooth:true,width:.25,upper:1,lower:1}],tip:75,edgeStyle:"normal"},
    katana:{points:[{x:.08,y:.62,inX:-.05,inY:0,outX:.12,outY:-.08,smooth:true,width:1,upper:1,lower:1},{x:.38,y:.48,inX:-.1,inY:.06,outX:.1,outY:-.05,smooth:true,width:.9,upper:.8,lower:1.2},{x:.7,y:.4,inX:-.1,inY:.03,outX:.1,outY:0,smooth:true,width:.65,upper:.7,lower:1.25},{x:.93,y:.43,inX:-.06,inY:-.01,outX:.03,outY:0,smooth:true,width:.22,upper:.5,lower:1.3}],tip:80,asymmetric:true},
    scythe:{points:[{x:.08,y:.72,inX:-.03,inY:0,outX:.1,outY:-.18,smooth:true,width:.9,upper:1,lower:1},{x:.35,y:.35,inX:-.1,inY:.14,outX:.1,outY:-.12,smooth:true,width:1.2,upper:1,lower:1},{x:.68,y:.2,inX:-.1,inY:.08,outX:.12,outY:.02,smooth:true,width:.7,upper:1.2,lower:.8},{x:.9,y:.35,inX:-.08,inY:-.06,outX:.03,outY:0,smooth:true,width:.15,upper:1,lower:1}],tip:90},
    flame:{points:[{x:.08,y:.55,inX:-.03,inY:0,outX:.08,outY:-.12,smooth:false,width:1,upper:1.3,lower:.9},{x:.28,y:.35,inX:-.06,inY:.1,outX:.07,outY:.1,smooth:false,width:1.3,upper:1.5,lower:.8},{x:.48,y:.62,inX:-.06,inY:-.1,outX:.07,outY:-.12,smooth:false,width:1.1,upper:1.4,lower:.8},{x:.7,y:.32,inX:-.06,inY:.12,outX:.08,outY:.1,smooth:false,width:.8,upper:1.5,lower:.7},{x:.92,y:.52,inX:-.05,inY:-.08,outX:.03,outY:0,smooth:false,width:.2,upper:1,lower:1}],tip:88,asymmetric:true,glow:55},
    jagged:{points:[{x:.08,y:.5,inX:-.03,inY:0,outX:.06,outY:-.05,smooth:false,width:1,upper:1.4,lower:1},{x:.3,y:.38,inX:-.05,inY:.06,outX:.05,outY:.08,smooth:false,width:1.3,upper:1.5,lower:.8},{x:.5,y:.58,inX:-.05,inY:-.08,outX:.05,outY:-.1,smooth:false,width:1.1,upper:1.6,lower:.8},{x:.72,y:.34,inX:-.05,inY:.1,outX:.06,outY:.06,smooth:false,width:.75,upper:1.6,lower:.7},{x:.93,y:.5,inX:-.04,inY:-.05,outX:.02,outY:0,smooth:false,width:.18,upper:1,lower:1}],edgeStyle:"serrated",serration:70,spikes:4},
    spear:{points:[{x:.08,y:.5,inX:-.03,inY:0,outX:.1,outY:0,smooth:true,width:.35,upper:1,lower:1},{x:.5,y:.5,inX:-.1,inY:0,outX:.1,outY:0,smooth:true,width:.55,upper:1,lower:1},{x:.78,y:.5,inX:-.08,inY:0,outX:.08,outY:0,smooth:true,width:1.25,upper:1,lower:1},{x:.94,y:.5,inX:-.05,inY:0,outX:.02,outY:0,smooth:true,width:.1,upper:1,lower:1}],tip:100}
  };
  const preset=presets[id];if(!preset)return;
  shape=normalizeShape({...shape,...preset,points:preset.points});
  selectedPoint=0;render();toast("プリセットを適用しました");
}

function duplicateSelectedPoint(){
  if(shape.points.length>=12)return toast("最大12点です");
  pushHistory();
  const p=shape.points[selectedPoint];
  const copy={...p,x:Math.min(.98,p.x+.035),y:Math.min(.95,p.y+.02)};
  shape.points.splice(selectedPoint+1,0,copy);
  shape.points.sort((a,b)=>a.x-b.x);
  selectedPoint=shape.points.indexOf(copy);
  render();
}

function scheduleEditorFrame(){
  if(editorFramePending)return;
  editorFramePending=true;

  requestAnimationFrame(()=>{
    editorFramePending=false;
    drawEditor(
      $("weaponEditor"),
      shape,
      selectedPoint,
      TYPES[selectedType].name
    );
  });
}


function clampPoint(value,min,max){
  return Math.max(min,Math.min(max,value));
}

function findInsertIndexByX(x){
  const points=shape.points;
  for(let i=0;i<points.length-1;i++){
    if(x>=points[i].x && x<=points[i+1].x)return i+1;
  }
  return x<points[0].x ? 0 : points.length;
}

function createPointAtLocal(local){
  if(shape.points.length>=12){
    toast("制御点は最大12点です");
    return false;
  }

  const x=clampPoint((local.x-110)/760,.02,.98);
  const y=clampPoint((local.y-55)/250,.05,.95);
  const insertIndex=findInsertIndexByX(x);

  const previous=shape.points[Math.max(0,insertIndex-1)];
  const next=shape.points[Math.min(shape.points.length-1,insertIndex)];
  const span=Math.max(.04,Math.abs((next?.x??x+.1)-(previous?.x??x-.1)));

  pushHistory();

  const point={
    x,
    y,
    inX:-Math.min(.12,span*.32),
    inY:0,
    outX:Math.min(.12,span*.32),
    outY:0,
    smooth:true,
    width:((previous?.width??1)+(next?.width??1))/2,
    upper:((previous?.upper??1)+(next?.upper??1))/2,
    lower:((previous?.lower??1)+(next?.lower??1))/2
  };

  shape.points.splice(insertIndex,0,point);
  shape.points.sort((a,b)=>a.x-b.x);
  selectedPoint=shape.points.indexOf(point);
  render();
  toast("制御点を追加しました");
  return true;
}

function deleteSelectedPoint(){
  if(shape.points.length<=3){
    toast("制御点は最低3点必要です");
    return false;
  }

  pushHistory();
  shape.points.splice(selectedPoint,1);
  selectedPoint=Math.max(0,Math.min(selectedPoint,shape.points.length-1));

  const current=shape.points[selectedPoint];
  if(current){
    current.inX=Math.min(current.inX,-.03);
    current.outX=Math.max(current.outX,.03);
  }

  render();
  toast("制御点を削除しました");
  return true;
}

function showEditorContextMenu(event){
  const menu=$("editorContextMenu");
  if(!menu)return;

  const svg=$("weaponEditor");
  contextWorldPoint=eventToLocal(svg,event);

  const target=event.target.closest("[data-index],[data-width-index]");
  if(target){
    const index=Number(target.dataset.index??target.dataset.widthIndex);
    if(Number.isFinite(index))selectedPoint=index;
  }

  menu.style.left=`${Math.min(window.innerWidth-190,event.clientX)}px`;
  menu.style.top=`${Math.min(window.innerHeight-230,event.clientY)}px`;
  menu.classList.add("show");
  menu.setAttribute("aria-hidden","false");
}

function hideEditorContextMenu(){
  const menu=$("editorContextMenu");
  if(!menu)return;
  menu.classList.remove("show");
  menu.setAttribute("aria-hidden","true");
}

function handleContextAction(action){
  if(action==="add" && contextWorldPoint)createPointAtLocal(contextWorldPoint);
  if(action==="delete")deleteSelectedPoint();
  if(action==="smooth")smoothPoint();
  if(action==="corner")cornerPoint();
  if(action==="mirror")mirror();
  hideEditorContextMenu();
}

function bindPointEditing(){
  const svg=$("weaponEditor");

  svg.addEventListener("dblclick",(event)=>{
    if(event.button!==0)return;
    if(event.target.closest("[data-index],[data-handle],[data-width-index]"))return;
    createPointAtLocal(eventToLocal(svg,event));
  });

  svg.addEventListener("contextmenu",(event)=>{
    event.preventDefault();
    showEditorContextMenu(event);
  });

  document.addEventListener("click",(event)=>{
    if(!event.target.closest("#editorContextMenu"))hideEditorContextMenu();
  });

  document.addEventListener("keydown",(event)=>{
    const target=event.target;
    const editingText=target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      target?.isContentEditable;

    if(editingText)return;

    if(event.code==="Delete" || event.code==="Backspace"){
      event.preventDefault();
      deleteSelectedPoint();
    }

    if((event.ctrlKey||event.metaKey) && event.code==="KeyZ" && !event.shiftKey){
      event.preventDefault();
      undo();
    }

    if(
      ((event.ctrlKey||event.metaKey) && event.code==="KeyY") ||
      ((event.ctrlKey||event.metaKey) && event.shiftKey && event.code==="KeyZ")
    ){
      event.preventDefault();
      redo();
    }
  });

  $("editorContextMenu")?.addEventListener("click",(event)=>{
    const button=event.target.closest("[data-context-action]");
    if(button)handleContextAction(button.dataset.contextAction);
  });
}

function bindEditor(){
  const svg=$("weaponEditor");
  svg.addEventListener("pointerdown",e=>{
    const h=e.target.closest("[data-handle]"),a=e.target.closest(".anchor"),w=e.target.closest("[data-width-index]"),t=h||a||w;if(!t)return;
    pushHistory();
    dragIndex=Number(t.dataset.index??t.dataset.widthIndex);
    selectedPoint=dragIndex;
    dragHandle=h?.dataset.handle||null;
    dragWidth=Boolean(w);
    svg.setPointerCapture?.(e.pointerId);
    scheduleEditorFrame();
    e.preventDefault();
  });
  svg.addEventListener("pointermove",e=>{
    if(dragIndex===null)return;
    const local=eventToLocal(svg,e),p=shape.points[dragIndex];if(!p)return;
    if(dragWidth){
      const anchorY=55+p.y*250;
      p.width=Math.max(.15,Math.min(2.2,(anchorY-local.y)/34));
    }else if(dragHandle){
      const hx=Math.max(-.35,Math.min(.35,(local.x-110)/760-p.x)),hy=Math.max(-.35,Math.min(.35,(local.y-55)/250-p.y));
      p[dragHandle+"X"]=hx;p[dragHandle+"Y"]=hy;
      if(p.smooth){const o=dragHandle==="in"?"out":"in",ol=Math.hypot(p[o+"X"],p[o+"Y"])||Math.hypot(hx,hy),l=Math.hypot(hx,hy)||1;p[o+"X"]=-hx/l*ol;p[o+"Y"]=-hy/l*ol;}
    }else{
      p.x=Math.max(.02,Math.min(.98,(local.x-110)/760));p.y=Math.max(.05,Math.min(.95,(local.y-55)/250));shape.points.sort((a,b)=>a.x-b.x);dragIndex=shape.points.indexOf(p);selectedPoint=dragIndex;
    }
    scheduleEditorFrame();
    e.preventDefault();
  });
  const stop=()=>{
    if(dragIndex!==null){
      dragIndex=null;
      dragHandle=null;
      dragWidth=false;
      renderAdvancedPanel();
      editorCore?.updateExternalDocument?.({
        version:1,
        weaponType:selectedType,
        shape:normalizeShape(shape)
      });
    }
  };
  svg.addEventListener("pointerup",stop);
  svg.addEventListener("pointercancel",stop);
}

document.addEventListener("click",e=>{
  const g=e.target.closest("[data-go]");if(g)go(g.dataset.go);
  const t=e.target.closest("[data-type]");if(t){selectedType=Number(t.dataset.type);shape.weaponType=selectedType;render();}
  const b=e.target.closest("[data-load-blueprint]");if(b)loadBlueprint(Number(b.dataset.loadBlueprint));
  const w=e.target.closest("[data-weapon]");if(w)forgeSystem.showWeapon(state.weapons[Number(w.dataset.weapon)]);
  const tab=e.target.closest("[data-editor-tab]");if(tab){activeEditorTab=tab.dataset.editorTab;document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x===tab));renderAdvancedPanel();}
  const preset=e.target.closest("[data-preset]");if(preset)applyPreset(preset.dataset.preset);
  const asym=e.target.closest("[data-toggle-asymmetry]");if(asym){pushHistory();shape.asymmetric=!shape.asymmetric;render();}
  if(e.target===$("modal"))$("modal").classList.remove("show");
});
document.addEventListener("input",e=>{
  const k=e.target.dataset?.shape;if(k){pushHistory();shape[k]=Number(e.target.value);render()}
  const prop=e.target.dataset?.pointProp;if(prop){pushHistory();shape.points[selectedPoint][prop]=Number(e.target.value)/100;render()}
  const select=e.target.dataset?.shapeSelect;if(select){pushHistory();shape[select]=e.target.value;render()}
  if(e.target.hasAttribute("data-shape-zoom")){pushHistory();shape.zoom=Number(e.target.value)/100;render()}
  if(e.target.id==="material"){pushHistory();shape.material=e.target.value;render()}
  if(e.target.id==="color"){pushHistory();shape.color=e.target.value;render()}
});
$("enterButton").onclick=enter;$("undoShape").onclick=undo;$("redoShape").onclick=redo;$("addPoint").onclick=addPoint;$("removePoint").onclick=removePoint;$("smoothPoint").onclick=smoothPoint;$("cornerPoint").onclick=cornerPoint;$("mirrorShape").onclick=mirror;$("duplicatePoint").onclick=duplicateSelectedPoint;$("resetShape").onclick=reset;$("saveBlueprint").onclick=()=>saveBlueprint();$("saveBlueprintFromForge").onclick=()=>saveBlueprint(`${TYPES[selectedType].name}設計図`);$("startForge").onclick=()=>forgeSystem.start();$("advanceForge").onclick=()=>forgeSystem.advance();
bindEditor();bindPointEditing();initializeEditorCore();bindCanvasControls();resetDaily();render();
