# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dev Blackbox Frontend — 개발자 활동 데이터(GitHub, Jira, Slack) 수집 + LLM 일일 업무 일지 자동 생성 시스템의 프론트엔드.

## Important

- **작업 전 코드 생성 우선**: API 관련 기능을 추가/수정할 때는 반드시 `npm run generate`를 먼저 실행하여 최신 백엔드 API 스펙을 반영한 후 작업한다.
- 백엔드 서버가 실행 중이지 않으면 사용자에게 어떻게 진행할지 물어봐야햔다.

## Commands

```bash
npm run dev        # 개발 서버 (http://localhost:5173)
npm run build      # tsc -b + vite build
npm run lint       # eslint
npm run preview    # 빌드된 앱 미리보기
npm run generate   # orval — 백엔드 OpenAPI → React Query 훅/타입 자동 생성 (백엔드 서버 실행 필요)
```

## Tech Stack

- React 19 + TypeScript 5.9 + Vite 7
- TanStack React Query v5 — 서버 상태 관리
- Tailwind CSS v4 (Vite plugin, `@tailwindcss/typography`)
- React Router v7 — 클라이언트 라우팅
- Orval — OpenAPI → React Query 훅/모델 코드 생성
- Axios — HTTP 클라이언트 (커스텀 인스턴스)
- react-markdown — 마크다운 렌더링
- dayjs — 날짜 처리

## Architecture

```
src/
├── api/
│   ├── axios-instance.ts          # Axios 커스텀 인스턴스 (baseURL, interceptor, 토큰 주입)
│   └── generated/                 # [자동생성] orval이 생성한 React Query 훅 + 모델
│       ├── model/                 # DTO 타입 정의
│       ├── auth/                  # 인증 (토큰 발급) API
│       ├── github-event/          # GitHub 이벤트 수집 API
│       ├── github-secret/         # GitHub PAT 관리 API
│       ├── health/                # 헬스체크 API
│       ├── home/                  # 루트 API
│       ├── jira-user/             # Jira 사용자 연동 API
│       ├── slack-user/            # Slack 사용자 연동 API
│       ├── user/                  # 사용자 API (내 정보 조회 포함)
│       ├── user-admin/            # 사용자 관리 API (관리자 전용)
│       └── work-log/              # 업무 일지 API
├── contexts/
│   ├── auth-context.ts            # AuthContext 타입 정의 + createContext
│   └── AuthContext.tsx            # AuthProvider (토큰 상태, 유저 쿼리, login/logout)
├── hooks/
│   └── useAuth.ts                 # useAuth 훅 (AuthContext 소비)
├── utils/
│   └── auth.ts                    # 토큰 저장/삭제, JWT 디코딩, 만료 체크, 역할 추출
├── components/
│   ├── common/                    # 공통 UI
│   │   ├── Badge.tsx              # 뱃지 컴포넌트
│   │   ├── Button.tsx             # 버튼 컴포넌트
│   │   ├── Card.tsx               # 카드 컴포넌트
│   │   ├── EmptyState.tsx         # 빈 상태 플레이스홀더
│   │   ├── ErrorBoundary.tsx      # React 에러 바운더리
│   │   ├── ErrorMessage.tsx       # 에러 메시지 표시
│   │   ├── FormField.tsx          # 폼 필드 래퍼
│   │   ├── Input.tsx              # 입력 컴포넌트
│   │   ├── LoadingSpinner.tsx     # 로딩 스피너
│   │   ├── Modal.tsx              # 모달 + ConfirmDialog
│   │   ├── SearchableSelect.tsx   # 검색 가능한 드롭다운 셀렉트
│   │   ├── Skeleton.tsx           # 스켈레톤 로딩
│   │   ├── Tabs.tsx               # 탭 + TabPanel
│   │   └── Toast.tsx              # 토스트 알림 시스템 (Context + useToast 훅)
│   ├── icons/                     # SVG 아이콘 컴포넌트
│   │   └── index.tsx              # GitHub, Jira, Slack 등 아이콘 모음
│   ├── integration/               # 외부 서비스 연동 UI
│   │   └── IntegrationSection.tsx # 연동 상태 표시/연결 폼 공통 섹션
│   ├── layout/                    # 레이아웃
│   │   ├── AppLayout.tsx          # 메인 레이아웃 (반응형 Sidebar + Outlet)
│   │   └── Sidebar.tsx            # 네비게이션 사이드바 (역할 기반 메뉴)
│   ├── user/                      # 사용자 관련
│   │   └── UserForm.tsx           # 사용자 생성 모달 폼
│   └── worklog/                   # 업무일지 관련
│       ├── ManualWorkLogEditor.tsx # 수동 업무일지 입력 에디터
│       ├── WorkLogCard.tsx        # 플랫폼별 업무일지 카드 (마크다운 렌더링)
│       └── WorkLogDatePicker.tsx  # 날짜 선택 (이전/다음 네비게이션)
├── pages/
│   ├── LoginPage.tsx              # 로그인 페이지 (/login)
│   ├── WorkLogPage.tsx            # 업무일지 대시보드 (/)
│   ├── ProfilePage.tsx            # 내 프로필 + 외부 연동 설정 (/profile)
│   ├── UserListPage.tsx           # 사용자 목록 관리 (/users, 관리자 전용)
│   └── NotFoundPage.tsx           # 404 페이지
├── styles/                        # 스타일
├── App.tsx                        # 라우트 정의 (ProtectedRoute, AdminRoute, GuestRoute)
├── main.tsx                       # 앱 진입점 (QueryClient, BrowserRouter, AuthProvider, ToastProvider)
└── index.css                      # Tailwind CSS 임포트 + 커스텀 애니메이션
```

### API 코드 생성 (Orval)

`src/api/generated/` 디렉토리는 Orval이 자동 생성하므로 **직접 수정 금지**. API 변경 시 `npm run generate`로 재생성한다.

- Orval 설정: `orval.config.ts` — `tags-split` 모드, `react-query` 클라이언트, `axios` HTTP 클라이언트
- 모든 API 호출은 `src/api/axios-instance.ts`의 `customInstance`를 경유 (mutator 패턴)

### Routing

`App.tsx`에서 React Router v7 `<Routes>` 정의:

- `/login` → LoginPage (GuestRoute — 인증 시 `/`로 리다이렉트)
- `/` → WorkLogPage (업무일지 대시보드)
- `/profile` → ProfilePage (내 프로필 + GitHub/Jira/Slack 연동)
- `/users` → UserListPage (AdminRoute — 관리자 전용)
- `*` → NotFoundPage

인증 관련 라우트 가드:
- **ProtectedRoute**: 미인증 시 `/login`으로 리다이렉트, 로딩/에러 상태 처리
- **AdminRoute**: 비관리자 시 `/`로 리다이렉트
- **GuestRoute**: 인증된 사용자가 `/login` 접근 시 `/`로 리다이렉트

모든 보호된 라우트는 `AppLayout` 내부에 렌더링 (Sidebar + 반응형 모바일 헤더). `ErrorBoundary`로 감싸져 있음.

### Authentication

- JWT 토큰 기반 인증 (OAuth2 password flow)
- 토큰 저장: `localStorage` (`access_token` 키)
- `AuthProvider` → `useAuth()` 훅으로 인증 상태/유저 정보/로그인/로그아웃 제공
- Axios request interceptor가 자동으로 `Authorization: Bearer <token>` 헤더 주입
- Axios response interceptor가 401 응답 시 토큰 삭제 + `auth:expired` 커스텀 이벤트 발생 → AuthContext에서 수신하여 로그아웃 처리
- 역할(role) 기반 접근 제어: JWT payload의 `role` 클레임으로 관리자 여부 판단

### State Management

- 서버 상태: TanStack React Query (QueryClient: retry 1, refetchOnWindowFocus false)
- 인증 상태: AuthContext (`AuthProvider` + `useAuth` 훅)
- 글로벌 UI 상태: Toast Context (`useToast` 훅)
- 로컬 상태: React useState

### Key Pages

- **LoginPage**: 이메일/비밀번호 로그인 폼
- **WorkLogPage**: 날짜 선택 → 플랫폼별 업무일지 조회, 수동 업무일지 입력, GitHub 이벤트 수동 수집
- **ProfilePage**: 내 프로필 정보 + GitHub Secret(PAT), Jira, Slack 외부 연동 관리 (탭 UI)
- **UserListPage**: 사용자 목록 (데스크톱: 테이블, 모바일: 카드), 사용자 생성 모달 (관리자 전용)

## Code Style

- Path alias: `@/` → `src/` (vite.config.ts, tsconfig)
- Tailwind CSS v4 유틸리티 클래스 직접 사용 (CSS 파일 최소화)
- 한국어 UI 텍스트, 한국어 주석 허용
- 컴포넌트: `export default function` 패턴
- 환경변수: `VITE_API_BASE_URL` (`.env` 파일, 기본값 `http://localhost:8000`)

## Gotchas

- **generated 디렉토리 수정 금지**: `src/api/generated/`는 orval이 관리. 수동 수정 시 다음 generate에서 덮어씌워짐
- **백엔드 서버 필수**: `npm run generate` 실행 시 `http://localhost:8000/openapi.json`에서 스펙을 가져오므로 백엔드가 실행 중이어야 함
- **Axios interceptor**: 응답 에러 시 `error.response.data.detail`을 메시지로 추출하여 `Error` 객체로 래핑 — 컴포넌트에서 `err.message`로 접근 가능. 401 응답 시 자동 토큰 삭제 및 `auth:expired` 이벤트 발생
- **Axios timeout**: 30초 (`30000ms`)
- **localStorage 방어 코딩**: `utils/auth.ts`의 토큰 접근 함수에 try-catch 적용 — Safari 프라이빗 모드 등 제한된 환경 대응
- **라우트 가드 체크 순서**: `ProtectedRoute`는 `isLoading → isAuthenticated → error → render` 순서로 체크. 로딩 완료 전에 자식이 렌더되지 않도록 보장
