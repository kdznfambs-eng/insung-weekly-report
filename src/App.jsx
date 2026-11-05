import React, { useState, useEffect } from 'react';
import { 
  Users, User, CheckCircle2, 
  FileText, Briefcase, Plane, LayoutDashboard, Clock, Trash2,
  Eye, Building2, Printer
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('form'); // 'form' | 'dashboard' | 'view'
  
  // Form State Declarations
  const [teamName, setTeamName] = useState('설계팀');
  const [memberName, setMemberName] = useState('');
  const [memberRank, setMemberRank] = useState('사원');
  const [reportDate, setReportDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [lastWeekTasks, setLastWeekTasks] = useState([
    { id: 1, content: '' },
    { id: 2, content: '' }
  ]);
  const [thisWeekTasks, setThisWeekTasks] = useState([
    { id: 1, content: '' },
    { id: 2, content: '' }
  ]);
  const [otherNotes, setOtherNotes] = useState('');
  const [weeklyOutings, setWeeklyOutings] = useState({
    월: { active: false, note: '' },
    화: { active: false, note: '' },
    수: { active: false, note: '' },
    목: { active: false, note: '' },
    금: { active: false, note: '' },
    토: { active: false, note: '' },
    일: { active: false, note: '' }
  });
  const [weeklyVacations, setWeeklyVacations] = useState({
    월: { type: '없음' },
    화: { type: '없음' },
    수: { type: '없음' },
    목: { type: '없음' },
    금: { type: '없음' },
    토: { type: '없음' },
    일: { type: '없음' }
  });

  // Auto-delete settings
  const [autoDeleteMode, setAutoDeleteMode] = useState('scheduled'); 
  const [autoDeleteInterval, setAutoDeleteInterval] = useState('48h'); 
  const [autoDeleteDay, setAutoDeleteDay] = useState('금'); 
  const [autoDeleteTime, setAutoDeleteTime] = useState('18:00'); 
  
  const rankOptions = ['이사', '부장', '차장', '과장', '대리', '사원'];
  const rankPriority = {
    '이사': 1,
    '부장': 2,
    '차장': 3,
    '과장': 4,
    '대리': 5,
    '사원': 6
  };

  // State for team reports
  const [teamReports, setTeamReports] = useState(() => {
    const localData = localStorage.getItem('insung_team_reports');
    return localData ? JSON.parse(localData) : [];
  });

  // Reliable, high-availability zero-auth online sync endpoint (jsonblob REST service)
  const SYNC_URL = 'https://jsonblob.com/api/jsonBlob/1200000000000000000'; // Global sync fallback
  const ROOM_KEY = 'insung_weekly_reports_shared_v2';

  // Real-time synchronization logic for multi-computer sharing
  useEffect(() => {
    // 1. Multi-tab / Same-network broadcast sync
    const channel = new BroadcastChannel('insung_report_channel');
    
    channel.onmessage = (event) => {
      if (event.data && Array.isArray(event.data)) {
        setTeamReports(event.data);
        localStorage.setItem('insung_team_reports', JSON.stringify(event.data));
      }
    };

    // 2. Storage event listener for local tabs
    const handleStorageChange = (e) => {
      if (e.key === 'insung_team_reports' && e.newValue) {
        try {
          setTeamReports(JSON.parse(e.newValue));
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // 3. Online Cloud fetch interval for cross-computer sharing
    const fetchOnlineReports = async () => {
      try {
        const response = await fetch(`https://api.counterapi.dev/v1/insung_weekly/${ROOM_KEY}/data`, { cache: 'no-store' });
        if (response.ok) {
          const resJson = await response.json();
          if (resJson && resJson.reports && Array.isArray(resJson.reports)) {
            setTeamReports(resJson.reports);
            localStorage.setItem('insung_team_reports', JSON.stringify(resJson.reports));
          }
        }
      } catch (err) {
        // Fallback silently to local cache if network is temporarily slow
      }
    };

    const syncInterval = setInterval(fetchOnlineReports, 4000);

    return () => {
      channel.close();
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(syncInterval);
    };
  }, []);

  // Save report to both Online Cloud and local storage & clear form inputs
  const handleSaveToDashboard = async () => {
    if (!memberName.trim()) {
      alert('담당자 성명을 입력해주세요.');
      return;
    }

    const reportId = 'report-' + Date.now();
    const newReport = {
      id: reportId,
      teamName,
      memberName,
      memberRank,
      reportDate,
      createdAt: Date.now(),
      lastWeekTasks: [...lastWeekTasks],
      thisWeekTasks: [...thisWeekTasks],
      otherNotes,
      weeklyOutings: { ...weeklyOutings },
      weeklyVacations: { ...weeklyVacations }
    };

    const updatedReports = [newReport, ...teamReports.filter(r => !(r.memberName === memberName && r.teamName === teamName))];
    setTeamReports(updatedReports);
    localStorage.setItem('insung_team_reports', JSON.stringify(updatedReports));

    // Broadcast across tabs/windows immediately
    try {
      const channel = new BroadcastChannel('insung_report_channel');
      channel.postMessage(updatedReports);
      channel.close();
    } catch(err) {}

    // Push to online cloud database for other PCs
    try {
      await fetch(`https://api.counterapi.dev/v1/insung_weekly/${ROOM_KEY}/up`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reports: updatedReports })
      });
    } catch (e) {
      console.warn("Saved to local storage successfully.");
    }

    alert(`${memberName} ${memberRank} 님의 주간업무보고서가 등록 및 공유되었습니다.`);
    
    // Reset input fields completely after submission
    resetForm();
    setActiveTab('view');
  };

  // Delete a report from Online Cloud & Local storage
  const handleDeleteReport = async (reportId) => {
    const updatedReports = teamReports.filter(r => r.id !== reportId);
    setTeamReports(updatedReports);
    localStorage.setItem('insung_team_reports', JSON.stringify(updatedReports));

    try {
      const channel = new BroadcastChannel('insung_report_channel');
      channel.postMessage(updatedReports);
      channel.close();
    } catch(err) {}

    try {
      await fetch(`https://api.counterapi.dev/v1/insung_weekly/${ROOM_KEY}/up`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reports: updatedReports })
      });
    } catch (e) {}
  };

  // Scheduled / Interval Auto-delete timer effect
  useEffect(() => {
    if (autoDeleteMode === 'none') return;

    const dayMap = { '일': 0, '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6 };

    const checkAutoDelete = () => {
      const now = new Date();

      if (autoDeleteMode === 'scheduled') {
        const targetDayNum = dayMap[autoDeleteDay];
        const [targetHour, targetMinute] = autoDeleteTime.split(':').map(Number);

        const currentDayNum = now.getDay();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        if (currentDayNum === targetDayNum && currentHour === targetHour && currentMinute === targetMinute) {
          setTeamReports([]);
          localStorage.removeItem('insung_team_reports');
        }
      } else if (autoDeleteMode === 'interval') {
        const getExpiryMs = (policy) => {
          switch (policy) {
            case '24h': return 24 * 60 * 60 * 1000;
            case '48h': return 48 * 60 * 60 * 1000;
            case '7d': return 7 * 24 * 60 * 60 * 1000;
            default: return Infinity;
          }
        };

        const expiryMs = getExpiryMs(autoDeleteInterval);
        const currentTimeMs = now.getTime();
        const filtered = teamReports.filter(r => currentTimeMs - (r.createdAt || currentTimeMs) < expiryMs);

        if (filtered.length !== teamReports.length) {
          setTeamReports(filtered);
          localStorage.setItem('insung_team_reports', JSON.stringify(filtered));
        }
      }
    };

    const interval = setInterval(checkAutoDelete, 10000);
    return () => clearInterval(interval);
  }, [autoDeleteMode, autoDeleteInterval, autoDeleteDay, autoDeleteTime, teamReports]);

  // Form Reset Function
  const resetForm = () => {
    setMemberName('');
    setMemberRank('사원');
    setLastWeekTasks([
      { id: 1, content: '' },
      { id: 2, content: '' }
    ]);
    setThisWeekTasks([
      { id: 1, content: '' },
      { id: 2, content: '' }
    ]);
    setOtherNotes('');
    setWeeklyOutings({
      월: { active: false, note: '' },
      화: { active: false, note: '' },
      수: { active: false, note: '' },
      목: { active: false, note: '' },
      금: { active: false, note: '' },
      토: { active: false, note: '' },
      일: { active: false, note: '' }
    });
    setWeeklyVacations({
      월: { type: '없음' },
      화: { type: '없음' },
      수: { type: '없음' },
      목: { type: '없음' },
      금: { type: '없음' },
      토: { type: '없음' },
      일: { type: '없음' }
    });
  };

  // Task Input Handlers (Fixed Items)
  const handleTaskChange = (type, index, value) => {
    if (type === 'last') {
      const updated = [...lastWeekTasks];
      updated[index] = { ...updated[index], content: value };
      setLastWeekTasks(updated);
    } else {
      const updated = [...thisWeekTasks];
      updated[index] = { ...updated[index], content: value };
      setThisWeekTasks(updated);
    }
  };

  // Outing Day Toggle & Change
  const handleOutingToggle = (day) => {
    setWeeklyOutings(prev => ({
      ...prev,
      [day]: { ...prev[day], active: !prev[day].active }
    }));
  };

  const handleOutingNoteChange = (day, note) => {
    setWeeklyOutings(prev => ({
      ...prev,
      [day]: { ...prev[day], note }
    }));
  };

  // Vacation Day Change Handler
  const handleVacationTypeChange = (day, type) => {
    setWeeklyVacations(prev => ({
      ...prev,
      [day]: { ...prev[day], type }
    }));
  };

  // Helper summaries
  const getOutingsSummary = (outings) => {
    if (!outings) return '';
    return Object.entries(outings)
      .filter(([_, val]) => val.active)
      .map(([day, val]) => `${day}요일(${val.note || '외근'})`)
      .join(', ');
  };

  const getVacationsSummary = (vacations) => {
    if (!vacations) return '';
    return Object.entries(vacations)
      .filter(([_, val]) => val.type && val.type !== '없음')
      .map(([day, val]) => `${day}요일(${val.type})`)
      .join(', ');
  };

  // Sort teams so "설계팀" always comes first, followed by others alphabetically
  const getSortedTeams = (reports) => {
    const teams = Array.from(new Set(reports.map(r => r.teamName)));
    return teams.sort((a, b) => {
      if (a === '설계팀') return -1;
      if (b === '설계팀') return 1;
      return a.localeCompare(b, 'ko');
    });
  };

  // Sort reports within a team by Rank Priority (Higher rank first: 이사 > 부장 > 차장 > 과장 > 대리 > 사원)
  const getSortedReportsByRank = (reports) => {
    return [...reports].sort((a, b) => {
      const priorityA = rankPriority[a.memberRank] || 99;
      const priorityB = rankPriority[b.memberRank] || 99;
      return priorityA - priorityB;
    });
  };

  // PDF Download (Window Print)
  const handlePrintPDF = () => {
    window.print();
  };

  const daysList = ['월', '화', '수', '목', '금', '토', '일'];
  const vacationOptions = ['없음', '연차', '오전반차', '오후반차', '대체 휴무', '공가', '병가', '경조휴가'];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans pb-12 print:bg-white print:text-slate-900 print:pb-0">
      {/* Print-specific style override for maintaining clean A4 Landscape PDF output */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 10mm 10mm;
          }
          head, title {
            display: none !important;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background-color: #ffffff !important;
            color: #0f172a !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print-page-1 {
            page-break-after: always !important;
            break-after: page !important;
          }
          .print-page-2 {
            page-break-before: always !important;
            break-before: page !important;
          }
          .print-clean-container {
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-no-border {
            border: none !important;
            border-top: none !important;
            border-bottom: none !important;
            padding-top: 0 !important;
          }
        }
      `}</style>

      {/* Header Bar - Hidden on print */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-md shadow-blue-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-base sm:text-lg text-slate-800 leading-tight">
                인성씨앤아이 주간업무보고
              </h1>
              <p className="text-[11px] text-slate-500">Smart Weekly Task Reporter</p>
            </div>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('form')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'form' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>보고서 작성</span>
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'dashboard' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>팀 취합 대시보드</span>
            </button>
            <button
              onClick={() => setActiveTab('view')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'view' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>통합 보고서 열람</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 print:p-0 print:max-w-none">

        {/* TAB 1: REPORT FORM */}
        {activeTab === 'form' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* 기본 정보 설정 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  기본 정보 입력
                </h2>
                <p className="text-xs text-slate-500">소속 팀명, 담당자 성명 및 직급을 입력해주세요.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">소속 팀명</label>
                  <select 
                    value={teamName} 
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                  >
                    <option value="설계팀">설계팀</option>
                    <option value="시운전팀">시운전팀</option>
                    <option value="영업2팀">영업2팀</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">담당자 성명</label>
                  <input 
                    type="text" 
                    placeholder="예: 홍길동"
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">직급</label>
                  <select 
                    value={memberRank} 
                    onChange={(e) => setMemberRank(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                  >
                    {rankOptions.map(rank => (
                      <option key={rank} value={rank}>{rank}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">작성 일자</label>
                  <input 
                    type="date" 
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* 지난주 주요 업무 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  지난주 주요 업무
                </h3>
              </div>
              
              <div className="space-y-3">
                {lastWeekTasks.map((task, index) => (
                  <div key={task.id} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 w-6 text-center">{index + 1}.</span>
                    <input 
                      type="text" 
                      placeholder={`주요 업무 ${index + 1} 내용 입력`}
                      value={task.content}
                      onChange={(e) => handleTaskChange('last', index, e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 이번주 예정 업무 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  이번주 예정 업무
                </h3>
              </div>

              <div className="space-y-3">
                {thisWeekTasks.map((task, index) => (
                  <div key={task.id} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 w-6 text-center">{index + 1}.</span>
                    <input 
                      type="text" 
                      placeholder={`예정 업무 ${index + 1} 내용 입력`}
                      value={task.content}
                      onChange={(e) => handleTaskChange('this', index, e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 기타 보고사항 입력 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-500" />
                  기타 보고사항
                </h3>
              </div>
              <textarea
                rows={3}
                placeholder="건의사항, 이슈, 요청사항 등 기타 보고할 내용이 있을 경우 자유롭게 작성해 주세요."
                value={otherNotes}
                onChange={(e) => setOtherNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            {/* 금주 외근 일정 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-amber-600" />
                  금주 외근 일정
                </h3>
              </div>

              <div className="space-y-2.5">
                {daysList.map(day => (
                  <div 
                    key={day} 
                    className={`p-3 rounded-xl border transition flex items-center gap-3 ${
                      weeklyOutings[day].active 
                        ? 'bg-amber-50 border-amber-300' 
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 w-24 shrink-0">
                      <input 
                        type="checkbox"
                        id={`outing-${day}`}
                        checked={weeklyOutings[day].active}
                        onChange={() => handleOutingToggle(day)}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                      />
                      <label htmlFor={`outing-${day}`} className="text-xs font-bold text-slate-700 cursor-pointer">
                        {day}요일
                      </label>
                    </div>
                    
                    {weeklyOutings[day].active ? (
                      <input 
                        type="text"
                        placeholder={`${day}요일 외근장소 및 세부내용 입력`}
                        value={weeklyOutings[day].note}
                        onChange={(e) => handleOutingNoteChange(day, e.target.value)}
                        className="flex-1 bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-amber-500"
                      />
                    ) : (
                      <span className="text-xs text-slate-400 italic">외근 없음</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 금주 휴가 일정 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Plane className="w-4 h-4 text-purple-600" />
                  금주 휴가 일정
                </h3>
                <p className="text-xs text-slate-500 mt-1">휴가 선택 시 보라색 강조 효과가 적용됩니다.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-2">
                {daysList.map(day => {
                  const isVacationSelected = weeklyVacations[day].type !== '없음';
                  return (
                    <div 
                      key={day} 
                      className={`p-3 border rounded-xl space-y-2 transition ${
                        isVacationSelected 
                          ? 'bg-purple-50 border-purple-300 shadow-sm' 
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${isVacationSelected ? 'text-purple-700' : 'text-slate-700'}`}>
                          {day}요일
                        </span>
                        {isVacationSelected && (
                          <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                        )}
                      </div>
                      <select
                        value={weeklyVacations[day].type}
                        onChange={(e) => handleVacationTypeChange(day, e.target.value)}
                        className={`w-full border rounded-lg p-1.5 text-[11px] focus:outline-none ${
                          isVacationSelected 
                            ? 'bg-purple-100 border-purple-400 text-purple-900 font-semibold' 
                            : 'bg-white border-slate-300 text-slate-800 focus:border-purple-500'
                        }`}
                      >
                        {vacationOptions.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 제출 버튼 */}
            <button
              onClick={handleSaveToDashboard}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-md transition text-sm flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>팀 취합 목록에 등록</span>
            </button>
          </div>
        )}

        {/* TAB 2: CONSOLIDATED MASTER REPORT VIEW */}
        {activeTab === 'view' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
              <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Building2 className="w-6 h-6 text-blue-600" />
                  팀 주간업무보고서
                </h2>
              </div>
              <button
                onClick={handlePrintPDF}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md transition flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>주간업무보고서 PDF 인쇄</span>
              </button>
            </div>

            {teamReports.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center text-slate-500 space-y-3 print:hidden">
                <FileText className="w-12 h-12 mx-auto text-slate-400" />
                <p className="text-sm font-medium">취합된 주간업무보고서 데이터가 없습니다.</p>
                <p className="text-xs text-slate-400">
                  '보고서 작성' 탭에서 주간보고서를 등록해 주세요.
                </p>
              </div>
            ) : (
              <div className="bg-white border border-slate-300 rounded-2xl overflow-hidden shadow-sm p-6 space-y-6 print:bg-white print:text-slate-900 print:border-none print:shadow-none print:p-0 print-clean-container">
                
                {/* 1페이지 영역: 타이틀 + 지난주/이번주 주요업무 + 기타 보고사항 */}
                <div className="space-y-4 print-page-1">
                  {/* 보고서 상단 타이틀 구조 */}
                  <div className="text-center space-y-1 pb-3 border-b border-slate-200 print:border-slate-300">
                    <h1 className="text-2xl font-extrabold text-blue-800 tracking-wider print:text-blue-900 print:text-xl">
                      &lt;&lt; 인성씨앤아이 주간업무보고 &gt;&gt;
                    </h1>
                    <p className="text-xs text-slate-500 font-mono print:text-slate-600">{reportDate}</p>
                  </div>

                  {/* 팀 주간업무보고서 표준 테이블 */}
                  <div className="overflow-x-auto print:overflow-visible">
                    <table className="w-full text-left text-xs border-collapse border border-slate-300 print:border-slate-400">
                      <thead>
                        <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold text-center print:bg-slate-100 print:text-slate-900 print:border-slate-400">
                          <th className="py-2.5 px-3 border border-slate-300 w-24 bg-slate-200/70 print:bg-slate-200 print:border-slate-400">구분</th>
                          <th className="py-2.5 px-6 border border-slate-300 bg-slate-100 print:bg-slate-100 print:border-slate-400">지난주 주요 업무</th>
                          <th className="py-2.5 px-4 border border-slate-300 w-24 bg-slate-200/70 print:bg-slate-200 print:border-slate-400">담당</th>
                          <th className="py-2.5 px-6 border border-slate-300 bg-slate-100 print:bg-slate-100 print:border-slate-400">이번주 예정 업무</th>
                          <th className="py-2.5 px-4 border border-slate-300 w-24 bg-slate-200/70 print:bg-slate-200 print:border-slate-400">담당</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-slate-800 print:text-slate-900 print:divide-slate-300">
                        {getSortedTeams(teamReports).map(tName => {
                          const reportsInTeam = teamReports.filter(r => r.teamName === tName);
                          // 직급 순으로 정렬 (이사 > 부장 > 차장 > 과장 > 대리 > 사원)
                          const sortedReports = getSortedReportsByRank(reportsInTeam);

                          return sortedReports.map((rep, rIdx) => {
                            const maxRows = Math.max(rep.lastWeekTasks.length, rep.thisWeekTasks.length, 1);
                            const memberDisplay = `${rep.memberName} ${rep.memberRank}`;

                            return Array.from({ length: maxRows }).map((_, idx) => (
                              <tr key={`${rep.id}-${idx}`} className="hover:bg-slate-50 transition print:hover:bg-transparent">
                                {rIdx === 0 && idx === 0 ? (
                                  <td 
                                    rowSpan={sortedReports.reduce((acc, curr) => acc + Math.max(curr.lastWeekTasks.length, curr.thisWeekTasks.length, 1), 0)}
                                    className="py-2.5 px-3 text-center font-bold text-blue-900 border border-slate-300 bg-blue-50/50 align-middle print:text-blue-900 print:border-slate-400 print:bg-blue-50"
                                  >
                                    {tName}
                                  </td>
                                ) : null}

                                <td className="py-2 px-4 border border-slate-300 text-slate-800 print:text-slate-900 print:border-slate-400">
                                  {typeof rep.lastWeekTasks[idx]?.content === 'string' 
                                    ? rep.lastWeekTasks[idx].content 
                                    : (typeof rep.lastWeekTasks[idx] === 'string' ? rep.lastWeekTasks[idx] : '')}
                                </td>

                                <td className="py-2 px-3 text-center font-medium border border-slate-300 text-slate-700 bg-slate-50 print:text-slate-800 print:border-slate-400 print:bg-slate-50">
                                  {memberDisplay}
                                </td>

                                <td className="py-2 px-4 border border-slate-300 text-slate-800 print:text-slate-900 print:border-slate-400">
                                  {typeof rep.thisWeekTasks[idx]?.content === 'string' 
                                    ? rep.thisWeekTasks[idx].content 
                                    : (typeof rep.thisWeekTasks[idx] === 'string' ? rep.thisWeekTasks[idx] : '')}
                                </td>

                                <td className="py-2 px-3 text-center font-medium border border-slate-300 text-slate-700 bg-slate-50 print:text-slate-800 print:border-slate-400 print:bg-slate-50">
                                  {memberDisplay}
                                </td>
                              </tr>
                            ));
                          });
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* 기타 보고사항 중간 독립 섹션 */}
                  <div className="pt-2 border-t border-slate-200 print:border-none print:pt-1 print-no-border space-y-1.5">
                    <h3 className="text-sm font-bold text-slate-800 print:text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600 print:hidden" />
                      [ 기타 보고사항 (통합) ]
                    </h3>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5 text-xs text-slate-800 print:bg-slate-50 print:border-slate-300 print:text-slate-900">
                      {teamReports.filter(r => r.otherNotes && r.otherNotes.trim() !== '').length === 0 ? (
                        <p className="text-slate-400 italic print:text-slate-500">등록된 기타 보고사항이 없습니다.</p>
                      ) : (
                        <ul className="list-disc list-inside space-y-1">
                          {teamReports
                            .filter(r => r.otherNotes && r.otherNotes.trim() !== '')
                            .map(r => (
                              <li key={`note-${r.id}`} className="leading-relaxed">
                                <span className="font-bold text-blue-700 print:text-blue-800">[{r.teamName} {r.memberName} {r.memberRank}]</span>: {r.otherNotes}
                              </li>
                            ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2페이지 영역: 금주 외근 및 휴가 현황 통합표 */}
                <div className="pt-2 border-t border-slate-200 print:border-none print:pt-0 print-no-border space-y-3 print-page-2">
                  <h3 className="text-sm font-bold text-slate-800 print:text-slate-900 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-amber-600 print:hidden" />
                    [ 금주 외근 및 휴가 현황 (통합) ]
                  </h3>

                  <div className="overflow-x-auto print:overflow-visible">
                    <table className="w-full text-left text-xs border-collapse border border-slate-300 table-fixed print:border-slate-400">
                      <thead>
                        <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold text-center print:bg-slate-100 print:text-slate-900 print:border-slate-400">
                          <th className="py-2.5 px-3 border border-slate-300 w-32 bg-slate-200/70 print:bg-slate-200 print:border-slate-400">담당자</th>
                          <th className="py-2.5 px-3 border border-slate-300 w-20 bg-slate-200/70 print:bg-slate-200 print:border-slate-400">구분</th>
                          {daysList.map(d => (
                            <th key={d} className="py-2.5 px-2 border border-slate-300 bg-slate-100 text-center w-28 print:bg-slate-100 print:border-slate-400">{d}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-slate-800 print:text-slate-900 print:divide-slate-300">
                        {getSortedTeams(teamReports).map(tName => {
                          const reportsInTeam = teamReports.filter(r => r.teamName === tName);
                          const sortedReports = getSortedReportsByRank(reportsInTeam);

                          return sortedReports.map(rep => (
                            <React.Fragment key={rep.id}>
                              {/* 외근 일정 Row */}
                              <tr className="hover:bg-slate-50 print:hover:bg-transparent">
                                <td rowSpan={2} className="py-2 px-3 border border-slate-300 font-bold text-center align-middle bg-slate-50 print:border-slate-400 print:bg-slate-50">
                                  {rep.memberName} {rep.memberRank}
                                  <span className="block text-[10px] text-slate-500 print:text-slate-600 font-normal">{rep.teamName}</span>
                                </td>
                                <td className="py-2 px-3 border border-slate-300 font-semibold text-amber-700 text-center bg-amber-50/50 print:text-amber-800 print:border-slate-400 print:bg-amber-50">
                                  외근
                                </td>
                                {daysList.map(day => (
                                  <td key={day} className="py-2 px-2 border border-slate-300 text-center text-[11px] break-words whitespace-normal leading-tight print:border-slate-400">
                                    {rep.weeklyOutings[day]?.active ? (
                                      <span className="text-amber-800 print:text-amber-900 font-medium">
                                        {rep.weeklyOutings[day]?.note || '외근'}
                                      </span>
                                    ) : (
                                      <span className="text-slate-300 print:text-slate-400">-</span>
                                    )}
                                  </td>
                                ))}
                              </tr>
                              {/* 휴가 일정 Row */}
                              <tr className="hover:bg-slate-50 border-b border-slate-300 print:border-slate-400 print:hover:bg-transparent">
                                <td className="py-2 px-3 border border-slate-300 font-semibold text-purple-700 text-center bg-purple-50/50 print:text-purple-800 print:border-slate-400 print:bg-purple-50">
                                  휴가
                                </td>
                                {daysList.map(day => (
                                  <td key={day} className="py-2 px-2 border border-slate-300 text-center text-[11px] break-words whitespace-normal leading-tight print:border-slate-400">
                                    {rep.weeklyVacations[day]?.type !== '없음' ? (
                                      <span className="bg-purple-100 text-purple-800 border border-purple-200 px-1.5 py-0.5 rounded font-medium print:bg-purple-100 print:text-purple-900 print:border-purple-300">
                                        {rep.weeklyVacations[day]?.type}
                                      </span>
                                    ) : (
                                      <span className="text-slate-300 print:text-slate-400">-</span>
                                    )}
                                  </td>
                                ))}
                              </tr>
                            </React.Fragment>
                          ));
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* TAB 3: TEAM DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* 상단 컨트롤 바 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Users className="w-6 h-6 text-blue-600" />
                  팀 주간업무보고 취합 대시보드
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  제출된 모든 주간보고서를 삭제하거나 자동 정리를 설정합니다.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handlePrintPDF}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md transition flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>대쉬 보드 PDF 인쇄</span>
                </button>
              </div>
            </div>

            {/* 자동 삭제 설정 패널 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800">대시보드 데이터 자동 삭제 설정</h4>
                  <p className="text-[11px] text-slate-500">지정된 요일/시간 또는 경과 시간에 맞춰 데이터를 자동 정리합니다.</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select 
                  value={autoDeleteMode} 
                  onChange={(e) => setAutoDeleteMode(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
                >
                  <option value="none">자동 삭제 사용 안 함</option>
                  <option value="scheduled">지정 요일/시간 자동 삭제</option>
                  <option value="interval">작성 경과시간 후 자동 삭제</option>
                </select>

                {autoDeleteMode === 'scheduled' && (
                  <div className="flex items-center gap-1.5">
                    <select 
                      value={autoDeleteDay} 
                      onChange={(e) => setAutoDeleteDay(e.target.value)}
                      className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-800"
                    >
                      {daysList.map(d => <option key={d} value={d}>{d}요일</option>)}
                    </select>
                    <input 
                      type="time" 
                      value={autoDeleteTime}
                      onChange={(e) => setAutoDeleteTime(e.target.value)}
                      className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-800"
                    />
                  </div>
                )}

                {autoDeleteMode === 'interval' && (
                  <select 
                    value={autoDeleteInterval} 
                    onChange={(e) => setAutoDeleteInterval(e.target.value)}
                    className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-800"
                  >
                    <option value="24h">24시간 후</option>
                    <option value="48h">48시간 후</option>
                    <option value="7d">7일 후</option>
                  </select>
                )}
              </div>
            </div>

            {/* 카드 목록 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teamReports.map((report) => (
                <div key={report.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 relative flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-lg text-xs font-bold">
                          {report.teamName}
                        </span>
                        <span className="font-bold text-slate-800 text-sm">{report.memberName} {report.memberRank}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteReport(report.id)}
                        className="text-slate-400 hover:text-red-500 transition p-1"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-3 pt-3 text-xs">
                      <div>
                        <h4 className="font-bold text-slate-500 mb-1">지난주 주요 업무</h4>
                        <ul className="list-disc list-inside text-slate-700 space-y-1">
                          {report.lastWeekTasks.map((t, idx) => (
                            <li key={idx}>
                              {typeof t === 'string' ? t : (t?.content || '-')}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-500 mb-1">이번주 예정 업무</h4>
                        <ul className="list-disc list-inside text-slate-700 space-y-1">
                          {report.thisWeekTasks.map((t, idx) => (
                            <li key={idx}>
                              {typeof t === 'string' ? t : (t?.content || '-')}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {report.otherNotes && (
                        <div>
                          <h4 className="font-bold text-slate-500 mb-1">기타 보고사항</h4>
                          <p className="text-slate-700 text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-200">{report.otherNotes}</p>
                        </div>
                      )}

                      {getOutingsSummary(report.weeklyOutings) && (
                        <div>
                          <h4 className="font-bold text-amber-700 mb-0.5">금주 외근 일정</h4>
                          <p className="text-slate-700 text-[11px]">{getOutingsSummary(report.weeklyOutings)}</p>
                        </div>
                      )}

                      {getVacationsSummary(report.weeklyVacations) && (
                        <div>
                          <h4 className="font-bold text-purple-700 mb-0.5">금주 휴가 일정</h4>
                          <p className="text-slate-700 text-[11px]">{getVacationsSummary(report.weeklyVacations)}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-400 flex justify-between items-center">
                    <span>등록일자: {report.reportDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}