import './ModeCard.css';

function ModeCard({ image, label, background, outline, onClick }) {
  return (
    <button
      className="mode-card"
      style={{
        backgroundColor: background,
        borderColor: outline,
      }}
      onClick={onClick}
    >
      <img className="mode-card-image" src={image} alt={label} />
      <span className="mode-card-label" style={{ WebkitTextStroke: `1px ${outline}` }}>
        {label}
      </span>
    </button>
  );
}

export default ModeCard;
