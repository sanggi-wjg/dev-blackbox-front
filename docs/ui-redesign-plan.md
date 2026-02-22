# Dev Blackbox Frontend - UI 전체 리디자인 계획

## Context

현재 UI는 기능적으로 동작하지만, 디자인 시스템 없이 하드코딩된 색상/스타일이 산재하고, 컴포넌트 추상화가 부족하며, UserDetailPage에 대규모 코드 중복이 존재합니다. 시각적 완성도와 UX를 중심으로 *
*Tailwind CSS만 사용**하여 전체 리디자인을 진행합니다.

## 현재 상태 분석

### 주요 문제점

| 영역             | 문제                                                     | 영향도 |
|----------------|--------------------------------------------------------|-----|
| 디자인 시스템        | 시맨틱 컬러 토큰 없음. `bg-blue-600`, `text-gray-800` 등 하드코딩 산재 | 높음  |
| 버튼 스타일         | 5가지 이상의 서로 다른 버튼 패턴이 인라인으로 반복                          | 높음  |
| 폼 입력           | 동일한 className 패턴이 20회 이상 반복, FormInput 컴포넌트 없음         | 높음  |
| UserDetailPage | GitHub/Jira/Slack 섹션이 ~95% 동일 패턴 (512줄 코드 중복)          | 높음  |
| 모달             | 추상화 없이 UserForm에 인라인 오버레이 코드 존재                        | 중간  |
| 사이드바           | 이모지 아이콘(📊, 👥) 사용, 접기/펼치기 기능 없음                       | 중간  |
| 반응형            | `md:` 단일 브레이크포인트, 태블릿 최적화 없음                           | 중간  |
| 접근성            | 아이콘 버튼에 aria-label 없음, 키보드 내비게이션 제한적                   | 중간  |
| 애니메이션          | 토스트 slide-in 외 마이크로 인터랙션 없음                            | 낮음  |
| 타이포그래피         | `text-gray-500` 다중 사용으로 시각적 위계 불명확                     | 낮음  |

### 현재 파일 구조

```
src/
├── components/
│   ├── common/          # ErrorBoundary, ErrorMessage, EmptyState, LoadingSpinner,
│   │                    # SearchableSelect, Skeleton, Toast
│   ├── layout/          # AppLayout, Sidebar
│   ├── user/            # UserForm, UserSelect
│   └── summary/         # SummaryCard, SummaryDatePicker
├── pages/               # WorkLogPage, UserListPage, UserDetailPage, NotFoundPage
└── index.css            # Tailwind import + 커스텀 애니메이션 1개
```

---

## Phase 1: 디자인 시스템 기반 구축

### 1-1. 시맨틱 컬러 토큰 (`src/index.css`)

Tailwind CSS v4의 `@theme` 블록을 활용하여 프로젝트 전체에서 사용할 시맨틱 컬러 토큰을 정의합니다.

#### 토큰 체계

```
Brand      : brand-50 ~ brand-900     (oklch 기반 파란색 계열, 프라이머리 액션)
Surface    : surface                    (흰색, 카드/모달 배경)
             surface-secondary          (연한 회색, 페이지 배경)
             surface-tertiary           (더 진한 회색, 테이블 헤더/스켈레톤)
             surface-hover              (호버 상태 배경)
Text       : text-primary              (제목, 본문 - 거의 검정)
             text-secondary            (보조 텍스트 - 중간 회색)
             text-tertiary             (캡션, 플레이스홀더 - 연한 회색)
             text-inverse              (흰색, 어두운 배경 위 텍스트)
             text-link                 (링크 텍스트 - brand 계열)
Border     : border                    (기본 보더)
             border-strong             (강조 보더)
             border-focus              (포커스 링)
Status     : success-50/500/600        (성공 상태, 연결됨 표시)
             danger-50/500/600         (에러, 삭제 액션)
             warning-50/500            (경고)
Platform   : platform-github           (GitHub 회색)
             platform-jira             (Jira 파란색)
             platform-slack            (Slack 보라색)
             platform-confluence       (Confluence 파란색)
Shadow     : xs, sm, md, lg, xl, overlay
```

#### 새로운 애니메이션 키프레임

| 이름         | 용도           | 동작                               |
|------------|--------------|----------------------------------|
| `slide-in` | 토스트 알림       | translateX(100%) → 0 (기존)        |
| `slide-up` | 드롭다운 메뉴      | translateY(8px) + opacity 0 → 정상 |
| `fade-in`  | 페이지 전환, 오버레이 | opacity 0 → 1                    |
| `scale-in` | 모달 다이얼로그     | scale(0.95) + opacity 0 → 정상     |

#### 타이포그래피 규칙

| 역할         | 클래스                                                      |
|------------|----------------------------------------------------------|
| 페이지 제목     | `text-xl font-semibold text-text-primary tracking-tight` |
| 섹션 제목      | `text-base font-semibold text-text-primary`              |
| 카드 제목 / 라벨 | `text-sm font-medium text-text-primary`                  |
| 본문         | `text-sm text-text-secondary leading-relaxed`            |
| 캡션 / 메타    | `text-xs text-text-tertiary`                             |

### 1-2. SVG 아이콘 시스템 (`src/components/icons/index.tsx` - 신규)

Heroicons(MIT 라이선스)의 SVG 경로 데이터를 복사하여 React 컴포넌트로 작성합니다. 별도 라이브러리를 설치하지 않습니다.

#### 필요한 아이콘 목록

**UI 아이콘:**

- `ChartBarIcon` — 사이드바 업무일지 메뉴
- `UsersIcon` — 사이드바 사용자관리 메뉴
- `ChevronLeftIcon` / `ChevronRightIcon` — 날짜 네비게이션
- `XMarkIcon` — 모달/토스트 닫기
- `PlusIcon` — 생성 버튼
- `ArrowLeftIcon` — 뒤로가기
- `MenuIcon` — 모바일 햄버거 메뉴
- `ExclamationTriangleIcon` — 에러 상태
- `InboxIcon` — 빈 상태
- `CheckCircleIcon` — 성공 토스트
- `InfoCircleIcon` — 정보 토스트
- `ChevronDownIcon` — 드롭다운 인디케이터
- `CalendarIcon` — 날짜 선택
- `ArrowPathIcon` — 새로고침/수집 버튼
- `ChevronUpDownIcon` — 사이드바 접기/펼치기

**플랫폼 아이콘:**

- `GitHubIcon` — GitHub 로고
- `JiraIcon` — Jira 로고
- `SlackIcon` — Slack 로고

#### 컴포넌트 인터페이스

```tsx
interface IconProps {
    className?: string;
}

// 모든 아이콘은 동일한 인터페이스, 기본 className='h-5 w-5'
export function ChartBarIcon({className = 'h-5 w-5'}: IconProps) { ...
}
```

---

## Phase 2: 공통 컴포넌트 라이브러리

### 신규 컴포넌트

모든 신규 컴포넌트는 `src/components/common/`에 위치합니다.

#### Button (`Button.tsx`)

현재 프로젝트에 5가지 이상의 서로 다른 버튼 패턴이 인라인으로 반복되고 있습니다.

**API:**

```tsx
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    icon?: ReactNode;
}
```

**Variant 매핑:**

| Variant     | 용도                 | 스타일                  |
|-------------|--------------------|----------------------|
| `primary`   | 주요 액션 (생성, 저장, 수집) | brand-600 배경, 흰색 텍스트 |
| `secondary` | 보조 액션 (취소, 뒤로)     | 흰색 배경, 보더, 회색 텍스트    |
| `danger`    | 위험 액션 (삭제, 연결 해제)  | 흰색 배경, 빨간 보더, 빨간 텍스트 |
| `ghost`     | 텍스트 버튼 (네비게이션)     | 투명 배경, 호버 시 회색 배경    |

**Size 매핑:**

| Size | 높이   | 패딩   | 폰트      |
|------|------|------|---------|
| `sm` | h-8  | px-3 | text-xs |
| `md` | h-9  | px-4 | text-sm |
| `lg` | h-11 | px-5 | text-sm |

**공통 스타일:** `active:scale-[0.98]` 클릭 피드백, `disabled:opacity-50 disabled:pointer-events-none`

#### Input (`Input.tsx`)

```tsx
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    error?: boolean;
}
```

- `forwardRef` 지원
- 기본: `h-9 rounded-lg border-border` + 포커스 링 `ring-brand-500/20`
- 에러: `border-danger-500`
- 비활성: `bg-surface-tertiary cursor-not-allowed`

#### FormField (`FormField.tsx`)

```tsx
interface FormFieldProps {
    label: string;
    htmlFor?: string;
    error?: string;
    children: ReactNode;
}
```

label + children + 선택적 에러 메시지를 감싸는 래퍼 컴포넌트.

#### Card (`Card.tsx`)

```tsx
interface CardProps {
    children: ReactNode;
    className?: string;
    padding?: 'none' | 'sm' | 'md';
}
```

- `rounded-xl border border-border bg-surface shadow-xs`
- 서브컴포넌트: `CardHeader`, `CardBody`
- `padding="none"`: 테이블 등 내부 패딩을 직접 관리하는 경우

#### Modal (`Modal.tsx`)

```tsx
interface ModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    footer?: ReactNode;
    size?: 'sm' | 'md' | 'lg';
}
```

- overlay: `bg-black/40 animate-fade-in`
- dialog: `rounded-xl bg-surface shadow-overlay animate-scale-in`
- ESC 키로 닫기, 오버레이 클릭으로 닫기
- `body overflow: hidden` (스크롤 잠금)
- `role="dialog" aria-modal="true"`
- 추가로 `ConfirmDialog` 서브컴포넌트 (confirm() 대체용)

#### Badge (`Badge.tsx`)

```tsx
type BadgeVariant = 'default' | 'success' | 'danger' | 'brand'
    | 'github' | 'jira' | 'slack' | 'confluence';
```

- `rounded-md px-2 py-0.5 text-xs font-semibold`
- 플랫폼별 색상은 시맨틱 토큰 활용

#### Tabs (`Tabs.tsx`)

```tsx
// TabList: 탭 헤더 (하단 보더 인디케이터)
interface TabsProps {
    tabs: { id: string; label: string; icon?: ReactNode }[];
    activeTab: string;
    onChange: (id: string) => void;
}

// TabPanel: 탭 콘텐츠
interface TabPanelProps {
    active: boolean;
    children: ReactNode;
}
```

- 활성 탭: `border-b-2 border-brand-600 text-brand-600`
- 비활성 탭: `text-text-tertiary hover:text-text-secondary`
- `role="tablist"` / `role="tab"` / `role="tabpanel"` + `aria-selected`
- 탭 전환 시 `animate-fade-in`

### 기존 컴포넌트 리디자인

#### Toast (`src/components/common/Toast.tsx`)

**Before:** 단색 배경 블록 (success: green-600, error: red-600), 하단 우측
**After:**

- 흰색 배경 + 좌측 4px 컬러 보더 (success: success-500, error: danger-500, info: brand-500)
- 타입별 아이콘 추가 (CheckCircleIcon, XCircleIcon, InfoCircleIcon)
- 우측 닫기 버튼 (XMarkIcon)
- 위치: 상단 우측 (`top-4 right-4`)으로 변경
- 최대 너비 `max-w-sm`, 그림자 `shadow-lg`

#### EmptyState (`src/components/common/EmptyState.tsx`)

**Before:** 고정된 inbox 아이콘 + 단일 메시지
**After:**

- 커스텀 아이콘 지원 (`icon?: ReactNode`)
- title + description 분리 (2행 메시지)
- 선택적 액션 버튼은 Button 컴포넌트 활용

#### ErrorMessage (`src/components/common/ErrorMessage.tsx`)

**Before:** 빨간 보더 카드 + 메시지 텍스트만
**After:**

- `ExclamationTriangleIcon` 추가
- 선택적 재시도 버튼 (`retryAction?: () => void`)

#### Skeleton (`src/components/common/Skeleton.tsx`)

- 시맨틱 토큰 적용 (`bg-surface-tertiary animate-pulse`)
- 2컬럼 그리드 스켈레톤 추가 (WorkLogPage용)

#### SearchableSelect (`src/components/common/SearchableSelect.tsx`)

- 시맨틱 토큰 적용
- 드롭다운 열림: `animate-slide-up`
- 키보드 내비게이션: Arrow Up/Down, Enter 선택, Escape 닫기
- `ChevronDownIcon` SVG로 교체

#### LoadingSpinner (`src/components/common/LoadingSpinner.tsx`)

- 시맨틱 토큰 적용

---

## Phase 3: 레이아웃 리디자인

### 3-1. Sidebar (`src/components/layout/Sidebar.tsx`)

#### 반응형 동작

| 화면              | 동작                               |
|-----------------|----------------------------------|
| 모바일 (`< md`)    | 오프캔버스 오버레이 (기존 유지), 항상 확장 상태     |
| 태블릿 (`md ~ lg`) | 기본 접힘 (아이콘만, `w-16`), 호버/클릭으로 확장 |
| 데스크톱 (`> lg`)   | 기본 확장 (`w-64`), 접기 가능            |

#### 디자인 요소

- **배경**: `bg-surface-secondary` + 우측 보더 `border-r border-border`
- **로고 영역**: 상단에 "Dev Blackbox" 텍스트 + 아이콘 (접힘 시 아이콘만)
- **네비게이션 아이템**: SVG 아이콘 + 라벨 (접힘 시 아이콘만 + 툴팁)
- **활성 상태**: `bg-brand-50 text-brand-700` + 우측 2px 액센트 바
- **접기 토글**: 하단에 `ChevronUpDownIcon` 버튼
- **상태 저장**: `localStorage`에 접힘/확장 상태 저장

### 3-2. AppLayout (`src/components/layout/AppLayout.tsx`)

#### 변경사항

- 브레이크포인트: `md:` + `lg:` 추가 (현재 `md:`만 사용)
- 콘텐츠 배경: `bg-surface-secondary` (현재 흰색)
- 콘텐츠 최대 너비: `max-w-5xl mx-auto` (와이드 모니터 가독성)
- 콘텐츠 패딩: `p-4 md:p-6 lg:p-8`
- 모바일 헤더: 로고 아이콘 추가, `border-b` → `shadow-xs` 교체

---

## Phase 4: 페이지별 리디자인

### 4-1. WorkLogPage (`src/pages/WorkLogPage.tsx`)

#### 레이아웃 변경

```
[페이지 헤더]
  h1: "업무일지"
  subtitle: "플랫폼별 일일 업무 요약을 확인합니다"

[컨트롤 바 - Card 컴포넌트]
  flex-wrap: UserSearchableSelect | DatePicker | CollectButton(조건부)

[요약 카드 그리드]
  grid grid-cols-1 lg:grid-cols-2 gap-4
  [GitHub Card]     [Jira Card]
  [Slack Card]      [Confluence Card]
```

#### 세부 변경

- `UserSelect` (네이티브 select) → `SearchableSelect`로 교체하여 일관성 확보
- 수동 수집 버튼: `invisible` 클래스 해킹 제거, 조건부 렌더링 사용
- `Button` 컴포넌트 적용 (variant="primary", icon=ArrowPathIcon)

#### SummaryCard (`src/components/summary/SummaryCard.tsx`) 리디자인

- Card 컴포넌트 기반
- 좌측 보더 → 플랫폼 시맨틱 색상 토큰 사용
- Badge 컴포넌트로 플랫폼 라벨 표시 + SVG 플랫폼 아이콘
- 카드 호버 효과: `transition-shadow hover:shadow-md`

#### SummaryDatePicker (`src/components/summary/SummaryDatePicker.tsx`) 리디자인

- `◀` / `▶` 유니코드 문자 → `ChevronLeftIcon` / `ChevronRightIcon` SVG
- Button(ghost, sm) 컴포넌트 활용
- Input 컴포넌트 스타일 적용
- "오늘" 퀵셀렉트 버튼 추가

### 4-2. UserListPage (`src/pages/UserListPage.tsx`)

#### 레이아웃 변경

```
[페이지 헤더]
  h1: "사용자 관리" + Button(PlusIcon, "사용자 생성")

[사용자 테이블 - Card(padding="none")]
  Desktop: 테이블 (아바타 원형 + 이름 + 이메일 + 타임존 + 셰브론)
  Mobile:  카드 리스트 (아바타 + 이름 + 이메일)
```

#### 세부 변경

- 테이블을 Card(padding="none")로 감싸기
- 테이블 헤더 중복 제거 (로딩/로딩완료 상태에서 공유)
- 각 행에 아바타 원형: `bg-brand-100 text-brand-700 rounded-full h-8 w-8` (이니셜)
- 행 전체 클릭 가능: `hover:bg-surface-hover transition-colors cursor-pointer`
- "상세" 텍스트 링크 → 우측 `ChevronRightIcon`
- 모바일 카드: 아바타 + `shadow-xs hover:shadow-sm transition-shadow`
- 사용자 생성: `UserForm`이 새로운 Modal 컴포넌트 활용

### 4-3. UserDetailPage (`src/pages/UserDetailPage.tsx`) — 핵심 리팩토링

**현재 문제:** 512줄, GitHub/Jira/Slack 섹션이 거의 동일한 패턴으로 3번 반복

#### IntegrationSection 추출 (`src/components/integration/IntegrationSection.tsx` - 신규)

```tsx
interface IntegrationSectionProps {
    title: string;
    icon: ReactNode;
    connected: boolean;
    connectedContent: ReactNode;   // 연결된 상태의 상세 정보
    disconnectButton: ReactNode;   // 연결 해제 버튼
    connectForm: ReactNode;        // 연결 폼
    emptyMessage: string;          // 미연결 상태 메시지
}
```

3개 플랫폼의 공통 패턴을 하나의 컴포넌트로 추상화합니다.

#### Tabs 패턴 적용

```
[뒤로가기 - Button(ghost) + ArrowLeftIcon]

[사용자 정보 카드]
  아바타 원형 + 이름 + 이메일/타임존/생성일

[연동 설정 - Tabs]
  [ GitHub | Jira | Slack ]
  ─────────────────────────
  [선택된 탭의 IntegrationSection]
```

- 각 탭 라벨 옆에 연결 상태 표시: 초록 dot (`h-2 w-2 rounded-full bg-success-500`)
- `confirm()` 호출 → `ConfirmDialog` (Modal 기반) 교체

#### 예상 결과

- **코드량**: 512줄 → ~200줄 (IntegrationSection 추출 + Tabs 패턴)
- **중복 제거**: ~95% 동일 코드가 공유 컴포넌트로 통합

### 4-4. NotFoundPage (`src/pages/NotFoundPage.tsx`)

- 대형 404 숫자: `text-8xl font-bold text-brand-100`
- 제목: "페이지를 찾을 수 없습니다"
- 설명: "요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다."
- 홈 이동: Button(primary) + ArrowLeftIcon

---

## Phase 5: UX 개선

### 마이크로 인터랙션

| 요소       | 효과                                               |
|----------|--------------------------------------------------|
| 페이지 래퍼   | `animate-fade-in`                                |
| 인터랙티브 카드 | `transition-shadow duration-150 hover:shadow-md` |
| 버튼 클릭    | `active:scale-[0.98]`                            |
| 모달 오버레이  | `animate-fade-in`                                |
| 모달 다이얼로그 | `animate-scale-in`                               |
| 드롭다운 메뉴  | `animate-slide-up`                               |
| 탭 전환     | `animate-fade-in` on TabPanel                    |
| 사이드바 내비  | `transition-colors duration-150`                 |

### 접근성 (a11y)

| 개선 항목           | 대상                                                                                 |
|-----------------|------------------------------------------------------------------------------------|
| `aria-label` 추가 | 모바일 메뉴 버튼, 날짜 이전/다음 버튼, 모달/토스트 닫기 버튼                                               |
| 포커스 트랩          | Modal 내부에서 Tab 순환                                                                  |
| `role` 속성       | Modal(`dialog`), Tabs(`tablist/tab/tabpanel`), Toast(`alert`)                      |
| `aria-selected` | Tabs 활성 탭                                                                          |
| 키보드 내비게이션       | SearchableSelect (Arrow/Enter/Escape)                                              |
| 포커스 링 통일        | `focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-2` |

---

## 구현 순서

| 순서 | 단계        | 작업 내용                                                                       | 대상 파일                                            |
|----|-----------|-----------------------------------------------------------------------------|--------------------------------------------------|
| 1  | 디자인 기반    | 시맨틱 토큰 + 키프레임 정의                                                            | `src/index.css`                                  |
| 2  | 아이콘       | SVG 아이콘 시스템                                                                 | `src/components/icons/index.tsx` (신규)            |
| 3  | 기본 컴포넌트   | Button, Input, FormField, Card                                              | `src/components/common/` (신규 4개)                 |
| 4  | 고급 컴포넌트   | Modal, Badge, Tabs                                                          | `src/components/common/` (신규 3개)                 |
| 5  | 컴포넌트 리디자인 | Toast, EmptyState, ErrorMessage, Skeleton, SearchableSelect, LoadingSpinner | `src/components/common/` (수정 6개)                 |
| 6  | 레이아웃      | Sidebar, AppLayout                                                          | `src/components/layout/` (수정 2개)                 |
| 7  | 페이지 (1)   | WorkLogPage + SummaryCard + SummaryDatePicker                               | `src/pages/`, `src/components/summary/`          |
| 8  | 페이지 (2)   | UserListPage + UserForm                                                     | `src/pages/`, `src/components/user/`             |
| 9  | 페이지 (3)   | IntegrationSection + UserDetailPage                                         | `src/components/integration/` (신규), `src/pages/` |
| 10 | 페이지 (4)   | NotFoundPage                                                                | `src/pages/`                                     |
| 11 | 폴리싱       | 애니메이션, 접근성, 반응형 테스트, 잔여 하드코딩 색상 제거                                          | 전체                                               |

---

## 파일 변경 요약

### 신규 파일 (9개)

| 파일                                                  | 역할                 |
|-----------------------------------------------------|--------------------|
| `src/components/icons/index.tsx`                    | SVG 아이콘 시스템        |
| `src/components/common/Button.tsx`                  | 버튼 컴포넌트            |
| `src/components/common/Input.tsx`                   | 입력 컴포넌트            |
| `src/components/common/FormField.tsx`               | 폼 필드 래퍼            |
| `src/components/common/Card.tsx`                    | 카드 컴포넌트            |
| `src/components/common/Modal.tsx`                   | 모달 + ConfirmDialog |
| `src/components/common/Badge.tsx`                   | 배지 컴포넌트            |
| `src/components/common/Tabs.tsx`                    | 탭 컴포넌트             |
| `src/components/integration/IntegrationSection.tsx` | 플랫폼 연동 공통 섹션       |

### 수정 파일 (16개)

| 파일                                             | 주요 변경                          |
|------------------------------------------------|--------------------------------|
| `src/index.css`                                | @theme 토큰, 키프레임 추가             |
| `src/components/common/Toast.tsx`              | 디자인 전면 변경                      |
| `src/components/common/EmptyState.tsx`         | 커스텀 아이콘/설명 지원                  |
| `src/components/common/ErrorMessage.tsx`       | 아이콘 + 재시도 버튼                   |
| `src/components/common/Skeleton.tsx`           | 토큰 적용 + 그리드 스켈레톤               |
| `src/components/common/SearchableSelect.tsx`   | 토큰 + 애니메이션 + 키보드               |
| `src/components/common/LoadingSpinner.tsx`     | 토큰 적용                          |
| `src/components/layout/Sidebar.tsx`            | 접기/펼치기, SVG 아이콘                |
| `src/components/layout/AppLayout.tsx`          | 브레이크포인트, 배경, 최대너비              |
| `src/components/user/UserForm.tsx`             | Modal + FormField + Input 활용   |
| `src/components/user/UserSelect.tsx`           | SearchableSelect로 교체 또는 제거     |
| `src/components/summary/SummaryCard.tsx`       | Card + Badge + 플랫폼 아이콘         |
| `src/components/summary/SummaryDatePicker.tsx` | SVG 아이콘 + Button + "오늘" 버튼     |
| `src/pages/WorkLogPage.tsx`                    | 전체 레이아웃 리디자인                   |
| `src/pages/UserListPage.tsx`                   | 테이블/카드 리디자인                    |
| `src/pages/UserDetailPage.tsx`                 | Tabs + IntegrationSection 리팩토링 |
| `src/pages/NotFoundPage.tsx`                   | 디자인 개선                         |

---

## 검증 방법

1. **빌드 확인**: `npm run build` — TypeScript 컴파일 + Vite 빌드 성공
2. **시각적 확인**: `npm run dev` — 각 페이지 (/, /users, /users/:id, /없는경로)
3. **반응형 테스트**: 375px (모바일), 768px (태블릿), 1280px (데스크톱)
4. **인터랙션 테스트**: 모달 열기/닫기(ESC), 토스트 표시, 탭 전환, 드롭다운 키보드 조작
5. **린트 확인**: `npm run lint` — ESLint 통과