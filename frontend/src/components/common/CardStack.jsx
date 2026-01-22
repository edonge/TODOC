import './CardStack.css';

function CardStack({ children, backColor = '#FFF2DB', className = '' }) {
  return (
    <div
      className={`card-stack ${className}`}
      style={{ '--back-color': backColor }}
    >
      <div className="card-stack-content">
        {children}
      </div>
    </div>
  );
}

export default CardStack;
