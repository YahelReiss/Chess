import './square.css';

export default function square({squareKey, number, image}) {

  if (number % 2 === 0) {
    return <div data-square-key={squareKey} className="square black">
      {image && <div style={{backgroundImage: `url(${image})`}} className="chessPiece">
      </div>}
    </div>
  } else {
    return <div data-square-key={squareKey} className="square white">
      {image && <div className="chessPiece" style={{backgroundImage: `url(${image})`}}>
      </div>}
    </div>
  }
}