import './square.css';

// class Square {
//   constructor(number, image){
//     this.number = number
//     this.image = image ? image : null
//   }
// }

export default function square({number, image}) {

  if (number % 2 === 0) {
    return <div className="square black">
      {image && <div style={{backgroundImage: `url(${image})`}} className="chessPiece">
      </div>}
    </div>
  } else {
    return <div className="square white">
      {image && <div className="chessPiece" style={{backgroundImage: `url(${image})`}}>
      </div>}
    </div>
  }
}