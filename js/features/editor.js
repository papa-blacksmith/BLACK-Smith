import { normalizeShape, fingerprint } from "../core/shapeModel.js";

function cubic(p0,p1,p2,p3,t){
  const u=1-t;
  return {
    x:u*u*u*p0.x+3*u*u*t*p1.x+3*u*t*t*p2.x+t*t*t*p3.x,
    y:u*u*u*p0.y+3*u*u*t*p1.y+3*u*t*t*p2.y+t*t*t*p3.y
  };
}

<<<<<<< HEAD
<<<<<<< HEAD
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


function weaponTypeOverlay(typeName){
  if(typeName==="ハンマー"){
    return `<g><rect x="675" y="112" width="190" height="136" rx="18" fill="url(#metal)" stroke="#f1d08a" stroke-width="3"/><rect x="728" y="148" width="84" height="64" rx="8" fill="#5d6470" opacity=".65"/></g>`;
  }
  if(typeName==="斧"){
    return `<path d="M650 180 Q720 62 880 98 Q818 180 880 262 Q720 298 650 180Z" fill="url(#metal)" stroke="#f1d08a" stroke-width="3"/>`;
  }
  if(typeName==="ナックル"){
    return `<g><path d="M280 215 Q260 125 330 105 Q385 90 420 132 Q455 85 515 105 Q565 125 550 190 L520 245 L300 245Z" fill="url(#metal)" stroke="#f1d08a" stroke-width="3"/>
      ${[340,405,470].map(x=>`<ellipse cx="${x}" cy="158" rx="26" ry="35" fill="#0b0e14" stroke="#697381" stroke-width="4"/>`).join("")}</g>`;
  }
  if(typeName==="双剣"){
    return `<g opacity=".78" transform="translate(0 76) scale(.82)"><path d="M110 180 L780 150 L900 180 L780 210 Z" fill="url(#metal)" stroke="#f1d08a" stroke-width="2"/></g>`;
  }
  return "";
}

=======
>>>>>>> parent of 51c6275 (Upgrade Ver0.6 Freeform Editor)
=======
>>>>>>> parent of 51c6275 (Upgrade Ver0.6 Freeform Editor)
export function drawEditor(svg,shapeInput,selectedIndex=0,typeName=""){
  const shape=normalizeShape(shapeInput);
  const sx=110,sy=55,ux=760,uy=250;
  const anchors=shape.points.map((p,index)=>({
    index,x:sx+p.x*ux,y:sy+p.y*uy,
    inX:sx+(p.x+p.inX)*ux,inY:sy+(p.y+p.inY)*uy,
    outX:sx+(p.x+p.outX)*ux,outY:sy+(p.y+p.outY)*uy
  }));
  const samples=[];
  for(let i=0;i<anchors.length-1;i++){
    const a=anchors[i],b=anchors[i+1];
    for(let s=0;s<20;s++)samples.push(cubic(
      {x:a.x,y:a.y},{x:a.outX,y:a.outY},{x:b.inX,y:b.inY},{x:b.x,y:b.y},s/20
    ));
  }
  samples.push({x:anchors.at(-1).x,y:anchors.at(-1).y});
  const base=24+shape.width*.72,top=[],bottom=[];
  samples.forEach((p,i)=>{
    const before=samples[Math.max(0,i-1)],after=samples[Math.min(samples.length-1,i+1)];
    const dx=after.x-before.x,dy=after.y-before.y,len=Math.hypot(dx,dy)||1;
    const nx=-dy/len,ny=dx/len;
    const taper=1-(i/Math.max(1,samples.length-1))*Math.min(.65,shape.tip/140);
    const half=Math.max(3,base*taper/2);
    top.push({x:p.x+nx*half,y:p.y+ny*half});
    bottom.push({x:p.x-nx*half,y:p.y-ny*half});
  });
  const last=samples.at(-1),prev=samples.at(-2)||last;
  const dx=last.x-prev.x,dy=last.y-prev.y,len=Math.hypot(dx,dy)||1;
  const tip={x:last.x+dx/len*(22+shape.tip*.65),y:last.y+dy/len*(22+shape.tip*.65)};
  const path=[`M ${top[0].x} ${top[0].y}`,...top.slice(1).map(p=>`L ${p.x} ${p.y}`),
    `L ${tip.x} ${tip.y}`,...bottom.reverse().map(p=>`L ${p.x} ${p.y}`),"Z"].join(" ");

  svg.innerHTML=`
    <defs><linearGradient id="metal" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff"/><stop offset=".3" stop-color="${shape.color}"/>
      <stop offset=".7" stop-color="#6d7380"/><stop offset="1" stop-color="#232832"/>
    </linearGradient></defs>
    ${[1,2,3,4,5,6,7,8,9].map(i=>`<line class="grid-line" x1="${i*100}" y1="0" x2="${i*100}" y2="360"/>`).join("")}
    ${[1,2,3].map(i=>`<line class="grid-line" x1="0" y1="${i*90}" x2="1000" y2="${i*90}"/>`).join("")}
<<<<<<< HEAD
<<<<<<< HEAD
    <g transform="${transform}">
      <path d="${path}" fill="url(#metal)" stroke="#f1d08a" stroke-width="${1+shape.thickness/35}" filter="url(#weaponGlow)" opacity="${["ハンマー","斧","ナックル"].includes(typeName)?0.15:1}"/>
      ${weaponTypeOverlay(typeName)}
      ${holes}${spikes}
      <rect x="5" y="162" width="95" height="36" rx="10" fill="#40292a"/>
      <rect x="90" y="132" width="24" height="96" rx="8" fill="#ad7434"/>
      ${ornamentMarkup(shape)}
      ${anchors.map(a=>`
        <line class="handle-line" x1="${a.x}" y1="${a.y}" x2="${a.inX}" y2="${a.inY}"/>
        <line class="handle-line" x1="${a.x}" y1="${a.y}" x2="${a.outX}" y2="${a.outY}"/>
        <circle class="handle" data-handle="in" data-index="${a.index}" cx="${a.inX}" cy="${a.inY}" r="7" fill="#e6b85e"/>
        <circle class="handle" data-handle="out" data-index="${a.index}" cx="${a.outX}" cy="${a.outY}" r="7" fill="#e6b85e"/>
        <circle class="width-handle" data-width-index="${a.index}" cx="${a.x}" cy="${a.y-34*(a.width||1)}" r="7" fill="#59a9ff" stroke="#eaf5ff" stroke-width="2"/>
        <circle class="anchor ${a.index===selectedIndex?"selected":""}" data-index="${a.index}" cx="${a.x}" cy="${a.y}" r="10" fill="#fff" stroke="#171b24" stroke-width="4"/>
      `).join("")}
    </g>
=======
=======
>>>>>>> parent of 51c6275 (Upgrade Ver0.6 Freeform Editor)
    <path d="${path}" fill="url(#metal)" stroke="#f1d08a" stroke-width="${1+shape.thickness/35}"/>
    <rect x="5" y="162" width="95" height="36" rx="10" fill="#40292a"/>
    <rect x="90" y="132" width="24" height="96" rx="8" fill="#ad7434"/>
    ${anchors.map(a=>`
      <line class="handle-line" x1="${a.x}" y1="${a.y}" x2="${a.inX}" y2="${a.inY}"/>
      <line class="handle-line" x1="${a.x}" y1="${a.y}" x2="${a.outX}" y2="${a.outY}"/>
      <circle class="handle" data-handle="in" data-index="${a.index}" cx="${a.inX}" cy="${a.inY}" r="7" fill="#e6b85e"/>
      <circle class="handle" data-handle="out" data-index="${a.index}" cx="${a.outX}" cy="${a.outY}" r="7" fill="#e6b85e"/>
      <circle class="anchor ${a.index===selectedIndex?"selected":""}" data-index="${a.index}" cx="${a.x}" cy="${a.y}" r="10" fill="#fff" stroke="#171b24" stroke-width="4"/>
    `).join("")}
<<<<<<< HEAD
>>>>>>> parent of 51c6275 (Upgrade Ver0.6 Freeform Editor)
=======
>>>>>>> parent of 51c6275 (Upgrade Ver0.6 Freeform Editor)
    <text x="28" y="36" fill="#e6b85e" font-size="22">${typeName}</text>
    <text x="28" y="330" fill="#98a2b3" font-size="17">${fingerprint(shape)}</text>`;
}

export function eventToLocal(svg,event){
  const pt=svg.createSVGPoint();pt.x=event.clientX;pt.y=event.clientY;
  const matrix=svg.getScreenCTM();return matrix?pt.matrixTransform(matrix.inverse()):{x:0,y:0};
}
