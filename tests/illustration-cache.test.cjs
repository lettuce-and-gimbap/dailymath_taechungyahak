const fs=require('fs'),vm=require('vm'),assert=require('assert');
const handlers={},memory=new Map();let calls=0;
const cache={match:async r=>memory.get(r.url),put:async(r,v)=>memory.set(r.url,v)};
const ctx={URL,location:{origin:'https://example.test'},self:{addEventListener:(type,fn)=>handlers[type]=fn},caches:{open:async()=>cache},fetch:async()=>{calls++;return {ok:true,clone(){return this}}},setTimeout,clearTimeout,Response};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('sw.js','utf8'),ctx);
async function request(path){let result;handlers.fetch({request:{method:'GET',url:'https://example.test'+path},respondWith:p=>{result=p}});return await result}
(async()=>{await request('/assets/count-illustrations/rose.jpg?v=1');await request('/assets/count-illustrations/rose.jpg?v=1');assert.equal(calls,1);await request('/assets/count-illustrations/rose.jpg?v=2');assert.equal(calls,2);console.log('Illustration cache reuse and version refresh: PASS')})().catch(e=>{console.error(e);process.exit(1)});
