-- =============================================================================
-- PostgreSQL DDL for todoc2.0
-- =============================================================================
-- WARNING: SQLAlchemy ORM 모델 및 Alembic 마이그레이션이 존재하지 않습니다.
-- 본 DDL은 Pydantic 스키마(app/schemas/*.py)를 참고하여 추론한 것입니다.
-- 실제 운영 환경에서는 반드시 SQLAlchemy 모델을 먼저 정의한 후
-- alembic으로 마이그레이션을 생성하는 것을 권장합니다.
-- =============================================================================

-- =============================================================================
-- 1. Extensions
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 2. Drop existing types (for clean re-run)
-- =============================================================================
DROP TYPE IF EXISTS gender_enum CASCADE;
DROP TYPE IF EXISTS record_type_enum CASCADE;
DROP TYPE IF EXISTS sleep_type_enum CASCADE;
DROP TYPE IF EXISTS sleep_quality_enum CASCADE;
DROP TYPE IF EXISTS meal_type_enum CASCADE;
DROP TYPE IF EXISTS symptom_enum CASCADE;
DROP TYPE IF EXISTS medicine_enum CASCADE;
DROP TYPE IF EXISTS diaper_type_enum CASCADE;
DROP TYPE IF EXISTS stool_amount_enum CASCADE;
DROP TYPE IF EXISTS stool_condition_enum CASCADE;
DROP TYPE IF EXISTS stool_color_enum CASCADE;
DROP TYPE IF EXISTS activity_enum CASCADE;
DROP TYPE IF EXISTS community_category_enum CASCADE;

-- =============================================================================
-- 3. Create ENUM Types
-- =============================================================================
-- 근거: app/schemas/kid.py:10-13 (GenderEnum)
CREATE TYPE gender_enum AS ENUM ('male', 'female');

-- 근거: app/models/enums.py:5-12 (RecordTypeEnum)
CREATE TYPE record_type_enum AS ENUM ('growth', 'sleep', 'meal', 'health', 'diaper', 'etc');

-- 근거: app/models/enums.py:16-19 (SleepTypeEnum)
CREATE TYPE sleep_type_enum AS ENUM ('nap', 'night');

-- 근거: app/models/enums.py:22-26 (SleepQualityEnum)
CREATE TYPE sleep_quality_enum AS ENUM ('good', 'normal', 'bad');

-- 근거: app/models/enums.py:30-37 (MealTypeEnum)
CREATE TYPE meal_type_enum AS ENUM ('snack', 'breast_milk', 'formula', 'bottle', 'baby_food', 'other');

-- 근거: app/models/enums.py:41-49 (SymptomEnum)
CREATE TYPE symptom_enum AS ENUM ('fever', 'runny_nose', 'cough', 'vomit', 'diarrhea', 'rash', 'headache');

-- 근거: app/models/enums.py:52-59 (MedicineEnum)
CREATE TYPE medicine_enum AS ENUM ('antipyretic', 'painkiller', 'cold_medicine', 'antibiotic', 'ointment', 'eye_drops');

-- 근거: app/models/enums.py:63-67 (DiaperTypeEnum)
CREATE TYPE diaper_type_enum AS ENUM ('urine', 'stool', 'both');

-- 근거: app/models/enums.py:70-74 (StoolAmountEnum)
CREATE TYPE stool_amount_enum AS ENUM ('much', 'normal', 'little');

-- 근거: app/models/enums.py:77-81 (StoolConditionEnum)
CREATE TYPE stool_condition_enum AS ENUM ('normal', 'diarrhea', 'constipation');

-- 근거: app/models/enums.py:84-89 (StoolColorEnum)
CREATE TYPE stool_color_enum AS ENUM ('yellow', 'brown', 'green', 'other');

-- 근거: app/models/enums.py:93-101 (ActivityEnum)
CREATE TYPE activity_enum AS ENUM ('reading', 'walking', 'bathing', 'playing', 'music', 'exercise', 'swimming');

-- 근거: app/models/enums.py:105-110 (CommunityCategoryEnum)
CREATE TYPE community_category_enum AS ENUM ('free', 'qna', 'tip', 'review');

-- =============================================================================
-- 4. Drop existing tables (for clean re-run) - 역순으로 삭제
-- =============================================================================
DROP TABLE IF EXISTS comment_likes CASCADE;
DROP TABLE IF EXISTS post_likes CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS etc_records CASCADE;
DROP TABLE IF EXISTS diaper_records CASCADE;
DROP TABLE IF EXISTS health_records CASCADE;
DROP TABLE IF EXISTS meal_records CASCADE;
DROP TABLE IF EXISTS growth_records CASCADE;
DROP TABLE IF EXISTS sleep_records CASCADE;
DROP TABLE IF EXISTS records CASCADE;
DROP TABLE IF EXISTS kids CASCADE;
DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =============================================================================
-- 5. USER 도메인 테이블
-- =============================================================================
-- 근거: app/schemas/user.py:59-70 (UserResponse)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,                    -- 근거: user.py:11-15
    nickname VARCHAR(50),                                     -- 근거: user.py:36-40
    email VARCHAR(255) UNIQUE,                               -- 근거: user.py:17, 42
    password_hash VARCHAR(255) NOT NULL,                     -- 근거: user.py:18-22 (password -> hashed)
    profile_image_url TEXT,                                  -- 근거: user.py:43, 65
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),           -- 근거: user.py:66
    updated_at TIMESTAMPTZ                                   -- 근거: user.py:67
);

-- 인덱스
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email) WHERE email IS NOT NULL;

-- Refresh Token 테이블 (JWT 갱신용)
-- 근거: app/schemas/user.py:100-102 (RefreshTokenRequest)
-- 확실하지 않음: refresh token 저장 방식 (DB vs Redis)이 명확하지 않음
-- 필요 파일: app/core/security.py 또는 app/api/auth.py
CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(512) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);

-- =============================================================================
-- 6. KID 도메인 테이블
-- =============================================================================
-- 근거: app/schemas/kid.py:48-61 (KidResponse)
CREATE TABLE kids (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- 근거: kid.py:51
    name VARCHAR(50) NOT NULL,                               -- 근거: kid.py:21-25
    birth_date DATE NOT NULL,                                -- 근거: kid.py:27
    gender gender_enum NOT NULL,                             -- 근거: kid.py:28
    profile_image_url TEXT,                                  -- 근거: kid.py:29, 55
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),           -- 근거: kid.py:57
    updated_at TIMESTAMPTZ                                   -- 근거: kid.py:58
);

-- 인덱스
CREATE INDEX idx_kids_user_id ON kids(user_id);

-- =============================================================================
-- 7. RECORD 도메인 테이블 (기본 기록 + 세부 기록)
-- =============================================================================

-- 7-1. 기본 기록 테이블 (모든 기록의 공통 정보)
-- 근거: app/schemas/record.py:36-45 (RecordResponse)
CREATE TABLE records (
    id SERIAL PRIMARY KEY,
    kid_id INTEGER NOT NULL REFERENCES kids(id) ON DELETE CASCADE,   -- 근거: record.py:39
    record_type record_type_enum NOT NULL,                   -- 근거: record.py:40
    record_date DATE NOT NULL,                               -- 근거: record.py:26
    memo TEXT,                                               -- 근거: record.py:27
    image_url TEXT,                                          -- 근거: record.py:28
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),           -- 근거: record.py:41
    updated_at TIMESTAMPTZ                                   -- 근거: record.py:42
);

-- 인덱스
CREATE INDEX idx_records_kid_id ON records(kid_id);
CREATE INDEX idx_records_record_date ON records(record_date);
CREATE INDEX idx_records_record_type ON records(record_type);
CREATE INDEX idx_records_kid_date ON records(kid_id, record_date);

-- 7-2. 수면 기록 테이블
-- 근거: app/schemas/record.py:64-75 (SleepRecordResponse)
CREATE TABLE sleep_records (
    id SERIAL PRIMARY KEY,
    record_id INTEGER NOT NULL UNIQUE REFERENCES records(id) ON DELETE CASCADE,
    sleep_type sleep_type_enum NOT NULL,                     -- 근거: record.py:53
    start_datetime TIMESTAMPTZ NOT NULL,                     -- 근거: record.py:54
    end_datetime TIMESTAMPTZ NOT NULL,                       -- 근거: record.py:55
    sleep_quality sleep_quality_enum                         -- 근거: record.py:56
);

CREATE INDEX idx_sleep_records_record_id ON sleep_records(record_id);

-- 7-3. 성장 기록 테이블
-- 근거: app/schemas/record.py:112-124 (GrowthRecordResponse)
CREATE TABLE growth_records (
    id SERIAL PRIMARY KEY,
    record_id INTEGER NOT NULL UNIQUE REFERENCES records(id) ON DELETE CASCADE,
    height_cm DECIMAL(5, 2),                                 -- 근거: record.py:83-87, 범위 30~140
    weight_kg DECIMAL(4, 2),                                 -- 근거: record.py:89-93, 범위 1~45
    head_circumference_cm DECIMAL(4, 2),                     -- 근거: record.py:95-100, 범위 20~62
    activities activity_enum[]                               -- 근거: record.py:101-104, 배열
);

CREATE INDEX idx_growth_records_record_id ON growth_records(record_id);

-- 7-4. 식사 기록 테이블
-- 근거: app/schemas/record.py:161-175 (MealRecordResponse)
CREATE TABLE meal_records (
    id SERIAL PRIMARY KEY,
    record_id INTEGER NOT NULL UNIQUE REFERENCES records(id) ON DELETE CASCADE,
    meal_datetime TIMESTAMPTZ NOT NULL,                      -- 근거: record.py:132
    unknown_time BOOLEAN NOT NULL DEFAULT FALSE,             -- 근거: record.py:133
    duration_minutes INTEGER,                                -- 근거: record.py:134-138, 범위 0~60
    meal_type meal_type_enum NOT NULL,                       -- 근거: record.py:140
    meal_detail VARCHAR(200),                                -- 근거: record.py:141
    amount_ml INTEGER,                                       -- 근거: record.py:142-146, 범위 0~500
    amount_text VARCHAR(100),                                -- 근거: record.py:148-151
    burp BOOLEAN NOT NULL DEFAULT FALSE                      -- 근거: record.py:153
);

CREATE INDEX idx_meal_records_record_id ON meal_records(record_id);

-- 7-5. 건강 기록 테이블
-- 근거: app/schemas/record.py:195-206 (HealthRecordResponse)
CREATE TABLE health_records (
    id SERIAL PRIMARY KEY,
    record_id INTEGER NOT NULL UNIQUE REFERENCES records(id) ON DELETE CASCADE,
    health_datetime TIMESTAMPTZ NOT NULL,                    -- 근거: record.py:183
    unknown_time BOOLEAN NOT NULL DEFAULT FALSE,             -- 근거: record.py:184
    title VARCHAR(200) NOT NULL,                             -- 근거: record.py:185
    symptoms symptom_enum[],                                 -- 근거: record.py:186, 배열
    medicines medicine_enum[]                                -- 근거: record.py:187, 배열
);

CREATE INDEX idx_health_records_record_id ON health_records(record_id);

-- 7-6. 배변 기록 테이블
-- 근거: app/schemas/record.py:227-239 (DiaperRecordResponse)
CREATE TABLE diaper_records (
    id SERIAL PRIMARY KEY,
    record_id INTEGER NOT NULL UNIQUE REFERENCES records(id) ON DELETE CASCADE,
    diaper_datetime TIMESTAMPTZ NOT NULL,                    -- 근거: record.py:214
    unknown_time BOOLEAN NOT NULL DEFAULT FALSE,             -- 근거: record.py:215
    diaper_type diaper_type_enum NOT NULL,                   -- 근거: record.py:216
    amount stool_amount_enum,                                -- 근거: record.py:217
    condition stool_condition_enum,                          -- 근거: record.py:218
    color stool_color_enum                                   -- 근거: record.py:219
);

CREATE INDEX idx_diaper_records_record_id ON diaper_records(record_id);

-- 7-7. 기타 기록 테이블
-- 근거: app/schemas/record.py:255-262 (EtcRecordResponse)
CREATE TABLE etc_records (
    id SERIAL PRIMARY KEY,
    record_id INTEGER NOT NULL UNIQUE REFERENCES records(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL                              -- 근거: record.py:247
);

CREATE INDEX idx_etc_records_record_id ON etc_records(record_id);

-- =============================================================================
-- 8. COMMUNITY 도메인 테이블
-- =============================================================================

-- 8-1. 게시글 테이블
-- 근거: app/schemas/community.py:50-69 (PostResponse)
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- 근거: community.py:52
    kid_id INTEGER REFERENCES kids(id) ON DELETE SET NULL,   -- 근거: community.py:53-54
    category community_category_enum NOT NULL,               -- 근거: community.py:55
    title VARCHAR(200) NOT NULL,                             -- 근거: community.py:16-20
    content TEXT NOT NULL,                                   -- 근거: community.py:22-25
    image_url TEXT,                                          -- 근거: community.py:27
    likes_count INTEGER NOT NULL DEFAULT 0,                  -- 근거: community.py:61 (denormalized)
    comment_count INTEGER NOT NULL DEFAULT 0,                -- 근거: community.py:62 (denormalized)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),           -- 근거: community.py:59
    updated_at TIMESTAMPTZ                                   -- 근거: community.py:60
);

-- 인덱스
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_kid_id ON posts(kid_id) WHERE kid_id IS NOT NULL;
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);

-- 8-2. 댓글 테이블
-- 근거: app/schemas/community.py:126-141 (CommentResponse)
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,  -- 근거: community.py:129
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- 근거: community.py:130
    content VARCHAR(1000) NOT NULL,                          -- 근거: community.py:104-108
    parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,      -- 근거: community.py:110, 132 (대댓글)
    likes_count INTEGER NOT NULL DEFAULT 0,                  -- 근거: community.py:137 (denormalized)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),           -- 근거: community.py:133
    updated_at TIMESTAMPTZ                                   -- 근거: community.py:134
);

-- 인덱스
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id) WHERE parent_id IS NOT NULL;

-- 8-3. 게시글 좋아요 테이블
-- 근거: app/schemas/community.py:156-159 (LikeResponse) - is_liked 응답 필드 존재
-- 확실하지 않음: 좋아요 테이블 구조는 스키마에서 직접 정의되지 않음
-- 필요 파일: app/crud/community.py 또는 app/api/community.py
CREATE TABLE post_likes (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

CREATE INDEX idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX idx_post_likes_user_id ON post_likes(user_id);

-- 8-4. 댓글 좋아요 테이블
-- 근거: app/schemas/community.py:137-138 (is_liked, likes_count in CommentResponse)
-- 확실하지 않음: 댓글 좋아요 테이블 구조는 스키마에서 직접 정의되지 않음
CREATE TABLE comment_likes (
    id SERIAL PRIMARY KEY,
    comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

CREATE INDEX idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX idx_comment_likes_user_id ON comment_likes(user_id);

-- =============================================================================
-- 9. updated_at 자동 갱신 트리거
-- =============================================================================
-- 확실하지 않음: 앱 레벨에서 처리하는지, DB 트리거로 처리하는지 명확하지 않음
-- 필요 파일: app/crud/*.py 파일에서 update 로직 확인 필요

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Users
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Kids
CREATE TRIGGER trigger_kids_updated_at
    BEFORE UPDATE ON kids
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Records
CREATE TRIGGER trigger_records_updated_at
    BEFORE UPDATE ON records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Posts
CREATE TRIGGER trigger_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
CREATE TRIGGER trigger_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 10. 좋아요/댓글 카운트 자동 갱신 트리거 (선택적)
-- =============================================================================
-- 이 트리거들은 성능상의 이유로 앱 레벨에서 처리하는 것이 더 좋을 수 있음
-- 필요에 따라 주석 해제하여 사용

-- Post likes count 트리거
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_post_likes_count
    AFTER INSERT OR DELETE ON post_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_post_likes_count();

-- Post comment count 트리거
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_post_comment_count
    AFTER INSERT OR DELETE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_post_comment_count();

-- Comment likes count 트리거
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE comments SET likes_count = likes_count - 1 WHERE id = OLD.comment_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_comment_likes_count
    AFTER INSERT OR DELETE ON comment_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_comment_likes_count();

-- =============================================================================
-- 완료
-- =============================================================================
