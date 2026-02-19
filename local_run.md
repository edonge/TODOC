# TODOC 로컬 실행 가이드

## 목적

브랜치에서 기능 개발 후, 로컬에서 직접 앱을 실행해 동작을 확인하는 절차입니다.

## 전제

- 프로젝트 경로: `/Users/kimjj/Documents/HCI/TODOC`
- 터미널 2개 필요
  - 터미널 A: 백엔드
  - 터미널 B: 프론트엔드

## 1) 백엔드 실행 (터미널 A)

```bash
cd TODOC/backend
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

설명:

- 마지막 `uvicorn ...`은 서버를 계속 실행하므로 종료되지 않는 것이 정상입니다.
- 종료는 `Ctrl + C`.

## 2) 프론트엔드 실행 (터미널 B)

```bash
cd TODOC/frontend
npm run dev
```

## 3) 프론트 API 주소 설정 (선택)

백엔드 주소를 명시적으로 고정하려면:

```bash
echo 'VITE_API_BASE_URL=http://localhost:8000' >> /Users/kimjj/Documents/HCI/TODOC/frontend/.env
```

이미 `.env`에 값이 있으면 중복 추가 대신 직접 수정하세요.

## 4) 접속 주소

- 프론트: `http://localhost:5173`
- 백엔드 헬스체크: `http://localhost:8000/health`

## 5) 기능 테스트 체크리스트

1. 로그인 성공 여부 확인
2. 새 기능 진입/동작 확인
3. 저장 후 목록/상세에 반영되는지 확인
4. 새로고침 후 데이터 유지 확인
5. 브라우저 DevTools Network에서 상태코드 확인

## 6) 자주 겪는 상황

- 첫 블록이 안 끝남:
  - 정상입니다. 백엔드 서버가 실행 중인 상태입니다.
  - 새 터미널에서 프론트를 실행하세요.

- 401 에러 발생:
  - 로그인 토큰 만료/누락 가능성이 큽니다.
  - 재로그인 후 다시 시도하세요.

- 프론트에서 API 연결 실패:
  - 백엔드가 `8000`에서 떠 있는지 확인
  - `VITE_API_BASE_URL` 값 확인

## 7) 종료 방법

- 백엔드 터미널: `Ctrl + C`
- 프론트 터미널: `Ctrl + C`
