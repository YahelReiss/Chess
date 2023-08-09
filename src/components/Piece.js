class Piece {
    constructor(x, y, color, pieceType) {
      this.x = x;
      this.y = y;
      if (typeof color !== 'undefined') {
        this.color = color;
      }
      if (typeof pieceType !== 'undefined') {
        this.pieceType = pieceType;
      }
      this.style = {
        top: y * 80,
        left: x * 80,
      };
    }
  }

  export default Piece;
