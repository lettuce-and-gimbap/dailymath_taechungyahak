// === js/worksheet/gedCore.js ===
/* =====================================================================
   만능 학습지(GED Sheet) 공통 엔진  —  네임스페이스 GS
   - 수식 표기 도우미 (nf, par, xm, ym, tail, tex, poly ...)
   - 보기(4지선다) 생성 도우미 (numChoices, stepChoices, coordChoices ...)
   - SVG 도형 렌더러 (좌표평면 planeSVG, 수직선, 내분점, 조립제법 표, 사상도)
   - 문제 카드 / 학습지 전체 HTML 템플릿 + 인쇄용 CSS
   기존 앱의 전역 이름(pick, shuffle 등)과 충돌하지 않도록 모두 GS 안에 둔다.
   ===================================================================== */
var GS=(function(){
  let UID=0;
  const nf=v=>Number.isInteger(v)?String(v):String(Math.round(v*1000)/1000);
  const par=v=>v<0?`(${nf(v)})`:nf(v);
  const xm=p=>p===0?'x':(p>0?`x-${nf(p)}`:`x+${nf(-p)}`);
  const ym=q=>q===0?'y':(q>0?`y-${nf(q)}`:`y+${nf(-q)}`);
  const tail=q=>q===0?'':(q>0?`+${nf(q)}`:`-${nf(-q)}`);
  const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const tex=t=>`<span class="tx" contenteditable="false" data-tex="${esc(t)}"></span>`;
  const pr=(a,b)=>`(${nf(a)},\\ ${nf(b)})`;
  const rnd=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
  const pick=arr=>arr[rnd(0,arr.length-1)];
  const nz=(a,b)=>{let v=rnd(a,b);let g=0;while(v===0&&g++<20)v=rnd(a,b);return v===0?1:v;};
  const CIRC=['①','②','③','④'];
  const isInt=v=>Math.abs(v-Math.round(v))<1e-9;
  const sqrtTex=n=>{const s=Math.round(Math.sqrt(n));return s*s===n?nf(s):`\\sqrt{${nf(n)}}`;};
  const sqrtTxt=n=>{const s=Math.round(Math.sqrt(n));return s*s===n?nf(s):`√${nf(n)}`;};

  function shuffleWith(rng,arr){const a=arr.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  const shuffle=arr=>shuffleWith(Math.random,arr);
  function mulberry(seed){let t=seed>>>0;return()=>{t+=0x6D2B79F5;let r=Math.imul(t^t>>>15,1|t);r^=r+Math.imul(r^r>>>7,61|r);return((r^r>>>14)>>>0)/4294967296;};}

  /* 다항식 항 표기 : 계수 c, 변수식 v("x^3","x","" 상수) */
  function term(c,v,first){
    if(c===0)return'';
    let s='';
    if(c<0)s='-';else if(!first)s='+';
    const a=Math.abs(c);
    if(v==='')s+=nf(a);else s+=(a===1?'':nf(a))+v;
    return s;
  }
  function poly(coefs){let s='',first=true;for(const[c,v]of coefs){const t=term(c,v,first);if(t){s+=t;first=false;}}return s||'0';}

  /* ---------- 보기 만들기 ---------- */
  function numChoices(ans){
    let off=rnd(0,3);
    if(ans>=1&&ans-off<1)off=ans-1;
    const lo=ans-off;
    return{list:[0,1,2,3].map(i=>nf(lo+i)),ans:off};
  }
  function stepChoices(ans,step){let off=rnd(0,3);while(ans-off*step<1&&off>0)off--;const lo=ans-off*step;return{list:[0,1,2,3].map(i=>nf(lo+i*step)),ans:off};}
  /* 정답 1개 + 후보 목록에서 서로 다른 오답 3개 → 섞어서 {list, ans} */
  function pickChoices(correct,cands,fallback){
    const seen=new Set([correct]);const wrongs=[];
    for(const c of cands){if(!seen.has(c)){seen.add(c);wrongs.push(c);}if(wrongs.length===3)break;}
    let k=1;while(wrongs.length<3&&fallback){const c=fallback(k++);if(c&&!seen.has(c)){seen.add(c);wrongs.push(c);}if(k>40)break;}
    const sh=shuffle([{c:correct,ok:true},...wrongs.map(c=>({c,ok:false}))]);
    return{list:sh.map(o=>o.c),ans:sh.findIndex(o=>o.ok)};
  }
  /* 좌표 보기 : 정답 (X,Y) + 부호/자리 바꾼 오답 */
  function coordChoices(X,Y){
    const cands=[[Y,X],[-X,Y],[X,-Y],[-X,-Y],[X+1,Y],[X,Y+1],[X-1,Y-1]].map(([a,b])=>pr(a,b));
    return pickChoices(pr(X,Y),cands,k=>pr(X+k,Y-k));
  }
  function choicesHTML(list,one,raw){
    return`<div class="choices${one?' one':''}">`+list.map((c,i)=>`<span class="ch"><span class="ci">${CIRC[i]}</span> ${raw?c:tex(c)}</span>`).join('')+`</div>`;
  }

  /* =====================================================================
     SVG 렌더러
     ===================================================================== */
  const F='font-family="Jua, Gaegu, sans-serif"';
  const NAVY='#123a6b',RED='#c0272d',GREEN='#1b7f3b',GREY='#9aa7b8';

  /* 좌표평면
     g : {xmin,xmax,ymin,ymax,s?,grid?(기본 true),maxW?}
     items : [{t:'fn'|'circle'|'vline'|'hline'|'seg'|'pt'|'text'|'rangle'|'vdash', ...}] */
  function planeSVG(g,items){
    const{xmin,xmax,ymin,ymax}=g;const pad=g.pad||44;const maxW=g.maxW||440;
    const s=Math.max(14,Math.min(g.s||36,Math.floor((maxW-pad*2)/Math.max(1,xmax-xmin)),Math.floor((maxW-pad*2)/Math.max(1,ymax-ymin))));
    const grid=g.grid!==false;
    const W=(xmax-xmin)*s+pad*2,H=(ymax-ymin)*s+pad*2;
    const X=x=>Math.round((pad+(x-xmin)*s)*10)/10,Y=y=>Math.round((pad+(ymax-y)*s)*10)/10;
    const id='gsclip'+(++UID);
    const fsz=Math.max(15,Math.min(21,Math.round(s*0.6)));
    const L=(x1,y1,x2,y2,c,w,dash='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${w}" ${dash?`stroke-dasharray="${dash}"`:''} stroke-linecap="square"/>`;
    let o=`<svg class="plane" viewBox="0 0 ${W} ${H}" width="${W}" xmlns="http://www.w3.org/2000/svg" ${F}>`;
    o+=`<defs><clipPath id="${id}"><rect x="${X(xmin)-2}" y="${Y(ymax)-2}" width="${(xmax-xmin)*s+4}" height="${(ymax-ymin)*s+4}"/></clipPath></defs>`;
    o+=`<rect x="0" y="0" width="${W}" height="${H}" fill="#ffffff"/>`;
    if(grid){
      for(let i=xmin;i<=xmax;i++)o+=L(X(i),Y(ymin),X(i),Y(ymax),'#8d8d8d',1.3);
      for(let j=ymin;j<=ymax;j++)o+=L(X(xmin),Y(j),X(xmax),Y(j),'#8d8d8d',1.3);
    }
    /* 축 */
    o+=L(X(xmin)-14,Y(0),X(xmax)+14,Y(0),'#000',4)+L(X(0),Y(ymin)+14,X(0),Y(ymax)-14,'#000',4);
    o+=`<polygon points="${X(xmax)+20},${Y(0)} ${X(xmax)+7},${Y(0)-7} ${X(xmax)+7},${Y(0)+7}" fill="#000"/>`;
    o+=`<polygon points="${X(0)},${Y(ymax)-20} ${X(0)-7},${Y(ymax)-7} ${X(0)+7},${Y(ymax)-7}" fill="#000"/>`;
    o+=`<text x="${X(xmax)+24}" y="${Y(0)+9}" font-size="${fsz+4}" font-style="italic">x</text>`;
    o+=`<text x="${X(0)+11}" y="${Y(ymax)-22}" font-size="${fsz+4}" font-style="italic">y</text>`;
    /* 눈금 */
    if(g.ticks!==false){
      const step=(xmax-xmin)>14?2:1;
      for(let i=xmin;i<=xmax;i++){if(i===0||i%step)continue;o+=L(X(i),Y(0)-5,X(i),Y(0)+5,'#000',2.6);o+=`<text x="${X(i)}" y="${Y(0)+fsz+8}" font-size="${fsz}" text-anchor="middle">${i}</text>`;}
      for(let j=ymin;j<=ymax;j++){if(j===0||j%step)continue;o+=L(X(0)-5,Y(j),X(0)+5,Y(j),'#000',2.6);o+=`<text x="${X(0)-11}" y="${Y(j)+7}" font-size="${fsz}" text-anchor="end">${j}</text>`;}
    }
    o+=`<text x="${X(0)-5}" y="${Y(0)+fsz+8}" font-size="${fsz-2}" text-anchor="end">O</text>`;
    /* 요소 */
    let c='';
    for(const it of(items||[])){
      if(it.t==='fn'){
        const col=it.color||NAVY,w=it.width||(it.dash?2.6:4.2);
        const from=it.from!==undefined?it.from:xmin,to=it.to!==undefined?it.to:xmax;
        let d='',open=false;
        for(let k=0;k<=800;k++){const x=from+(to-from)*k/800,y=it.f(x);
          const ok=isFinite(y)&&!isNaN(y)&&y>=ymin-2&&y<=ymax+2;
          if(ok){d+=(open?' L ':' M ')+X(x)+' '+Y(y);open=true;}else open=false;}
        c+=`<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" ${it.dash?`stroke-dasharray="${typeof it.dash==='string'?it.dash:'9 7'}"`:''}/>`;
      }
      else if(it.t==='circle'){c+=`<circle cx="${X(it.cx)}" cy="${Y(it.cy)}" r="${it.r*s}" fill="none" stroke="${it.color||NAVY}" stroke-width="${it.width||4}"/>`;}
      else if(it.t==='vline'){c+=L(X(it.x),Y(ymin),X(it.x),Y(ymax),it.color||RED,it.width||3,it.dash===undefined?'10 7':it.dash);
        if(it.label)c+=`<text x="${X(it.x)+8}" y="${Y(ymax)+fsz+4}" font-size="${fsz+1}" fill="${it.color||RED}" font-style="italic">${it.label}</text>`;}
      else if(it.t==='hline'){c+=L(X(xmin),Y(it.y),X(xmax),Y(it.y),it.color||RED,it.width||3,it.dash===undefined?'10 7':it.dash);
        if(it.label)c+=`<text x="${X(xmax)-8}" y="${Y(it.y)-8}" font-size="${fsz+1}" fill="${it.color||RED}" text-anchor="end" font-style="italic">${it.label}</text>`;}
      else if(it.t==='vdash'){c+=L(X(it.x),Y(ymin),X(it.x),Y(ymax),it.color||'#000',1.8,'7 6');}
      else if(it.t==='seg'){c+=L(X(it.x1),Y(it.y1),X(it.x2),Y(it.y2),it.color||NAVY,it.width||4,it.dash||'');}
      else if(it.t==='pt'){
        const col=it.color||RED;
        if(it.guide){
          c+=L(X(it.x),Y(0),X(it.x),Y(it.y),col,1.8,'6 5')+L(X(0),Y(it.y),X(it.x),Y(it.y),col,1.8,'6 5');
          if(!it.nolabel){
            if(it.x)c+=`<rect x="${X(it.x)-fsz*0.9}" y="${Y(0)+6}" width="${fsz*1.8}" height="${fsz+6}" fill="#fff"/><text x="${X(it.x)}" y="${Y(0)+fsz+8}" font-size="${fsz}" text-anchor="middle" fill="${col}" font-weight="700">${it.xl!==undefined?it.xl:nf(it.x)}</text>`;
            if(it.y)c+=`<rect x="${X(0)-fsz*2.2}" y="${Y(it.y)-fsz*0.7}" width="${fsz*2.1}" height="${fsz+4}" fill="#fff"/><text x="${X(0)-11}" y="${Y(it.y)+7}" font-size="${fsz}" text-anchor="end" fill="${col}" font-weight="700" ${it.yl!==undefined?'font-style="italic"':''}>${it.yl!==undefined?it.yl:nf(it.y)}</text>`;
          }
        }
        c+=`<circle cx="${X(it.x)}" cy="${Y(it.y)}" r="${it.r||7}" fill="${it.hollow?'#fff':col}" stroke="${col}" stroke-width="3.2"/>`;
        if(it.label){const dx=it.lx!==undefined?it.lx:12,dy=it.ly!==undefined?it.ly:-12;
          c+=`<text x="${X(it.x)+dx}" y="${Y(it.y)+dy}" font-size="${fsz+3}" fill="${col}" font-weight="700">${it.label}</text>`;}
      }
      else if(it.t==='text'){c+=`<text x="${X(it.x)}" y="${Y(it.y)}" font-size="${it.size||fsz}" fill="${it.color||'#111'}" text-anchor="${it.anchor||'start'}" ${it.italic?'font-style="italic"':''}>${it.s!==undefined?it.s:it.text}</text>`;}
      else if(it.t==='rangle'){const px=X(it.x),py=Y(it.y),k=9;const ux=it.u[0]*k,uy=-it.u[1]*k,vx=it.v[0]*k,vy=-it.v[1]*k;
        c+=`<path d="M ${px+ux} ${py+uy} L ${px+ux+vx} ${py+uy+vy} L ${px+vx} ${py+vy}" fill="none" stroke="#000" stroke-width="1.8"/>`;}
    }
    o+=`<g clip-path="url(#${id})">${c}</g></svg>`;
    return o;
  }

  /* 조립제법 표 */
  function synthSVG(k,coefs,products,bottom,hideR){
    const cols=coefs.length,cw=64,x0=70,W=x0+cw*cols+40,H=150;
    let o=`<svg class="fig-svg" viewBox="0 0 ${W} ${H}" width="${W}" xmlns="http://www.w3.org/2000/svg" ${F} font-size="24">`;
    o+=`<rect x="1" y="1" width="${W-2}" height="${H-2}" fill="#fff" stroke="#000" stroke-width="2"/>`;
    o+=`<text x="34" y="42" text-anchor="middle">${k}</text><line x1="52" y1="22" x2="52" y2="70" stroke="#000" stroke-width="2"/>`;
    coefs.forEach((c,i)=>o+=`<text x="${x0+cw*i+cw/2}" y="42" text-anchor="middle">${c}</text>`);
    products.forEach((c,i)=>o+=`<text x="${x0+cw*(i+1)+cw/2}" y="80" text-anchor="middle">${c}</text>`);
    o+=`<line x1="${x0+8}" y1="96" x2="${x0+cw*cols}" y2="96" stroke="#000" stroke-width="2"/>`;
    bottom.forEach((c,i)=>{const last=i===cols-1;const t=(last&&hideR)?'<tspan font-style="italic">R</tspan>':c;
      o+=`<text x="${x0+cw*i+cw/2}" y="130" text-anchor="middle">${t}</text>`;
      if(last)o+=`<path d="M ${x0+cw*i+6} 104 L ${x0+cw*i+6} 142 L ${x0+cw*i+cw-6} 142" fill="none" stroke="#000" stroke-width="2"/>`;});
    return o+`</svg>`;
  }
  /* 수직선 (부등식의 해) */
  function numlineSVG(a,b,mode,closed){
    const W=380,H=70,x0=40,x1=340,y=44;const lo=Math.min(a,b),hi=Math.max(a,b),span=Math.max(hi-lo,1);
    const X=v=>x0+80+(v-lo)/span*140;
    let o=`<svg class="fig-svg" viewBox="0 0 ${W} ${H}" width="${W}" xmlns="http://www.w3.org/2000/svg" ${F} font-size="20">`;
    const box=(xa,xb)=>`<rect x="${xa}" y="${y-22}" width="${xb-xa}" height="22" fill="#c9d6ea"/>`;
    if(mode==='in')o+=box(X(lo),X(hi));else o+=box(x0,X(lo))+box(X(hi),x1);
    o+=`<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="#000" stroke-width="2.4"/><polygon points="${x1+10},${y} ${x1-2},${y-6} ${x1-2},${y+6}" fill="#000"/><text x="${x1+14}" y="${y+7}" font-style="italic">x</text>`;
    const dot=v=>`<circle cx="${X(v)}" cy="${y}" r="5.5" fill="${closed?'#000':'#fff'}" stroke="#000" stroke-width="2"/><text x="${X(v)}" y="${y+24}" text-anchor="middle">${nf(v)}</text>`;
    return o+dot(lo)+dot(hi)+`</svg>`;
  }
  /* 내분점 수직선 */
  function divSVG(a,b,m,n,showP){
    const W=420,H=96,x0=50,x1=370,y=58;const X=t=>x0+30+t*(x1-x0-60);const P=m/(m+n);
    let o=`<svg class="fig-svg" viewBox="0 0 ${W} ${H}" width="${W}" xmlns="http://www.w3.org/2000/svg" ${F} font-size="20">`;
    o+=`<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="#000" stroke-width="2.4"/><polygon points="${x1+10},${y} ${x1-2},${y-6} ${x1-2},${y+6}" fill="#000"/><text x="${x1+14}" y="${y+7}" font-style="italic">x</text>`;
    const dot=(t,top,bot,col)=>`<circle cx="${X(t)}" cy="${y}" r="5.5" fill="${col||'#000'}"/><text x="${X(t)}" y="${y-14}" text-anchor="middle" fill="${col||'#000'}">${top}</text><text x="${X(t)}" y="${y+26}" text-anchor="middle">${bot}</text>`;
    o+=dot(0,'A',nf(a))+dot(1,'B',nf(b))+dot(P,'P',showP!==undefined?nf(showP):'',RED);
    o+=`<path d="M ${X(0)+4} ${y-30} Q ${(X(0)+X(P))/2} ${y-48} ${X(P)-4} ${y-30}" fill="none" stroke="#000" stroke-width="1.6"/><text x="${(X(0)+X(P))/2}" y="${y-44}" text-anchor="middle">${nf(m)}</text>`;
    o+=`<path d="M ${X(P)+4} ${y-30} Q ${(X(P)+X(1))/2} ${y-48} ${X(1)-4} ${y-30}" fill="none" stroke="#000" stroke-width="1.6"/><text x="${(X(P)+X(1))/2}" y="${y-44}" text-anchor="middle">${nf(n)}</text>`;
    return o+`</svg>`;
  }
  /* 함수 사상도 */
  /* 벤다이어그램 — 두 집합 A, B 와 색칠할 부분
     shade : 'union'(합집합) | 'inter'(교집합) | 'diffAB'(A-B) | 'diffBA'(B-A) | 없음 */
  function vennSVG(A,B,shade,label){
    const W=380,H=200,cy=104,r=66,cxA=148,cxB=232;
    const onlyA=(A||[]).filter(x=>!(B||[]).includes(x));
    const both=(A||[]).filter(x=>(B||[]).includes(x));
    const onlyB=(B||[]).filter(x=>!(A||[]).includes(x));
    const id='gsv'+(++UID);
    let o=`<svg class="fig-svg" viewBox="0 0 ${W} ${H}" width="${W}" xmlns="http://www.w3.org/2000/svg" ${F} font-size="20">`;
    o+=`<rect width="${W}" height="${H}" fill="#fff"/>`;
    if(shade){
      const fill='#bcd3ef';
      o+=`<defs><clipPath id="${id}a"><circle cx="${cxA}" cy="${cy}" r="${r}"/></clipPath><clipPath id="${id}b"><circle cx="${cxB}" cy="${cy}" r="${r}"/></clipPath></defs>`;
      if(shade==='union')o+=`<circle cx="${cxA}" cy="${cy}" r="${r}" fill="${fill}"/><circle cx="${cxB}" cy="${cy}" r="${r}" fill="${fill}"/>`;
      else if(shade==='inter')o+=`<g clip-path="url(#${id}a)"><circle cx="${cxB}" cy="${cy}" r="${r}" fill="${fill}"/></g>`;
      else if(shade==='diffAB')o+=`<circle cx="${cxA}" cy="${cy}" r="${r}" fill="${fill}"/><g clip-path="url(#${id}a)"><circle cx="${cxB}" cy="${cy}" r="${r}" fill="#fff"/></g>`;
      else if(shade==='diffBA')o+=`<circle cx="${cxB}" cy="${cy}" r="${r}" fill="${fill}"/><g clip-path="url(#${id}b)"><circle cx="${cxA}" cy="${cy}" r="${r}" fill="#fff"/></g>`;
    }
    o+=`<circle cx="${cxA}" cy="${cy}" r="${r}" fill="none" stroke="#000" stroke-width="2.8"/>`;
    o+=`<circle cx="${cxB}" cy="${cy}" r="${r}" fill="none" stroke="#000" stroke-width="2.8"/>`;
    o+=`<text x="${cxA-r+4}" y="${cy-r-8}" font-size="23" font-style="italic">A</text>`;
    o+=`<text x="${cxB+r-16}" y="${cy-r-8}" font-size="23" font-style="italic">B</text>`;
    const put=(arr,x)=>{const st=cy+7-(arr.length-1)*12;arr.forEach((v,i)=>{o+=`<text x="${x}" y="${st+i*24}" text-anchor="middle">${v}</text>`;});};
    put(onlyA,cxA-30);put(both,(cxA+cxB)/2);put(onlyB,cxB+30);
    if(label)o+=`<text x="${W/2}" y="${H-8}" text-anchor="middle" font-size="19" fill="${NAVY}">${label}</text>`;
    return o+`</svg>`;
  }
  function mapSVG(sets,maps){
    const n=sets.length,cw=150,W=cw*n+40,H=70+Math.max(...sets.map(s=>s.items.length))*44+20;
    let o=`<svg class="fig-svg" viewBox="0 0 ${W} ${H}" width="${W}" xmlns="http://www.w3.org/2000/svg" ${F} font-size="22">`;
    const pos=(si,ei)=>({x:40+cw*si,y:70+ei*44});
    sets.forEach((st,si)=>{const cx=40+cw*si;o+=`<ellipse cx="${cx}" cy="${70+(st.items.length-1)*22}" rx="34" ry="${st.items.length*24+8}" fill="none" stroke="#000" stroke-width="2"/>`;
      o+=`<text x="${cx}" y="28" text-anchor="middle" font-style="italic">${st.name}</text>`;
      st.items.forEach((it,ei)=>{const p=pos(si,ei);o+=`<circle cx="${p.x}" cy="${p.y}" r="3" fill="#000"/><text x="${p.x-10}" y="${p.y+8}" text-anchor="end">${it}</text>`;});});
    maps.forEach((m,mi)=>{const s1=sets[mi],s2=sets[mi+1];const mx=40+cw*mi+cw/2;
      o+=`<text x="${mx}" y="28" text-anchor="middle" font-style="italic">${m.name}</text>`;
      m.pairs.forEach(([a,b])=>{const i=s1.items.indexOf(a),j=s2.items.indexOf(b);if(i<0||j<0)return;const p=pos(mi,i),q=pos(mi+1,j);
        o+=`<line x1="${p.x+6}" y1="${p.y}" x2="${q.x-8}" y2="${q.y}" stroke="#000" stroke-width="1.8"/><polygon points="${q.x-6},${q.y} ${q.x-16},${q.y-5} ${q.x-16},${q.y+5}" fill="#000" transform="rotate(${Math.atan2(q.y-p.y,q.x-p.x)*180/Math.PI} ${q.x-6} ${q.y})"/>`;});});
    return o+`</svg>`;
  }

  /* =====================================================================
     KaTeX 렌더 (없으면 잠시 후 재시도)
     ===================================================================== */
  function renderTex(root,tries){
    if(!root)return;
    if(typeof window.katex==='undefined'){if((tries||0)<40)setTimeout(()=>renderTex(root,(tries||0)+1),150);return;}
    root.querySelectorAll('.tx[data-tex]').forEach(el=>{
      try{window.katex.render(el.dataset.tex,el,{throwOnError:false,displayMode:false});}
      catch(e){el.textContent=el.dataset.tex;}
    });
  }

  /* =====================================================================
     HTML 템플릿
     ===================================================================== */
  /* 개념 설명 속 [[핵심말]] 마커 처리
     - 보통 때  : 진한 글씨
     - 빈칸 모드 : 밑줄 빈칸 (정답 보이기를 켜면 답이 나타난다) */
  function markKw(text,blank){
    return String(text).replace(/\[\[([^\]]+)\]\]/g, (_,w)=>
      blank ? `<span class="bl"><span class="ba">${w}</span></span>` : `<b class="kw">${w}</b>`);
  }
  /* 개념 카드 HTML.
     opts.blank  : 핵심말을 빈칸으로 (기본 false)
     GED_CONCEPTS[unit.id] 가 있으면 그 풍부한 설명을, 없으면 unit.concept 를 쓴다. */
  function conceptHTML(unit,opts){
    opts=opts||{};
    const blank=!!opts.blank;
    const c=(typeof GED_CONCEPTS!=='undefined'&&GED_CONCEPTS[unit.id])||null;
    let h=`<span class="cap">먼저 이것만 기억해요</span>`;
    if(!c){
      const body=Array.isArray(unit.concept)?`<ul>${(unit.concept||[]).map(x=>`<li>${markKw(x,blank)}</li>`).join('')}</ul>`:markKw(unit.concept||'',blank);
      return h+body;
    }
    if(c.head)h+=`<p class="chead">${markKw(c.head,blank)}</p>`;
    if(c.lines&&c.lines.length)h+=`<ul>${c.lines.map(l=>`<li>${markKw(l,blank)}</li>`).join('')}</ul>`;
    if(c.fig){
      const svg=typeof c.fig==='function'?c.fig():c.fig;
      h+=`<div class="cfig">${svg}${c.figCap?`<div class="cfcap">${markKw(c.figCap,blank)}</div>`:''}</div>`;
    }
    if(c.ex&&c.ex.length){
      h+=`<div class="cex"><div class="cexh">${c.exTitle||'이렇게 해 봅시다'}</div>`;
      h+=c.ex.map(([q,a])=>`<div class="cexr"><span class="cexq">${markKw(q,blank)}</span><span class="cexa">${markKw(a,blank)}</span></div>`).join('');
      h+=`</div>`;
    }
    if(c.warn)h+=`<p class="cwarn">⚠️ ${markKw(c.warn,blank)}</p>`;
    if(c.tip)h+=`<p class="ctip">💡 ${markKw(c.tip,blank)}</p>`;
    return h;
  }
  /* 문제 카드 안쪽 HTML.  idx 0 = 예제(풀이 공개), 그 외 = 실전(풀이는 ansOnly) */
  function probHTML(unit,params,idx,no,opts){
    let r;
    try{r=unit.build(params);}catch(e){r={err:'문제를 만들 수 없는 조건입니다. 숫자를 바꿔 주세요.'};}
    if(!r||r.err)return`<div class="gen err">⚠️ ${r&&r.err||'조건 오류'}</div>`;
    const isEx=idx===0;
    const one=r.layout?r.layout==='one':(!r.raw&&r.choices.every(c=>String(c).length<=4));
    const sol=Array.isArray(r.sol)?r.sol.map(s=>`<p>${s}</p>`).join(''):r.sol;
    const ansBody=r.answerRaw!==undefined?r.answerRaw:tex(r.answerTex!==undefined?r.answerTex:String(r.choices[r.ans]));
    return`<div class="gen">
      <div class="qtext"><span class="qno">${isEx?'예제':no}</span>${r.q}</div>
      ${r.figure||''}
      ${choicesHTML(r.choices,one,r.raw)}
      ${isEx?'':'<div class="blank">풀이 &amp; 답 :</div>'}
      <div class="sol${isEx?'':' ansOnly'}"><b>${isEx?'함께 풀어봅시다':'풀이'}</b>${sol}</div>
      <div class="ans${isEx?'':' ansOnly'}">정답 &nbsp; <span class="ansIdx">${CIRC[r.ans]}</span> ${ansBody}</div>
    </div>`;
  }

  /* 학습지 본문(.gsheet 내부) 전체 — groups:[{unit, recs:[{idx,params,override,no}]}] */
  function bodyHTML(cfg,groups){
    let h=`<h1>${esc(cfg.title||'고졸 검정고시 수학 · 만능 학습지')}</h1>`;
    if(cfg.subtitle)h+=`<p class="sub">${esc(cfg.subtitle)}</p>`;
    h+=`<div class="namebox"><span>이름 : ______________</span><span>날짜 : ______ 월 ______ 일</span></div>`;
    if(cfg.intro!==false)h+=`<div class="card concept intro"><span class="cap">이 학습지를 쓰는 방법</span><ul>
      <li>유형마다 <b>[개념] → [예제] → [실전 문제]</b> 순서로 갑니다. 개념은 한 줄만 외우면 됩니다.</li>
      <li>좌표평면 문제는 <b>x축·y축의 눈금을 먼저 손가락으로 짚고</b>, 점의 자리를 읽는 것부터 시작합니다.</li>
      <li>대칭이동은 <b>종이접기</b>, 평행이동은 <b>밀기</b>. 이 두 마디만 기억해도 절반은 끝납니다.</li>
      <li>실전 문제는 시험지와 똑같은 모양입니다. 답을 고르고, 점선 상자에 풀이를 써 보세요.</li></ul></div>`;
    groups.forEach(gr=>{
      const u=gr.unit;
      h+=`<h2 id="${u.id}">${u.tag}. ${esc(u.title)}<small>${u.src||''}</small></h2>`;
      if(cfg.includeConcept!==false)h+=`<div class="card concept">${gr.conceptHtml||conceptHTML(u,{blank:cfg.blankConcept})}</div>`;
      const ex=gr.recs.filter(r=>r.idx===0),qs=gr.recs.filter(r=>r.idx!==0);
      ex.forEach(r=>{h+=`<h3>풀이 예시</h3><div class="card ex">${r.override||probHTML(u,r.params,0,'예제')}</div>`;});
      if(qs.length){h+=`<h3>실전 문제</h3><div class="qgrid">`;qs.forEach(r=>{h+=`<div class="card">${r.override||probHTML(u,r.params,r.idx,r.no)}</div>`;});h+=`</div>`;}
    });
    return h;
  }

  /* 학습지 시트 CSS (.gsheet 스코프) — 미리보기와 인쇄창이 같이 쓴다 */
  const SHEET_CSS=`
.gsheet{--fs:24px;--ink:#111;--navy:#123a6b;--red:#c0272d;--band:#eef3fa;
  font-family:'Jua','Gaegu','Apple SD Gothic Neo','Malgun Gothic',sans-serif;font-size:var(--fs);line-height:1.7;color:var(--ink);
  background:#fff;padding:36px 34px 50px;box-shadow:0 6px 26px rgba(0,0,0,.18);max-width:1040px;margin:0 auto;box-sizing:border-box;word-break:keep-all}
.gsheet *{box-sizing:border-box}
.gsheet h1{font-size:1.55em;margin:0 0 6px;color:var(--navy);line-height:1.35;font-weight:400}
.gsheet .sub{font-size:.68em;color:#555;margin:0 0 20px}
.gsheet h2{font-size:1.12em;margin:44px 0 12px;color:#fff;background:var(--navy);padding:8px 18px;border-radius:12px;font-weight:400}
.gsheet h2 small{font-size:.66em;opacity:.85;margin-left:12px}
.gsheet h3{font-size:.92em;margin:20px 0 8px;color:var(--navy);font-weight:400}
.gsheet .namebox{display:flex;gap:24px;border:3px solid var(--ink);border-radius:14px;padding:10px 20px;margin-bottom:22px;font-size:.85em}
.gsheet .namebox span{flex:1}
.gsheet .card{position:relative;border:3px solid var(--ink);border-radius:16px;padding:16px 20px 18px;margin:16px 0;background:#fff;page-break-inside:avoid;break-inside:avoid}
.gsheet .card.concept{border-color:var(--navy);background:var(--band)}
.gsheet .card.ex{border-color:var(--navy);background:#fbfcff}
.gsheet .cap{display:inline-block;background:var(--navy);color:#fff;padding:2px 16px;border-radius:999px;font-size:.68em;margin-bottom:8px}
.gsheet .card.concept ul{margin:6px 0 0;padding-left:1.2em}
.gsheet .card.concept li{margin:5px 0}
.gsheet .chead{margin:4px 0 8px;font-size:1.02em;color:var(--navy);line-height:1.5}
.gsheet .kw{font-weight:700;color:#0f2f57}
.gsheet .bl{display:inline-block;min-width:4.2em;border-bottom:3px solid #444;text-align:center;margin:0 3px;line-height:1.25}
.gsheet.noans .bl .ba{visibility:hidden}
.gsheet .cfig{text-align:center;margin:10px 0 4px}
.gsheet .cfig svg{max-width:100%;height:auto;display:block;margin:0 auto}
.gsheet .cfcap{font-size:.66em;color:#555;margin-top:3px}
.gsheet .cex{margin:10px 0 2px;border:2px dashed #9fb4d4;border-radius:12px;padding:8px 14px;background:#fff}
.gsheet .cexh{font-size:.66em;color:var(--navy);font-weight:700;margin-bottom:4px}
.gsheet .cexr{display:flex;gap:12px;align-items:baseline;font-size:.85em;margin:4px 0}
.gsheet .cexq{flex:1}
.gsheet .cexa{color:#1b7f3b;font-weight:700;white-space:nowrap}
.gsheet .ctip{margin:9px 0 0;font-size:.82em;color:#8a5a00;background:#fff8e6;border-radius:10px;padding:6px 12px}
.gsheet .cwarn{margin:9px 0 0;font-size:.82em;color:#a33;background:#fdf0f0;border-radius:10px;padding:6px 12px}
.gsheet .qno{display:inline-block;background:var(--ink);color:#fff;border-radius:10px;padding:1px 13px;margin-right:10px;font-size:.76em}
.gsheet .card.ex .qno{background:var(--navy)}
.gsheet .qtext{margin:4px 0 10px}
.gsheet .choices{display:grid;grid-template-columns:1fr 1fr;gap:6px 22px;margin:8px 0 6px 6px;font-size:.95em}
.gsheet .choices.one{grid-template-columns:repeat(4,auto);justify-content:start;gap:6px 34px}
.gsheet .choices .cs{display:inline-block;vertical-align:middle;width:230px;max-width:80%}
.gsheet .choices .cs svg{width:100%;height:auto}
.gsheet .fig{text-align:center;margin:8px 0 6px}
.gsheet .fig svg{max-width:100%;height:auto;display:block;margin:0 auto}
.gsheet .fig .boxk{border:2px solid #000;padding:6px 16px;display:inline-block;min-width:60%;text-align:left}
.gsheet .blank{border:3px dashed #888;border-radius:12px;padding:10px 18px;margin-top:12px;font-size:.85em;min-height:70px;color:#777}
.gsheet .sol{border-left:10px solid var(--navy);background:#f2f6fc;padding:10px 18px;margin-top:14px;border-radius:0 12px 12px 0;font-size:.85em}
.gsheet .sol p{margin:6px 0}
.gsheet .sol>b{display:block;margin-bottom:2px}
.gsheet .ans{margin-top:10px;color:var(--red);font-weight:700;font-size:.9em;border-top:3px dotted var(--red);padding-top:8px}
.gsheet .gen.err{color:#b33;font-size:.85em}
.gsheet.noans .ansOnly{display:none!important}
.gsheet.open .choices,.gsheet.open .ansIdx{display:none!important}
.gsheet .tx{white-space:nowrap}
.gsheet .katex{font-size:1.05em!important}
.gsheet.cols2 .qgrid{display:grid;grid-template-columns:1fr 1fr;column-gap:18px;align-items:start}
.gsheet.cols2 .qgrid .card{font-size:.8em;padding:12px 14px 14px}
.gsheet.cols2 .qgrid .fig svg{max-width:300px!important}
.gsheet.edit [contenteditable=true]{outline:2px dashed #e8a33c;outline-offset:3px;border-radius:6px}
.gsheet.edit [contenteditable=true]:focus{outline-color:#c0272d;background:#fffdf5}
.gsheet .card.overridden{box-shadow:inset 0 0 0 3px #f2c94c}
.gsheet .ctrl{background:#f4f4f4;border:2px dashed #999;border-radius:12px;padding:8px 12px;margin:10px 0 2px;font-size:14px;
  font-family:'Malgun Gothic','Apple SD Gothic Neo',sans-serif;display:flex;flex-wrap:wrap;gap:6px 12px;align-items:center;line-height:1.3}
.gsheet .ctrl label{display:flex;align-items:center;gap:5px;color:#333;font-size:13px}
.gsheet .ctrl input[type=number]{width:66px;font-size:14px;padding:3px 6px;border:2px solid #bbb;border-radius:7px;font-family:inherit;min-height:32px!important;background:#fff;color:#111}
.gsheet .ctrl select{font-size:13px;padding:3px 6px;border:2px solid #bbb;border-radius:7px;font-family:inherit;min-height:32px!important;background:#fff;color:#111}
.gsheet .ctrl .tag{background:var(--navy);color:#fff;border-radius:6px;padding:1px 9px;font-size:12px}
.gsheet .ctrl button{font-family:inherit;font-size:12px;padding:3px 9px;border:2px solid var(--navy);border-radius:7px;background:#fff;color:var(--navy);cursor:pointer;min-height:30px!important;font-weight:700}
.gsheet .ctrl button.danger{border-color:#c0272d;color:#c0272d}
@media print{
  .gsheet{box-shadow:none!important;margin:0!important;max-width:none!important;width:100%!important;padding:0!important;font-size:clamp(15px,var(--fs),21px)!important}
  .gsheet .ctrl,.gsheet .noprint{display:none!important}
  .gsheet h1{font-size:1.5em!important}
  .gsheet h2{page-break-after:avoid;break-after:avoid;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .gsheet .card,.gsheet .sol,.gsheet .ans,.gsheet .cap,.gsheet .qno,
  .gsheet .cex,.gsheet .ctip,.gsheet .cwarn,.gsheet .kw,.gsheet .cexa{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .gsheet .card{page-break-inside:avoid!important;break-inside:avoid!important}
  .gsheet .fig svg{max-width:440px!important}
  .gsheet.cols2 .qgrid{display:grid!important;grid-template-columns:1fr 1fr!important;column-gap:14px!important}
  .gsheet.cols2 .qgrid .fig svg{max-width:280px!important}
  .gsheet [contenteditable]{outline:none!important}
  .gsheet .card.overridden{box-shadow:none!important}
}`;

  /* 독립 문서(새 탭 / 인쇄창) 전체 HTML */
  function docHTML(cfg,groups,opts){
    opts=opts||{};
    const cls=['gsheet',cfg.showAns?'':'noans',cfg.cols2?'cols2':'',cfg.format==='open'?'open':''].filter(Boolean).join(' ');
    const title=esc(cfg.title||'고졸 검정고시 수학 · 만능 학습지');
    const bar=`<div id="gsbar" class="noprint">
      <b>${title}</b>
      <span class="g">글자 <input type="range" id="fsRange" min="16" max="40" value="${cfg.fs||24}"><span id="fsVal">${cfg.fs||24}px</span></span>
      <button id="btnAns" class="${cfg.showAns?'on':''}">${cfg.showAns?'정답 숨기기':'정답 보이기'}</button>
      <button id="btnCols" class="${cfg.cols2?'on':''}">실전문제 2단</button>
      <button id="btnPrint">🖨️ 인쇄 / PDF 저장</button>
      <span class="hint">인쇄창에서 "PDF로 저장"을 고르면 PDF 파일로 남길 수 있습니다.</span>
    </div>`;
    const script=`
      var sh=document.querySelector('.gsheet');
      function rt(){if(!window.katex){setTimeout(rt,150);return;}document.querySelectorAll('.tx[data-tex]').forEach(function(el){try{katex.render(el.dataset.tex,el,{throwOnError:false});}catch(e){el.textContent=el.dataset.tex;}});${opts.autoPrint?'setTimeout(function(){window.print();},500);':''}}
      rt();
      document.getElementById('fsRange').oninput=function(e){sh.style.setProperty('--fs',e.target.value+'px');document.getElementById('fsVal').textContent=e.target.value+'px';};
      document.getElementById('btnAns').onclick=function(){var on=sh.classList.toggle('noans');this.classList.toggle('on',!on);this.textContent=on?'정답 보이기':'정답 숨기기';};
      document.getElementById('btnCols').onclick=function(){var on=sh.classList.toggle('cols2');this.classList.toggle('on',on);};
      document.getElementById('btnPrint').onclick=function(){window.print();};`;
    return`<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Jua&family=Gaegu:wght@400;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"><${'/'}script>
<style>
html,body{margin:0;padding:0;background:#dfe4ea}
#gsbar{position:sticky;top:0;z-index:50;background:#123a6b;color:#fff;padding:10px 16px;display:flex;flex-wrap:wrap;gap:10px;align-items:center;font-size:15px;font-family:'Malgun Gothic','Apple SD Gothic Neo',sans-serif}
#gsbar b{font-size:17px;margin-right:6px}
#gsbar button{font-family:inherit;font-size:15px;padding:7px 14px;border:0;border-radius:10px;background:#ffd45e;color:#123a6b;cursor:pointer;font-weight:700}
#gsbar button.on{background:#8ef0b0}
#gsbar .g{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.12);padding:5px 12px;border-radius:10px}
#gsbar .hint{font-size:13px;opacity:.85}
.wrap{padding:22px 12px 80px}
${SHEET_CSS}
@media print{@page{size:A4;margin:12mm}html,body{background:#fff!important}#gsbar{display:none!important}.wrap{padding:0}}
</style></head><body>${bar}<div class="wrap"><div class="${cls}" style="--fs:${cfg.fs||24}px">${bodyHTML(cfg,groups)}</div></div>
<script>${script}<${'/'}script></body></html>`;
  }

  return{nf,par,xm,ym,tail,esc,tex,pr,rnd,pick,nz,CIRC,isInt,sqrtTex,sqrtTxt,shuffle,shuffleWith,mulberry,term,poly,
    numChoices,stepChoices,pickChoices,coordChoices,choicesHTML,
    planeSVG,synthSVG,numlineSVG,divSVG,mapSVG,vennSVG,renderTex,markKw,conceptHTML,probHTML,bodyHTML,docHTML,SHEET_CSS,
    NAVY,RED,GREEN,GREY};
})();
