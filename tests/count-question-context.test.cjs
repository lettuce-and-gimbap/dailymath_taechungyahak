const fs=require('fs'),vm=require('vm'),cp=require('child_process'),assert=require('assert');
function load(old){const c={};vm.createContext(c);for(const f of ['js/worksheet/gedCore.js','js/worksheet/gedUnits.js']){const src=old?cp.execFileSync('git',['show','HEAD:'+f],{encoding:'utf8'}):fs.readFileSync(f,'utf8');vm.runInContext(src,c)}return c}
const now=load(false),old=load(true),qs=new Set();assert.equal(now.GED_COUNT_ORDER_ACTIONS.length,60);
for(const id of ['u19','u20'])for(let seed=1;seed<=60;seed++){
 const u=now.GED_UNITS.find(x=>x.id===id),before=old.GED_UNITS.find(x=>x.id===id);
 for(const c of u.fields[0].sel){const p={c,seed,v:3},q=u.build(p);const [n,r]=c.match(/\d+/g).map(Number);let expected=1;for(let k=0;k<r;k++)expected*=n-k;if(id==='u20')for(let k=2;k<=r;k++)expected/=k;
 assert.equal(Number(q.answerTex),expected);assert.equal(Number(q.choices[q.ans]),expected);assert(q.figure.includes('count-figure'));
 if(id==='u20')assert(q.q.includes('그중에서 서로 다른 '+r));else assert(q.q.includes(String(r)));
 const v2={c,seed,v:2},a=before.build(v2),b=u.build(v2);assert.equal(a.q,b.q);assert.equal(a.answerTex,b.answerTex);
 if(c===u.def.c){assert(!qs.has(q.q),`duplicate ${id} ${seed}`);qs.add(q.q)}
 }
}
console.log('60 distinct situations per unit; 960 answers; v2 wording and answers preserved: PASS');

const perm=now.GED_UNITS.find(x=>x.id==='u19');
for(const [seed,title,first] of [[1,'날짜','1일째'],[2,'위→아래','1'],[3,'왼쪽→','1'],[18,'아래→위','1층'],[24,'받는 사람','친구1'],[27,'받는 사람','손님1']]){const q=perm.build({c:'4개 중 3개',seed,v:3});assert(q.figure.includes(title),`missing ${title}: ${seed}`);assert(q.figure.includes(first),`missing ${first}: ${seed}`)}
assert(perm.build({c:'4개 중 3개',seed:1,v:2}).figure.includes('순서'));
console.log('Slots match dates, directions and recipients; v2 slots preserved: PASS');
const vertical=perm.build({c:'4개 중 3개',seed:2,v:3}).figure;
assert(vertical.includes('translate(55,91)')&&vertical.includes('translate(55,123)')&&vertical.includes('translate(55,155)'));
const upwards=perm.build({c:'4개 중 3개',seed:18,v:3}).figure;
assert(upwards.indexOf('>3층</text>')<upwards.indexOf('>2층</text>')&&upwards.indexOf('>2층</text>')<upwards.indexOf('>1층</text>'));
for(const id of ['u19','u20']){let unit=now.GED_UNITS.find(x=>x.id===id);for(const seed of [48,52])for(const c of unit.fields[0].sel){let q=unit.build({c,seed,v:3});assert(!q.q.includes('옷걸이')&&!q.q.includes('준비물로 고르는')&&!q.q.includes('한 벌씩'));if(seed===48)assert(q.q.includes('옷차림 물품'));else assert(q.q.includes('캠핑 관련 그림'));}}
console.log('Vertical slot coordinates, floor order and clothing/camping contexts: PASS');
for(const [seed,kind] of [[1,'calendar'],[2,'shelf'],[3,'vase'],[5,'flag'],[9,'tray'],[16,'pot'],[19,'jar'],[24,'person'],[29,'stand'],[34,'board']]){
 const figure=perm.build({c:'4개 중 3개',seed,v:3}).figure;
 assert.equal((figure.match(new RegExp('data-placement="'+kind+'"','g'))||[]).length,3,`${seed}: ${kind}`);
}
console.log('Context-specific placements and exact slot counts: PASS');
for(const [n,expected] of [[3,[3]],[4,[2,2]],[5,[3,2]],[6,[3,3]]]){
 for(const ordered of [false,true]){
  const s=now.GED_COUNT_SCENES_V4[33],figure=now.gedCountFigure(s,n,Math.min(n,4),ordered,ordered?'첫째부터 4번째까지 순서를 정하는':null,true);
  const positions=[...figure.matchAll(/<g transform="translate\((\d+),(\d+)\)"><rect x="0" y="0" width="74"/g)].map(m=>[+m[1],+m[2]]);
  const rows=[...new Set(positions.map(p=>p[1]))].map(y=>positions.filter(p=>p[1]===y).length);
  assert.deepEqual(rows,expected,`${n}개의 그림 배열`);
  const box=figure.match(/viewBox="0 0 (\d+) (\d+)"/),w=+box[1],h=+box[2];
  assert(positions.every(([x,y])=>x+74<=w&&y+78<=h),'그림이 SVG 경계를 벗어남');
  if(ordered){const placements=[...figure.matchAll(/class="count-placement"[^>]*transform="translate\((\d+),(\d+)\)"/g)].map(m=>[+m[1],+m[2]]);assert.equal(placements.length,Math.min(n,4));assert(placements.every(([x,y])=>x+60<=w&&y+65<=h),'배치 칸이 SVG 경계를 벗어남');assert(placements.every(([,y])=>y>=Math.max(...positions.map(p=>p[1]))+78),'배치 칸과 그림이 겹침');}
 }
}
console.log('Student 3, 2×2, 3+2 and 3×2 layouts and placement bounds: PASS');
