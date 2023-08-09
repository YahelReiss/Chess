import React, {useEffect, useState, useRef } from 'react';
import './Chessboard.css';
import Piece from './Piece';
import Square from './square.js';
import { retrieveKeyFromCoordinates, getPieceTypeFromStyle, getColor } from './utilities.js';

// class that holds the coordinates of a square in the chess board
// the x coordinate is the columns of the board
// the y coordinate is the rows of the board
class Coordinates {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

// class to store information about the last move
// pieceType - string with the name of the piece, e.g "bishop"
// originalKey - object of type Coordinates that holds the x,y for where the piece came from
// targetKey - object of type Coordinates that holds the x,y for where the piece is going to
class LastMove {
  constructor(pieceType, originalKey, targetKey) {
    this.pieceType = pieceType;
    this.originalKey = originalKey;
    this.targetKey = targetKey;
  }
}

// enum for Colors
const Color = {
  WHITE: 'W',
  BLACK: 'B',
};

// destructuring assignment to extract values
const { WHITE, BLACK } = Color;

// enum for Piece Types
const PieceType = {
  PAWN: 'pawn',
  ROOK: 'rook',
  KNIGHT: 'knight',
  BISHOP: 'bishop',
  QUEEN: 'queen',
  KING: 'king',
};

// destructuring assignment to extract values
const { PAWN, ROOK, KNIGHT, BISHOP, QUEEN, KING } = PieceType;

const board_width = 8;
const board_height = 8;

let selectedPiece = null;
let originalKey = null;
let originalPositionLeft = null;
let originalPositionTop = null;
let lastMove = new LastMove(); // for en passant purposes
let turn = WHITE;
let longCastelW = true;
let longCastelB = true;
let shortCastelW = true;
let shortCastelB = true;


function checkIfLegalMove(originalSquare, targetSquare, piece, pieceArr, setPieceArr) {
  const pieceType = piece.pieceType;
  if (pieceType === PAWN) {
    return checkIfLegalPawnMove(originalSquare, targetSquare, pieceArr, piece.color);
  } else if (pieceType === ROOK) {
    return checkIfLegalRookMove(originalSquare, targetSquare, pieceArr);
  } else if (pieceType === KNIGHT) {
    return checkIfLegalKnightMove(originalSquare, targetSquare, pieceArr);
  } else if (pieceType === BISHOP) {
    return checkIfLegalBishopMove(originalSquare, targetSquare, pieceArr);
  } else if (pieceType === QUEEN) {
    return checkIfLegalQueenMove(originalSquare, targetSquare, pieceArr);
  } else if (pieceType === KING) {
    return checkIfLegalKingMove(originalSquare, targetSquare, pieceArr, setPieceArr);
  } 
}

function checkIfLegalPawnMove(originalSquare, targetSquare, pieceArr, color) {
  const targetX = targetSquare.x;
  const targetY = targetSquare.y;

  const currentX = originalSquare.x;
  const currentY = originalSquare.y;

  // determine the direction in which the pawn can move based on its color
  const direction = color === WHITE ? 1 : -1;

  // check for one square forward validity
  if (targetX === currentX && targetY === currentY + direction && !isOccupied(targetX, targetY, pieceArr)) {
    return true; // its a legal move
  }

  // check for two squares forward validity 
  if (
    currentY === (color === WHITE ? 1 : board_height - 2) && // pawn's first move
    targetX === currentX &&
    targetY === currentY + 2 * direction &&
    !isOccupied(targetX, targetY, pieceArr) &&
    !isOccupied(targetX, targetY - direction, pieceArr)
  ) {
    return true; // Legal move, two squares forward on the first move and both squares are empty
  }

  // check if move is a legal capture move (not including en passant)
  if (
    Math.abs(targetX - currentX) === 1 &&
    targetY === currentY + direction &&
    isOccupiedByOpponent(targetX, targetY, pieceArr)
  ) {
    return true; // Legal move, diagonal capture of an opponent's piece
  }

  // check for en passant
  if (
    lastMove.pieceType === PAWN && // Last move was by a pawn
    Math.abs(lastMove.targetKey.y - lastMove.originalKey.y) === 2 && // The last move moved the pawn two squares forward
    Math.abs(targetX - currentX) === 1 && // Target square is one square diagonally left or right
    targetY === currentY + direction && // Target square is in the correct direction
    lastMove.targetKey.x === targetX // Target square matches the originalKey stored in lastMove
  ) {
    // En passant is a legal move
    // Remove the captured pawn from the pieceArr
    const capturedPawnIndex = pieceArr.findIndex(
      (p) => p.x === lastMove.targetKey.x && p.y === lastMove.targetKey.y
    );
    if (capturedPawnIndex !== -1) {
      pieceArr.splice(capturedPawnIndex, 1);
    }
    return true;
  }

  return false; // Move is not legal for the pawn
}

function checkIfLegalRookMove(originalSquare, targetSquare, pieceArr) {
  const targetX = targetSquare.x;
  const targetY = targetSquare.y;

  const currentX = originalSquare.x;
  const currentY = originalSquare.y;

  // handle vertical movement
  if (targetX === currentX && targetY !== currentY) {
      // loop through the squares between the current and target Y positions to check that the path is clear
    for (let i = 1; i < Math.abs(targetY - currentY); i++) {
      const direction = currentY < targetY ? 1 : -1; // 1 for up, -1 fo down
      if (isOccupied(currentX, currentY + (i*direction), pieceArr)) {
        return false
      }
    }
    if (!isOccupied(targetX, targetY, pieceArr)) {
      return true; // free to move to this square
    }
    if (isOccupiedByOpponent(targetX, targetY, pieceArr)) {
      return true; // free to capture
    }
  }

  // handle horisontal movement
  if (targetY === currentY && targetX !== currentX) {
    // loop through the squares between the current and target X positions to check that the path is clear
    for (let i = 1; i < Math.abs(targetX - currentX); i++) {
      const direction = currentX < targetX ? 1 : -1;
      if (isOccupied(currentX + (i*direction), currentY, pieceArr)) {
        return false
      }
    }
    if (!isOccupied(targetX, targetY, pieceArr)) {
      return true; // free to move to this square
    }
    if (isOccupiedByOpponent(targetX, targetY, pieceArr)) {
      return true; // free to capture
    }
  }
  return false;
}

function checkIfLegalKnightMove(originalSquare, targetSquare, pieceArr) {
  const targetX = targetSquare.x;
  const targetY = targetSquare.y;

  const currentX = originalSquare.x;
  const currentY = originalSquare.y;

  // check if the move is in the L-shaped pattern of the knight
  if ((Math.abs(currentX - targetX) === 1 && Math.abs(currentY - targetY) === 2) ||
      (Math.abs(currentX - targetX) === 2 && Math.abs(currentY - targetY) === 1)) 
      {
        // check if the target square is unoccupied or occupied by an opponent's piece
        if (!isOccupied(targetX, targetY, pieceArr) || isOccupiedByOpponent(targetX, targetY, pieceArr)) {
          return true;
        }
      }
      return false
}

function checkIfLegalBishopMove(originalSquare, targetSquare, pieceArr) {
  const targetX = targetSquare.x;
  const targetY = targetSquare.y;

  const currentX = originalSquare.x;
  const currentY = originalSquare.y;

  // calculate the horizontal and vertical distance between the current position and the target position
  const deltaX = Math.abs(targetX - currentX);
  const deltaY = Math.abs(targetY - currentY);

  // deltaX and deltaY must be equal for a legal diagonal move
  if (deltaX !== deltaY) {
    return false;
  }

  // determine the direction of movement (positive or negative) for both x and y axes
  const xDirection = currentX < targetX ? 1 : -1;
  const yDirection = currentY < targetY ? 1 : -1;

  // check if there are any pieces on the bishop's path
  for (let i = 1; i < deltaX; i++) {
    const intermediateX = currentX + (i * xDirection);
    const intermediateY = currentY + (i * yDirection);

    if (isOccupied(intermediateX, intermediateY, pieceArr)) {
      return false;
    }
  }
  // check if the target square is unoccupied or occupied by an opponent's piece
  if (!isOccupied(targetX, targetY, pieceArr) || isOccupiedByOpponent(targetX, targetY, pieceArr)) {
    return true;
  }
return false;
}

function checkIfLegalQueenMove(originalSquare, targetSquare, pieceArr) {
  return checkIfLegalRookMove(originalSquare, targetSquare, pieceArr) ||
         checkIfLegalBishopMove(originalSquare, targetSquare, pieceArr);
}

function checkIfLegalKingMove(originalSquare, targetSquare, pieceArr, setPieceArr) {
  const targetX = targetSquare.x;
  const targetY = targetSquare.y;

  const currentX = originalSquare.x;
  const currentY = originalSquare.y;

  const deltaX = Math.abs(targetX - currentX);
  const deltaY = Math.abs(targetY - currentY);

  const attackingColor = turn === WHITE ? BLACK : WHITE;

  // check for regular king move - one square
  if ((deltaX === 1 && deltaY === 0) || (deltaX === 0 && deltaY === 1) || (deltaX === 1 && deltaY === 1)) {
    if (!isOccupied(targetX, targetY, pieceArr) || isOccupiedByOpponent(targetX, targetY, pieceArr)) {
      if (isUnderAttack(targetX, targetY, attackingColor, pieceArr, setPieceArr)) {
        return false;
      }
      if (turn === WHITE) {
        longCastelW = false;
        shortCastelW = false;
      } else {
        longCastelB = false;
        shortCastelB = false;
      }
      return true;
    }
  }

  // handle short castle
  if ((deltaX === 2) && (deltaY === 0) && (currentX < targetX)) {
    if (turn === WHITE ? shortCastelW : shortCastelB) {
      if (!isOccupied(currentX + 1, currentY, pieceArr) && !isOccupied(currentX + 2, currentY, pieceArr)) {
        if (!isUnderAttack(currentX, currentY, attackingColor, pieceArr, setPieceArr) &&
             !isUnderAttack(currentX + 1, currentY, attackingColor, pieceArr, setPieceArr) && 
             !isUnderAttack(currentX + 2, currentY, attackingColor, pieceArr, setPieceArr)) {
              if (turn === WHITE) {
                longCastelW = false;
                shortCastelW = false;
              } else {
                longCastelB = false;
                shortCastelB = false;
              }

              // move the rook
              const rookOriginalKey = new Coordinates(board_width - 1, (turn === WHITE) ? 0 : 7)
              const rookTargetKey = new Coordinates(targetX - 1, (turn === WHITE) ? 0 : 7)
              movePiece(rookOriginalKey, rookTargetKey, pieceArr, setPieceArr)

          return true;
        }
      }
    }
  }

  // handle long castl
  if ((deltaX === 2) && (deltaY === 0) && (targetX < currentX)) {
    if (turn === WHITE ? longCastelW : longCastelB) {
      if (!isOccupied(currentX - 1, currentY, pieceArr) &&
       !isOccupied(currentX - 2, currentY, pieceArr) &&
       !isOccupied(currentX - 3, currentY, pieceArr)) {
        if (!isUnderAttack(currentX, currentY, attackingColor, pieceArr, setPieceArr) &&
             !isUnderAttack(currentX + 1, currentY, attackingColor, pieceArr, setPieceArr) && 
             !isUnderAttack(currentX + 2, currentY, attackingColor, pieceArr, setPieceArr)) {
              if (turn === WHITE) {
                longCastelW = false;
                shortCastelW = false;
              } else {
                longCastelB = false;
                shortCastelB = false;
              }

              // move the rook
              const rookOriginalKey = new Coordinates(0, (turn === WHITE) ? 0 : 7)
              const rookTargetKey = new Coordinates(targetX + 1, (turn === WHITE) ? 0 : 7)
              movePiece(rookOriginalKey, rookTargetKey, pieceArr, setPieceArr)

          return true;
        }
      }
    }
  }
  
  return false;
}

function isUnderAttack(attckedSquareX, attckedSquareY, attackingColor, pieceArr, setPieceArr) {
  // iterate through all pieces
  for (const key in pieceArr) {
    const piece = pieceArr[key];
    if (piece.color === attackingColor) { // check that it is an opponent's piece
      // check if the opponent's piece can legally move to the target square
      if (piece.pieceType === KING) {
        if (Math.abs(piece.x - attckedSquareX) <= 1 &&  Math.abs(piece.y - attckedSquareY) <= 1) {
          return true;
        }
      }
      const attckedSquare = new Coordinates(attckedSquareX, attckedSquareY);
      const originalSquare = new Coordinates(piece.x, piece.y)
      if (checkIfLegalMove(originalSquare, attckedSquare, piece, pieceArr, setPieceArr)) {
        return true; // square is under attack
      }
    }
  }

  return false; // square is not under attack
}

// move a specified piece from its current square to a new square
function movePiece(originalKey, targetKey, pieceArr, setPieceArr) {
  const pieceIndex = pieceArr.findIndex((p) => p.x === originalKey.x && p.y === originalKey.y);

  const targetX = targetKey.x;
  const targetY = targetKey.y;

  if (pieceIndex !== -1) {
    // Update the piece's position in the pieceArr
    const updatedPieceArr = [...pieceArr];  
    updatedPieceArr[pieceIndex].x = targetX;
    updatedPieceArr[pieceIndex].y = targetY;
    setPieceArr(updatedPieceArr);
  }
}

// helper function to check if a square is occupied by a piece
function isOccupied(x, y, pieceArr) {
  return pieceArr.some((p) => p.x === x && p.y === y);
}

// helper function to check if a square is occupied by an opponent piece
function isOccupiedByOpponent(x, y, pieceArr) {
  return pieceArr.some((p) => p.x === x && p.y === y && p.color !== turn);
}

function handleMouseDown(e, chessboardRef) {
    const elem = e.target;
    const color = getColor(elem.style.backgroundImage) // return "W" or "B"

    const chessboardRect = chessboardRef.current.getBoundingClientRect();
    const offsetX = chessboardRect.left; // offset of the board compard to the window - X coordinate
    const offsetY = chessboardRect.top; // offset of the board compard to the window - Y coordinate
    const x = e.clientX;
    const y = e.clientY;
    if (elem.classList.contains("chessPiece") && color === turn) {
      selectedPiece = elem
      const { left, top } = elem.getBoundingClientRect();

      // save original position in case of abort (illegal move etc.)
      originalPositionTop = selectedPiece.style.top
      originalPositionLeft = selectedPiece.style.left
      const key = retrieveKeyFromCoordinates(x - offsetX, y - offsetY)
      originalKey = new Coordinates(key[0], key[1])
      
      // move the piece to emphesize that it was selected
      selectedPiece.style.position = "absolute";
      selectedPiece.style.left = `${x - 40 - left}px`;
      selectedPiece.style.top = `${y - 40 - top}px`;

      // increase zIndex to move the piece above others
      selectedPiece.style.zIndex = "9999";
    }
}

function handleMouseMove(e, chessboardRef) {
    const chessboardRect = chessboardRef.current.getBoundingClientRect();
    const offsetY = chessboardRect.top;

    const x = e.clientX;
    const y = e.clientY;

    if (selectedPiece) {
    // move the selected chess piece to follow the cursor while dragging
    selectedPiece.style.position = "fixed";
    selectedPiece.style.left = `${x - 40}px`;
    selectedPiece.style.top = `${y - offsetY}px`;
    }
}

function handleMouseUp(e, pieceArr, setPieceArr, chessboardRef) {
  // get the target element and its boundries
  const elem = e.target;
  const { left, top } = elem.getBoundingClientRect();

  // get the chessboard's position offset
  const chessboardRect = chessboardRef.current.getBoundingClientRect();
  const offsetX = chessboardRect.left;
  const offsetY = chessboardRect.top;

  // get the mouse coordinates and the key of the mouse's location
  const x = e.clientX;
  const y = e.clientY;
  const key = retrieveKeyFromCoordinates(x - offsetX, y - offsetY);

  // check if the target square is (not) within the bounds of the board
  if (key[0] < 0 || key[0] >= board_width || key[1] < 0 || key[1] >= board_height) {
    // abort move - return the selected piece to its original location
    selectedPiece.style.position = "absolute";
    selectedPiece.style.left = originalPositionLeft;
    selectedPiece.style.top = originalPositionTop;
  } else {
    const targetSquare = new Coordinates(key[0], key[1]);

    if (selectedPiece) {
      // find the index of the selected piece in the pieceArr
      const prevX = originalKey.x;
      const prevY = originalKey.y;
      const pieceIndex = pieceArr.findIndex((p) => p.x === prevX && p.y === prevY);
      if (checkIfLegalMove(originalKey, targetSquare, pieceArr[pieceIndex], pieceArr, setPieceArr)) {
        // update the lastMove object
        const pieceType = getPieceTypeFromStyle(selectedPiece.style.backgroundImage);
        lastMove.pieceType = pieceType.substring(1);
        lastMove.originalKey = originalKey;
        lastMove.targetKey = targetSquare;
  
        // update the piece's position on the board and remove captured pieces
        if (pieceIndex !== -1) {
            const newX = targetSquare.x;
            const newY = targetSquare.y;
            const updatedPieceArr = [...pieceArr];  
            updatedPieceArr[pieceIndex].x = newX;
            updatedPieceArr[pieceIndex].y = newY;
  
            // check if the move is a capture and if so remove the captured piece
            const capturedPieceIndex = pieceArr.findIndex(
              (p) => p.x === newX && p.y === newY && p.color !== updatedPieceArr[pieceIndex].color);
            if (capturedPieceIndex !== -1) {
              updatedPieceArr.splice(capturedPieceIndex, 1);
            }
            
            setPieceArr(updatedPieceArr); // update pieceArr
          }
  
        // move the selected piece to the new location.
        selectedPiece.style.position = "absolute";
        selectedPiece.style.left = `${x - left}px`;
        selectedPiece.style.top = `${y - top}px`;
  
        // switch player turn after the move
        turn = turn === WHITE ? BLACK : WHITE; // switch turns
  
        } else {
        // abort move - return the selected piece to its original location
        selectedPiece.style.position = "absolute";
        selectedPiece.style.left = originalPositionLeft;
        selectedPiece.style.top = originalPositionTop;
        }
  // reset parameters
  selectedPiece.style.zIndex = "unset";
  selectedPiece = null;
  originalKey = null;
  originalPositionLeft = null;
  originalPositionTop = null;
    }
  }
}

function Chessboard() {
  const [pieceArr, setPieceArr] = useState([]); // state (array) to keep track of the pieces on the board
  const chessboardRef = useRef(null); // reference to the chessboard div element

  // function to set the initial positions of the chess pieces
  function setInitialPos() {
    const initialPieces = [];

    // push pawns
    for (let i = 0; i < board_width; i++) {
      initialPieces.push(new Piece(i, 1, WHITE, 'pawn'));
      initialPieces.push(new Piece(i, 6, BLACK, 'pawn'));
    }
    // push the rest of the pieces
    for (let i = 0; i < 2; i++) {
      const type = i === 0 ? WHITE : BLACK;
      const yPos = i === 0 ? 0 : 7;
      initialPieces.push(new Piece(0, yPos, type, ROOK));
      initialPieces.push(new Piece(7, yPos, type, ROOK));
      initialPieces.push(new Piece(1, yPos, type, KNIGHT));
      initialPieces.push(new Piece(6, yPos, type, KNIGHT));
      initialPieces.push(new Piece(2, yPos, type, BISHOP));
      initialPieces.push(new Piece(5, yPos, type, BISHOP));
      initialPieces.push(new Piece(4, yPos, type, KING));
      initialPieces.push(new Piece(3, yPos, type, QUEEN));
    }
    setPieceArr(initialPieces);
  }

  useEffect(() => {
    setInitialPos();
  }, []);

  // Generate the XML for the chessboard grid and pieces
  let Board = [];
  for (let i = board_height - 1; i >= 0; i--) {
    for (let j = 0; j < board_width; j++) {
        const num = j + i 
      let imageSrc = undefined;
      pieceArr.forEach((p) => {
        if (p.x === j && p.y === i) {
          imageSrc = 'images/' + p.color + p.pieceType + '.png';
        }
      });
      Board.push(<Square key={`${j},${i}`} squareKey={`${j},${i}`} number={num} image={imageSrc}/>)
    }
  }

  // render the chessboard and pieces
  return (
  <div 
  ref={chessboardRef}
  onMouseDown={(e) => handleMouseDown(e, chessboardRef)}
  onMouseMove={(e) => handleMouseMove(e, chessboardRef)}
  onMouseUp={(e) => handleMouseUp(e, pieceArr, setPieceArr, chessboardRef)}
  id="Chessboard">
    {Board}
    </div>
    );
}

export default Chessboard;