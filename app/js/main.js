/**
 * CalmDash 생산성 허브 - 메인 진입점 (Entry Point)
 * 
 * 이 파일은 다른 모든 모듈을 불러와서 앱을 초기화하고 이벤트를 연결합니다.
 */


// import { Store } from './store.js';
// import { WEATHER_ICONS } from './constants.js';
// import { formatDate, formatTime, escapeHTML } from './utils.js';
// import { 
//     renderRoutines, 
//     renderSchedules, 
//     renderTodos, 
//     renderDashboardGrid, 
//     showAddModal, 
//     showSettingsModal, 
//     showGuideModal, 
//     showStorageInfoModal 
// } from './ui.js';

// 앱 인스턴스 생성
const app = new Store();

/**
 * @function initClock
 * @description 실시간 시계 업데이트
 */
function initClock() {
    const updateTime = () => {
        const clockElement = document.getElementById('live-clock');
        const dateElement = document.getElementById('live-date');
        const settings = app.data.settings;
        const now = new Date();

        if (clockElement) clockElement.textContent = formatTime(now, settings.timeFormat);
        if (dateElement) dateElement.textContent = formatDate(now, settings.dateFormat);
    };
    setInterval(updateTime, 10000);
    updateTime();
}

/**
 * @function initWeather
 * @description 날씨 정보 초기화
 */
async function initWeather() {
    const weatherElement = document.getElementById('live-weather');
    if (!weatherElement) return;

    const CACHE_KEY = 'calm_dash_location_cache';
    const CACHE_DURATION = 3 * 60 * 60 * 1000;

    try {
        let lat, lon, city;
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
            const { lat: cLat, lon: cLon, city: cCity, timestamp } = JSON.parse(cachedData);
            if (Date.now() - timestamp < CACHE_DURATION) {
                lat = cLat; lon = cLon; city = cCity;
            }
        }

        if (!lat || !lon) {
            weatherElement.innerHTML = `<span class="animate-pulse text-gray-400 italic">위치 확인 중...</span>`;
            const pos = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
            }).catch(() => null);

            if (pos) {
                lat = pos.coords.latitude;
                lon = pos.coords.longitude;
                const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=ko`);
                const geoData = await geoRes.json();
                city = geoData.city || geoData.locality || "내 주변";
                localStorage.setItem(CACHE_KEY, JSON.stringify({ lat, lon, city, timestamp: Date.now() }));
            } else {
                const locRes = await fetch('https://ip-api.com/json/');
                const locData = await locRes.json();
                if (locData.status === 'success') {
                    lat = locData.lat; lon = locData.lon; city = locData.city;
                } else {
                    throw new Error('위치 확인 불가');
                }
            }
        }

        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const weatherData = await weatherRes.json();
        const info = WEATHER_ICONS[weatherData.current_weather.weathercode] || { icon: 'ph-cloud', text: '날씨 정보 없음' };

        weatherElement.innerHTML = `
            <i class="ph ${info.icon} text-xl"></i>
            <span>${escapeHTML(city)} ${escapeHTML(info.text)} ${Math.round(weatherData.current_weather.temperature)}°C</span>
        `;
    } catch (error) {
        console.error('Weather error:', error);
        weatherElement.innerHTML = `<span class="text-gray-400">날씨 불러오기 실패</span>`;
    }
}

/**
 * @function setupEventListeners
 * @description 버튼 이벤트 연결
 */
function setupEventListeners() {
    document.querySelectorAll('[data-action^="add-"]').forEach(btn => {
        btn.onclick = (e) => showAddModal(e.target.closest('button').dataset.action.replace('add-', ''), app);
    });

    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    if (themeToggle && themeIcon) {
        themeToggle.onclick = () => {
            document.body.classList.toggle('dark-theme');
            const isDark = document.body.classList.contains('dark-theme');
            localStorage.setItem('calm_dash_theme', isDark ? 'dark' : 'normal');
            themeIcon.className = isDark ? 'ph ph-moon' : 'ph ph-sun';
        };
    }

    const storageTrigger = document.getElementById('storage-info-trigger');
    if (storageTrigger) storageTrigger.onclick = showStorageInfoModal;
}

/**
 * @function init
 * @description 앱 초기화 실행
 */
function init() {
    initClock();
    initWeather();
    setupEventListeners();

    let showAllRoutines = localStorage.getItem('calm_dash_show_all_routines') === 'true';
    let showAllSchedules = localStorage.getItem('calm_dash_show_all_schedules') === 'true';
    let todoSortType = localStorage.getItem('calm_dash_todo_sort') || 'priority';

    app.subscribe((data) => {
        renderRoutines(data.routines, 'routine-list', {
            onToggle: (id) => app.toggleRoutine(id),
            onDelete: (id) => app.deleteItem('routine', id),
            onEdit: (item) => showAddModal('routine', app, item)
        }, showAllRoutines);

        renderSchedules(data.schedules, 'schedule-list', {
            onDelete: (id) => app.deleteItem('schedule', id),
            onEdit: (item) => showAddModal('schedule', app, item)
        }, showAllSchedules);

        renderTodos(data.todos, 'todo-list', {
            onToggle: (id) => app.toggleTodo(id),
            onDelete: (id) => app.deleteItem('todo', id),
            onEdit: (item) => showAddModal('todo', app, item)
        }, todoSortType);

        renderDashboardGrid(data.settings);
    });

    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) settingsBtn.onclick = () => showSettingsModal(app, initClock);

    document.getElementById('toggle-routine-filter').onclick = () => {
        showAllRoutines = !showAllRoutines;
        localStorage.setItem('calm_dash_show_all_routines', showAllRoutines);
        app.notify();
    };

    document.getElementById('toggle-schedule-filter').onclick = () => {
        showAllSchedules = !showAllSchedules;
        localStorage.setItem('calm_dash_show_all_schedules', showAllSchedules);
        app.notify();
    };

    document.querySelector('[data-action="sort-priority"]').onclick = () => {
        todoSortType = 'priority';
        localStorage.setItem('calm_dash_todo_sort', todoSortType);
        app.notify();
    };

    document.querySelector('[data-action="sort-date"]').onclick = () => {
        todoSortType = 'date';
        localStorage.setItem('calm_dash_todo_sort', todoSortType);
        app.notify();
    };

    const savedTheme = localStorage.getItem('calm_dash_theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        const icon = document.getElementById('theme-icon');
        if (icon) icon.className = 'ph ph-moon';
    }

    if (app.isFirstTime) setTimeout(showGuideModal, 500);
}

// 시작!
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
