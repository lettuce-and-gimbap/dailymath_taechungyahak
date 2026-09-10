// === js/core/db.js ===
/* --------------------------------------------------------------------
   Firestore 접근
   사용자 불러오기/저장 · 학습 기록 저장
   -------------------------------------------------------------------- */

var db=window._db;

var saveUser=async(data)=>{try{await db.collection('users').doc(data.name).set(data,{merge:true})}catch(e){console.error(e)}};

var loadUser=async(name)=>{try{const d=await db.collection('users').doc(name).get();return d.exists?d.data():null}catch(e){return null}};

var saveLog=async(log)=>{try{await db.collection('math_logs').add(log)}catch(e){console.error(e)}};
