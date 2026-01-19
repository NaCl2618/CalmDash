/**
 * CalmDash 생산성 허브 - 화면 UI 관리
 * 
 * 이 파일은 데이터를 화면에 예쁘게 그려주는 렌더링 함수들과 팝업창(모달) 관련 함수들을 담고 있습니다.
 */

// import { escapeHTML, getTimeSelectorHTML, formatDate, formatTime } from './utils.js';

/**
 * @function showConfirmModal
 * @description 확인창을 띄웁니다.
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
            <p class="text-gray-700">${escapeHTML(message)}</p>
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

/**
 * @function renderRoutines
 * @description 루틴 목록을 화면에 그립니다.
 */
function renderRoutines(routines, containerId, events, showAll = false) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    const btn = document.getElementById('toggle-routine-filter');
    if (btn) btn.textContent = showAll ? '전체 루틴 (오늘만 보기)' : '오늘의 루틴 (전체보기)';

    let displayRoutines = routines;
    if (!showAll) {
        const now = new Date();
        const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
        const todayName = days[now.getDay()];
        const isWeekend = now.getDay() === 0 || now.getDay() === 6;

        displayRoutines = routines.filter(r => {
            if (r.repeat === '매일') return true;
            if (r.repeat === '평일' && !isWeekend) return true;
            if (r.repeat === '주말' && isWeekend) return true;
            if (r.repeat === todayName) return true;
            return false;
        });
    }

    const sorted = [...displayRoutines].sort((a, b) => a.time.localeCompare(b.time));
    const completedCount = sorted.filter(r => r.isCompleted).length;

    const progressEl = document.getElementById('routine-progress');
    if (progressEl) progressEl.textContent = `${completedCount}/${sorted.length}`;

    if (sorted.length === 0) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-12 text-gray-400 border-2 border-dashed border-gray-200">
                <i class="ph ph-coffee text-4xl mb-2 opacity-30"></i>
                <div class="italic text-sm">현재 등록된 루틴이 없습니다.</div>
            </div>`;
        return;
    }

    sorted.forEach(r => {
        const isCompleted = r.isCompleted;
        const nowHourMin = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
        const isLate = !isCompleted && r.time < nowHourMin;
        const card = document.createElement('div');
        card.className = `e-card p-2 px-3 flex flex-col gap-1 relative transition-all ${isCompleted ? 'opacity-60 grayscale bg-gray-50' : 'bg-white'} ${isLate ? 'border-l-8 border-l-black' : ''} hover:shadow-hard-sm`;

        card.innerHTML = `
            <div class="flex justify-between items-center">
                <div class="flex items-center gap-2">
                    <span class="e-badge bg-black text-white px-1.5 py-0 text-[9px]">${r.repeat}</span>
                    <span class="text-[11px] font-mono font-bold"><i class="ph ph-clock inline mr-1"></i>${r.time}</span>
                </div>
                <div class="flex gap-1">
                    <button data-id="${r.id}" class="edit-routine-btn p-1 text-gray-400 hover:text-black transition-colors"><i class="ph ph-pencil-simple"></i></button>
                    <button data-id="${r.id}" class="delete-routine-btn p-1 text-gray-400 hover:text-red-500 transition-colors"><i class="ph ph-trash"></i></button>
                </div>
            </div>
            <div class="flex justify-between items-center gap-2">
                <div class="font-bold text-sm leading-tight truncate ${isCompleted ? 'line-through text-gray-500' : ''}">
                    ${escapeHTML(r.title)}
                    ${isLate ? '<span class="ml-1 bg-black text-white text-[9px] px-1 py-0.5">긴급</span>' : ''}
                </div>
                <button data-id="${r.id}" class="toggle-routine-btn e-btn ${isCompleted ? 'bg-gray-100' : 'primary'} text-[10px] py-1 px-2">
                    ${isCompleted ? '<i class="ph ph-check"></i>' : '완료'}
                </button>
            </div>
        `;
        card.querySelector('.toggle-routine-btn').onclick = () => events.onToggle(r.id);
        card.querySelector('.edit-routine-btn').onclick = (e) => { e.stopPropagation(); events.onEdit(r); };
        card.querySelector('.delete-routine-btn').onclick = (e) => {
            e.stopPropagation();
            showConfirmModal('이 루틴을 정말 삭제하시겠습니까?', () => events.onDelete(r.id));
        };
        container.appendChild(card);
    });
}

/**
 * @function renderSchedules
 * @description 일정 목록을 화면에 그립니다.
 */
function renderSchedules(schedules, containerId, events, showAll = false) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    const btn = document.getElementById('toggle-schedule-filter');
    if (btn) btn.textContent = showAll ? '전체 일정 (오늘&내일만)' : '오늘 & 내일 (전체보기)';

    let displaySchedules = schedules;
    if (!showAll) {
        const todayStr = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        displaySchedules = schedules.filter(s => s.date === todayStr || s.date === tomorrowStr);
    }

    const sorted = [...displaySchedules].sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.start.localeCompare(b.start);
    });

    if (sorted.length === 0) {
        container.innerHTML = `<div class="py-12 text-center text-gray-400 italic text-sm">진행 중인 일정이 없습니다.</div>`;
        return;
    }

    let currentDate = "";
    sorted.forEach(s => {
        if (s.date !== currentDate) {
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
                    <span class="text-[11px] font-mono text-gray-600 font-bold">${s.date}</span>
                </div>
                <div class="flex gap-1">
                    <button data-id="${s.id}" class="edit-schedule-btn p-1 text-gray-400 hover:text-black"><i class="ph ph-pencil-simple"></i></button>
                    <button data-id="${s.id}" class="delete-schedule-btn p-1 text-gray-400 hover:text-red-500"><i class="ph ph-trash"></i></button>
                </div>
            </div>
            <div class="flex justify-between items-end gap-2">
                <div class="font-bold text-base leading-tight truncate">${escapeHTML(s.title)}</div>
                <div class="text-[10px] font-bold font-mono bg-gray-100 px-1.5 py-0.5 border border-black flex-shrink-0">
                    ${s.isAllDay ? '종일' : `${s.start}-${s.end}`}
                </div>
            </div>
        `;
        card.querySelector('.edit-schedule-btn').onclick = (e) => { e.stopPropagation(); events.onEdit(s); };
        card.querySelector('.delete-schedule-btn').onclick = (e) => {
            e.stopPropagation();
            showConfirmModal('이 일정을 정말 삭제하시겠습니까?', () => events.onDelete(s.id));
        };
        container.appendChild(card);
    });
}

/**
 * @function renderTodos
 * @description 할 일 목록을 화면에 그립니다.
 */
function renderTodos(todos, containerId, events, sortType = 'priority') {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    const activeTodos = todos.filter(t => !t.isCompleted);

    activeTodos.sort((a, b) => {
        if (sortType === 'priority') {
            const pMap = { high: 1, medium: 2, low: 3, none: 4 };
            return (pMap[a.priority || 'none']) - (pMap[b.priority || 'none']);
        } else if (sortType === 'date') {
            if (!a.dueDate && !b.dueDate) return 0;
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return a.dueDate.localeCompare(b.dueDate);
        }
        return 0;
    });

    if (activeTodos.length === 0) {
        container.innerHTML = `<div class="py-12 text-center text-gray-400 italic text-sm font-bold">모든 할 일을 완료했습니다!</div>`;
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
                    <span class="text-[9px] font-black uppercase px-2 py-0 border-2 border-black ${priorityColor}">${priorityText}</span>
                    <span class="text-[11px] font-mono font-bold text-gray-600">${t.dueDate || '기한 없음'}</span>
                </div>
                <div class="flex gap-1">
                    <button data-id="${t.id}" class="edit-todo-btn p-1 text-gray-400 hover:text-black"><i class="ph ph-pencil-simple"></i></button>
                    <button data-id="${t.id}" class="delete-todo-btn p-1 text-gray-400 hover:text-red-500"><i class="ph ph-trash"></i></button>
                </div>
            </div>
            <div class="flex justify-between items-center gap-2">
                <div class="font-bold text-sm leading-tight truncate">${escapeHTML(t.title)}</div>
                <button data-id="${t.id}" class="complete-todo-btn e-btn primary text-[10px] py-1 px-2">완료</button>
            </div>
        `;
        card.querySelector('.complete-todo-btn').onclick = () => events.onToggle(t.id);
        card.querySelector('.edit-todo-btn').onclick = (e) => { e.stopPropagation(); events.onEdit(t); };
        card.querySelector('.delete-todo-btn').onclick = (e) => {
            e.stopPropagation();
            showConfirmModal('이 할 일을 정말 삭제하시겠습니까?', () => events.onDelete(t.id));
        };
        container.appendChild(card);
    });
}

/**
 * @function renderDashboardGrid
 * @description 섹션 구성에 따라 대시보드를 다시 그립니다.
 */
function renderDashboardGrid(settings) {
    const grid = document.getElementById('dashboard-grid');
    if (!grid) return;

    const sectionIds = {
        routines: 'section-routines',
        todos: 'section-todos',
        schedules: 'section-schedules'
    };

    settings.sectionOrder.forEach(key => {
        const el = document.getElementById(sectionIds[key]);
        if (el) {
            grid.appendChild(el);
            if (settings.visibleSections[key]) el.classList.remove('hidden');
            else el.classList.add('hidden');
        }
    });

    const allHidden = Object.values(settings.visibleSections).every(v => v === false);
    let emptyMsg = document.getElementById('grid-empty-msg');
    if (allHidden) {
        if (!emptyMsg) {
            emptyMsg = document.createElement('div');
            emptyMsg.id = 'grid-empty-msg';
            emptyMsg.className = 'col-span-full py-20 text-center text-gray-400 italic border-4 border-dashed border-gray-200';
            emptyMsg.innerHTML = '<i class="ph ph-eye-slash text-4xl mb-2"></i><div>모든 섹션이 숨겨져 있습니다.</div>';
            grid.appendChild(emptyMsg);
        }
    } else if (emptyMsg) {
        emptyMsg.remove();
    }
}

/**
 * @function showAddModal
 * @description 루틴/일정/할 일 추가 모달을 띄웁니다.
 */
function showAddModal(type, store, editItem = null) {
    const overlay = document.getElementById('modal-overlay');
    if (!overlay) return;
    overlay.innerHTML = '';
    overlay.classList.remove('hidden');

    const modal = document.createElement('div');
    modal.className = 'bg-white p-6 border-4 border-black shadow-hard rounded-none mx-4 w-full max-w-lg modal-content';

    let title = editItem ? escapeHTML(editItem.title) : '';
    let formFields = '';

    if (type === 'routine') {
        const [h, m] = editItem ? editItem.time.trim().split(':') : ["08", "00"];
        formFields = `
             <div class="mb-4"><label class="block font-bold mb-1">목표 루틴</label><input type="text" name="title" required value="${title}" placeholder="예: 영양제 챙겨먹기" class="w-full p-2 border-2 border-black"></div>
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
            <div class="mb-4"><label class="block font-bold mb-1">일정 제목</label><input type="text" name="title" required value="${title}" placeholder="예: 운동 하기" class="w-full p-2 border-2 border-black"></div>
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
        const dueDate = editItem ? (editItem.dueDate || '') : '';
        formFields = `
            <div class="mb-4"><label class="block font-bold mb-1">할 일 내용</label><input type="text" name="title" required value="${title}" placeholder="예: 전기 요금 납부" class="w-full p-2 border-2 border-black"></div>
            <div class="grid grid-cols-2 gap-4 mb-6">
                <div><label class="block font-bold mb-1">마감 기한 (선택)</label><input type="date" name="dueDate" value="${dueDate}" class="w-full p-2 border-2 border-black"></div>
                <div><label class="block font-bold mb-1">중요도 (선택)</label><select name="priority" class="w-full p-2 border-2 border-black">
                    <option value="none" ${(!editItem || editItem.priority === 'none') ? 'selected' : ''}>미지정</option>
                    <option value="high" ${editItem && editItem.priority === 'high' ? 'selected' : ''}>최고</option>
                    <option value="medium" ${editItem && editItem.priority === 'medium' ? 'selected' : ''}>중간</option>
                    <option value="low" ${editItem && editItem.priority === 'low' ? 'selected' : ''}>낮음</option>
                </select></div>
            </div>`;
    }

    modal.innerHTML = `
        <div class="flex justify-between items-center border-b-2 border-black pb-3 mb-4">
            <h3 class="text-2xl font-black uppercase">${editItem ? '정보 수정' : `새 ${type} 추가`}</h3>
            <button id="close-modal-btn" class="e-btn p-1 h-8 w-8 text-xl flex items-center justify-center"><i class="ph ph-x"></i></button>
        </div>
        <form id="add-form">
            ${formFields}
            <div class="flex justify-end gap-3 pt-4 border-t-2 border-gray-200">
                <button type="button" id="cancel-modal-btn" class="e-btn bg-white border-gray-400 text-gray-700">취소</button>
                <button type="submit" class="e-btn primary">${editItem ? '저장하기' : '추가하기'}</button>
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
        if (!rawData.title || rawData.title.trim() === '') { alert('내용을 입력해 주세요.'); return; }

        const data = { ...rawData };
        if (type === 'routine') {
            data.time = `${rawData.time_hour}:${rawData.time_min}`;
            if (editItem) store.updateItem('routine', editItem.id, data); else store.addRoutine(data);
        } else if (type === 'schedule') {
            data.start = `${rawData.start_hour}:${rawData.start_min}`;
            data.end = `${rawData.end_hour}:${rawData.end_min}`;
            data.isAllDay = rawData.isAllDay === 'on';
            if (editItem) store.updateItem('schedule', editItem.id, data); else store.addSchedule(data);
        } else if (type === 'todo') {
            if (editItem) store.updateItem('todo', editItem.id, data); else store.addTodo(data);
        }
        close();
    };
}

/**
 * @function showSettingsModal
 * @description 설정창을 띄웁니다.
 */
function showSettingsModal(store, onClockUpdate) {
    const overlay = document.getElementById('modal-overlay');
    if (!overlay) return;
    overlay.innerHTML = '';
    overlay.classList.remove('hidden');

    const tempSettings = JSON.parse(JSON.stringify(store.data.settings));
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
                <section>
                    <h4 class="font-black border-b border-black mb-3 pb-1 text-sm uppercase">화면 구성</h4>
                    <div id="settings-order-list" class="space-y-3">
                        ${tempSettings.sectionOrder.map((key, index) => `
                            <div class="flex items-center justify-between p-3 border-2 border-black bg-gray-50">
                                <div class="flex items-center gap-2">
                                    <div class="flex flex-col gap-1">
                                        <button class="move-up-btn border-2 border-black px-2 py-0.5 text-[10px] ${index === 0 ? 'bg-gray-200 text-gray-400' : 'bg-white'}" data-key="${key}" ${index === 0 ? 'disabled' : ''}>▲ 위로</button>
                                        <button class="move-down-btn border-2 border-black px-2 py-0.5 text-[10px] ${index === tempSettings.sectionOrder.length - 1 ? 'bg-gray-200 text-gray-400' : 'bg-white'}" data-key="${key}" ${index === tempSettings.sectionOrder.length - 1 ? 'disabled' : ''}>▼ 아래로</button>
                                    </div>
                                    <span class="font-black text-lg ml-2">${escapeHTML(sectionNames[key])}</span>
                                </div>
                                <div class="flex items-center gap-3">
                                    <input type="checkbox" class="toggle-visibility-btn w-6 h-6 border-2 border-black appearance-none checked:bg-black" data-key="${key}" ${tempSettings.visibleSections[key] ? 'checked' : ''}>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </section>
                <section>
                    <h4 class="font-black border-b border-black mb-3 pb-1 text-sm uppercase">날짜 및 시간</h4>
                    <div class="grid grid-cols-1 gap-4">
                        <div>
                            <label class="block text-xs font-bold mb-1">날짜 형식 (미리보기: ${escapeHTML(formatDate(new Date(), tempSettings.dateFormat))})</label>
                            <select id="date-format-select" class="w-full p-2 border-2 border-black font-mono text-sm">
                                <option value="YYYY년 MM월 DD일" ${tempSettings.dateFormat === 'YYYY년 MM월 DD일' ? 'selected' : ''}>2026년 01월 19일</option>
                                <option value="YYYY. MM. DD. (ddd)" ${tempSettings.dateFormat === 'YYYY. MM. DD. (ddd)' ? 'selected' : ''}>2026. 01. 19. (월)</option>
                                <option value="YYYY-MM-DD" ${tempSettings.dateFormat === 'YYYY-MM-DD' ? 'selected' : ''}>2026-01-19</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-bold mb-1">시간 형식 (미리보기: ${escapeHTML(formatTime(new Date(), tempSettings.timeFormat))})</label>
                            <select id="time-format-select" class="w-full p-2 border-2 border-black font-mono text-sm">
                                <option value="HH:mm" ${tempSettings.timeFormat === 'HH:mm' ? 'selected' : ''}>14:30 (24H)</option>
                                <option value="A hh:mm" ${tempSettings.timeFormat === 'A hh:mm' ? 'selected' : ''}>오후 02:30 (12H)</option>
                            </select>
                        </div>
                    </div>
                </section>
                <section>
                    <h4 class="font-black border-b border-black mb-3 pb-1 text-sm uppercase">데이터 관리</h4>
                    <div class="flex gap-2">
                        <button id="modal-export-btn" class="flex-grow e-btn border-dashed text-xs py-2">내보내기 (.json)</button>
                        <button id="modal-import-btn" class="flex-grow e-btn border-dashed text-xs py-2">가져오기</button>
                        <input type="file" id="modal-import-input" class="hidden" accept=".json">
                    </div>
                </section>
            </div>
            <div class="mt-8 pt-4 border-t-2 border-black"><button id="settings-save-btn" class="e-btn primary w-full">확인 및 닫기</button></div>
        `;

        modal.querySelector('#close-settings-btn').onclick = () => overlay.classList.add('hidden');
        modal.querySelector('#settings-save-btn').onclick = () => {
            store.updateSettings(tempSettings);
            onClockUpdate();
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
            chk.onchange = (e) => { tempSettings.visibleSections[chk.dataset.key] = e.target.checked; renderModalContent(); };
        });
        modal.querySelector('#date-format-select').onchange = (e) => { tempSettings.dateFormat = e.target.value; renderModalContent(); };
        modal.querySelector('#time-format-select').onchange = (e) => { tempSettings.timeFormat = e.target.value; renderModalContent(); };
        modal.querySelector('#modal-export-btn').onclick = () => store.exportJSON();
        modal.querySelector('#modal-import-btn').onclick = () => {
            showConfirmModal('기존 모든 데이터가 삭제되고 파일 내용으로 대체됩니다.', () => modal.querySelector('#modal-import-input').click());
        };
        modal.querySelector('#modal-import-input').onchange = (e) => {
            if (e.target.files.length > 0) { store.importJSON(e.target.files[0]); overlay.classList.add('hidden'); }
        };
    };
    renderModalContent();
    overlay.appendChild(modal);
}

/**
 * @function showGuideModal
 * @description 환영 인사 창을 띄웁니다.
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
            </ul>
        </div>
        <div class="flex justify-end"><button id="guide-close-btn" class="e-btn primary">시작하기</button></div>
    `;
    overlay.appendChild(modal);
    modal.querySelector('#guide-close-btn').onclick = () => overlay.classList.add('hidden');
}

/**
 * @function showStorageInfoModal
 * @description 데이터 저장 안내 창을 띄웁니다.
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
            </p>
        </div>
        <div class="flex justify-end"><button id="storage-close-btn" class="e-btn">닫기</button></div>
    `;
    overlay.appendChild(modal);
    modal.querySelector('#storage-close-btn').onclick = () => overlay.classList.add('hidden');
}
