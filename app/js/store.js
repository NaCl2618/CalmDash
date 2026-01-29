/**
 * CalmDash 생산성 허브 - 데이터 저장 창고 (Store)
 * 
 * 이 파일은 사용자의 정보를 저장하고, 불러오고, 수정하는 모든 데이터 관리 로직을 담당합니다.
 */


// import { INITIAL_DATA } from './constants.js';
// import { generateUUID } from './utils.js';

class Store {
    constructor() {
        this.STORAGE_KEY = 'productivity_hub_data_v1';
        this.listeners = [];
        this.data = this.load();
    }

    /**
     * 데이터 마이그레이션: 구 버전 데이터를 최신 구조로 변환
     */
    migrateData(data) {
        // 루틴에 actions 배열 추가 (없으면 빈 배열)
        if (data.routines) {
            data.routines = data.routines.map(r => ({
                ...r,
                actions: r.actions || []
            }));
        }

        // settings 기본값 처리
        if (!data.settings) {
            data.settings = JSON.parse(JSON.stringify(INITIAL_DATA.settings));
        }

        return data;
    }

    load() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                return this.migrateData(parsed);
            }
        } catch (e) {
            console.warn('LocalStorage access denied or failed:', e);
        }

        this.isFirstTime = true;
        return JSON.parse(JSON.stringify(INITIAL_DATA));
    }

    save() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
        } catch (e) {
            console.warn('LocalStorage save failed:', e);
        }
        this.notify();
    }

    subscribe(listener) {
        this.listeners.push(listener);
        listener(this.data);
    }

    notify() {
        this.listeners.forEach(l => l(this.data));
    }

    addRoutine(routine) {
        this.data.routines.push({
            ...routine,
            id: generateUUID(),
            isCompleted: false,
            actions: [] // 새 루틴은 빈 액션 배열로 시작
        });
        this.save();
    }

    toggleRoutine(id) {
        const item = this.data.routines.find(r => r.id === id);
        if (item) {
            item.isCompleted = !item.isCompleted;
            this.save();
        }
    }

    addSchedule(schedule) {
        this.data.schedules.push({ ...schedule, id: generateUUID() });
        this.save();
    }

    addTodo(todo) {
        this.data.todos.push({ ...todo, id: generateUUID(), isCompleted: false });
        this.save();
    }

    toggleTodo(id) {
        const item = this.data.todos.find(t => t.id === id);
        if (item) {
            item.isCompleted = !item.isCompleted;
            this.save();
        }
    }

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

    deleteItem(type, id) {
        console.log(`[Store] Attempting to delete ${type} with id: ${id}`);
        if (type === 'routine') {
            this.data.routines = this.data.routines.filter(r => r.id !== id);
        } else if (type === 'schedule') {
            this.data.schedules = this.data.schedules.filter(s => s.id !== id);
        } else if (type === 'todo') {
            this.data.todos = this.data.todos.filter(t => t.id !== id);
        }
        this.save();
    }

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

    importJSON(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                if (importedData.routines && importedData.schedules && importedData.todos) {
                    // import된 데이터도 마이그레이션 적용
                    this.data = this.migrateData(importedData);
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

    updateSettings(newSettings) {
        this.data.settings = { ...this.data.settings, ...newSettings };
        this.save();
    }

    /**
     * 루틴에 새 액션 추가
     */
    addActionToRoutine(routineId, actionTitle) {
        const routine = this.data.routines.find(r => r.id === routineId);
        if (routine) {
            if (!routine.actions) routine.actions = [];
            routine.actions.push({
                id: generateUUID(),
                title: actionTitle,
                isCompleted: false
            });
            this.save();
        }
    }

    /**
     * 액션 완료 상태 토글
     */
    toggleAction(routineId, actionId) {
        const routine = this.data.routines.find(r => r.id === routineId);
        if (routine && routine.actions) {
            const action = routine.actions.find(a => a.id === actionId);
            if (action) {
                action.isCompleted = !action.isCompleted;
                this.save();
            }
        }
    }

    /**
     * 액션 수정
     */
    updateAction(routineId, actionId, updates) {
        const routine = this.data.routines.find(r => r.id === routineId);
        if (routine && routine.actions) {
            const index = routine.actions.findIndex(a => a.id === actionId);
            if (index !== -1) {
                routine.actions[index] = { ...routine.actions[index], ...updates };
                this.save();
            }
        }
    }

    /**
     * 액션 삭제
     */
    deleteAction(routineId, actionId) {
        const routine = this.data.routines.find(r => r.id === routineId);
        if (routine && routine.actions) {
            routine.actions = routine.actions.filter(a => a.id !== actionId);
            this.save();
        }
    }
}
