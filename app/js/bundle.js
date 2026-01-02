/**
 * 생산성 허브 - 단일 번들 스크립트
 * Store, Render, App 로직을 통합하여 ES 모듈의 CORS 오류 없이
 * file:// 프로토콜에서 실행되도록 지원합니다.
 */

// --- 상수 및 데이터 ---


// 앱 초기 실행 시 사용할 기본 데이터
const INITIAL_DATA = {
    routines: [
        { id: 'r1', title: '아침 약 복용', time: '07:30', isCompleted: false, repeat: '매일' },
        { id: 'r2', title: '학교 가방 싸기', time: '08:00', isCompleted: true, repeat: '매일' },
        { id: 'r3', title: '식물 물 주기', time: '09:00', isCompleted: false, repeat: '매주' },
        { id: 'r4', title: '일일 보고서 제출', time: '17:00', isCompleted: false, repeat: '매일' },
        { id: 'r5', title: '분리수거', time: '19:00', isCompleted: false, repeat: '수요일' }
    ],
    schedules: [
        { id: 's1', title: '치과 예약', start: '10:00', end: '11:00', isAllDay: false, dateOffset: 0 },
        { id: 's2', title: '팀 회의', start: '14:00', end: '15:00', isAllDay: false, dateOffset: 0 },
        { id: 's3', title: '외식', start: '18:30', end: '20:00', isAllDay: false, dateOffset: 1 },
        { id: 's4', title: '장보기', start: '00:00', end: '23:59', isAllDay: true, dateOffset: 0 }
    ],
    todos: [
        { id: 't1', title: '전기 요금 납부', dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0], priority: 'high', isCompleted: false },
        { id: 't2', title: '생일 선물 구매', dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0], priority: 'medium', isCompleted: false },
        { id: 't3', title: '수학 숙제', dueDate: new Date(Date.now() + 1 * 86400000).toISOString().split('T')[0], priority: 'high', isCompleted: false },
        { id: 't4', title: '차고 청소', dueDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0], priority: 'low', isCompleted: false }
    ]
};

// --- 도우미 함수 ---

/**
 * @function generateUUID
 * @description 항목 식별을 위한 고유 ID(UUID)를 생성합니다. Crypto API가 없는 환경에서도 작동하도록 구현되었습니다.
 * @returns {string} 생성된 UUID 문자열
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

// --- Store 클래스: 데이터 관리 및 영구 저장 ---

class Store {
    /**
     * @constructor
     * @description Store 클래스의 인스턴스를 초기화합니다. 저장 키 설정, 구독자 목록 초기화 및 데이터를 로드합니다.
     */
    constructor() {
        this.STORAGE_KEY = 'productivity_hub_data_v1';
        this.listeners = []; // 데이터 변경 시 호출될 구독자 목록
        this.data = this.load(); // LocalStorage에서 데이터 로드
    }

    /**
     * @method load
     * @description LocalStorage에서 데이터를 읽어와 파싱합니다. 데이터가 없으면 초기 데이터를 반환하고 첫 방문 플래그를 설정합니다.
     * @returns {Object} 로드된 데이터 객체
     */
    load() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.warn('LocalStorage access denied or failed:', e);
        }

        // 최초 접속 시 시료 데이터와 안내를 위해 표시 설정 (동적 추가 방지 위해 INITIAL_DATA 복사본 사용)
        this.isFirstTime = true;
        return JSON.parse(JSON.stringify(INITIAL_DATA));
    }

    /**
     * @method save
     * @description 현재 데이터를 LocalStorage에 저장을 시도하고, 등록된 모든 구독자에게 변경 사항을 알립니다.
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
     * @description 데이터 변경 시 호출될 콜백(구독자)을 등록합니다. 등록 즉시 현재 데이터를 전달합니다.
     * @param {Function} listener 데이터 변경 시 실행될 함수
     */
    subscribe(listener) {
        this.listeners.push(listener);
        listener(this.data);
    }

    /**
     * @method notify
     * @description 등록된 모든 구독자에게 현재 데이터 상태를 전달하여 화면 갱신 등을 수행하게 합니다.
     */
    notify() {
        this.listeners.forEach(l => l(this.data));
    }


    /**
     * @method addRoutine
     * @description 새로운 루틴 항목을 추가하고 저장합니다.
     * @param {Object} routine 추가할 루틴 정보 (title, time, repeat 등)
     */
    addRoutine(routine) {
        this.data.routines.push({ ...routine, id: generateUUID(), isCompleted: false });
        this.save();
    }

    /**
     * @method toggleRoutine
     * @description 특정 루틴의 완료 상태를 반전(true/false) 시킵니다.
     * @param {string} id 토글할 루틴의 ID
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
     * @description 새로운 일정 항목을 추가하고 저장합니다.
     * @param {Object} schedule 추가할 일정 정보 (title, date, start, end 등)
     */
    addSchedule(schedule) {
        this.data.schedules.push({ ...schedule, id: generateUUID() });
        this.save();
    }

    /**
     * @method addTodo
     * @description 새로운 할 일 항목을 추가하고 저장합니다.
     * @param {Object} todo 추가할 할 일 정보 (title, dueDate, priority 등)
     */
    addTodo(todo) {
        this.data.todos.push({ ...todo, id: generateUUID(), isCompleted: false });
        this.save();
    }
    /**
     * @method toggleTodo
     * @description 특정 할 일의 완료 상태를 반전시킵니다.
     * @param {string} id 토글할 할 일의 ID
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
     * @description 기존 항목의 정보를 수정합니다.
     * @param {string} type 항목 유형 ('routine', 'schedule', 'todo')
     * @param {string} id 수정할 항목의 ID
     * @param {Object} newData 업데이트할 데이터 객체
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
     * @description 특정 항목을 목록에서 제거합니다.
     * @param {string} type 항목 유형 ('routine', 'schedule', 'todo')
     * @param {string} id 삭제할 항목의 ID
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
            console.log(`[Store] Successfully deleted ${type} ${id}`);
        } catch (error) {
            console.error(`[Store] Error deleting ${type}:`, error);
        }
    }
}

/**
 * @function showConfirmModal
 * @description 사용자에게 "확인/취소"를 묻는 커스텀 모달 윈도우를 표시합니다.
 * @param {string} message 표시할 확인 메시지
 * @param {Function} onConfirm "확인" 버튼 클릭 시 실행할 콜백 함수
 */
function showConfirmModal(message, onConfirm) {
    const overlay = document.getElementById('modal-overlay');
    if (!overlay) return;
    overlay.innerHTML = '';
    overlay.classList.remove('hidden');

    const modal = document.createElement('div');
    modal.className = 'bg-white p-6 border-4 border-black shadow-hard rounded-none mx-4 w-full max-w-sm modal-content';
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

// --- 렌더링 함수: 데이터를 HTML 요소로 변환하여 화면에 출력 ---

/**
 * @function renderRoutines
 * @description 루틴 목록 데이터를 받아 HTML로 변환하여 화면에 출력합니다. 요일 필터링 및 시간 정렬 로직이 포함되어 있습니다.
 * @param {Array} routines 전체 루틴 데이터 배열
 * @param {string} containerId 결과 HTML을 삽입할 부모 요소의 ID
 * @param {Object} events 클릭 이벤트 처리용 콜백 객체 (onToggle, onDelete, onEdit)
 * @param {boolean} showAll 필터링 없이 전체 루틴을 표시할지 여부
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
        card.className = `e-card flex items-center justify-between p-3 ${isCompleted ? 'opacity-50 bg-gray-100 border-gray-400' : 'bg-white'} ${isLate ? 'border-l-8 border-l-black' : ''}`;

        card.innerHTML = `
            <div class="flex items-center gap-3">
                <button data-id="${r.id}" class="toggle-routine-btn w-8 h-8 border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors flex-shrink-0">
                    ${isCompleted ? '<i class="ph-bold ph-check"></i>' : ''}
                </button>
                <div>
                    <div class="font-bold ${isCompleted ? 'line-through' : ''}">${r.title}</div>
                    <div class="text-xs text-gray-500 font-mono flex items-center gap-1">
                        <span class="font-bold text-black">${r.time}</span> • <span>${r.repeat}</span>
                        ${isLate ? '<span class="bg-black text-white px-1 font-bold">긴급</span>' : ''}
                    </div>
                </div>
            </div>
            <div class="flex gap-1 flex-shrink-0">
                <button data-id="${r.id}" class="edit-routine-btn p-1 text-gray-400 hover:text-black" title="수정"><i class="ph ph-pencil-simple"></i></button>
                <button data-id="${r.id}" class="delete-routine-btn p-1 text-gray-400 hover:text-red-500" title="삭제"><i class="ph ph-trash"></i></button>
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
 * @description 일정 목록 데이터를 받아 HTML로 변환하여 화면에 출력합니다. 날짜순/시간순 정렬 및 오늘/내일 필터링 로직이 포함되어 있습니다.
 * @param {Array} schedules 전체 일정 데이터 배열
 * @param {string} containerId 결과 HTML을 삽입할 부모 요소의 ID
 * @param {Object} events 클릭 이벤트 처리용 콜백 객체 (onDelete, onEdit)
 * @param {boolean} showAll 필터링 없이 전체 일정을 표시할지 여부
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
        card.className = "e-card flex items-center p-3 bg-white relative group";
        card.innerHTML = `
            <div class="flex-grow">
                <div class="font-bold text-sm">${s.title}</div>
                <div class="text-xs font-mono text-gray-600">
                    ${s.isAllDay ? '종일 이벤트' : `${s.start} - ${s.end}`}
                </div>
            </div>
            <div class="flex gap-1 flex-shrink-0 absolute right-0 top-1 z-10 transition-opacity">
                <button data-id="${s.id}" class="edit-schedule-btn p-1 text-gray-400 hover:text-black" title="수정"><i class="ph ph-pencil-simple"></i></button>
                <button data-id="${s.id}" class="delete-schedule-btn p-1 text-gray-400 hover:text-red-500" title="삭제"><i class="ph ph-trash"></i></button>
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
 * @description 할 일 목록 데이터를 받아 HTML로 변환하여 화면에 출력합니다. 미완료 항목만 우선순위 순으로 정렬하여 표시합니다.
 * @param {Array} todos 할 일 데이터 배열
 * @param {string} containerId 결과 HTML을 삽입할 부모 요소의 ID
 * @param {Object} events 클릭 이벤트 처리용 콜백 객체 (onToggle, onDelete, onEdit)
 */
function renderTodos(todos, containerId, events) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    // 완료되지 않은 항목만 표시 및 우선순위 정렬
    const activeTodos = todos.filter(t => !t.isCompleted);
    activeTodos.sort((a, b) => {
        const pMap = { high: 1, medium: 2, low: 3 };
        return pMap[a.priority] - pMap[b.priority];
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
        if (t.priority === 'high') { priorityText = '최고'; priorityColor = 'bg-black text-white'; }
        else if (t.priority === 'medium') { priorityText = '중간'; priorityColor = 'bg-gray-400 text-white'; }
        else { priorityText = '낮음'; priorityColor = 'bg-white text-black border border-gray-400'; }

        const card = document.createElement('div');
        card.className = `e-card p-3 flex flex-col gap-2 relative group border-l-8 ${t.priority === 'high' ? 'border-l-black' : t.priority === 'medium' ? 'border-l-gray-400' : 'border-l-gray-200'}`;
        card.innerHTML = `
            <div class="flex justify-between items-start">
                <div class="flex items-center gap-2">
                    <span class="text-[10px] font-black uppercase px-1.5 py-0.5 rounded-sm ${priorityColor}">${priorityText}</span>
                    <span class="text-xs font-mono text-gray-500"><i class="ph ph-calendar-check inline mr-1"></i>${t.dueDate}</span>
                </div>
                <div class="text-xl flex items-center gap-1">
                    <button data-id="${t.id}" class="edit-todo-btn p-1 text-gray-400 hover:text-black" title="수정"><i class="ph ph-pencil-simple"></i></button>
                    <span class="bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center"><i class="ph ph-user"></i></span>
                </div>
            </div>
            <div class="font-bold text-md leading-tight">${t.title}</div>
            <div class="flex gap-2 justify-end mt-2">
                <button data-id="${t.id}" class="complete-todo-btn e-btn text-xs font-bold py-1 px-2 hover:bg-black hover:text-white transition-colors">완료 처리</button>
                <button data-id="${t.id}" class="delete-todo-btn p-1 text-gray-400 hover:text-red-500" title="삭제"><i class="ph ph-trash"></i></button>
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

// --- 애플리케이션 메인 로직 ---

const app = new Store();

/**
 * @function init
 * @description 애플리케이션의 앱 진입점으로, 시계/날씨/이벤트를 초기화하고 데이터 변경 시 화면 갱신을 위한 구독을 설정합니다.
 */
function init() {
    initClock(); // 시계 시작
    initWeather(); // 실시간 날씨 초기화
    setupEventListeners(); // 전역 이벤트 리스너 설정
    // 필터 상태 유지 (LocalStorage)
    let showAllRoutines = localStorage.getItem('calm_dash_show_all_routines') === 'true';
    let showAllSchedules = localStorage.getItem('calm_dash_show_all_schedules') === 'true';

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
        });
    });

    // 필터 토글 이벤트 연결
    document.getElementById('toggle-routine-filter').addEventListener('click', () => {
        showAllRoutines = !showAllRoutines;
        localStorage.setItem('calm_dash_show_all_routines', showAllRoutines);
        app.notify(); // 화면 갱신 트리거
    });
    document.getElementById('toggle-schedule-filter').addEventListener('click', () => {
        showAllSchedules = !showAllSchedules;
        localStorage.setItem('calm_dash_show_all_schedules', showAllSchedules);
        app.notify(); // 화면 갱신 트리거
    });

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
 * @description 전역 공통 이벤트(등록 버튼, 테마 토글, 안내 보기 등)에 대한 리스너를 한 곳에서 설정합니다.
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

// 날씨 아이콘 매핑 (Open-Meteo VMO 코드 기준)
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
    80: { icon: 'ph-cloud-rain', text: '소나기' },
    81: { icon: 'ph-cloud-rain', text: '강한 소나기' },
    82: { icon: 'ph-cloud-rain', text: '폭우' },
    95: { icon: 'ph-cloud-lightning', text: '뇌우' }
};

/**
 * @function initWeather
 * @description 사용자의 위치(Geolocation)를 확인하거나 IP 기반으로 날씨 정보를 가져와 상단 헤더에 출격합니다.
 * 3시간 동안 유지되는 위치 캐시를 사용하여 잦은 권한 요청을 방지합니다.
 */
async function initWeather() {
    const weatherElement = document.getElementById('live-weather');
    if (!weatherElement) return;

    const CACHE_KEY = 'calm_dash_location_cache';
    const CACHE_DURATION = 3 * 60 * 60 * 1000; // 3시간 캐시 유지

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
                    const locRes = await fetch('http://ip-api.com/json/');
                    const locData = await locRes.json();
                    if (locData.status === 'success') {
                        lat = locData.lat;
                        lon = locData.lon;
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
 * @description 실시간 시계와 날짜 표시를 시작합니다. 1분마다 정보를 갱신하여 시스템 부하를 최소화합니다.
 */
function initClock() {
    const updateTime = () => {
        const now = new Date();
        const clockElement = document.getElementById('live-clock');
        const dateElement = document.getElementById('live-date');

        // 분 단위 시계로 변경
        if (clockElement) clockElement.textContent = now.toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' });
        if (dateElement) dateElement.textContent = now.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
    };
    setInterval(updateTime, 60000); // 1분마다 업데이트
    updateTime();
}

/**
 * @function getTimeSelectorHTML
 * @description 시간과 분을 선택할 수 있는 HTML <select> 코드를 생성하여 반환합니다.
 * @param {string} prefix input 필드의 이름(name) 접두어
 * @param {string} defaultHour 초기 선택될 시간 (00-23)
 * @param {string} defaultMin 초기 선택될 분 (00, 05, 10...)
 * @returns {string} 셀렉터 HTML 문자열
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
 * @description 항목을 추가하거나 수정하기 위한 입력 폼이 포함된 모달을 화면에 띄웁니다.
 * @param {string} type 모달 유형 ('routine', 'schedule', 'todo')
 * @param {Object|null} editItem 수정 시 대상 항목의 데이터 (신규 추가 시 null)
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
             <div class="mb-4"><label class="block font-bold mb-1">목표 루틴</label><input type="text" name="title" required value="${title}" placeholder="예: 영양제 챙겨먹기" class="w-full"></div>
             <div class="grid grid-cols-2 gap-4 mb-4">
                <div><label class="block font-bold mb-1">수행 시간</label>${getTimeSelectorHTML('time', h, m)}</div>
                <div><label class="block font-bold mb-1">반복 일정</label><select name="repeat" class="w-full p-2 border-2 border-black">
                    ${['매일', '평일', '주말', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일'].map(r => `<option ${editItem && editItem.repeat === r ? 'selected' : ''}>${r}</option>`).join('')}
                </select></div>
             </div>`;
    } else if (type === 'schedule') {
        const [sh, sm] = editItem ? editItem.start.trim().split(':') : ["09", "00"];
        const [eh, em] = editItem ? editItem.end.trim().split(':') : ["10", "00"];
        const date = editItem ? editItem.date : new Date().toISOString().split('T')[0];
        const isAllDay = editItem ? editItem.isAllDay : false;

        formFields = `
            <div class="mb-4"><label class="block font-bold mb-1">일정 제목</label><input type="text" name="title" required value="${title}" placeholder="예: 운동 하기" class="w-full"></div>
            <div class="mb-4"><label class="block font-bold mb-1">날짜 선택</label><input type="date" name="date" required value="${date}" class="w-full p-2 border-2 border-black"></div>
            <div class="mb-4 flex items-center gap-2">
                <input type="checkbox" id="isAllDay" name="isAllDay" ${isAllDay ? 'checked' : ''} class="w-5 h-5 border-2 border-black">
                <label for="isAllDay" class="font-bold cursor-pointer">종일 일정</label>
            </div>
            <div id="time-range-container" class="grid grid-cols-2 gap-4 mb-6 ${isAllDay ? 'opacity-30 pointer-events-none' : ''}">
                <div><label class="block font-bold mb-1">시작 시간</label>${getTimeSelectorHTML('start', sh, sm)}</div>
                <div><label class="block font-bold mb-1">종료 시간</label>${getTimeSelectorHTML('end', eh, em)}</div>
            </div>`;
    } else if (type === 'todo') {
        const dueDate = editItem ? editItem.dueDate : new Date().toISOString().split('T')[0];
        formFields = `
            <div class="mb-4"><label class="block font-bold mb-1">할 일 내용</label><input type="text" name="title" required value="${title}" placeholder="예: 전기 요금 납부" class="w-full"></div>
            <div class="grid grid-cols-2 gap-4 mb-6">
                <div><label class="block font-bold mb-1">마감 기한</label><input type="date" name="dueDate" required value="${dueDate}" class="w-full p-2 border-2 border-black"></div>
                <div><label class="block font-bold mb-1">중요도</label><select name="priority" class="w-full p-2 border-2 border-black">
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
        <form id="add-form">${formFields}<div class="flex justify-end gap-3 pt-4 border-t-2 border-gray-200"><button type="button" id="cancel-modal-btn" class="e-btn bg-white border-gray-400 text-gray-700">취소</button><button type="submit" class="e-btn primary"><i class="ph ph-floppy-disk"></i> ${editItem ? '저장하기' : '추가하기'}</button></div></form>
    `;
    overlay.appendChild(modal);

    const close = () => overlay.classList.add('hidden');

    // 종일 일정 토글 핸들러
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
            data.time = `${rawData.time_hour}:${rawData.time_min} `;
            if (editItem) app.updateItem('routine', editItem.id, data);
            else app.addRoutine(data);
        } else if (type === 'schedule') {
            data.start = `${rawData.start_hour}:${rawData.start_min} `;
            data.end = `${rawData.end_hour}:${rawData.end_min} `;
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
 * @description 최초 방문 사용자에게 앱 사용법과 저장 방식에 대한 안내 팝업을 표시합니다.
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
 * @description 데이터 저장소(LocalStorage)에 관한 상세 설명을 담은 팝업을 표시합니다.
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
