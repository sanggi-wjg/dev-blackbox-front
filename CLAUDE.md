# CLAUDE.md

## Project Overview

Dev Blackbox Frontend — 개발자 활동 데이터(GitHub, Jira, Slack) 수집 + LLM 일일 업무 일지 자동 생성 시스템의 프론트엔드.

## Important

- **작업 전 코드 생성 우선**: API 관련 기능을 추가/수정할 때는 반드시 `npm run generate`를 먼저 실행하여 최신 백엔드 API 스펙을 반영한 후 작업한다.
- 백엔드 서버가 실행 중이지 않으면 사용자에게 어떻게 진행할지 물어봐야 한다.
- `src/api/generated/` 디렉토리는 Orval이 자동 생성하므로 **직접 수정 금지**. API 변경 시 `npm run generate`로 재생성한다.

## Commands

```bash
npm run dev        # 개발 서버 (http://localhost:5173)
npm run build      # tsc -b + vite build
npm run lint       # eslint
npm run generate   # orval — 백엔드 OpenAPI → React Query 훅/타입 자동 생성 (백엔드 서버 http://localhost:8000 실행 필요)
```

## Tech Stack

React 19, TypeScript, Vite, TanStack React Query v5, Tailwind CSS v4, React Router v7, Orval (OpenAPI → React Query 코드
생성), Axios, react-markdown, dayjs, Milkdown (마크다운 WYSIWYG 에디터)

## Code Style

- Path alias: `@/` → `src/`
- Tailwind CSS v4 유틸리티 클래스 직접 사용 (CSS 파일 최소화)
- 한국어 UI 텍스트, 한국어 주석 허용
- 컴포넌트: `export default function` 패턴
- 환경변수: `VITE_API_BASE_URL` (`.env` 파일, 기본값 `http://localhost:8000`)

## Design Tokens (index.css)

UI 작성 시 반드시 디자인 토큰 색상을 사용한다. Tailwind 클래스에서 직접 사용 가능:

| 카테고리     | 토큰 예시                                                                          | 용도           |
|----------|--------------------------------------------------------------------------------|--------------|
| Brand    | `brand-50` ~ `brand-900`                                                       | 프라이머리 액션, 링크 |
| Surface  | `surface`, `surface-secondary`, `surface-tertiary`, `surface-hover`            | 배경색          |
| Text     | `text-primary`, `text-secondary`, `text-tertiary`, `text-inverse`, `text-link` | 텍스트 색상       |
| Border   | `border-primary`, `border-strong`, `border-focus`                              | 테두리          |
| Status   | `success-*`, `danger-*`, `warning-*`                                           | 상태 표시        |
| Platform | `platform-github`, `platform-jira`, `platform-slack`                           | 플랫폼 식별       |

- 사용법: `text-text-primary`, `bg-surface-secondary`, `border-border-primary`, `bg-brand-600`
- 다크 모드: `.dark` 클래스 기반 오버라이드 (ThemeProvider + useTheme 훅으로 관리)
- **하드코딩된 색상(#fff, gray-500 등) 사용 금지** — 반드시 디자인 토큰 사용

## Provider 계층 (main.tsx)

`QueryClientProvider > BrowserRouter > ThemeProvider > ToastProvider > AuthProvider > App`

## 페이지별 기본 날짜

| 페이지 | 기본 날짜 | 이유 |
|--------|----------|------|
| 플랫폼 업무일지 (`PlatformWorkLogPage`) | **어제** | 백엔드가 전일 활동 데이터를 수집·요약하므로, 가장 최근 완성된 요약은 어제 날짜 |
| 수기 업무일지 (`ManualWorkLogPage`) | **오늘** | 사용자가 당일 업무를 실시간으로 기록하는 용도 |

## Gotchas

- **Axios Idempotency**: POST/PUT/PATCH 요청에 `Idempotency-Key` 헤더가 자동 추가됨
- **Axios 에러 처리**: `error.response.data.detail`을 메시지로 추출 → `Error` 객체로 래핑. 컴포넌트에서 `err.message`로 접근
- **401 처리 예외**: `/api/v1/auth/token` 엔드포인트의 401은 인터셉터가 가로채지 않음 (잘못된 자격 증명 에러를 그대로 전달)
- **Axios timeout**: 30초
