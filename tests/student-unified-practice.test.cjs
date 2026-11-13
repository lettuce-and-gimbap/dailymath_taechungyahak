const fs=require('fs'),vm=require('vm'),assert=require('assert');
const os=require('os'),path=require('path'),https=require('https');
const babelPath=process.env.BABEL_STANDALONE_PATH||path.join(os.tmpdir(),'taechung-babel-standalone-7.23.10.js');
process.chdir(path.resolve(__dirname,'..'));
function download(url,remaining=5){return new Promise((resolve,reject)=>https.get(url,res=>{if(res.statusCode>=300&&res.statusCode<400&&res.headers.location&&remaining){res.resume();return resolve(download(new URL(res.headers.location,url).href,remaining-1));}if(res.statusCode!==200){res.resume();return reject(new Error('Babel download: HTTP '+res.statusCode));}const parts=[];res.on('data',chunk=>parts.push(chunk));res.on('end',()=>resolve(Buffer.concat(parts)));}).on('error',reject));}
async function main(){
if(!fs.existsSync(babelPath)){console.log('Downloading pinned Babel standalone 7.23.10 for JSX tests...');fs.writeFileSync(babelPath,await download('https://unpkg.com/@babel/standalone@7.23.10/babel.min.js'));}
const Babel=require(babelPath);
for(const p of ['js/student/practice.js','js/student/coordDaily.js','js/student/dashboard.js'])Babel.transform(fs.readFileSync(p,'utf8'),{presets:['react']});
console.log('Student JSX compilation: PASS');
const ctx={React:{createElement:(type,props,...children)=>({type,props:props||{},children:children.flat()})},COORD_LEVELS:[{k:'low',badge:'기초',lbl:'좌표',desc:'좌표'},{k:'count3',badge:'응용 7',lbl:'경우의 수',desc:'순열과 조합'}],coordLevelLocked:()=>false};
vm.createContext(ctx);vm.runInContext(Babel.transform(fs.readFileSync('js/student/practice.js','utf8'),{presets:['react']}).code,ctx);
const walk=(x,out=[])=>{if(x&&typeof x==='object'){out.push(x);for(const c of x.children||[])walk(c,out)}return out};
function render(section){return walk(ctx.UnifiedPracticeMenu({userData:{name:'박소명_학생'},section,setSection(){},onArithmetic(){},onCoordinate(){}}))}
let all=render('arithmetic'),labels=all.filter(x=>x.type==='button').map(x=>JSON.stringify(x.children));
for(const expected of ['기본 나눗셈','심화 나눗셈','혼합 나눗셈','약수 구하기','약수 (하드모드)','중졸 검정고시','고졸 검정고시'])assert(labels.some(x=>x.includes(expected)),expected);
assert(!labels.some(x=>x.includes('나눗셈 범위')));
assert(render('coordinate').some(x=>x.type==='button'&&JSON.stringify(x.children).includes('좌표')));
assert(render('count').some(x=>x.type==='button'&&JSON.stringify(x.children).includes('순열과 조합')));
console.log('Unified menu: seven existing options, coordinate and counting sections: PASS');
const dash=fs.readFileSync('js/student/dashboard.js','utf8');assert(dash.includes('const unifiedPractice=true;'));assert(!dash.includes("userData.name==='박소명_학생'"));assert(dash.includes("!unifiedPractice||t.k!=='coord'"));
console.log('Unified routing for all students: PASS');
const menuProps={setVer(){},setVerTopic(){},rangeMin:10,setRangeMin(){},rangeMax:99,setRangeMax(){},divMin:10,setDivMin(){},divMax:99,setDivMax(){},goal:3,setGoal(){},todayLessons:0,onSave(){},onStart(){},selectedOnly:true,onBack(){}};
const settings=walk(ctx.PracticeMenu({...menuProps,ver:0}));assert(settings.filter(x=>x.type==='input').length===4);assert(settings.some(x=>x.type==='button'&&JSON.stringify(x.children).includes('다시 고르기')));
const exam=walk(ctx.PracticeMenu({...menuProps,ver:5}));assert(exam.filter(x=>x.type==='input').length===0);
console.log('Range settings appear after selecting an arithmetic option: PASS');

assert(dash.includes("lbl:unifiedPractice?'문제풀이':'문제풀기'"));
const coord=fs.readFileSync('js/student/coordDaily.js','utf8');
assert(coord.includes('if(initialLevel){'));
assert(coord.includes('onClick={exitPick}'));
assert(coord.includes("!(q.lv==='count'||q.lv==='count2'||q.lv==='count3'||q.lv==='count4')&&<span"));
assert(coord.includes("isCount?'student-count-figure overflow-x-auto'"));
assert(coord.includes('.student-count-figure .count-figure{display:block;max-width:none!important;height:auto}'));
for(const n of [3,4,5,6])assert(coord.includes(`.student-count-figure .count-figure[data-count="${n}"]{width:${n*110}px}`));
const units=fs.readFileSync('js/worksheet/gedUnits.js','utf8');assert(units.includes('class="count-figure" data-count="${n}"'));
console.log('Unified tab label and locked-level return: PASS');
console.log('Larger counting diagrams retain horizontal scrolling for 3–6 items: PASS');
}
main().catch(err=>{console.error(err);process.exitCode=1;});
