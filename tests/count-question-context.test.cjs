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
assert(vertical.includes('x="55" y="91"')&&vertical.includes('x="55" y="123"')&&vertical.includes('x="55" y="155"'));
const upwards=perm.build({c:'4개 중 3개',seed:18,v:3}).figure;
assert(upwards.indexOf('>3층</text>')<upwards.indexOf('>2층</text>')&&upwards.indexOf('>2층</text>')<upwards.indexOf('>1층</text>'));
for(const id of ['u19','u20']){let unit=now.GED_UNITS.find(x=>x.id===id);for(const seed of [48,52])for(const c of unit.fields[0].sel){let q=unit.build({c,seed,v:3});assert(!q.q.includes('옷걸이')&&!q.q.includes('준비물로 고르는')&&!q.q.includes('한 벌씩'));if(seed===48)assert(q.q.includes('옷차림 물품'));else assert(q.q.includes('캠핑 관련 그림'));}}
console.log('Vertical slot coordinates, floor order and clothing/camping contexts: PASS');
