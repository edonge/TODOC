# 테이블 명세서

## 개요

| 도메인 | 테이블 수 | 테이블 목록 |
|--------|----------|------------|
| User | 2 | `users`, `refresh_tokens` |
| Kid | 1 | `kids` |
| Record | 7 | `records`, `sleep_records`, `growth_records`, `meal_records`, `health_records`, `diaper_records`, `etc_records` |
| Community | 4 | `posts`, `comments`, `post_likes`, `comment_likes` |
| **합계** | **14** | |

---

## 확실하지 않은 항목

> **중요**: SQLAlchemy ORM 모델과 Alembic 마이그레이션이 존재하지 않아 Pydantic 스키마를 참고하여 추론했습니다.

| 항목 | 불확실한 부분 | 확정에 필요한 파일 |
|------|-------------|------------------|
| `refresh_tokens` 테이블 | 토큰 저장 방식 (DB vs Redis) | `app/core/security.py`, `app/api/auth.py` |
| `post_likes`, `comment_likes` | 테이블 구조 | `app/crud/community.py`, `app/api/community.py` |
| `updated_at` 처리 방식 | 앱 레벨 vs DB 트리거 | `app/crud/*.py` |
| 카운트 필드 동기화 | 앱 레벨 vs DB 트리거 | `app/crud/community.py` |

---

## ENUM 타입 (14개)

| ENUM 타입 | 값 | 근거 파일 |
|----------|-----|---------|
| `gender_enum` | male, female | `app/schemas/kid.py:10-13` |
| `record_type_enum` | growth, sleep, meal, health, diaper, etc | `app/models/enums.py:5-12` |
| `sleep_type_enum` | nap, night | `app/models/enums.py:16-19` |
| `sleep_quality_enum` | good, normal, bad | `app/models/enums.py:22-26` |
| `meal_type_enum` | snack, breast_milk, formula, bottle, baby_food, other | `app/models/enums.py:30-37` |
| `symptom_enum` | fever, runny_nose, cough, vomit, diarrhea, rash, headache | `app/models/enums.py:41-49` |
| `medicine_enum` | antipyretic, painkiller, cold_medicine, antibiotic, ointment, eye_drops | `app/models/enums.py:52-59` |
| `diaper_type_enum` | urine, stool, both | `app/models/enums.py:63-67` |
| `stool_amount_enum` | much, normal, little | `app/models/enums.py:70-74` |
| `stool_condition_enum` | normal, diarrhea, constipation | `app/models/enums.py:77-81` |
| `stool_color_enum` | yellow, brown, green, other | `app/models/enums.py:84-89` |
| `activity_enum` | reading, walking, bathing, playing, music, exercise, swimming | `app/models/enums.py:93-101` |
| `community_category_enum` | general, concern, market | `app/models/enums.py:105-110` |

**ENUM 선택 이유**: `app/models/enums.py`에서 Python `Enum`을 사용하므로 PostgreSQL ENUM 타입으로 구현. VARCHAR + CHECK constraint보다 타입 안전성이 높고 저장 공간 효율적.

---

## User 도메인 (2개 테이블)

### 1. users
사용자 정보 테이블

| 컬럼명 | 타입 | 제약조건 | 설명 | 근거 |
|--------|------|---------|------|------|
| `id` | SERIAL | PK | 사용자 ID | - |
| `username` | VARCHAR(50) | NOT NULL, UNIQUE | 사용자명 | `user.py:11-15` |
| `nickname` | VARCHAR(50) | - | 닉네임 | `user.py:36-40` |
| `email` | VARCHAR(255) | UNIQUE | 이메일 | `user.py:17, 42` |
| `password_hash` | VARCHAR(255) | NOT NULL | 해시된 비밀번호 | `user.py:18-22` |
| `profile_image_url` | TEXT | - | 프로필 이미지 URL | `user.py:43, 65` |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 생성일시 | `user.py:66` |
| `updated_at` | TIMESTAMPTZ | - | 수정일시 | `user.py:67` |

**인덱스**:
- `idx_users_username` ON (username)
- `idx_users_email` ON (email) WHERE email IS NOT NULL

---

### 2. refresh_tokens
JWT 리프레시 토큰 저장 테이블

| 컬럼명 | 타입 | 제약조건 | 설명 | 근거 |
|--------|------|---------|------|------|
| `id` | SERIAL | PK | 토큰 ID | - |
| `user_id` | INTEGER | NOT NULL, FK → users(id) | 사용자 ID | `user.py:96` |
| `token` | VARCHAR(512) | NOT NULL, UNIQUE | 토큰 값 | `user.py:90` |
| `expires_at` | TIMESTAMPTZ | NOT NULL | 만료일시 | - |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 생성일시 | - |

**인덱스**:
- `idx_refresh_tokens_user_id` ON (user_id)
- `idx_refresh_tokens_token` ON (token)

**불확실**: 실제 토큰 저장 방식 (DB vs Redis)

---

## Kid 도메인 (1개 테이블)

### 3. kids
아이 정보 테이블

| 컬럼명 | 타입 | 제약조건 | 설명 | 근거 |
|--------|------|---------|------|------|
| `id` | SERIAL | PK | 아이 ID | - |
| `user_id` | INTEGER | NOT NULL, FK → users(id) | 부모(사용자) ID | `kid.py:51` |
| `name` | VARCHAR(50) | NOT NULL | 이름 | `kid.py:21-25` |
| `birth_date` | DATE | NOT NULL | 생년월일 | `kid.py:27` |
| `gender` | gender_enum | NOT NULL | 성별 | `kid.py:28` |
| `profile_image_url` | TEXT | - | 프로필 이미지 URL | `kid.py:29, 55` |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 생성일시 | `kid.py:57` |
| `updated_at` | TIMESTAMPTZ | - | 수정일시 | `kid.py:58` |

**인덱스**:
- `idx_kids_user_id` ON (user_id)

---

## Record 도메인 (7개 테이블)

### 4. records
기록 기본 테이블 (모든 기록의 공통 정보)

| 컬럼명 | 타입 | 제약조건 | 설명 | 근거 |
|--------|------|---------|------|------|
| `id` | SERIAL | PK | 기록 ID | - |
| `kid_id` | INTEGER | NOT NULL, FK → kids(id) | 아이 ID | `record.py:39` |
| `record_type` | record_type_enum | NOT NULL | 기록 유형 | `record.py:40` |
| `record_date` | DATE | NOT NULL | 기록 날짜 | `record.py:26` |
| `memo` | TEXT | - | 메모 | `record.py:27` |
| `image_url` | TEXT | - | 이미지 URL | `record.py:28` |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 생성일시 | `record.py:41` |
| `updated_at` | TIMESTAMPTZ | - | 수정일시 | `record.py:42` |

**인덱스**:
- `idx_records_kid_id` ON (kid_id)
- `idx_records_record_date` ON (record_date)
- `idx_records_record_type` ON (record_type)
- `idx_records_kid_date` ON (kid_id, record_date)

---

### 5. sleep_records
수면 기록 상세 테이블

| 컬럼명 | 타입 | 제약조건 | 설명 | 근거 |
|--------|------|---------|------|------|
| `id` | SERIAL | PK | 수면 기록 ID | - |
| `record_id` | INTEGER | NOT NULL, UNIQUE, FK → records(id) | 기록 ID | 1:1 관계 |
| `sleep_type` | sleep_type_enum | NOT NULL | 수면 종류 (낮잠/밤잠) | `record.py:53` |
| `start_datetime` | TIMESTAMPTZ | NOT NULL | 시작 시간 | `record.py:54` |
| `end_datetime` | TIMESTAMPTZ | NOT NULL | 종료 시간 | `record.py:55` |
| `sleep_quality` | sleep_quality_enum | - | 수면 품질 | `record.py:56` |

**인덱스**:
- `idx_sleep_records_record_id` ON (record_id)

---

### 6. growth_records
성장 기록 상세 테이블

| 컬럼명 | 타입 | 제약조건 | 설명 | 근거 |
|--------|------|---------|------|------|
| `id` | SERIAL | PK | 성장 기록 ID | - |
| `record_id` | INTEGER | NOT NULL, UNIQUE, FK → records(id) | 기록 ID | 1:1 관계 |
| `height_cm` | DECIMAL(5,2) | - | 키 (cm), 30~140 | `record.py:83-87` |
| `weight_kg` | DECIMAL(4,2) | - | 몸무게 (kg), 1~45 | `record.py:89-93` |
| `head_circumference_cm` | DECIMAL(4,2) | - | 머리 둘레 (cm), 20~62 | `record.py:95-100` |
| `activities` | activity_enum[] | - | 활동 목록 (배열) | `record.py:101-104` |

**인덱스**:
- `idx_growth_records_record_id` ON (record_id)

---

### 7. meal_records
식사 기록 상세 테이블

| 컬럼명 | 타입 | 제약조건 | 설명 | 근거 |
|--------|------|---------|------|------|
| `id` | SERIAL | PK | 식사 기록 ID | - |
| `record_id` | INTEGER | NOT NULL, UNIQUE, FK → records(id) | 기록 ID | 1:1 관계 |
| `meal_datetime` | TIMESTAMPTZ | NOT NULL | 식사 일시 | `record.py:132` |
| `unknown_time` | BOOLEAN | NOT NULL, DEFAULT FALSE | 시간 모름 여부 | `record.py:133` |
| `duration_minutes` | INTEGER | - | 식사 시간 (분), 0~60 | `record.py:134-138` |
| `meal_type` | meal_type_enum | NOT NULL | 음식 유형 | `record.py:140` |
| `meal_detail` | VARCHAR(200) | - | 음식 종류 상세 | `record.py:141` |
| `amount_ml` | INTEGER | - | 양 (ml), 0~500 | `record.py:142-146` |
| `amount_text` | VARCHAR(100) | - | 양 (텍스트) | `record.py:148-151` |
| `burp` | BOOLEAN | NOT NULL, DEFAULT FALSE | 트림 여부 | `record.py:153` |

**인덱스**:
- `idx_meal_records_record_id` ON (record_id)

---

### 8. health_records
건강 기록 상세 테이블

| 컬럼명 | 타입 | 제약조건 | 설명 | 근거 |
|--------|------|---------|------|------|
| `id` | SERIAL | PK | 건강 기록 ID | - |
| `record_id` | INTEGER | NOT NULL, UNIQUE, FK → records(id) | 기록 ID | 1:1 관계 |
| `health_datetime` | TIMESTAMPTZ | NOT NULL | 건강 기록 일시 | `record.py:183` |
| `unknown_time` | BOOLEAN | NOT NULL, DEFAULT FALSE | 시간 모름 여부 | `record.py:184` |
| `title` | VARCHAR(200) | NOT NULL | 제목 | `record.py:185` |
| `symptoms` | symptom_enum[] | - | 증상 목록 (배열) | `record.py:186` |
| `medicines` | medicine_enum[] | - | 투약 현황 목록 (배열) | `record.py:187` |

**인덱스**:
- `idx_health_records_record_id` ON (record_id)

---

### 9. diaper_records
배변 기록 상세 테이블

| 컬럼명 | 타입 | 제약조건 | 설명 | 근거 |
|--------|------|---------|------|------|
| `id` | SERIAL | PK | 배변 기록 ID | - |
| `record_id` | INTEGER | NOT NULL, UNIQUE, FK → records(id) | 기록 ID | 1:1 관계 |
| `diaper_datetime` | TIMESTAMPTZ | NOT NULL | 배변 일시 | `record.py:214` |
| `unknown_time` | BOOLEAN | NOT NULL, DEFAULT FALSE | 시간 모름 여부 | `record.py:215` |
| `diaper_type` | diaper_type_enum | NOT NULL | 배변 종류 | `record.py:216` |
| `amount` | stool_amount_enum | - | 양 | `record.py:217` |
| `condition` | stool_condition_enum | - | 상태 | `record.py:218` |
| `color` | stool_color_enum | - | 색깔 | `record.py:219` |

**인덱스**:
- `idx_diaper_records_record_id` ON (record_id)

---

### 10. etc_records
기타 기록 상세 테이블

| 컬럼명 | 타입 | 제약조건 | 설명 | 근거 |
|--------|------|---------|------|------|
| `id` | SERIAL | PK | 기타 기록 ID | - |
| `record_id` | INTEGER | NOT NULL, UNIQUE, FK → records(id) | 기록 ID | 1:1 관계 |
| `title` | VARCHAR(200) | NOT NULL | 제목 | `record.py:247` |

**인덱스**:
- `idx_etc_records_record_id` ON (record_id)

---

## Community 도메인 (4개 테이블)

### 11. posts
게시글 테이블

| 컬럼명 | 타입 | 제약조건 | 설명 | 근거 |
|--------|------|---------|------|------|
| `id` | SERIAL | PK | 게시글 ID | - |
| `user_id` | INTEGER | NOT NULL, FK → users(id) | 작성자 ID | `community.py:52` |
| `kid_id` | INTEGER | FK → kids(id) ON DELETE SET NULL | 아이 ID (선택) | `community.py:53-54` |
| `category` | community_category_enum | NOT NULL | 카테고리 | `community.py:55` |
| `title` | VARCHAR(200) | NOT NULL | 제목 | `community.py:16-20` |
| `content` | TEXT | NOT NULL | 내용 | `community.py:22-25` |
| `image_url` | TEXT | - | 이미지 URL | `community.py:27` |
| `likes_count` | INTEGER | NOT NULL, DEFAULT 0 | 좋아요 수 (비정규화) | `community.py:61` |
| `comment_count` | INTEGER | NOT NULL, DEFAULT 0 | 댓글 수 (비정규화) | `community.py:62` |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 생성일시 | `community.py:59` |
| `updated_at` | TIMESTAMPTZ | - | 수정일시 | `community.py:60` |

**인덱스**:
- `idx_posts_user_id` ON (user_id)
- `idx_posts_kid_id` ON (kid_id) WHERE kid_id IS NOT NULL
- `idx_posts_category` ON (category)
- `idx_posts_created_at` ON (created_at DESC)

---

### 12. comments
댓글 테이블 (대댓글 지원)

| 컬럼명 | 타입 | 제약조건 | 설명 | 근거 |
|--------|------|---------|------|------|
| `id` | SERIAL | PK | 댓글 ID | - |
| `post_id` | INTEGER | NOT NULL, FK → posts(id) | 게시글 ID | `community.py:129` |
| `user_id` | INTEGER | NOT NULL, FK → users(id) | 작성자 ID | `community.py:130` |
| `content` | VARCHAR(1000) | NOT NULL | 댓글 내용 | `community.py:104-108` |
| `parent_id` | INTEGER | FK → comments(id) | 부모 댓글 ID (대댓글용) | `community.py:110, 132` |
| `likes_count` | INTEGER | NOT NULL, DEFAULT 0 | 좋아요 수 (비정규화) | `community.py:137` |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 생성일시 | `community.py:133` |
| `updated_at` | TIMESTAMPTZ | - | 수정일시 | `community.py:134` |

**인덱스**:
- `idx_comments_post_id` ON (post_id)
- `idx_comments_user_id` ON (user_id)
- `idx_comments_parent_id` ON (parent_id) WHERE parent_id IS NOT NULL

---

### 13. post_likes
게시글 좋아요 관계 테이블

| 컬럼명 | 타입 | 제약조건 | 설명 | 근거 |
|--------|------|---------|------|------|
| `id` | SERIAL | PK | 좋아요 ID | - |
| `post_id` | INTEGER | NOT NULL, FK → posts(id) | 게시글 ID | `community.py:63` |
| `user_id` | INTEGER | NOT NULL, FK → users(id) | 사용자 ID | 추론 |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 생성일시 | - |

**제약조건**:
- UNIQUE(post_id, user_id) - 중복 좋아요 방지

**인덱스**:
- `idx_post_likes_post_id` ON (post_id)
- `idx_post_likes_user_id` ON (user_id)

**불확실**: 실제 테이블 구조

---

### 14. comment_likes
댓글 좋아요 관계 테이블

| 컬럼명 | 타입 | 제약조건 | 설명 | 근거 |
|--------|------|---------|------|------|
| `id` | SERIAL | PK | 좋아요 ID | - |
| `comment_id` | INTEGER | NOT NULL, FK → comments(id) | 댓글 ID | `community.py:137-138` |
| `user_id` | INTEGER | NOT NULL, FK → users(id) | 사용자 ID | 추론 |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 생성일시 | - |

**제약조건**:
- UNIQUE(comment_id, user_id) - 중복 좋아요 방지

**인덱스**:
- `idx_comment_likes_comment_id` ON (comment_id)
- `idx_comment_likes_user_id` ON (user_id)

**불확실**: 실제 테이블 구조

---

## ER 다이어그램 관계 요약

```
users (1) ──< (N) kids
users (1) ──< (N) refresh_tokens
users (1) ──< (N) posts
users (1) ──< (N) comments
users (1) ──< (N) post_likes
users (1) ──< (N) comment_likes

kids (1) ──< (N) records
kids (1) ──< (N) posts (optional)

records (1) ──── (1) sleep_records
records (1) ──── (1) growth_records
records (1) ──── (1) meal_records
records (1) ──── (1) health_records
records (1) ──── (1) diaper_records
records (1) ──── (1) etc_records

posts (1) ──< (N) comments
posts (1) ──< (N) post_likes

comments (1) ──< (N) comments (self-reference: parent_id)
comments (1) ──< (N) comment_likes
```

---

## 트리거 요약

| 트리거명 | 대상 테이블 | 동작 |
|---------|-----------|------|
| `trigger_users_updated_at` | users | UPDATE 시 updated_at 자동 갱신 |
| `trigger_kids_updated_at` | kids | UPDATE 시 updated_at 자동 갱신 |
| `trigger_records_updated_at` | records | UPDATE 시 updated_at 자동 갱신 |
| `trigger_posts_updated_at` | posts | UPDATE 시 updated_at 자동 갱신 |
| `trigger_comments_updated_at` | comments | UPDATE 시 updated_at 자동 갱신 |
| `trigger_post_likes_count` | post_likes | INSERT/DELETE 시 posts.likes_count 갱신 |
| `trigger_post_comment_count` | comments | INSERT/DELETE 시 posts.comment_count 갱신 |
| `trigger_comment_likes_count` | comment_likes | INSERT/DELETE 시 comments.likes_count 갱신 |
