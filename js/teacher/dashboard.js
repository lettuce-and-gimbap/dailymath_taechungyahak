// === js/teacher/dashboard.js ===
/* --------------------------------------------------------------------
   
   
   -------------------------------------------------------------------- */

function TeacherDashboard({userData,onLogout,onUpdate}){
  const[tab,setTab]=useState('analysis');
  const TABS=[{k:'analysis',icon:'📊',lbl:'학생관리'},{k:'worksheets',icon:'📝',lbl:'학습지'},{k:'gedsheet',icon:'📐',lbl:'만능학습지'},{k:'notices',icon:'📢',lbl:'공지/숙제'}];
  return(<div className="teacher-ui flex flex-col min-h-screen max-w-2xl mx-auto bg-gray-50" style={{overflowX:'hidden',width:'100%',maxWidth:'100vw'}}>
    <header className="bg-indigo-700 text-white px-4 py-3 flex items-center gap-3 sticky top-0 z-20 shadow-md">
      <div className="text-2xl">👨‍🏫</div>
      <h1 className="text-lg font-black flex-1">선생님 모드</h1>
      <span className="text-sm font-bold opacity-80">{userData.name}</span>
      <DarkToggle/>
      <button onClick={onLogout} className="text-xs text-white/70 font-bold px-2 py-1 rounded-lg bg-white/10">로그아웃</button>
    </header>
    <div className="flex-1 overflow-auto scroll-body">
      {tab==='analysis'&&<StudentAnalysisTab/>}
      {tab==='worksheets'&&<WorksheetTab/>}
      {tab==='gedsheet'&&<GedWorksheetTab/>}
      {tab==='notices'&&<NoticeTab/>}
    </div>
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-20 max-w-2xl mx-auto">
      <div className="flex">{TABS.map(t=><button key={t.k} onClick={()=>setTab(t.k)} className={`flex-1 flex flex-col items-center py-3 gap-1 ${tab===t.k?'text-indigo-600':'text-gray-400'}`}>
        <span className="text-2xl">{t.icon}</span><span className="text-xs font-bold">{t.lbl}</span>
      </button>)}</div>
    </nav>
  </div>);
}
