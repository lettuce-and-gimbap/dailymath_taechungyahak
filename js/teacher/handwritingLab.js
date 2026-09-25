// === js/teacher/handwritingLab.js ===
/* --------------------------------------------------------------------
   ✍️ 필기 숫자 인식 — 교사 화면 전용 시험판 (프로토타입)

   학생이 손으로 쓴 답(화면에 손가락으로 쓰기 · 종이 사진)을 숫자로 읽어 정답과 맞는지 판단한다.
   - 인식 : TensorFlow.js 작은 CNN. 처음 한 번 MNIST 손글씨 2만 장으로 이 브라우저에서 학습(약 1분)하고
            IndexedDB 에 저장해 다음부터는 바로 쓴다. 서버·API 키·요금이 없다.
   - 여러 자리 : 잉크 덩어리를 나눠 왼쪽부터 한 글자씩 읽는다. 납작한 덩어리는 '−' 로 본다.
   - 확신도가 낮은 글자가 있으면 ⭕/❌ 대신 '선생님 확인'으로 돌린다 (자동 채점을 믿기 전 안전장치).
   학생 화면에는 아직 넣지 않았다. 정확도를 교사가 먼저 확인한 뒤 붙인다.
   -------------------------------------------------------------------- */

var HW_TF_URL='https://cdnjs.cloudflare.com/ajax/libs/tensorflow/4.20.0/tf.min.js';
var HW_MODEL_KEY='indexeddb://taechung-hw-digits-v1';
var HW_MNIST_IMG='https://storage.googleapis.com/learnjs-data/model-builder/mnist_images.png';
var HW_MNIST_LBL='https://storage.googleapis.com/learnjs-data/model-builder/mnist_labels_uint8';

var hwLoadTf=()=>window.tf?Promise.resolve(window.tf):new Promise((res,rej)=>{
  const s=document.createElement('script');s.src=HW_TF_URL;s.onload=()=>res(window.tf);s.onerror=()=>rej(new Error('TensorFlow.js 를 불러오지 못했습니다'));document.head.appendChild(s);});

/* MNIST 스프라이트에서 n장 읽기 (한 줄 = 28x28 한 장) */
var hwLoadMnist=async(n)=>{
  const img=new Image();img.crossOrigin='anonymous';
  await new Promise((res,rej)=>{img.onload=res;img.onerror=()=>rej(new Error('학습 자료를 내려받지 못했습니다'));img.src=HW_MNIST_IMG;});
  const cv=document.createElement('canvas');cv.width=784;const ctx=cv.getContext('2d',{willReadFrequently:true});
  const x=new Float32Array(n*784);const CH=5000;
  for(let off=0;off<n;off+=CH){
    const rows=Math.min(CH,n-off);cv.height=rows;
    ctx.drawImage(img,0,off,784,rows,0,0,784,rows);
    const d=ctx.getImageData(0,0,784,rows).data;
    for(let i=0;i<rows*784;i++)x[off*784+i]=d[i*4]/255;
  }
  const lb=new Uint8Array(await (await fetch(HW_MNIST_LBL)).arrayBuffer()).slice(0,n*10);
  return{x,y:lb};
};

var hwGetModel=async(tf,onMsg)=>{
  try{const m=await tf.loadLayersModel(HW_MODEL_KEY);onMsg('저장해 둔 인식 모델을 불러왔습니다');return m;}catch(e){}
  const N=20000;
  onMsg('처음 한 번만 : 손글씨 학습 자료 내려받는 중… (약 10MB)');
  const {x,y}=await hwLoadMnist(N);
  const xs=tf.tensor4d(x,[N,28,28,1]),ys=tf.tensor2d(y,[N,10],'float32');
  const m=tf.sequential();
  m.add(tf.layers.conv2d({inputShape:[28,28,1],filters:16,kernelSize:5,activation:'relu'}));
  m.add(tf.layers.maxPooling2d({poolSize:2}));
  m.add(tf.layers.conv2d({filters:32,kernelSize:3,activation:'relu'}));
  m.add(tf.layers.maxPooling2d({poolSize:2}));
  m.add(tf.layers.flatten());
  m.add(tf.layers.dropout({rate:0.25}));
  m.add(tf.layers.dense({units:64,activation:'relu'}));
  m.add(tf.layers.dense({units:10,activation:'softmax'}));
  m.compile({optimizer:'adam',loss:'categoricalCrossentropy',metrics:['accuracy']});
  const EP=3,BPE=Math.ceil(N*0.9/128);let curEp=0;
  onMsg('학습 중… (1분쯤 걸립니다)');
  await m.fit(xs,ys,{epochs:EP,batchSize:128,validationSplit:0.1,shuffle:true,yieldEvery:'never',callbacks:{   // 기본값은 rAF 로 쉬는데, 창이 가려지면 rAF 가 멈춰 학습이 멈춘다
    onEpochEnd:(ep,l)=>onMsg(`학습 중… ${ep+1}/${EP}회차 · 검증 정확도 ${Math.round((l.val_acc||l.val_accuracy||0)*1000)/10}%`),
    onBatchEnd:async(b)=>{if(b%20===0){onMsg(`학습 중… ${curEp+1}/${EP}회차 · ${Math.round(b/BPE*100)}%`);if(!document.hidden)await new Promise(r=>setTimeout(r,0));}},   // 가끔 쉬어 화면이 멈추지 않게
    onEpochBegin:ep=>{curEp=ep;}}});
  xs.dispose();ys.dispose();
  try{await m.save(HW_MODEL_KEY);}catch(e){}
  onMsg('학습 완료 — 이 브라우저에 저장했습니다 (다음부터 바로 시작)');
  return m;
};

/* 캔버스 → 잉크(1)/바탕(0) 격자. 사진은 오츠 방식으로 문턱값을 정한다. */
var hwBinarize=(ctx,w,h)=>{
  const d=ctx.getImageData(0,0,w,h).data;const g=new Uint8Array(w*h);const hist=new Array(256).fill(0);
  for(let i=0;i<w*h;i++){const v=(d[i*4]*0.3+d[i*4+1]*0.59+d[i*4+2]*0.11)|0;g[i]=v;hist[v]++;}
  let sum=0;for(let i=0;i<256;i++)sum+=i*hist[i];
  let sB=0,wB=0,best=0,th=128;
  for(let t=0;t<256;t++){wB+=hist[t];if(!wB)continue;const wF=w*h-wB;if(!wF)break;sB+=t*hist[t];
    const mB=sB/wB,mF=(sum-sB)/wF,v=wB*wF*(mB-mF)*(mB-mF);if(v>best){best=v;th=t;}}
  th=Math.min(th,200);
  const b=new Uint8Array(w*h);for(let i=0;i<w*h;i++)b[i]=g[i]<th?1:0;return b;
};

/* 잉크 덩어리 찾기 → x 범위가 많이 겹치는 덩어리는 한 글자로 합친다 */
var hwSegments=(b,w,h)=>{
  const lab=new Int32Array(w*h);const comps=[];let id=0;
  const NB=[-1,1,-w,w,-w-1,-w+1,w-1,w+1];
  for(let p=0;p<w*h;p++){
    if(!b[p]||lab[p])continue;id++;
    let x0=w,x1=0,y0=h,y1=0;const st=[p];lab[p]=id;const px=[];
    while(st.length){const q=st.pop();px.push(q);const x=q%w,y=(q/w)|0;
      if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;
      for(const o of NB){const nq=q+o;
        if(nq<0||nq>=w*h||lab[nq]||!b[nq])continue;if(Math.abs((nq%w)-x)>1)continue;lab[nq]=id;st.push(nq);}}
    comps.push({x0,x1,y0,y1,n:px.length,px});
  }
  const maxN=Math.max(0,...comps.map(c=>c.n));
  const segs=comps.filter(c=>c.n>Math.max(20,maxN*0.02)).sort((a,b)=>a.x0-b.x0);
  const out=[];
  for(const c of segs){
    const last=out[out.length-1];
    if(last){const ov=Math.min(last.x1,c.x1)-Math.max(last.x0,c.x0);const nar=Math.min(last.x1-last.x0,c.x1-c.x0)+1;
      if(ov>nar*0.5){last.x0=Math.min(last.x0,c.x0);last.x1=Math.max(last.x1,c.x1);last.y0=Math.min(last.y0,c.y0);last.y1=Math.max(last.y1,c.y1);last.px=last.px.concat(c.px);last.n+=c.n;continue;}}
    out.push({...c});
  }
  return out;
};

/* 한 글자 → MNIST 모양(28x28, 글자 20px, 무게중심 가운데) */
var hwTo28=(seg,w)=>{
  const sw=seg.x1-seg.x0+1,sh=seg.y1-seg.y0+1,sc=20/Math.max(sw,sh);
  const cv=document.createElement('canvas');cv.width=28;cv.height=28;const c=cv.getContext('2d',{willReadFrequently:true});
  const src=document.createElement('canvas');src.width=sw;src.height=sh;const s=src.getContext('2d');
  const id=s.createImageData(sw,sh);
  for(const p of seg.px){const x=p%w-seg.x0,y=((p/w)|0)-seg.y0;const k=(y*sw+x)*4;id.data[k]=id.data[k+1]=id.data[k+2]=255;id.data[k+3]=255;}
  s.putImageData(id,0,0);
  c.fillStyle='#000';c.fillRect(0,0,28,28);c.imageSmoothingEnabled=true;
  const dw=sw*sc,dh=sh*sc;c.drawImage(src,(28-dw)/2,(28-dh)/2,dw,dh);
  const d=c.getImageData(0,0,28,28).data;const a=new Float32Array(784);let m=0,cx=0,cy=0;
  for(let i=0;i<784;i++){a[i]=d[i*4]/255;m+=a[i];cx+=a[i]*(i%28);cy+=a[i]*((i/28)|0);}
  if(!m)return a;
  const dx=Math.round(14-cx/m),dy=Math.round(14-cy/m),o=new Float32Array(784);
  for(let y=0;y<28;y++)for(let x=0;x<28;x++){const nx=x+dx,ny=y+dy;if(nx>=0&&nx<28&&ny>=0&&ny<28)o[ny*28+nx]=a[y*28+x];}
  return o;
};

var hwRecognize=(tf,model,ctx,w,h)=>{
  const b=hwBinarize(ctx,w,h);const segs=hwSegments(b,w,h);
  if(!segs.length)return{text:'',chars:[]};
  const maxH=Math.max(...segs.map(s=>s.y1-s.y0+1));
  const chars=[];const batch=[];const idx=[];
  segs.forEach((s,i)=>{
    const sw=s.x1-s.x0+1,sh=s.y1-s.y0+1;
    if(sh<sw*0.45&&sh<maxH*0.35){chars.push({ch:'-',p:1});return;}
    chars.push(null);idx.push(i);batch.push(hwTo28(s,w));
  });
  if(batch.length){
    const flat=new Float32Array(batch.length*784);batch.forEach((a,i)=>flat.set(a,i*784));
    const pr=tf.tidy(()=>model.predict(tf.tensor4d(flat,[batch.length,28,28,1])).arraySync());
    pr.forEach((p,j)=>{let k=0;for(let t=1;t<10;t++)if(p[t]>p[k])k=t;chars[idx[j]]={ch:String(k),p:p[k]};});
  }
  return{text:chars.map(c=>c.ch).join(''),chars};
};

var hwNewProb=()=>{
  const k=Math.floor(Math.random()*3);
  const a=Math.floor(Math.random()*40)+5,b=Math.floor(Math.random()*40)+5;
  if(k===0)return{q:`${a} + ${b}`,ans:a+b};
  if(k===1)return{q:`${a} − ${b}`,ans:a-b};
  const c=Math.floor(Math.random()*8)+2,d=Math.floor(Math.random()*8)+2;return{q:`${c} × ${d}`,ans:c*d};
};

function HandwritingLab(){
  const[msg,setMsg]=useState('');const[ready,setReady]=useState(false);const[busy,setBusy]=useState(false);
  const[prob,setProb]=useState(()=>hwNewProb());
  const[res,setRes]=useState(null);
  const cvRef=React.useRef(null);const tfRef=React.useRef(null);const mRef=React.useRef(null);const drawing=React.useRef(false);
  const W=720,H=240;
  const clear=()=>{const c=cvRef.current.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,W,H);setRes(null);};
  React.useEffect(()=>{clear();},[]);
  const prep=async()=>{
    setBusy(true);
    try{const tf=await hwLoadTf();tfRef.current=tf;mRef.current=await hwGetModel(tf,setMsg);setReady(true);}
    catch(e){setMsg('준비 실패 : '+e.message);}
    setBusy(false);
  };
  const pos=e=>{const r=cvRef.current.getBoundingClientRect();return[(e.clientX-r.left)*W/r.width,(e.clientY-r.top)*H/r.height];};
  const down=e=>{drawing.current=true;const c=cvRef.current.getContext('2d');const[x,y]=pos(e);c.beginPath();c.moveTo(x,y);cvRef.current.setPointerCapture(e.pointerId);};
  const move=e=>{if(!drawing.current)return;const c=cvRef.current.getContext('2d');c.lineWidth=14;c.lineCap='round';c.lineJoin='round';c.strokeStyle='#111';const[x,y]=pos(e);c.lineTo(x,y);c.stroke();};
  const up=()=>{drawing.current=false;};
  const photo=e=>{
    const f=e.target.files&&e.target.files[0];if(!f)return;
    const img=new Image();img.onload=()=>{const c=cvRef.current.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,W,H);
      const sc=Math.min(W/img.width,H/img.height);c.drawImage(img,(W-img.width*sc)/2,(H-img.height*sc)/2,img.width*sc,img.height*sc);URL.revokeObjectURL(img.src);setRes(null);};
    img.src=URL.createObjectURL(f);e.target.value='';
  };
  const grade=()=>{
    if(!mRef.current)return;
    const r=hwRecognize(tfRef.current,mRef.current,cvRef.current.getContext('2d'),W,H);
    const low=r.chars.some(c=>c.p<0.7);
    const num=/^-?\d+$/.test(r.text)?parseInt(r.text,10):null;
    setRes({...r,low,ok:num!==null&&num===prob.ans});
  };
  return(<div className="p-4 pb-36 space-y-4">
    <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 text-sm text-amber-900 font-bold leading-relaxed">
      ✍️ 필기 인식 시험판 — 선생님 화면에서만 보입니다. 학생 답을 손글씨로 받아 자동 채점할 수 있을지 확인하는 용도입니다.
      <div className="font-medium text-amber-800 mt-1">처음 한 번은 이 기기에서 인식 모델을 학습합니다(약 1분). 다음부터는 바로 됩니다.</div>
    </div>
    {!ready&&<button onClick={prep} disabled={busy} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg disabled:bg-gray-300">{busy?'준비 중…':'인식 모델 준비하기'}</button>}
    {msg&&<div className="text-xs font-bold text-gray-500">{msg}</div>}
    <div className="bg-white rounded-3xl p-4 shadow-sm space-y-3">
      <div className="flex items-center gap-2">
        <div className="text-2xl font-black text-gray-800 flex-1">{prob.q} = ?</div>
        <button onClick={()=>{setProb(hwNewProb());clear();}} className="text-xs px-3 py-2 bg-gray-100 rounded-lg font-black text-gray-600">다른 문제</button>
      </div>
      <canvas ref={cvRef} width={W} height={H} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
        className="w-full rounded-2xl border-2 border-dashed border-gray-300 bg-white" style={{touchAction:'none',aspectRatio:`${W}/${H}`}}/>
      <div className="text-xs text-gray-400 font-bold">칸 안에 답을 크게 쓰세요 (음수는 앞에 −). 종이에 쓴 답은 📷 로 찍어 올리면 됩니다.</div>
      <div className="grid grid-cols-3 gap-2">
        <button onClick={clear} className="py-3 bg-gray-100 rounded-xl font-black text-gray-600 text-sm">지우기</button>
        <label className="py-3 bg-gray-100 rounded-xl font-black text-gray-600 text-sm text-center cursor-pointer">📷 사진<input type="file" accept="image/*" capture="environment" onChange={photo} className="hidden"/></label>
        <button onClick={grade} disabled={!ready} className="py-3 bg-indigo-600 text-white rounded-xl font-black text-sm disabled:bg-gray-300">채점하기</button>
      </div>
      {res&&<div className={`rounded-2xl p-4 border-2 ${res.low?'bg-amber-50 border-amber-300':res.ok?'bg-emerald-50 border-emerald-300':'bg-red-50 border-red-300'}`}>
        <div className="flex items-center gap-3">
          <div className="text-4xl">{res.low?'🤔':res.ok?'⭕':'❌'}</div>
          <div className="flex-1">
            <div className="text-sm font-bold text-gray-500">읽은 답</div>
            <div className="text-3xl font-black text-gray-800 tabular-nums">{res.text||'(글씨를 못 찾음)'}</div>
          </div>
          <div className="text-right text-sm font-bold text-gray-500">정답<div className="text-2xl font-black text-gray-800">{prob.ans}</div></div>
        </div>
        {res.low&&<div className="text-xs font-black text-amber-700 mt-2">확신이 낮은 글자가 있어 자동 채점하지 않고 선생님 확인으로 돌립니다.</div>}
        <div className="flex gap-2 mt-3 flex-wrap">
          {res.chars.map((c,i)=>(<div key={i} className={`px-2.5 py-1.5 rounded-lg text-center border ${c.p<0.7?'border-amber-400 bg-white':'border-gray-200 bg-white'}`}>
            <div className="text-xl font-black">{c.ch}</div><div className="text-[10px] font-bold text-gray-400">{Math.round(c.p*100)}%</div></div>))}
        </div>
      </div>}
    </div>
  </div>);
}
