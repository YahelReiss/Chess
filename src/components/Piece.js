class Piece {
    constructor(x, y, type) {
      this.x = x;
      this.y = y;
      if (typeof type !== 'undefined') {
        this.type = type;
      }
      this.style = {
        top: y * 80,
        left: x * 80,
      };
    }
  }

  export default Piece;
