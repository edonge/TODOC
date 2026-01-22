# PostgreSQL DDL 적용 가이드

## 개요
이 문서는 `schema.sql`을 PostgreSQL 데이터베이스에 적용하는 방법을 설명합니다.

> **주의**: SQLAlchemy ORM 모델과 Alembic 마이그레이션이 존재하지 않아, Pydantic 스키마를 참고하여 DDL을 추론했습니다. 운영 환경에서는 반드시 ORM 모델을 먼저 정의하고 Alembic으로 마이그레이션을 관리하는 것을 권장합니다.

---

## 1. 사전 준비

### PostgreSQL 설치 확인
```bash
psql --version
# PostgreSQL 14.x 이상 권장
```

### 데이터베이스 서버 접속 정보 준비
- Host: `localhost` (또는 운영 서버 주소)
- Port: `5432` (기본값)
- User: `postgres` (또는 관리자 계정)
- Database: `todoc` (생성할 데이터베이스명)

---

## 2. 데이터베이스 생성

### psql 사용 시
```bash
# PostgreSQL 접속
psql -U postgres -h localhost

# 데이터베이스 생성
CREATE DATABASE todoc
    WITH ENCODING = 'UTF8'
    LC_COLLATE = 'ko_KR.UTF-8'
    LC_CTYPE = 'ko_KR.UTF-8'
    TEMPLATE = template0;

# 또는 영어 로케일 사용
CREATE DATABASE todoc
    WITH ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TEMPLATE = template0;

# 종료
\q
```

### DataGrip 사용 시
1. **New → Database** 선택
2. 이름: `todoc`
3. Encoding: `UTF8`
4. **OK** 클릭

---

## 3. schema.sql 실행

### 방법 A: psql 명령줄
```bash
# 현재 디렉토리에서 실행
cd /Users/edonge0213/Desktop/todoc2.0/backend/database

# schema.sql 실행
psql -U postgres -h localhost -d todoc -f schema.sql

# 또는 전체 경로로 실행
psql -U postgres -h localhost -d todoc -f /Users/edonge0213/Desktop/todoc2.0/backend/database/schema.sql
```

### 방법 B: DataGrip
1. `todoc` 데이터베이스에 연결
2. **File → Open** → `schema.sql` 선택
3. **Execute** (Ctrl+Enter / Cmd+Enter) 클릭
4. 실행 완료 후 **Database Explorer**에서 **Refresh** 클릭

### 방법 C: psql 대화형 모드
```bash
psql -U postgres -h localhost -d todoc

# psql 내에서 파일 실행
\i /Users/edonge0213/Desktop/todoc2.0/backend/database/schema.sql

# 테이블 목록 확인
\dt

# 종료
\q
```

---

## 4. 실행 결과 확인

### 테이블 목록 확인
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

예상 결과 (13개 테이블):
```
comment_likes
comments
diaper_records
etc_records
growth_records
health_records
kids
meal_records
post_likes
posts
records
refresh_tokens
sleep_records
users
```

### ENUM 타입 확인
```sql
SELECT typname
FROM pg_type
WHERE typtype = 'e'
ORDER BY typname;
```

예상 결과 (14개 ENUM):
```
activity_enum
community_category_enum
diaper_type_enum
gender_enum
meal_type_enum
medicine_enum
record_type_enum
sleep_quality_enum
sleep_type_enum
stool_amount_enum
stool_color_enum
stool_condition_enum
symptom_enum
```

### 인덱스 확인
```sql
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

---

## 5. 재실행 시 주의사항

`schema.sql`은 **재실행 가능**하도록 설계되었습니다:
- `DROP TYPE IF EXISTS ... CASCADE` - 기존 ENUM 삭제
- `DROP TABLE IF EXISTS ... CASCADE` - 기존 테이블 삭제
- `CREATE OR REPLACE FUNCTION` - 기존 함수 덮어쓰기

> **주의**: 재실행 시 **기존 데이터가 모두 삭제**됩니다!
> 운영 환경에서는 절대 재실행하지 마세요.

---

## 6. 문제 해결

### 권한 오류
```bash
# 슈퍼유저로 실행
psql -U postgres -h localhost -d todoc -f schema.sql
```

### 인코딩 오류
```bash
# 파일 인코딩 확인 (UTF-8이어야 함)
file schema.sql

# UTF-8로 변환
iconv -f EUC-KR -t UTF-8 schema.sql > schema_utf8.sql
```

### 연결 오류
```bash
# PostgreSQL 서비스 상태 확인
brew services list | grep postgres  # macOS
systemctl status postgresql         # Linux
```

---

## 7. 다음 단계 (권장)

1. **SQLAlchemy 모델 정의**: `app/models/` 디렉토리에 ORM 모델 파일 생성
2. **Alembic 초기화**: `alembic init alembic`
3. **마이그레이션 생성**: `alembic revision --autogenerate -m "initial"`
4. **마이그레이션 적용**: `alembic upgrade head`

이렇게 하면 스키마 변경 이력 관리가 가능해집니다.
