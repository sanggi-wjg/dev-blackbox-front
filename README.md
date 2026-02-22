# Dev Blackbox Frontend

개발자 활동 데이터(GitHub, Jira) 수집 + LLM 일일 업무 일지 자동 생성 시스템의 프론트엔드

## 실행 방법

### 사전 요구사항

- Node.js 18+
- 백엔드 서버 실행 중 (`http://localhost:8000`)

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (http://localhost:5173)
npm run dev
```

### API 코드 생성 (orval)

백엔드 API가 변경된 경우, 아래 명령으로 타입/훅을 재생성합니다.
백엔드 서버가 실행 중이어야 합니다.

```bash
npm run generate
```

### 빌드

```bash
npm run build
```

### 환경변수

`.env` 파일에서 백엔드 API 주소를 설정합니다.

```
VITE_API_BASE_URL=http://localhost:8000
```
