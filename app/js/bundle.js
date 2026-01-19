/**
 * CalmDash 생산성 허브 - 메인 프로그램 스크립트
 * 
 * 이 프로그램은 루틴, 일정, 할 일 목록을 관리하며 모든 데이터를 사용자의 브라우저에 안전하게 저장합니다.
 * 주요 기능: 데이터 저장 및 불러오기, 화면 그리기, 내보내기/가져오기 등
 * 
 * [최근 업데이트 - 2026-01-03]
 * - 할 일 정렬 기능 (우선순위/마감일순) 추가 및 선택적 입력 지원
 * - 모든 섹션의 카드 디자인 통일 및 화면 공간 최적화 (Compact Mode)
 * - JSON 파일 내보내기/가져오기 기능 추가로 데이터 백업 가능
 */

// --- 1. 기본 설정 데이터 ---
// 앱을 처음 실행했을 때 사용자에게 보여줄 예시 데이터들입니다.
const INITIAL_DATA = {
    // 매일 또는 특정 요일에 반복되는 습관들
    routines: [
        { id: 'r1', title: '아침 약 복용', time: '07:30', isCompleted: false, repeat: '매일' },
        { id: 'r2', title: '학교 가방 싸기', time: '08:00', isCompleted: true, repeat: '매일' },
        { id: 'r3', title: '식물 물 주기', time: '09:00', isCompleted: false, repeat: '매주' },
        { id: 'r4', title: '일일 보고서 제출', time: '17:00', isCompleted: false, repeat: '매일' },
        { id: 'r5', title: '분리수거', time: '19:00', isCompleted: false, repeat: '수요일' }
    ],
    // 정해진 날짜와 시간에 수행하는 약속이나 계획들
    schedules: [
        { id: 's1', title: '치과 예약', start: '10:00', end: '11:00', isAllDay: false, dateOffset: 0 },
        { id: 's2', title: '팀 회의', start: '14:00', end: '15:00', isAllDay: false, dateOffset: 0 },
        { id: 's3', title: '외식', start: '18:30', end: '20:00', isAllDay: false, dateOffset: 1 },
        { id: 's4', title: '장보기', start: '00:00', end: '23:59', isAllDay: true, dateOffset: 0 }
    ],
    // 기한 내에 완료해야 하는 개별 작업들
    todos: [
        { id: 't1', title: '전기 요금 납부', dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0], priority: 'high', isCompleted: false },
        { id: 't2', title: '생일 선물 구매', dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0], priority: 'medium', isCompleted: false },
        { id: 't3', title: '수학 숙제', dueDate: new Date(Date.now() + 1 * 86400000).toISOString().split('T')[0], priority: 'high', isCompleted: false },
        { id: 't4', title: '차고 청소', dueDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0], priority: 'low', isCompleted: false }
    ],
    // 앱 설정값들
    settings: {
        sectionOrder: ['routines', 'todos', 'schedules'], // 섹션 순서
        visibleSections: { // 각 섹션 표시 여부
            routines: true,
            todos: true,
            schedules: true
        },
        dateFormat: 'YYYY. MM. DD. (ddd)', // 날짜 표시 형식
        timeFormat: 'HH:mm' // 시간 표시 형식
    }
};

// --- 2. 도우미 도구들 ---

/**
 * @function escapeHtml
 * @description XSS 공격을 방어하기 위해 HTML 특수문자를 인코딩합니다.
 * @param {string} text 인코딩할 텍스트
 * @returns {string} HTML 인코딩된 안전한 텍스트
 */
function escapeHtml(text) {
    if (text == null) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * @function generateUUID
 * @description 각 항목(루틴, 할 일 등)을 구별하기 위한 고유한 '이름표(ID)'를 만듭니다.
 * @returns {string} 새로 만들어진 겹치지 않는 고유한 이름표 문자열
 */
function generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// --- 3. 데이터 창고 (Store): 정보를 저장하고 불러오는 역할을 합니다. ---

class Store {
    /**
     * @constructor
     * @description 데이터 창고를 준비합니다. 저장할 위치를 정하고 이전 데이터를 가져옵니다.
     */
    constructor() {
        this.STORAGE_KEY = 'productivity_hub_data_v1';
        this.listeners = []; // 정보가 바뀌면 화면에 알려주기 위해 등록된 명단
        this.data = this.load(); // 창고에서 정보 꺼내오기
    }

    /**
     * @method load
     * @description 금고(저장소)에서 예전에 저장했던 정보를 읽어옵니다. 정보가 하나도 없다면 샘플 데이터를 보여줍니다.
     * @returns {Object} 불러온 전체 정보 꾸러미
     */
    load() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // 새로 추가된 설정 기능이 기존 데이터에 없을 경우를 위해 보완합니다.
                if (!parsed.settings) {
                    parsed.settings = JSON.parse(JSON.stringify(INITIAL_DATA.settings));
                }
                return parsed;
            }
        } catch (e) {
            console.warn('LocalStorage access denied or failed:', e);
        }

        // 처음 방문했다면 예시 데이터를 준비합니다.
        this.isFirstTime = true;
        return JSON.parse(JSON.stringify(INITIAL_DATA));
    }

    /**
     * @method save
     * @description 현재 정보를 금고(저장소)에 안전하게 넣고, 화면에 "새로운 정보로 다시 그려라!"라고 신호를 줍니다.
     */
    save() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
        } catch (e) {
            console.warn('LocalStorage save failed:', e);
        }
        this.notify();
    }

    /**
     * @method subscribe
     * @description 정보가 바뀔 때마다 실행할 '화면 그리기 약속'을 등록합니다.
     * @param {Function} listener 정보가 바뀔 때마다 실행될 동작
     */
    subscribe(listener) {
        this.listeners.push(listener);
        listener(this.data);
    }

    /**
     * @method notify
     * @description 정보를 기다리고 있는 모든 곳(약속된 리스트)에 새로운 정보를 전달합니다.
     */
    notify() {
        this.listeners.forEach(l => l(this.data));
    }


    /**
     * @method addRoutine
     * @description 새로운 루틴(반복 습관)을 목록에 추가합니다.
     * @param {Object} routine 추가하고 싶은 새로운 루틴 정보
     */
    addRoutine(routine) {
        this.data.routines.push({ ...routine, id: generateUUID(), isCompleted: false });
        this.save();
    }

    /**
     * @method toggleRoutine
     * @description 루틴을 완료했는지 안 했는지 체크 표시 상태를 바꿉니다.
     * @param {string} id 바꿀 루틴의 이름표(ID)
     */
    toggleRoutine(id) {
        const item = this.data.routines.find(r => r.id === id);
        if (item) {
            item.isCompleted = !item.isCompleted;
            this.save();
        }
    }

    /**
     * @method addSchedule
     * @description 새로운 일정(약속)을 하나 추가합니다.
     * @param {Object} schedule 새로운 일정 정보
     */
    addSchedule(schedule) {
        this.data.schedules.push({ ...schedule, id: generateUUID() });
        this.save();
    }

    /**
     * @method addTodo
     * @description 새로운 할 일을 하나 추가합니다.
     * @param {Object} todo 새로운 할 일 정보
     */
    addTodo(todo) {
        this.data.todos.push({ ...todo, id: generateUUID(), isCompleted: false });
        this.save();
    }

    /**
     * @method toggleTodo
     * @description 할 일을 끝냈는지 표시를 바꿉니다.
     * @param {string} id 바꿀 할 일의 이름표(ID)
     */
    toggleTodo(id) {
        const item = this.data.todos.find(t => t.id === id);
        if (item) {
            item.isCompleted = !item.isCompleted;
            this.save();
        }
    }

    /**
     * @method updateItem
     * @description 이미 적은 정보의 내용을 고칩니다 (예: 제목 오타 수정).
     * @param {string} type 루틴, 일정, 할 일 중 어떤 것인지
     * @param {string} id 고칠 항목의 이름표
     * @param {Object} newData 바꿀 새로운 내용들
     */
    updateItem(type, id, newData) {
        let collection;
        if (type === 'routine') collection = this.data.routines;
        else if (type === 'schedule') collection = this.data.schedules;
        else if (type === 'todo') collection = this.data.todos;

        const index = collection.findIndex(item => item.id === id);
        if (index !== -1) {
            collection[index] = { ...collection[index], ...newData };
            this.save();
        }
    }

    /**
     * @method deleteItem
     * @description 항목을 영구적으로 목록에서 지웁니다.
     * @param {string} type 어떤 항목인지
     * @param {string} id 지울 항목의 이름표
     */
    deleteItem(type, id) {
        console.log(`[Store] Attempting to delete ${type} with id: ${id}`);
        try {
            if (type === 'routine') {
                this.data.routines = this.data.routines.filter(r => r.id !== id);
            } else if (type === 'schedule') {
                this.data.schedules = this.data.schedules.filter(s => s.id !== id);
            } else if (type === 'todo') {
                this.data.todos = this.data.todos.filter(t => t.id !== id);
            }
            this.save();
        } catch (error) {
            console.error(`[Store] Error deleting ${type}:`, error);
        }
    }

    /**
     * @method exportJSON
     * @description 현재 저장된 모든 정보를 파일로 만들어서 컴퓨터로 꺼내옵니다 (백업용).
     */
    exportJSON() {
        try {
            const dataStr = JSON.stringify(this.data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            link.href = url;
            link.download = `calmdash-data-${timestamp}.json`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error('Export failed:', e);
            alert('데이터 내보내기에 실패했습니다.');
        }
    }

    /**
     * @method importJSON
     * @description 백업해두었던 파일에서 정보를 읽어와 앱에 다시 넣습니다.
     * @param {File} file 읽어올 JSON 파일
     */
    importJSON(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                // 가져온 정보가 진짜인지, 내용물은 다 있는지 확인합니다.
                if (importedData.routines && importedData.schedules && importedData.todos) {
                    this.data = importedData;
                    this.save();
                    alert('데이터를 성공적으로 가져왔습니다.');
                } else {
                    throw new Error('Invalid data structure');
                }
            } catch (err) {
                console.error('Import failed:', err);
                alert('잘못된 JSON 파일 형식이거나 데이터가 손상되었습니다.');
            }
        };
        reader.readAsText(file);
    }

    /**
     * @method updateSettings
     * @description 사용자가 변경한 설정값을 저장소에 반영합니다.
     * @param {Object} newSettings 새로 바꿀 설정 정보
     */
    updateSettings(newSettings) {
        this.data.settings = { ...this.data.settings, ...newSettings };
        this.save();
    }
}

/**
 * @function showConfirmModal
 * @description 정말 실행할 것인지 한 번 더 물어보는 확인창을 화면에 띄웁니다.
 * @param {string} message 물어볼 말씀
 * @param {Function} onConfirm OK를 눌렀을 때 실행할 동작
 */
function showConfirmModal(message, onConfirm) {
    const overlay = document.getElementById('modal-overlay');
    if (!overlay) return;
    overlay.innerHTML = '';
    overlay.classList.remove('hidden');

    const modal = document.createElement('div');
    modal.className = 'bg-white p-6 border-4 border-black shadow-hard rounded-none mx-4 w-full max-w-sm modal-content';

    // message에 HTML 태그가 의도적으로 포함된 경우(예: <br>, <strong>)를 허용하되,
    // 사용자 입력이 아닌 내부 메시지에만 사용되므로 현재 상태 유지
    // 만약 사용자 입력이 message에 포함될 경우 escapeHtml 적용 필요
    modal.innerHTML = `
        <div class="mb-6">
            <h3 class="text-xl font-black mb-2">⚠️ 확인</h3>
            <p class="text-gray-700">${message}</p>
        </div>
        <div class="flex justify-end gap-3">
            <button id="confirm-cancel-btn" class="e-btn bg-white border-gray-400 text-gray-700">취소</button>
            <button id="confirm-ok-btn" class="e-btn primary">확인</button>
        </div>
    `;
    overlay.appendChild(modal);

    const close = () => overlay.classList.add('hidden');
    modal.querySelector('#confirm-cancel-btn').onclick = close;
    modal.querySelector('#confirm-ok-btn').onclick = () => {
        onConfirm();
        close();
    };
}

// --- 4. 화면 그리기 (Render): 데이터를 화면에 예쁘게 보여주는 역할입니다. ---

/**
 * @function renderRoutines
 * @description 루틴 목록을 받아서 화면에 목록을 하나하나 그려줍니다.
 * @param {Array} routines 보여줄 루틴 데이터 리스트
 * @param {string} containerId 리스트를 보여줄 화면 구역의 ID
 * @param {Object} events 정보 수정, 삭제 등을 처리하는 동작 약속
 * @param {boolean} showAll 모든 루틴을 다 보여줄지 여부
 */
function renderRoutines(routines, containerId, events, showAll = false) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    const btn = document.getElementById('toggle-routine-filter');
    if (btn) btn.textContent = showAll ? '전체 루틴 (오늘만 보기)' : '오늘의 루틴 (전체보기)';

    let displayRoutines = routines;
    if (!showAll) {
        // 오늘 요일 정보 계산
        const now = new Date();
        const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
        const todayName = days[now.getDay()];
        const isWeekend = now.getDay() === 0 || now.getDay() === 6;

        // 필터링 로직: 오늘에 해당하는 루틴만 추출
        displayRoutines = routines.filter(r => {
            if (r.repeat === '매일') return true;
            if (r.repeat === '평일' && !isWeekend) return true;
            if (r.repeat === '주말' && isWeekend) return true;
            if (r.repeat === todayName) return true;
            return false;
        });
    }

    // 시간 순으로 정렬
    const sorted = [...displayRoutines].sort((a, b) => a.time.localeCompare(b.time));
    const completedCount = sorted.filter(r => r.isCompleted).length;

    // 진행률 표시 업데이트
    const progressEl = document.getElementById('routine-progress');
    if (progressEl) progressEl.textContent = `${completedCount}/${sorted.length}`;

    if (sorted.length === 0) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-12 text-gray-400 border-2 border-dashed border-gray-200">
                <i class="ph ph-coffee text-4xl mb-2 opacity-30"></i>
                <div class="italic text-sm">현재 등록된 루틴이 없습니다.</div>
                <div class="text-xs mt-1">새로운 습관을 추가해보세요!</div>
            </div>`;
        return;
    }

    sorted.forEach(r => {
        const isCompleted = r.isCompleted;
        const nowHourMin = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
        const isLate = !isCompleted && r.time < nowHourMin; // 마감 시간이 지났는지 확인
        const card = document.createElement('div');
        card.className = `e-card p-2 px-3 flex flex-col gap-1 relative transition-all ${isCompleted ? 'opacity-60 grayscale bg-gray-50' : 'bg-white'} ${isLate ? 'border-l-8 border-l-black' : ''} hover:shadow-hard-sm`;

        card.innerHTML = `
            <div class="flex justify-between items-center">
                <div class="flex items-center gap-2">
                    <span class="e-badge bg-black text-white px-1.5 py-0 text-[9px]">${escapeHtml(r.repeat)}</span>
                    <span class="text-[11px] font-mono font-bold"><i class="ph ph-clock inline mr-1"></i>${escapeHtml(r.time)}</span>
                </div>
                <div class="flex gap-1">
                    <button data-id="${r.id}" class="edit-routine-btn p-1 text-gray-400 hover:text-black transition-colors" title="수정"><i class="ph ph-pencil-simple"></i></button>
                    <button data-id="${r.id}" class="delete-routine-btn p-1 text-gray-400 hover:text-red-500 transition-colors" title="삭제"><i class="ph ph-trash"></i></button>
                </div>
            </div>

            <div class="flex justify-between items-center gap-2">
                <div class="font-bold text-sm leading-tight truncate ${isCompleted ? 'line-through text-gray-500' : ''}">
                    ${escapeHtml(r.title)}
                    ${isLate ? '<span class="ml-1 bg-black text-white text-[9px] px-1 py-0.5">긴급</span>' : ''}
                </div>
                <button data-id="${r.id}" class="toggle-routine-btn e-btn ${isCompleted ? 'bg-gray-100' : 'primary'} text-[10px] py-1 px-2 flex-shrink-0 shadow-none border">
                    ${isCompleted ? '<i class="ph ph-check"></i>' : '완료'}
                </button>
            </div>
        `;
        const routineId = r.id;
        // 완료 토글 이벤트
        card.querySelector('.toggle-routine-btn').addEventListener('click', () => {
            console.log('Toggle routine:', routineId);
            events.onToggle(routineId);
        });
        // 수정 이벤트
        card.querySelector('.edit-routine-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            events.onEdit(r);
        });
        // 삭제 이벤트 (커스텀 확인 모달 사용)
        card.querySelector('.delete-routine-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('Click delete routine:', routineId);
            showConfirmModal('이 루틴을 정말 삭제하시겠습니까?', () => {
                events.onDelete(routineId);
            });
        });
        container.appendChild(card);
    });
}

/**
 * @function renderSchedules
 * @description 오늘과 내일의 중요 일정들을 화면에 차례대로 보여줍니다.
 * @param {Array} schedules 전체 일정 데이터 리스트
 * @param {string} containerId 화면 구역 ID
 * @param {Object} events 수정, 삭제 등의 동작 약속
 * @param {boolean} showAll 날짜 상관없이 전체를 다 보여줄지 여부
 */
function renderSchedules(schedules, containerId, events, showAll = false) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    const btn = document.getElementById('toggle-schedule-filter');
    if (btn) btn.textContent = showAll ? '전체 일정 (오늘&내일만)' : '오늘 & 내일 (전체보기)';

    let displaySchedules = schedules;
    if (!showAll) {
        // 오늘과 내일 날짜 계산
        const todayStr = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        // 오늘/내일 일정만 필터링
        displaySchedules = schedules.filter(s => s.date === todayStr || s.date === tomorrowStr);
    }

    // 날짜별 시작 시간 순 정렬
    const sorted = [...displaySchedules].sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.start.localeCompare(b.start);
    });
    if (sorted.length === 0) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-12 text-gray-400 border-2 border-dashed border-gray-200">
                <i class="ph ph-calendar-blank text-4xl mb-2 opacity-30"></i>
                <div class="italic text-sm">진행 중인 일정이 없습니다.</div>
                <div class="text-xs mt-1">오늘과 내일의 중요 일정을 기록하세요.</div>
            </div>`;
        return;
    }
    let currentDate = "";
    sorted.forEach(s => {
        // 날짜가 바뀌면 헤더 삽입
        if (s.date !== currentDate) {
            const dateObj = new Date(s.date);
            const todayStr = new Date().toISOString().split('T')[0];
            const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = tomorrow.toISOString().split('T')[0];

            let dayLabel = s.date;
            if (s.date === todayStr) dayLabel = "오늘";
            else if (s.date === tomorrowStr) dayLabel = "내일";

            const header = document.createElement('div');
            header.className = "text-xs font-black bg-gray-200 px-2 py-1 mt-2 border-y-2 border-black";
            header.textContent = `${dayLabel} 일정`;
            container.appendChild(header);
            currentDate = s.date;
        }

        const card = document.createElement('div');
        card.className = "e-card p-2 px-3 flex flex-col gap-1 bg-white relative hover:shadow-hard-sm transition-all";
        card.innerHTML = `
            <div class="flex justify-between items-center">
                <div class="flex items-center gap-2">
                    <span class="e-badge border border-black px-1 py-0 text-[8px] uppercase font-black">SCH</span>
                    <span class="text-[11px] font-mono text-gray-600 font-bold"><i class="ph ph-calendar inline mr-1"></i>${escapeHtml(s.date)}</span>
                </div>
                <div class="flex gap-1">
                    <button data-id="${s.id}" class="edit-schedule-btn p-1 text-gray-400 hover:text-black transition-colors" title="수정"><i class="ph ph-pencil-simple"></i></button>
                    <button data-id="${s.id}" class="delete-schedule-btn p-1 text-gray-400 hover:text-red-500 transition-colors" title="삭제"><i class="ph ph-trash"></i></button>
                </div>
            </div>

            <div class="flex justify-between items-end gap-2">
                <div class="font-bold text-base leading-tight truncate">${escapeHtml(s.title)}</div>
                <div class="text-[10px] font-bold font-mono bg-gray-100 px-1.5 py-0.5 border border-black flex-shrink-0">
                    ${s.isAllDay ? '종일' : `${escapeHtml(s.start)}-${escapeHtml(s.end)}`}
                </div>
            </div>
        `;
        const scheduleId = s.id;
        card.querySelector('.edit-schedule-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            events.onEdit(s);
        });
        card.querySelector('.delete-schedule-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('Click delete schedule:', scheduleId);
            showConfirmModal('이 일정을 정말 삭제하시겠습니까?', () => {
                events.onDelete(scheduleId);
            });
        });
        container.appendChild(card);
    });
}

/**
 * @function renderTodos
 * @description 할 일 목록을 중요도나 마감일 순서에 맞춰서 보여줍니다.
 * @param {Array} todos 할 일 데이터 리스트
 * @param {string} containerId 화면 구역 ID
 * @param {Object} events 완료 처리, 수정, 삭제 등의 동작 약속
 * @param {string} sortType 어떤 순서로 정렬할지 ('priority': 중요도순, 'date': 마감일순)
 */
function renderTodos(todos, containerId, events, sortType = 'priority') {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    // 완료되지 않은 항목만 표시
    const activeTodos = todos.filter(t => !t.isCompleted);

    // 정렬 로직
    activeTodos.sort((a, b) => {
        if (sortType === 'priority') {
            const pMap = { high: 1, medium: 2, low: 3, none: 4 };
            const pA = a.priority || 'none';
            const pB = b.priority || 'none';
            return pMap[pA] - pMap[pB];
        } else if (sortType === 'date') {
            // 날짜가 없는 경우 가장 뒤로 보냄
            if (!a.dueDate && !b.dueDate) return 0;
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return a.dueDate.localeCompare(b.dueDate);
        }
        return 0;
    });
    if (activeTodos.length === 0) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-12 text-gray-400 border-2 border-dashed border-gray-200">
                <i class="ph ph-sparkle text-4xl mb-2 opacity-30"></i>                
                <div class="italic text-sm font-bold"> 모든 할 일을 완료했습니다!</div>
                <div class="text-xs mt-1">잠시 여유를 즐겨보시는 건 어떨까요?</div>
            </div>`;
        return;
    }
    activeTodos.forEach(t => {
        let priorityText, priorityColor;
        const p = t.priority || 'none';

        if (p === 'high') { priorityText = '최고'; priorityColor = 'bg-black text-white'; }
        else if (p === 'medium') { priorityText = '중간'; priorityColor = 'bg-gray-400 text-white'; }
        else if (p === 'low') { priorityText = '낮음'; priorityColor = 'bg-white text-black border border-gray-400'; }
        else { priorityText = '미지정'; priorityColor = 'bg-gray-100 text-gray-500 border border-gray-200'; }

        const card = document.createElement('div');
        const borderColor = p === 'high' ? 'border-l-black' : p === 'medium' ? 'border-l-gray-400' : p === 'low' ? 'border-l-gray-200' : 'border-l-transparent';
        card.className = `e-card p-2 px-3 flex flex-col gap-1 relative bg-white border-l-8 ${borderColor} hover:shadow-hard-sm transition-all`;

        card.innerHTML = `
            <div class="flex justify-between items-center">
                <div class="flex items-center gap-2">
                    <span class="text-[9px] font-black uppercase px-2 py-0 border-2 border-black ${priorityColor}">${escapeHtml(priorityText)}</span>
                    <span class="text-[11px] font-mono font-bold text-gray-600">
                        <i class="ph ph-calendar-check inline mr-1"></i>
                        ${escapeHtml(t.dueDate) || '기한 없음'}
                    </span>
                </div>
                <div class="flex gap-1">
                    <button data-id="${t.id}" class="edit-todo-btn p-1 text-gray-400 hover:text-black transition-colors" title="수정"><i class="ph ph-pencil-simple"></i></button>
                    <button data-id="${t.id}" class="delete-todo-btn p-1 text-gray-400 hover:text-red-500 transition-colors" title="삭제"><i class="ph ph-trash"></i></button>
                </div>
            </div>

            <div class="flex justify-between items-center gap-2">
                <div class="font-bold text-sm leading-tight truncate">${escapeHtml(t.title)}</div>
                <button data-id="${t.id}" class="complete-todo-btn e-btn primary text-[10px] py-1 px-2 flex-shrink-0 shadow-none border">
                    완료
                </button>
            </div>
        `;
        const todoId = t.id;
        card.querySelector('.edit-todo-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            events.onEdit(t);
        });
        card.querySelector('.complete-todo-btn').addEventListener('click', () => {
            console.log('Complete todo:', todoId);
            events.onToggle(todoId);
        });
        card.querySelector('.delete-todo-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('Click delete todo:', todoId);
            showConfirmModal('이 할 일을 정말 삭제하시겠습니까?', () => {
                events.onDelete(todoId);
            });
        });
        container.appendChild(card);
    });
}

// --- 5. 프로그램 실행 준비 (App Start): 앱을 켜고 초기화하는 곳입니다. ---

const app = new Store();

/**
 * @function init
 * @description 앱이 켜지자마자 실행되는 함수입니다. 시계와 날씨를 켜고, 버튼에 기능을 부여합니다.
 */
function init() {
    initClock(); // 시계 돌리기 시작
    initWeather(); // 지금 날씨 가져오기
    setupEventListeners(); // 각 버튼에 "눌렀을 때 뭐 해라"라고 말해주기
    // 필터 및 정렬 상태 유지 (LocalStorage)
    let showAllRoutines = localStorage.getItem('calm_dash_show_all_routines') === 'true';
    let showAllSchedules = localStorage.getItem('calm_dash_show_all_schedules') === 'true';
    let todoSortType = localStorage.getItem('calm_dash_todo_sort') || 'priority';

    // 데이터 구독: 데이터 변경 시마다 화면 다시 그리기
    app.subscribe((data) => {
        renderRoutines(data.routines, 'routine-list', {
            onToggle: (id) => app.toggleRoutine(id),
            onDelete: (id) => app.deleteItem('routine', id),
            onEdit: (item) => showAddModal('routine', item)
        }, showAllRoutines);
        renderSchedules(data.schedules, 'schedule-list', {
            onDelete: (id) => app.deleteItem('schedule', id),
            onEdit: (item) => showAddModal('schedule', item)
        }, showAllSchedules);
        renderTodos(data.todos, 'todo-list', {
            onToggle: (id) => app.toggleTodo(id),
            onDelete: (id) => app.deleteItem('todo', id),
            onEdit: (item) => showAddModal('todo', item)
        }, todoSortType);
        // 섹션 순서 및 표시 여부 적용
        renderDashboardGrid(data.settings);
    });

    // 설정 버튼 이벤트 연결
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => showSettingsModal());
    }

    // 필터 및 정렬 토글 이벤트 연결
    document.getElementById('toggle-routine-filter').addEventListener('click', () => {
        showAllRoutines = !showAllRoutines;
        localStorage.setItem('calm_dash_show_all_routines', showAllRoutines);
        app.notify();
    });
    document.getElementById('toggle-schedule-filter').addEventListener('click', () => {
        showAllSchedules = !showAllSchedules;
        localStorage.setItem('calm_dash_show_all_schedules', showAllSchedules);
        app.notify();
    });

    // 할 일 정렬 이벤트 수동 등록 (setupEventListeners에서 처리하도록 변경 가능)
    const sortPriorityBtn = document.querySelector('[data-action="sort-priority"]');
    const sortDateBtn = document.querySelector('[data-action="sort-date"]');

    if (sortPriorityBtn) {
        sortPriorityBtn.addEventListener('click', () => {
            todoSortType = 'priority';
            localStorage.setItem('calm_dash_todo_sort', todoSortType);
            app.notify();
        });
    }
    if (sortDateBtn) {
        sortDateBtn.addEventListener('click', () => {
            todoSortType = 'date';
            localStorage.setItem('calm_dash_todo_sort', todoSortType);
            app.notify();
        });
    }

    // 테마 설정 복구
    const savedTheme = localStorage.getItem('calm_dash_theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        const icon = document.getElementById('theme-icon');
        if (icon) {
            icon.classList.remove('ph-sun');
            icon.classList.add('ph-moon');
        }
    }

    // 데이터 내보내기/가져오기 이벤트
    const exportBtn = document.getElementById('export-data-btn');
    const importBtn = document.getElementById('import-data-btn');
    const importInput = document.getElementById('import-file-input');

    if (exportBtn) {
        exportBtn.addEventListener('click', () => app.exportJSON());
    }

    if (importBtn && importInput) {
        importBtn.addEventListener('click', () => {
            showConfirmModal(
                '데이터를 가져오시겠습니까?<br><strong class="text-red-500">기존 브라우저의 모든 데이터가 삭제되고 파일 내용으로 대체됩니다.</strong>',
                () => importInput.click()
            );
        });

        importInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                app.importJSON(e.target.files[0]);
                e.target.value = ''; // 동일 파일 재선택 가능하게 초기화
            }
        });
    }

    // 최초 사용자 안내 모달 표시
    if (app.isFirstTime) {
        setTimeout(showGuideModal, 500);
    }
}

// 페이지 로드 시 실행
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

/**
 * @function setupEventListeners
 * @description 화면에 있는 여러 버튼들이 눌렸을 때 어떤 일을 할지 미리 약속해두는 함수입니다. (예: 추가 버튼 누르면 입력창 띄우기)
 */
function setupEventListeners() {
    // 항목 추가 버튼들 (data-action 속성 기준)
    document.querySelectorAll('[data-action^="add-"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = e.target.closest('button').dataset.action;
            const type = action.replace('add-', '');
            showAddModal(type);
        });
    });

    // 테마 토글 버튼
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    if (themeToggle && themeIcon) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
            const isDark = document.body.classList.contains('dark-theme');
            localStorage.setItem('calm_dash_theme', isDark ? 'dark' : 'normal');

            // 아이콘 교체
            if (isDark) {
                themeIcon.classList.remove('ph-sun');
                themeIcon.classList.add('ph-moon');
            } else {
                themeIcon.classList.remove('ph-moon');
                themeIcon.classList.add('ph-sun');
            }
        });
    }

    // 스토리지 정보 안내
    const storageTrigger = document.getElementById('storage-info-trigger');
    if (storageTrigger) {
        storageTrigger.addEventListener('click', () => {
            showStorageInfoModal();
        });
    }
}

// --- 6. 부가 정보 데이터 (Weather Data): 날씨 아이콘과 이름표들입니다. ---

// 날씨 코드(번호)에 맞춰 어떤 아이콘과 이름을 보여줄지 정해둔 목록입니다. (Open-Meteo 기준)
const WEATHER_ICONS = {
    0: { icon: 'ph-sun', text: '맑음' },
    1: { icon: 'ph-sun-horizon', text: '대체로 맑음' },
    2: { icon: 'ph-cloud-sun', text: '구름 조금' },
    3: { icon: 'ph-cloud', text: '흐림' },
    45: { icon: 'ph-cloud-fog', text: '안개' },
    48: { icon: 'ph-cloud-fog', text: '안개' },
    51: { icon: 'ph-cloud-rain', text: '이슬비' },
    53: { icon: 'ph-cloud-rain', text: '이슬비' },
    55: { icon: 'ph-cloud-rain', text: '이슬비' },
    61: { icon: 'ph-cloud-rain', text: '비' },
    63: { icon: 'ph-cloud-rain', text: '약한 비' },
    65: { icon: 'ph-cloud-rain', text: '강한 비' },
    71: { icon: 'ph-cloud-snow', text: '눈' },
    73: { icon: 'ph-cloud-snow', text: '눈' },
    75: { icon: 'ph-cloud-snow', text: '강한 눈' },
    77: { icon: 'ph-cloud-snow', text: '눈발' },
    80: { icon: 'ph-cloud-rain', text: '소나기' },
    81: { icon: 'ph-cloud-rain', text: '강한 소나기' },
    82: { icon: 'ph-cloud-rain', text: '폭우' },
    95: { icon: 'ph-cloud-lightning', text: '뇌우' }
};

/**
 * @function initWeather
 * @description 지금 내가 있는 곳의 날씨 정보를 가져와서 화면에 보여줍니다.
 * 1. 예전에 확인했던 위치 정보가 있다면 그대로 씁니다 (속도 향상).
 * 2. 정보가 없다면 GPS나 IP 주소를 통해 현재 위치를 찾습니다.
 * 3. 찾은 위치의 기온과 하늘 상태(맑음, 비 등)를 화면에 표시합니다.
 */
async function initWeather() {
    const weatherElement = document.getElementById('live-weather');
    if (!weatherElement) return;

    const CACHE_KEY = 'calm_dash_location_cache';
    const CACHE_DURATION = 3 * 60 * 60 * 1000; // 3시간 동안은 같은 위치 정보를 사용합니다.

    try {
        let lat, lon, city;

        // 1. 캐시된 위치 정보 확인
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
            const { lat: cLat, lon: cLon, city: cCity, timestamp } = JSON.parse(cachedData);
            if (Date.now() - timestamp < CACHE_DURATION) {
                lat = cLat;
                lon = cLon;
                city = cCity;
                console.log('[Weather] Using cached location:', city);
            }
        }

        // 2. 캐시가 없거나 만료된 경우 신규 위치 정보 가져오기
        if (!lat || !lon) {
            weatherElement.innerHTML = `<span class="animate-pulse text-gray-400 italic">위치 확인 중...</span>`;

            const getPosition = () => {
                return new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 5000,
                        maximumAge: 3600000 // 브라우저 자체 캐시 활용 (1시간)
                    });
                });
            };

            try {
                const pos = await getPosition();
                lat = pos.coords.latitude;
                lon = pos.coords.longitude;

                const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=ko`);
                const geoData = await geoRes.json();
                city = geoData.city || geoData.locality || "내 주변";

                // 새로운 위치 정보 캐싱
                localStorage.setItem(CACHE_KEY, JSON.stringify({ lat, lon, city, timestamp: Date.now() }));
            } catch (geoError) {
                console.warn('Geolocation failed, falling back to IP or last cache:', geoError);

                // GPS 실패 시 기존 캐시가 있다면 만료되었더라도 사용
                if (cachedData) {
                    const { lat: cLat, lon: cLon, city: cCity } = JSON.parse(cachedData);
                    lat = cLat; lon = cLon; city = cCity;
                } else {
                    // 캐시도 없으면 IP 기반 위치 확인
                    const locRes = await fetch('https://ipapi.co/json/');
                    const locData = await locRes.json();
                    if (locData.city) {
                        lat = locData.latitude;
                        lon = locData.longitude;
                        city = locData.city;
                    } else {
                        throw new Error('위치 정보를 가져올 수 없습니다.');
                    }
                }
            }
        }

        // 3. Open-Meteo API로 날씨 조회
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const weatherData = await weatherRes.json();

        const current = weatherData.current_weather;
        const info = WEATHER_ICONS[current.weathercode] || { icon: 'ph-cloud', text: '날씨 정보 없음' };

        weatherElement.innerHTML = `
            <i class="ph ${info.icon} text-xl"></i>
            <span>${city} ${info.text} ${Math.round(current.temperature)}°C</span>
        `;
    } catch (error) {
        console.error('Weather fetch failed:', error);
        weatherElement.innerHTML = `<span class="text-gray-400">날씨 불러오기 실패</span>`;
    }
}

/**
 * @function initClock
 * @description 실시간 시계와 오늘 날짜를 화면에 보여주기 시작합니다. 1분마다 한 번씩 시간을 확인해서 바꿉니다.
 */
function initClock() {
    const updateTime = () => {
        const now = new Date();
        const clockElement = document.getElementById('live-clock');
        const dateElement = document.getElementById('live-date');

        const settings = app.data.settings;

        if (clockElement) clockElement.textContent = formatTime(now, settings.timeFormat);
        if (dateElement) dateElement.textContent = formatDate(now, settings.dateFormat);
    };
    setInterval(updateTime, 10000); // 10초마다 업데이트 (초 단위가 없으므로 10초면 충분)
    updateTime();
}

/**
 * @function getTimeSelectorHTML
 * @description 모달 창에서 '몇 시 몇 분'을 고를 수 있는 선택 상자들을 만듭니다.
 * @param {string} prefix 이름표 앞에 붙을 말 (예: 시작 시간, 종료 시간 구분용)
 * @param {string} defaultHour 처음에 보여줄 시간
 * @param {string} defaultMin 처음에 보여줄 분
 * @returns {string} 완성된 선택 상자 HTML 코드
 */
function getTimeSelectorHTML(prefix, defaultHour = "08", defaultMin = "00") {
    const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
    const mins = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

    return `
        <div class="flex items-center gap-2">
            <select name="${prefix}_hour" class="flex-grow p-2 border-2 border-black font-mono">
                ${hours.map(h => `<option value="${h}" ${h === defaultHour ? 'selected' : ''}>${h}시</option>`).join('')}
            </select>
            <span class="font-bold">:</span>
            <select name="${prefix}_min" class="flex-grow p-2 border-2 border-black font-mono">
                ${mins.map(m => `<option value="${m}" ${m === defaultMin ? 'selected' : ''}>${m}분</option>`).join('')}
            </select>
        </div>
    `;
}

/**
 * @function showAddModal
 * @description 새로운 일정을 적거나, 기존 내용을 고칠 수 있는 팝업창(모달)을 띄웁니다.
 * @param {string} type 어떤 것을 추가/수정하는지 ('routine': 루틴, 'schedule': 일정, 'todo': 할 일)
 * @param {Object|null} editItem 고칠 내용이 있다면 그 정보, 새로 만드는 것이라면 아무것도 없음
 */
function showAddModal(type, editItem = null) {
    const overlay = document.getElementById('modal-overlay');
    if (!overlay) return;
    overlay.innerHTML = '';
    overlay.classList.remove('hidden');

    const modal = document.createElement('div');
    modal.className = 'bg-white p-6 border-4 border-black shadow-hard rounded-none mx-4 w-full max-w-lg modal-content';

    let title = editItem ? editItem.title : '';
    let formFields = '';

    if (type === 'routine') {
        const [h, m] = editItem ? editItem.time.trim().split(':') : ["08", "00"];
        formFields = `
             <div class="mb-4"><label class="block font-bold mb-1">목표 루틴</label><input type="text" name="title" required value="${escapeHtml(title)}" placeholder="예: 영양제 챙겨먹기" class="w-full"></div>
             <div class="grid grid-cols-2 gap-4 mb-4">
                <div><label class="block font-bold mb-1">수행 시간</label>${getTimeSelectorHTML('time', h, m)}</div>
                <div><label class="block font-bold mb-1">반복 일정</label><select name="repeat" class="w-full p-2 border-2 border-black">
                    ${['매일', '평일', '주말', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일'].map(r => `<option ${editItem && editItem.repeat === r ? 'selected' : ''}>${escapeHtml(r)}</option>`).join('')}
                </select></div>
             </div>`;
    } else if (type === 'schedule') {
        const [sh, sm] = editItem ? editItem.start.trim().split(':') : ["09", "00"];
        const [eh, em] = editItem ? editItem.end.trim().split(':') : ["10", "00"];
        const date = editItem ? editItem.date : new Date().toISOString().split('T')[0];
        const isAllDay = editItem ? editItem.isAllDay : false;

        formFields = `
            <div class="mb-4"><label class="block font-bold mb-1">일정 제목</label><input type="text" name="title" required value="${escapeHtml(title)}" placeholder="예: 운동 하기" class="w-full"></div>
            <div class="mb-4"><label class="block font-bold mb-1">날짜 선택</label><input type="date" name="date" required value="${escapeHtml(date)}" class="w-full p-2 border-2 border-black"></div>
            <div class="mb-4 flex items-center gap-2">
                <input type="checkbox" id="isAllDay" name="isAllDay" ${isAllDay ? 'checked' : ''} class="w-5 h-5 border-2 border-black">
                <label for="isAllDay" class="font-bold cursor-pointer">종일 일정</label>
            </div>
            <div id="time-range-container" class="grid grid-cols-2 gap-4 mb-6 ${isAllDay ? 'opacity-30 pointer-events-none' : ''}">
                <div><label class="block font-bold mb-1">시작 시간</label>${getTimeSelectorHTML('start', sh, sm)}</div>
                <div><label class="block font-bold mb-1">종료 시간</label>${getTimeSelectorHTML('end', eh, em)}</div>
            </div>`;
    } else if (type === 'todo') {
        const dueDate = editItem ? (editItem.dueDate || '') : '';
        formFields = `
            <div class="mb-4"><label class="block font-bold mb-1">할 일 내용</label><input type="text" name="title" required value="${escapeHtml(title)}" placeholder="예: 전기 요금 납부" class="w-full"></div>
            <div class="grid grid-cols-2 gap-4 mb-6">
                <div><label class="block font-bold mb-1">마감 기한 (선택)</label><input type="date" name="dueDate" value="${escapeHtml(dueDate)}" class="w-full p-2 border-2 border-black"></div>
                <div><label class="block font-bold mb-1">중요도 (선택)</label><select name="priority" class="w-full p-2 border-2 border-black">
                    <option value="none" ${(!editItem || editItem.priority === 'none') ? 'selected' : ''}>미지정</option>
                    <option value="high" ${editItem && editItem.priority === 'high' ? 'selected' : ''}>최고 (중요/긴급)</option>
                    <option value="medium" ${editItem && editItem.priority === 'medium' ? 'selected' : ''}>중간</option>
                    <option value="low" ${editItem && editItem.priority === 'low' ? 'selected' : ''}>낮음</option>
                </select></div>
            </div>`;
    }

    modal.innerHTML = `
        <div class="flex justify-between items-center border-b-2 border-black pb-3 mb-4">
            <h3 class="text-2xl font-black uppercase">${editItem ? '정보 수정' : `새 ${type === 'routine' ? '루틴' : type === 'schedule' ? '일정' : '할 일'} 추가`}</h3>
            <button id="close-modal-btn" class="e-btn p-1 h-8 w-8 text-xl flex items-center justify-center"><i class="ph ph-x"></i></button>
        </div>
        <form id="add-form">
            ${formFields}
            <div class="flex justify-end gap-3 pt-4 border-t-2 border-gray-200">
                <button type="button" id="cancel-modal-btn" class="e-btn bg-white border-gray-400 text-gray-700">취소</button>
                <button type="submit" class="e-btn primary"><i class="ph ph-floppy-disk"></i> ${editItem ? '저장하기' : '추가하기'}</button>
            </div>
        </form>
    `;
    overlay.appendChild(modal);

    const close = () => overlay.classList.add('hidden');

    if (type === 'schedule') {
        const checkbox = modal.querySelector('#isAllDay');
        const timeContainer = modal.querySelector('#time-range-container');
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) timeContainer.classList.add('opacity-30', 'pointer-events-none');
            else timeContainer.classList.remove('opacity-30', 'pointer-events-none');
        });
    }

    modal.querySelector('#close-modal-btn').onclick = close;
    modal.querySelector('#cancel-modal-btn').onclick = close;
    modal.querySelector('#add-form').onsubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const rawData = Object.fromEntries(formData.entries());

        if (!rawData.title || rawData.title.trim() === '') {
            alert('내용을 입력해 주세요.');
            return;
        }

        const data = { ...rawData };

        if (type === 'routine') {
            data.time = `${rawData.time_hour}:${rawData.time_min}`;
            if (editItem) app.updateItem('routine', editItem.id, data);
            else app.addRoutine(data);
        } else if (type === 'schedule') {
            data.start = `${rawData.start_hour}:${rawData.start_min}`;
            data.end = `${rawData.end_hour}:${rawData.end_min}`;
            data.date = rawData.date;
            data.isAllDay = rawData.isAllDay === 'on';
            if (editItem) app.updateItem('schedule', editItem.id, data);
            else app.addSchedule(data);
        } else if (type === 'todo') {
            if (editItem) app.updateItem('todo', editItem.id, data);
            else app.addTodo(data);
        }
        close();
    };
}


// --- 가이드 및 안내 모달 ---

/**
 * @function showGuideModal
 * @description 앱을 처음 써보는 분들을 위해 사용법을 알려주는 환영 인사 창을 띄웁니다.
 */
function showGuideModal() {
    const overlay = document.getElementById('modal-overlay');
    if (!overlay) return;
    overlay.innerHTML = '';
    overlay.classList.remove('hidden');

    const modal = document.createElement('div');
    modal.className = 'bg-white p-6 border-4 border-black shadow-hard rounded-none mx-4 w-full max-w-md modal-content';
    modal.innerHTML = `
        <div class="mb-6">
            <h3 class="text-2xl font-black mb-4">👋 처음 오셨나요?</h3>
            <p class="text-gray-700 mb-3 font-bold">CalmDash에 오신 것을 환영합니다!</p>
            <ul class="text-sm text-gray-600 list-disc list-inside space-y-2 mb-4">
                <li>이 서비스는 개인용 생산성 관리 도구입니다.</li>
                <li>모든 데이터는 브라우저 내부에 안전하게 저장됩니다.</li>
                <li>현재 보고 계신 내용은 예시 데이터입니다.</li>
                <li>직접 본인의 루틴과 일정을 추가해 보세요!</li>
            </ul>
        </div>
        <div class="flex justify-end">
            <button id="guide-close-btn" class="e-btn primary">시작하기</button>
        </div>
    `;
    overlay.appendChild(modal);
    modal.querySelector('#guide-close-btn').onclick = () => overlay.classList.add('hidden');
}

/**
 * @function showStorageInfoModal
 * @description 내 정보가 어디에 저장되는지 궁금해하는 분들을 위해 안내 창을 띄웁니다.
 */
function showStorageInfoModal() {
    const overlay = document.getElementById('modal-overlay');
    if (!overlay) return;
    overlay.innerHTML = '';
    overlay.classList.remove('hidden');

    const modal = document.createElement('div');
    modal.className = 'bg-white p-6 border-4 border-black shadow-hard rounded-none mx-4 w-full max-w-sm modal-content';
    modal.innerHTML = `
        <div class="mb-6">
            <h3 class="text-xl font-black mb-2"><i class="ph ph-hard-drive inline mr-2"></i> 데이터 저장 안내</h3>
            <p class="text-sm text-gray-700 leading-relaxed">
                CalmDash는 별도의 서버 없이 사용자의 <strong>웹브라우저 로컬 저장소(LocalStorage)</strong>에 모든 데이터를 보관합니다.
                <br><br>
                따라서 브라우저 캐시를 삭제하거나 시크릿 모드에서 실행할 경우 데이터가 소실될 수 있으니 주의해 주세요.
            </p>
        </div>
        <div class="flex justify-end">
            <button id="storage-close-btn" class="e-btn">닫기</button>
        </div>
    `;
    overlay.appendChild(modal);
    modal.querySelector('#storage-close-btn').onclick = () => overlay.classList.add('hidden');
}

/**
 * @function formatDate
 * @description 날짜를 원하는 형식으로 바꿔줍니다.
 */
function formatDate(date, format) {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const ddd = days[date.getDay()];
    const YYYY = date.getFullYear();
    const MM = String(date.getMonth() + 1).padStart(2, '0');
    const DD = String(date.getDate()).padStart(2, '0');

    return format
        .replace('YYYY', YYYY)
        .replace('MM', MM)
        .replace('DD', DD)
        .replace('ddd', ddd);
}

/**
 * @function formatTime
 * @description 시간을 원하는 형식으로 바꿔줍니다.
 */
function formatTime(date, format) {
    const HH = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const hhValue = date.getHours() % 12 || 12;
    const hh = String(hhValue).padStart(2, '0');
    const A = date.getHours() < 12 ? '오전' : '오후';

    return format
        .replace('HH', HH)
        .replace('mm', mm)
        .replace('hh', hh)
        .replace('A', A);
}

/**
 * @function renderDashboardGrid
 * @description 설정된 순서와 표시 여부에 따라 대시보드 화면을 다시 구성합니다.
 */
function renderDashboardGrid(settings) {
    const grid = document.getElementById('dashboard-grid');
    if (!grid) return;

    const sectionIds = {
        routines: 'section-routines',
        todos: 'section-todos',
        schedules: 'section-schedules'
    };

    // 설정된 순서대로 HTML 요소를 다시 배치합니다.
    settings.sectionOrder.forEach(key => {
        const el = document.getElementById(sectionIds[key]);
        if (el) {
            grid.appendChild(el);
            // 숨기기 설정 적용
            if (settings.visibleSections[key]) {
                el.classList.remove('hidden');
            } else {
                el.classList.add('hidden');
            }
        }
    });

    // 모든 섹션이 숨겨졌을 때 안내 문구 (선택 사항)
    const allHidden = Object.values(settings.visibleSections).every(v => v === false);
    let emptyMsg = document.getElementById('grid-empty-msg');
    if (allHidden) {
        if (!emptyMsg) {
            emptyMsg = document.createElement('div');
            emptyMsg.id = 'grid-empty-msg';
            emptyMsg.className = 'col-span-full py-20 text-center text-gray-400 italic border-4 border-dashed border-gray-200';
            emptyMsg.innerHTML = '<i class="ph ph-eye-slash text-4xl mb-2"></i><div>모든 섹션이 숨겨져 있습니다. 설정에서 다시 켤 수 있습니다.</div>';
            grid.appendChild(emptyMsg);
        }
    } else if (emptyMsg) {
        emptyMsg.remove();
    }
}

/**
 * @function showSettingsModal
 * @description 루틴 순서, 표시 여부, 시계 포맷 등을 바꿀 수 있는 설정 창을 띄웁니다.
 */
function showSettingsModal() {
    const overlay = document.getElementById('modal-overlay');
    if (!overlay) return;
    overlay.innerHTML = '';
    overlay.classList.remove('hidden');

    // 현재 설정을 복사하여 임시 저장소에 담습니다.
    const tempSettings = JSON.parse(JSON.stringify(app.data.settings));
    const modal = document.createElement('div');
    modal.className = 'bg-white p-6 border-4 border-black shadow-hard rounded-none mx-4 w-full max-w-lg modal-content overflow-y-auto max-h-[90vh]';

    const sectionNames = { routines: '루틴', todos: '할 일', schedules: '일정' };

    const renderModalContent = () => {
        modal.innerHTML = `
            <div class="flex justify-between items-center border-b-2 border-black pb-3 mb-4">
                <h3 class="text-2xl font-black uppercase"><i class="ph ph-gear-six inline mr-2"></i>설정</h3>
                <button id="close-settings-btn" class="e-btn p-1 h-8 w-8 text-xl flex items-center justify-center"><i class="ph ph-x"></i></button>
            </div>

            <div class="space-y-6">
                <!-- 1. 섹션 순서 및 표시 설정 -->
                <section>
                    <h4 class="font-black border-b border-black mb-3 pb-1 text-sm uppercase">화면 구성 (순서 및 표시)</h4>
                    <div id="settings-order-list" class="space-y-3">
                        ${tempSettings.sectionOrder.map((key, index) => `
                            <div class="flex items-center justify-between p-3 border-2 border-black bg-gray-50 shadow-hard-sm">
                                <div class="flex items-center gap-2">
                                    <div class="flex flex-col gap-1">
                                        <button class="move-up-btn border-2 border-black px-2 py-0.5 text-[10px] font-black ${index === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-black hover:text-white'}" 
                                            data-key="${key}" ${index === 0 ? 'disabled' : ''}>
                                            ▲ 위로
                                        </button>
                                        <button class="move-down-btn border-2 border-black px-2 py-0.5 text-[10px] font-black ${index === tempSettings.sectionOrder.length - 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-black hover:text-white'}" 
                                            data-key="${key}" ${index === tempSettings.sectionOrder.length - 1 ? 'disabled' : ''}>
                                            ▼ 아래로
                                        </button>
                                    </div>
                                    <span class="font-black text-lg ml-2">${sectionNames[key]}</span>
                                </div>
                                <div class="flex items-center gap-3 border-l-2 border-black pl-4">
                                    <span class="text-xs font-bold ${tempSettings.visibleSections[key] ? 'text-black' : 'text-gray-400'}">${tempSettings.visibleSections[key] ? '표시 중' : '숨김'}</span>
                                    <input type="checkbox" class="toggle-visibility-btn w-6 h-6 border-2 border-black cursor-pointer appearance-none checked:bg-black" data-key="${key}" ${tempSettings.visibleSections[key] ? 'checked' : ''}>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </section>

                <!-- 2. 날짜 및 시간 포맷 -->
                <section>
                    <h4 class="font-black border-b border-black mb-3 pb-1 text-sm uppercase">날짜 및 시간 형식</h4>
                    <div class="grid grid-cols-1 gap-4">
                        <div>
                            <label class="block text-xs font-bold mb-1">날짜 형식 (미리보기: ${formatDate(new Date(), tempSettings.dateFormat)})</label>
                            <select id="date-format-select" class="w-full p-2 border-2 border-black font-mono text-sm">
                                <option value="YYYY년 MM월 DD일" ${tempSettings.dateFormat === 'YYYY년 MM월 DD일' ? 'selected' : ''}>2026년 01월 06일</option>
                                <option value="YYYY. MM. DD. (ddd)" ${tempSettings.dateFormat === 'YYYY. MM. DD. (ddd)' ? 'selected' : ''}>2026. 01. 06. (화)</option>
                                <option value="YYYY-MM-DD" ${tempSettings.dateFormat === 'YYYY-MM-DD' ? 'selected' : ''}>2026-01-06</option>
                                <option value="MM/DD (ddd)" ${tempSettings.dateFormat === 'MM/DD (ddd)' ? 'selected' : ''}>01/06 (화)</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-bold mb-1">시간 형식 (미리보기: ${formatTime(new Date(), tempSettings.timeFormat)})</label>
                            <select id="time-format-select" class="w-full p-2 border-2 border-black font-mono text-sm">
                                <option value="HH:mm" ${tempSettings.timeFormat === 'HH:mm' ? 'selected' : ''}>14:30 (24시간)</option>
                                <option value="A hh:mm" ${tempSettings.timeFormat === 'A hh:mm' ? 'selected' : ''}>오후 02:30 (12시간)</option>
                                <option value="HH시 mm분" ${tempSettings.timeFormat === 'HH시 mm분' ? 'selected' : ''}>14시 30분</option>
                            </select>
                        </div>
                    </div>
                </section>

                <!-- 3. 데이터 관리 -->
                <section>
                    <h4 class="font-black border-b border-black mb-3 pb-1 text-sm uppercase">데이터 관리</h4>
                    <div class="flex gap-2">
                        <button id="modal-export-btn" class="flex-grow e-btn border-dashed text-xs py-2">
                            <i class="ph ph-export mr-1"></i> 데이터 내보내기 (.json)
                        </button>
                        <button id="modal-import-btn" class="flex-grow e-btn border-dashed text-xs py-2">
                            <i class="ph ph-import mr-1"></i> 데이터 가져오기
                        </button>
                        <input type="file" id="modal-import-input" class="hidden" accept=".json">
                    </div>
                </section>
            </div>

            <div class="mt-8 pt-4 border-t-2 border-black flex justify-end">
                <button id="settings-save-btn" class="e-btn primary w-full">확인 및 닫기</button>
            </div>
        `;

        // 이벤트 다시 연결
        modal.querySelector('#close-settings-btn').onclick = () => overlay.classList.add('hidden');

        modal.querySelector('#settings-save-btn').onclick = () => {
            app.updateSettings(tempSettings);
            initClock(); // 시간 표시 갱신
            overlay.classList.add('hidden');
        };

        modal.querySelectorAll('.move-up-btn').forEach(btn => {
            btn.onclick = () => {
                const key = btn.dataset.key;
                const idx = tempSettings.sectionOrder.indexOf(key);
                if (idx > 0) {
                    [tempSettings.sectionOrder[idx - 1], tempSettings.sectionOrder[idx]] = [tempSettings.sectionOrder[idx], tempSettings.sectionOrder[idx - 1]];
                    renderModalContent();
                }
            };
        });

        modal.querySelectorAll('.move-down-btn').forEach(btn => {
            btn.onclick = () => {
                const key = btn.dataset.key;
                const idx = tempSettings.sectionOrder.indexOf(key);
                if (idx < tempSettings.sectionOrder.length - 1) {
                    [tempSettings.sectionOrder[idx + 1], tempSettings.sectionOrder[idx]] = [tempSettings.sectionOrder[idx], tempSettings.sectionOrder[idx + 1]];
                    renderModalContent();
                }
            };
        });

        modal.querySelectorAll('.toggle-visibility-btn').forEach(chk => {
            chk.onchange = (e) => {
                const key = chk.dataset.key;
                tempSettings.visibleSections[key] = e.target.checked;
                renderModalContent();
            };
        });

        modal.querySelector('#date-format-select').onchange = (e) => {
            tempSettings.dateFormat = e.target.value;
            renderModalContent();
        };

        modal.querySelector('#time-format-select').onchange = (e) => {
            tempSettings.timeFormat = e.target.value;
            renderModalContent();
        };

        modal.querySelector('#modal-export-btn').onclick = () => app.exportJSON();
        modal.querySelector('#modal-import-btn').onclick = () => {
            showConfirmModal('데이터를 가져오시겠습니까?<br><strong class="text-red-500">기존 브라우저의 모든 데이터가 삭제되고 파일 내용으로 대체됩니다.</strong>',
                () => modal.querySelector('#modal-import-input').click());
        };
        modal.querySelector('#modal-import-input').onchange = (e) => {
            if (e.target.files.length > 0) {
                app.importJSON(e.target.files[0]);
                overlay.classList.add('hidden');
            }
        };
    };

    renderModalContent();
    overlay.appendChild(modal);
}

