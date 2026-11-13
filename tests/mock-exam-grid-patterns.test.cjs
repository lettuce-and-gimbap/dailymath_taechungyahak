const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
const path=require('path');
process.chdir(path.resolve(__dirname,'..'));

const ctx={console};
vm.createContext(ctx);
for(const file of [
  'js/core/utils.js',
  'js/generators/shared.js',
  'js/generators/high/geometry.js',
  'js/ui/examFig.js',
  'js/ui/examFigShapes.js'
]) vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});

const json=value=>JSON.stringify(value);
assert.strictEqual(json(ctx.mockExamDomainCounts('middle',['수와 연산','문자와 식','함수','기하','확률과 통계'],20)),json({'수와 연산':5,'문자와 식':4,'함수':3,'기하':5,'확률과 통계':3}));
assert.strictEqual(json(ctx.mockExamDomainCounts('high',['다항식 계산','방정식과 부등식','도형과 기하','집합과 함수','확률과 통계'],20)),json({'다항식 계산':4,'방정식과 부등식':5,'도형과 기하':5,'집합과 함수':4,'확률과 통계':2}));
assert.strictEqual(Object.values(ctx.mockExamDomainCounts('high',['내분점'],10))[0],10);

const hasGrid=svg=>svg.includes('stroke="#c9ced8"');
const highCircle=ctx.examFigSVG({graph:{type:'circle',h:1,k:2,r:3,show:'center'}});
const highCircleTangent=ctx.examFigSVG({graph:{type:'circle_line',r:2,lineType:'v',lineVal:2}});
const middlePoint=ctx.examFigSVG({graph:{type:'grid_pts',pts:[[2,3,'A']]}});
const middleSegment=ctx.examFigSVG({graph:{type:'section_2d',ax:-2,ay:1,bx:1,by:4}});
assert(highCircle&&!hasGrid(highCircle),'high school circle equation must not show a unit grid');
assert(highCircleTangent&&!hasGrid(highCircleTangent),'high school circle tangent must not show a unit grid');
assert(middlePoint&&hasGrid(middlePoint),'middle school coordinate reading must show its unit grid');
assert(middleSegment&&hasGrid(middleSegment),'middle school coordinate-plane division must show its unit grid');

const orientations=new Set();
for(let i=0;i<200;i++){
  const q=ctx.gen_circle_line_rel();
  orientations.add(q.graph.lineType);
  assert(q.q.includes(`직선 ${q.graph.lineType==='v'?'x':'y'}=a`),'prompt and tangent orientation must match');
  assert(!hasGrid(ctx.examFigSVG({graph:q.graph})),'generated circle tangent must remain grid-free');
}
assert(orientations.has('h')&&orientations.has('v'),'circle tangent bank should vary between x=a and y=a');

const student=fs.readFileSync('js/student/mockExam.js','utf8');
const teacher=fs.readFileSync('js/teacher/worksheet.js','utf8');
assert(student.includes("examMode==='random'?20:10"),'student full/weak counts');
assert(teacher.includes("examMode==='weak'?10:20"),'teacher full/weak counts');
assert(teacher.includes('문제지 PDF 저장 / 인쇄')&&teacher.includes('답지 포함 PDF / 인쇄'),'teacher PDF and answer print actions');

console.log('Mock exam blueprint and coordinate-grid regression checks: PASS');
