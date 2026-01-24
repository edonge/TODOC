from enum import Enum


# ===== Record Type =====
class RecordTypeEnum(str, Enum):
    """기록 유형"""
    GROWTH = "growth"       # 성장
    SLEEP = "sleep"         # 수면
    MEAL = "meal"           # 식사
    HEALTH = "health"       # 건강
    DIAPER = "diaper"       # 배변
    ETC = "etc"             # 기타


# ===== Sleep Related =====
class SleepTypeEnum(str, Enum):
    """수면 종류"""
    NAP = "nap"             # 낮잠
    NIGHT = "night"         # 밤잠


class SleepQualityEnum(str, Enum):
    """수면 품질"""
    GOOD = "good"           # 좋음
    NORMAL = "normal"       # 보통
    BAD = "bad"             # 나쁨


# ===== Meal Related =====
class MealTypeEnum(str, Enum):
    """음식 유형"""
    SNACK = "snack"             # 간식
    BREAST_MILK = "breast_milk" # 모유
    FORMULA = "formula"         # 분유
    BOTTLE = "bottle"           # 젖병
    BABY_FOOD = "baby_food"     # 이유식
    OTHER = "other"             # 기타


# ===== Health Related =====
class SymptomEnum(str, Enum):
    """증상"""
    FEVER = "fever"             # 열
    RUNNY_NOSE = "runny_nose"   # 콧물
    COUGH = "cough"             # 기침
    VOMIT = "vomit"             # 구토
    DIARRHEA = "diarrhea"       # 설사
    RASH = "rash"               # 발진
    HEADACHE = "headache"       # 두통


class MedicineEnum(str, Enum):
    """투약 현황"""
    ANTIPYRETIC = "antipyretic"     # 해열제
    PAINKILLER = "painkiller"       # 진통제
    COLD_MEDICINE = "cold_medicine" # 감기약
    ANTIBIOTIC = "antibiotic"       # 항생제
    OINTMENT = "ointment"           # 연고
    EYE_DROPS = "eye_drops"         # 안약


# ===== Diaper/Stool Related =====
class DiaperTypeEnum(str, Enum):
    """배변 종류"""
    URINE = "urine"         # 소변
    STOOL = "stool"         # 대변
    BOTH = "both"           # 둘다


class StoolAmountEnum(str, Enum):
    """배변 양"""
    MUCH = "much"           # 많음
    NORMAL = "normal"       # 보통
    LITTLE = "little"       # 적음


class StoolConditionEnum(str, Enum):
    """배변 상태"""
    NORMAL = "normal"       # 정상
    DIARRHEA = "diarrhea"   # 설사
    CONSTIPATION = "constipation"  # 변비


class StoolColorEnum(str, Enum):
    """배변 색깔"""
    YELLOW = "yellow"       # 노랑
    BROWN = "brown"         # 갈색
    GREEN = "green"         # 초록
    OTHER = "other"         # 이외


# ===== Growth Related =====
class ActivityEnum(str, Enum):
    """활동"""
    READING = "reading"     # 독서
    WALKING = "walking"     # 산책
    BATHING = "bathing"     # 목욕
    PLAYING = "playing"     # 놀이
    MUSIC = "music"         # 음악
    EXERCISE = "exercise"   # 체조
    SWIMMING = "swimming"   # 수영


# ===== Community Related =====
class CommunityCategoryEnum(str, Enum):
    """커뮤니티 카테고리"""
    GENERAL = "general"     # 일반
    CONCERN = "concern"     # 고민
    MARKET = "market"       # 장터
