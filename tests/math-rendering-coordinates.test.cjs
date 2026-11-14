const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const os=require('os'),https=require('https');
process.chdir(path.resolve(__dirname,'..'));
const babelPath=process.env.BABEL_STANDALONE_PATH||path.join(os.tmpdir(),'taechung-babel-standalone-7.23.10.js');
const katexPath=process.env.KATEX_STANDALONE_PATH||path.join(os.tmpdir(),'taechung-katex-0.16.9.js');
function download(url,remaining=5){return new Promise((resolve,reject)=>https.get(url,res=>{if(res.statusCode>=300&&res.statusCode<400&&res.headers.location&&remaining){res.resume();return resolve(download(new URL(res.headers.location,url).href,remaining-1));}if(res.statusCode!==200){res.resume();return reject(new Error('Download: HTTP '+res.statusCode));}const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>resolve(Buffer.concat(chunks)));}).on('error',reject));}
async function main(){
if(!fs.existsSync(babelPath))fs.writeFileSync(babelPath,await download('https://unpkg.com/@babel/standalone@7.23.10/babel.min.js'));
if(!fs.existsSync(katexPath))fs.writeFileSync(katexPath,await download('https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js'));
const B=require(babelPath),katex=require(katexPath);
const c={window:{katex},useRef:v=>({current:v}),useCallback:f=>f,useState:v=>[v,()=>{}],console};vm.createContext(c);
for(const file of ['js/core/utils.js','js/math/examTex.js','js/math/primitives.js']) vm.runInContext(B.transform(fs.readFileSync(file,'utf8'),{presets:['react']}).code,c,{filename:file});
for(const [input,expected] of [['x^2','$x^{2}$'],['x^-2','$x^{-2}$'],['x^10','$x^{10}$'],['x^{n+1}','$x^{n+1}$'],['√(x²+1)','$\\sqrt{x^{2}+1}$'],['√2/2','$\\dfrac{\\sqrt{2}}{2}$']]){
 const result=c.toExamTex(input); assert.equal(result,expected,input); assert(!katex.renderToString(result.slice(1,-1),{throwOnError:false}).includes('katex-error'),input);
}
assert(c.autoMathHtml('값 x^2').includes('katex'));assert(c.autoMathHtml('값 x^-2').includes('katex'));
const svg={getBoundingClientRect:()=>({left:50,top:100,width:260,height:260})};const size={W:520,H:520,SC:40};
assert.deepEqual(Array.from(c.graphSnapClient(svg,180,230,size)),[0,0]);assert.deepEqual(Array.from(c.graphSnapClient(svg,200,210,size)),[1,1]);
assert.deepEqual(Array.from(c.graphSnapClient(svg,180,230,{...size,panX:2,panY:-3})),[2,-3]);assert.deepEqual(Array.from(c.graphSnapClient(svg,10000,-10000,size)),[12,12]);
let points=[];const d=c.useDrag({current:svg},size,p=>points.push(Array.from(p)));d.dn({clientX:180,clientY:230});d.mv({clientX:181,clientY:229});d.mv({touches:[{clientX:200,clientY:210}]});d.up();d.mv({clientX:220,clientY:210});assert.deepEqual(points,[[0,0],[1,1]]);
let z=[];const pinch=c.usePinch({current:svg},{...size,zoom:1,onZoom:(...a)=>z.push(a)});const touch=(x,y)=>({clientX:x,clientY:y});assert(pinch.pinchStart([touch(160,230),touch(200,230)]));pinch.pinchMove([touch(100,230),touch(260,230)]);assert.equal(z[0][0],3);pinch.pinchEnd();
console.log('Math rendering and coordinate interaction checks passed');

}
main().catch(e=>{console.error(e);process.exitCode=1});
