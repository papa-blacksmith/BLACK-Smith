import { TYPES, RARITIES, DIFFICULTIES, BACKGROUNDS } from './systems.js';
import { DEFAULT_SHAPE, cloneShape, normalizeShape, shapeFingerprint } from './shapeModel.js';

const DEFAULT={used:0,day:'',weapons:[],blueprints:[],backgrounds:[],explore:null,rank:'F'};
let state=loadState(), selectedType=0, blueprintType=0, forgeContext=null, step=0, quality=50, selectedDifficulty=0;
let currentShape=cloneShape(DEFAULT_SHAPE);

const $=id=>document.getElementById(id);
function loadState(){
  try{
    const loaded=Object.assign({},DEFAULT,JSON.parse(localStorage.getItem('blacksmith_repo_v051')||'{}'));
    loaded.blueprints=Array.isArray(loaded.blueprints)?loaded.blueprints.map(bp=>({...bp,shape:normalizeShape(bp.shape||{weaponType:bp.type||0})})):[];
    return loaded;
  }catch(e){return {...DEFAULT}}
}
function saveState(){localStorage.setItem('blacksmith_repo_v051',JSON.stringify(state));renderAll()}
function dayKey(){const d=new Date();if(d.getHours()<5)d.setDate(d.getDate()-1);return d.toISOString().slice(0,10)}
function resetDaily(){const key=dayKey();if(state.day!==key){state.day=key;state.used=0;saveState()}}
function maxForges(){return 3+(['SS','SSS','BLACK Smith'].includes(state.rank)?1:0)+(state.rank==='BLACK Smith'?1:0)}
function remaining(){return Math.max(0,maxForges()-state.used)}
function showToast(text){const el=$('toast');el.textContent=text;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1700)}
function go(page){resetDaily();document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active'));$(page).classList.add('active');document.querySelectorAll('.nav button').forEach(x=>x.classList.toggle('active',x.dataset.page===page));renderAll();scrollTo(0,0)}
function enter(){$('nav').style.display='grid';go('home')}
function randomInt(a,b){return Math.floor(Math.random()*(b-a+1))+a}
function rollRarity(){let n=Math.random()*100,total=0;for(const rarity of RARITIES){total+=rarity.probability;if(n<total)return rarity}return RARITIES.at(-1)}
function rollBackground(){let n=Math.random()*100,total=0;for(const bg of BACKGROUNDS){total+=bg.probability;if(n<total)return bg.name}return null}
function rollSkill(type){const n=Math.random()*100;if(n>=5)return {tier:'ノースキル'};const atk=n<.5?randomInt(100,150):n<1?randomInt(80,150):randomInt(10,150),agi=n<.5?randomInt(20,50):0;let active=null;if(n<.5&&Math.random()<.5){const pool=['ソウルインジェクション','神殺し'];const map={'ナックル':'ヴェノムスプラッシュ','ハンマー':'グラビティプレス','斧':'グラビティプレス','大剣':'レイジングスラッシュ','双剣':'シャドウスタブ','ダガー':'シャドウスタブ','槍':'スパイラルランス'};if(map[type])pool.push(map[type]);active=pool[randomInt(0,pool.length-1)]}return {tier:n<.01?'神域':n<.5?'超希少':n<1?'希少':'付与',atk,agi,active}}
function createWeapon(type,source){const rarity=rollRarity(),curse=['F','E','D','C','B'].includes(state.rank)&&Math.random()<.05,transcended=Math.random()<.01;let name=['黒鉄','灼熱','蒼雷','月影','星喰','歪曲'][randomInt(0,5)]+'の'+type.name;if(curse)name='呪われた'+name;if(transcended)name='超越した'+name;const background=rollBackground();if(background&&!state.backgrounds.includes(background))state.backgrounds.push(background);const penalty=curse?.8:1,boost=transcended?1.1:1;return {id:String(Date.now()+Math.random()),name,type:type.name,icon:type.icon,rarity:rarity.name,color:rarity.color,attack:Math.round(randomInt(80,150)*rarity.multiplier*penalty*boost),agility:Math.round(randomInt(20,60)*penalty*boost),skill:rollSkill(type.name),background,source,code:'BS-'+Math.random().toString(36).slice(2,6).toUpperCase()+'-'+Math.random().toString(36).slice(2,8).toUpperCase()}}
function renderTypes(){
  $('typeGrid').innerHTML=TYPES.map((t,i)=>`<button class="choice ${i===selectedType?'active':''}" data-type="${i}" data-mode="forge">${t.icon}<br><small>${t.name}</small></button>`).join('');
  $('bpTypeGrid').innerHTML=TYPES.map((t,i)=>`<button class="choice ${i===blueprintType?'active':''}" data-type="${i}" data-mode="blueprint">${t.icon}<br><small>${t.name}</small></button>`).join('');
  $('typeLabel').textContent=TYPES[selectedType].name;
  $('bpTypeLabel').textContent=TYPES[blueprintType].name;
}
function updatePreview(){
  currentShape.weaponType=selectedType;
  renderSharedShapeControls();
  drawShape($('forgeShapeSvg'),currentShape);
  const bpShape={...currentShape,weaponType:blueprintType};
  drawShape($('bpShapeSvg'),bpShape);
  $('forgePreview').textContent=TYPES[selectedType].icon;
  $('bpPreview').textContent=TYPES[blueprintType].icon;
}deg) scale(${.75+(+$('lengthRange').value/170)})`;$('bpPreview').textContent=TYPES[blueprintType].icon}
function saveBlueprint(){
  const shape=normalizeShape({...currentShape,weaponType:blueprintType});
  state.blueprints.unshift({
    id:String(Date.now()+Math.random()),
    name:$('bpName').value||'無銘の設計図',
    type:blueprintType,
    shape,
    fingerprint:shapeFingerprint(shape),
    version:1,
    createdAt:new Date().toISOString()
  });
  saveState();
  showToast('形状データ付き設計図を保存しました');
});saveState();showToast('設計図を保存しました')}
function startForge(source){
  if(remaining()<=0)return showToast('本日の鍛造回数を使い切りました');
  if(state.weapons.length>=14)return showToast('保管庫が満杯です');
  const typeIndex=source==='設計図鍛造'?blueprintType:selectedType;
  forgeContext={
    source,
    type:typeIndex,
    shape:normalizeShape({...currentShape,weaponType:typeIndex})
  };
  step=0;quality=50;go('process');
};step=0;quality=50;go('process')}
const STEP_NAMES=['加熱','鍛打','成形','焼入れ','仕上げ','完成'];
function renderProcess(){$('steps').innerHTML=STEP_NAMES.map((s,i)=>`<div class="step ${i===step?'active':''}">${s}</div>`).join('');$('processText').textContent=['素材を赤熱させます','芯を鍛えます','輪郭を整えます','硬度を定着させます','刃と刻印を仕上げます','最後の一打を入れます'][step];$('processBtn').textContent=step===5?'完成させる':STEP_NAMES[step]+'する';$('processIcon').textContent=step<1?'🔥':step<4?TYPES[forgeContext.type].icon:'✨';$('quality').textContent=quality}
function advanceForge(){quality=Math.min(100,quality+randomInt(4,11));if(step<5){step++;renderProcess()}else{const weapon=createWeapon(TYPES[forgeContext.type],forgeContext.source);weapon.quality=quality;weapon.shape=normalizeShape(forgeContext.shape);weapon.shapeFingerprint=shapeFingerprint(weapon.shape);state.weapons.unshift(weapon);state.used++;saveState();showWeapon(weapon)}}
function showWeapon(w){$('sheet').innerHTML=`<h3 style="text-align:center">鍛造完了</h3><div class="preview"><div class="bigWeapon">${w.icon}</div></div><div style="text-align:center"><span class="badge" style="color:${w.color}">${w.rarity}</span><h2>${w.name}</h2>${w.background?`<p style="color:#d9a8ff">特殊背景：${w.background}</p>`:''}</div><div class="row"><span>攻撃力</span><b>${w.attack}</b></div><div class="row"><span>俊敏</span><b>${w.agility}</b></div><div class="row"><span>スキル</span><b>${w.skill.tier}</b></div>${w.skill.atk?`<div class="row"><span>攻撃補正</span><b>+${w.skill.atk}%</b></div>`:''}${w.skill.agi?`<div class="row"><span>俊敏補正</span><b>+${w.skill.agi}%</b></div>`:''}${w.skill.active?`<div class="row"><span>アクティブ</span><b>${w.skill.active}</b></div>`:''}<button class="primary mt12" data-close-modal>保管庫へ</button>`;$('modal').classList.add('show')}
function renderInventory(){$('invCount').textContent=state.weapons.length;$('inventoryGrid').innerHTML=state.weapons.map((w,i)=>`<button class="weaponCard" data-weapon-index="${i}"><span class="badge" style="color:${w.color}">${w.rarity}</span><div class="icon">${w.icon}</div><b>${w.name}</b><small class="muted">${w.type}</small></button>`).join('')||'<div class="muted">まだ武器がありません</div>'}
function renderExplore(){$('exploreOptions').innerHTML=DIFFICULTIES.map((d,i)=>`<div class="explore ${i===selectedDifficulty?'active':''}" data-diff="${i}"><b>${d.name}</b><span style="float:right">${Math.round(d.durationMs/60000*10)/10}分</span></div>`).join('');if(state.explore){$('exploreOptions').style.display='none';$('exploreBtn').style.display='none';$('running').classList.remove('hidden');const now=Date.now(),done=now>=state.explore.end,left=Math.max(0,state.explore.end-now),total=state.explore.end-state.explore.start;$('runningLabel').textContent=done?'探索から帰還しました':`残り ${Math.ceil(left/1000)}秒`;$('progress').style.width=(done?100:(1-left/total)*100)+'%';$('exploreStatus').textContent=done?'帰還済み':'探索中'}else{$('exploreOptions').style.display='block';$('exploreBtn').style.display='block';$('running').classList.add('hidden');$('exploreStatus').textContent='待機中'}}
function startExplore(){if(state.explore)return;const d=DIFFICULTIES[selectedDifficulty],now=Date.now();state.explore={start:now,end:now+d.durationMs,min:d.rewardMin,max:d.rewardMax};saveState()}
function claimExplore(){if(!state.explore||Date.now()<state.explore.end)return showToast('まだ探索中です');const amount=randomInt(state.explore.min,state.explore.max);state.explore=null;saveState();showToast(`鉱石を${amount}個獲得しました`)}
function renderAll(){resetDailySafe();$('remainTop').textContent=`${remaining()}/${maxForges()}`;$('remainForge').textContent=`${remaining()}/${maxForges()}`;$('heroWeapon').textContent=state.weapons[0]?.icon||'⚔️';$('bpCount').textContent=state.blueprints.length;$('bpList').innerHTML=state.blueprints.map((b,i)=>`<button class="card menu" data-blueprint-index="${i}"><span>📐</span><span><b>${b.name}</b><small>${TYPES[b.type].name} / ${b.fingerprint||shapeFingerprint(b.shape||{})}</small></span><span>読込</span></button>`).join('');$('bgCount').textContent=state.backgrounds.length;$('bgGrid').innerHTML=BACKGROUNDS.map(b=>`<div class="weaponCard"><b>${state.backgrounds.includes(b.name)?b.name:'？？？？'}</b></div>`).join('');renderTypes();updatePreview();renderInventory();renderExplore();if($('process').classList.contains('active'))renderProcess()}
function resetDailySafe(){const k=dayKey();if(state.day!==k){state.day=k;state.used=0;localStorage.setItem('blacksmith_repo_v051',JSON.stringify(state))}}


function renderSharedShapeControls(){
  const host=$('sharedShapeControls');
  if(!host)return;
  const controls=[
    ['length','長さ',20,100],
    ['width','幅',10,100],
    ['thickness','厚み',5,100],
    ['curve','反り',0,100],
    ['twist','ねじれ',-50,50],
    ['tip','刃先',0,100],
    ['notch','切れ込み',0,100],
    ['ornament','装飾',0,100]
  ];
  host.innerHTML=`<div class="shape-grid">${controls.map(([key,label,min,max])=>`
    <div class="shape-control">
      <label><span>${label}</span><b>${Math.round(currentShape[key])}</b></label>
      <input type="range" min="${min}" max="${max}" value="${currentShape[key]}" data-shape-key="${key}">
    </div>`).join('')}</div>
    <div class="control material-row">
      <select id="shapeMaterial">
        ${['黒鉄','鋼','炎鋼','氷晶鋼','雷鋼','ミスリル','黒曜石'].map(x=>`<option ${currentShape.material===x?'selected':''}>${x}</option>`).join('')}
      </select>
      <input id="shapeColor" type="color" value="${currentShape.color}">
    </div>`;
}

function drawShape(svg,shapeInput){
  if(!svg)return;
  const shape=normalizeShape(shapeInput);
  const type=TYPES[shape.weaponType]||TYPES[0];
  const startX=110;
  const usable=760;
  const centerY=180;
  const width=26+shape.width*.72;
  const pointPairs=shape.points.map((p,i)=>{
    const x=startX+p.x*usable;
    const y=55+p.y*250;
    return {x,y,index:i};
  }).sort((a,b)=>a.x-b.x);

  const top=pointPairs.map((p,i)=>{
    const wave=Math.sin(i*1.8)*(shape.curve-50)*.25;
    return {x:p.x,y:p.y-width/2+wave};
  });
  const bottom=[...pointPairs].reverse().map((p,i)=>{
    const wave=Math.sin((pointPairs.length-1-i)*1.8)*(shape.curve-50)*.12;
    return {x:p.x,y:p.y+width/2+wave};
  });

  const tipX=Math.min(930,pointPairs.at(-1).x+25+shape.tip*.45);
  const tipY=pointPairs.at(-1).y;
  const bladePath=[
    `M ${top[0].x} ${top[0].y}`,
    ...top.slice(1).map(p=>`L ${p.x} ${p.y}`),
    `L ${tipX} ${tipY}`,
    ...bottom.map(p=>`L ${p.x} ${p.y}`),
    'Z'
  ].join(' ');

  const controlPath=pointPairs.map((p,i)=>(i===0?'M':'L')+` ${p.x} ${p.y}`).join(' ');
  const notchDepth=shape.notch*.28;
  const notchX=startX+usable*.62;

  svg.innerHTML=`
    <defs>
      <linearGradient id="metal-${svg.id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffffff"/>
        <stop offset=".28" stop-color="${shape.color}"/>
        <stop offset=".68" stop-color="#6d7380"/>
        <stop offset="1" stop-color="#232832"/>
      </linearGradient>
      <filter id="glow-${svg.id}">
        <feGaussianBlur stdDeviation="${2+shape.ornament/25}" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    ${[1,2,3,4,5,6,7,8,9].map(i=>`<line class="shape-grid-line" x1="${i*100}" y1="0" x2="${i*100}" y2="360"/>`).join('')}
    ${[1,2,3].map(i=>`<line class="shape-grid-line" x1="0" y1="${i*90}" x2="1000" y2="${i*90}"/>`).join('')}
    <path d="${bladePath}" fill="url(#metal-${svg.id})" stroke="#f1d08a" stroke-width="${1+shape.thickness/35}" filter="url(#glow-${svg.id})"/>
    ${shape.notch>3?`<path d="M ${notchX} ${tipY-width*.45} l ${notchDepth} ${width*.38} l ${notchDepth} ${-width*.42}" fill="none" stroke="#10141c" stroke-width="${5+shape.thickness/18}"/>`:''}
    <rect x="${startX-20}" y="${centerY-48}" width="24" height="96" rx="8" fill="#ad7434"/>
    <rect x="${startX-105}" y="${centerY-18}" width="90" height="36" rx="10" fill="#40292a"/>
    <circle cx="${startX-2}" cy="${centerY}" r="${14+shape.ornament/10}" fill="none" stroke="#e6b85e" stroke-width="4"/>
    <path class="control-line" d="${controlPath}" fill="none"/>
    ${pointPairs.map(p=>`<circle class="control-point" data-point-index="${p.index}" cx="${p.x}" cy="${p.y}" r="10" fill="#f7f8fa" stroke="#171b24" stroke-width="4"/>`).join('')}
    <text x="28" y="38" fill="#e6b85e" font-size="22">${type.name}</text>
    <text x="28" y="326" fill="#9aa4b4" font-size="17">${shapeFingerprint(shape)}</text>`;
}

function loadBlueprint(index){
  const bp=state.blueprints[index];
  if(!bp)return;
  currentShape=normalizeShape(bp.shape||{weaponType:bp.type});
  selectedType=currentShape.weaponType;
  blueprintType=currentShape.weaponType;
  $('bpName').value=bp.name;
  renderTypes();
  updatePreview();
  showToast(`設計図「${bp.name}」を読み込みました`);
}


let draggedPointIndex=null;

function svgPointFromEvent(svg,event){
  const point=svg.createSVGPoint();
  point.x=event.clientX;
  point.y=event.clientY;
  const matrix=svg.getScreenCTM();
  if(!matrix)return {x:0,y:0};
  const local=point.matrixTransform(matrix.inverse());
  return {x:local.x,y:local.y};
}

function updateDraggedPoint(svg,event){
  if(draggedPointIndex===null)return;
  const local=svgPointFromEvent(svg,event);
  const nx=Math.max(0.03,Math.min(0.97,(local.x-110)/760));
  const ny=Math.max(0.05,Math.min(0.95,(local.y-55)/250));
  currentShape.points[draggedPointIndex]={x:nx,y:ny};
  currentShape.points.sort((a,b)=>a.x-b.x);
  draggedPointIndex=currentShape.points.findIndex(p=>Math.abs(p.x-nx)<.0001&&Math.abs(p.y-ny)<.0001);
  updatePreview();
}

function addControlPoint(){
  if(currentShape.points.length>=12)return showToast('制御点は最大12個です');
  const points=[...currentShape.points].sort((a,b)=>a.x-b.x);
  let bestIndex=0,bestGap=-1;
  for(let i=0;i<points.length-1;i++){
    const gap=points[i+1].x-points[i].x;
    if(gap>bestGap){bestGap=gap;bestIndex=i}
  }
  const a=points[bestIndex],b=points[bestIndex+1];
  points.splice(bestIndex+1,0,{x:(a.x+b.x)/2,y:(a.y+b.y)/2});
  currentShape.points=points;
  updatePreview();
  showToast('制御点を追加しました');
}

function removeControlPoint(){
  if(currentShape.points.length<=2)return showToast('制御点は最低2個必要です');
  currentShape.points.pop();
  updatePreview();
  showToast('最後の制御点を削除しました');
}

function mirrorShape(){
  currentShape.points=currentShape.points.map(p=>({x:1-p.x,y:p.y})).sort((a,b)=>a.x-b.x);
  currentShape.twist*=-1;
  updatePreview();
  showToast('形状を左右反転しました');
}

function resetCurrentShape(){
  const weaponType=selectedType;
  currentShape=cloneShape(DEFAULT_SHAPE);
  currentShape.weaponType=weaponType;
  updatePreview();
  showToast('形状を初期状態へ戻しました');
}

function bindShapeEditor(svg){
  if(!svg)return;
  svg.addEventListener('pointerdown',event=>{
    const target=event.target.closest?.('[data-point-index]');
    if(!target)return;
    draggedPointIndex=Number(target.dataset.pointIndex);
    svg.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  });
  svg.addEventListener('pointermove',event=>{
    if(draggedPointIndex===null)return;
    updateDraggedPoint(svg,event);
    event.preventDefault();
  });
  const stop=()=>{draggedPointIndex=null};
  svg.addEventListener('pointerup',stop);
  svg.addEventListener('pointercancel',stop);
}

document.addEventListener('click',e=>{const goBtn=e.target.closest('[data-go]');if(goBtn)go(goBtn.dataset.go);const navBtn=e.target.closest('[data-page]');if(navBtn)go(navBtn.dataset.page);const typeBtn=e.target.closest('[data-type]');if(typeBtn){if(typeBtn.dataset.mode==='forge')selectedType=+typeBtn.dataset.type;else blueprintType=+typeBtn.dataset.type;renderTypes();updatePreview()}const diffBtn=e.target.closest('[data-diff]');if(diffBtn){selectedDifficulty=+diffBtn.dataset.diff;renderExplore()}const weaponBtn=e.target.closest('[data-weapon-index]');if(weaponBtn)showWeapon(state.weapons[+weaponBtn.dataset.weaponIndex]);const bpBtn=e.target.closest('[data-blueprint-index]');if(bpBtn)loadBlueprint(+bpBtn.dataset.blueprintIndex);if(e.target.closest('[data-close-modal]')){$('modal').classList.remove('show');go('inventory')}if(e.target===$('modal'))$('modal').classList.remove('show')})
document.querySelector('[data-action="enter"]').onclick=enter;
document.querySelector('[data-action="save-blueprint"]').onclick=saveBlueprint;
document.querySelector('[data-action="save-current-blueprint"]').onclick=()=>{blueprintType=selectedType;$('bpName').value=`${TYPES[selectedType].name}設計図`;saveBlueprint();};
document.querySelector('[data-action="add-point"]').onclick=addControlPoint;
document.querySelector('[data-action="remove-point"]').onclick=removeControlPoint;
document.querySelector('[data-action="mirror-shape"]').onclick=mirrorShape;
document.querySelector('[data-action="reset-shape"]').onclick=resetCurrentShape;
document.querySelector('[data-action="start-free-forge"]').onclick=()=>startForge('自由鍛造');
document.querySelector('[data-action="start-blueprint-forge"]').onclick=()=>startForge('設計図鍛造');
document.querySelector('[data-action="advance-forge"]').onclick=advanceForge;
document.querySelector('[data-action="start-explore"]').onclick=startExplore;
document.querySelector('[data-action="claim-explore"]').onclick=claimExplore;
document.addEventListener('input',e=>{
  const key=e.target.dataset?.shapeKey;
  if(key){
    currentShape[key]=Number(e.target.value);
    updatePreview();
  }
  if(e.target.id==='shapeMaterial'){currentShape.material=e.target.value;updatePreview()}
  if(e.target.id==='shapeColor'){currentShape.color=e.target.value;updatePreview()}
});
bindShapeEditor($('forgeShapeSvg'));
bindShapeEditor($('bpShapeSvg'));
setInterval(()=>{if($('explore').classList.contains('active'))renderExplore()},1000);
resetDaily();renderAll();
