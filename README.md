# MeetFlow — Smart Meeting Scheduler

A production-quality scheduling service that finalizes meeting schedules with minimum communication cost while maximizing transparency and user trust.

## Live Demo

**사이트 바로 보기:** [https://scheduling-vzun.vercel.app](https://scheduling-vzun.vercel.app)

| 용도 | URL |
|------|-----|
| PC / 모바일 | https://scheduling-vzun.vercel.app |
| PC + 모바일 비교 | https://scheduling-vzun.vercel.app/preview |

> 별도 설치 없이 브라우저에서 바로 확인할 수 있습니다.

## Tech Stack

- **Next.js 15** (App Router)
- **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **shadcn/ui** (Radix primitives)
- **Zustand** (state + persistence)
- **Framer Motion** (animations)
- **Recharts** (analytics)
- **Lucide React** (icons)
- **Sonner** (toast notifications)

## Getting Started

```bash
npm install
npm run dev
```

터미널에 PC·모바일 접속 URL이 출력됩니다.

| 접속 방법 | URL |
|-----------|-----|
| **PC 브라우저** | http://localhost:3000 |
| **PC + 모바일 동시 비교** | http://localhost:3000/preview |
| **실제 스마트폰** (같은 Wi‑Fi) | `http://<PC-IP>:3000` (dev 실행 시 터미널에 표시) |

## index.html로 확인하기

`index.html` 파일이 생성되어 있습니다. **파일을 더블클릭만 하면 CSS/JS가 로드되지 않아** 빈 화면이 나올 수 있습니다.

### 올바른 확인 방법

프로젝트 폴더에서 **`open.command`** (또는 `start.command`)를 더블클릭하세요.

1. 자동으로 브라우저가 열립니다
2. 주소: **http://localhost:8080**
3. MeetFlow 회의 일정 관리 화면이 표시됩니다

### 정적 HTML 빌드 (개발자용)

```bash
npm run build:static
```

`site/` 폴더와 `index.html`이 생성됩니다.

## HTML/CSS와의 관계 (왜 파일을 직접 열면 안 되나요?)

이 프로젝트는 **HTML + CSS + JavaScript**로 화면을 만듭니다. 다만 일반 `.html` 파일과 달리 **Next.js(React)** 로 제작되어 있어서, 파일을 더블클릭해서 여는 방식으로는 동작하지 않습니다.

| 구분 | 설명 |
|------|------|
| **HTML** | React가 화면 구조를 생성 |
| **CSS** | Tailwind CSS가 스타일을 적용 (별도 `.css` 파일을 직접 수정하는 방식이 아님) |
| **JavaScript** | 버튼 클릭, 회의 데이터, 애니메이션 등 동작 처리 |
| **실행 방법** | 반드시 **개발 서버** 또는 **배포된 URL**로 접속해야 함 |

> ⚠️ `index.html`을 브라우저에서 직접 열면 **빈 화면**이 나올 수 있습니다. 아래 방법 중 하나를 사용하세요.

### 가장 쉬운 실행 방법 (Mac)

프로젝트 폴더에서 **`start.command`** 파일을 더블클릭하세요.

- Node.js가 없어도 자동 설치 후 실행됩니다
- 터미널에 **공개 URL**이 출력됩니다
- 해당 URL을 PC·모바일 브라우저에서 열면 됩니다


팀원이나 스테이크홀더에게 **URL만 공유**해서 PC·모바일에서 바로 확인할 수 있습니다.

### 방법 1: 임시 공개 링크 (가장 빠름)

```bash
npm install
npm run share
```

터미널에 `https://xxxx.trycloudflare.com` 형태의 **공개 URL**이 출력됩니다.

| 링크 | 용도 |
|------|------|
| `https://xxxx.trycloudflare.com` | PC·모바일 전체 앱 |
| `https://xxxx.trycloudflare.com/preview` | PC + 모바일 나란히 비교 |

> 임시 링크는 터미널을 종료하면 만료됩니다. 영구 링크가 필요하면 방법 2를 사용하세요.

### 방법 2: Vercel 영구 배포 (권장)

```bash
npm install
npx vercel login    # 최초 1회
npm run deploy
```

배포 완료 후 `https://your-project.vercel.app` 형태의 **고정 URL**이 생성됩니다.

- PC: `https://your-project.vercel.app`
- PC+모바일 비교: `https://your-project.vercel.app/preview`
- 모바일: 같은 URL을 스마트폰 브라우저에서 열면 자동으로 모바일 UI 적용

## PC & Mobile Preview (PC·모바일 확인 방법)

This prototype is **responsive** and adapts automatically by screen width:

| Screen width | Layout |
|--------------|--------|
| **≥ 768px** (PC, tablet landscape) | Left sidebar + multi-column content |
| **< 768px** (phone) | Top header + bottom tab bar + card layouts |

### 1. PC에서 확인 (권장)

```bash
npm run dev
```

브라우저에서 **http://localhost:3000** 을 엽니다.

- 왼쪽 **사이드바**: Dashboard, Meetings, Calendar, Analytics, Settings
- 넓은 화면용 **3열 레이아웃**, **캘린더 그리드** 가용성 입력

### 2. PC에서 PC·모바일 동시 비교 (권장)

**http://localhost:3000/preview** 에서 한 화면에 PC 레이아웃과 모바일 프레임을 나란히 확인할 수 있습니다.

- 화면 드롭다운으로 주요 페이지 전환
- iPhone / Android 프레임 크기 선택
- 개발자 도구 없이 스테이크홀더 리뷰에 적합

### 3. PC 브라우저에서 모바일 화면 시뮬레이션

개발 서버를 켠 상태에서:

1. **Chrome / Edge**: `F12` → **Toggle device toolbar** (`Ctrl+Shift+M` / Mac: `Cmd+Shift+M`)
2. 기기 선택: **iPhone 14**, **Pixel 7**, **iPad** 등
3. 새로고침 후 확인

모바일에서 보이는 UI:
- 상단 **MeetFlow** 헤더
- 하단 탭: **Meetings · Calendar · Notifications · Profile**
- 가용성 입력: **스크롤 카드** (탭으로 상태 변경)
- 하단 **고정 CTA** 버튼

### 4. 실제 스마트폰에서 확인 (같은 Wi‑Fi)

PC와 휴대폰이 **같은 Wi‑Fi**에 연결되어 있어야 합니다.

```bash
npm run dev
```

`npm run dev` 실행 시 터미널에 **Mobile (same Wi-Fi)** URL이 표시됩니다.

예: `http://192.168.0.12:3000`

> 방화벽에서 3000 포트가 막혀 있으면 허용해 주세요.

### 5. 화면별 모바일/PC 차이

| 기능 | PC (≥768px) | Mobile (<768px) |
|------|-------------|-----------------|
| 네비게이션 | 사이드바 | 하단 탭 + 상단 헤더 |
| 대시보드 | 3열 그리드 | 1열 카드 스택 |
| 가용성 입력 | 캘린더 그리드 | 스크롤 카드 |
| 캘린더 | 주간 7열 그리드 | 날짜별 카드 목록 |
| 추천 시간 | 3열 카드 | 1열 카드 스택 |
| 토스트 알림 | 우측 상단 | 상단 중앙 |

### 6. 추천 테스트 시나리오

**PC**
1. `/meetings/meeting-1` → 추천 시간 3개 나란히 확인
2. `/analytics` → 차트 레이아웃 확인

**Mobile**
1. `/meetings/meeting-2/availability` → 카드 탭으로 가용성 변경
2. `/notifications` → 알림 카드 + 하단 탭 동작
3. `/profile` → 참가자 전환 후 확인 요청 수락/거절


### Meeting Lifecycle
Draft → Invitation → Availability → Matching → Recommendation → Confirmation → Confirmed (with change request & re-matching flows)

### Core Capabilities
- **Meeting creation** with required/optional attendees, date ranges, priorities
- **Availability input** with 3-state cycling (Available / Preferred Not / Unavailable)
- **Matching engine** that filters unavailable required slots and ranks by attendance
- **Top 3 recommendations** with human-readable explanations (no internal scores)
- **Privacy-first preferred-not** — aggregated counts only unless manual coordination mode
- **Confirmation flow** — auto-confirm or send requests to preferred-not participants
- **Change requests** with automatic re-matching for required attendees
- **Organizer dashboard** with statistics and meeting management
- **Responsive design** — sidebar on desktop, bottom nav on mobile
- **Dark mode** toggle in settings
- **Toast notifications** for all key events

## Project Structure

```
src/
├── app/                    # Next.js pages
│   ├── page.tsx            # Dashboard
│   ├── meetings/           # Meeting list, create, detail, availability
│   ├── calendar/           # Week view calendar
│   ├── analytics/          # Charts and stats
│   ├── settings/           # Preferences & integrations
│   ├── notifications/      # Notification center
│   └── profile/            # User profile
├── components/
│   ├── layout/             # Sidebar, mobile nav, app shell
│   ├── meetings/           # Feature components
│   └── ui/                 # shadcn/ui primitives
├── lib/                    # Utils, matching engine, mock data
├── store/                  # Zustand store
└── types/                  # TypeScript definitions
```

## Component Documentation

See [docs/COMPONENTS.md](docs/COMPONENTS.md) for detailed component API reference.

## Demo Data

The app ships with mock users and sample meetings demonstrating all lifecycle states. Logged in as **Alex Chen** (organizer).

## Placeholder Integrations

- Google Calendar sync (Settings → Integrations)
- Slack notifications (Settings → Integrations)
