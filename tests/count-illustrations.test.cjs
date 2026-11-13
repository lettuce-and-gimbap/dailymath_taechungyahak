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
for(const [sceneIndex,expected] of [[15,'채소 모종'],[18,'잡곡']]){const s=c.GED_COUNT_SCENES_V3[sceneIndex];if(s.name!==expected)throw Error('Unexpected scene');for(let i=0;i<6;i++){const icon=c.gedCountIcon(s,s.items[i],i);if(!icon.includes('<circle cx="41" cy="9" r="9"'))throw Error(`Missing identification badge: ${s.name} ${s.items[i]}`)}}
const weekday=c.gedCountIcon(c.GED_COUNT_SCENES_V3[34],'월요일',0);if(!weekday.includes('font-size="9"'))throw Error('Weekday text must fit its card');
console.log('Seedling and grain visual badges; weekday card text: PASS');
const seenPaths=new Set();
for(const scenes of [c.GED_COUNT_SCENES_V4,c.GED_CHOICE_SCENES_V4])for(const scene of scenes)for(let i=0;i<scene.items.length;i++){
 const icon=c.gedCountIcon(scene,scene.items[i],i);
 for(const match of icon.matchAll(/<image href="([^"?]+)/g)){
  const p=match[1];if(seenPaths.has(p))continue;seenPaths.add(p);
  const bytes=fs.readFileSync(p);if(bytes.length<1000||bytes[0]!==0xff||bytes[1]!==0xd8||bytes[bytes.length-2]!==0xff||bytes[bytes.length-1]!==0xd9)throw Error('Invalid JPEG: '+p);
 }
}
for(const [index,label,file] of [[50,'지구','earth_detail.jpg'],[40,'택시','taxi_detail.jpg'],[14,'농업','farmer_detail.jpg'],[48,'식탁','dining_table_detail.jpg'],[25,'형광펜','highlighter_detail.jpg'],[18,'깨','sesame_detail.jpg'],[43,'안개','fog_detail.jpg'],[53,'발레화','ballet_shoes_detail.jpg'],[32,'책 교환','book_exchange_detail.jpg'],[30,'인형극','puppet_theater_detail.jpg']]){
 const scene=c.GED_COUNT_SCENES_V4[index];const icon=c.gedCountIcon(scene,label,scene.items.indexOf(label));if(!icon.includes(file))throw Error(`Wrong illustration: ${label}`);
}
console.log(`All ${seenPaths.size} referenced JPEG files and repaired illustrations: PASS`);

