import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load source files and execute them to define global classes/functions
const constantsCode = readFileSync(join(process.cwd(), 'app/js/constants.js'), 'utf-8');
const utilsCode = readFileSync(join(process.cwd(), 'app/js/utils.js'), 'utf-8');
const storeCode = readFileSync(join(process.cwd(), 'app/js/store.js'), 'utf-8');

// Use Function constructor to avoid strict mode issues with eval
const setupGlobals = new Function(constantsCode + '\n' + utilsCode + '\n' + storeCode + '\nreturn { Store, INITIAL_DATA, generateUUID };');
const globals = setupGlobals();

// Assign to global scope
global.Store = globals.Store;
global.INITIAL_DATA = globals.INITIAL_DATA;
global.generateUUID = globals.generateUUID;

const { Store, INITIAL_DATA } = globals;

describe('Store', () => {
  let store;

  beforeEach(() => {
    localStorage.clear();
    store = new Store();
  });

  describe('Initialization', () => {
    it('should initialize with default INITIAL_DATA on first load', () => {
      expect(store.data).toBeDefined();
      expect(store.data.routines).toBeDefined();
      expect(store.data.schedules).toBeDefined();
      expect(store.data.todos).toBeDefined();
      expect(store.data.settings).toBeDefined();
    });

    it('should set isFirstTime flag on first load', () => {
      expect(store.isFirstTime).toBe(true);
    });

    it('should load data from localStorage if available', () => {
      const testData = {
        routines: [{ id: 'test-r1', title: 'Test Routine', time: '08:00', isCompleted: false, repeat: '매일', actions: [] }],
        schedules: [],
        todos: [],
        settings: { sectionOrder: ['routines'], visibleSections: { routines: true }, dateFormat: 'YYYY. MM. DD.', timeFormat: 'HH:mm', screenWakeLock: false }
      };
      localStorage.setItem('productivity_hub_data_v1', JSON.stringify(testData));

      const newStore = new Store();
      expect(newStore.data.routines[0].title).toBe('Test Routine');
      expect(newStore.isFirstTime).toBeUndefined();
    });
  });

  describe('Data Migration', () => {
    it('should add actions array to routines without actions', () => {
      const oldData = {
        routines: [
          { id: 'r1', title: 'Old Routine', time: '08:00', isCompleted: false, repeat: '매일' }
        ],
        schedules: [],
        todos: [],
        settings: store.data.settings
      };

      const migrated = store.migrateData(oldData);
      expect(migrated.routines[0].actions).toEqual([]);
    });

    it('should preserve existing actions array', () => {
      const data = {
        routines: [
          { id: 'r1', title: 'Routine', time: '08:00', isCompleted: false, repeat: '매일', actions: [{ id: 'a1', title: 'Action', isCompleted: false }] }
        ],
        schedules: [],
        todos: [],
        settings: store.data.settings
      };

      const migrated = store.migrateData(data);
      expect(migrated.routines[0].actions).toHaveLength(1);
      expect(migrated.routines[0].actions[0].title).toBe('Action');
    });
  });

  describe('Observer Pattern', () => {
    it('should notify subscribers on data change', () => {
      const listener = vi.fn();
      store.subscribe(listener);

      expect(listener).toHaveBeenCalledTimes(1); // Initial call on subscribe

      store.save();
      expect(listener).toHaveBeenCalledTimes(2);
    });

    it('should pass current data to listener', () => {
      const listener = vi.fn();
      store.subscribe(listener);

      expect(listener).toHaveBeenCalledWith(store.data);
    });
  });

  describe('Routine Management', () => {
    it('should add a new routine', () => {
      const initialLength = store.data.routines.length;
      store.addRoutine({ title: 'New Routine', time: '10:00', repeat: '매일' });

      expect(store.data.routines.length).toBe(initialLength + 1);
      const newRoutine = store.data.routines[store.data.routines.length - 1];
      expect(newRoutine.title).toBe('New Routine');
      expect(newRoutine.id).toBeDefined();
      expect(newRoutine.isCompleted).toBe(false);
      expect(newRoutine.actions).toEqual([]);
    });

    it('should toggle routine completion status', () => {
      const routine = store.data.routines[0];
      const originalStatus = routine.isCompleted;

      store.toggleRoutine(routine.id);
      expect(store.data.routines[0].isCompleted).toBe(!originalStatus);

      store.toggleRoutine(routine.id);
      expect(store.data.routines[0].isCompleted).toBe(originalStatus);
    });

    it('should update routine data', () => {
      const routine = store.data.routines[0];
      store.updateItem('routine', routine.id, { title: 'Updated Title', time: '12:00' });

      const updated = store.data.routines.find(r => r.id === routine.id);
      expect(updated.title).toBe('Updated Title');
      expect(updated.time).toBe('12:00');
    });

    it('should delete a routine', () => {
      const routineToDelete = store.data.routines[0];
      const initialLength = store.data.routines.length;

      store.deleteItem('routine', routineToDelete.id);

      expect(store.data.routines.length).toBe(initialLength - 1);
      expect(store.data.routines.find(r => r.id === routineToDelete.id)).toBeUndefined();
    });
  });

  describe('Action Management', () => {
    it('should add action to routine', () => {
      const routine = store.data.routines[0];
      const initialActionsLength = routine.actions?.length || 0;

      store.addActionToRoutine(routine.id, 'New Action');

      const updated = store.data.routines.find(r => r.id === routine.id);
      expect(updated.actions).toHaveLength(initialActionsLength + 1);
      const newAction = updated.actions[updated.actions.length - 1];
      expect(newAction.title).toBe('New Action');
      expect(newAction.id).toBeDefined();
      expect(newAction.isCompleted).toBe(false);
    });

    it('should toggle action completion status', () => {
      const routine = store.data.routines.find(r => r.actions && r.actions.length > 0);
      if (!routine) {
        // Add an action first
        const firstRoutine = store.data.routines[0];
        store.addActionToRoutine(firstRoutine.id, 'Test Action');
        const action = store.data.routines.find(r => r.id === firstRoutine.id).actions[0];

        store.toggleAction(firstRoutine.id, action.id);
        const updated = store.data.routines.find(r => r.id === firstRoutine.id).actions[0];
        expect(updated.isCompleted).toBe(true);
      } else {
        const action = routine.actions[0];
        const originalStatus = action.isCompleted;

        store.toggleAction(routine.id, action.id);
        const updated = store.data.routines.find(r => r.id === routine.id).actions[0];
        expect(updated.isCompleted).toBe(!originalStatus);
      }
    });

    it('should update action data', () => {
      const routine = store.data.routines[0];
      store.addActionToRoutine(routine.id, 'Action to Update');

      const action = store.data.routines.find(r => r.id === routine.id).actions[0];
      store.updateAction(routine.id, action.id, { title: 'Updated Action' });

      const updated = store.data.routines.find(r => r.id === routine.id).actions[0];
      expect(updated.title).toBe('Updated Action');
    });

    it('should delete action from routine', () => {
      const routine = store.data.routines[0];
      store.addActionToRoutine(routine.id, 'Action to Delete');

      const actionToDelete = store.data.routines.find(r => r.id === routine.id).actions[0];
      const initialLength = store.data.routines.find(r => r.id === routine.id).actions.length;

      store.deleteAction(routine.id, actionToDelete.id);

      const updated = store.data.routines.find(r => r.id === routine.id);
      expect(updated.actions.length).toBe(initialLength - 1);
    });
  });

  describe('Schedule Management', () => {
    it('should add a new schedule', () => {
      const initialLength = store.data.schedules.length;
      store.addSchedule({ title: 'New Schedule', start: '10:00', end: '11:00', isAllDay: false });

      expect(store.data.schedules.length).toBe(initialLength + 1);
      const newSchedule = store.data.schedules[store.data.schedules.length - 1];
      expect(newSchedule.title).toBe('New Schedule');
      expect(newSchedule.id).toBeDefined();
    });

    it('should update schedule data', () => {
      const schedule = store.data.schedules[0];
      store.updateItem('schedule', schedule.id, { title: 'Updated Schedule' });

      const updated = store.data.schedules.find(s => s.id === schedule.id);
      expect(updated.title).toBe('Updated Schedule');
    });

    it('should delete a schedule', () => {
      const scheduleToDelete = store.data.schedules[0];
      const initialLength = store.data.schedules.length;

      store.deleteItem('schedule', scheduleToDelete.id);

      expect(store.data.schedules.length).toBe(initialLength - 1);
      expect(store.data.schedules.find(s => s.id === scheduleToDelete.id)).toBeUndefined();
    });
  });

  describe('Todo Management', () => {
    it('should add a new todo', () => {
      const initialLength = store.data.todos.length;
      store.addTodo({ title: 'New Todo', dueDate: '2026-02-01', priority: 'high' });

      expect(store.data.todos.length).toBe(initialLength + 1);
      const newTodo = store.data.todos[store.data.todos.length - 1];
      expect(newTodo.title).toBe('New Todo');
      expect(newTodo.id).toBeDefined();
      expect(newTodo.isCompleted).toBe(false);
    });

    it('should toggle todo completion status', () => {
      const todo = store.data.todos[0];
      const originalStatus = todo.isCompleted;

      store.toggleTodo(todo.id);
      expect(store.data.todos[0].isCompleted).toBe(!originalStatus);

      store.toggleTodo(todo.id);
      expect(store.data.todos[0].isCompleted).toBe(originalStatus);
    });

    it('should update todo data', () => {
      const todo = store.data.todos[0];
      store.updateItem('todo', todo.id, { title: 'Updated Todo', priority: 'low' });

      const updated = store.data.todos.find(t => t.id === todo.id);
      expect(updated.title).toBe('Updated Todo');
      expect(updated.priority).toBe('low');
    });

    it('should delete a todo', () => {
      const todoToDelete = store.data.todos[0];
      const initialLength = store.data.todos.length;

      store.deleteItem('todo', todoToDelete.id);

      expect(store.data.todos.length).toBe(initialLength - 1);
      expect(store.data.todos.find(t => t.id === todoToDelete.id)).toBeUndefined();
    });
  });

  describe('Settings Management', () => {
    it('should update settings', () => {
      store.updateSettings({ dateFormat: 'DD/MM/YYYY', timeFormat: 'hh:mm A' });

      expect(store.data.settings.dateFormat).toBe('DD/MM/YYYY');
      expect(store.data.settings.timeFormat).toBe('hh:mm A');
    });

    it('should preserve other settings when updating', () => {
      const originalSectionOrder = store.data.settings.sectionOrder;
      store.updateSettings({ dateFormat: 'DD/MM/YYYY' });

      expect(store.data.settings.sectionOrder).toEqual(originalSectionOrder);
    });
  });

  describe('Persistence', () => {
    it('should save data to localStorage', () => {
      store.addRoutine({ title: 'Test Save', time: '10:00', repeat: '매일' });

      const stored = localStorage.getItem('productivity_hub_data_v1');
      expect(stored).toBeDefined();
      const parsed = JSON.parse(stored);
      expect(parsed.routines.some(r => r.title === 'Test Save')).toBe(true);
    });

    it('should persist data across store instances', () => {
      store.addRoutine({ title: 'Persist Test', time: '10:00', repeat: '매일' });

      const newStore = new Store();
      expect(newStore.data.routines.some(r => r.title === 'Persist Test')).toBe(true);
    });
  });
});
