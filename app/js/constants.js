/**
 * CalmDash 생산성 허브 - 상수 및 초기 데이터
 * 
 * 이 파일은 앱 전체에서 사용되는 설정값과 처음 실행 시 보여줄 예시 데이터를 담고 있습니다.
 */

// 앱을 처음 실행했을 때 사용자에게 보여줄 예시 데이터들입니다.
const INITIAL_DATA = {
    routines: [
        { id: 'r1', title: '아침 약 복용', time: '07:30', isCompleted: false, repeat: '매일', actions: [
            { id: 'a1', title: '영양제 먹기', isCompleted: false },
            { id: 'a2', title: '물 한잔 마시기', isCompleted: false }
        ]},
        { id: 'r2', title: '학교 가방 싸기', time: '08:00', isCompleted: true, repeat: '매일', actions: [] },
        { id: 'r3', title: '식물 물 주기', time: '09:00', isCompleted: false, repeat: '매주', actions: [] },
        { id: 'r4', title: '일일 보고서 제출', time: '17:00', isCompleted: false, repeat: '매일', actions: [] },
        { id: 'r5', title: '분리수거', time: '19:00', isCompleted: false, repeat: '수요일', actions: [] }
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
    ],
    settings: {
        sectionOrder: ['routines', 'todos', 'schedules'],
        visibleSections: {
            routines: true,
            todos: true,
            schedules: true
        },
        dateFormat: 'YYYY. MM. DD. (ddd)',
        timeFormat: 'HH:mm',
        screenWakeLock: false
    }
};

// 날씨 코드에 따른 아이콘 및 텍스트 매핑
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
