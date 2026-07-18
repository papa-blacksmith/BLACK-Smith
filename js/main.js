import { TYPES, RARITIES } from "./core/data.js";
import { loadState, saveState } from "./core/storage.js";
import { DEFAULT_SHAPE, cloneShape, normalizeShape, fingerprint } from "./core/shapeModel.js";
import { drawEditor, eventToLocal, createExactShapePreview } from "./features/editor.js";
import { ForgeSystem } from "./features/ForgeSystem.js";
import { EditorCore } from "./editor/EditorCore.js";
import { WeaponPartSystem } from "./editor/WeaponPartSystem.js";
import { Weapon3DPreview } from "./three/Weapon3DPreview.js";
import { createWeaponMaterialProfile } from "./systems/MaterialEngine.js";
import { ForgeEffectEngine } from "./systems/ForgeEffectEngine.js";
import { Workshop3D } from "./three/Workshop3D.js";
import {
  EXPLORATION_DIFFICULTIES,
  normalizeExplorationState,
  startExploration,
  updateExplorationCompletion,
  receivePendingExplorationRewards,
  cancelExploration,
  getActiveDifficulty,
  getExplorationRemainingMs,
  formatExplorationTime,
  summarizeRewards
} from "./systems/ExplorationSystem.js";
import {
  OreInventorySystem,
  ORE_DEFINITIONS,
  ORE_CATALOG,
  ORE_RARITIES,
  ORE_INVENTORY_SIZE,
  ORE_STACK_LIMIT
} from "./systems/OreInventorySystem.js";
import {
  drawDailyOres,
  normalizeOreDailyState,
  canReceiveOreResults,
  receiveOreResults,
  getOreResultDetails,
  getNextOreResetAt,
  ORE_EFFECT_RULES
} from "./systems/OreGachaSystem.js";

const $=id=>document.getElementById(id);
let state=loadState(),shape=cloneShape(DEFAULT_SHAPE),selectedType=0,selectedPoint=0;
let dragIndex=null,dragHandle=null,dragWidth=false;
let editorFramePending=false;
let contextWorldPoint=null;
let renameTargetPartId=null;
let oreInventory=new OreInventorySystem(state.oreInventory);
let weapon3DPreview=null;
let inspect3DPreview=null;
let workshop3D=null;
let forgeEffectEngine=null;
let selectedInspectWeapon=null;
let explorationTimerId=null;
let selectedForgeOres=Array(5).fill(null);
let activeEditorTab="shape";
let undoStack=[],redoStack=[];
let editorCore=null;
let partSystem=new WeaponPartSystem(shape,selectedType);

const toast=msg=>{const el=$("toast");el.textContent=msg;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),1600)};
const snapshot=()=>JSON.stringify({
  shape:normalizeShape(shape),
  selectedType,
  parts:partSystem.getPartsPayload(shape)
});
function pushHistory(){const s=snapshot();if(undoStack.at(-1)!==s)undoStack.push(s);if(undoStack.length>60)undoStack.shift();redoStack=[];}
function restoreEditorSnapshot(raw){
  const data=typeof raw==="string"?JSON.parse(raw):raw;
  if(data?.parts){
    selectedType=Number(data.selectedType)||0;
    partSystem.loadPartsPayload(selectedType,data.parts,data.shape);
    shape=partSystem.switchPart(data.parts.activePartId,data.shape);
  }else{
    shape=normalizeShape(data);
  }
  selectedPoint=0;
}
function undo(){if(!undoStack.length)return toast("戻せる操作がありません");redoStack.push(snapshot());restoreEditorSnapshot(undoStack.pop());render();}
function redo(){if(!redoStack.length)return toast("進める操作がありません");undoStack.push(snapshot());restoreEditorSnapshot(redoStack.pop());render();}
const dayKey=()=>{const d=new Date();if(d.getHours()<5)d.setDate(d.getDate()-1);return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`};
const maxForges=()=>3;
const remaining=()=>Math.max(0,maxForges()-state.used);

function resetDaily(){
  const key=dayKey();

  if(state.day!==key){
    state.day=key;
    state.used=0;
  }

  normalizeOreDailyState(state);
  saveState(state);
}
function go(id){
  const target=$(id);

  if(!target){
    console.error(`画面 "${id}" が見つかりません。`);
    toast("画面を開けませんでした");
    return;
  }

  document.querySelectorAll(".screen").forEach((screen)=>{
    screen.classList.remove("active");
  });

  target.classList.add("active");

  document.querySelectorAll(".nav button").forEach((button)=>{
    button.classList.toggle("active",button.dataset.go===id);
  });

  render();
  scrollTo(0,0);
}
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
  editorCore.camera.reset();
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
    const svg=$("weaponEditor");
    if(svg)svg.setAttribute("viewBox","0 0 1000 360");
    editorCore?.camera.reset();
    render();
    requestAnimationFrame(()=>render());
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



function renderPartTransformControls(){
  const transform=partSystem.getActiveTransform();

  document.querySelectorAll("[data-part-transform]").forEach((input)=>{
    const key=input.dataset.partTransform;
    const value=(key==="scaleX"||key==="scaleY")
      ? Math.round((Number(transform[key])||1)*100)
      : Math.round(Number(transform[key])||0);
    input.value=String(value);
  });

  document.querySelectorAll("[data-transform-value]").forEach((label)=>{
    const key=label.dataset.transformValue;
    if(key==="scaleX"||key==="scaleY"){
      label.textContent=`${Math.round((Number(transform[key])||1)*100)}%`;
    }else if(key==="rotation"){
      label.textContent=`${Math.round(Number(transform[key])||0)}°`;
    }else{
      label.textContent=String(Math.round(Number(transform[key])||0));
    }
  });

  const socketSelect=$("partSocketSelect");
  if(socketSelect){
    const parts=partSystem.getAllParts(shape);
    socketSelect.innerHTML=[
      `<option value="root">ROOT</option>`,
      ...parts
        .filter((part)=>part.id!==partSystem.activePartId)
        .map((part)=>`<option value="${part.id}">${part.label}</option>`)
    ].join("");
    socketSelect.value=transform.socket||"root";
  }
}

function renderWeaponParts(){
  const host=$("weaponPartList");
  if(!host)return;

  const parts=partSystem.getAllParts(shape);
  const activeIndex=Math.max(
    0,
    parts.findIndex((part)=>part.id===partSystem.activePartId)
  );

  host.innerHTML=parts.map((part,index)=>`
    <div
      class="weapon-part-row ${part.active?"active":""} ${part.locked?"locked":""}"
      data-outliner-row="${part.id}"
    >
      <button
        type="button"
        class="weapon-part-button ${part.active?"active":""}"
        data-part-id="${part.id}"
      >
        <span class="part-icon">${part.icon}</span>
        <span class="part-main-label">
          <b>${part.label}</b>
          <small>Layer ${index+1}</small>
        </span>
      </button>

      <div class="part-row-actions">
        <button
          type="button"
          class="part-mini-button ${part.visible?"on":"off"}"
          data-part-visibility="${part.id}"
          title="表示切替"
        >${part.visible?"👁":"🚫"}</button>

        <button
          type="button"
          class="part-mini-button ${part.locked?"locked":""}"
          data-part-lock="${part.id}"
          title="ロック切替"
        >${part.locked?"🔒":"🔓"}</button>

        <button
          type="button"
          class="part-mini-button"
          data-part-rename="${part.id}"
          title="名前変更"
        >✎</button>

        <button
          type="button"
          class="part-mini-button"
          data-part-duplicate="${part.id}"
          title="複製"
        >⧉</button>

        <button
          type="button"
          class="part-mini-button danger"
          data-part-delete="${part.id}"
          title="削除"
          ${parts.length<=1?"disabled":""}
        >×</button>

        <button
          type="button"
          class="part-mini-button"
          data-part-move="${part.id}"
          data-direction="-1"
          title="前面へ"
          ${index===0?"disabled":""}
        >▲</button>

        <button
          type="button"
          class="part-mini-button"
          data-part-move="${part.id}"
          data-direction="1"
          title="背面へ"
          ${index===parts.length-1?"disabled":""}
        >▼</button>
      </div>
    </div>
  `).join("");

  const active=parts.find((part)=>part.active);

  const label=$("activePartLabel");
  if(label){
    label.textContent=
      `${active?.label||"パーツ"}${active?.locked?"（ロック中）":""}`;
  }

  const count=$("partCountLabel");
  if(count)count.textContent=`${activeIndex+1}/${parts.length}`;
}


function openPartRename(partId){
  const part=partSystem.getAllParts(shape).find((item)=>item.id===partId);
  if(!part)return;

  renameTargetPartId=partId;

  const modal=$("partRenameModal");
  const input=$("partRenameInput");

  if(input){
    input.value=part.label;
    requestAnimationFrame(()=>{
      input.focus();
      input.select();
    });
  }

  modal?.classList.add("show");
  modal?.setAttribute("aria-hidden","false");
}

function closePartRename(){
  renameTargetPartId=null;
  $("partRenameModal")?.classList.remove("show");
  $("partRenameModal")?.setAttribute("aria-hidden","true");
}

function confirmPartRename(){
  if(!renameTargetPartId)return closePartRename();

  const value=$("partRenameInput")?.value||"";
  pushHistory();

  if(partSystem.renamePart(renameTargetPartId,value,shape)){
    render();
    toast("パーツ名を変更しました");
  }else{
    toast("パーツ名を入力してください");
  }

  closePartRename();
}


function saveOreInventory(){
  state.oreInventory=oreInventory.toJSON();
  saveState(state);
}

function renderOreInventory(){
  const grid=$("oreInventoryGrid");
  if(!grid)return;

  grid.innerHTML=oreInventory.slots.map((slot,index)=>{
    if(!slot){
      return `<button class="ore-slot empty" data-ore-slot="${index}" aria-label="空きスロット ${index+1}">
        <span class="slot-index">${index+1}</span>
      </button>`;
    }

    const ore=ORE_DEFINITIONS[slot.oreId]||{
      name:slot.oreId,
      icon:"🪨",
      color:"#b8bcc4",
      rarity:"UNKNOWN"
    };

    return `<button class="ore-slot filled" data-ore-slot="${index}" style="--ore-color:${ore.color}">
      <span class="slot-index">${index+1}</span>
      <span class="ore-icon">${ore.icon}</span>
      <span class="ore-name">${ore.name}</span>
      <span class="ore-stack">${slot.amount}/${ORE_STACK_LIMIT}</span>
    </button>`;
  }).join("");

  const usedLabel=$("oreUsedSlots");
  const freeLabel=$("oreFreeSlots");

  if(usedLabel){
    usedLabel.textContent=String(oreInventory.getUsedSlotCount());
  }

  if(freeLabel){
    freeLabel.textContent=String(oreInventory.getFreeSlotCount());
  }

  const testHost=$("oreTestButtons");
  if(testHost){
    testHost.innerHTML=ORE_CATALOG.map((ore)=>`
      <button
        type="button"
        class="secondary ore-add-button"
        data-add-ore="${ore.id}"
        title="${ORE_RARITIES[ore.rarity]?.label||ore.rarity}"
      >
        ${ore.icon} ${ore.name} +1
      </button>
    `).join("");
  }

  renderOreGacha();
}

function addOreToInventory(oreId,amount=1){
  const ore=ORE_DEFINITIONS[oreId];
  const result=oreInventory.addOre(oreId,amount);

  if(result.added>0){
    saveOreInventory();
    renderOreInventory();
    toast(`${ore?.name||oreId}を${result.added}個収納しました`);
  }

  if(result.overflow>0){
    toast(`鉱石倉庫が満杯です。${result.overflow}個入りませんでした`);
  }

  return result;
}

function removeOreFromInventory(oreId,amount=1){
  const removed=oreInventory.removeOre(oreId,amount);
  if(removed>0){
    saveOreInventory();
    renderOreInventory();
  }
  return removed;
}


function formatResetRemaining(){
  const milliseconds=Math.max(0,getNextOreResetAt().getTime()-Date.now());
  const hours=Math.floor(milliseconds/3600000);
  const minutes=Math.floor((milliseconds%3600000)/60000);
  return `次回更新まで ${hours}時間${minutes}分`;
}


function bindOreGachaButton(){
  const button=$("oreGachaButton");
  if(!button)return;

  button.onclick=(event)=>{
    event.preventDefault();
    event.stopPropagation();
    handleOreGacha();
  };
}

function renderOreGacha(){
  const resultsHost=$("oreGachaResults");
  const button=$("oreGachaButton");
  const status=$("oreGachaStatus");
  const resetLabel=$("oreGachaResetLabel");

  if(!resultsHost||!button)return;

  normalizeOreDailyState(state);
  const details=getOreResultDetails(state.oreDailyResults);

  resultsHost.innerHTML=details.length
    ? details.map((ore)=>`
        <article class="ore-gacha-result" style="--ore-color:${ore.color}">
          <span>${ore.icon}</span>
          <b>${ore.name}</b>
          <small>${ore.rarityLabel}</small>
        </article>
      `).join("")
    : Array.from({length:5},()=>`
        <article class="ore-gacha-result empty">
          <span>?</span>
          <b>未抽選</b>
          <small>毎朝5時更新</small>
        </article>
      `).join("");

  if(resetLabel)resetLabel.textContent=formatResetRemaining();

  if(state.oreDailyClaimed){
    button.disabled=true;
    button.textContent="本日分は受取済み";
    if(status)status.textContent="次回は午前5時に更新されます。";
    return;
  }

  button.disabled=false;

  if(state.oreDailyResults.length){
    button.textContent="保留中の5個を受け取る";
    if(status){
      status.textContent=canReceiveOreResults(
        oreInventory,
        state.oreDailyResults
      )
        ? "受け取り可能です。"
        : "インベントリに空きを作ると受け取れます。";
    }
  }else{
    button.textContent="本日の5個を抽選";
    if(status)status.textContent="同じ鉱物が重複して出ることがあります。";
  }
  bindOreGachaButton();
}

function handleOreGacha(){
  normalizeOreDailyState(state);

  if(state.oreDailyClaimed){
    toast("本日分は受け取り済みです");
    return;
  }

  if(!state.oreDailyResults.length){
    state.oreDailyResults=drawDailyOres();
  }

  if(!canReceiveOreResults(oreInventory,state.oreDailyResults)){
    saveState(state);
    renderOreGacha();
    toast("鉱石倉庫が満杯のため受け取り保留です");
    return;
  }

  const received=receiveOreResults(
    oreInventory,
    state.oreDailyResults
  );

  if(!received.success){
    saveState(state);
    renderOreGacha();
    toast("受け取りに失敗しました");
    return;
  }

  state.oreDailyClaimed=true;
  state.oreInventory=oreInventory.toJSON();
  saveState(state);
  render();
  toast("本日の鉱物5個を受け取りました");
}

function getSelectedOreCount(oreId,exceptIndex=-1){
  return selectedForgeOres.reduce((count,id,index)=>{
    if(index===exceptIndex)return count;
    return count+(id===oreId?1:0);
  },0);
}

function getForgeOreSelectionCounts(selection=selectedForgeOres){
  return selection
    .filter(Boolean)
    .reduce((counts,oreId)=>{
      counts[oreId]=(counts[oreId]||0)+1;
      return counts;
    },{});
}

function canSelectForgeOre(oreId,targetIndex){
  if(!oreId)return true;

  const currentlySelected=selectedForgeOres[targetIndex];
  const selectedElsewhere=getSelectedOreCount(oreId,targetIndex);
  const owned=oreInventory.countOre(oreId);

  // 同じ枠で同じ鉱物を選び直す場合は、その1個を含めて判定する。
  const required=selectedElsewhere+1;

  return owned>=required || currentlySelected===oreId;
}

function renderForgeOreSlots(){
  const host=$("forgeOreSlots");
  const summary=$("forgeOreEffectSummary");
  if(!host)return;

  host.innerHTML=selectedForgeOres.map((selected,index)=>{
    const options=ORE_CATALOG
      .filter((ore)=>oreInventory.countOre(ore.id)>0)
      .map((ore)=>{
        const owned=oreInventory.countOre(ore.id);
        const selectedElsewhere=getSelectedOreCount(ore.id,index);
        const remainingAfterSelection=Math.max(
          0,
          owned-selectedElsewhere-(selected===ore.id?1:0)
        );
        const canSelect=
          selected===ore.id ||
          owned>selectedElsewhere;

        return `<option
          value="${ore.id}"
          ${selected===ore.id?"selected":""}
          ${canSelect?"":"disabled"}
        >${ore.icon} ${ore.name}（所持${owned} / 残${remainingAfterSelection}）</option>`;
      }).join("");

    return `
      <label class="forge-ore-slot">
        <span>${index+1}</span>
        <select data-forge-ore-slot="${index}">
          <option value="">⬜ デフォルト（コモン）</option>
          ${options}
        </select>
      </label>
    `;
  }).join("");

  if(summary){
    const selected=selectedForgeOres
      .filter(Boolean)
      .map((id)=>ORE_DEFINITIONS[id])
      .filter(Boolean);

    summary.innerHTML=selected.length
      ? selected.map((ore)=>{
          const rule=ORE_EFFECT_RULES[ore.rarity];
          return `<span style="--ore-color:${ore.color}">
            ${ore.icon} ${ore.name}：
            発動率 ${rule?.procRate??0}%
          </span>`;
        }).join("")
      : "<span>鉱物未選択：コモンのデフォルト素材で鍛造します。</span>";
  }
}

function getForgeOreValidation(){
  const counts=getForgeOreSelectionCounts();
  const shortages=[];

  for(const [oreId,required] of Object.entries(counts)){
    const owned=oreInventory.countOre(oreId);

    if(owned<required){
      shortages.push({
        oreId,
        required,
        owned,
        oreName:ORE_DEFINITIONS[oreId]?.name||oreId
      });
    }
  }

  return {
    valid:shortages.length===0,
    shortages,
    counts
  };
}

function validateForgeOreSelection(){
  return getForgeOreValidation().valid;
}

function consumeSelectedForgeOres(){
  const validation=getForgeOreValidation();
  if(!validation.valid)return false;

  // 検証後、同じ鉱物をまとめて一括消費する。
  for(const [oreId,amount] of Object.entries(validation.counts)){
    const removed=oreInventory.removeOre(oreId,amount);

    if(removed!==amount){
      console.error("鉱物消費数が一致しません",{
        oreId,
        requested:amount,
        removed
      });
      return false;
    }
  }

  selectedForgeOres=Array(5).fill(null);
  state.oreInventory=oreInventory.toJSON();
  saveState(state);

  // 消費完了後に一度だけ表示を更新する。
  renderOreInventory();
  renderForgeOreSlots();

  return true;
}


function initializeWeapon3DPreview(){
  const container=$("weapon3DViewport");
  if(!container||weapon3DPreview)return;

  try{
    weapon3DPreview=new Weapon3DPreview({
      container,
      getShape:()=>normalizeShape(shape),
      getActivePart:()=>{
        const parts=partSystem.getAllParts(shape);
        return parts.find((part)=>part.active)||{
          id:partSystem.activePartId,
          label:partSystem.getActiveDefinition()?.label||"選択中パーツ",
          shape:normalizeShape(shape)
        };
      },
      getParts:()=>partSystem.getAllParts(shape),
      getWeaponType:()=>selectedType,
      getMaterialProfile:()=>createWeaponMaterialProfile(
        selectedForgeOres.map((oreId)=>{
          const ore=ORE_DEFINITIONS[oreId];
          return ore?{
            name:ore.name,
            rarity:ore.rarity
          }:null;
        }).filter(Boolean)
      ),
      onStatus:(message,kind)=>{
        const status=$("weapon3DStatus");
        if(status){
          status.textContent=message;
          status.dataset.state=kind||"ok";
        }
      }
    });

    const status=$("weapon3DStatus");
    if(status)status.textContent="同期準備完了";

    $("reset3DView")?.addEventListener("click",()=>{
      weapon3DPreview?.resetView();
    });
  }catch(error){
    console.error("3Dプレビュー初期化失敗",error);
    container.innerHTML=`
      <div class="weapon-3d-error">
        3Dプレビューを開始できませんでした。<br>
        ページを更新してください。
      </div>
    `;
    const status=$("weapon3DStatus");
    if(status)status.textContent="読み込み失敗";
  }
}

function updateWeapon3DPreview(){
  weapon3DPreview?.scheduleUpdate();
}


function formatExplorationDuration(milliseconds){
  const seconds=Math.round(milliseconds/1000);

  if(seconds<60)return `${seconds}秒`;
  if(seconds%60===0)return `${seconds/60}分`;

  return `${Math.floor(seconds/60)}分${seconds%60}秒`;
}

function renderExploration(){
  const list=$("explorationDifficultyList");
  const activePanel=$("activeExplorationPanel");
  const historyHost=$("explorationHistory");
  const headerStatus=$("explorationHeaderStatus");

  if(!list||!activePanel)return;

  normalizeExplorationState(state);
  const completedNow=updateExplorationCompletion(state);

  if(completedNow){
    saveState(state);
  }

  const active=state.exploration.active;
  const difficulty=getActiveDifficulty(state);
  const pending=state.exploration.pendingRewards||[];

  if(active){
    const remaining=getExplorationRemainingMs(state);
    const completed=active.completed===true;

    if(headerStatus){
      headerStatus.textContent=completed
        ? `報酬 ${pending.length}個`
        : formatExplorationTime(remaining);
    }

    const rewardSummary=summarizeRewards(
      active.rewards||pending
    );

    activePanel.innerHTML=`
      <div class="active-exploration-card ${completed?"completed":""}">
        <div class="active-exploration-icon">
          ${difficulty?.icon||"🧭"}
        </div>

        <div class="active-exploration-content">
          <small>${completed?"EXPLORATION COMPLETE":"EXPLORING"}</small>
          <strong>${difficulty?.name||"探索"}探索</strong>
          <p>${completed
            ? "探索が完了しました。報酬を鉱石倉庫へ収納できます。"
            : difficulty?.description||"鉱脈を探索中です。"
          }</p>

          <div class="exploration-progress-track">
            <span style="width:${completed
              ? 100
              : Math.max(
                  0,
                  Math.min(
                    100,
                    ((Date.now()-active.startedAt)/
                      Math.max(1,active.endsAt-active.startedAt))*100
                  )
                )
            }%"></span>
          </div>

          <div class="exploration-live-status">
            <b>${completed
              ? `報酬 ${pending.length}個`
              : formatExplorationTime(remaining)
            }</b>
            <small>${completed
              ? "倉庫満杯分は受け取り保留になります"
              : new Date(active.endsAt).toLocaleTimeString(
                  "ja-JP",
                  {hour:"2-digit",minute:"2-digit",second:"2-digit"}
                )+" 完了予定"
            }</small>
          </div>

          ${completed&&rewardSummary.length
            ? `<div class="exploration-reward-preview">
                ${rewardSummary.slice(0,12).map(({ore,amount})=>`
                  <span style="--ore-color:${ore.color}">
                    ${ore.icon} ${ore.name} ×${amount}
                  </span>
                `).join("")}
                ${rewardSummary.length>12
                  ? `<span>ほか${rewardSummary.length-12}種類</span>`
                  : ""
                }
              </div>`
            : ""
          }

          <div class="exploration-active-actions">
            ${completed
              ? `<button type="button" class="primary" id="receiveExplorationRewards">
                  報酬を受け取る
                </button>`
              : `<button type="button" class="secondary danger" id="cancelExploration">
                  探索を中止
                </button>`
            }
          </div>
        </div>
      </div>
    `;
  }else{
    if(headerStatus)headerStatus.textContent="待機中";

    activePanel.innerHTML=`
      <div class="exploration-empty-state">
        <span>🧭</span>
        <strong>探索隊は待機中です</strong>
        <p>難易度を選択して鉱脈探索を開始してください。</p>
      </div>
    `;
  }

  list.innerHTML=EXPLORATION_DIFFICULTIES.map((item,index)=>`
    <article class="exploration-difficulty-card">
      <div class="exploration-difficulty-icon">${item.icon}</div>
      <div class="exploration-difficulty-main">
        <div class="exploration-difficulty-heading">
          <strong>${item.name}</strong>
          <span>${formatExplorationDuration(item.durationMs)}</span>
        </div>
        <p>${item.description}</p>
        <div class="exploration-difficulty-meta">
          <span>報酬 ${item.rewardMin}～${item.rewardMax}個</span>
          <span>${index>=3?"高レア期待":"鉱物採集"}</span>
        </div>
      </div>
      <button
        type="button"
        class="exploration-start-button"
        data-start-exploration="${item.id}"
        ${active?"disabled":""}
      >探索開始</button>
    </article>
  `).join("");

  if(historyHost){
    const history=state.exploration.history||[];

    historyHost.innerHTML=history.length
      ? history.map((entry)=>{
          const item=EXPLORATION_DIFFICULTIES.find(
            (difficulty)=>difficulty.id===entry.difficultyId
          );

          return `
            <div class="exploration-history-row">
              <span>${item?.icon||"🧭"}</span>
              <b>${item?.name||"探索"}</b>
              <small>${entry.rewardCount}個獲得</small>
              <time>${new Date(entry.completedAt).toLocaleString("ja-JP")}</time>
            </div>
          `;
        }).join("")
      : '<div class="exploration-history-empty">探索履歴はまだありません</div>';
  }

  bindExplorationButtons();
  manageExplorationTimer();
}

function bindExplorationButtons(){
  document.querySelectorAll("[data-start-exploration]").forEach((button)=>{
    button.onclick=()=>{
      const result=startExploration(
        state,
        button.dataset.startExploration
      );

      if(!result.success){
        toast("現在進行中の探索があります");
        return;
      }

      saveState(state);
      renderExploration();
      toast(`${result.difficulty.name}探索を開始しました`);
    };
  });

  const receiveButton=$("receiveExplorationRewards");
  if(receiveButton){
    receiveButton.onclick=()=>{
      const result=receivePendingExplorationRewards(
        state,
        oreInventory
      );

      state.oreInventory=oreInventory.toJSON();
      saveState(state);
      render();

      if(result.received.length){
        toast(`鉱物を${result.received.length}個受け取りました`);
      }

      if(result.remaining.length){
        toast(
          `倉庫満杯のため${result.remaining.length}個を保留中です`
        );
      }
    };
  }

  const cancelButton=$("cancelExploration");
  if(cancelButton){
    cancelButton.onclick=()=>{
      if(!confirm("探索を中止しますか？報酬は獲得できません。")){
        return;
      }

      if(cancelExploration(state)){
        saveState(state);
        renderExploration();
        toast("探索を中止しました");
      }
    };
  }
}

function manageExplorationTimer(){
  const active=state.exploration?.active;
  const shouldRun=active&&!active.completed;

  if(!shouldRun){
    if(explorationTimerId){
      clearInterval(explorationTimerId);
      explorationTimerId=null;
    }
    return;
  }

  if(explorationTimerId)return;

  explorationTimerId=setInterval(()=>{
    const completed=updateExplorationCompletion(state);

    if(completed){
      saveState(state);
      clearInterval(explorationTimerId);
      explorationTimerId=null;
      render();
      toast("探索が完了しました！");
      return;
    }

    if($("exploration")?.classList.contains("active")){
      renderExploration();
    }
  },1000);
}


function renderMaterialPreview(){
  const host=$("materialPreviewSummary");
  if(!host)return;

  const profile=createWeaponMaterialProfile(
    selectedForgeOres.map((oreId)=>{
      const ore=ORE_DEFINITIONS[oreId];
      return ore?{
        name:ore.name,
        rarity:ore.rarity
      }:null;
    }).filter(Boolean)
  );

  const primary=profile.primary;
  const secondary=profile.secondary;

  host.innerHTML=`
    <div class="material-preview-swatch">
      <span style="
        --primary:${primary.color};
        --secondary:${secondary?.color||primary.edgeColor};
        --glow:${primary.emissive};
      "></span>
    </div>
    <div class="material-preview-info">
      <small>MATERIAL ENGINE</small>
      <strong>${profile.name}</strong>
      <p>
        金属度 ${Math.round(primary.metalness*100)}% /
        粗さ ${Math.round(primary.roughness*100)}% /
        発光 ${Math.round(primary.emissiveIntensity*100)}%
      </p>
    </div>
  `;
}


function initializeForgeEffects(){
  const processView=$("processView");
  if(!processView||forgeEffectEngine)return;
  forgeEffectEngine=new ForgeEffectEngine(processView);
}

function initializeWorkshop3D(){
  const container=$("workshop3DViewport");
  if(!container||workshop3D)return;

  workshop3D=new Workshop3D({
    container,
    onSelect:({id,label})=>{
      const labelHost=$("workshopSelection");
      if(labelHost)labelHost.textContent=`選択中：${label}`;

      const destinations={
        anvil:"forge",
        forge:"process",
        workbench:"forge",
        storage:"inventory",
        ores:"ores",
        npc:"home"
      };

      const destination=destinations[id];
      if(destination){
        setTimeout(()=>go(destination),220);
      }
    }
  });

  $("resetWorkshopView")?.addEventListener("click",()=>{
    workshop3D?.resetView();
  });
}

function initializeInspect3D(){
  const container=$("inspect3DViewport");
  if(!container||inspect3DPreview)return;

  inspect3DPreview=new Weapon3DPreview({
    container,
    getShape:()=>selectedInspectWeapon?.shape||normalizeShape(shape),
    getActivePart:()=>({
      id:"blade",
      label:selectedInspectWeapon?.type||"武器",
      shape:selectedInspectWeapon?.shape||normalizeShape(shape)
    }),
    getParts:()=>selectedInspectWeapon?.shape?.parts?.items||null,
    getWeaponType:()=>selectedInspectWeapon?.shape?.weaponType||0,
    getMaterialProfile:()=>selectedInspectWeapon?.materialProfile||
      createWeaponMaterialProfile(selectedInspectWeapon?.forgeOres||[]),
    onStatus:()=>{}
  });
}

function openWeaponInspect(index){
  const weapon=state.weapons[index];
  if(!weapon)return;

  selectedInspectWeapon=weapon;
  go("inspect");
  initializeInspect3D();
  inspect3DPreview?.scheduleUpdate(true);
  renderInspectWeapon();
}

function renderInspectWeapon(){
  const weapon=selectedInspectWeapon;
  if(!weapon)return;

  $("inspectWeaponName").textContent=weapon.name;
  $("inspectWeaponStats").innerHTML=`
    <div class="inspect-stat"><span>レアリティ</span><b style="color:${weapon.color}">${weapon.rarity}</b></div>
    <div class="inspect-stat"><span>攻撃力</span><b>${weapon.attack}</b></div>
    <div class="inspect-stat"><span>品質</span><b>${weapon.quality}</b></div>
    <div class="inspect-stat"><span>シリアルNo.</span><b>${weapon.id}</b></div>
    <div class="inspect-stat"><span>使用鉱物</span><b>${weapon.forgeOres?.map((ore)=>ore.name).join(" / ")||"標準鋼"}</b></div>
    <div class="inspect-stat"><span>特殊効果</span><b>${weapon.oreEffects?.activations?.length||0}件発動</b></div>
    <div class="inspect-story">
      <small>WEAPON STORY</small>
      <p>${weapon.name}。${new Date(weapon.forgedAt).toLocaleDateString("ja-JP")}に鍛造された、形状ID ${weapon.shapeId} の一点物。</p>
    </div>
  `;
}

function downloadDataUrl(dataUrl,filename){
  const anchor=document.createElement("a");
  anchor.href=dataUrl;
  anchor.download=filename;
  anchor.click();
}

function createWeaponCardDataUrl(){
  const weapon=selectedInspectWeapon;
  const image=inspect3DPreview?.capturePNG();
  if(!weapon||!image)return null;

  const canvas=document.createElement("canvas");
  canvas.width=1200;
  canvas.height=630;
  const context=canvas.getContext("2d");
  const picture=new Image();

  return new Promise((resolve)=>{
    picture.onload=()=>{
      const gradient=context.createLinearGradient(0,0,1200,630);
      gradient.addColorStop(0,"#080d13");
      gradient.addColorStop(1,"#24150b");
      context.fillStyle=gradient;
      context.fillRect(0,0,1200,630);
      context.drawImage(picture,30,30,750,570);

      context.fillStyle="#efc66e";
      context.font="700 22px sans-serif";
      context.fillText("BLACK SMITH",820,90);

      context.fillStyle="#ffffff";
      context.font="700 40px sans-serif";
      wrapText(context,weapon.name,820,150,330,50);

      context.fillStyle=weapon.color||"#ffffff";
      context.font="700 24px sans-serif";
      context.fillText(weapon.rarity,820,275);

      context.fillStyle="#d7dee8";
      context.font="20px sans-serif";
      context.fillText(`攻撃力  ${weapon.attack}`,820,330);
      context.fillText(`品質    ${weapon.quality}`,820,370);
      context.fillText(`形状ID  ${weapon.shapeId}`,820,410);

      context.fillStyle="#7e8a9a";
      context.font="15px sans-serif";
      context.fillText(`SERIAL ${weapon.id}`,820,540);
      resolve(canvas.toDataURL("image/png"));
    };
    picture.src=image;
  });
}

function wrapText(context,text,x,y,maxWidth,lineHeight){
  const chars=[...String(text)];
  let line="";
  let offset=0;
  for(const char of chars){
    const test=line+char;
    if(context.measureText(test).width>maxWidth&&line){
      context.fillText(line,x,y+offset);
      line=char;
      offset+=lineHeight;
    }else{
      line=test;
    }
  }
  if(line)context.fillText(line,x,y+offset);
}

function renderTypes(){
  $("weaponTypes").innerHTML=TYPES.map((t,i)=>`<button class="type-button ${i===selectedType?"active":""}" data-type="${i}">${t.icon}<br><small>${t.name}</small></button>`).join("");
}
function renderControls(){
  const controls=[["width","全体幅",10,100],["thickness","厚み",5,100],["tip","刃先",0,100],["curve","反り",0,100]];
  $("shapeControls").innerHTML=`<div class="shape-grid">${controls.map(([k,l,min,max])=>`
    <div class="shape-control"><label><span>${l}</span><b data-live-shape="${k}">${Math.round(shape[k])}</b></label>
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
      <div class="advanced-control"><label><span>選択点の局所幅</span><b data-live-point="width">${Math.round((p.width||1)*100)}%</b></label><input type="range" min="15" max="220" value="${(p.width||1)*100}" data-point-prop="width"></div>
      <div class="advanced-control"><label><span>上側幅</span><b data-live-point="upper">${Math.round((p.upper||1)*100)}%</b></label><input type="range" min="15" max="220" value="${(p.upper||1)*100}" data-point-prop="upper"></div>
      <div class="advanced-control"><label><span>下側幅</span><b data-live-point="lower">${Math.round((p.lower||1)*100)}%</b></label><input type="range" min="15" max="220" value="${(p.lower||1)*100}" data-point-prop="lower"></div>
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
      <div class="advanced-control"><label><span>ズーム</span><b data-live-zoom>${Math.round(shape.zoom*100)}%</b></label><input type="range" min="65" max="180" value="${shape.zoom*100}" data-shape-zoom></div>
    </div></div>`;
  }else{
    host.innerHTML=`<div class="advanced-panel"><div class="preset-grid">
      ${[["straight","直剣"],["katana","刀"],["scythe","鎌"],["flame","炎刃"],["jagged","魔剣"],["spear","槍刃"]].map(([id,label])=>`<button class="preset-button" data-preset="${id}">${label}</button>`).join("")}
    </div></div>`;
  }
}

function updateEditorPreviewOnly(){
  scheduleEditorFrame();

  document.querySelectorAll("[data-live-shape]").forEach((label)=>{
    const key=label.dataset.liveShape;
    label.textContent=String(Math.round(Number(shape[key])||0));
  });

  const point=shape.points[selectedPoint]||shape.points[0];
  document.querySelectorAll("[data-live-point]").forEach((label)=>{
    const key=label.dataset.livePoint;
    label.textContent=`${Math.round((Number(point?.[key])||1)*100)}%`;
  });

  const zoomLabel=document.querySelector("[data-live-zoom]");
  if(zoomLabel)zoomLabel.textContent=`${Math.round((Number(shape.zoom)||1)*100)}%`;
}

function commitSliderState(){
  editorCore?.updateExternalDocument?.({
    version:1,
    weaponType:selectedType,
    shape:normalizeShape(shape)
  });
}

function renderBlueprints(){
  $("blueprintCount").textContent=state.blueprints.length;
  $("blueprintList").innerHTML=state.blueprints.map((b,i)=>`<button class="card menu" data-load-blueprint="${i}">
    <span>📐</span><span><b>${b.name}</b><small>${TYPES[b.shape.weaponType].name} / ${fingerprint(b.shape)}</small></span><span>読込</span></button>`).join("");
}
function renderInventory(){
  $("inventoryCount").textContent=state.weapons.length;
  $("inventoryGrid").innerHTML=state.weapons.map((w,i)=>`<button class="weapon-card" data-inspect-weapon="${i}">
    <span class="badge" style="color:${w.color}">${w.rarity}</span>
    <div class="inventory-preview">${w.shape ? createExactShapePreview(w.shape,w.type,`${w.id||i}_${i}`) : `<div class="icon">${w.icon}</div>`}</div>
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
  renderTypes();renderWeaponParts();renderPartTransformControls();renderControls();renderBlueprints();renderInventory();renderOreInventory();renderForgeOreSlots();renderOreGacha();renderExploration();renderMaterialPreview();updateWeapon3DPreview();if($("workshop")?.classList.contains("active"))initializeWorkshop3D();if($("inspect")?.classList.contains("active")){initializeInspect3D();renderInspectWeapon();}
  drawEditor(
    $("weaponEditor"),
    normalizeShape(shape),
    selectedPoint,
    `${TYPES[selectedType].name}・${partSystem.getActiveDefinition()?.label || ""}`
  );
  editorCore?.setDocument({
    version:1,
    weaponType:selectedType,
    shape:normalizeShape(shape)
  },{addToHistory:false,reason:"external-sync"});
}
function save(){saveState(state);render()}
function saveBlueprint(name=$("blueprintName").value||"無銘の設計図"){
  state.blueprints.unshift({
    id:String(Date.now()),
    name,
    shape:normalizeShape({
      ...shape,
      weaponType:selectedType,
      parts:partSystem.getPartsPayload(shape)
    })
  });
  save();toast("設計図を保存しました");
}
function loadBlueprint(i){const b=state.blueprints[i];if(!b)return;selectedType=b.shape.weaponType;
  partSystem.loadPartsPayload(selectedType,b.shape.parts,b.shape);
  shape=b.shape.parts
    ? partSystem.switchPart(b.shape.parts.activePartId,b.shape)
    : normalizeShape(b.shape);$("blueprintName").value=b.name;go("forge");toast("設計図を読み込みました")}

const forgeSystem = new ForgeSystem({
  types: TYPES,
  rarities: RARITIES,
  normalizeShape,
  fingerprint,
  getState: () => state,
  saveState: save,
  getShape: () => normalizeShape({
    ...shape,
    weaponType:selectedType,
    parts:partSystem.getPartsPayload(shape)
  }),
  getSelectedType: () => selectedType,
  getRemaining: remaining,
  getForgeOres: () => [...selectedForgeOres],
  validateForgeOres: validateForgeOreSelection,
  consumeForgeOres: consumeSelectedForgeOres,
  oreDefinitions: ORE_DEFINITIONS,
  go,
  toast,
  getElement: $,
  onForgeStep:(step)=>forgeEffectEngine?.trigger(step),
  onForgeComplete:(weapon)=>{
    forgeEffectEngine?.trigger(5);
    selectedInspectWeapon=weapon;
  }
});

function addPoint(){if(shape.points.length>=12)return toast("最大12点です");pushHistory();const p=[...shape.points].sort((a,b)=>a.x-b.x);let idx=0,gap=-1;for(let i=0;i<p.length-1;i++){const g=p[i+1].x-p[i].x;if(g>gap){gap=g;idx=i}}const a=p[idx],b=p[idx+1];p.splice(idx+1,0,{x:(a.x+b.x)/2,y:(a.y+b.y)/2,inX:-.05,inY:0,outX:.05,outY:0,smooth:true});shape.points=p;selectedPoint=idx+1;render()}
function removePoint(){deleteSelectedPoint()}
function smoothPoint(){pushHistory();const p=shape.points[selectedPoint];p.smooth=true;const lenIn=Math.hypot(p.inX,p.inY)||.08,lenOut=Math.hypot(p.outX,p.outY)||.08,angle=Math.atan2(p.outY,p.outX);p.outX=Math.cos(angle)*lenOut;p.outY=Math.sin(angle)*lenOut;p.inX=-Math.cos(angle)*lenIn;p.inY=-Math.sin(angle)*lenIn;render()}
function cornerPoint(){pushHistory();shape.points[selectedPoint].smooth=false;render()}
function mirror(){pushHistory();shape.points=shape.points.map(p=>({...p,x:1-p.x,inX:-p.outX,inY:p.outY,outX:-p.inX,outY:p.inY})).sort((a,b)=>a.x-b.x);render()}
function reset(){
  pushHistory();
  const currentPart=partSystem.activePartId;
  const fresh=new WeaponPartSystem(cloneShape(DEFAULT_SHAPE),selectedType);
  const definition=fresh.getDefinitions(selectedType).find((part)=>part.id===currentPart);
  shape=fresh.switchPart(definition?.id||fresh.activePartId,cloneShape(DEFAULT_SHAPE));
  partSystem.saveCurrentShape(shape);
  selectedPoint=0;
  render();
}


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
      normalizeShape(shape),
      selectedPoint,
      `${TYPES[selectedType].name}・${partSystem.getActiveDefinition()?.label || ""}`
    );

    // 2D描画が完了した同じフレームの最後で、最新形状を3Dへ渡す。
    updateWeapon3DPreview();
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
  if(partSystem.isActivePartLocked()){
    toast("このパーツはロックされています");
    return false;
  }

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
  if(partSystem.isActivePartLocked()){
    toast("このパーツはロックされています");
    return false;
  }

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
    if(partSystem.isActivePartLocked()){
      toast("このパーツはロックされています");
      return;
    }

    const h=e.target.closest("[data-handle]");
    const w=e.target.closest("[data-width-index]");
    const a=e.target.closest("[data-index]:not([data-handle]):not([data-width-index])");
    const t=h||w||a;
    if(!t)return;

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
  const t=e.target.closest("[data-type]");
  if(t){
    pushHistory();
    selectedType=Number(t.dataset.type);
    shape=partSystem.switchWeaponType(selectedType,shape);
    selectedPoint=0;
    editorCore?.camera.reset();
    render();
  }
  const partButton=e.target.closest("[data-part-id]");
  if(partButton){
    pushHistory();
    shape=partSystem.switchPart(partButton.dataset.partId,shape);
    selectedPoint=0;
    render();
  }

  const visibilityButton=e.target.closest("[data-part-visibility]");
  if(visibilityButton){
    pushHistory();
    partSystem.toggleVisibility(visibilityButton.dataset.partVisibility,shape);
    render();
  }

  const lockButton=e.target.closest("[data-part-lock]");
  if(lockButton){
    pushHistory();
    partSystem.toggleLock(lockButton.dataset.partLock,shape);
    render();
  }

  const moveButton=e.target.closest("[data-part-move]");
  if(moveButton){
    pushHistory();
    partSystem.movePart(
      moveButton.dataset.partMove,
      Number(moveButton.dataset.direction),
      shape
    );
    render();
  }


  const inspectButton=e.target.closest("[data-inspect-weapon]");
  if(inspectButton){
    openWeaponInspect(Number(inspectButton.dataset.inspectWeapon));
  }

  const workshopButton=e.target.closest("[data-workshop-go]");
  if(workshopButton){
    go(workshopButton.dataset.workshopGo);
  }

  const b=e.target.closest("[data-load-blueprint]");if(b)loadBlueprint(Number(b.dataset.loadBlueprint));
  const w=e.target.closest("[data-weapon]");if(w)forgeSystem.showWeapon(state.weapons[Number(w.dataset.weapon)]);
  const tab=e.target.closest("[data-editor-tab]");if(tab){activeEditorTab=tab.dataset.editorTab;document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x===tab));renderAdvancedPanel();}
  const preset=e.target.closest("[data-preset]");if(preset)applyPreset(preset.dataset.preset);
  const asym=e.target.closest("[data-toggle-asymmetry]");if(asym){pushHistory();shape.asymmetric=!shape.asymmetric;render();}
  if(e.target===$("modal"))$("modal").classList.remove("show");
});
document.addEventListener("input",(e)=>{
  const target=e.target;


  const transformKey=target.dataset?.partTransform;
  if(transformKey){
    const raw=Number(target.value);
    const patch={
      [transformKey]:
        (transformKey==="scaleX"||transformKey==="scaleY")
          ? raw/100
          : raw
    };
    partSystem.updateActiveTransform(patch,shape);
    updateEditorPreviewOnly();
    renderPartTransformControls();
    return;
  }

  if(target.hasAttribute("data-part-socket")){
    partSystem.updateActiveTransform({socket:target.value},shape);
    updateEditorPreviewOnly();
    return;
  }

  const shapeKey=target.dataset?.shape;
  if(shapeKey){
    shape[shapeKey]=Number(target.value);
    updateEditorPreviewOnly();
    return;
  }

  const pointProperty=target.dataset?.pointProp;
  if(pointProperty){
    const point=shape.points[selectedPoint];
    if(point){
      point[pointProperty]=Number(target.value)/100;
      updateEditorPreviewOnly();
    }
    return;
  }

  const selectKey=target.dataset?.shapeSelect;
  if(selectKey){
    pushHistory();
    shape[selectKey]=target.value;
    updateEditorPreviewOnly();
    commitSliderState();
    return;
  }

  if(target.hasAttribute("data-shape-zoom")){
    shape.zoom=Number(target.value)/100;
    updateEditorPreviewOnly();
    return;
  }

  if(target.id==="material"){
    pushHistory();
    shape.material=target.value;
    updateEditorPreviewOnly();
    commitSliderState();
    return;
  }

  if(target.id==="color"){
    shape.color=target.value;
    updateEditorPreviewOnly();
  }
});

document.addEventListener("pointerdown",(event)=>{
  if(event.target.matches('input[type="range"], input[type="color"], [data-part-socket]')){
    pushHistory();
  }
},{passive:true});


document.addEventListener("change",(event)=>{
  const select=event.target.closest("[data-forge-ore-slot]");
  if(!select)return;

  const index=Number(select.dataset.forgeOreSlot);

  if(!Number.isInteger(index)||index<0||index>=selectedForgeOres.length){
    return;
  }

  const previous=selectedForgeOres[index];
  const next=select.value||null;

  if(next&&!canSelectForgeOre(next,index)){
    const ore=ORE_DEFINITIONS[next];
    const owned=oreInventory.countOre(next);
    const selectedElsewhere=getSelectedOreCount(next,index);

    toast(
      `${ore?.name||next}は${owned}個所持中です。`+
      `すでに${selectedElsewhere}枠で使用しています`
    );

    select.value=previous||"";
    renderForgeOreSlots();
    return;
  }

  selectedForgeOres[index]=next;
  renderForgeOreSlots();
  renderMaterialPreview();
  updateWeapon3DPreview();
});

document.addEventListener("change",(event)=>{
  if(event.target.matches('input[type="range"], input[type="color"], [data-part-socket]')){
    commitSliderState();
  }
});


$("resetPartTransform")?.addEventListener("click",()=>{
  pushHistory();
  partSystem.resetActiveTransform(shape);
  editorCore?.camera.reset();
  render();
  toast("パーツ位置と表示をリセットしました");
});


$("cancelPartRename")?.addEventListener("click",closePartRename);
$("confirmPartRename")?.addEventListener("click",confirmPartRename);

$("partRenameInput")?.addEventListener("keydown",(event)=>{
  if(event.code==="Enter"){
    event.preventDefault();
    confirmPartRename();
  }

  if(event.code==="Escape"){
    event.preventDefault();
    closePartRename();
  }
});

$("partRenameModal")?.addEventListener("click",(event)=>{
  if(event.target===$("partRenameModal"))closePartRename();
});


$("inspectLight")?.addEventListener("change",(event)=>{
  inspect3DPreview?.setLightPreset(event.target.value);
});
$("inspectBackground")?.addEventListener("change",(event)=>{
  inspect3DPreview?.setBackground(event.target.value);
});
$("inspectReset")?.addEventListener("click",()=>{
  inspect3DPreview?.resetView();
});
$("captureInspect")?.addEventListener("click",()=>{
  const data=inspect3DPreview?.capturePNG();
  if(data)downloadDataUrl(data,`${selectedInspectWeapon?.name||"weapon"}.png`);
});
$("captureTransparent")?.addEventListener("click",()=>{
  const data=inspect3DPreview?.capturePNG({transparent:true});
  if(data)downloadDataUrl(data,`${selectedInspectWeapon?.name||"weapon"}_transparent.png`);
});
$("generateWeaponCard")?.addEventListener("click",async()=>{
  const data=await createWeaponCardDataUrl();
  if(data)downloadDataUrl(data,`${selectedInspectWeapon?.name||"weapon"}_card.png`);
});
$("shareWeapon")?.addEventListener("click",async()=>{
  const data=await createWeaponCardDataUrl();
  if(!data)return;

  try{
    const blob=await (await fetch(data)).blob();
    const file=new File([blob],"black-smith-weapon.png",{type:"image/png"});
    if(navigator.share&&navigator.canShare?.({files:[file]})){
      await navigator.share({
        title:selectedInspectWeapon?.name||"BLACK Smith",
        text:"BLACK Smithで鍛造した武器",
        files:[file]
      });
    }else{
      downloadDataUrl(data,`${selectedInspectWeapon?.name||"weapon"}_share.png`);
      toast("共有用画像を保存しました");
    }
  }catch(error){
    console.error(error);
    toast("共有を完了できませんでした");
  }
});

$("enterButton").onclick=enter;$("undoShape").onclick=undo;$("redoShape").onclick=redo;$("addPoint").onclick=addPoint;$("removePoint").onclick=removePoint;$("smoothPoint").onclick=smoothPoint;$("cornerPoint").onclick=cornerPoint;$("mirrorShape").onclick=mirror;$("duplicatePoint").onclick=duplicateSelectedPoint;$("resetShape").onclick=reset;$("saveBlueprint").onclick=()=>saveBlueprint();$("saveBlueprintFromForge").onclick=()=>saveBlueprint(`${TYPES[selectedType].name}設計図`);$("startForge").onclick=()=>forgeSystem.start();$("advanceForge").onclick=()=>forgeSystem.advance();
bindEditor();bindPointEditing();initializeEditorCore();initializeWeapon3DPreview();initializeForgeEffects();initializeWorkshop3D();bindCanvasControls();resetDaily();render();
