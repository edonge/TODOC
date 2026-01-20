import babySample from '../../assets/photos/baby_sample.png';
import './BabyCard.css';

function BabyCard({ childData }) {
  return (
    <div className="baby-card-stack">
      <section className="baby-card">
        {/* 상단 헤더 */}
        <div className="baby-card-header">
          <div className="baby-info">
            <span className="baby-name">{childData.name}</span>
            <span className="baby-age">{childData.age}</span>
          </div>
          <button className="more-button">더보기</button>
        </div>

        {/* 카드 컨텐츠 */}
        <div className="baby-card-content">
          {/* 아이 사진 영역 */}
          <div className="baby-photo-wrapper">
            <img src={babySample} alt="아이 사진" className="baby-photo" />
          </div>

          {/* 최근 기록 영역 */}
          <div className="recent-record">
            <span className="record-label">최근 기록</span>
            <div className="record-box">
              <span className="record-type">수유</span>
              <span className="record-value">120ml</span>
              <span className="record-time">2시간 전</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default BabyCard;
