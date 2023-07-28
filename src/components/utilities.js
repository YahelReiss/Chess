export default function retrieveKeyFromCoordinates(x, y) {
    // Calculate the row and column based on the mouse coordinates and the size of the squares
    const squareSize = 80; // each square is 80x80 pixels
    const row = 7 - Math.floor(y / squareSize); // Row index
    const col = Math.floor(x / squareSize); // Column index
  
    // create and return the key in the same format
    const key = `${col},${row}`;
    return key;
  }
