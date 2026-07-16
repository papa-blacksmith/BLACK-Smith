import { normalizeShape, fingerprint } from "../core/shapeModel.js";

function cubic(p0,p1,p2,p3,t){
  const u=1-t;
  return {
    x:u*u*u*p0.x+3*u*u*t*p1.x+3*u*t*t*p2.x+t*t*t*p3.x,
    y:u*u*u*p0.y+3*u*u*t*p1.y+3*u*t*t*p2.y+t*t*t*p3.y
  };
}

function interpolateWidth(points,t){
  if(points.length===1)return points[0].width||1;
  const scaled=t*(points.length-1);
  const i=Math.min(points.length-2,Math.floor(scaled));
  const f=scaled-i;
  const a=points[i],b=points[i+1];
  return {
    width:(a.width||1)*(1-f)+(b.width||1)*f,
    upper:(a.upper||1)*(1-f)+(b.upper||1)*f,
    lower:(a.lower||1)*(1-f)+(b.lower||1)*f
  };
}

function ornamentMarkup(shape){
  const size=12+shape.ornamentSize*.25;
  if(shape.ornamentType==="gem"){
    return `<polygon class="ornament-shape" points="108,${180-size} ${108+size*.7},180 108,${180+size} ${108-size*.7},180" fill="#6ab4ff" stroke="#eaf5ff" stroke-width="2"/>`;
  }
  if(shape.ornamentType==="wing"){
    return `<path class="ornament-shape" d="M108 180 q-${size*1.5} -${size} -${size*2.2} ${size*.3} q${size*.9} ${size*.3} ${size*1.8} ${size*1.3} M108 180 q${size*1.5} -${size} ${size*2.2} ${size*.3} q-${size*.9} ${size*.3} -${size*1.8} ${size*1.3}" fill="none" stroke="#d8dce5" stroke-width="5"/>`;
  }
  if(shape.ornamentType==="ring"){
    return `<circle class="ornament-shape" cx="108" cy="180" r="${size}" fill="none" stroke="#e6b85e" stroke-width="5"/>`;
  }
  if(shape.ornamentType==="chain"){
    return Array.from({length:4},(_,i)=>`<circle class="ornament-shape" cx="${70-i*16}" cy="${205+i*10}" r="${size*.28}" fill="none" stroke="#c1c6d0" stroke-width="4"/>`).join("");
  }
  return "";
}

export function drawEditor(svg,shapeInput,selectedIndex=0,typeName=""){
  const shape=normalizeShape(shapeInput);
  const sx=110,sy=55,ux=760,uy=250;
  const anchors=shape.points.map((p,index)=>({
    index,x:sx+p.x*ux,y:sy+p.y*uy,
    inX:sx+(p.x+p.inX)*ux,inY:sy+(p.y+p.inY)*uy,
    outX:sx+(p.x+p.outX)*ux,outY:sy+(p.y+p.outY)*uy,
    width:p.width,upper:p.upper,lower:p.lower
  }));
  const samples=[];
  const sampleMeta=[];
  for(let i=0;i<anchors.length-1;i++){
    const a=anchors[i],b=anchors[i+1];
    for(let s=0;s<24;s++){
      const t=s/24;
      samples.push(cubic({x:a.x,y:a.y},{x:a.outX,y:a.outY},{x:b.inX,y:b.inY},{x:b.x,y:b.y},t));
      sampleMeta.push((i+t)/(anchors.length-1));
    }
  }
  samples.push({x:anchors.at(-1).x,y:anchors.at(-1).y});
  sampleMeta.push(1);

  const base=24+shape.width*.72,top=[],bottom=[];
  samples.forEach((p,i)=>{
    const before=samples[Math.max(0,i-1)],after=samples[Math.min(samples.length-1,i+1)];
    const dx=after.x-before.x,dy=after.y-before.y,len=Math.hypot(dx,dy)||1;
    const nx=-dy/len,ny=dx/len;
    const local=interpolateWidth(shape.points,sampleMeta[i]);
    const taper=1-(i/Math.max(1,samples.length-1))*Math.min(.65,shape.tip/140);
    let upper=base*taper*.5*local.width*local.upper;
    let lower=base*taper*.5*local.width*local.lower;
    if(!shape.asymmetric){const avg=(upper+lower)/2;upper=avg;lower=avg;}
    if(shape.edgeStyle==="serrated" && i%5===0)upper+=shape.serration*.16;
    if(shape.edgeStyle==="broken" && i%11===0)upper*=.55;
    if(shape.edgeStyle==="double"){upper*=.88;lower*=.88;}
    top.push({x:p.x+nx*upper,y:p.y+ny*upper});
    bottom.push({x:p.x-nx*lower,y:p.y-ny*lower});
  });

  const last=samples.at(-1),prev=samples.at(-2)||last;
  const dx=last.x-prev.x,dy=last.y-prev.y,len=Math.hypot(dx,dy)||1;
  const tip={x:last.x+dx/len*(22+shape.tip*.65),y:last.y+dy/len*(22+shape.tip*.65)};
  const path=[`M ${top[0].x} ${top[0].y}`,...top.slice(1).map(p=>`L ${p.x} ${p.y}`),
    `L ${tip.x} ${tip.y}`,...bottom.reverse().map(p=>`L ${p.x} ${p.y}`),"Z"].join(" ");

  const zoom=shape.zoom||1;
  const transform=`translate(${500*(1-zoom)} ${180*(1-zoom)}) scale(${zoom})`;

  const holes=Array.from({length:shape.holes},(_,i)=>{
    const index=Math.floor((samples.length-1)*(0.25+(i+1)/(shape.holes+2)*.55));
    const p=samples[index];
    const radius=7+shape.width*.06;
    return `<ellipse class="hole-shape" cx="${p.x}" cy="${p.y}" rx="${radius*1.4}" ry="${radius}"/>`;
  }).join("");

  const spikes=Array.from({length:shape.spikes},(_,i)=>{
    const index=Math.floor((top.length-1)*(0.18+(i+1)/(shape.spikes+1)*.68));
    const p=top[index],center=samples[index];
    const vx=p.x-center.x,vy=p.y-center.y,l=Math.hypot(vx,vy)||1;
    const nx=vx/l,ny=vy/l,size=12+shape.serration*.18;
    return `<polygon class="spike-shape" points="${p.x-ny*5},${p.y+nx*5} ${p.x+nx*size},${p.y+ny*size} ${p.x+ny*5},${p.y-nx*5}"/>`;
  }).join("");

  svg.innerHTML=`
    <defs>
      <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fff"/><stop offset=".3" stop-color="${shape.color}"/>
        <stop offset=".7" stop-color="#6d7380"/><stop offset="1" stop-color="#232832"/>
      </linearGradient>
      <filter id="weaponGlow"><feGaussianBlur stdDeviation="${shape.glow/15}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    ${[1,2,3,4,5,6,7,8,9].map(i=>`<line class="grid-line" x1="${i*100}" y1="0" x2="${i*100}" y2="360"/>`).join("")}
    ${[1,2,3].map(i=>`<line class="grid-line" x1="0" y1="${i*90}" x2="1000" y2="${i*90}"/>`).join("")}
    <g transform="${transform}">
      <path d="${path}" fill="url(#metal)" stroke="#f1d08a" stroke-width="${1+shape.thickness/35}" filter="url(#weaponGlow)"/>
      ${holes}${spikes}
      <rect x="5" y="162" width="95" height="36" rx="10" fill="#40292a"/>
      <rect x="90" y="132" width="24" height="96" rx="8" fill="#ad7434"/>
      ${ornamentMarkup(shape)}
      ${anchors.map(a=>`
        <line class="handle-line" x1="${a.x}" y1="${a.y}" x2="${a.inX}" y2="${a.inY}"/>
        <line class="handle-line" x1="${a.x}" y1="${a.y}" x2="${a.outX}" y2="${a.outY}"/>
        <circle class="editor-hit-target" data-handle="in" data-index="${a.index}" cx="${a.inX}" cy="${a.inY}" r="18"/>
        <circle class="editor-hit-target" data-handle="out" data-index="${a.index}" cx="${a.outX}" cy="${a.outY}" r="18"/>
        <circle class="editor-hit-target" data-width-index="${a.index}" cx="${a.x}" cy="${a.y-34*(a.width||1)}" r="20"/>
        <circle class="editor-hit-target anchor-hit" data-index="${a.index}" cx="${a.x}" cy="${a.y}" r="22"/>
        <circle class="handle" data-handle="in" data-index="${a.index}" cx="${a.inX}" cy="${a.inY}" r="9" fill="#e6b85e"/>
        <circle class="handle" data-handle="out" data-index="${a.index}" cx="${a.outX}" cy="${a.outY}" r="9" fill="#e6b85e"/>
        <circle class="width-handle" data-width-index="${a.index}" cx="${a.x}" cy="${a.y-34*(a.width||1)}" r="9" fill="#59a9ff" stroke="#eaf5ff" stroke-width="2.5"/>
        <circle class="anchor ${a.index===selectedIndex?"selected":""}" data-index="${a.index}" cx="${a.x}" cy="${a.y}" r="13" fill="#fff" stroke="#171b24" stroke-width="4"/>
      `).join("")}
    </g>
    <text x="28" y="36" fill="#e6b85e" font-size="22">${typeName}</text>
    <text x="28" y="330" fill="#98a2b3" font-size="17">${fingerprint(shape)}</text>`;
}

export function eventToLocal(svg,event){
  const pt=svg.createSVGPoint();pt.x=event.clientX;pt.y=event.clientY;
  const matrix=svg.getScreenCTM();return matrix?pt.matrixTransform(matrix.inverse()):{x:0,y:0};
}


export function createShapePreview(shapeInput, typeName = "") {
  const shape = normalizeShape(shapeInput);
  const sx = 18, sy = 18, ux = 244, uy = 84;
  const anchors = shape.points.map((p) => ({
    x: sx + p.x * ux,
    y: sy + p.y * uy,
    inX: sx + (p.x + p.inX) * ux,
    inY: sy + (p.y + p.inY) * uy,
    outX: sx + (p.x + p.outX) * ux,
    outY: sy + (p.y + p.outY) * uy
  }));

  const center = [];
  for (let i = 0; i < anchors.length - 1; i++) {
    const a = anchors[i], b = anchors[i + 1];
    for (let s = 0; s < 12; s++) {
      center.push(cubic(
        { x: a.x, y: a.y },
        { x: a.outX, y: a.outY },
        { x: b.inX, y: b.inY },
        { x: b.x, y: b.y },
        s / 12
      ));
    }
  }
  center.push({ x: anchors.at(-1).x, y: anchors.at(-1).y });

  const base = 7 + shape.width * .11;
  const top = [], bottom = [];
  center.forEach((p, i) => {
    const before = center[Math.max(0, i - 1)];
    const after = center[Math.min(center.length - 1, i + 1)];
    const dx = after.x - before.x;
    const dy = after.y - before.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    const ratio = i / Math.max(1, center.length - 1);
    const taper = 1 - ratio * Math.min(.65, shape.tip / 140);
    const localIndex = Math.min(shape.points.length - 1, Math.round(ratio * (shape.points.length - 1)));
    const local = shape.points[localIndex];
    const half = Math.max(2, base * taper * (local.width || 1) / 2);
    top.push({ x: p.x + nx * half, y: p.y + ny * half });
    bottom.push({ x: p.x - nx * half, y: p.y - ny * half });
  });

  const last = center.at(-1);
  const prev = center.at(-2) || last;
  const dx = last.x - prev.x;
  const dy = last.y - prev.y;
  const len = Math.hypot(dx, dy) || 1;
  const tip = {
    x: last.x + dx / len * (6 + shape.tip * .16),
    y: last.y + dy / len * (6 + shape.tip * .16)
  };

  const path = [
    `M ${top[0].x} ${top[0].y}`,
    ...top.slice(1).map((p) => `L ${p.x} ${p.y}`),
    `L ${tip.x} ${tip.y}`,
    ...bottom.reverse().map((p) => `L ${p.x} ${p.y}`),
    "Z"
  ].join(" ");

  return `
    <svg class="weapon-mini-preview" viewBox="0 0 280 120" aria-label="${typeName}の形状プレビュー">
      <defs>
        <linearGradient id="miniMetal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffffff"/>
          <stop offset=".35" stop-color="${shape.color}"/>
          <stop offset="1" stop-color="#555e6c"/>
        </linearGradient>
      </defs>
      <rect x="3" y="48" width="38" height="20" rx="7" fill="#4a2f2b"/>
      <rect x="37" y="37" width="8" height="42" rx="4" fill="#a56a2d"/>
      <path d="${path}" fill="url(#miniMetal)" stroke="#e6b85e" stroke-width="1.4"/>
    </svg>`;
}


export function drawLayeredEditor(
  svg,
  parts,
  activePartId,
  selectedIndex,
  typeName = ""
) {
  if (!svg) return;

  const active = parts.find((part) => part.id === activePartId);
  if (!active) {
    svg.innerHTML = "";
    return;
  }

  // First render active part using existing renderer.
  drawEditor(svg, active.shape, selectedIndex, `${typeName}・${active.label}`);


  const activeTransform = active.transform || {};
  const activeTx = Number(activeTransform.x) || 0;
  const activeTy = Number(activeTransform.y) || 0;
  const activeRotation = Number(activeTransform.rotation) || 0;
  const activeScaleX = Number(activeTransform.scaleX) || 1;
  const activeScaleY = Number(activeTransform.scaleY) || 1;

  const movableNodes = [...svg.children].filter((node) =>
    node.tagName !== "defs" &&
    node.tagName !== "text"
  );

  const activeGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  activeGroup.setAttribute("class", "active-part-transform");
  activeGroup.setAttribute(
    "transform",
    `translate(${activeTx} ${activeTy}) rotate(${activeRotation} 500 180) scale(${activeScaleX} ${activeScaleY})`
  );

  movableNodes.forEach((node) => activeGroup.appendChild(node));
  svg.appendChild(activeGroup);

  // Capture active editor groups, then prepend non-active visible parts as passive layers.
  const passiveLayers = parts
    .filter((part) => part.visible && part.id !== activePartId)
    .map((part, index) => {
      const temp = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      drawEditor(temp, part.shape, -1, part.label);

      const weaponPath = temp.querySelector('path[fill^="url"], path[stroke="#f1d08a"]');
      const overlayGroup = temp.querySelector(".weapon-type-overlay");

      const opacity = 0.34 + Math.min(0.28, index * 0.05);
      const t = part.transform || {};
      const tx = Number(t.x) || 0;
      const ty = Number(t.y) || 0;
      const rotation = Number(t.rotation) || 0;
      const scaleX = Number(t.scaleX) || 1;
      const scaleY = Number(t.scaleY) || 1;

      return `
        <g
          class="passive-part-layer"
          data-passive-part="${part.id}"
          opacity="${opacity}"
          transform="translate(${tx} ${ty}) rotate(${rotation} 500 180) scale(${scaleX} ${scaleY})"
          pointer-events="none"
        >
          ${weaponPath ? weaponPath.outerHTML : ""}
          ${overlayGroup ? overlayGroup.outerHTML : ""}
        </g>
      `;
    })
    .join("");

  const defs = svg.querySelector("defs");
  if (defs) {
    defs.insertAdjacentHTML("afterend", passiveLayers);
  } else {
    svg.insertAdjacentHTML("afterbegin", passiveLayers);
  }

  svg.dataset.activePart = activePartId;
}
