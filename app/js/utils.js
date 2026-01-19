/**
 * CalmDash 생산성 허브 - 유틸리티 도구들
 * 
 * 이 파일은 데이터 변환, 고유 ID 생성, 보안 처리 등 공통적으로 사용되는 기능들을 담고 있습니다.
 */

/**
 * @function generateUUID
 * @description 고유한 이름표(ID)를 만듭니다.
 * @returns {string} 고유 ID 문자열
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

/**
 * @function escapeHTML
 * @description XSS 방지를 위해 특수 문자를 안전한 형태로 바꿉니다.
 * @param {string} str 원본 문자열
 * @returns {string} 변환된 문자열
 */
function escapeHTML(str) {
    if (!str) return '';
    const chars = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    };
    return String(str).replace(/[&<>"']/g, s => chars[s]);
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
 * @function getTimeSelectorHTML
 * @description 시간 선택 상자 HTML을 만듭니다.
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
