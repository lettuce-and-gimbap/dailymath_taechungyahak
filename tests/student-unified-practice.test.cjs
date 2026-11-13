const fs=require('fs'),vm=require('vm'),assert=require('assert');
const os=require('os'),path=require('path'),https=require('https');
const babelPath=process.env.BABEL_STANDALONE_PATH||path.join(os.tmpdir(),'taechung-babel-standalone-7.23.10.js');
process.chdir(path.resolve(__dirname,'..'));
function download(url,remaining=5){return new Promise((resolve,reject)=>https.get(url,res=>{if(res.statusCode>=300&&res.statusCode<400&&res.headers.location&&remaining){res.resume();return resolve(download(new URL(res.headers.location,url).href,remaining-1));}if(res.statusCode!==200){res.resume();return reject(new Error('Babel download: HTTP '+res.statusCode));}const parts=[];res.on('data',chunk=>parts.push(chunk));res.on('end',()=>resolve(Buffer.concat(parts)));}).on('error',reject));}
async function main(){
if(!fs.existsSync(babelPath)){console.log('Downloading pinned Babel standalone 7.23.10 for JSX tests...');fs.writeFileSync(babelPath,await download('https://unpkg.com/@babel/standalone@7.23.10/babel.min.js'));}
const Babel=require(babelPath);
for(const p of ['js/student/practice.js','js/student/coordDaily.js','js/student/dashboard.js','js/student/home.js','js/student/mockExam.js','js/student/homework.js'])Babel.transform(fs.readFileSync(p,'utf8'),{presets:['react']});
console.log('Student JSX compilation: PASS');
const ctx={React:{createElement:(type,props,...children)=>({type,props:props||{},children:children.flat()})},PREVIEW_USERS:['박소명_학생','테스트'],COORD_LEVELS:[{k:'low',badge:'기초',lbl:'좌표',desc:'좌표'},{k:'count3',badge:'응용 7',lbl:'경우의 수',desc:'순열과 조합'}],coordLevelLocked:()=>false};
vm.createContext(ctx);vm.runInContext(Babel.transform(fs.readFileSync('js/student/practice.js','utf8'),{presets:['react']}).code,ctx);
ctx.genDivBasic=()=>({a:24,b:3,ansC:8,ansR:0,hasR:false});ctx.genDivRemainder=()=>({a:17,b:5,ansC:3,ansR:2,hasR:true});
assert(ctx.makeQ(0,1,[],1,99,1,99).isMC&&ctx.makeQ(1,1,[],1,99,1,99).isMC,'division questions use multiple choice');
const walk=(x,out=[])=>{if(x&&typeof x==='object'){out.push(x);for(const c of x.children||[])walk(c,out)}return out};
function render(section,name='박소명_학생'){return walk(ctx.UnifiedPracticeMenu({userData:{name},section,setSection(){},onArithmetic(){},onCoordinate(){},onSetTopic(){}}))}
let all=render('arithmetic'),labels=all.filter(x=>x.type==='button').map(x=>JSON.stringify(x.children));
for(const expected of ['기본 나눗셈','심화 나눗셈','혼합 나눗셈','약수 구하기'])assert(labels.some(x=>x.includes(expected)),expected);
assert(!labels.some(x=>x.includes('하드모드')),'hard divisor mode removed');
assert(!labels.some(x=>x.includes('검정고시 연습')),'GED practice should not appear under arithmetic');
assert(!labels.some(x=>x.includes('나눗셈 범위')));
assert(render('coordinate').some(x=>x.type==='button'&&JSON.stringify(x.children).includes('좌표')));
assert(render('count').some(x=>x.type==='button'&&JSON.stringify(x.children).includes('순열과 조합')));
console.log('Unified menu: four arithmetic options, coordinate and counting sections: PASS');
const practiceSource=fs.readFileSync('js/student/practice.js','utf8');
assert(practiceSource.includes('(PREVIEW_USERS||[]).includes(userData.name)?[\'집합\',\'명제\'].map')&&practiceSource.includes('onSetTopic&&onSetTopic(topic)'),'preview accounts can launch separate set and proposition practice');
assert(practiceSource.includes('const isMC=true;'),'every arithmetic question is four-choice multiple choice');
assert(practiceSource.includes('곧 공개할 예정이에요'),'other students see the locked work-in-progress notice');
assert(practiceSource.includes("title:'집합과 명제'")&&practiceSource.includes("['집합','명제'].map"));
const home=fs.readFileSync('js/student/home.js','utf8');assert(home.includes('setShowMathForest')&&home.includes('aria-expanded={showMathForest}')&&!home.includes('정답 비율은 저장된 전체 풀이 기준'));
const mock=fs.readFileSync('js/student/mockExam.js','utf8');assert(mock.includes('중졸 모의고사')&&mock.includes('bg-white rounded-3xl text-left shadow-sm border-2'));
assert(mock.includes('grid grid-cols-2 gap-2 mb-3')&&mock.includes('aria-pressed={selectedDomains.includes(d)}'),'exam domain selection uses consistent accessible selection cards');
assert(practiceSource.includes("if(unified&&screen==='focused-set')return<FocusedSetPractice")&&practiceSource.includes('genPracticeSetQuestion()')&&practiceSource.includes('genPracticePropositionQuestion()'),'focused set and proposition practice stays in the problem-solving tab');
assert(practiceSource.includes("if(phase==='reflection')return")&&practiceSource.includes('FeelingPicker title={`${topic} 연습 완료')&&practiceSource.includes("setPhase('reflection')"),'set and proposition sessions finish with the student difficulty/feeling check');
const homework=fs.readFileSync('js/student/homework.js','utf8');assert(homework.includes("if(phase==='reflection')return <FeelingPicker")&&homework.includes('patchLogFeeling'),'homework sessions also ask and save the difficulty/feeling check');
assert(fs.readFileSync('js/student/coordDaily.js','utf8').includes('모든 학생 풀이 세션의 공통 마무리 화면'));
assert(mock.includes('얼마나 어려웠나요?'),'mock exams also ask how difficult the session felt');
const dash=fs.readFileSync('js/student/dashboard.js','utf8');assert(dash.includes('const unifiedPractice=true;'));assert(!dash.includes("userData.name==='박소명_학생'"));assert(dash.includes("!unifiedPractice||t.k!=='coord'"));
assert(!dash.includes('initialSetTopic')&&!dash.includes('onSetTopic={topic=>'),'set and proposition practice does not route to the mock exam tab');
console.log('Unified routing for all students: PASS');
const menuProps={setVer(){},setVerTopic(){},rangeSettings:{0:{min:10,max:99},1:{min:11,max:88},2:{min:12,max:77},3:{min:13,max:66}},setRangeSettings(){},goal:3,setGoal(){},todayLessons:0,onSave(){},onStart(){},selectedOnly:true,onBack(){}};
const settings=walk(ctx.PracticeMenu({...menuProps,ver:0}));assert(settings.filter(x=>x.type==='input').length===2);assert(settings.some(x=>x.type==='button'&&JSON.stringify(x.children).includes('다시 고르기')));
const divisorSettings=walk(ctx.PracticeMenu({...menuProps,ver:3}));assert(divisorSettings.filter(x=>x.type==='input').length===2);assert(!divisorSettings.some(x=>JSON.stringify(x.children).includes('나눗셈 범위')));
assert(settings.filter(x=>x.type==='input').every(x=>x.props.value===10||x.props.value===99));assert(divisorSettings.filter(x=>x.type==='input').some(x=>x.props.value===13));
console.log('Per-type division and divisor ranges: PASS');

assert(dash.includes("lbl:unifiedPractice?'문제풀이':'문제풀기'"));
const coord=fs.readFileSync('js/student/coordDaily.js','utf8');
assert(coord.includes("lbl:'원의 방정식'"));
assert(!coord.includes('중심의 좌표와 반지름의 길이가 그림에 적혀 있습니다.'));
assert(coord.includes("{k:'ineq'")&&coord.slice(coord.indexOf("{k:'ineq'"),coord.indexOf("{k:'ineq'")+260).includes('locked:true'));
assert(coord.includes('L.locked&&!(PREVIEW_USERS||[]).includes(name)'),'preview user can enter locked inequality practice');
const constantsCtx={React:{}};vm.createContext(constantsCtx);vm.runInContext(fs.readFileSync('js/core/constants.js','utf8'),constantsCtx);
assert.strictEqual(constantsCtx.quickSwitchTarget('박소명'),'박소명_학생');assert.strictEqual(constantsCtx.quickSwitchTarget('박소명_학생'),'테스트');assert.strictEqual(constantsCtx.quickSwitchTarget('테스트'),'박소명');
assert(constantsCtx.PREVIEW_USERS.includes('테스트'),'test account can preview student-only work');
assert.strictEqual(render('sets','테스트').filter(x=>x.type==='button'&&JSON.stringify(x).includes('10문제 연습')).length,2,'test account sees unlocked set and proposition practice');
assert(coord.includes("phase==='circle-grid'")&&coord.includes("start('circ',false)")&&coord.includes('grid:gridMode,ticks:gridMode'));
assert(coord.includes('if(initialLevel){'));
assert(coord.includes('onClick={exitPick}'));
assert(coord.includes("!(q.lv==='count'||q.lv==='count2'||q.lv==='count3'||q.lv==='count4'||q.lv==='count5')&&<span"));
assert(coord.includes("isCount?'student-count-figure'"));
assert(coord.includes('.student-count-figure .count-figure{display:block;width:100%;max-width:100%;height:auto}'));
const units=fs.readFileSync('js/worksheet/gedUnits.js','utf8');assert(units.includes('class="count-figure" data-count="${n}"'));
console.log('Unified tab label and locked-level return: PASS');
console.log('Counting diagrams fit the student screen without horizontal scrolling: PASS');
}
main().catch(err=>{console.error(err);process.exitCode=1;});
