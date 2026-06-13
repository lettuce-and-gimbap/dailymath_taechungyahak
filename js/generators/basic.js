/* ===== MATH PROBLEM GENERATORS ===== */
function genDivBasic(mn,mx){
  let pairs=[];
  for(let b=2;b<=15;b++){let cMin=Math.ceil(mn/b),cMax=Math.floor(mx/b);if(cMin<=cMax)for(let c=Math.max(2,cMin);c<=cMax;c++)pairs.push({b,c})}
  if(!pairs.length)return{a:10,b:2,ansC:5,ansR:0,hasR:false,qLogTxt:'10 ÷ 2'};
  const p=pairs[Math.floor(Math.random()*pairs.length)];
  return{a:p.b*p.c,b:p.b,ansC:p.c,ansR:0,hasR:false,qLogTxt:`${p.b*p.c} ÷ ${p.b}`};
}
function genDivRemainder(mn,mx){
  const a=randInt(mn,mx);let bOpts=[];
  for(let i=2;i<=9;i++)if(a%i!==0&&Math.floor(a/i)>=1)bOpts.push(i);
  let b=bOpts.length>0?bOpts[Math.floor(Math.random()*bOpts.length)]:3;
  if(a%b===0)b=b>=9?7:b+1;
  return{a,b,ansC:Math.floor(a/b),ansR:a%b,hasR:true,qLogTxt:`${a} ÷ ${b}`};
}
function genDivisors(mn,mx,hard){
  const tgt=hard?randInt(10,200):randInt(mn,mx);
  const divs=[];for(let i=1;i<=tgt;i++)if(tgt%i===0)divs.push(i);
  return{target:tgt,divisors:divs};
}
function generate3By2Div(){
  let a,b,q,r;
  while(true){b=randInt(10,99);r=randInt(1,b-1);let minQ=Math.ceil((100-r)/b),maxQ=Math.floor((999-r)/b);
    if(minQ<=maxQ&&maxQ>=1){q=randInt(minQ,maxQ);a=b*q+r;if(a>=100&&a<=999)break}}
  return{a,b,q,r,txt:`${a} ÷ ${b} = `};
}
function genGCDQuestion(min = 12, max = 50) {
  let a, b, g;
  let attempts = 0;
  // 설정한 범위 내에서 최대공약수가 2 이상인 숫자를 뽑습니다.
  do { 
    a = randInt(min, max); 
    b = randInt(min, max); 
    g = gcdFn(a, b); 
    attempts++; 
  } while ((g < 2 || a === b) && attempts < 100);
  
  const dA = [], dB = [];
  for (let i = 1; i <= a; i++) if (a % i === 0) dA.push(i);
  for (let i = 1; i <= b; i++) if (b % i === 0) dB.push(i);
  const common = dA.filter(d => dB.includes(d));
  return { type: 'gcd', a, b, divisorsA: dA, divisorsB: dB, common, gcdVal: g };
}

function genLCMQuestion(min = 2, max = 9) {
  let a, b, l;
  let attempts = 0;
  // 설정한 범위 내에서 서로 다르며, 최소공배수가 너무 커지지 않는 조합을 찾습니다.
  do { 
    a = randInt(min, max); 
    b = randInt(min, max); 
    l = lcmFn(a, b); 
    attempts++; 
  } while ((a === b || l > max * 10) && attempts < 100);
  
  const mA = Array.from({ length: 7 }, (_, i) => a * (i + 1));
  const mB = Array.from({ length: 7 }, (_, i) => b * (i + 1));
  const commonMult = mA.filter(v => mB.includes(v));
  return { type: 'lcm', a, b, multA: mA, multB: mB, commonMult, lcmVal: l };
}

/* ===== STORY MATH GENERATORS (문장제 문제) ===== */
var NAMES = ['준하', '이안', '지우', '유하', '신비', '윈터', '설윤', '철수', '영희', '민수', '지민', '수아', '지훈', '상훈', '하은', '도윤'];
var ITEMS = ['사과', '사탕', '구슬', '연필', '쿠키', '초콜릿', '딸기', '공책', '스티커', '장난감', '귤'];

// 한글 받침 유무에 따라 조사를 자동으로 붙여주는 함수
function josa(word, j) {
  if (!word) return '';
  const lastChar = word.charCodeAt(word.length - 1);
  if (lastChar < 0xac00 || lastChar > 0xd7a3) return word + j.split('/')[0];
  const hasJong = (lastChar - 0xac00) % 28 > 0;
  let res = '';
  if (j.includes('은') || j.includes('는')) res = hasJong ? '은' : '는';
  else if (j.includes('이') || j.includes('가')) res = hasJong ? '이' : '가';
  else if (j.includes('을') || j.includes('를')) res = hasJong ? '을' : '를';
  else if (j.includes('과') || j.includes('와')) res = hasJong ? '과' : '와';
  return word + res;
}


function genStoryLow(op) {
  const name = pick(NAMES); 
  const item = pick(ITEMS);

  if (op === 'add') {
    const type = randInt(1, 13);
    // 기존 유형 (1~8)
    if (type === 1) { const a = randInt(100, 200); const b = randInt(100, 200); return { txt: `어제 밭에서 감자 ${a}개를 캐고, 오늘 고구마 ${b}개를 캤습니다. 캔 감자와 고구마는 모두 몇 개일까요?`, ans: a + b }; }
    if (type === 2) { const a = randInt(3, 7) * 1000; const b = randInt(2, 5) * 1000; return { txt: `${josa(name, '은/는')} 오늘 아침에 만보기를 차고 ${a}보를 걸었고, 저녁에 ${b}보를 걸었습니다. 오늘 하루 동안 걸은 걸음 수는 모두 몇 보일까요?`, ans: a + b }; }
    if (type === 3) { const a = randInt(7, 10); const b = randInt(2, 5); return { txt: `손목시계를 보니 오전 ${a}시입니다. ${b}시간 뒤에 점심 약속이 있다면, 약속 시간은 몇 시일까요? (오후 시간도 13시, 14시 등 숫자로 적어주세요.)`, ans: a + b }; }
    if (type === 4) { const a = randInt(10, 25); const b = randInt(5, 12); return { txt: `버스에 ${a}명이 타고 있었습니다. 이번 정류장에서 ${b}명이 새로 탔습니다. 버스에는 모두 몇 명이 타고 있을까요?`, ans: a + b }; }
    if (type === 5) { const a = randInt(20, 50); const b = randInt(15, 40); return { txt: `책장의 첫 번째 칸에 책이 ${a}권, 두 번째 칸에 ${b}권 꽂혀 있습니다. 두 칸에 있는 책은 모두 합쳐서 몇 권일까요?`, ans: a + b }; }
    if (type === 6) { const a = randInt(30, 80); const b = randInt(20, 70); return { txt: `${josa(name, '은/는')} 어제 동화책을 ${a}쪽 읽었고, 오늘은 ${b}쪽 읽었습니다. 이틀 동안 읽은 동화책은 모두 몇 쪽일까요?`, ans: a + b }; }
    if (type === 7) { const a = randInt(100, 300); const b = randInt(150, 400); return { txt: `과수원에서 사과를 ${a}상자, 배를 ${b}상자 수확했습니다. 수확한 과일은 모두 몇 상자일까요?`, ans: a + b }; }
    if (type === 8) { const a = randInt(3, 8) * 1000; const b = randInt(1, 5) * 1000; return { txt: `돼지저금통에 ${a}원이 들어있었습니다. 오늘 ${b}원을 더 넣었다면, 저금통에 있는 돈은 모두 얼마일까요?`, ans: a + b }; }
    // 신규 확장 유형 (9~13)
    if (type === 9) { const a = randInt(20, 50); const b = randInt(20, 50); return { txt: `가족들과 함께 고기만두 ${a}개와 김치만두 ${b}개를 빚었습니다. 빚은 만두는 모두 몇 개일까요?`, ans: a + b }; }
    if (type === 10) { const a = randInt(3, 8) * 1000; const b = randInt(2, 5) * 1000; return { txt: `시장에서 배추를 ${a}원어치 사고, 무를 ${b}원어치 샀습니다. 채소값으로 낸 돈은 모두 얼마일까요?`, ans: a + b }; }
    if (type === 11) { const a = randInt(10, 20); const b = randInt(5, 15); return { txt: `빨래를 해서 건조대에 수건 ${a}장과 양말 ${b}켤레를 널었습니다. 건조대에 널린 빨래는 모두 몇 개일까요?`, ans: a + b }; }
    if (type === 12) { const a = randInt(5, 15); const b = randInt(3, 10); return { txt: `봄이 되어 마당에 장미가 ${a}송이 피고, 튤립이 ${b}송이 피었습니다. 마당에 핀 꽃은 모두 몇 송이일까요?`, ans: a + b }; }
    if (type === 13) { const a = randInt(15, 30); const b = randInt(10, 25); return { txt: `마을 회관에 윗마을 사람 ${a}명과 아랫마을 사람 ${b}명이 모여 잔치를 열었습니다. 모인 사람은 모두 몇 명일까요?`, ans: a + b }; }
  
  } else if (op === 'sub') {
    const type = randInt(1, 13);
    // 기존 유형 (1~6)
    if (type === 1) { const b = pick([10000, 20000, 50000]); const a = b - randInt(1, 8)*1000; return { txt: `시장에 가서 ${a}원짜리 참기름을 한 병 사고 ${b}원을 냈습니다. 거스름돈은 얼마를 받아야 할까요?`, ans: b - a }; }
    if (type === 2) { const a = randInt(150, 300); const b = randInt(80, a-10); return { txt: `농장에 닭이 ${a}마리, 오리가 ${b}마리 있습니다. 닭은 오리보다 몇 마리 더 많을까요?`, ans: a - b }; }
    if (type === 3) { const a = randInt(2, 5) * 10000; const b = randInt(3, 8) * 1000; return { txt: `지갑에 ${a}원이 있었습니다. 손주에게 아이스크림 값으로 ${b}원을 주었다면 얼마가 남았을까요?`, ans: a - b }; }
    if (type === 4) { const a = randInt(60, 80); const b = randInt(8, 15); return { txt: `할아버지의 나이는 ${a}세이고, 손주의 나이는 ${b}세입니다. 두 사람의 나이 차이는 몇 살일까요?`, ans: a - b }; }
    if (type === 5) { const a = randInt(5, 9) * 100; const b = randInt(2, 4) * 100; return { txt: `물통에 물이 ${a}mL 들어있었습니다. 운동을 하고 나서 ${b}mL를 마셨다면, 남은 물은 몇 mL일까요?`, ans: a - b }; }
    if (type === 6) { const a = randInt(150, 250); const b = randInt(50, 100); return { txt: `전체 쪽수가 ${a}쪽인 소설책이 있습니다. 그중에서 ${b}쪽까지 읽었다면, 앞으로 몇 쪽을 더 읽어야 할까요?`, ans: a - b }; }
    // 신규 확장 유형 (7~13)
    if (type === 7) { const a = randInt(20, 40); const b = randInt(5, 15); return { txt: `지하철에 ${a}명이 타고 있었습니다. 이번 역에서 ${b}명이 내렸다면, 지금 타고 있는 사람은 몇 명일까요?`, ans: a - b }; }
    if (type === 8) { const a = randInt(30, 60); const b = randInt(10, 20); return { txt: `그릇에 깐 마늘이 ${a}알 있었습니다. 요리를 하느라 ${b}알을 사용했다면, 남은 마늘은 몇 알일까요?`, ans: a - b }; }
    if (type === 9) { const a = randInt(15, 30); const b = randInt(5, 10); return { txt: `우리 집에서 읍내까지 거리는 ${a}km입니다. 자전거를 타고 ${b}km를 갔다면, 읍내까지 몇 km가 남았을까요?`, ans: a - b }; }
    if (type === 10) { const a = randInt(100, 200); const b = randInt(30, 80); return { txt: `길이가 ${a}cm인 목도리용 털실이 있습니다. 뜨개질을 하며 ${b}cm를 썼다면 남은 털실의 길이는 몇 cm일까요?`, ans: a - b }; }
    if (type === 11) { const a = randInt(50, 100); const b = randInt(5, 15); return { txt: `어제 수확한 양파가 ${a}개입니다. 확인해 보니 ${b}개가 썩어서 버렸습니다. 성한 양파는 몇 개 남았을까요?`, ans: a - b }; }
    if (type === 12) { const a = randInt(100, 200); const b = randInt(40, 80); return { txt: `가족 사진이 모두 ${a}장 있습니다. 그중에서 ${b}장을 앨범에 꽂아 정리했다면, 아직 정리하지 못한 사진은 몇 장일까요?`, ans: a - b }; }
    if (type === 13) { const a = randInt(30, 50); const b = randInt(10, 25); return { txt: `김장을 하려고 배추 ${a}포기를 준비했습니다. 지금까지 ${b}포기를 씻었다면 씻어야 할 배추는 몇 포기 남았을까요?`, ans: a - b }; }
  
  } else if (op === 'mul') {
    const type = randInt(1, 12);
    // 기존 유형 (1~10)
    if (type === 1) { const a = randInt(5, 12); const b = randInt(3, 8); return { txt: `한 봉지에 ${a}개씩 들어있는 귤을 ${b}봉지 샀습니다. 귤은 모두 몇 개일까요?`, ans: a * b }; }
    if (type === 2) { const a = randInt(10, 20); const b = randInt(3, 7); return { txt: `한 상자에 ${a}개씩 들어있는 한과가 ${b}상자 있습니다. 한과는 모두 몇 개일까요?`, ans: a * b }; }
    if (type === 3) { const a = randInt(6, 12); const b = randInt(4, 9); return { txt: `강당에 의자가 한 줄에 ${a}개씩 ${b}줄 놓여 있습니다. 의자는 모두 몇 개일까요?`, ans: a * b }; }
    if (type === 4) { const a = randInt(6, 12); const b = randInt(3, 8); return { txt: `${a}명씩 탈 수 있는 승합차가 ${b}대 있습니다. 최대 몇 명까지 탈 수 있을까요?`, ans: a * b }; }
    if (type === 5) { const a = randInt(1, 3) * 500; const b = randInt(2, 5); return { txt: `동네 마트에서 ${a}원짜리 두부를 ${b}모 샀습니다. 두부값은 모두 얼마일까요?`, ans: a * b }; }
    if (type === 6) { const a = randInt(3, 8); const b = randInt(5, 10); return { txt: `${josa(name, '은/는')} 매일 물을 ${a}잔씩 마십니다. ${b}일 동안 마신 물은 모두 몇 잔일까요?`, ans: a * b }; }
    if (type === 7) { const a = randInt(5, 12); const b = randInt(3, 7); return { txt: `꽃다발 한 개를 만드는 데 장미꽃이 ${a}송이 필요합니다. 꽃다발 ${b}개를 만들려면 장미꽃은 모두 몇 송이 필요할까요?`, ans: a * b }; }
    if (type === 8) { const a = randInt(4, 8); const b = randInt(10, 20); return { txt: `새로 지은 아파트는 한 층에 ${a}가구씩 살 수 있습니다. 이 아파트가 ${b}층까지 있다면 모두 몇 가구가 살 수 있을까요?`, ans: a * b }; }
    if (type === 9) { const a = randInt(10, 20); const b = randInt(5, 14); return { txt: `${josa(name, '은/는')} 하루에 영어 단어를 ${a}개씩 외우기로 했습니다. ${b}일 동안 외운 영어 단어는 모두 몇 개일까요?`, ans: a * b }; }
    if (type === 10) { const a = randInt(10, 12); const b = randInt(4, 9); return { txt: `연필 한 다스는 ${a}자루입니다. 연필 ${b}다스를 샀다면 연필은 모두 몇 자루일까요?`, ans: a * b }; }
    // 신규 확장 유형 (11~12)
    if (type === 11) { const a = randInt(2, 4); const b = randInt(7, 14); return { txt: `병원에서 약을 지어왔습니다. 하루에 알약을 ${a}알씩 ${b}일 동안 먹어야 합니다. 알약은 모두 몇 알일까요?`, ans: a * b }; }
    if (type === 12) { const a = randInt(30, 60); const b = randInt(3, 7); return { txt: `건강을 위해 매일 동네 한 바퀴를 ${a}분씩 걷습니다. ${b}일 동안 걸은 시간은 모두 합쳐서 몇 분일까요?`, ans: a * b }; }
  
  } else { // div (모두 a = ans * b 로직으로 100% 정수 보장)
    const type = randInt(1, 12);
    // 기존 유형 (1~6)
    if (type === 1) { const b = randInt(3, 6); const ans = randInt(1, 5) * 10000; const a = ans * b; return { txt: `손주들에게 줄 용돈 ${a}원을 준비했습니다. ${b}명의 손주에게 똑같이 나누어 준다면 한 명당 얼마씩 받을 수 있을까요?`, ans: ans }; }
    if (type === 2) { const ans = randInt(5, 12); const b = randInt(5, 9); const a = ans * b; return { txt: `송편 ${a}개를 한 접시에 ${b}개씩 나누어 담으려고 합니다. 접시는 모두 몇 개가 필요할까요?`, ans: ans }; }
    if (type === 3) { const b = randInt(3, 6); const ans = randInt(8, 15); const a = ans * b; return { txt: `텃밭에서 방울토마토 ${a}개를 땄습니다. 이웃집 ${b}곳에 똑같이 나누어 준다면 한 집에 몇 개씩 줄 수 있을까요?`, ans: ans }; }
    if (type === 4) { const ans = randInt(4, 8); const b = randInt(4, 6); const a = ans * b; return { txt: `${name}네 반 학생 ${a}명이 체육 시간에 모둠을 만들려고 합니다. 한 모둠에 ${b}명씩 짝을 지으면 모두 몇 모둠이 만들어질까요?`, ans: ans }; }
    if (type === 5) { const ans = randInt(15, 30); const b = randInt(3, 6); const a = ans * b; return { txt: `전체 길이가 ${a}cm인 끈을 ${b}cm씩 똑같은 길이로 자르려고 합니다. 끈은 모두 몇 도막이 될까요?`, ans: ans }; }
    if (type === 6) { const ans = randInt(5, 10); const b = randInt(10, 20); const a = ans * b; return { txt: `선생님이 색종이 ${a}장을 반 학생 ${b}명에게 똑같이 나누어 주려고 합니다. 학생 한 명당 색종이를 몇 장씩 받을 수 있을까요?`, ans: ans }; }
    // 신규 확장 유형 (7~12)
    if (type === 7) { const ans = randInt(10, 20); const b = randInt(3, 6); const a = ans * b; return { txt: `다진 마늘 ${a}숟가락을 ${b}개의 작은 반찬통에 똑같이 나누어 담으려고 합니다. 한 통에 몇 숟가락씩 담아야 할까요?`, ans: ans }; }
    if (type === 8) { const ans = randInt(3, 5); const b = randInt(5, 10); const a = ans * b; return { txt: `영양제 알약이 총 ${a}개 있습니다. 이 알약을 ${b}일 동안 매일 똑같은 개수만큼 먹으려면, 하루에 몇 개씩 먹어야 할까요?`, ans: ans }; }
    if (type === 9) { const ans = randInt(8, 15); const b = randInt(4, 8); const a = ans * b; return { txt: `상추 모종 ${a}개를 밭에 ${b}줄로 똑같이 맞추어 심으려고 합니다. 한 줄에 모종을 몇 개씩 심어야 할까요?`, ans: ans }; }
    if (type === 10) { const ans = randInt(3, 7) * 1000; const b = randInt(3, 7); const a = ans * b; return { txt: `이번 주 ${b}일 동안 만보기를 차고 총 ${a}보를 걷기로 다짐했습니다. 매일 똑같이 걷는다면 하루에 몇 보씩 걸어야 할까요?`, ans: ans }; }
    if (type === 11) { const ans = randInt(10, 20); const b = randInt(3, 6); const a = ans * b; return { txt: `둥굴레차 티백 ${a}개를 빈 상자 ${b}개에 똑같이 나누어 담아 보관하려고 합니다. 한 상자에 티백이 몇 개씩 들어갈까요?`, ans: ans }; }
    if (type === 12) { const ans = randInt(4, 8); const b = randInt(10, 20); const a = ans * b; return { txt: `가족 사진 ${a}장을 새 사진첩 ${b}쪽에 똑같이 나누어 붙이려고 합니다. 한 쪽에 사진을 몇 장씩 붙여야 할까요?`, ans: ans }; }
  }
}


function genStoryMid(op) {
  const name = pick(NAMES);
  
  if (op === 'add') {
    const type = randInt(1, 12); // 총 12개 유형
    // 기존 유형 (1~6)
    if (type === 1) { const a = randInt(100, 150); const b = randInt(20, 50); return { txt: `${name}네 농장에서 캔 감자는 ${a}개이고, 고구마는 감자보다 ${b}개 더 적게 캤습니다. 감자와 고구마를 합치면 모두 몇 개일까요?`, ans: a + (a - b) }; }
    if (type === 2) { const a = randInt(30, 60); const b = randInt(10, 20); return { txt: `어제 양파를 ${a}개 수확했고, 오늘은 어제보다 ${b}개 더 많이 수확했습니다. 어제와 오늘 수확한 양파를 모두 합치면 몇 개일까요?`, ans: a + (a + b) }; }
    if (type === 3) { const a = randInt(20, 40); const b = randInt(15, 30); const c = a + b; return { txt: `첫째가 사과를 ${a}개, 둘째가 ${b}개 땄습니다. 셋째는 첫째와 둘째가 딴 사과를 합친 것만큼 땄습니다. 세 사람이 딴 사과는 모두 몇 개일까요?`, ans: a + b + c }; }
    if (type === 4) { const a = randInt(10, 20); const b = randInt(3, 6); const c = randInt(15, 30); return { txt: `한 상자에 ${a}개씩 들어있는 귤 ${b}상자와 낱개로 포장된 귤 ${c}개를 샀습니다. 귤은 모두 몇 개일까요?`, ans: (a * b) + c }; }
    if (type === 5) { const a = randInt(2, 5) * 1000; const b = randInt(3, 6) * 1000; const c = randInt(5, 9) * 100; return { txt: `시장에서 ${a}원짜리 생선과 ${b}원짜리 과일을 샀습니다. 단골 할인으로 ${c}원을 깎아주셨다면, 오늘 지불한 금액은 모두 얼마일까요?`, ans: (a + b) - c }; }
    if (type === 6) { const a = randInt(20, 40); const b = randInt(15, 30); const c = randInt(10, 25); return { txt: `밭에서 3일 동안 토마토를 수확했습니다. 첫째 날에는 ${a}개, 둘째 날에는 ${b}개, 셋째 날에는 ${c}개를 수확했습니다. 3일 동안 수확한 토마토는 모두 몇 개일까요?`, ans: a + b + c }; }
    // 신규 확장 유형 (7~12) : 2~3단계 복합 연산
    if (type === 7) { const a = randInt(3, 6); const b = randInt(10, 20); const c = randInt(2, 4); const d = randInt(10, 20); return { txt: `텃밭에 배추 모종을 ${a}줄(한 줄에 ${b}개씩) 심고, 무 모종을 ${c}줄(한 줄에 ${d}개씩) 심었습니다. 오늘 심은 모종은 모두 몇 개일까요?`, ans: (a * b) + (c * d) }; }
    if (type === 8) { const start = randInt(15, 30); const used = randInt(5, 10); const bought = randInt(20, 40); return { txt: `냉장고에 계란이 ${start}개 있었습니다. 아침 요리에 ${used}개를 쓰고, 오후에 마트에서 ${bought}개를 새로 사왔습니다. 지금 있는 계란은 모두 몇 개일까요?`, ans: start - used + bought }; }
    if (type === 9) { const a = randInt(3, 6)*10000; const b = randInt(2, 5)*10000; const c = randInt(1, 3)*10000; return { txt: `이번 달 공과금으로 가스비 ${a}원, 전기세 ${b}원, 수도세 ${c}원이 나왔습니다. 내야 할 공과금은 모두 얼마일까요?`, ans: a + b + c }; }
    if (type === 10) { const a = randInt(3, 6); const b = randInt(1, 5)*10000; const c = randInt(5, 9)*10000; return { txt: `명절에 손주 ${a}명에게 각각 ${b}원씩 용돈을 주고, 며느리에게 ${c}원을 주었습니다. 오늘 가족들에게 준 돈은 모두 얼마일까요?`, ans: (a * b) + c }; }
    if (type === 11) { const a = randInt(20, 40); const b = randInt(10, 20); return { txt: `뜨개질을 어제는 ${a}cm만큼 떴고, 오늘은 어제보다 ${b}cm 더 길게 떴습니다. 이틀 동안 뜬 길이를 합치면 모두 몇 cm일까요?`, ans: a + (a + b) }; }
    if (type === 12) { const a = randInt(20, 40); const b = randInt(15, 30); const c = randInt(10, 25); return { txt: `동네 잔치에 쓸 전을 부쳤습니다. 동태전 ${a}개, 호박전 ${b}개, 버섯전 ${c}개를 부쳤다면, 부친 전은 모두 몇 개일까요?`, ans: a + b + c }; }

  } else if (op === 'sub') {
    const type = randInt(1, 13); // 총 13개 유형
    // 기존 유형 (1~12)
    if (type === 1) { const a = randInt(70, 120); const b = randInt(10, 20); const c = randInt(3, 5); return { txt: `길이가 ${a}cm인 천이 있습니다. 이 천을 ${b}cm씩 ${c}번 잘라서 행주를 만들었습니다. 남은 천의 길이는 몇 cm일까요?`, ans: a - (b * c) }; }
    if (type === 2) { const a = randInt(25, 40); const b = randInt(15, 20); const w = a - b; return { txt: `${name}네 반 학생은 모두 ${a}명입니다. 그중 남학생이 ${b}명입니다. 여학생은 남학생보다 몇 명 더 적을까요? (또는 많을까요?)`, ans: Math.abs(b - w) }; }
    if (type === 3) { const a = randInt(3, 8)*1000; const b = randInt(4, 8); const c = randInt(1, Math.floor((a*b)/1000) - 2)*1000; return { txt: `${josa(name, '은/는')} 매달 ${a}원씩 ${b}개월 동안 돼지저금통에 저금했습니다. 그 돈으로 ${c}원짜리 손주 장난감을 샀습니다. 남은 돈은 얼마일까요?`, ans: a * b - c }; }
    if (type === 4) { const a = randInt(2, 5); const c = randInt(20, 40); return { txt: `달걀이 ${a}판 있습니다. 한 판에 30개씩 들어있습니다. 반찬을 만드는 데 ${c}개를 사용했다면, 남은 달걀은 몇 개일까요?`, ans: (30 * a) - c }; }
    if (type === 5) { const mom = randInt(40, 70); const sister = randInt(15, 30); const ans = randInt(20, 40); const b = mom + sister; const a = ans + sister; return { txt: `${josa(name, '이/가')} 여동생과 수확한 사과는 ${a}개입니다. 여동생과 엄마가 수확한 사과는 ${b}개인데, 엄마가 혼자 수확한 사과가 ${mom}개라면 ${name}가 수확한 것은 몇 개일까요?`, ans: ans }; }
    if (type === 6) { const b = randInt(1, 2); const c = randInt(5, 7); const d = randInt(3, 6); return { txt: `쌀 20kg짜리 한 포대를 샀습니다. ${c}일 동안 매일 ${b}kg씩 밥을 지어 먹었고, 이웃에게 ${d}kg을 나누어 주었습니다. 남은 쌀은 몇 kg일까요?`, ans: 20 - (b * c) - d }; }
    if (type === 7) { const b = randInt(5, 15)*100; const c = randInt(2, 4); const d = randInt(8, 20)*100; const e = randInt(2, 4); const total = (b*c) + (d*e); const a = (Math.floor(total/10000)+1)*10000; return { txt: `${name}는 ${b}원짜리 아이스크림 ${c}개와 ${d}원짜리 과자 ${e}개를 샀습니다. ${a}원을 냈다면 거스름돈은 얼마를 받을까요?`, ans: a - total }; }
    if (type === 8) { const a = randInt(6, 12); const b = randInt(4, 8); const c = randInt(3, 8); return { txt: `강당에 의자가 한 줄에 ${a}개씩 ${b}줄 있습니다. 그런데 의자 ${c}개가 고장 나서 치웠습니다. 지금 앉을 수 있는 의자는 모두 몇 개일까요?`, ans: a * b - c }; }
    if (type === 9) { const ans = randInt(1, 3)*1000; const saved = randInt(2, 5)*1000; const gifted = randInt(1, 3)*1000; const target = ans + saved + gifted; return { txt: `손주에게 ${target}원짜리 선물을 사주려고 합니다. 모은 돈이 ${saved}원이고, 친구에게 ${gifted}원을 빌렸습니다. 선물을 사려면 돈이 얼마 더 필요할까요?`, ans: ans }; }
    if (type === 10) { const ans = randInt(30, 60); const day1 = randInt(40, 70); const day2 = randInt(40, 70); const total = ans + day1 + day2; return { txt: `전체 쪽수가 ${total}쪽인 책이 있습니다. 첫째 날 ${day1}쪽, 둘째 날 ${day2}쪽을 읽었습니다. 앞으로 몇 쪽을 더 읽어야 할까요?`, ans: ans }; }
    if (type === 11) { const start = randInt(20, 40); const off = randInt(5, 15); const on = randInt(5, 15); return { txt: `버스가 출발할 때 ${start}명이 탔습니다. 이번 정류장에서 ${off}명이 내리고, ${on}명이 새로 탔습니다. 지금 버스에는 몇 명이 타고 있을까요?`, ans: start - off + on }; }
    if (type === 12) { const ans = randInt(20, 40); const broken = randInt(3, 8); const sold = randInt(10, 25); const total = ans + broken + sold; return { txt: `오늘 농장에서 달걀 ${total}개를 모았습니다. ${broken}개는 깨져서 버렸고, ${sold}개는 이웃에게 팔았습니다. 남은 달걀은 몇 개일까요?`, ans: ans }; }
    // 신규 확장 유형 (13) : 2~3단계 복합 연산
    if (type === 13) { const ans = randInt(1, 5) * 10000; const b = randInt(2, 5) * 10000; const c = randInt(1, 4) * 10000; const a = ans + b + c; return { txt: `통장에 생활비 ${a}원이 있었습니다. 마트에서 장을 보느라 ${b}원을 쓰고, 병원비로 ${c}원을 냈습니다. 통장에 남은 돈은 얼마일까요?`, ans: ans }; }

  } else if (op === 'mul') {
    const type = randInt(1, 13); // 총 13개 유형
    // 기존 유형 (1~6)
    if (type === 1) { const b = randInt(4, 9)*100; const c = randInt(2, 5); const d = randInt(8, 15)*100; const e = randInt(2, 5); return { txt: `${josa(name, '은/는')} ${b}원짜리 두부 ${c}모와 ${d}원짜리 콩나물 ${e}봉지를 샀습니다. 내야 할 돈은 모두 얼마일까요?`, ans: (b * c) + (d * e) }; }
    if (type === 2) { const a = randInt(5, 10); const b = randInt(10, 20); const c = randInt(5, 15); return { txt: `밭에 모종을 한 줄에 ${b}개씩 ${a}줄 심었습니다. 며칠 뒤 확인해 보니 ${c}개의 모종이 말라 죽었습니다. 잘 자라고 있는 모종은 모두 몇 개일까요?`, ans: (a * b) - c }; }
    if (type === 3) { const a = randInt(3, 6); const b = randInt(10, 20)*100; const c = randInt(1, 3)*100; return { txt: `동네 마트에서 원래 ${b}원인 우유를 ${c}원씩 할인해서 팝니다. 이 우유를 ${a}팩 샀다면 모두 얼마를 내야 할까요?`, ans: a * (b - c) }; }
    if (type === 4) { const a = randInt(3, 6); const b = randInt(4, 8); const c = randInt(8, 12)*1000; return { txt: `${name}는 식당에서 하루에 ${b}시간씩 ${a}일 동안 일했습니다. 1시간에 ${c}원씩 받는다면, 받을 수 있는 돈은 모두 얼마일까요?`, ans: a * b * c }; }
    if (type === 5) { const a = randInt(2, 5); const b = randInt(3, 9); return { txt: `연필 한 다스는 12자루입니다. 연필 ${a}다스와 낱개로 ${b}자루를 더 샀다면, 연필은 모두 몇 자루일까요?`, ans: (a * 12) + b }; }
    if (type === 6) { const a = randInt(3, 5); const b = randInt(4, 7); const c = randInt(2, 4); const d = randInt(5, 9); return { txt: `할머니 모임에서 ${a}명은 ${b}원씩 내고, 할아버지 모임에서 ${c}명은 ${d}원씩 모금을 했습니다. 두 모임에서 모은 돈은 모두 얼마일까요?`, ans: (a * b) + (c * d) }; }
    // 신규 확장 유형 (7~13) : 2~3단계 복합 연산
    if (type === 7) { const a = randInt(3, 6); const b = randInt(2, 5); const c = randInt(1, 3) * 1000; return { txt: `가족 나들이를 가서 어른 ${a}명과 아이 ${b}명이 각각 ${c}원짜리 아이스크림을 하나씩 사 먹었습니다. 아이스크림 값은 모두 얼마일까요?`, ans: (a + b) * c }; }
    if (type === 8) { const a = randInt(5, 10); const c = randInt(1, 3); const b = randInt(10, 20); return { txt: `밭 ${a}고랑에 배추를 ${b}포기씩 심었습니다. 그런데 장마에 ${c}고랑의 배추가 모두 썩어버렸습니다. 무사히 건진 배추는 모두 몇 포기일까요?`, ans: (a - c) * b }; }
    if (type === 9) { const a = randInt(2, 4); const b = randInt(2, 3); const c = randInt(5, 10); return { txt: `관절염 약을 한 번에 ${a}알씩, 하루에 ${b}번 먹어야 합니다. ${c}일 동안 빼놓지 않고 약을 먹는다면, 먹은 알약은 모두 몇 알일까요?`, ans: a * b * c }; }
    if (type === 10) { const a = randInt(5, 9)*1000; const b = randInt(3, 6); const c = randInt(1, 2)*1000; const d = randInt(2, 4); return { txt: `시장에서 ${a}원짜리 참기름을 ${b}병 샀습니다. 사장님이 ${c}원짜리 단골 할인 쿠폰을 ${d}장 써주셨다면, 내야 할 돈은 얼마일까요?`, ans: (a * b) - (c * d) }; }
    if (type === 11) { const a = randInt(6, 12); const b = randInt(5, 10)*10000; const c = randInt(2, 5)*10000; return { txt: `손주들을 위해 매달 적금에 ${b}원, 주택청약에 ${c}원씩 넣고 있습니다. ${a}개월 동안 모은 돈은 모두 얼마일까요?`, ans: a * (b + c) }; }
    if (type === 12) { const a = randInt(10, 20); const b = randInt(5, 9); const c = randInt(2, 9); return { txt: `수확한 복숭아를 한 상자에 ${a}개씩 담아 ${b}상자를 꽉 채우고도 ${c}개가 남았습니다. 수확한 복숭아는 모두 몇 개일까요?`, ans: (a * b) + c }; }
    if (type === 13) { const a = randInt(10, 15); const b = randInt(4, 7); const c = randInt(2, 5); return { txt: `관광버스가 ${b}대 출발했습니다. 한 대당 ${a}명씩 탈 수 있는데, 출발할 때 확인해보니 전체에서 ${c}자리가 비어있었습니다. 버스에 탄 사람은 모두 몇 명일까요?`, ans: (a * b) - c }; }

  } else { // div (모두 정수 보장 로직 완벽 적용)
    const type = randInt(1, 12); // 총 12개 유형
    // 기존 유형 (1~8)
    if (type === 1) { const ans = randInt(5, 12); const c = randInt(3, 5); const b = randInt(10, 20); const a = (ans * c) + b; return { txt: `사탕 ${a}개가 있습니다. 동생에게 ${b}개를 먼저 주고, 남은 사탕을 친구 ${c}명에게 똑같이 나누어 주었습니다. 친구 한 명이 받은 사탕은 몇 개일까요?`, ans: ans }; }
    if (type === 2) { const c = randInt(4, 8); const b = randInt(3, 6); const k = randInt(2, 5); const ans = k * b; const a = (ans * c) / b; return { txt: `사과 ${a}상자에 사과가 각각 ${b}개씩 들어있습니다. 이 사과를 ${c}명에게 똑같이 나누어 주려고 합니다. 한 명당 몇 개씩 받을 수 있을까요?`, ans: ans }; }
    if (type === 3) { const ans = randInt(8, 15); const c = 10; const a = randInt(30, 80); const b = (ans * c) - a; return { txt: `장미꽃 ${a}송이와 튤립 ${b}송이가 있습니다. 이 꽃들을 ${c}송이씩 묶어서 꽃다발을 만들려고 합니다. 꽃다발은 모두 몇 개 만들 수 있을까요?`, ans: ans }; }
    if (type === 4) { const c = randInt(4, 8); const k = randInt(2, 5); const b = randInt(5, 10); const ans = k * b; const a = (ans * c) / b; return { txt: `복숭아가 한 상자에 ${b}개씩 ${a}상자 있습니다. 이 복숭아를 ${c}명에게 똑같이 나누어 준다면, 한 명당 몇 개씩 받을 수 있을까요?`, ans: ans }; }
    if (type === 5) { const ans = randInt(5, 12)*100; const d = randInt(3, 6); const b = randInt(2, 5); const c = randInt(5, 15)*100; const a = (ans * d) + (b * c); return { txt: `지갑에 ${a}원이 있었습니다. ${c}원짜리 빵을 ${b}개 사고, 남은 돈으로 아이스크림 ${d}개를 똑같이 나누어 샀습니다. 아이스크림 한 개의 가격은 얼마일까요?`, ans: ans }; }
    if (type === 6) { const ans = randInt(4, 9); const c = randInt(3, 6); const b = randInt(2, 8); const a = (ans * c) + b; return { txt: `쿠키를 ${a}개 구웠는데 실수로 ${b}개를 태워버렸습니다. 남은 쿠키를 손주 ${c}명에게 똑같이 나누어 준다면 한 명당 몇 개씩 받을 수 있을까요?`, ans: ans }; }
    if (type === 7) { const ans = randInt(2, 6)*1000; const c = randInt(1, 5)*1000; const b = randInt(3, 6); const a = (ans + c) * b; return { txt: `할아버지가 손주 ${b}명에게 용돈을 똑같이 나누어 주려고 총 ${a}원을 준비했습니다. 손주 한 명이 그 돈으로 ${c}원짜리 과자를 사 먹었다면, 이 손주에게 남은 돈은 얼마일까요?`, ans: ans }; }
    if (type === 8) { const a = randInt(3, 6); const c = randInt(4, 8); const k = randInt(2, 4); const b = k * c; const total = a * b; const ans = total / c; return { txt: `한 봉지에 ${b}개씩 들어있는 사탕 ${a}봉지를 뜯어서, 작은 상자 한 개당 ${c}개씩 다시 포장하려고 합니다. 상자는 모두 몇 개 필요할까요?`, ans: ans }; }
    // 신규 확장 유형 (9~12) : 2~3단계 복합 연산, 정수 100% 보장
    if (type === 9) { const c = randInt(3, 6); const ans = randInt(5, 12); const total = ans * c; const a = randInt(5, total - 5); const b = total - a; return { txt: `어제 텃밭에서 캔 감자가 ${a}개, 오늘 캔 감자가 ${b}개입니다. 이 감자들을 ${c}개의 상자에 똑같은 개수로 나누어 담는다면, 한 상자에 몇 개씩 들어갈까요?`, ans: ans }; }
    if (type === 10) { const c = randInt(4, 8); const ans = randInt(3, 7); const rem = ans * c; const b = randInt(5, 15); const a = rem + b; return { txt: `호두과자를 ${a}개 사서 제가 먼저 ${b}개를 먹었습니다. 남은 호두과자를 이웃집 ${c}곳에 똑같이 나누어 준다면, 한 집에 몇 개씩 줄 수 있을까요?`, ans: ans }; }
    if (type === 11) { const ans = randInt(4, 9); const c = randInt(3, 6); const total = ans * c; const b = [2,3,4,5,6].find(n => total % n === 0) || 2; const a = total / b; return { txt: `한 묶음에 ${a}개씩 들어있는 대파가 ${b}묶음 있습니다. 끈을 다 풀어서 ${c}개의 단으로 다시 똑같이 나누어 묶으려고 합니다. 한 단에 대파가 몇 개씩 묶일까요?`, ans: ans }; }
    if (type === 12) { const d = randInt(3, 5); const ans = randInt(10, 20); const total = ans * d; const a = randInt(10, Math.floor(total/3)); const b = randInt(10, Math.floor(total/3)); const c = total - a - b; return { txt: `3일 동안 닭장에서 달걀을 모았습니다. 첫째 날 ${a}개, 둘째 날 ${b}개, 셋째 날 ${c}개를 모았습니다. 이 달걀들을 ${d}명에게 똑같이 나누어 준다면 한 명당 몇 개씩 받을까요?`, ans: ans }; }
  }
}

function genStoryHigh(op) {
  const name = pick(NAMES);

  if (op === 'add') {
    const type = randInt(1, 12);
    if (type === 1) { const a = randInt(10, 20); const x = randInt(20, 40); const b = x + a; const w = x - a; return { txt: `어떤 수에서 ${a}를 빼야 할 것을 실수로 더했더니 ${b}이(가) 되었습니다. 바르게 계산하면 얼마일까요?`, ans: w }; }
    if (type === 2) { const x = randInt(15, 30); const y = randInt(10, 25); const z = randInt(10, 20); return { txt: `세 수 A, B, C가 있습니다. A와 B의 합은 ${x+y}, B와 C의 합은 ${y+z}, C와 A의 합은 ${z+x}입니다. 세 수를 모두 합한 값은 얼마일까요?`, ans: x + y + z }; }
    if (type === 3) { const ans = randInt(5, 15) * 2; const S = 3 * ans + 6; return { txt: `연속된 세 개의 짝수를 모두 더했더니 ${S}이(가) 되었습니다. 이 중 가장 작은 짝수는 얼마일까요?`, ans: ans }; }
    if (type === 4) { const ans = randInt(10, 20); const D = randInt(2, 8); const S = 2 * ans + D; return { txt: `형과 동생의 나이를 합치면 ${S}살입니다. 형이 동생보다 ${D}살 더 많다면, 동생의 나이는 몇 살일까요?`, ans: ans }; }
    if (type === 5) { const ans = randInt(10, 30); const S = 3 * ans; return { txt: `A 상자에는 B 상자보다 사과가 2배 더 들어있습니다. 두 상자의 사과를 모두 합치면 ${S}개입니다. B 상자에 들어있는 사과는 몇 개일까요?`, ans: ans }; }
    if (type === 6) { const n = randInt(3, 8); const ans = 2 * n; return { txt: `계단을 한 번에 2계단씩 뛰어오르면 ${n}번 만에 다 오를 수 있습니다. 한 번에 1계단씩 오른다면 모두 몇 번을 올라야 할까요?`, ans: ans }; }
    if (type === 7) { const D = randInt(1, 4) * 1000; const ans = randInt(5, 10) * 1000; const S = 2 * ans - D; return { txt: `두 사람이 돈을 모아 총 ${S}원짜리 선물을 사기로 했습니다. A가 B보다 ${D}원을 더 내기로 했다면, A가 내야 할 돈은 얼마일까요?`, ans: ans }; }
    if (type === 8) { const M = randInt(70, 90); const S = randInt(60, 80); const ans = 2 * M - S; return { txt: `국어와 수학 두 과목의 평균 점수가 ${M}점입니다. 국어 점수가 ${S}점이라면 수학 점수는 몇 점일까요?`, ans: ans }; }
    if (type === 9) { const L = randInt(1, 3) * 100; const B = randInt(5, 9) * 100; const ans = L + B; return { txt: `길이가 ${L}m인 기차가 길이가 ${B}m인 다리를 완전히 통과하려고 합니다. 기차가 이동해야 하는 총 거리는 몇 m일까요?`, ans: ans }; }
    if (type === 10) { const P = randInt(10, 30); const ans = P * 4; return { txt: `어제는 책의 전체 쪽수 중 절반을 읽고, 오늘은 남은 쪽수의 절반을 읽었습니다. 아직 안 읽은 쪽수가 ${P}쪽이라면, 이 책의 전체 쪽수는 몇 쪽일까요?`, ans: ans }; }
    if (type === 11) { const ans = randInt(10, 20); const W = randInt(5, 15); const S = W + 2 * ans; return { txt: `A 상자와 B 상자의 무게를 합치면 ${S}kg입니다. A 상자에서 ${W}kg짜리 물건을 빼냈더니 빈 A 상자와 B 상자의 무게가 같아졌습니다. B 상자의 무게는 몇 kg일까요?`, ans: ans }; }
    if (type === 12) { const a = randInt(3, 7); const b = randInt(2, 5); const M = randInt(5, 10) * 1000; return { txt: `윗마을 사람 ${a}명과 아랫마을 사람 ${b}명이 이웃 돕기 성금으로 각각 ${M}원씩 냈습니다. 모인 성금은 모두 합쳐서 얼마일까요?`, ans: (a + b) * M }; }

  } else if (op === 'sub') {
    const type = randInt(1, 13);
    if (type === 1) { const a = randInt(10, 20); const ans = randInt(30, 50); const b = ans - a; return { txt: `어떤 수에 ${a}를 더해야 할 것을 실수로 뺐더니 ${b}이(가) 되었습니다. 바르게 계산하면 얼마일까요?`, ans: ans + a }; }
    if (type === 2) { const ans = randInt(20, 40); const D = randInt(5, 15); const h = ans - D; const P = 2 * (ans + h); return { txt: `길이가 ${P}cm인 철사를 구부려서 가로가 세로보다 ${D}cm 더 긴 직사각형을 만들었습니다. 이 직사각형의 가로는 몇 cm일까요?`, ans: ans }; }
    if (type === 3) { const ans = randInt(15, 25); const d1 = randInt(3, 7); const d2 = randInt(2, 6); const total = ans + (ans + d1) + (ans - d2); return { txt: `구슬 ${total}개를 A, B, C 세 상자에 나누어 담았습니다. A에는 B보다 ${d1}개 더 담고, C에는 B보다 ${d2}개 적게 담았습니다. B 상자에 들어있는 구슬은 몇 개일까요?`, ans: ans }; }
    if (type === 4) { const ans = randInt(10, 20); const D = 2 * ans; return { txt: `아버지의 나이는 아들 나이의 3배입니다. 아버지와 아들의 나이 차이가 ${D}살이라면, 아들의 나이는 몇 살일까요?`, ans: ans }; }
    if (type === 5) { const ans = randInt(3, 8); const m = randInt(10, 20) * 2; const Full = ans + m; const Half = ans + (m / 2); return { txt: `물이 꽉 찬 물통의 무게는 ${Full}kg이고, 물이 반만 들어있는 물통의 무게는 ${Half}kg입니다. 빈 물통만의 무게는 몇 kg일까요?`, ans: ans }; }
    if (type === 6) { const ans = randInt(5, 10); const y = randInt(3, 8); const N = ans + y; const S = ans * 2 + y * 4; return { txt: `농장에 닭과 돼지가 합쳐서 모두 ${N}마리 있습니다. 다리 수를 세어보니 모두 ${S}개였습니다. 닭은 몇 마리일까요?`, ans: ans }; }
    if (type === 7) { const ans = randInt(3, 7); const L = randInt(15, 25); const S = 2 * L - ans; return { txt: `길이가 ${L}cm인 색테이프 2장을 일정한 길이만큼 겹치게 이어 붙였더니 전체 길이가 ${S}cm가 되었습니다. 겹쳐진 부분의 길이는 몇 cm일까요?`, ans: ans }; }
    if (type === 8) { const ans = randInt(15, 25) * 100; const C = randInt(10, 30) * 100; const total = C + 3 * ans; return { txt: `가게에서 똑같은 물건 3개를 사고 ${total}원을 냈더니, 거스름돈으로 ${C}원을 주었습니다. 물건 1개의 가격은 얼마일까요?`, ans: ans }; }
    if (type === 9) { const ans = randInt(20, 50); const D = randInt(20, 40); const S = ans + 3 * D; return { txt: `전체 쪽수가 ${S}쪽인 책이 있습니다. 3일 동안 매일 ${D}쪽씩 읽었다면, 아직 읽지 않고 남은 쪽수는 몇 쪽일까요?`, ans: ans }; }
    if (type === 10) { const ans = randInt(10, 20); const A = randInt(3, 7); const B = randInt(2, 5); const C = (ans - A) * B; return { txt: `어떤 수에서 ${A}를 뺀 다음 ${B}을(를) 곱했더니 ${C}이(가) 되었습니다. 어떤 수는 무엇일까요?`, ans: ans }; }
    if (type === 11) { const ans = randInt(10, 20); const D = 2 * ans; return { txt: `A 나무의 높이는 B 나무의 3배입니다. A 나무가 B 나무보다 ${D}m 더 높다면, B 나무의 높이는 몇 m일까요?`, ans: ans }; }
    if (type === 12) { const ans = randInt(2, 5) * 1000; const S = ans * 10; const M = (ans / S) * 100; return { txt: `정가가 ${S}원인 물건을 ${M}% 할인하여 팔고 있습니다. 이 물건을 살 때 깎아주는 금액은 얼마일까요?`, ans: ans }; }
    if (type === 13) { const ans = randInt(5, 12); const total = 4 * (ans - 1); return { txt: `바둑돌을 정사각형 모양으로 꽉 채워 놓았습니다. 가장 바깥쪽 테두리에 있는 바둑돌을 세어보니 모두 ${total}개였습니다. 정사각형의 한 변에 놓인 바둑돌은 몇 개일까요?`, ans: ans }; }

  } else if (op === 'mul') {
    const type = randInt(1, 12);
    if (type === 1) { const N = randInt(3, 6); const L = randInt(15, 25); const O = randInt(3, 6); return { txt: `색테이프 ${N}장을 각각 ${O}cm씩 겹치게 이어 붙였습니다. 색테이프 한 장의 길이가 ${L}cm라면, 이어 붙인 전체 길이는 몇 cm일까요?`, ans: N * L - (N - 1) * O }; }
    if (type === 2) { const ans = randInt(6, 12); const i = randInt(3, 6); const L = (ans - 1) * i; return { txt: `길이가 ${L}m인 골목길 한쪽에 ${i}m 간격으로 화분을 놓으려고 합니다. 골목길의 처음과 끝에도 모두 놓는다면 화분은 몇 개 필요할까요?`, ans: ans }; }
    if (type === 3) { const d = randInt(4, 8); const ans = 2 * d; return { txt: `현재 어머니 나이는 딸 나이의 4배입니다. ${d}년 뒤에는 어머니 나이가 딸 나이의 3배가 됩니다. 현재 딸의 나이는 몇 살일까요?`, ans: ans }; }
    if (type === 4) { const max = randInt(40, 60); const D = randInt(6, 9); return { txt: `1부터 ${max}까지의 숫자 중에서 ${D}의 배수는 모두 몇 개일까요?`, ans: Math.floor(max / D) }; }
    if (type === 5) { const N = randInt(5, 10); const T = randInt(3, 6); return { txt: `긴 통나무를 ${N}도막으로 자르려고 합니다. 한 번 톱질하는 데 ${T}분이 걸린다면, 다 자르는 데 걸리는 총 시간은 몇 분일까요?`, ans: (N - 1) * T }; }
    if (type === 6) { const N = randInt(4, 8); const H1 = randInt(30, 50); const H2 = randInt(20, 30); return { txt: `${N}층짜리 탑이 있습니다. 1층의 높이는 ${H1}cm이고, 2층부터는 각 층의 높이가 ${H2}cm입니다. 이 탑의 전체 높이는 몇 cm일까요?`, ans: H1 + (N - 1) * H2 }; }
    if (type === 7) { const N = randInt(4, 8); return { txt: `벽시계가 1시에는 1번, 2시에는 2번 종을 칩니다. 1시부터 ${N}시까지 울린 종소리는 모두 합쳐서 몇 번일까요?`, ans: (N * (N + 1)) / 2 }; }
    if (type === 8) { const N = randInt(10, 20); const D = randInt(3, 6); return { txt: `도로에 일정한 간격으로 가로수 ${N}그루가 심어져 있습니다. 가로수 사이의 간격이 ${D}m라면, 1번 가로수에서 마지막 가로수까지의 거리는 몇 m일까요?`, ans: (N - 1) * D }; }
    if (type === 9) { const M = randInt(2, 5); const D = randInt(10, 20); return { txt: `고장 난 시계가 하루에 ${M}분씩 점점 빨라지고 있습니다. 이대로 ${D}일이 지나면 시계는 원래 시간보다 총 몇 분이 빨라지게 될까요?`, ans: M * D }; }
    if (type === 10) { const N = randInt(10, 20); return { txt: `어떤 직사각형은 가로의 길이가 세로의 길이의 2배입니다. 세로의 길이가 ${N}cm라면, 이 직사각형의 둘레는 몇 cm일까요?`, ans: 6 * N }; }
    if (type === 11) { const M = randInt(5, 15); const K = randInt(3, 6); const H = randInt(2, 5); return { txt: `기계 1대가 1시간 동안 부품을 ${M}개 만듭니다. 똑같은 기계 ${K}대를 동시에 작동시켜 ${H}시간 동안 부품을 만든다면 모두 몇 개를 만들까요?`, ans: M * K * H }; }
    if (type === 12) { const ans = randInt(5, 10); const K = randInt(3, 6); const M = K * randInt(2, 5); const N = (ans * M) / K; return { txt: `맞물려 돌아가는 두 톱니바퀴 A, B가 있습니다. A의 톱니는 ${N}개, B의 톱니는 ${M}개입니다. A가 ${K}바퀴 도는 동안 B는 몇 바퀴를 돌까요?`, ans: ans }; }

  } else { // div
    const type = randInt(1, 13);
    if (type === 1) { const ans = randInt(3, 8); const y = 10 - ans; const total = ans * 100 + y * 500; return { txt: `지갑에 100원짜리 동전과 500원짜리 동전이 섞여서 모두 10개 있습니다. 이 동전들의 금액을 합치면 ${total}원입니다. 100원짜리 동전은 몇 개일까요?`, ans: ans }; }
    if (type === 2) { const ans = randInt(4, 8) * 4; const P1 = (ans * 6) / 8; return { txt: `어떤 책을 하루에 ${P1}쪽씩 읽으면 8일 만에 다 읽습니다. 똑같은 책을 6일 만에 다 읽으려면 하루에 몇 쪽씩 읽어야 할까요?`, ans: ans }; }
    if (type === 3) { const ans = randInt(15, 25); const L = ans * 6; return { txt: `길이가 ${L}cm인 철사를 하나도 남김없이 모두 구부려서 정육각형 모양을 만들었습니다. 이 정육각형의 한 변의 길이는 몇 cm일까요?`, ans: ans }; }
    if (type === 4) { const r = randInt(2, 4); const ans = randInt(15, 25); const L1 = ans - r; const L3 = ans - 3 * r; return { txt: `일정한 빠르기로 타는 양초가 있습니다. 불을 붙이고 1시간 뒤 길이는 ${L1}cm였고, 3시간 뒤 길이는 ${L3}cm였습니다. 불을 붙이기 전, 양초의 원래 길이는 몇 cm였을까요?`, ans: ans }; }
    if (type === 5) { const speed = pick([60, 80, 100]); const H = randInt(2, 3); const D = speed * H; const ans = randInt(4, 5); const D2 = speed * ans; return { txt: `기차가 일정한 속력으로 달려서 ${D}km를 가는 데 ${H}시간이 걸렸습니다. 같은 속력으로 ${D2}km를 가려면 몇 시간이 걸릴까요?`, ans: ans }; }
    if (type === 6) { const A = randInt(5, 12); const Q = randInt(10, 20); const R = randInt(1, A - 1); const ans = A * Q + R; return { txt: `어떤 수를 ${A}로 나누었더니 몫이 ${Q}이고 나머지가 ${R}이(가) 되었습니다. 나누기 전의 어떤 수는 무엇일까요?`, ans: ans }; }
    if (type === 7) { const A = randInt(2, 5); const B = randInt(2, 5); const x = A * B; const ans = x * A; return { txt: `어떤 수에 ${A}를 곱해야 할 것을 실수로 나누었더니 ${B}이(가) 되었습니다. 바르게 곱했다면 얼마가 나왔을까요?`, ans: ans }; }
    if (type === 8) { const M = randInt(80, 90); const ans = randInt(75, 100); const S = 5 * M - ans; return { txt: `5과목의 시험 점수 평균이 ${M}점입니다. 그중 4과목 점수의 합이 ${S}점이라면, 나머지 1과목의 점수는 몇 점일까요?`, ans: ans }; }
    if (type === 9) { const ans = randInt(10, 30); const S = 5 * ans; return { txt: `A 상자의 무게가 B 상자 무게의 4배입니다. 두 상자의 무게를 합쳐서 ${S}kg이라면, B 상자의 무게는 몇 kg일까요?`, ans: ans }; }
    if (type === 10) { const ans = randInt(10, 20) * 2; const S = (ans / 2) * 5; return { txt: `구슬 ${S}개를 형과 동생이 3:2의 비율로 나누어 가졌습니다. 둘 중 구슬을 더 적게 받은 사람은 몇 개를 가졌을까요?`, ans: ans }; }
    if (type === 11) { const ans = randInt(2, 5); const M = randInt(3, 6); const P = randInt(2, 4); const N = ans * M * P; return { txt: `물 ${N}리터를 ${M}명이 똑같이 나누어 마시려고 합니다. 1명이 이 물을 ${P}일 동안 마신다면, 하루에 몇 리터씩 마셔야 할까요?`, ans: ans }; }
    if (type === 12) { const L = randInt(2, 4) * 10; const c = randInt(5, 10); const r = randInt(5, 10); const W = L * c; const H = L * r; return { txt: `가로 ${W}cm, 세로 ${H}cm인 직사각형 바닥에 한 변의 길이가 ${L}cm인 정사각형 모양의 타일을 빈틈없이 붙이려고 합니다. 타일은 모두 몇 장 필요할까요?`, ans: c * r }; }
    if (type === 13) { const U = randInt(5, 8); const N = randInt(2, 4); const ans = randInt(5, 10); const D = (ans - 1) * (U - N) + U; return { txt: `깊이가 ${D}m인 우물에 빠진 달팽이가 있습니다. 낮에는 ${U}m를 기어오르지만, 밤에는 ${N}m를 미끄러집니다. 우물을 완전히 빠져나오는 데는 며칠이 걸릴까요?`, ans: ans }; }
  }
}

function generateStoryWorksheet(counts, ratios) {
  const qs = []; const opsPool = [];
  const totalQs = counts.low + counts.mid + counts.high;
  
  ['add', 'sub', 'mul', 'div'].forEach(op => {
    const opCount = Math.round((ratios[op] / 100) * totalQs);
    for (let i = 0; i < opCount; i++) opsPool.push(op);
  });
  while (opsPool.length < totalQs) opsPool.push(pick(['add', 'sub', 'mul', 'div']));
  if (opsPool.length > totalQs) opsPool.length = totalQs; 
  shuffle(opsPool);

  // 난이도별 중복 방지 — 요청 수가 50 초과일 때만 중복 허용
  const ALLOW_DUP_AFTER = 50;
  const used = {'하': new Set(), '중': new Set(), '상': new Set()};

  const genNoDup = (genFn, op, diff, requestedCount) => {
    const allowDup = requestedCount > ALLOW_DUP_AFTER;
    const maxRetry = allowDup ? 1 : 40;
    let q;
    for (let r = 0; r < maxRetry; r++) {
      q = { ...genFn(op), type: 'story', diff };
      if (!used[diff].has(q.txt)) break;
    }
    used[diff].add(q.txt);
    return q;
  };

  for (let i = 0; i < counts.low; i++)  qs.push(genNoDup(genStoryLow,  opsPool.pop(), '하', counts.low));
  for (let i = 0; i < counts.mid; i++)  qs.push(genNoDup(genStoryMid,  opsPool.pop(), '중', counts.mid));
  for (let i = 0; i < counts.high; i++) qs.push(genNoDup(genStoryHigh, opsPool.pop(), '상', counts.high));

  return shuffle(qs);
}

/* ===== GEOMETRY GENERATORS ===== */
