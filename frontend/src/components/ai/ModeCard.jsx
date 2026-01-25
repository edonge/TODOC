import './ModeCard.css';

function ModeCard({ image, label, background, outline, onClick }) {
  return (
    <button
      className="mode-card"
      style={{
        backgroundColor: background,
        '--mode-accent': outline,
      }}
      onClick={onClick}
    >
      <div className="mode-card-image-wrap">
        <img className="mode-card-image" src={image} alt={label} />
      </div>
      <span className="mode-card-label">{label}</span>
    </button>
  );
}

export default ModeCard;
