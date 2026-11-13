const fs=require('fs'),vm=require('vm'),assert=require('assert'),cp=require('child_process'),path=require('path'),os=require('os');
process.chdir(path.resolve(__dirname,'..'));
const babelPath=process.env.BABEL_STANDALONE_PATH||path.join(os.tmpdir(),'taechung-babel-standalone-7.23.10.js');
assert(fs.existsSync(babelPath),'Babel 7.23.10 required: run node tests/student-unified-practice.test.cjs first, or set BABEL_STANDALONE_PATH');
const Babel=require(babelPath);
function load(old=false){
 const c={window:{},console,setTimeout,clearTimeout};vm.createContext(c);
 for(const f of ['js/core/replay.js','js/worksheet/gedCore.js','js/worksheet/gedUnits.js','js/student/coordDaily.js']){
  let src=old?cp.execFileSync('git',['show','HEAD:'+f],{encoding:'utf8'}):fs.readFileSync(f,'utf8');
  if(f.endsWith('coordDaily.js'))src=Babel.transform(src,{presets:['react']}).code;
  vm.runInContext(src,c,{filename:f});
 }
 c.window.GS=c.GS;return c;
}
function snap(q){return JSON.stringify({q:q.q,svg:q.svg,choices:q.choices,ans:q.ans,sol:q.sol})}
async function main(){
 const now=load(),before=load(true),duplicates=[];
 for(const [label,scenes] of [['순열',now.GED_COUNT_SCENES_V4],['조합',now.GED_CHOICE_SCENES_V4]]){
  assert.equal(scenes.length,60,`${label}: 60개 상황`);
  scenes.forEach((scene,i)=>{
   assert.equal(scene.items.length,7,`${label} ${i+1}: 7개 항목`);
   assert.equal(new Set(scene.items).size,7,`${label} ${i+1}: 항목 이름 중복`);
   const icons=scene.items.map((item,k)=>now.gedCountIcon(scene,item,k));
   if(new Set(icons).size!==7)duplicates.push(`${label} ${i+1}: 중복 그림`);
   const paths=icons.map(icon=>(icon.match(/<image href="([^"?]+)/)||[])[1]).filter(Boolean);
   if(new Set(paths).size!==paths.length)duplicates.push(`${label} ${i+1}: 같은 그림 파일 중복`);
   for(let n=3;n<=6;n++){
    const subsets=new Set();
    for(let seed=1;seed<=32;seed++){
     const shuffled=now.gedCountShuffled(scene,seed),chosen=Array.from(shuffled.items.slice(0,n));
     assert.equal(new Set(chosen).size,n,`${label} ${i+1}: ${n}개 선택 중복`);
     subsets.add(chosen.slice().sort().join('|'));
    }
    assert(subsets.size>1,`${label} ${i+1}: 서로 다른 seed에서 항목 변화 없음`);
   }
  });
 }
 console.log('60 scenarios × 7 labels and varying N-item subsets: PASS');
 for(const id of ['u19','u20']){
  const unit=now.GED_UNITS.find(u=>u.id===id);
  for(let seed=1;seed<=60;seed++)for(const c of unit.fields[0].sel){
   const p={c,seed,v:4,drawSeed:seed*101},a=unit.build(p),b=unit.build(JSON.parse(JSON.stringify(p)));
   assert.equal(a.figure,b.figure,`${id} ${seed}: 그림 불안정`);
   assert.equal(JSON.stringify(a.choices),JSON.stringify(b.choices),`${id} ${seed}: 보기 불안정`);
   assert.equal(a.ans,b.ans,`${id} ${seed}: 정답 위치 불안정`);
   const [n,r]=c.match(/\d+/g).map(Number);let answer=1;for(let j=0;j<r;j++)answer*=n-j;if(id==='u20')for(let j=2;j<=r;j++)answer/=j;
   assert.equal(Number(a.answerTex),answer,`${id} ${seed}: 수학 정답`);assert.equal(Number(a.choices[a.ans]),answer);
  }
 }
 console.log('v4 persisted parameters reproduce figure and choices; answers correct: PASS');
 for(let seed=1;seed<=100;seed++){
  const a=before.withSeed(seed,()=>before.genCoordQ('count3'));
  const b=now.withSeed(seed,()=>now.genCoordQ('count3'));
  assert.equal(JSON.stringify({q:a.q,choices:a.choices,ans:a.ans,sol:a.sol}),JSON.stringify({q:b.q,choices:b.choices,ans:b.ans,sol:b.sol}),`count3 seed ${seed}: prior question or answer changed`);
  const repeat=now.withSeed(seed,()=>now.genCoordQ('count3'));
  assert.equal(snap(b),snap(repeat),`count3 seed ${seed}: current replay unstable`);
  const q=now.withSeed(seed,()=>now.genCoordQ('count4'));
  const rec={cSeed:seed,cLv:'count4',qFull:q.q,qTxt:q.q.slice(0,60),cAns:q.answer,choices:Array.from(q.choices),answerIdx:q.ans,meta:{type:q.topic}};
  const replay=await now.coordReplay(rec);
  assert(replay&&replay.exact,`count4 seed ${seed}: replay failed`);assert.equal(snap(replay.q),snap(q),`count4 seed ${seed}: replay changed`);
 }
 console.log('100 legacy count3 seeds and 100 count4 recorded replays: PASS');
 assert.deepEqual(duplicates,[],`중복 그림: ${duplicates.join(', ')}`);
 console.log('Distinct illustrations in every scenario: PASS');
}
main().catch(e=>{console.error(e);process.exitCode=1});
