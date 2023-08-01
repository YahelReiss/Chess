export function retrieveKeyFromCoordinates(x, y) {
  // Calculate the row and column based on the mouse coordinates and the size of the squares
  const squareSize = 80; // each square is 80x80 pixels
  const row = 7 - Math.floor(y / squareSize); // Row index
  const col = Math.floor(x / squareSize); // Column index

  return [col, row];
}

export function getPieceTypeFromStyle(backgroundImage) {
  // Extract the part of the string between the last '/' and '.png'
  const startIndex = backgroundImage.lastIndexOf('/') + 1;
  const endIndex = backgroundImage.lastIndexOf('.png');
  const pieceType = backgroundImage.slice(startIndex, endIndex);

  return pieceType;
}

export function getColor(backgroundImage) {
  const tempString = getPieceTypeFromStyle(backgroundImage);
  return tempString ? tempString[0] : null;
}