const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path'),os=require('os'),crypto=require('crypto');
process.chdir(path.resolve(__dirname,'..'));
const babelPath=process.env.BABEL_STANDALONE_PATH||path.join(os.tmpdir(),'taechung-babel-standalone-7.23.10.js');
assert(fs.existsSync(babelPath),'Babel 7.23.10 required: run node tests/student-unified-practice.test.cjs first, or set BABEL_STANDALONE_PATH');
const Babel=require(babelPath),ctx={window:{},console,setTimeout,clearTimeout};vm.createContext(ctx);
for(const f of ['js/core/replay.js','js/worksheet/gedCore.js','js/worksheet/gedUnits.js','js/student/coordDaily.js']){let src=fs.readFileSync(f,'utf8');if(f.endsWith('coordDaily.js'))src=Babel.transform(src,{presets:['react']}).code;vm.runInContext(src,ctx,{filename:f});}ctx.window.GS=ctx.GS;
const snapshot=q=>({q:q.q,svg:q.svg,choices:q.choices,ans:q.ans,sol:q.sol});
async function main(){
 const problems=[];
 for(const [label,scenes] of [['순열',ctx.GED_COUNT_SCENES_V5],['조합',ctx.GED_CHOICE_SCENES_V5]]){
  assert(scenes&&scenes.length>=62,`${label}: 기존 60개와 직업·AI 등 추가 상황 필요`);
  scenes.forEach((scene,index)=>{
   const at=`${label} ${index+1} ${scene.name}`;
   if(scene.items.length!==10)problems.push(`${at}: 항목 ${scene.items.length}개`);
   if(new Set(scene.items).size!==10)problems.push(`${at}: 항목 이름 중복`);
   const icons=scene.items.map((item,k)=>ctx.gedCountIcon(scene,item,k));
   if(new Set(icons).size!==10)problems.push(`${at}: 동일 SVG 그림`);
   const images=icons.flatMap(icon=>Array.from(icon.matchAll(/<image\s+(?:[^>]*?\s)?(?:href|xlink:href)="([^"?#]+)(?:\?[^"#]*)?"/g),m=>m[1]));
   if(new Set(images).size!==images.length)problems.push(`${at}: 동일 그림 파일`);
   for(const image of images){if(!/^(?:https?:|data:)/.test(image)&&!fs.existsSync(image.replace(/^\//,'')))problems.push(`${at}: 파일 없음 ${image}`);}
   for(let n=3;n<=6;n++){
    const subsets=new Set(),exposed=new Set();
    for(let seed=1;seed<=32;seed++){const chosen=Array.from(ctx.gedCountShuffled(scene,seed).items.slice(0,n));assert.equal(new Set(chosen).size,n,`${at}: ${n}개 중복 선택`);subsets.add(chosen.slice().sort().join('|'));}
    assert(subsets.size>1,`${at}: ${n}개 seed별 변화 없음`);
    for(let seed=1;seed<=128;seed++)for(const item of ctx.gedCountShuffled(scene,seed).items.slice(0,n))exposed.add(item);
    assert.equal(exposed.size,10,`${at}: 10개 후보가 모두 출제 가능해야 합니다`);
   }
  });
 }
 console.log('All scenarios checked: ten items, file existence, seeded subsets');
 for(const id of ['u19','u20']){
  const u=ctx.GED_UNITS.find(x=>x.id===id),scenes=id==='u19'?ctx.GED_COUNT_SCENES_V5:ctx.GED_CHOICE_SCENES_V5;
  for(let seed=1;seed<=scenes.length;seed++)for(const c of u.fields[0].sel){
   const p={c,seed,v:5,drawSeed:seed*101},a=u.build(p),b=u.build(JSON.parse(JSON.stringify(p)));
   assert.equal(a.figure,b.figure,`${id} ${seed}: 그림 복원`);assert.deepEqual(Array.from(a.choices),Array.from(b.choices),`${id} ${seed}: 보기 복원`);assert.equal(a.ans,b.ans);
   const [n,r]=c.match(/\d+/g).map(Number);let expected=1;for(let j=0;j<r;j++)expected*=n-j;if(id==='u20')for(let j=2;j<=r;j++)expected/=j;
   assert.equal(Number(a.answerTex),expected,`${id} ${seed}: 수학 정답`);assert.equal(Number(a.choices[a.ans]),expected);
  }
 }
 console.log('v5 saved parameters reproduce figure and choices; answers correct: PASS');
 const hashes={count3:'583ac6f55bf4c3171eca7fed49e4d60b57d68c399a0808c53ac97673cce4321a',count4:'deb4db89b6929f0d406e70c7d5371786f63365d36e8e473776e756c468ec1af3'};
 for(const lv of ['count3','count4','count5']){
  const all=[];for(let seed=1;seed<=100;seed++){
   const q=ctx.withSeed(seed,()=>ctx.genCoordQ(lv));all.push({q:q.q,labels:Array.from((q.svg||'').matchAll(/<text x="37" y="69"[^>]*>([^<]*)<\/text>/g),m=>m[1]),choices:q.choices,ans:q.ans});
   const rec={cSeed:seed,cLv:lv,qFull:q.q,qTxt:q.q.slice(0,60),cAns:q.answer,choices:Array.from(q.choices),answerIdx:q.ans,meta:{type:q.topic}};
   const replay=await ctx.coordReplay(rec);assert(replay&&replay.exact,`${lv} seed ${seed}: 재생 실패`);assert.equal(JSON.stringify(snapshot(replay.q)),JSON.stringify(snapshot(q)),`${lv} seed ${seed}: 재생 불일치`);
  }
  if(hashes[lv])assert.equal(crypto.createHash('sha256').update(JSON.stringify(all)).digest('hex'),hashes[lv],`${lv}: v5 적용 전 저장 기록 변화`);
 }
 console.log('100 saved replays per count3/count4/count5, pre-v5 snapshots: PASS');
 for(const n of [3,4,5,6]){
  const scene=ctx.GED_COUNT_SCENES_V5[0],fig=ctx.gedCountFigure(scene,n,2,true,'순서대로 나열하는',true);
  const positions=Array.from(fig.matchAll(/<g transform="translate\((\d+),(\d+)\)"><rect x="0" y="0" width="74" height="78"/g),m=>[+m[1],+m[2]]);
  assert.equal(positions.length,n,`${n}개 학생 그림 셀 수`);const columns=n===4?2:3;
  positions.forEach(([x,y],i)=>assert.deepEqual([x,y],[10+(i%columns)*82,5+Math.floor(i/columns)*86],`${n}개 학생 그리드 ${i}`));
  const view=fig.match(/viewBox="0 0 (\d+) (\d+)"/);assert(view);assert(+view[1]<=258,`${n}개 모바일 폭`);assert(+view[2]>=Math.max(...positions.map(p=>p[1]))+78,`${n}개 그림 잘림`);
 }
 console.log('Mobile student grid for 3, 4, 5, 6 items: PASS');
 const boardVariants=new Set();
 for(const scene of ctx.GED_COUNT_SCENES_V5){const figure=ctx.gedCountFigure(scene,4,3,true,'첫째부터 3번째까지 순서를 정하는',true);const variant=figure.match(/data-placement="board" data-variant="(\d+)"/);if(variant)boardVariants.add(variant[1]);}
 assert(boardVariants.size>=3,'순서판 디자인이 다양해야 합니다');
 const vertical=ctx.gedCountFigure(ctx.GED_COUNT_SCENES_V5[1],4,3,true,'위에서부터 3개의 칸에 꽂는',true);
 assert(vertical.includes('scale(1.45)'),'학생 화면의 세로 칸 확대 필요');
 for(const label of ['자','차']){const scene=ctx.GED_COUNT_SCENES_V5[36],icon=ctx.gedCountIcon(scene,label,scene.items.indexOf(label));assert(!icon.includes('<image'),'글자 카드에는 사물 그림이 아닌 글자를 표시해야 합니다');assert(icon.includes(label),'글자 카드의 글자가 필요합니다');}
 const month=ctx.GED_COUNT_SCENES_V5[34];assert.deepEqual(Array.from(month.items),Array.from({length:10},(_,i)=>`${i+1}월`));
 for(const [index,label,file] of [[2,'수국','v5_hydrangea.jpg'],[2,'수선화','v5_daffodil.jpg'],[5,'태권도','v5_taekwondo.jpg'],[5,'수영','v5_swimming.jpg'],[8,'멸치볶음','v5_anchovy.jpg'],[8,'오이무침','v5_cucumber_salad.jpg'],[8,'감자조림','v5_braised_potato.jpg'],[15,'배추','v5_cabbage_young.jpg'],[15,'무','v5_radish_young.jpg'],[15,'당근','v5_carrot_young.jpg']]){
  const scene=ctx.GED_COUNT_SCENES_V5[index],icon=ctx.gedCountIcon(scene,label,scene.items.indexOf(label));assert(icon.includes(file),`${label} 상세 삽화 연결`);if(index===15)assert(icon.includes('<circle cx="41" cy="9"'),'모종 식별 표지');
 }
 for(const [index,label,file] of [[2,'카네이션','v5_carnation.jpg'],[31,'아령','v5_dumbbell.jpg'],[31,'운동 밴드','v5_exercise_band.jpg'],[33,'급식 봉사','v5_meal_service.jpg'],[33,'헌혈','v5_blood_donation.jpg'],[33,'환경 교육','v5_environment_education.jpg'],[49,'전자레인지','v5_microwave.jpg'],[49,'청소기','v5_vacuum.jpg'],[49,'에어컨','v5_air_conditioner.jpg'],[51,'손전등','v5_flashlight.jpg']])for(const scenes of [ctx.GED_COUNT_SCENES_V5,ctx.GED_CHOICE_SCENES_V5]){
  const scene=scenes[index],icon=ctx.gedCountIcon(scene,label,scene.items.indexOf(label));assert(icon.includes(file),`${scene.name}: ${label} 상세 삽화 연결`);assert(icon.includes('height="52"'),`${label}: 그림과 이름 간 여백`);
 }
 for(const [index,label,file] of [[9,'딱지치기','v5_ddakji.jpg'],[9,'실뜨기','v5_cat_cradle.jpg'],[41,'개구리','v5_frog.jpg'],[42,'해파리','v5_jellyfish.jpg'],[42,'새우','v5_shrimp.jpg'],[42,'해마','v5_seahorse.jpg'],[45,'딱정벌레','v5_beetle.jpg'],[45,'사마귀','v5_mantis.jpg'],[45,'매미','v5_cicada.jpg']])for(const scenes of [ctx.GED_COUNT_SCENES_V5,ctx.GED_CHOICE_SCENES_V5]){
  const scene=scenes[index];assert(ctx.gedCountIcon(scene,label,scene.items.indexOf(label)).includes(file),`${scene.name}: ${label} 상세 삽화 연결`);
 }
 assert.equal(Object.keys(ctx.GED_COUNT_RICH_ASSETS).length,61,'남은 실생활 소재 61종 상세 원화');
 for(const [label,file] of Object.entries(ctx.GED_COUNT_RICH_ASSETS)){
  assert(fs.existsSync(`assets/count-illustrations/${file}.jpg`),`${label}: 상세 원화 파일`);
  for(const scenes of [ctx.GED_COUNT_SCENES_V5,ctx.GED_CHOICE_SCENES_V5]){
   const uses=scenes.filter(scene=>scene.items.includes(label));assert(uses.length,`${label}: 해당 소재가 없음`);
   for(const scene of uses)assert(ctx.gedCountIcon(scene,label,scene.items.indexOf(label)).includes(`${file}.jpg`),`${scene.name}: ${label} 연결`);
  }
 }
 console.log('All 61 remaining detailed illustrations and scene mappings: PASS');
 const captionFigure=ctx.gedCountFigure(ctx.GED_COUNT_SCENES_V5[33],4,2,false,null,true);assert(captionFigure.includes('<text x="37" y="73"'),'v5 그림 이름이 그림 아래 표시되어야 합니다');
 const teacher=fs.readFileSync('js/teacher/gedWorksheet.js','utf8');assert(teacher.includes("k==='seed'&&Number(v)>60&&params.v<5"),'이전 학습지에서 새 상황 선택 시 v5로 전환');
 console.log('Varied order boards, larger vertical slots and correct letter/month cards: PASS');
 assert.deepEqual(problems,[],`상황/그림 문제:\n${problems.join('\n')}`);console.log('Unique illustrations and all referenced files: PASS');
}
main().catch(e=>{console.error(e);process.exitCode=1});
