export const BOARD_WIDTH = 8;
export const BOARD_HEIGHT = 8;
export const INITIAL_BOARD = new Array(BOARD_WIDTH).fill(null).map(() => new Array(BOARD_HEIGHT).fill(null));

// class that holds the coordinates of a square in the chess board
// the x coordinate is the columns of the board
// the y coordinate is the rows of the board
export class Coordinates {
    constructor(x, y) {
      this.x = x;
      this.y = y;
    }
  }
  
  // class to store information about the last move
  // pieceType - string with the name of the piece, e.g "bishop"
  // originalKey - object of type Coordinates that holds the x,y for where the piece came from
  // targetKey - object of type Coordinates that holds the x,y for where the piece is going to
  export class LastMove {
    constructor(pieceType, originalKey, targetKey) {
      this.pieceType = pieceType;
      this.originalKey = originalKey;
      this.targetKey = targetKey;
    }
  }
  
  // enum for Colors
  export const Color = {
    WHITE: 'W',
    BLACK: 'B',
  };
  
  // enum for Piece Types
  export const PieceType = {
    PAWN: 'pawn',
    ROOK: 'rook',
    KNIGHT: 'knight',
    BISHOP: 'bishop',
    QUEEN: 'queen',
    KING: 'king',
  };
  