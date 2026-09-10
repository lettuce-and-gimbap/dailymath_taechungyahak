// === js/teacher/wrongNote.js ===
/* --------------------------------------------------------------------
   오답 문항 복원 로직
   저장된 로그에서 문제 텍스트·그래프를 되살려 다시 그린다
   -------------------------------------------------------------------- */


// qTxt가 30자에서 잘린 구버전 로그에서 전체 문제 텍스트를 복원
function restoreQText(q){
  if(q.qFull) return q.qFull;
  const txt=(q.qTxt||q.q||'').trim();
  if(!txt) return '';
  // 이미 완전한 문장(물음표로 끝남)
  if(txt.endsWith('?')) return txt;
  const rebuilt=rebuildQFromGenerator(q,txt);
  if(rebuilt) return rebuilt;
  return legacyRestoreQText(q,txt);
}

// js/generators/highschool.js 의 실제 문제 생성 템플릿을 그대로 재현해 완성 문장 후보를
// 만들고, 그 후보의 앞부분이 저장된(잘린) qTxt와 정확히 일치할 때만 채택한다.
// (문장 끝을 그럴듯하게 추측해 붙이는 방식이 아니라, 원본 생성 로직을 역산 + 검증하는 방식)
function rebuildQFromGenerator(q,txt){
  const topic=q.topic||'';
  const solAll=Array.isArray(q.sol)?q.sol.join('\n'):'';
  const cAnsNum=parseFloat(q.cAns);
  const MINUS='−'; // 생성기가 사용하는 유니코드 마이너스 기호(−)
  const fits=cand=>cand&&cand.slice(0,txt.length)===txt?cand:null;
  let m;

  if(topic==='이차방정식 근과 계수'){
    m=txt.match(/^이차방정식 x²\+(\d+)x([+-]\d+)=0의 두 근을 α, β라고 할/);
    if(m){
      const base=`이차방정식 x²+${m[1]}x${m[2]}=0의 두 근을 α, β라고 할 때, `;
      if(solAll.includes('α+β를 묻고')) return fits(base+'α+β의 값은?');
      if(solAll.includes('αβ를 묻고')) return fits(base+'αβ의 값은?');
      const p=+m[1],qv=+m[2];
      if(!isNaN(cAnsNum)){
        if(cAnsNum===-p) return fits(base+'α+β의 값은?');
        if(cAnsNum===qv) return fits(base+'αβ의 값은?');
      }
      return fits(base+'α+β의 값은?')||fits(base+'αβ의 값은?');
    }
  }

  if(topic==='두 근→이차방정식'){
    m=txt.match(/^두 수 (\d+), (\d+)를 근으로 하고 x²의 계수가 1인 이차/);
    if(m){
      const r1=+m[1],r2=+m[2],sum=r1+r2,prod=r1*r2;
      const base=`두 수 ${r1}, ${r2}를 근으로 하고 x²의 계수가 1인 이차방정식이 `;
      const sumCand=base+`x²${MINUS}ax+${prod}=0일 때, 상수 a의 값은?`;
      const prodCand=base+`x²${MINUS}${sum}x+a=0일 때, 상수 a의 값은?`;
      if(solAll.includes('x의 계수는')) return fits(sumCand);
      if(solAll.includes('상수 항이')) return fits(prodCand);
      if(!isNaN(cAnsNum)){
        if(cAnsNum===sum) return fits(sumCand);
        if(cAnsNum===prod) return fits(prodCand);
      }
      return fits(sumCand)||fits(prodCand);
    }
  }

  if(topic==='이차방정식 중근'){
    m=txt.match(/^이차방정식 x²([+-]\d+x)\+(\d+)=0이/);
    if(m) return fits(`이차방정식 x²${m[1]}+${m[2]}=0이 중근을 가질 때, 상수 a의 값은?`);
  }

  if(topic==='삼차방정식 한 근'){
    m=txt.match(/^삼차방정식 x³([+-]\d+x²)([+-]\d+x)\+a=0의 한 근이 (-?\d+)일/);
    if(m) return fits(`삼차방정식 x³${m[1]}${m[2]}+a=0의 한 근이 ${m[3]}일 때, 상수 a의 값은?`);
  }

  if(topic==='사차방정식 한 근'){
    m=txt.match(/^사차방정식 x⁴([+-]\d+x²)\+a=0의 한 근이 (-?\d+)일/);
    if(m) return fits(`사차방정식 x⁴${m[1]}+a=0의 한 근이 ${m[2]}일 때, 상수 a의 값은?`);
  }

  if(topic==='연립방정식'){
    m=txt.match(/^연립방정식의 해가 x=(-?\d+), y=b일/);
    if(m) return fits(`연립방정식의 해가 x=${m[1]}, y=b일 때, 두 상수 a, b에 대하여 a+b의 값은?`);
  }

  if(topic==='이차부등식'){
    m=txt.match(/^이차부등식 (\(x[+−-][^)]*\)\(x[+−-][^)]*\))([≤≥]0)/);
    if(m) return fits(`이차부등식 ${m[1]}${m[2]}의 해는?`);
  }

  if(topic==='연립부등식'){
    m=txt.match(/^연립부등식의 해가 (-?\d+)<x<a일/);
    if(m) return fits(`연립부등식의 해가 ${m[1]}<x<a일 때, 상수 a의 값은?`);
  }

  if(topic==='절댓값 부등식'){
    m=txt.match(/^부등식 (.+?[≤≥]\d+)의 해를/);
    if(m) return fits(`부등식 ${m[1]}의 해를 수직선 위에 나타내면 그림과 같다. 상수 a의 값은?`);
  }

  if(topic==='복소수'){
    m=txt.match(/^등식 \(x−(\d+)\)\+(\d+)i=(\d+)\+(\d+)i를 만족하는/);
    if(m) return fits(`등식 (x${MINUS}${m[1]})+${m[2]}i=${m[3]}+${m[4]}i를 만족하는 실수 x, y의 값은? (단, i=√${MINUS}1)`);
  }

  if(topic==='켤레복소수'){
    m=txt.match(/^복소수 z=a\+2i에 대하여 z\+z̄=(-?\d+)일/);
    if(m) return fits(`복소수 z=a+2i에 대하여 z+z̄=${m[1]}일 때, 실수 a의 값은? (단, i=√${MINUS}1, z̄는 z의 켤레복소수)`);
    m=txt.match(/^복소수 (\d+)\+(\d+)i의 켤레복소수를 p\+qi라 할/);
    if(m) return fits(`복소수 ${m[1]}+${m[2]}i의 켤레복소수를 p+qi라 할 때, p+q의 값은? (단, i=√${MINUS}1)`);
    m=txt.match(/^복소수 (\d+)−(\d+)i의 켤레복소수가 a\+(\d+)i일/);
    if(m) return fits(`복소수 ${m[1]}${MINUS}${m[2]}i의 켤레복소수가 a+${m[3]}i일 때, 실수 a의 값은? (단, i=√${MINUS}1)`);
  }

  return null;
}

// 위 템플릿 역산으로 복원되지 않는 구형 로그를 위한 보조 규칙(느슨한 접미어 추측)
function legacyRestoreQText(q,txt){
  const topic=q.topic||'';
  const solAll=(q.sol||[]).join('\n');
  // 나머지 정리 (두 패턴)
  // cubic:     "...나누었을 때의"  →  " 나머지는?"
  // quadratic: "...때, 나머지"    →  "는?"
  if(topic==='나머지 정리'){
    if(/나누었을 때의$/.test(txt)) return txt+' 나머지는?';
    if(/때, 나머지$/.test(txt)) return txt+'는?';
  }
  // 다항식 사칙연산: "...에 대하여 A" or "...에 대하여 A+" or "...에 대하여 A-"
  if(topic==='다항식 사칙연산'){
    if(/에 대하여 A\+$/.test(txt)) return txt+'B는?';
    if(/에 대하여 A\-$/.test(txt)) return txt+'B는?';
    if(/에 대하여 A$/.test(txt)){
      const isAdd=solAll.includes('더할')||solAll.includes('A+B');
      return txt+(isAdd?'+B는?':'-B는?');
    }
  }
  // 항등식: "...항등식일" or "...항등식"
  if(topic==='항등식'){
    if(/항등식일$/.test(txt)) return txt+' 때, 두 상수 a, b에 대하여 a+b의 값은?';
    if(/항등식$/.test(txt)) return txt+'일 때, 두 상수 a, b에 대하여 a+b의 값은?';
  }
  // 나누어떨어지는 조건
  if(topic==='나누어떨어지는 조건'){
    if(/나누어떨어질 때$/.test(txt)) return txt+', 상수 a의 값은?';
    if(/나누어떨어$/.test(txt)) return txt+'질 때, 상수 a의 값은?';
  }
  // 인수분해
  if(topic==='인수분해'){
    if(/상수 a$/.test(txt)) return txt+'의 값은?';
    if(/a의 값$/.test(txt)) return txt+'은?';
    if(/a의 값은$/.test(txt)) return txt+'?';
  }
  return txt;
}

// 중졸·고졸 검정고시 수학 영역 자동 분류
function classifyWrongQTopic(q){
  const src=((q.topic||'')+(restoreQText(q)||'')+(q._logType||'')).toLowerCase();
  if(/수와\s*연산|자연수|정수|유리수|실수|분수|소수|약수|배수|최대공약수|최소공배수|소인수|집합|무한소수|순환소수/.test(src))return'수와 연산';
  if(/방정식|부등식|연립|이차방정식|이차부등식|일차방정식|일차부등식|판별식|근의 공식|절댓값 방정식/.test(src))return'방정식과 부등식';
  if(/이차함수|일차함수|유리함수|무리함수|지수함수|로그함수|함수|평행이동|대칭이동|역함수|합성함수/.test(src))return'함수';
  if(/수열|등차|등비|시그마|귀납법|점화식/.test(src))return'수열';
  if(/확률|경우의 수|조합|순열|통계|평균|분산|표준편차|도수|히스토그램|줄기잎/.test(src))return'확률과 통계';
  if(/삼각형|사각형|다각형|원|입체|도형|피타고라스|넓이|부피|겉넓이|내각|외각|평행사변형|직선|점과 직선|거리|벡터|기하/.test(src))return'기하';
  if(/삼각함수|사인|코사인|탄젠트|sin|cos|tan|호도법/.test(src))return'삼각함수';
  if(/미분|적분|극한|미적분|도함수|부정적분|정적분/.test(src))return'미적분';
  if(/인수분해|다항식|전개|문자와\s*식|식의 계산|단항식|다항식/.test(src))return'문자와 식';
  if(/지수|로그|상용로그/.test(src))return'지수·로그';
  return'기타';
}

const WRONG_Q_CATEGORY_ORDER=['수와 연산','문자와 식','방정식과 부등식','함수','수열','확률과 통계','기하','삼각함수','지수·로그','미적분','기타'];

// 구버전 데이터(q.graph 없는 기하 오답)를 qTxt에서 그래프 파라미터 복원
function tryReconstructGraph(q){
  if(q.graph)return q.graph;
  const raw=(restoreQText(q)||'');
  const txt=raw.replace(/−/g,'-').replace(/≤/g,'<=').replace(/≥/g,'>=').replace(/²/g,'^2');
  const type=q.meta?.type||'';

  // 무리함수: "y = a√x 를 x축 방향으로 ±dx만큼, y축 방향으로 ±dy만큼 이동하면?"
  if(type==='무리함수'||txt.includes('√x')||txt.includes('무리함수')){
    const pM=txt.match(/x축 방향으로 ([+-]?\d+)/);
    const qM=txt.match(/y축 방향으로 ([+-]?\d+)/);
    if(pM&&qM){
      const aM=txt.match(/y\s*=\s*(-?\d+)√x/)||txt.match(/y\s*=\s*(-?\d+)√x/);
      const aNegM=txt.match(/y\s*=\s*-√x/)||txt.match(/y\s*=\s*-√x/);
      const a=aNegM?-1:(aM&&aM[1]?parseInt(aM[1]):1);
      return{type:'radical',a,p:parseInt(pM[1]),q:parseInt(qM[1])};
    }
  }

  // 유리함수: "y = k/x 를 x축 방향으로 ±dx만큼, y축 방향으로 ±dy만큼 이동하면?"
  if(type==='유리함수'||txt.includes('유리함수')||(txt.includes('/x')&&txt.includes('이동'))){
    const kM=txt.match(/y\s*=\s*(-?\d+)\/x/);
    const pM=txt.match(/x축 방향으로 ([+-]?\d+)/);
    const qM=txt.match(/y축 방향으로 ([+-]?\d+)/);
    if(kM&&pM&&qM)return{type:'rational',k:parseInt(kM[1]),p:parseInt(pM[1]),q:parseInt(qM[1])};
  }

  // 이차함수: "y = a(x±p)² ± q 에서 ds <= x <= de 일 때..."
  if(type.includes('이차함수')||txt.includes('이차함수')){
    const domM=txt.match(/(-?\d+)\s*<=\s*x\s*<=\s*(-?\d+)/);
    if(domM){
      const ds=parseInt(domM[1]),de=parseInt(domM[2]);
      const fM=txt.match(/y\s*=\s*(-?\d*)\s*\(x([+-]?\d*)\)\^2\s*([+-]\s*\d+)?/);
      let a=1,p=0,qv=0;
      if(fM){
        if(fM[1]==='-')a=-1;
        else if(fM[1]&&fM[1]!=='')a=parseInt(fM[1])||1;
        p=fM[2]&&fM[2]!==''?-parseInt(fM[2]):0;
        if(fM[3])qv=parseInt(fM[3].replace(/\s/g,''))||0;
      }
      return{type:'quadratic',a,p,q:qv,ds,de};
    }
  }

  // 점과 직선 거리: "점 (x0, y0)에서 직선 ax±by±c = 0까지의 거리는?"
  if(type.includes('점과직선거리')||type.includes('점과 직선')||txt.includes('까지의 거리')){
    const ptM=txt.match(/점\s*\((-?\d+),\s*(-?\d+)\)/);
    const lineM=txt.match(/직선\s*(-?\d+)x([+-]\d+)y([+-]\d+)\s*=\s*0/);
    if(ptM&&lineM)return{type:'distance',ptX:parseInt(ptM[1]),ptY:parseInt(ptM[2]),la:parseInt(lineM[1]),lb:parseInt(lineM[2]),lc:parseInt(lineM[3])};
  }

  // 원의 방정식
  if(type==='원의 방정식'||txt.includes('원의 방정식')){
    const cM=txt.match(/중심이?\s*\((-?\d+),\s*(-?\d+)\).*?반지름이?\s*(\d+)/);
    if(cM)return{type:'circle',h:parseInt(cM[1]),k:parseInt(cM[2]),r:parseInt(cM[3])};
    const xTM=txt.match(/\(x([+-]\d+)\)\^2/);
    const yTM=txt.match(/\(y([+-]\d+)\)\^2/);
    const rSqM=txt.match(/\)\^2\s*=\s*(\d+)/);
    if(rSqM){const r2=parseInt(rSqM[1]);const r=Math.round(Math.sqrt(r2));if(r*r===r2)return{type:'circle',h:xTM?-parseInt(xTM[1]):0,k:yTM?-parseInt(yTM[1]):0,r};}
  }

  // 대칭이동: "점 (px, py)를 sym에 대하여 대칭이동한 점은?"
  if(type==='대칭이동'||txt.includes('대칭이동')){
    const ptM=txt.match(/점\s*\((-?\d+),\s*(-?\d+)\)/);
    const symM=txt.match(/(x축|y축|원점|y=-x|y=x)/);
    if(ptM&&symM)return{type:'symmetry',px:parseInt(ptM[1]),py:parseInt(ptM[2]),sym:symM[1]};
  }

  return null;
}

// 그래프 데이터 → 인쇄용 SVG 문자열 (GraphPreview와 동일한 로직, React 없이)
function graphToSVGStr(g){
  if(!g)return'';

  if(g.type==='system_eq'){
    const{eqs}=g;
    const lineH=34,padX=18,padY=16,svgH=padY*2+eqs.length*lineH,svgW=280;
    const top=padY+lineH/2-2,bot=padY+(eqs.length-1)*lineH+lineH/2+2,mid=(top+bot)/2;
    const bx=10,ins=6;
    const bp=`M${bx+ins},${top} Q${bx},${top} ${bx},${top+8} L${bx},${mid-6} Q${bx},${mid} ${bx-ins},${mid} Q${bx},${mid} ${bx},${mid+6} L${bx},${bot-8} Q${bx},${bot} ${bx+ins},${bot}`;
    const eqT=eqs.map((eq,i)=>`<text x="${padX}" y="${padY+(i+0.5)*lineH+6}" font-size="15" font-weight="700" fill="#1e293b" font-family="monospace">${eq}</text>`).join('');
    return`<svg width="${svgW}" height="${svgH}" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:6px auto"><path d="${bp}" fill="none" stroke="#374151" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>${eqT}</svg>`;
  }

  const W=220,H=180,SC=22;
  let CX=W/2,CY=H/2;
  if(g.type==='circle'){CX=W/2-g.h*SC*0.5;CY=H/2+g.k*SC*0.5;}
  if(g.type==='rational'){CX=W/2-g.p*SC;CY=H/2+g.q*SC;}
  if(g.type==='two_point'){CX=W/2-((g.x1+g.x2)/2)*SC;CY=H/2+((g.y1+g.y2)/2)*SC;}
  const toSx=x=>CX+x*SC,toSy=y=>CY-y*SC;
  const ticks=[-4,-3,-2,-1,1,2,3,4],lbls=[-4,-2,2,4];
  let grd='',lbl='';
  ticks.forEach(n=>{grd+=`<line x1="${toSx(n).toFixed(1)}" y1="4" x2="${toSx(n).toFixed(1)}" y2="${H-4}" stroke="#eef1f6" stroke-width="0.6"/><line x1="4" y1="${toSy(n).toFixed(1)}" x2="${W-4}" y2="${toSy(n).toFixed(1)}" stroke="#eef1f6" stroke-width="0.6"/>`;});
  lbls.forEach(n=>{lbl+=`<text x="${toSx(n).toFixed(1)}" y="${(CY+13).toFixed(1)}" text-anchor="middle" font-size="10" fill="#9ca3af" font-weight="600">${n}</text><text x="${(CX-6).toFixed(1)}" y="${(toSy(n)+3).toFixed(1)}" text-anchor="end" font-size="10" fill="#9ca3af" font-weight="600">${n}</text>`;});
  const axs=`<line x1="4" y1="${CY.toFixed(1)}" x2="${W-4}" y2="${CY.toFixed(1)}" stroke="#374151" stroke-width="1.8"/><line x1="${CX.toFixed(1)}" y1="4" x2="${CX.toFixed(1)}" y2="${H-4}" stroke="#374151" stroke-width="1.8"/><polygon points="${W-4},${CY.toFixed(1)} ${W-12},${(CY-3).toFixed(1)} ${W-12},${(CY+3).toFixed(1)}" fill="#374151"/><polygon points="${CX.toFixed(1)},4 ${(CX-3).toFixed(1)},12 ${(CX+3).toFixed(1)},12" fill="#374151"/><text x="${W-3}" y="${(CY+12).toFixed(1)}" font-size="9" fill="#374151" font-weight="bold">x</text><text x="${(CX+5).toFixed(1)}" y="14" font-size="9" fill="#374151" font-weight="bold">y</text>`;
  const baseAxes=grd+lbl+axs;
  const svgWrap=i=>`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" style="border:1px solid #e5e7eb;border-radius:8px;background:white;display:block;margin:6px auto">${i}</svg>`;

  if(g.type==='quadratic'){
    const{a,p,q:vq,ds,de}=g;
    const yDs=a*(ds-p)**2+vq,yDe=a*(de-p)**2+vq;
    const xLo=ds-Math.max(0.6,(de-ds)*0.12),xHi=de+Math.max(0.6,(de-ds)*0.12);
    const keyYs=[yDs,yDe,vq],rawYMin=Math.min(...keyYs),rawYMax=Math.max(...keyYs);
    const ySpan=Math.max(rawYMax-rawYMin,1),yPad=Math.max(1,ySpan*0.28);
    const yLo=rawYMin-yPad,yHi=rawYMax+yPad;
    const mg=26,qSCx=Math.min(38,Math.max(12,(W-2*mg)/(xHi-xLo))),qSCy=Math.min(38,Math.max(8,(H-2*mg)/(yHi-yLo)));
    const toQx=x=>mg+(x-xLo)*qSCx,toQy=y=>H-mg-(y-yLo)*qSCy;
    const axY=toQy(0),axX=toQx(0),axYv=axY>=4&&axY<=H-4,axXv=axX>=4&&axX<=W-4;
    const xI=[],yI=[];
    for(let n=Math.ceil(xLo);n<=Math.floor(xHi);n++)xI.push(n);
    for(let n=Math.ceil(yLo);n<=Math.floor(yHi);n++)yI.push(n);
    const xSt=Math.max(1,Math.ceil(xI.length/5)),ySt=Math.max(1,Math.ceil(yI.length/5));
    let qg='';xI.forEach(n=>{qg+=`<line x1="${toQx(n).toFixed(1)}" y1="4" x2="${toQx(n).toFixed(1)}" y2="${H-4}" stroke="#eef1f6" stroke-width="0.6"/>`;});
    yI.forEach(n=>{qg+=`<line x1="4" y1="${toQy(n).toFixed(1)}" x2="${W-4}" y2="${toQy(n).toFixed(1)}" stroke="#eef1f6" stroke-width="0.6"/>`;});
    let qa='';
    if(axYv){qa+=`<line x1="4" y1="${axY.toFixed(1)}" x2="${W-4}" y2="${axY.toFixed(1)}" stroke="#374151" stroke-width="1.8"/><polygon points="${W-4},${axY.toFixed(1)} ${W-12},${(axY-3).toFixed(1)} ${W-12},${(axY+3).toFixed(1)}" fill="#374151"/><text x="${W-3}" y="${Math.min(axY+12,H-2).toFixed(1)}" font-size="9" fill="#374151" font-weight="bold">x</text>`;
      xI.forEach((n,i)=>{if(n!==0&&i%xSt===0&&toQx(n)>12&&toQx(n)<W-10)qa+=`<text x="${toQx(n).toFixed(1)}" y="${Math.min(axY+13,H-2).toFixed(1)}" text-anchor="middle" font-size="9" fill="#9ca3af" font-weight="600">${n}</text>`;});}
    if(axXv){qa+=`<line x1="${axX.toFixed(1)}" y1="4" x2="${axX.toFixed(1)}" y2="${H-4}" stroke="#374151" stroke-width="1.8"/><polygon points="${axX.toFixed(1)},4 ${(axX-3).toFixed(1)},12 ${(axX+3).toFixed(1)},12" fill="#374151"/><text x="${(axX+5).toFixed(1)}" y="14" font-size="9" fill="#374151" font-weight="bold">y</text>`;
      yI.forEach((n,i)=>{if(n!==0&&i%ySt===0&&toQy(n)>10&&toQy(n)<H-6)qa+=`<text x="${Math.max(axX-6,14).toFixed(1)}" y="${(toQy(n)+3).toFixed(1)}" text-anchor="end" font-size="9" fill="#9ca3af" font-weight="600">${n}</text>`;});}
    const pts=[],rpPts=[];
    for(let xi=xLo;xi<=xHi;xi+=0.1){const yi=a*(xi-p)**2+vq,sx=toQx(xi),sy=toQy(yi);if(sx>=-4&&sx<=W+4&&sy>=-4&&sy<=H+4)pts.push(`${sx.toFixed(1)},${sy.toFixed(1)}`);}
    for(let xi=ds;xi<=de;xi+=0.08){const yi=a*(xi-p)**2+vq,sx=toQx(xi),sy=toQy(yi);if(sy>=-4&&sy<=H+4)rpPts.push(`${sx.toFixed(1)},${sy.toFixed(1)}`);}
    const vxInR=p>=ds&&p<=de,cand=[{x:ds,y:yDs},{x:de,y:yDe}];
    if(vxInR)cand.push({x:p,y:vq});
    const ep=a>0?cand.reduce((m,c)=>c.y<m.y?c:m):cand.reduce((m,c)=>c.y>m.y?c:m);
    const ec=a>0?'#2563eb':'#ef4444',col=a>0?'#4f46e5':'#ef4444';
    let qc='';
    if(pts.length>1)qc+=`<polyline points="${pts.join(' ')}" fill="none" stroke="#c7d2fe" stroke-width="1.4"/>`;
    if(rpPts.length>1)qc+=`<polyline points="${rpPts.join(' ')}" fill="none" stroke="${col}" stroke-width="3" stroke-linecap="round"/>`;
    const epSx=toQx(ep.x),epSy=toQy(ep.y);
    if(axYv)qc+=`<line x1="${epSx.toFixed(1)}" y1="${epSy.toFixed(1)}" x2="${epSx.toFixed(1)}" y2="${axY.toFixed(1)}" stroke="${ec}" stroke-width="1.1" stroke-dasharray="3,2" opacity="0.7"/>`;
    if(axXv)qc+=`<line x1="${axX.toFixed(1)}" y1="${epSy.toFixed(1)}" x2="${epSx.toFixed(1)}" y2="${epSy.toFixed(1)}" stroke="${ec}" stroke-width="1.1" stroke-dasharray="3,2" opacity="0.7"/>`;
    if(axYv)qc+=`<text x="${epSx.toFixed(1)}" y="${Math.min(axY+13,H-2).toFixed(1)}" text-anchor="middle" font-size="10" fill="${ec}" font-weight="900" stroke="white" stroke-width="2.5" paint-order="stroke">${ep.x}</text>`;
    if(axXv)qc+=`<text x="${Math.max(axX-5,14).toFixed(1)}" y="${(epSy+4).toFixed(1)}" text-anchor="end" font-size="10" fill="${ec}" font-weight="900" stroke="white" stroke-width="2.5" paint-order="stroke">${Math.round(ep.y*100)/100}</text>`;
    return svgWrap(qg+qa+qc);
  }

  if(g.type==='radical'){
    const{a,p,q:vq}=g;
    const aStr=a===1?'':(a===-1?'−':String(a));
    const pStr=p===0?'x':(p>0?`x−${p}`:`x+${-p}`);
    const qStr=vq===0?'':(vq>0?`+${vq}`:`−${-vq}`);
    const xLo=Math.min(0,p)-0.3,xHi=Math.max(0,p)+5.5;
    const allY=[0,vq,a*Math.sqrt(Math.max(0,xHi-p))+vq,a*Math.sqrt(xHi)];
    const yLoR=Math.min(...allY)-0.6,yHiR=Math.max(...allY)+0.8;
    const mg=22,scX=(W-2*mg)/(xHi-xLo),scY=(H-2*mg)/(yHiR-yLoR),sc=Math.min(scX,scY,28);
    const rtx=x=>mg+(x-xLo)*sc,rty=y=>H-mg-(y-yLoR)*sc;
    const axY=rty(0),axX=rtx(0),axYv=axY>=4&&axY<=H-4,axXv=axX>=4&&axX<=W-4;
    const xI=[],yI=[];
    for(let n=Math.ceil(xLo);n<=Math.floor(xHi);n++)xI.push(n);
    for(let n=Math.ceil(yLoR);n<=Math.floor(yHiR);n++)yI.push(n);
    let rg='';xI.forEach(n=>{rg+=`<line x1="${rtx(n).toFixed(1)}" y1="4" x2="${rtx(n).toFixed(1)}" y2="${H-4}" stroke="#eef1f6" stroke-width="0.6"/>`;});
    yI.forEach(n=>{rg+=`<line x1="4" y1="${rty(n).toFixed(1)}" x2="${W-4}" y2="${rty(n).toFixed(1)}" stroke="#eef1f6" stroke-width="0.6"/>`;});
    let ra='';
    if(axYv){ra+=`<line x1="4" y1="${axY.toFixed(1)}" x2="${W-4}" y2="${axY.toFixed(1)}" stroke="#374151" stroke-width="1.8"/><polygon points="${W-4},${axY.toFixed(1)} ${W-12},${(axY-3).toFixed(1)} ${W-12},${(axY+3).toFixed(1)}" fill="#374151"/><text x="${W-3}" y="${Math.min(axY+12,H-2).toFixed(1)}" font-size="9" fill="#374151" font-weight="bold">x</text>`;
      xI.forEach(n=>{if(n!==0&&rtx(n)>12&&rtx(n)<W-8)ra+=`<text x="${rtx(n).toFixed(1)}" y="${Math.min(axY+13,H-2).toFixed(1)}" text-anchor="middle" font-size="9" fill="#9ca3af" font-weight="600">${n}</text>`;});}
    if(axXv){ra+=`<line x1="${rtx(p).toFixed(1)}" y1="4" x2="${rtx(p).toFixed(1)}" y2="${H-4}" stroke="#374151" stroke-width="1.8"/><polygon points="${rtx(p).toFixed(1)},4 ${(rtx(p)-3).toFixed(1)},12 ${(rtx(p)+3).toFixed(1)},12" fill="#374151"/><text x="${(rtx(p)+5).toFixed(1)}" y="14" font-size="9" fill="#374151" font-weight="bold">y</text>`;
      yI.forEach(n=>{if(n!==0&&rty(n)>8&&rty(n)<H-4)ra+=`<text x="${Math.max(rtx(p)-5,14).toFixed(1)}" y="${(rty(n)+3).toFixed(1)}" text-anchor="end" font-size="9" fill="#9ca3af" font-weight="600">${n}</text>`;});}
    const cRef='#9ca3af',cMain='#059669';
    const refPts=[],mainPts=[];
    for(let xi=0;xi<=xHi;xi+=0.08){const yi=a*Math.sqrt(xi);const sx=rtx(xi),sy=rty(yi);if(sy>=-4&&sy<=H+4&&sx<=W+4)refPts.push(`${sx.toFixed(1)},${sy.toFixed(1)}`);}
    for(let xi=p;xi<=xHi;xi+=0.08){const yi=a*Math.sqrt(Math.max(0,xi-p))+vq;const sx=rtx(xi),sy=rty(yi);if(sy>=-4&&sy<=H+4&&sx<=W+4)mainPts.push(`${sx.toFixed(1)},${sy.toFixed(1)}`);}
    const rLX=Math.min(xHi*0.45,3),rLY=a*Math.sqrt(Math.max(0,rLX));
    const mLX=p+Math.min(2.5,(xHi-p)*0.45),mLY=a*Math.sqrt(Math.max(0,mLX-p))+vq;
    let rc='';
    if(refPts.length>1)rc+=`<polyline points="${refPts.join(' ')}" fill="none" stroke="${cRef}" stroke-width="2" stroke-dasharray="5,3"/>`;
    if(refPts.length>3)rc+=`<text x="${(rtx(rLX)+4).toFixed(1)}" y="${(rty(rLY)+(a>0?-7:9)).toFixed(1)}" font-size="9" fill="${cRef}" font-weight="bold">y=${aStr}&#x221A;x</text>`;
    if(mainPts.length>1)rc+=`<polyline points="${mainPts.join(' ')}" fill="none" stroke="${cMain}" stroke-width="3" stroke-linecap="round"/>`;
    if(axYv)rc+=`<line x1="${rtx(p).toFixed(1)}" y1="${rty(vq).toFixed(1)}" x2="${rtx(p).toFixed(1)}" y2="${axY.toFixed(1)}" stroke="${cMain}" stroke-width="1.2" stroke-dasharray="3,2" opacity="0.7"/>`;
    if(axXv)rc+=`<line x1="${axX.toFixed(1)}" y1="${rty(vq).toFixed(1)}" x2="${rtx(p).toFixed(1)}" y2="${rty(vq).toFixed(1)}" stroke="${cMain}" stroke-width="1.2" stroke-dasharray="3,2" opacity="0.7"/>`;
    rc+=`<circle cx="${rtx(p).toFixed(1)}" cy="${rty(vq).toFixed(1)}" r="4.5" fill="${cMain}" stroke="white" stroke-width="2"/>`;
    if(mainPts.length>3)rc+=`<text x="${(rtx(mLX)+4).toFixed(1)}" y="${(rty(mLY)+(a>0?-7:9)).toFixed(1)}" font-size="9" fill="${cMain}" font-weight="bold">y=${aStr}&#x221A;(${pStr})${qStr}</text>`;
    return svgWrap(rg+ra+rc);
  }

  if(g.type==='rational'){
    const{k,p,q:vq}=g;const eps=0.18;const ptsL=[],ptsR=[];
    for(let xi=p-6;xi<p-eps;xi+=0.12){const yi=k/(xi-p)+vq;if(Math.abs(yi-vq)<=5&&toSx(xi)>=4&&toSx(xi)<=W-4)ptsL.push(`${toSx(xi).toFixed(1)},${toSy(yi).toFixed(1)}`);}
    for(let xi=p+eps;xi<=p+6;xi+=0.12){const yi=k/(xi-p)+vq;if(Math.abs(yi-vq)<=5&&toSx(xi)>=4&&toSx(xi)<=W-4)ptsR.push(`${toSx(xi).toFixed(1)},${toSy(yi).toFixed(1)}`);}
    const col='#7c3aed';
    let rc=`<line x1="${toSx(p).toFixed(1)}" y1="6" x2="${toSx(p).toFixed(1)}" y2="${H-6}" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="5,3" opacity="0.85"/><line x1="6" y1="${toSy(vq).toFixed(1)}" x2="${W-6}" y2="${toSy(vq).toFixed(1)}" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="5,3" opacity="0.85"/>`;
    rc+=`<text x="${(toSx(p)+4).toFixed(1)}" y="14" font-size="8" fill="#d97706" font-weight="bold">x=${p}</text><text x="${W-28}" y="${(toSy(vq)-4).toFixed(1)}" font-size="8" fill="#d97706" font-weight="bold">y=${vq}</text>`;
    if(ptsL.length>1)rc+=`<polyline points="${ptsL.join(' ')}" fill="none" stroke="${col}" stroke-width="2.8" stroke-linecap="round"/>`;
    if(ptsR.length>1)rc+=`<polyline points="${ptsR.join(' ')}" fill="none" stroke="${col}" stroke-width="2.8" stroke-linecap="round"/>`;
    return svgWrap(baseAxes+rc);
  }

  if(g.type==='circle'){
    const{h,k:ck,r}=g;const mg=26;
    const xs=[h-r,h+r,0],ys=[ck-r,ck+r,0];
    const xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys);
    const spanX=Math.max(xmax-xmin,1),spanY=Math.max(ymax-ymin,1);
    const cSC=Math.min((W-2*mg)/spanX,(H-2*mg)/spanY,26);
    const ox=W/2-((xmin+xmax)/2)*cSC,oy=H/2+((ymin+ymax)/2)*cSC;
    const tx=x=>ox+x*cSC,ty=y=>oy-y*cSC;const col='#2563eb';
    const xTR=[],yTR=[];
    for(let n=Math.ceil(xmin);n<=Math.floor(xmax);n++)xTR.push(n);
    for(let n=Math.ceil(ymin);n<=Math.floor(ymax);n++)yTR.push(n);
    const xSt=Math.max(1,Math.round(xTR.length/5)),ySt=Math.max(1,Math.round(yTR.length/5));
    const axXv=ty(0)>=4&&ty(0)<=H-4,axYv=tx(0)>=4&&tx(0)<=W-4;
    let cg='';xTR.forEach(n=>{cg+=`<line x1="${tx(n).toFixed(1)}" y1="4" x2="${tx(n).toFixed(1)}" y2="${H-4}" stroke="#eef1f6" stroke-width="0.6"/>`;});
    yTR.forEach(n=>{cg+=`<line x1="4" y1="${ty(n).toFixed(1)}" x2="${W-4}" y2="${ty(n).toFixed(1)}" stroke="#eef1f6" stroke-width="0.6"/>`;});
    let ca='';
    if(axXv){ca+=`<line x1="4" y1="${ty(0).toFixed(1)}" x2="${W-4}" y2="${ty(0).toFixed(1)}" stroke="#374151" stroke-width="1.8"/>`;xTR.forEach((n,i)=>{if(n!==0&&i%xSt===0)ca+=`<text x="${tx(n).toFixed(1)}" y="${Math.min(ty(0)+13,H-2).toFixed(1)}" text-anchor="middle" font-size="9" fill="#9ca3af" font-weight="600">${n}</text>`;});}
    if(axYv){ca+=`<line x1="${tx(0).toFixed(1)}" y1="4" x2="${tx(0).toFixed(1)}" y2="${H-4}" stroke="#374151" stroke-width="1.8"/>`;yTR.forEach((n,i)=>{if(n!==0&&i%ySt===0)ca+=`<text x="${Math.max(tx(0)-6,12).toFixed(1)}" y="${(ty(n)+3).toFixed(1)}" text-anchor="end" font-size="9" fill="#9ca3af" font-weight="600">${n}</text>`;});}
    let cc=`<circle cx="${tx(h).toFixed(1)}" cy="${ty(ck).toFixed(1)}" r="${(r*cSC).toFixed(1)}" fill="rgba(37,99,235,0.06)" stroke="${col}" stroke-width="2.5"/>`;
    cc+=`<line x1="${tx(h).toFixed(1)}" y1="${ty(ck).toFixed(1)}" x2="${tx(h+r).toFixed(1)}" y2="${ty(ck).toFixed(1)}" stroke="${col}" stroke-width="1.8" stroke-dasharray="4,3"/>`;
    cc+=`<text x="${tx(h+r/2).toFixed(1)}" y="${(ty(ck)-7).toFixed(1)}" text-anchor="middle" font-size="12" fill="${col}" font-weight="900" stroke="white" stroke-width="3" paint-order="stroke">r=${r}</text>`;
    cc+=`<circle cx="${tx(h).toFixed(1)}" cy="${ty(ck).toFixed(1)}" r="4.5" fill="${col}" stroke="white" stroke-width="2"/>`;
    cc+=`<text x="${tx(h).toFixed(1)}" y="${(ty(ck)+(ck>=0?20:-12)).toFixed(1)}" text-anchor="middle" font-size="12" fill="${col}" font-weight="900" stroke="white" stroke-width="3.5" paint-order="stroke">&#xC911;&#xC2EC;(${h},${ck})</text>`;
    return svgWrap(cg+ca+cc);
  }

  if(g.type==='distance'){
    const{ptX,ptY,la,lb,lc}=g;const col='#ea580c';
    const lp=[];
    if(Math.abs(lb)>0.001){[-5,5].forEach(xi=>{const yi=-(la*xi+lc)/lb;lp.push([toSx(xi),toSy(yi)]);});}
    else if(Math.abs(la)>0.001){const xi=-lc/la;lp.push([toSx(xi),4],[toSx(xi),H-4]);}
    const dSq=la**2+lb**2,nV=la*ptX+lb*ptY+lc;
    const fX=dSq>0?ptX-la*nV/dSq:ptX,fY=dSq>0?ptY-lb*nV/dSq:ptY;
    let dc='';
    if(lp.length===2)dc+=`<line x1="${lp[0][0].toFixed(1)}" y1="${lp[0][1].toFixed(1)}" x2="${lp[1][0].toFixed(1)}" y2="${lp[1][1].toFixed(1)}" stroke="#374151" stroke-width="2" stroke-linecap="round"/>`;
    dc+=`<line x1="${toSx(ptX).toFixed(1)}" y1="${toSy(ptY).toFixed(1)}" x2="${toSx(fX).toFixed(1)}" y2="${toSy(fY).toFixed(1)}" stroke="${col}" stroke-width="2" stroke-dasharray="4,3"/>`;
    dc+=`<circle cx="${toSx(ptX).toFixed(1)}" cy="${toSy(ptY).toFixed(1)}" r="5" fill="${col}" stroke="white" stroke-width="2"/>`;
    dc+=`<text x="${(toSx(ptX)+7).toFixed(1)}" y="${(toSy(ptY)-5).toFixed(1)}" font-size="9" fill="${col}" font-weight="bold">(${ptX},${ptY})</text>`;
    dc+=`<circle cx="${toSx(fX).toFixed(1)}" cy="${toSy(fY).toFixed(1)}" r="3" fill="white" stroke="${col}" stroke-width="2"/>`;
    const lbS=lb>=0?`+${lb}`:String(lb),lcS=lc>=0?`+${lc}`:String(lc);
    dc+=`<text x="8" y="14" font-size="9" fill="#374151" font-weight="bold">${la}x${lbS}y${lcS}=0</text>`;
    if(Math.abs(nV)>0.01&&dSq>0){
      const len=0.3,nx=-lb/Math.sqrt(dSq),ny=la/Math.sqrt(dSq),ax2=la/Math.sqrt(dSq),ay2=lb/Math.sqrt(dSq);
      const qx=fX+len*(ax2+nx),qy=fY+len*(ay2+ny);
      dc+=`<polyline points="${toSx(fX+len*ax2).toFixed(1)},${toSy(fY+len*ay2).toFixed(1)} ${toSx(qx).toFixed(1)},${toSy(qy).toFixed(1)} ${toSx(fX+len*nx).toFixed(1)},${toSy(fY+len*ny).toFixed(1)}" fill="none" stroke="${col}" stroke-width="1.5"/>`;
    }
    return svgWrap(baseAxes+dc);
  }

  if(g.type==='symmetry'){
    const{px,py,sym}=g;
    const sl=[];
    if(sym==='y=x')sl.push([toSx(-4),toSy(-4),toSx(4),toSy(4)]);
    else if(sym==='y=-x')sl.push([toSx(-4),toSy(4),toSx(4),toSy(-4)]);
    let sc2='';
    if(sl.length>0)sc2+=`<line x1="${sl[0][0].toFixed(1)}" y1="${sl[0][1].toFixed(1)}" x2="${sl[0][2].toFixed(1)}" y2="${sl[0][3].toFixed(1)}" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="5,3"/>`;
    if(sym==='원점')sc2+=`<circle cx="${toSx(0).toFixed(1)}" cy="${toSy(0).toFixed(1)}" r="5" fill="none" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="3,2"/>`;
    sc2+=`<circle cx="${toSx(px).toFixed(1)}" cy="${toSy(py).toFixed(1)}" r="5" fill="#6b7280" stroke="white" stroke-width="2"/>`;
    sc2+=`<text x="${(toSx(px)+7).toFixed(1)}" y="${(toSy(py)-5).toFixed(1)}" font-size="9" fill="#6b7280" font-weight="bold">(${px},${py})</text>`;
    sc2+=`<text x="${(W/2).toFixed(1)}" y="${H-5}" text-anchor="middle" font-size="9" fill="#f59e0b" font-weight="bold">${sym} &#xB300;&#xCE6D;</text>`;
    return svgWrap(baseAxes+sc2);
  }

  if(g.type==='two_point'){
    const{x1,y1,x2,y2}=g;
    let tc=`<line x1="${toSx(x1).toFixed(1)}" y1="${toSy(y1).toFixed(1)}" x2="${toSx(x2).toFixed(1)}" y2="${toSy(y2).toFixed(1)}" stroke="#6366f1" stroke-width="2" stroke-dasharray="5,3"/>`;
    tc+=`<circle cx="${toSx(x1).toFixed(1)}" cy="${toSy(y1).toFixed(1)}" r="5" fill="#4f46e5" stroke="white" stroke-width="2"/>`;
    tc+=`<text x="${(toSx(x1)+8).toFixed(1)}" y="${(toSy(y1)-6).toFixed(1)}" font-size="9" font-weight="bold" fill="#4f46e5">A(${x1},${y1})</text>`;
    tc+=`<circle cx="${toSx(x2).toFixed(1)}" cy="${toSy(y2).toFixed(1)}" r="5" fill="#dc2626" stroke="white" stroke-width="2"/>`;
    tc+=`<text x="${(toSx(x2)+8).toFixed(1)}" y="${(toSy(y2)-6).toFixed(1)}" font-size="9" font-weight="bold" fill="#dc2626">B(${x2},${y2})</text>`;
    return svgWrap(baseAxes+tc);
  }

  return'';
}
