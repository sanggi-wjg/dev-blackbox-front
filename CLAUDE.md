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
│   ├── axios-instance.ts          # Axios 커스텀 인스턴스 (baseURL, interceptor)
│   └── generated/                 # [자동생성] orval이 생성한 React Query 훅 + 모델
│       ├── model/                 # DTO 타입 정의 (25+ 모델)
│       ├── github-event/          # GitHub 이벤트 수집 API
│       ├── github-secret/         # GitHub PAT 관리 API
│       ├── health/                # 헬스체크 API
│       ├── home/                  # 루트 API
│       ├── jira-user/             # Jira 사용자 연동 API
│       ├── slack-user/            # Slack 사용자 연동 API
│       ├── user/                  # 사용자 CRUD API
│       └── work-log/              # 업무 일지 API
├── components/
│   ├── common/                    # 공통 UI
│   │   ├── EmptyState.tsx         # 빈 상태 플레이스홀더
│   │   ├── ErrorBoundary.tsx      # React 에러 바운더리
│   │   ├── ErrorMessage.tsx       # 에러 메시지 표시
│   │   ├── LoadingSpinner.tsx     # 로딩 스피너
│   │   ├── SearchableSelect.tsx   # 검색 가능한 드롭다운 셀렉트
│   │   ├── Skeleton.tsx           # 스켈레톤 로딩 (Skeleton, SummaryCardSkeleton, TableRowSkeleton)
│   │   └── Toast.tsx              # 토스트 알림 시스템 (Context + useToast 훅)
│   ├── layout/                    # 레이아웃
│   │   ├── AppLayout.tsx          # 메인 레이아웃 (반응형 Sidebar + Outlet)
│   │   └── Sidebar.tsx            # 네비게이션 사이드바
│   ├── user/                      # 사용자 관련
│   │   ├── UserForm.tsx           # 사용자 생성 모달 폼
│   │   └── UserSelect.tsx         # 사용자 드롭다운 셀렉터
│   └── summary/                   # 요약 관련
│       ├── SummaryCard.tsx        # 플랫폼별 업무일지 카드 (마크다운 렌더링)
│       └── SummaryDatePicker.tsx  # 날짜 선택 (이전/다음 네비게이션)
├── pages/
│   ├── WorkLogPage.tsx            # 업무일지 대시보드 (/)
│   ├── UserListPage.tsx           # 사용자 목록 관리 (/users)
│   ├── UserDetailPage.tsx         # 사용자 상세 + 외부 연동 설정 (/users/:userId)
│   └── NotFoundPage.tsx           # 404 페이지
├── hooks/                         # 커스텀 훅 (현재 비어있음)
├── utils/                         # 유틸리티 (현재 비어있음)
├── styles/                        # 스타일
├── App.tsx                        # 라우트 정의
├── main.tsx                       # 앱 진입점 (QueryClient, BrowserRouter, ToastProvider)
└── index.css                      # Tailwind CSS 임포트 + 커스텀 애니메이션
```

### API 코드 생성 (Orval)

`src/api/generated/` 디렉토리는 Orval이 자동 생성하므로 **직접 수정 금지**. API 변경 시 `npm run generate`로 재생성한다.

- Orval 설정: `orval.config.ts` — `tags-split` 모드, `react-query` 클라이언트, `axios` HTTP 클라이언트
- 모든 API 호출은 `src/api/axios-instance.ts`의 `customInstance`를 경유 (mutator 패턴)

### Routing

`App.tsx`에서 React Router v7 `<Routes>` 정의:

- `/` → WorkLogPage (업무일지 대시보드)
- `/users` → UserListPage (사용자 관리)
- `/users/:userId` → UserDetailPage (사용자 상세 + GitHub/Jira/Slack 연동)
- `*` → NotFoundPage

모든 라우트는 `AppLayout` 내부에 렌더링 (Sidebar + 반응형 모바일 헤더). `ErrorBoundary`로 감싸져 있음.

### State Management

- 서버 상태: TanStack React Query (QueryClient: retry 1, refetchOnWindowFocus false)
- 글로벌 UI 상태: Toast Context (`useToast` 훅)
- 로컬 상태: React useState

### Key Pages

- **WorkLogPage**: 사용자/날짜 선택 → 플랫폼별 업무일지 조회, GitHub 이벤트 수동 수집 버튼
- **UserListPage**: 사용자 목록 (데스크톱: 테이블, 모바일: 카드), 사용자 생성 모달
- **UserDetailPage**: 사용자 정보 + GitHub Secret(PAT), Jira 사용자, Slack 사용자 연동 관리

## Code Style

- Path alias: `@/` → `src/` (vite.config.ts, tsconfig)
- Tailwind CSS v4 유틸리티 클래스 직접 사용 (CSS 파일 최소화)
- 한국어 UI 텍스트, 한국어 주석 허용
- 컴포넌트: `export default function` 패턴
- 환경변수: `VITE_API_BASE_URL` (`.env` 파일, 기본값 `http://localhost:8000`)

## Gotchas

- **generated 디렉토리 수정 금지**: `src/api/generated/`는 orval이 관리. 수동 수정 시 다음 generate에서 덮어씌워짐
- **백엔드 서버 필수**: `npm run generate` 실행 시 `http://localhost:8000/openapi.json`에서 스펙을 가져오므로 백엔드가 실행 중이어야 함
- **Axios interceptor**: 응답 에러 시 `error.response.data.detail`을 메시지로 추출하여 `Error` 객체로 래핑 — 컴포넌트에서 `err.message`로 접근 가능
- **Axios timeout**: 30초 (`30000ms`)
- **hooks/utils 디렉토리**: 현재 비어있음 — 커스텀 훅이나 유틸리티 추가 시 해당 디렉토리 활용
