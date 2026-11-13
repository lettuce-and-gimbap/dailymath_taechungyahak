const fs=require('fs'),vm=require('vm');
const c={};vm.createContext(c);
for(const p of ['js/worksheet/gedCore.js','js/worksheet/gedUnits.js'])vm.runInContext(fs.readFileSync(p,'utf8'),c);
for(const s of c.GED_COUNT_SCENES_V3){const remaining=s.items.filter((label,i)=>!c.gedCountIcon(s,label,i).includes('<image '));if(remaining.length)console.log(`${s.name}: ${remaining.join(', ')}`)}
