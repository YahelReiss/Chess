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

class LastMove {
  constructor(pieceType, originalKey, targetKey) {
    this.pieceType = pieceType;
    this.originalKey = originalKey;
    this.targetKey = targetKey;
  }
}


const board_width = 8;
const board_height = 8;

let selectedPiece = null;
let originalKey = null;
let originalPositionLeft = null;
let originalPositionTop = null;
let lastMove = new LastMove(); // for en passant purposes
let turn = "W";


function checkIfLegalMove(targetSquare, pieceArr) {
  const pieceType = getPieceTypeFromStyle(selectedPiece.style.backgroundImage);
  if (pieceType.substring(1) === "pawn") {
    return checkIfLegalPawnMove(targetSquare, pieceArr, pieceType[0], originalKey.x, originalKey.y);
  } else if (pieceType.substring(1) === "rook") {
    return true;
  } else if (pieceType.substring(1) === "knight") {
    return true;
  } else if (pieceType.substring(1) === "bishop") {
    return true;
  } else if (pieceType.substring(1) === "queen") {
    return true;
  } else if (pieceType.substring(1) === "king") {
    return true;
  } 
}

function checkIfLegalPawnMove(targetSquare, pieceArr, color, currentX, currentY) {
  const targetX = targetSquare.x;
  const targetY = targetSquare.y;

  // determine the direction in which the pawn can move based on its color
  const direction = color === "W" ? 1 : -1;

  // check for one square forward validity
  if (targetX === currentX && targetY === currentY + direction && !isOccupied(targetX, targetY, pieceArr)) {
    return true; // its a legal move
  }

  // check for two squares forward validity 
  if (
    currentY === (color === "W" ? 1 : board_height - 2) && // pawn's first move
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
    lastMove.pieceType === "pawn" && // Last move was by a pawn
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
  const targetSquare = new Coordinates(key[0], key[1])
  
  if (selectedPiece) {
    if (checkIfLegalMove(targetSquare, pieceArr)) {
      // find the index of the piece in the pieceArr
      const prevX = parseInt(originalKey.x);
      const prevY = parseInt(originalKey.y);
      const pieceIndex = pieceArr.findIndex((p) => p.x === prevX && p.y === prevY);

      // update the lastMove object
      const pieceType = getPieceTypeFromStyle(selectedPiece.style.backgroundImage);
      lastMove.pieceType = pieceType.substring(1);
      lastMove.originalKey = originalKey;
      lastMove.targetKey = targetSquare;

      // update in pieceArr the piece's position on the board and remove captured pieces
      if (pieceIndex !== -1) {
          const newX = parseInt(targetSquare.x);
          const newY = parseInt(targetSquare.y);
          const updatedPieceArr = [...pieceArr];  
          updatedPieceArr[pieceIndex].x = newX;
          updatedPieceArr[pieceIndex].y = newY;

          // check if the move is a capture and if so remove the captured piece
          const capturedPieceIndex = pieceArr.findIndex(
            (p) => p.x === newX && p.y === newY && p.type[0] !== updatedPieceArr[pieceIndex].type[0]);
          if (capturedPieceIndex !== -1) {
            updatedPieceArr.splice(capturedPieceIndex, 1);
          }
          
          setPieceArr(updatedPieceArr);
        }

      // Move the selected piece to the new location.
      selectedPiece.style.position = "absolute";
      selectedPiece.style.left = `${x - left}px`;
      selectedPiece.style.top = `${y - top}px`;

      // switch player turn after the move
      turn = turn === "W" ? "B" : "W"; // switch turns

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


function Chessboard() {
  const [pieceArr, setPieceArr] = useState([]); // state (array) to keep track of the pieces on the board
  const chessboardRef = useRef(null); // reference to the chessboard div element

  // function to set the initial positions of the chess pieces
  function setInitialPos() {
    const initialPieces = [];

    // push pawns
    for (let i = 0; i < board_width; i++) {
      initialPieces.push(new Piece(i, 1, 'Wpawn'));
      initialPieces.push(new Piece(i, 6, 'Bpawn'));
    }
    // push the rest of the pieces
    for (let i = 0; i < 2; i++) {
      const type = i === 0 ? 'W' : 'B';
      const yPos = i === 0 ? 0 : 7;
      initialPieces.push(new Piece(0, yPos, type + 'rook'));
      initialPieces.push(new Piece(7, yPos, type + 'rook'));
      initialPieces.push(new Piece(1, yPos, type + 'knight'));
      initialPieces.push(new Piece(6, yPos, type + 'knight'));
      initialPieces.push(new Piece(2, yPos, type + 'bishop'));
      initialPieces.push(new Piece(5, yPos, type + 'bishop'));
      initialPieces.push(new Piece(4, yPos, type + 'king'));
      initialPieces.push(new Piece(3, yPos, type + 'queen'));
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
          imageSrc = 'images/' + p.type + '.png';
        }
      });
      Board.push(<Square key={`${i},${j}`} number={num} image={imageSrc}/>)
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