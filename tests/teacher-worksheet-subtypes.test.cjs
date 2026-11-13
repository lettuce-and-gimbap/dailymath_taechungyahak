const fs=require('fs');
const vm=require('vm');
const path=require('path');
process.chdir(path.resolve(__dirname,'..'));

const ctx={console,Math};
vm.createContext(ctx);
for(const file of [
  'js/core/utils.js',
  'js/core/examSource.js',
  'js/math/examTex.js',
  'js/generators/shared.js',
  'js/generators/middle.js',
  'js/generators/high/explore.js',
  'js/generators/high/polynomial.js',
  'js/generators/high/equation.js',
  'js/generators/high/geometry.js',
  'js/generators/high/setFunction.js',
  'js/generators/high/probStat.js'
  ,'js/ui/examFig.js'
  ,'js/ui/examFigShapes.js'
]) vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});

const worksheet=fs.readFileSync('js/teacher/worksheet.js','utf8');
const start=worksheet.indexOf('var MOCK_SUBTYPES_MIDDLE=');
const end=worksheet.indexOf('\nfunction WorksheetTab()',start);
if(start<0||end<0)throw new Error('worksheet subtype registry not found');
vm.runInContext(worksheet.slice(start,end),ctx,{filename:'worksheet-subtype-registry'});
const mockExam=fs.readFileSync('js/student/mockExam.js','utf8');
const numberStart=mockExam.indexOf('function assignMockQuestionNumbers(');
const numberEnd=mockExam.indexOf('\nfunction MockQBody(',numberStart);
vm.runInContext(mockExam.slice(numberStart,numberEnd),ctx,{filename:'mock-exam-numbering'});

for(const [level,groups] of [['중졸',ctx.MOCK_SUBTYPES_MIDDLE],['고졸',ctx.MOCK_SUBTYPES_HIGH]]){
  let count=0;
  for(const [domain,items] of Object.entries(groups)){
    for(const [label,gen] of items){
      const q=gen();
      if(!q||!q.q||!Array.isArray(q.choices)||q.choices.length!==4||!Number.isInteger(q.answer))
        throw new Error(`${level} ${domain}/${label} failed to generate a four-choice question`);
      count++;
    }
  }
  console.log(`${level}: ${count} selectable subtypes generated valid questions`);
}
for(const [label,gen] of [['집합',ctx.genMockSetOnly],['명제',ctx.genMockPropositionOnly]]){
  for(let i=0;i<30;i++){
    const q=gen();
    if(!q||!q.q||!Array.isArray(q.choices)||q.choices.length!==4||!Number.isInteger(q.answer))
      throw new Error(`${label} focused practice generated an invalid question`);
    const topic=String(q.topic||'');
    const matches=label==='집합'?topic.includes('집합')||topic==='진리집합':['명제의 역','명제의 대우','충분조건','필요조건','필요충분조건'].includes(topic);
    if(!matches)throw new Error(`${label} focused practice leaked another question type: ${topic}`);
  }
  console.log(`${label}: focused practice generated 30 valid questions`);
}

if(!worksheet.includes('if(!homeworkAll&&!homeworkTargets.length)'))
  throw new Error('unselected homework recipient must be blocked');
if(!worksheet.includes('assignedTo:homeworkAll?null:homeworkTargets'))
  throw new Error('only explicit 전체 selection may assign to all students');
if(!worksheet.includes('이 목록 {homeworkFolderStudents.every'))
  throw new Error('folder-wide select control is missing');
if(!worksheet.includes("homeworkFolder==='__all_students__'"))
  throw new Error('folder based student filtering is missing');
for(const subtype of [0,1,2,3,4,5]){
  const q=ctx.genMockProbStat(subtype);
  const svg=ctx.examFigSVG(q);
  if(!q.graph||!svg||!svg.includes('<svg'))throw new Error(`high school counting subtype ${subtype} is missing its figure`);
}
for(let i=0;i<100;i++){
  const q=ctx.genMidCounting();
  if(!q.graph||!ctx.examFigSVG(q))throw new Error('middle school counting story is missing its figure');
}
const highDomains=[['다항식 계산',4],['방정식과 부등식',5],['도형과 기하',5],['집합과 함수',4],['확률과 통계',2]];
const highQs=highDomains.flatMap(([domain,n])=>Array.from({length:n},()=>({_mockDomain:domain})));
const highSorted=ctx.assignMockQuestionNumbers(highQs,'high','random');
const highNumbered=highSorted.map(q=>q.examNo);
if(JSON.stringify(highNumbered)!==JSON.stringify(Array.from({length:20},(_,i)=>i+1)))
  throw new Error('high school full mock must follow actual 1-20 domain positions');
for(const slot of ["'다항식 계산':[1,2,3,4]","'방정식과 부등식':[5,6,7,8,9]","'도형과 기하':[10,11,12,13,14]","'집합과 함수':[15,16,17,18]","'확률과 통계':[19,20]"])
  if(!mockExam.includes(slot))throw new Error(`high school actual exam slot is missing: ${slot}`);
const middleTopics=[['수와 연산','소인수분해'],['문자와 식','식의 값'],['함수','그래프 해석'],['기하','이등변삼각형'],['확률과 통계','도수분포표']];
const middleQs=Array.from({length:20},(_,i)=>{const[domain,topic]=middleTopics[i%middleTopics.length];return{_mockDomain:domain,topic,meta:{level:'middle'}};});
const middleNumbers=ctx.assignMockQuestionNumbers(middleQs,'middle','random').map(q=>q.examNo);
if(new Set(middleNumbers).size!==20||middleNumbers.some(n=>n<1||n>20))
  throw new Error('middle school full mock must have unique realistic question numbers');
if(!mockExam.includes('q.examNo||i+1')||!mockExam.includes('getExamQuestionNumbers(q)'))
  throw new Error('student mock exam should use historical question positions');
if(!worksheet.includes('const split=cols===2?Math.ceil(examSheet.questions.length/2)')||!worksheet.includes('indexedQuestions.slice(0,split),indexedQuestions.slice(split)'))
  throw new Error('two-column GED print should fill the left column top-to-bottom before the right column');
console.log('Homework recipient and folder selection checks: PASS');
