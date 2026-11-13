const fs=require('fs'),vm=require('vm');let c={};vm.createContext(c);for(let p of ['js/worksheet/gedCore.js','js/worksheet/gedUnits.js'])vm.runInContext(fs.readFileSync(p,'utf8'),c);let errors=[];for(let sid=0;sid<60;sid++)for(const arr of [c.GED_COUNT_SCENES_V3,c.GED_CHOICE_SCENES_V3]){let scene=arr[sid];for(let n=3;n<=6;n++){let svg=c.gedCountFigure(scene,n,2,false);let images=[...svg.matchAll(/<image href="([^"]+)"/g)];for(let m of images)if(!fs.existsSync(m[1].split('?')[0]))errors.push('missing file '+m[1]);let target=(svg.match(/<g transform="translate\(\d+,5\)">/g)||[]).length;if(target!==n)errors.push('count '+scene.name+' '+n+' '+target);}}console.log('480 scenario/count layouts, image references and exact cells:',errors.length?'FAIL '+errors.join('; '):'PASS');if(errors.length)process.exit(1);
const boat=c.gedCountIcon(c.GED_COUNT_SCENES_V3[40],'배',5);
const pear=c.gedCountIcon(c.GED_COUNT_SCENES_V3[6],'배',1);
if(!boat.includes('/boat.jpg')||!pear.includes('/pear.jpg')) throw Error('The boat and pear images must match their contexts');
console.log('Ambiguous boat/pear context: PASS');
const flag=c.gedCountIcon(c.GED_COUNT_SCENES_V3[4],'해',2);
if(flag.includes('<image ')||!flag.includes('M7 44 V6 H43'))throw Error('Flag emblems must stay on their flags');
const pot=c.gedCountIcon(c.GED_COUNT_SCENES_V3[28],'장미',0);
if(!pot.includes('/rose_pot.jpg'))throw Error('A potted plant must use a potted image');
console.log('Flag and flowerpot contexts: PASS');
for(const scene of c.GED_COUNT_SCENES_V3){const images=scene.items.map((label,i)=>(c.gedCountIcon(scene,label,i).match(/<image href="([^"]+)/)||[])[1]).filter(Boolean);if(new Set(images).size!==images.length)throw Error('Repeated illustration in '+scene.name)}
console.log('Distinct mapped illustrations within each scenario: PASS');

