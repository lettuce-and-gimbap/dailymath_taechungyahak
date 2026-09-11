// === js/generators/shared.js ===
/* --------------------------------------------------------------------
   문제 생성기 공용 도우미
   보기 만들기 · 정답 텍스트 · 쉬운 해설 · 가중치 추첨 · 수식 표기
   -------------------------------------------------------------------- */

function makeChoices(correct,wrongs){
  const cs=String(correct);
  const uw=[...new Set(wrongs.map(String).filter(w=>w!==cs&&w!==undefined&&w!=='undefined'))].slice(0,3);
  // 유니코드 위첨자 ↔ 숫자 변환
  const SUP_N={'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9'};
  const N_SUP={'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};
  const toSup=n=>String(Math.max(1,n)).split('').map(c=>N_SUP[c]||c).join('');
  let ex=1;
  while(uw.length<3){
    let fb;
    if(Number.isFinite(Number(cs))){
      // 숫자형: 인접 숫자 생성
      fb=String(Number(cs)+ex);
    } else {
      const supM=cs.match(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+$/);
      const numM=cs.match(/\d+/);
      if(supM){
        // x², x³ 등 지수 형태: 지수를 변형
        const expN=parseInt(supM[0].split('').map(c=>SUP_N[c]).join(''));
        const stem=cs.slice(0,cs.length-supM[0].length);
        fb=stem+toSup(expN+ex);
        if(fb===cs||uw.includes(fb)) fb=stem+toSup(Math.max(1,expN-ex));
      } else if(numM){
        // "x=3, y=2" 등 일반 숫자 포함 문자열: 첫 숫자를 변형
        const base=parseInt(numM[0]);
        fb=cs.replace(/\d+/,String(base+ex));
        if(fb===cs||uw.includes(fb)) fb=cs.replace(/\d+/,String(Math.max(0,base-ex)));
      } else {
        // 숫자 없는 경우 (극히 드문 케이스): 숫자 추가
        fb=String(ex);
      }
    }
    if(fb!=null&&fb!==cs&&!uw.includes(fb))uw.push(fb);
    ex++;if(ex>20)break;
  }
  const choices=shuffle([cs,...uw.slice(0,3)]);
  return{choices,answer:choices.indexOf(cs)};
}

function answerText(q){
  if(!q)return'';
  if(Array.isArray(q.choices)){
    if(Number.isInteger(q.answer))return String(q.choices[q.answer]??'');
    return String(q.answer??'');
  }
  if(q.ans!=null)return String(q.ans);
  if(q.ansC!=null)return q.hasR?`몫 ${q.ansC}, 나머지 ${q.ansR}`:String(q.ansC);
  return'';
}

function easyExplanation(q){
  if(!q)return'';
  if(q.explanation)return q.explanation;
  const topic=String(q.topic||q.meta?.type||q.type||'문제');
  const ans=answerText(q);
  const finish=ans?` 따라서 정답은 ${ans}입니다.`:'';
  if(topic.includes('소인수분해'))return`작은 소수 2, 3, 5, 7로 차례대로 나누어 봅니다. 더 나눌 수 없을 때까지 나눈 소수들을 곱셈으로 쓰면 됩니다.${finish}`;
  if(topic.includes('절댓값')||topic.includes('수의 대소'))return`수직선에서 0보다 오른쪽에 있는 수가 더 큽니다. 절댓값은 0에서 떨어진 거리이므로 부호를 빼고 크기를 비교하면 됩니다.${finish}`;
  if(topic.includes('문자')||topic.includes('식의 값'))return`문자 자리에 문제에서 준 수를 넣습니다. 곱셈을 먼저 하고, 그다음 덧셈이나 뺄셈을 계산합니다.${finish}`;
  if(topic.includes('일차방정식')||topic.includes('연립방정식'))return`등호의 양쪽에 같은 계산을 하면서 x와 숫자를 나눕니다. 연립방정식은 두 식을 더하거나 빼서 문자 하나를 먼저 없애면 쉬워집니다.${finish}`;
  if(topic.includes('부등식'))return`방정식처럼 x만 남기되, 음수로 곱하거나 나눌 때는 부등호 방향을 반대로 바꿔야 합니다.${finish}`;
  if(topic.includes('일차함수')||topic.includes('정비례'))return`y=ax+b에서 a는 기울기, b는 y절편입니다. 표나 그래프에서 x가 변할 때 y가 얼마나 변하는지 살펴봅니다.${finish}`;
  if(topic.includes('이차함수'))return`y=a(x-p)²+q에서 꼭짓점은 (p, q), 축은 x=p입니다. a가 양수면 아래가 열린 U 모양, 음수면 위가 열린 모양입니다.${finish}`;
  if(topic.includes('이차방정식')||topic.includes('인수분해')||topic.includes('전개'))return`곱해서 끝항이 되고 더해서 가운데 항이 되는 두 수를 찾습니다. (x-a)(x-b)=0이면 x=a 또는 x=b입니다.${finish}`;
  if(topic.includes('근호')||topic.includes('제곱근'))return`루트 안에서 제곱수 4, 9, 16, 25를 찾아 밖으로 꺼냅니다. 같은 루트끼리는 앞의 수만 더하거나 뺄 수 있습니다.${finish}`;
  if(topic.includes('지수'))return`같은 문자를 곱하면 지수를 더하고, 나누면 지수를 뺍니다. 거듭제곱을 다시 거듭제곱하면 지수끼리 곱합니다.${finish}`;
  if(topic.includes('삼각비'))return`먼저 빗변, 높이, 밑변을 찾습니다. sin은 높이/빗변, cos는 밑변/빗변, tan은 높이/밑변입니다.${finish}`;
  if(topic.includes('이등변')||topic.includes('삼각형')||topic.includes('각'))return`삼각형의 세 각을 더하면 180°입니다. 이등변삼각형은 길이가 같은 두 변의 맞은편 각도 서로 같습니다.${finish}`;
  if(topic.includes('닮음'))return`닮은 도형은 대응하는 변의 길이가 같은 비율로 커지거나 작아집니다. 서로 맞는 변끼리 비례식을 세우면 됩니다.${finish}`;
  if(topic.includes('원주각')||topic.includes('중심각')||topic.includes('원'))return`같은 호를 보는 중심각은 원주각의 2배입니다. 중심에서 현에 내린 수선은 현을 똑같이 둘로 나눕니다.${finish}`;
  if(topic.includes('확률'))return`전체 경우의 수를 먼저 세고, 원하는 경우의 수를 셉니다. 확률은 '원하는 경우 ÷ 전체 경우'입니다.${finish}`;
  if(topic.includes('경우의 수')||topic.includes('순열')||topic.includes('조합'))return`선택이 이어지면 각 단계의 가짓수를 곱합니다. 순서가 중요하면 순열, 순서가 중요하지 않으면 조합으로 생각합니다.${finish}`;
  if(topic.includes('평균'))return`모든 값을 더한 뒤 자료의 개수로 나눕니다.${finish}`;
  if(topic.includes('중앙값'))return`자료를 작은 수부터 줄 세운 뒤 한가운데 있는 값을 찾습니다.${finish}`;
  if(topic.includes('최빈값'))return`자료에서 가장 자주 나온 값을 찾습니다.${finish}`;
  if(topic.includes('표준편차')||topic.includes('상관'))return`값들이 평균에서 멀리 흩어질수록 표준편차가 큽니다. 두 값이 함께 커지면 양의 상관, 하나가 커질 때 다른 하나가 작아지면 음의 상관입니다.${finish}`;
  if(topic.includes('도수')||topic.includes('그래프'))return`표나 그래프에서 문제의 기준에 맞는 칸만 찾고, 해당하는 도수를 빠짐없이 더합니다.${finish}`;
  if(topic.includes('다항식')||topic.includes('항등식')||topic.includes('나머지'))return`같은 차수의 항끼리 모아 계산합니다. 항등식은 같은 차수의 계수가 서로 같고, x-a로 나눈 나머지는 x=a를 넣어 구합니다.${finish}`;
  if(topic.includes('집합')||topic.includes('명제')||topic.includes('함수'))return`기호의 뜻을 먼저 말로 바꿔 봅니다. 합집합은 모두, 교집합은 공통, 함수는 입력값이 어디로 가는지 차례대로 따라가면 됩니다.${finish}`;
  if(topic.includes('거리')||topic.includes('좌표')||topic.includes('직선'))return`좌표는 x를 먼저, y를 나중에 읽습니다. 거리나 직선 문제는 주어진 점을 공식에 하나씩 넣어 계산합니다.${finish}`;
  return`문제에서 묻는 값과 주어진 조건을 먼저 표시합니다. 필요한 계산을 한 단계씩 하고, 마지막에 보기와 같은 값을 찾습니다.${finish}`;
}

var _ps=(n,first=false)=>first?String(n):(n>=0?`+${n}`:String(n)); // 부호+숫자

var _cf=(n)=>n===1?'':n===-1?'−':String(n);   // 계수(1,-1 생략)

var _fmtLine=(slope,intercept)=>{               // y=ax+b 문자열
  if(slope===0)return `y=${intercept}`;         // 기울기가 0이면 가로선 y=b
  const ss=slope===1?'':slope===-1?'−':(slope<0?`−${-slope}`:String(slope));
  const bs=intercept===0?'':intercept>0?`+${intercept}`:`−${-intercept}`;
  return `y=${ss}x${bs}`;
};

/* ── 다항식 표기 ──────────────────────────────────────────────
   사람이 쓰는 모양으로 적는다. 계수 1은 감추고, 계수 0인 항은 통째로 빼고,
   부호를 항 앞에 붙인다.  (1x², 0x, +0 같은 표기가 나오지 않게 하는 것이 목적)
     _pl([[1,'x³'],[0,'x²'],[-1,'x'],[3,'']])  →  "x³−x+3"
     'x³'+_pltail([[0,'x²'],[2,'x']])          →  "x³+2x"
     _fac(0)  →  "x"      _fac(2) → "(x−2)"
   ───────────────────────────────────────────────────────────── */
var _tm=(c,v,first)=>{                          // 항 하나
  if(c===0)return'';
  let s=c<0?'−':(first?'':'+');
  const a=Math.abs(c);
  s+=(v==='')?String(a):((a===1?'':String(a))+v);
  return s;
};
var _pl=terms=>{                                // 다항식 전체
  let s='',first=true;
  for(const[c,v]of terms){const t=_tm(c,v,first);if(t){s+=t;first=false;}}
  return s||'0';
};
var _pltail=terms=>{                            // 앞 항이 이미 적힌 뒤에 이어 붙일 꼬리
  let s='';for(const[c,v]of terms)s+=_tm(c,v,false);return s;
};
var _fac=r=>r===0?'x':(r>0?`(x−${r})`:`(x+${-r})`);   // 인수 (x−r)
/* 더하는 과정을 사람이 쓰는 모양으로. _add(9,-4) → "9−4"  (9+-4 처럼 부호가 겹치지 않게) */
var _add=(...vals)=>vals.map((v,i)=>i===0?String(v):(v<0?`−${-v}`:`+${v}`)).join('');
/* 값 목록을 부호를 붙여 한 줄로. 0인 항은 빼고 쓴다. [8,0,-6] → "8 − 6" */
var _sumStr=vals=>{
  const v=vals.filter(x=>x!==0);
  if(!v.length)return'0';
  return v.map((x,i)=>i===0?String(x):(x>0?`+ ${x}`:`− ${-x}`)).join(' ');
};

var _p2=(a,b,c)=>_pl([[a,'x²'],[b,'x'],[c,'']]);   // ax²+bx+c 문자열

function weightedGen(items){
  const bag=[];items.forEach(([fn,w])=>{for(let i=0;i<w;i++)bag.push(fn);});
  const fn=pick(bag);try{return fn();}catch(e){return items[0][0]();}
}

var middleMeta=(category,type)=>({category, type, diff:'중졸',level:'middle'});
