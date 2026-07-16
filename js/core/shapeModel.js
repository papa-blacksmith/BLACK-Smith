export const DEFAULT_SHAPE = Object.freeze({
  version: 3,
  weaponType: 0,
  width: 45,
  thickness: 35,
  tip: 50,
  curve: 25,
  material: "黒鉄",
  color: "#d9dce4",
  asymmetric: false,
  edgeStyle: "normal",
  serration: 0,
  holes: 0,
  spikes: 0,
  ornamentType: "none",
  ornamentSize: 20,
  glow: 0,
  zoom: 1,
  points: [
    {x:.08,y:.56,inX:-.05,inY:0,outX:.08,outY:-.03,smooth:true,width:1.00,upper:1.00,lower:1.00},
    {x:.30,y:.47,inX:-.08,inY:.03,outX:.09,outY:-.03,smooth:true,width:1.05,upper:1.00,lower:1.00},
    {x:.62,y:.42,inX:-.09,inY:.02,outX:.09,outY:.02,smooth:true,width:.86,upper:1.00,lower:1.00},
    {x:.90,y:.50,inX:-.08,inY:-.02,outX:.04,outY:0,smooth:true,width:.38,upper:1.00,lower:1.00}
  ]
});

export const cloneShape = (shape=DEFAULT_SHAPE) => JSON.parse(JSON.stringify(shape));

export function normalizeShape(input={}){
  const base=cloneShape(DEFAULT_SHAPE);
  const out={...base,...input};
  const clamp=(v,min,max,fallback)=>{
    const n=Number(v);return Number.isFinite(n)?Math.min(max,Math.max(min,n)):fallback;
  };

  out.version=3;
  out.weaponType=Math.round(clamp(out.weaponType,0,8,0));
  out.width=clamp(out.width,10,100,45);
  out.thickness=clamp(out.thickness,5,100,35);
  out.tip=clamp(out.tip,0,100,50);
  out.curve=clamp(out.curve,0,100,25);
  out.material=typeof out.material==="string"?out.material.slice(0,30):"黒鉄";
  out.color=/^#[0-9a-fA-F]{6}$/.test(out.color||"")?out.color:"#d9dce4";
  out.asymmetric=Boolean(out.asymmetric);
  out.edgeStyle=["normal","serrated","broken","double"].includes(out.edgeStyle)?out.edgeStyle:"normal";
  out.serration=clamp(out.serration,0,100,0);
  out.holes=Math.round(clamp(out.holes,0,6,0));
  out.spikes=Math.round(clamp(out.spikes,0,8,0));
  out.ornamentType=["none","gem","wing","ring","chain"].includes(out.ornamentType)?out.ornamentType:"none";
  out.ornamentSize=clamp(out.ornamentSize,0,100,20);
  out.glow=clamp(out.glow,0,100,0);
  out.zoom=clamp(out.zoom,.65,1.8,1);

  const src=Array.isArray(out.points)&&out.points.length>=2?out.points:base.points;
  out.points=src.slice(0,12).map((p,i)=>({
    x:clamp(p.x,.02,.98,i/Math.max(1,src.length-1)),
    y:clamp(p.y,.05,.95,.5),
    inX:clamp(p.inX,-.35,.35,-.06),
    inY:clamp(p.inY,-.35,.35,0),
    outX:clamp(p.outX,-.35,.35,.06),
    outY:clamp(p.outY,-.35,.35,0),
    smooth:p.smooth!==false,
    width:clamp(p.width,.15,2.2,1),
    upper:clamp(p.upper,.15,2.2,1),
    lower:clamp(p.lower,.15,2.2,1)
  })).sort((a,b)=>a.x-b.x);

  return out;
}

export function fingerprint(shape){
  const text=JSON.stringify(normalizeShape(shape));
  let hash=2166136261;
  for(let i=0;i<text.length;i++){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619);}
  return `SHP-${(hash>>>0).toString(36).toUpperCase()}`;
}
