import React, { useState, useEffect } from 'react';
import { 
  Users, User, CheckCircle2, 
  FileText, Briefcase, Plane, LayoutDashboard, Clock, Trash2,
  Eye, Building2, Printer
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('form'); // 'form' | 'dashboard' | 'view'
  
  // Auto-delete settings: mode ('none' | 'interval' | 'scheduled')
  const [autoDeleteMode, setAutoDeleteMode] = useState('scheduled'); 
  const [autoDeleteInterval, setAutoDeleteInterval] = useState('48h'); 
  const [autoDeleteDay, setAutoDeleteDay] = useState('금'); 
  const [autoDeleteTime, setAutoDeleteTime] = useState('18:00'); 
  
  // Rank definitions and hierarchy for sorting (High to Low)
  const rankOptions = ['이사', '부장', '차장', '과장', '대리', '사원'];
  const rankPriority = {
    '이사': 1,
    '부장': 2,
    '차장': 3,
    '과장': 4,
    '대리': 5,
    '사원': 6
  };

  // Single Report Form State
  const [teamName, setTeamName] = useState('설계팀');
  const [memberName, setMemberName] = useState('');
  const [memberRank, setMemberRank] = useState('사원');
  const [reportDate, setReportDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // Fixed 2 items for Last Week Tasks
  const [lastWeekTasks, setLastWeekTasks] = useState([
    { id: 1, content: '' },
    { id: 2, content: '' }
  ]);

  // Fixed 2 items for This Week Tasks
  const [thisWeekTasks, setThisWeekTasks] = useState([
    { id: 1, content: '' },
    { id: 2, content: '' }
  ]);

  // 기타 보고사항 State
  const [otherNotes, setOtherNotes] = useState('');

  // Outing (외근) Weekly Days State (월~일)
  const [weeklyOutings, setWeeklyOutings] = useState({
    월: { active: false, note: '' },
    화: { active: false, note: '' },
    수: { active: false, note: '' },
    목: { active: false, note: '' },
    금: { active: false, note: '' },
    토: { active: false, note: '' },
    일: { active: false, note: '' }
  });

  // Vacation (휴가) Weekly Days State (월~일 요일별 휴가/반차 선택 방식)
  const [weeklyVacations, setWeeklyVacations] = useState({
    월: { type: '없음' },
    화: { type: '없음' },
    수: { type: '없음' },
    목: { type: '없음' },
    금: { type: '없음' },
    토: { type: '없음' },
    일: { type: '없음' }
  });

  // Consolidated Team Reports Database
  const [teamReports, setTeamReports] = useState([
    {
      id: 'demo-1',
      teamName: '설계팀',
      memberName: '김철수',
      memberRank: '부장',
      reportDate: '2026-11-03',
      createdAt: Date.now() - (1000 * 60 * 60 * 12),
      lastWeekTasks: [
        { content: 'A구역 모듈 배치 도면 최종 수정' },
        { content: '안전성 검토 보고서 반영' }
      ],
      thisWeekTasks: [
        { content: 'B구역 구조 계산서 상세 작업' },
        { content: '도면 출도 및 1차 검토' }
      ],
      otherNotes: '3D 모델링 관련 SW 라이선스 연장 필요',
      weeklyOutings: {
        월: { active: false, note: '' },
        화: { active: true, note: '용현BM 가열로 점검' },
        수: { active: false, note: '' },
        목: { active: false, note: '' },
        금: { active: false, note: '' },
        토: { active: false, note: '' },
        일: { active: false, note: '' }
      },
      weeklyVacations: {
        월: { type: '없음' },
        화: { type: '없음' },
        수: { type: '없음' },
        목: { type: '연차' },
        금: { type: '없음' },
        토: { type: '없음' },
        일: { type: '없음' }
      }
    },
    {
      id: 'demo-2',
      teamName: '설계팀',
      memberName: '이영희',
      memberRank: '대리',
      reportDate: '2026-11-03',
      createdAt: Date.now() - (1000 * 60 * 60 * 6),
      lastWeekTasks: [
        { content: '부품 리스트 정원 검토 및 제안서 작성' },
        { content: '원자재 단가 비교표 작성' }
      ],
      thisWeekTasks: [
        { content: '고객사 요청 도면 수정본 전달' },
        { content: '주간 안전 점검 참가' }
      ],
      otherNotes: '사무용품 수량 부족 건의',
      weeklyOutings: {
        월: { active: true, note: '한화글로벌 보은사업장 기술협의' },
        화: { active: false, note: '' },
        수: { active: false, note: '' },
        목: { active: false, note: '' },
        금: { active: false, note: '' },
        토: { active: false, note: '' },
        일: { active: false, note: '' }
      },
      weeklyVacations: {
        월: { type: '없음' },
        화: { type: '없음' },
        수: { type: '대체 휴무' },
        목: { type: '없음' },
        금: { type: '없음' },
        토: { type: '없음' },
        일: { type: '없음' }
      }
    }
  ]);

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

        setTeamReports(prev => {
          const filtered = prev.filter(r => (currentTimeMs - (r.createdAt || currentTimeMs)) < expiryMs);
          return filtered.length !== prev.length ? filtered : prev;
        });
      }
    };

    const interval = setInterval(checkAutoDelete, 10000);
    return () => clearInterval(interval);
  }, [autoDeleteMode, autoDeleteInterval, autoDeleteDay, autoDeleteTime]);

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

  // Save report to team dashboard database and reset form
  const handleSaveToDashboard = () => {
    if (!memberName.trim()) {
      alert('담당자 성명을 입력해주세요.');
      return;
    }
    const newReport = {
      id: 'report-' + Date.now(),
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
    
    setTeamReports(prev => [newReport, ...prev]);
    alert(`${memberName} ${memberRank} 님의 주간업무보고서가 팀 취합 목록에 등록되었습니다.`);
    resetForm();
    setActiveTab('view');
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

  // Sort teams so "설계팀" always comes first, followed by others alphabetically or logically
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
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-12 print:bg-white print:text-black print:pb-0">
      {/* Header Bar - Hidden on print */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-30 shadow-md print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-500/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-base sm:text-lg text-white leading-tight">
                인성씨앤아이 주간업무보고
              </h1>
              <p className="text-[11px] text-slate-400">Smart Weekly Task Reporter</p>
            </div>
          </div>

          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setActiveTab('form')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'form' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
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
                  : 'text-slate-400 hover:text-slate-200'
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
                  : 'text-slate-400 hover:text-slate-200'
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
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="border-b border-slate-700 pb-3">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-400" />
                  기본 정보 입력
                </h2>
                <p className="text-xs text-slate-400">소속 팀명, 담당자 성명 및 직급을 입력해주세요.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">소속 팀명</label>
                  <select 
                    value={teamName} 
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="설계팀">설계팀</option>
                    <option value="시운전팀">시운전팀</option>
                    <option value="영업2팀">영업2팀</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">담당자 성명</label>
                  <input 
                    type="text" 
                    placeholder="예: 홍길동"
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">직급</label>
                  <select 
                    value={memberRank} 
                    onChange={(e) => setMemberRank(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    {rankOptions.map(rank => (
                      <option key={rank} value={rank}>{rank}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">작성 일자</label>
                  <input 
                    type="date" 
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* 지난주 주요 업무 */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="border-b border-slate-700 pb-3">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
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
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 이번주 예정 업무 */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="border-b border-slate-700 pb-3">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
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
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 기타 보고사항 입력 */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="border-b border-slate-700 pb-3">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  기타 보고사항
                </h3>
              </div>
              <textarea
                rows={3}
                placeholder="건의사항, 이슈, 요청사항 등 기타 보고할 내용이 있을 경우 자유롭게 작성해 주세요."
                value={otherNotes}
                onChange={(e) => setOtherNotes(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* 금주 외근 일정 (월~일 세로 배치로 변경) */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="border-b border-slate-700 pb-3">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-amber-400" />
                  금주 외근 일정
                </h3>
              </div>

              <div className="space-y-2.5">
                {daysList.map(day => (
                  <div 
                    key={day} 
                    className={`p-3 rounded-xl border transition flex items-center gap-3 ${
                      weeklyOutings[day].active 
                        ? 'bg-amber-950/30 border-amber-500/50' 
                        : 'bg-slate-900/50 border-slate-800'
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
                      <label htmlFor={`outing-${day}`} className="text-xs font-bold text-slate-200 cursor-pointer">
                        {day}요일
                      </label>
                    </div>
                    
                    {weeklyOutings[day].active ? (
                      <input 
                        type="text"
                        placeholder={`${day}요일 외근장소 및 세부내용 입력`}
                        value={weeklyOutings[day].note}
                        onChange={(e) => handleOutingNoteChange(day, e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                      />
                    ) : (
                      <span className="text-xs text-slate-500 italic">외근 없음</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 금주 휴가 일정 (대체 휴무 추가 및 선택 시 강조 색상 적용) */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="border-b border-slate-700 pb-3">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Plane className="w-4 h-4 text-purple-400" />
                  금주 휴가 일정
                </h3>
                <p className="text-xs text-slate-400 mt-1">휴가 선택 시 보라색으로 강조 표시됩니다.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-2">
                {daysList.map(day => {
                  const isVacationSelected = weeklyVacations[day].type !== '없음';
                  return (
                    <div 
                      key={day} 
                      className={`p-3 border rounded-xl space-y-2 transition ${
                        isVacationSelected 
                          ? 'bg-purple-950/40 border-purple-500 shadow-md shadow-purple-900/20' 
                          : 'bg-slate-900/50 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${isVacationSelected ? 'text-purple-300' : 'text-slate-200'}`}>
                          {day}요일
                        </span>
                        {isVacationSelected && (
                          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
                        )}
                      </div>
                      <select
                        value={weeklyVacations[day].type}
                        onChange={(e) => handleVacationTypeChange(day, e.target.value)}
                        className={`w-full border rounded-lg p-1.5 text-[11px] focus:outline-none ${
                          isVacationSelected 
                            ? 'bg-purple-900/80 border-purple-500 text-purple-100 font-semibold' 
                            : 'bg-slate-900 border-slate-700 text-slate-100 focus:border-purple-500'
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
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-xl transition text-sm flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>팀 취합 목록에 등록</span>
            </button>
          </div>
        )}

        {/* TAB 2: CONSOLIDATED MASTER REPORT VIEW */}
        {activeTab === 'view' && (
          <div className="space-y-6">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Building2 className="w-6 h-6 text-blue-400" />
                  팀 주간업무보고서
                </h2>
              </div>
              <button
                onClick={handlePrintPDF}
                className="bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg transition flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>주간업무보고서 PDF 인쇄</span>
              </button>
            </div>

            {teamReports.length === 0 ? (
              <div className="bg-slate-800/40 border border-dashed border-slate-700 rounded-2xl p-12 text-center text-slate-400 space-y-3 print:hidden">
                <FileText className="w-12 h-12 mx-auto text-slate-600" />
                <p className="text-sm font-medium">취합된 주간업무보고서 데이터가 없습니다.</p>
                <p className="text-xs text-slate-500">
                  '보고서 작성' 탭에서 주간보고서를 등록해 주세요.
                </p>
              </div>
            ) : (
              <div className="bg-slate-800/90 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl p-6 space-y-6 print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
                {/* 보고서 상단 타이틀 구조 */}
                <div className="text-center space-y-1 pb-4 border-b border-slate-700 print:border-black">
                  <h1 className="text-2xl font-extrabold text-blue-400 tracking-wider print:text-black print:text-xl">
                    &lt;&lt; 인성씨앤아이 주간업무보고 &gt;&gt;
                  </h1>
                  <p className="text-xs text-slate-400 font-mono print:text-gray-700">{reportDate}</p>
                </div>

                {/* 팀 주간업무보고서 표준 테이블 */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse border border-slate-700 print:border-black">
                    <thead>
                      <tr className="bg-slate-950 text-slate-200 border-b border-slate-700 font-bold text-center print:bg-gray-200 print:text-black print:border-black">
                        <th className="py-3 px-3 border border-slate-700 w-24 bg-slate-900 print:bg-gray-100 print:border-black">구분</th>
                        <th className="py-3 px-6 border border-slate-700 bg-slate-900/80 print:bg-gray-100 print:border-black">지난주 주요 업무</th>
                        <th className="py-3 px-4 border border-slate-700 w-24 bg-slate-900 print:bg-gray-100 print:border-black">담당</th>
                        <th className="py-3 px-6 border border-slate-700 bg-slate-900/80 print:bg-gray-100 print:border-black">이번주 예정 업무</th>
                        <th className="py-3 px-4 border border-slate-700 w-24 bg-slate-900 print:bg-gray-100 print:border-black">담당</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/80 text-slate-200 print:text-black print:divide-black">
                      {getSortedTeams(teamReports).map(tName => {
                        const reportsInTeam = teamReports.filter(r => r.teamName === tName);
                        // 직급 순으로 정렬 (이사 > 부장 > 차장 > 과장 > 대리 > 사원)
                        const sortedReports = getSortedReportsByRank(reportsInTeam);

                        return sortedReports.map((rep, rIdx) => {
                          const maxRows = Math.max(rep.lastWeekTasks.length, rep.thisWeekTasks.length, 1);
                          const memberDisplay = `${rep.memberName} ${rep.memberRank}`;

                          return Array.from({ length: maxRows }).map((_, idx) => (
                            <tr key={`${rep.id}-${idx}`} className="hover:bg-slate-800/50 transition print:hover:bg-transparent">
                              {rIdx === 0 && idx === 0 ? (
                                <td 
                                  rowSpan={sortedReports.reduce((acc, curr) => acc + Math.max(curr.lastWeekTasks.length, curr.thisWeekTasks.length, 1), 0)}
                                  className="py-3 px-3 text-center font-bold text-blue-300 border border-slate-700 bg-slate-900/40 align-middle print:text-black print:border-black print:bg-gray-50"
                                >
                                  {tName}
                                </td>
                              ) : null}

                              <td className="py-2.5 px-4 border border-slate-700 text-slate-300 print:text-black print:border-black">
                                {rep.lastWeekTasks[idx]?.content || ''}
                              </td>

                              <td className="py-2.5 px-3 text-center font-medium border border-slate-700 text-slate-300 bg-slate-900/20 print:text-black print:border-black print:bg-transparent">
                                {memberDisplay}
                              </td>

                              <td className="py-2.5 px-4 border border-slate-700 text-slate-300 print:text-black print:border-black">
                                {rep.thisWeekTasks[idx]?.content || ''}
                              </td>

                              <td className="py-2.5 px-3 text-center font-medium border border-slate-700 text-slate-300 bg-slate-900/20 print:text-black print:border-black print:bg-transparent">
                                {memberDisplay}
                              </td>
                            </tr>
                          ));
                        });
                      })}
                    </tbody>
                  </table>
                </div>

                {/* 기타 보고사항 중간 독립 섹션 (작성자와 상관없이 팀 전체 통합 표시) */}
                <div className="pt-2 border-t border-slate-700/60 print:border-black space-y-2">
                  <h3 className="text-sm font-bold text-slate-200 print:text-black flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-400 print:hidden" />
                    [ 기타 보고사항 (통합) ]
                  </h3>
                  <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-4 space-y-2 text-xs text-slate-200 print:bg-gray-50 print:border-black print:text-black">
                    {teamReports.filter(r => r.otherNotes && r.otherNotes.trim() !== '').length === 0 ? (
                      <p className="text-slate-500 italic print:text-gray-500">등록된 기타 보고사항이 없습니다.</p>
                    ) : (
                      <ul className="list-disc list-inside space-y-1.5">
                        {teamReports
                          .filter(r => r.otherNotes && r.otherNotes.trim() !== '')
                          .map(r => (
                            <li key={`note-${r.id}`} className="leading-relaxed">
                              <span className="font-bold text-blue-300 print:text-black">[{r.teamName} {r.memberName} {r.memberRank}]</span>: {r.otherNotes}
                            </li>
                          ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* 월~일 외근 및 휴가 현황 통합표 (PDF 인쇄 시 2페이지로 강제 분리) */}
                <div className="pt-2 border-t border-slate-700/60 print:border-black space-y-3 print:break-before-page print:pt-6">
                  <h3 className="text-sm font-bold text-slate-200 print:text-black flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-amber-400 print:hidden" />
                    [ 금주 외근 및 휴가 현황 (통합) ]
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse border border-slate-700 table-fixed print:border-black">
                      <thead>
                        <tr className="bg-slate-950 text-slate-200 border-b border-slate-700 font-bold text-center print:bg-gray-200 print:text-black print:border-black">
                          <th className="py-2.5 px-3 border border-slate-700 w-32 bg-slate-900 print:bg-gray-100 print:border-black">담당자</th>
                          <th className="py-2.5 px-3 border border-slate-700 w-20 bg-slate-900 print:bg-gray-100 print:border-black">구분</th>
                          {daysList.map(d => (
                            <th key={d} className="py-2.5 px-2 border border-slate-700 bg-slate-900/80 text-center w-28 print:bg-gray-100 print:border-black">{d}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/80 text-slate-200 print:text-black print:divide-black">
                        {getSortedTeams(teamReports).map(tName => {
                          const reportsInTeam = teamReports.filter(r => r.teamName === tName);
                          const sortedReports = getSortedReportsByRank(reportsInTeam);

                          return sortedReports.map(rep => (
                            <React.Fragment key={rep.id}>
                              {/* 외근 일정 Row (텍스트 자동 줄바꿈 및 칸 위아래 자동 확장) */}
                              <tr className="hover:bg-slate-800/40 print:hover:bg-transparent">
                                <td rowSpan={2} className="py-2 px-3 border border-slate-700 font-bold text-center align-middle bg-slate-900/30 print:border-black print:bg-transparent">
                                  {rep.memberName} {rep.memberRank}
                                  <span className="block text-[10px] text-slate-400 print:text-gray-600 font-normal">{rep.teamName}</span>
                                </td>
                                <td className="py-2 px-3 border border-slate-700 font-semibold text-amber-400 text-center bg-slate-900/20 print:text-black print:border-black print:bg-transparent">
                                  외근
                                </td>
                                {daysList.map(day => (
                                  <td key={day} className="py-2 px-2 border border-slate-700 text-center text-[11px] break-words whitespace-normal leading-tight print:border-black">
                                    {rep.weeklyOutings[day]?.active ? (
                                      <span className="text-amber-300 print:text-black font-medium">
                                        {rep.weeklyOutings[day]?.note || '외근'}
                                      </span>
                                    ) : (
                                      <span className="text-slate-600 print:text-gray-400">-</span>
                                    )}
                                  </td>
                                ))}
                              </tr>
                              {/* 휴가 일정 Row */}
                              <tr className="hover:bg-slate-800/40 border-b border-slate-700 print:border-black print:hover:bg-transparent">
                                <td className="py-2 px-3 border border-slate-700 font-semibold text-purple-400 text-center bg-slate-900/20 print:text-black print:border-black print:bg-transparent">
                                  휴가
                                </td>
                                {daysList.map(day => (
                                  <td key={day} className="py-2 px-2 border border-slate-700 text-center text-[11px] break-words whitespace-normal leading-tight print:border-black">
                                    {rep.weeklyVacations[day]?.type !== '없음' ? (
                                      <span className="bg-purple-950/60 text-purple-300 border border-purple-800/50 px-1.5 py-0.5 rounded font-medium print:bg-transparent print:text-black print:border-none">
                                        {rep.weeklyVacations[day]?.type}
                                      </span>
                                    ) : (
                                      <span className="text-slate-600 print:text-gray-400">-</span>
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
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users className="w-6 h-6 text-blue-400" />
                  팀 주간업무보고 취합 대시보드
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  제출된 모든 주간보고서를 삭제하거나 자동 정리를 설정합니다.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handlePrintPDF}
                  className="bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg transition flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>대쉬 보드 PDF 인쇄</span>
                </button>
              </div>
            </div>

            {/* 자동 삭제 설정 패널 */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <div>
                  <h4 className="text-xs font-bold text-slate-200">대시보드 데이터 자동 삭제 설정</h4>
                  <p className="text-[11px] text-slate-400">지정된 요일/시간 또는 경과 시간에 맞춰 데이터를 자동 정리합니다.</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select 
                  value={autoDeleteMode} 
                  onChange={(e) => setAutoDeleteMode(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
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
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200"
                    >
                      {daysList.map(d => <option key={d} value={d}>{d}요일</option>)}
                    </select>
                    <input 
                      type="time" 
                      value={autoDeleteTime}
                      onChange={(e) => setAutoDeleteTime(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200"
                    />
                  </div>
                )}

                {autoDeleteMode === 'interval' && (
                  <select 
                    value={autoDeleteInterval} 
                    onChange={(e) => setAutoDeleteInterval(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200"
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
                <div key={report.id} className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 shadow-lg space-y-4 relative flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-600/20 text-blue-400 border border-blue-500/30 px-2.5 py-1 rounded-lg text-xs font-bold">
                          {report.teamName}
                        </span>
                        <span className="font-bold text-white text-sm">{report.memberName} {report.memberRank}</span>
                      </div>
                      <button
                        onClick={() => setTeamReports(prev => prev.filter(r => r.id !== report.id))}
                        className="text-slate-400 hover:text-red-400 transition p-1"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-3 pt-3 text-xs">
                      <div>
                        <h4 className="font-bold text-slate-400 mb-1">지난주 주요 업무</h4>
                        <ul className="list-disc list-inside text-slate-300 space-y-1">
                          {report.lastWeekTasks.map((t, idx) => (
                            <li key={idx}>{t.content || '-'}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-400 mb-1">이번주 예정 업무</h4>
                        <ul className="list-disc list-inside text-slate-300 space-y-1">
                          {report.thisWeekTasks.map((t, idx) => (
                            <li key={idx}>{t.content || '-'}</li>
                          ))}
                        </ul>
                      </div>

                      {report.otherNotes && (
                        <div>
                          <h4 className="font-bold text-slate-400 mb-1">기타 보고사항</h4>
                          <p className="text-slate-300 text-[11px] bg-slate-900/50 p-2 rounded-lg border border-slate-700/50">{report.otherNotes}</p>
                        </div>
                      )}

                      {getOutingsSummary(report.weeklyOutings) && (
                        <div>
                          <h4 className="font-bold text-amber-400 mb-0.5">금주 외근 일정</h4>
                          <p className="text-slate-300 text-[11px]">{getOutingsSummary(report.weeklyOutings)}</p>
                        </div>
                      )}

                      {getVacationsSummary(report.weeklyVacations) && (
                        <div>
                          <h4 className="font-bold text-purple-400 mb-0.5">금주 휴가 일정</h4>
                          <p className="text-slate-300 text-[11px]">{getVacationsSummary(report.weeklyVacations)}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-700/60 text-[10px] text-slate-500 flex justify-between items-center">
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