class Piece {
    constructor(x, y, type) {
      this.x = x;
      this.y = y;
      if (typeof type !== 'undefined') {
        this.type = type;
      }
    }
  }

  export default Piece;
