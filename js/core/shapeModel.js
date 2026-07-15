export const DEFAULT_SHAPE = Object.freeze({
  version: 2,
  weaponType: 0,
  width: 45,
  thickness: 35,
  tip: 50,
  curve: 25,
  material: "黒鉄",
  color: "#d9dce4",
  points: [
    {x:.08,y:.56,inX:-.05,inY:0,outX:.08,outY:-.03,smooth:true},
    {x:.30,y:.47,inX:-.08,inY:.03,outX:.09,outY:-.03,smooth:true},
    {x:.62,y:.42,inX:-.09,inY:.02,outX:.09,outY:.02,smooth:true},
    {x:.90,y:.50,inX:-.08,inY:-.02,outX:.04,outY:0,smooth:true}
  ]
});

export const cloneShape = (shape=DEFAULT_SHAPE) => JSON.parse(JSON.stringify(shape));

export function normalizeShape(input={}){
  const base=cloneShape(DEFAULT_SHAPE);
  const out={...base,...input};
  const clamp=(v,min,max,fallback)=>{
    const n=Number(v);return Number.isFinite(n)?Math.min(max,Math.max(min,n)):fallback;
  };
  out.weaponType=Math.round(clamp(out.weaponType,0,8,0));
  out.width=clamp(out.width,10,100,45);
  out.thickness=clamp(out.thickness,5,100,35);
  out.tip=clamp(out.tip,0,100,50);
  out.curve=clamp(out.curve,0,100,25);
  out.material=typeof out.material==="string"?out.material.slice(0,30):"黒鉄";
  out.color=/^#[0-9a-fA-F]{6}$/.test(out.color||"")?out.color:"#d9dce4";
  const src=Array.isArray(out.points)&&out.points.length>=2?out.points:base.points;
  out.points=src.slice(0,12).map((p,i)=>({
    x:clamp(p.x,.02,.98,i/Math.max(1,src.length-1)),
    y:clamp(p.y,.05,.95,.5),
    inX:clamp(p.inX,-.35,.35,-.06),
    inY:clamp(p.inY,-.35,.35,0),
    outX:clamp(p.outX,-.35,.35,.06),
    outY:clamp(p.outY,-.35,.35,0),
    smooth:p.smooth!==false
  })).sort((a,b)=>a.x-b.x);
  return out;
}

export function fingerprint(shape){
  const text=JSON.stringify(normalizeShape(shape));
  let hash=2166136261;
  for(let i=0;i<text.length;i++){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619);}
  return `SHP-${(hash>>>0).toString(36).toUpperCase()}`;
}


export const WEAPON_DEFAULTS = {
  0:{width:45,thickness:35,tip:62,curve:18,points:[
    {x:.08,y:.52,inX:-.04,inY:0,outX:.09,outY:-.01,smooth:true,width:1,upper:1,lower:1},
    {x:.36,y:.49,inX:-.08,inY:.01,outX:.09,outY:0,smooth:true,width:1,upper:1,lower:1},
    {x:.70,y:.49,inX:-.09,inY:0,outX:.08,outY:.01,smooth:true,width:.72,upper:1,lower:1},
    {x:.92,y:.50,inX:-.06,inY:-.01,outX:.03,outY:0,smooth:true,width:.18,upper:1,lower:1}
  ]},
  1:{width:78,thickness:62,tip:48,curve:14,points:[
    {x:.08,y:.52,inX:-.04,inY:0,outX:.10,outY:-.02,smooth:true,width:1.35,upper:1,lower:1},
    {x:.34,y:.47,inX:-.09,inY:.02,outX:.10,outY:0,smooth:true,width:1.45,upper:1,lower:1},
    {x:.68,y:.47,inX:-.10,inY:0,outX:.09,outY:.02,smooth:true,width:1.15,upper:1,lower:1},
    {x:.92,y:.51,inX:-.07,inY:-.02,outX:.03,outY:0,smooth:true,width:.32,upper:1,lower:1}
  ]},
  2:{width:34,thickness:24,tip:82,curve:68,asymmetric:true,points:[
    {x:.08,y:.64,inX:-.04,inY:0,outX:.11,outY:-.10,smooth:true,width:.86,upper:.75,lower:1.25},
    {x:.37,y:.48,inX:-.10,inY:.08,outX:.11,outY:-.06,smooth:true,width:.82,upper:.72,lower:1.28},
    {x:.70,y:.38,inX:-.10,inY:.04,outX:.10,outY:0,smooth:true,width:.58,upper:.65,lower:1.32},
    {x:.93,y:.42,inX:-.07,inY:-.02,outX:.03,outY:0,smooth:true,width:.12,upper:.45,lower:1.35}
  ]},
  3:{width:28,thickness:25,tip:78,curve:26,points:[
    {x:.08,y:.53,inX:-.04,inY:0,outX:.09,outY:-.03,smooth:true,width:.72,upper:1,lower:1},
    {x:.34,y:.47,inX:-.08,inY:.03,outX:.09,outY:.01,smooth:true,width:.76,upper:1,lower:1},
    {x:.69,y:.50,inX:-.09,inY:-.01,outX:.08,outY:-.02,smooth:true,width:.48,upper:1,lower:1},
    {x:.92,y:.47,inX:-.06,inY:.01,outX:.03,outY:0,smooth:true,width:.10,upper:1,lower:1}
  ]},
  4:{width:22,thickness:22,tip:100,curve:8,points:[
    {x:.08,y:.50,inX:-.03,inY:0,outX:.12,outY:0,smooth:true,width:.28,upper:1,lower:1},
    {x:.52,y:.50,inX:-.12,inY:0,outX:.10,outY:0,smooth:true,width:.42,upper:1,lower:1},
    {x:.78,y:.50,inX:-.08,inY:0,outX:.07,outY:0,smooth:true,width:1.18,upper:1,lower:1},
    {x:.94,y:.50,inX:-.05,inY:0,outX:.02,outY:0,smooth:true,width:.08,upper:1,lower:1}
  ]},
  5:{width:65,thickness:58,tip:25,curve:42,asymmetric:true,points:[
    {x:.10,y:.57,inX:-.03,inY:0,outX:.10,outY:-.08,smooth:true,width:.38,upper:.7,lower:1.1},
    {x:.42,y:.42,inX:-.10,inY:.08,outX:.10,outY:-.10,smooth:true,width:.58,upper:.9,lower:1.1},
    {x:.70,y:.26,inX:-.09,inY:.08,outX:.08,outY:.06,smooth:false,width:1.65,upper:1.55,lower:.75},
    {x:.88,y:.48,inX:-.06,inY:-.06,outX:.02,outY:0,smooth:false,width:.22,upper:1,lower:1}
  ]},
  6:{width:35,thickness:70,tip:5,curve:0,points:[
    {x:.10,y:.50,inX:-.03,inY:0,outX:.12,outY:0,smooth:true,width:.30,upper:1,lower:1},
    {x:.56,y:.50,inX:-.12,inY:0,outX:.08,outY:0,smooth:true,width:.34,upper:1,lower:1},
    {x:.76,y:.50,inX:-.06,inY:0,outX:.05,outY:0,smooth:true,width:1.85,upper:1.35,lower:1.35},
    {x:.88,y:.50,inX:-.03,inY:0,outX:.01,outY:0,smooth:true,width:1.85,upper:1.35,lower:1.35}
  ]},
  7:{width:26,thickness:24,tip:90,curve:12,points:[
    {x:.12,y:.51,inX:-.03,inY:0,outX:.10,outY:-.01,smooth:true,width:.72,upper:1,lower:1},
    {x:.42,y:.48,inX:-.09,inY:.01,outX:.10,outY:0,smooth:true,width:.68,upper:1,lower:1},
    {x:.72,y:.49,inX:-.09,inY:0,outX:.08,outY:.01,smooth:true,width:.40,upper:1,lower:1},
    {x:.90,y:.50,inX:-.05,inY:-.01,outX:.02,outY:0,smooth:true,width:.07,upper:1,lower:1}
  ]},
  8:{width:48,thickness:45,tip:10,curve:0,points:[
    {x:.20,y:.56,inX:-.03,inY:0,outX:.08,outY:-.10,smooth:true,width:.55,upper:1,lower:1},
    {x:.38,y:.36,inX:-.07,inY:.08,outX:.08,outY:-.06,smooth:true,width:1.30,upper:1,lower:1},
    {x:.60,y:.34,inX:-.08,inY:.05,outX:.08,outY:.06,smooth:true,width:1.30,upper:1,lower:1},
    {x:.78,y:.56,inX:-.07,inY:-.08,outX:.03,outY:0,smooth:true,width:.55,upper:1,lower:1}
  ]}
};

export function createWeaponDefault(typeIndex=0){
  const type=Math.max(0,Math.min(8,Number(typeIndex)||0));
  const preset=WEAPON_DEFAULTS[type]||WEAPON_DEFAULTS[0];
  return normalizeShape({
    ...cloneShape(DEFAULT_SHAPE),
    ...preset,
    weaponType:type,
    points:preset.points
  });
}
