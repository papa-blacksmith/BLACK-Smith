import { normalizeShape, fingerprint } from "../core/shapeModel.js";

function cubic(p0,p1,p2,p3,t){
  const u=1-t;
  return {
    x:u*u*u*p0.x+3*u*u*t*p1.x+3*u*t*t*p2.x+t*t*t*p3.x,
    y:u*u*u*p0.y+3*u*u*t*p1.y+3*u*t*t*p2.y+t*t*t*p3.y
  };
}

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
    <text x="28" y="36" fill="#e6b85e" font-size="22">${typeName}</text>
    <text x="28" y="330" fill="#98a2b3" font-size="17">${fingerprint(shape)}</text>`;
}

export function eventToLocal(svg,event){
  const pt=svg.createSVGPoint();pt.x=event.clientX;pt.y=event.clientY;
  const matrix=svg.getScreenCTM();return matrix?pt.matrixTransform(matrix.inverse()):{x:0,y:0};
}
