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

function cubicBezier(p0,p1,p2,p3,t){
  const u=1-t;
  return {
    x:u*u*u*p0.x+3*u*u*t*p1.x+3*u*t*t*p2.x+t*t*t*p3.x,
    y:u*u*u*p0.y+3*u*u*t*p1.y+3*u*t*t*p2.y+t*t*t*p3.y
  };
}

function sampleBezierCenterline(shape){
  const startX=110, usableX=760, startY=55, usableY=250;
  const anchors=shape.points.map((p,index)=>({
    index,
    x:startX+p.x*usableX,
    y:startY+p.y*usableY,
    inX:(p.x+p.inX)*usableX+startX,
    inY:(p.y+p.inY)*usableY+startY,
    outX:(p.x+p.outX)*usableX+startX,
    outY:(p.y+p.outY)*usableY+startY
  }));
  const samples=[];
  for(let i=0;i<anchors.length-1;i++){
    const a=anchors[i],b=anchors[i+1];
    const p0={x:a.x,y:a.y},p1={x:a.outX,y:a.outY},p2={x:b.inX,y:b.inY},p3={x:b.x,y:b.y};
    const steps=18;
    for(let s=0;s<steps;s++){
      const t=s/steps;
      samples.push(cubicBezier(p0,p1,p2,p3,t));
    }
  }
  samples.push({x:anchors.at(-1).x,y:anchors.at(-1).y});
  return {anchors,samples};
}

function drawShape(svg,shapeInput){
  if(!svg)return;
  const shape=normalizeShape(shapeInput);
  const type=TYPES[shape.weaponType]||TYPES[0];
  const {anchors,samples}=sampleBezierCenterline(shape);
  const baseWidth=24+shape.width*.72;
  const top=[],bottom=[];

  samples.forEach((p,i)=>{
    const before=samples[Math.max(0,i-1)],after=samples[Math.min(samples.length-1,i+1)];
    const dx=after.x-before.x,dy=after.y-before.y;
    const len=Math.hypot(dx,dy)||1;
    const nx=-dy/len,ny=dx/len;
    const taper=1-(i/(samples.length-1))*Math.min(.62,shape.tip/145);
    const wave=Math.sin((i/(samples.length-1))*Math.PI*4)*(shape.curve-50)*.08;
    const half=Math.max(3,baseWidth*taper/2+wave);
    top.push({x:p.x+nx*half,y:p.y+ny*half});
    bottom.push({x:p.x-nx*half,y:p.y-ny*half});
  });

  const tipBase=samples.at(-1);
  const prev=samples.at(-2)||tipBase;
  const tdx=tipBase.x-prev.x,tdy=tipBase.y-prev.y,tlen=Math.hypot(tdx,tdy)||1;
  const tipLength=22+shape.tip*.65;
  const tip={x:tipBase.x+tdx/tlen*tipLength,y:tipBase.y+tdy/tlen*tipLength};
  const bladePath=[
    `M ${top[0].x} ${top[0].y}`,
    ...top.slice(1).map(p=>`L ${p.x} ${p.y}`),
    `L ${tip.x} ${tip.y}`,
    ...bottom.reverse().map(p=>`L ${p.x} ${p.y}`),
    'Z'
  ].join(' ');

  const notchIndex=Math.floor(samples.length*.62);
  const notchPoint=samples[notchIndex];
  const notchDepth=shape.notch*.28;
  const selected=Number.isInteger(selectedPointIndex)?selectedPointIndex:-1;

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
    ${shape.notch>3?`<path d="M ${notchPoint.x} ${notchPoint.y-baseWidth*.35} l ${notchDepth} ${baseWidth*.32} l ${notchDepth} ${-baseWidth*.38}" fill="none" stroke="#10141c" stroke-width="${5+shape.thickness/18}"/>`:''}
    <rect x="5" y="132" width="95" height="36" rx="10" fill="#40292a" transform="translate(0 30)"/>
    <rect x="90" y="132" width="24" height="96" rx="8" fill="#ad7434"/>
    <circle cx="108" cy="180" r="${14+shape.ornament/10}" fill="none" stroke="#e6b85e" stroke-width="4"/>
    ${anchors.map(a=>`
      <line class="bezier-handle-line" x1="${a.x}" y1="${a.y}" x2="${a.inX}" y2="${a.inY}"/>
      <line class="bezier-handle-line" x1="${a.x}" y1="${a.y}" x2="${a.outX}" y2="${a.outY}"/>
      <circle class="bezier-handle" data-handle="in" data-point-index="${a.index}" cx="${a.inX}" cy="${a.inY}" r="7" fill="#e6b85e" stroke="#171b24" stroke-width="3"/>
      <circle class="bezier-handle" data-handle="out" data-point-index="${a.index}" cx="${a.outX}" cy="${a.outY}" r="7" fill="#e6b85e" stroke="#171b24" stroke-width="3"/>
      <circle class="control-point ${a.index===selected?'selected':''}" data-point-index="${a.index}" cx="${a.x}" cy="${a.y}" r="10" fill="#f7f8fa" stroke="#171b24" stroke-width="4"/>
    `).join('')}
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
let draggedHandle=null;
let selectedPointIndex=0;

function svgPointFromEvent(svg,event){
  const point=svg.createSVGPoint();
  point.x=event.clientX;
  point.y=event.clientY;
  const matrix=svg.getScreenCTM();
  if(!matrix)return {x:0,y:0};
  const local=point.matrixTransform(matrix.inverse());
  return {x:local.x,y:local.y};
}

function updateDraggedElement(svg,event){
  if(draggedPointIndex===null)return;
  const local=svgPointFromEvent(svg,event);
  const point=currentShape.points[draggedPointIndex];
  if(!point)return;

  if(draggedHandle){
    const hx=Math.max(-.35,Math.min(.35,(local.x-110)/760-point.x));
    const hy=Math.max(-.35,Math.min(.35,(local.y-55)/250-point.y));
    point[draggedHandle+'X']=hx;
    point[draggedHandle+'Y']=hy;

    if(point.smooth){
      const opposite=draggedHandle==='in'?'out':'in';
      const currentLength=Math.hypot(point[opposite+'X'],point[opposite+'Y'])||Math.hypot(hx,hy);
      const length=Math.hypot(hx,hy)||1;
      point[opposite+'X']=-hx/length*currentLength;
      point[opposite+'Y']=-hy/length*currentLength;
    }
  }else{
    const oldX=point.x,oldY=point.y;
    const nx=Math.max(0.02,Math.min(0.98,(local.x-110)/760));
    const ny=Math.max(0.05,Math.min(0.95,(local.y-55)/250));
    point.x=nx;point.y=ny;
    const dx=nx-oldX,dy=ny-oldY;
    // Handles are relative, so they naturally move with the anchor.
    currentShape.points.sort((a,b)=>a.x-b.x);
    draggedPointIndex=currentShape.points.indexOf(point);
    selectedPointIndex=draggedPointIndex;
  }
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
  points.splice(bestIndex+1,0,{
    x:(a.x+b.x)/2,
    y:(a.y+b.y)/2,
    inX:-Math.max(.035,(b.x-a.x)*.18),
    inY:0,
    outX:Math.max(.035,(b.x-a.x)*.18),
    outY:0,
    smooth:true
  });
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


function smoothSelectedPoint(){
  const p=currentShape.points[selectedPointIndex];
  if(!p)return showToast('先に白い頂点を選択してください');
  p.smooth=true;
  const outLength=Math.hypot(p.outX,p.outY)||.08;
  const inLength=Math.hypot(p.inX,p.inY)||.08;
  const angle=Math.atan2(p.outY,p.outX);
  p.outX=Math.cos(angle)*outLength;p.outY=Math.sin(angle)*outLength;
  p.inX=-Math.cos(angle)*inLength;p.inY=-Math.sin(angle)*inLength;
  updatePreview();showToast('選択点を滑らかな曲線にしました');
}

function cornerSelectedPoint(){
  const p=currentShape.points[selectedPointIndex];
  if(!p)return showToast('先に白い頂点を選択してください');
  p.smooth=false;
  updatePreview();showToast('選択点を角として独立編集できます');
}

function bindShapeEditor(svg){
  if(!svg)return;
  svg.addEventListener('pointerdown',event=>{
    const handle=event.target.closest?.('[data-handle]');
    const anchor=event.target.closest?.('.control-point');
    const target=handle||anchor;
    if(!target)return;
    draggedPointIndex=Number(target.dataset.pointIndex);
    selectedPointIndex=draggedPointIndex;
    draggedHandle=handle?.dataset.handle||null;
    svg.setPointerCapture?.(event.pointerId);
    updatePreview();
    event.preventDefault();
  });
  svg.addEventListener('pointermove',event=>{
    if(draggedPointIndex===null)return;
    updateDraggedElement(svg,event);
    event.preventDefault();
  });
  const stop=()=>{
    draggedPointIndex=null;
    draggedHandle=null;
  };
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
document.querySelector('[data-action="smooth-point"]').onclick=smoothSelectedPoint;
document.querySelector('[data-action="corner-point"]').onclick=cornerSelectedPoint;
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
