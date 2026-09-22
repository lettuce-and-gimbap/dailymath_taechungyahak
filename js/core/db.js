// === js/core/db.js ===
/* --------------------------------------------------------------------
   Firestore 접근
   사용자 불러오기/저장 · 학습 기록 저장 · 학생 이름 바꾸기
   -------------------------------------------------------------------- */

var db=window._db;



/* 이름이 바뀐 계정 따라가기
   users 문서의 id 가 곧 이름이라, 이름을 바꾸면 옛 이름 문서 자리에
   { renamedTo:'새 이름' } 만 남는다. 옛 이름으로 들어와도 이 표지판을 따라가
   새 계정을 찾아 주기 때문에, 이름이 바뀌어도 다시 로그인할 필요가 없다.
   표지판이 표지판을 가리키는 경우(두 번 바뀐 이름)까지 따라가되 무한 반복은 막는다. */
var resolveUser=async(name)=>{
  var cur=String(name||'').trim();
  const seen=new Set();
  for(var i=0;i<5;i++){
    if(!cur||seen.has(cur))break;
    seen.add(cur);
    const d=await db.collection('users').doc(cur).get();
    if(!d.exists)return{name:cur,data:null,exists:false};
    const v=d.data()||{};
    if(v.renamedTo&&v.renamedTo!==cur){cur=v.renamedTo;continue;}
    return{name:cur,data:v,exists:true};
  }
  return{name:cur,data:null,exists:false};
};

/* 저장도 표지판을 따라간다 — 학생이 앱을 켜 둔 채로 선생님이 이름을 바꿔도
   옛 이름 자리(표지판)에 기록이 덮어써지지 않게 한다. */
var saveUser=async(data)=>{try{
  const r=await resolveUser(data.name);
  const name=r.name||data.name;
  await db.collection('users').doc(name).set({...data,name},{merge:true});
}catch(e){console.error(e)}};

/* opt.throwOnError:true 를 주면 통신 실패를 예외로 알려 준다.
   (없으면 '계정 없음'과 '인터넷 끊김'을 구분할 수 없어 로그인 화면으로 튕긴다) */
var loadUser=async(name,opt)=>{
  try{const r=await resolveUser(name);return r.data;}
  catch(e){if(opt&&opt.throwOnError)throw e;return null;}
};

var saveLog=async(log)=>{try{await db.collection('math_logs').add(log)}catch(e){console.error(e)}};

/* ── 학생 이름 바꾸기 ──────────────────────────────────────────────
   이름이 users 문서의 id이자 다른 컬렉션의 studentName 값이라,
   한 군데만 고치면 기록·피드백·숙제가 옛 이름에 남아 흩어진다.
   그래서 아래 순서로 한 번에 옮긴다. onStep 으로 진행 상황을 알려 준다.
   옛 이름 자리에는 표지판(renamedTo)을 남겨 접속이 끊기지 않게 한다. */
var renameUser=async(oldName,newName,onStep)=>{
  const step=m=>{try{onStep&&onStep(m);}catch(e){}};
  oldName=String(oldName||'').trim();
  newName=String(newName||'').trim();
  if(!oldName||!newName)throw new Error('이름이 비어 있습니다.');
  if(oldName===newName)throw new Error('지금과 같은 이름입니다.');
  if(newName.indexOf('/')>=0)throw new Error("이름에 '/' 는 쓸 수 없습니다.");

  const oldSnap=await db.collection('users').doc(oldName).get();
  if(!oldSnap.exists)throw new Error(`'${oldName}' 계정을 찾을 수 없습니다.`);
  const oldData=oldSnap.data()||{};
  if(oldData.renamedTo)throw new Error(`'${oldName}' 은 이미 '${oldData.renamedTo}' 으로 바뀐 이름입니다.`);
  const newSnap=await db.collection('users').doc(newName).get();
  if(newSnap.exists&&!(newSnap.data()||{}).renamedTo)
    throw new Error(`'${newName}' 이름을 쓰는 계정이 이미 있습니다. 먼저 그 계정을 정리해 주세요.`);

  // 1) 계정 문서를 새 이름으로 옮긴다
  step('계정 옮기는 중…');
  const moved={...oldData,name:newName,renamedFrom:oldName,renamedAt:new Date()};
  delete moved.renamedTo;
  await db.collection('users').doc(newName).set(moved);

  // 2) 학습 기록 · 피드백 · 학생 의견의 이름 값
  const swap=async(col,field,label)=>{
    const snap=await db.collection(col).where(field,'==',oldName).get();
    if(snap.empty)return 0;
    step(`${label} ${snap.size}건 고치는 중…`);
    const docs=[];snap.forEach(d=>docs.push(d.ref));
    for(var i=0;i<docs.length;i+=400){
      const batch=db.batch();
      docs.slice(i,i+400).forEach(ref=>batch.set(ref,{[field]:newName},{merge:true}));
      await batch.commit();
    }
    return docs.length;
  };
  const nLogs=await swap('math_logs','studentName','학습 기록');
  const nFb=await swap('feedback','studentName','선생님 피드백');
  const nSf=await swap('studentFeedback','studentName','학생 의견');

  // 3) 숙제의 받는 사람 / 제출한 사람 목록 (배열 안에 이름이 들어 있다)
  step('숙제 명단 고치는 중…');
  const hwSnap=await db.collection('homework').get();
  for(const d of hwSnap.docs){
    const v=d.data()||{};
    const patch={};
    if(Array.isArray(v.assignedTo)&&v.assignedTo.includes(oldName))
      patch.assignedTo=v.assignedTo.map(x=>x===oldName?newName:x);
    else if(v.assignedTo===oldName)patch.assignedTo=newName;
    if(Array.isArray(v.completedBy)&&v.completedBy.includes(oldName))
      patch.completedBy=v.completedBy.map(x=>x===oldName?newName:x);
    if(Object.keys(patch).length)await d.ref.set(patch,{merge:true});
  }

  // 4) 세션 인쇄본 편집 내용 (문서 id 가 '이름_날짜_시각')
  step('세션 편집본 옮기는 중…');
  try{
    const FP=firebase.firestore.FieldPath.documentId();
    const seSnap=await db.collection('sessionEdits').orderBy(FP)
      .startAt(oldName+'_').endAt(oldName+'_').get();
    for(const d of seSnap.docs){
      await db.collection('sessionEdits').doc(newName+d.id.slice(oldName.length)).set(d.data());
      await d.ref.delete();
    }
  }catch(e){console.error('sessionEdits 이동 실패',e);}

  // 5) 접속중 표시 (옛 이름 것은 지운다 — 새 이름으로 다시 올라온다)
  try{await db.collection('onlineStatus').doc(oldName).delete();}catch(e){}

  // 6) 선생님 폴더 배정 (학생 id = 이름)
  step('폴더 배정 고치는 중…');
  var folders=null;
  try{
    const fSnap=await db.collection('teacherSettings').doc('folders').get();
    if(fSnap.exists&&Array.isArray((fSnap.data()||{}).folders)){
      folders=fSnap.data().folders.map(f=>({...f,ids:(f.ids||[]).map(x=>x===oldName?newName:x)}));
      await db.collection('teacherSettings').doc('folders').set({folders,updatedAt:Date.now()},{merge:true});
    }
  }catch(e){console.error('폴더 갱신 실패',e);}

  // 7) 옛 이름 자리에 표지판을 남긴다 (이 학생이 로그인한 채로 있어도 끊기지 않는다)
  await db.collection('users').doc(oldName).set({renamedTo:newName,renamedAt:new Date()});

  return{oldName,newName,logs:nLogs,feedback:nFb,studentFeedback:nSf,folders};
};
