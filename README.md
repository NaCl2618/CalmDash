# CalmDash (E-Ink Optimized Productivity Hub)

**CalmDash**는 E-Ink 기기와 고대비 디스플레이에 최적화된 심플하고 강력한 개인용 생산성 대시보드입니다. 불필요한 장식을 배제하고, 눈의 피로를 최소화하면서도 일상 관리에 필요한 핵심 기능을 담았습니다.

---

## 🌟 주요 특징

### 🕶️ E-Ink 최적화 디자인
- **고대비 미니멀리즘**: 흑백 화면에서도 선명하게 보이는 디자인 시스템.
- **다크 모드 지원**: OLED 및 E-Ink 화면을 고려한 완벽한 반전 테마.
- **반응형 헤더**: 화면 크기에 따라 최적의 레이아웃으로 변경되는 반응형 UI.

### 📅 스마트한 일정 및 루틴 관리
- **스마트 필터링**:
    - **루틴**: '매일', '평일', '주말', '특정 요일'을 구분하여 오늘 할 일만 똑똑하게 노출.
    - **일정**: '오늘'과 '내일'의 핵심 일정에 집중할 수 있는 뷰 제공.
- **전체보기 토글**: 필터링된 데이터뿐만 아니라 등록된 모든 전체 데이터를 한눈에 볼 수 있는 기능 제공.
- **긴급 알림**: 마감 시간이 지난 완료되지 않은 항목을 자동으로 감지하여 강조 표시.

### ☁️ 실시간 정보 및 편의성
- **위치 기반 날씨**: GPS 및 IP 기반으로 도시 정보를 확인하고 실시간 날씨 정보를 연동.
- **위치 캐싱**: 잦은 권한 요청 팝업을 방지하기 위한 위치 정보 캐싱(3시간 유지) 시스템.
- **커스텀 타임 피커**: 모바일 및 E-Ink 기기에서도 조작이 편리한 맞춤형 시간 선택기.

### 🔒 프라이버시 및 보안
- **LocalStorage**: 별도의 서버 없이 모든 데이터는 사용자의 브라우저 내부에 안전하게 저장됩니다.
- **No Tracking**: 어떠한 개인정보도 수집하거나 외부로 전송하지 않습니다.

### 📱 화면 켜짐 유지 (Screen Wake Lock)
- **자동 화면 타임아웃 방지**: 대시보드를 항상 켜진 상태로 유지할 수 있습니다.
- **설정에서 토글 가능**: 배터리 관리를 위해 선택적으로 활성화/비활성화 가능.
- **브라우저 지원**:
  - Android: Chrome 84+, Firefox 126+, Opera 73+
  - iOS/iPadOS: Safari 16.6+
  - Desktop: Chrome 85+, Edge 90+, Firefox 126+, Safari 16.6+
- **HTTPS 필요**: 보안 컨텍스트(HTTPS 또는 localhost)에서만 작동합니다.

---

## 🛠️ 기술 스택

- **Core**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Styling**: Tailwind CSS & Custom E-Ink Design System
- **Icons**: Phosphor Icons
- **APIs**:
    - [Open-Meteo](https://open-meteo.com/) (Weather Data)
    - [BigDataCloud](https://www.bigdatacloud.com/) (Reverse Geocoding)

---

## 📂 프로젝트 구조

- `app/index.html`: 메인 애플리케이션 구조
- `app/css/style.css`: E-Ink 특화 스타일 및 다크 모드 정의
- `app/js/bundle.js`: 앱 핵심 로직 (Store 관리, 렌더링, API 연동)
- `data_structure.md`: 데이터 저장 구조 상세 설명서

---

## 🚀 시작하기

이 프로젝트는 별도의 빌드 과정이 필요 없는 순수 웹 프로젝트입니다.

1. 이 저장소를 클론하거나 다운로드합니다.
2. `app/index.html` 파일을 최신 웹 브라우저로 엽니다.
3. (선택) 위치 정보 권한을 승인하면 현재 위치의 날씨를 확인할 수 있습니다.

### 로컬 서버로 실행 (권장)

화면 켜짐 유지 기능을 사용하려면 HTTPS 또는 localhost가 필요합니다:

```bash
# Node.js가 설치되어 있다면:
npx http-server app -p 8080

# 또는 Python 3이 설치되어 있다면:
cd app
python -m http.server 8080
```

그런 다음 브라우저에서 `http://localhost:8080`으로 접속하세요.

### 테스트 실행

자동화된 E2E 테스트를 실행하려면:

```bash
npm install
npm test
```

## 🧪 테스트

이 프로젝트는 Playwright를 사용한 E2E 테스트를 포함합니다:
- **테스트 성공률**: 85.7% (6/7 테스트 통과)
- **테스트 커버리지**: Wake Lock API, LocalStorage, Page Visibility API 등 핵심 기능
- **브라우저 테스트**: Chromium 기반 브라우저에서 자동 테스트

---

## 📝 라이선스

이 프로젝트는 개인 학습 및 개인용 도구로 자유롭게 사용 및 수정이 가능합니다.
