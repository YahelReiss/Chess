import React, {useEffect, useState, useRef } from 'react';
import './Chessboard.css';
import Piece from './Piece';
import Square from './square.js';
import { retrieveKeyFromCoordinates, getPieceTypeFromStyle, getColor } from './utilities.js';
import {BOARD_WIDTH, BOARD_HEIGHT, INITIAL_BOARD, Coordinates, LastMove, Color, PieceType} from "../constants"
import _ from 'lodash';

// destructuring assignment to extract values
const { WHITE, BLACK } = Color;
const { PAWN, ROOK, KNIGHT, BISHOP, QUEEN, KING } = PieceType;

let selectedPiece = null;
let originalKey = null;
let originalPositionLeft = null;
let originalPositionTop = null;
let lastMove = new LastMove(); // for en passant purposes
let longCastelW = true;
let longCastelB = true;
let shortCastelW = true;
let shortCastelB = true;


function checkIfLegalMove(originalSquare, targetSquare, piece, turn, pieceArr, setPieceArr, modalRef) {
  const color = turn;
  const pieceType = piece.pieceType;
  let possibleMove = false;
  let check = false;
  if (pieceType === PAWN) {
    possibleMove = checkIfLegalPawnMove(originalSquare, targetSquare, pieceArr, color, modalRef);
  } else if (pieceType === ROOK) {
    possibleMove = checkIfLegalRookMove(originalSquare, targetSquare, color, pieceArr);
  } else if (pieceType === KNIGHT) {
    possibleMove = checkIfLegalKnightMove(originalSquare, targetSquare, color, pieceArr);
  } else if (pieceType === BISHOP) {
    possibleMove = checkIfLegalBishopMove(originalSquare, targetSquare, color, pieceArr);
  } else if (pieceType === QUEEN) {
    possibleMove = checkIfLegalQueenMove(originalSquare, targetSquare, color, pieceArr);
  } else if (pieceType === KING) {
    possibleMove = checkIfLegalKingMove(originalSquare, targetSquare, color, pieceArr, setPieceArr, modalRef);
  }
  if (possibleMove) {
    const updatedPieceArr = pieceArr.map(row => row.map(element => (element === null? null : _.cloneDeep(element))));
    const newX = targetSquare.x
    const newY = targetSquare.y
    const prevX = originalSquare.x
    const prevY = originalSquare.y
    updatedPieceArr[newX][newY] = updatedPieceArr[prevX][prevY]
    updatedPieceArr[newX][newY].x = newX
    updatedPieceArr[newX][newY].y = newY
    updatedPieceArr[prevX][prevY] = null
    check = check4Check(updatedPieceArr, setPieceArr, turn)
  }

  return possibleMove && check
}

function check4Check(pieceArr, setPieceArr, turn) {
  const attackingColor = turn === WHITE ? BLACK : WHITE;

  let king = null;
  for (let col = 0; col < BOARD_WIDTH; col++) {
    for (let row = 0; row < BOARD_HEIGHT; row++) {
      const piece = pieceArr[col][row]
      if (piece && piece.color === turn && piece.pieceType === KING) {
        king = piece;
      }
    }
  }
  return ! isUnderAttack(king.x, king.y, attackingColor, pieceArr, setPieceArr); // return true if there is no check, false otherwise
}

function checkIfLegalPawnMove(originalSquare, targetSquare, pieceArr, color, modalRef) {
  const targetX = targetSquare.x;
  const targetY = targetSquare.y;

  const currentX = originalSquare.x;
  const currentY = originalSquare.y;

  // determine the direction in which the pawn can move based on its color
  const direction = color === WHITE ? 1 : -1;
  const attackingColor = color === WHITE ? BLACK : WHITE;

  // check for promotion
  const promotionRank = color === WHITE ? BOARD_HEIGHT - 1 : 0;
  if ((targetSquare.y === promotionRank) && 
    ((Math.abs(targetX - currentX) === 1 &&
    targetY === currentY + direction &&
    isOccupiedByOpponent(targetX, targetY, pieceArr, attackingColor)) || 
    (targetX === currentX &&
    targetY === currentY + direction &&
    !isOccupied(targetX, targetY, pieceArr)))
  ) {
    modalRef.current?.classList.remove("nullified")
    return true
  }

  // check for one square forward validity
  if (targetX === currentX && targetY === currentY + direction && !isOccupied(targetX, targetY, pieceArr)) {
    return true; // its a legal move
  }

  // check for two squares forward validity 
  if (
    currentY === (color === WHITE ? 1 : BOARD_HEIGHT - 2) && // pawn's first move
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
    isOccupiedByOpponent(targetX, targetY, pieceArr, attackingColor)
  ) {
    return true; // Legal move, diagonal capture of an opponent's piece
  }

  // check for en passant
  if (
    lastMove.pieceType === PAWN && // Last move was by a pawn
    Math.abs(lastMove.targetKey.y - lastMove.originalKey.y) === 2 && // The last move moved the pawn two squares forward
    Math.abs(targetX - currentX) === 1 && // Target square is one square diagonally left or right
    targetY === currentY + direction && // Target square is in the correct direction
    lastMove.targetKey.x === targetX &&// Target square matches the originalKey stored in lastMove
    lastMove.targetKey.y === currentY
  ) {
    // En passant is a legal move
    // Remove the captured pawn from the pieceArr
    pieceArr[lastMove.targetKey.x][lastMove.targetKey.y] = null;
    return true;
  }

  return false; // Move is not legal for the pawn
}

function checkIfLegalRookMove(originalSquare, targetSquare, color, pieceArr) {
  const targetX = targetSquare.x;
  const targetY = targetSquare.y;

  const currentX = originalSquare.x;
  const currentY = originalSquare.y;

  const attackingColor = color === WHITE ? BLACK : WHITE

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
    if (isOccupiedByOpponent(targetX, targetY, pieceArr, attackingColor)) {
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
    if (isOccupiedByOpponent(targetX, targetY, pieceArr, attackingColor)) {
      return true; // free to capture
    }
  }
  return false;
}

function checkIfLegalKnightMove(originalSquare, targetSquare, color, pieceArr) {
  const targetX = targetSquare.x;
  const targetY = targetSquare.y;

  const currentX = originalSquare.x;
  const currentY = originalSquare.y;

  const attackingColor = color === WHITE ? BLACK : WHITE

  // check if the move is in the L-shaped pattern of the knight
  if ((Math.abs(currentX - targetX) === 1 && Math.abs(currentY - targetY) === 2) ||
      (Math.abs(currentX - targetX) === 2 && Math.abs(currentY - targetY) === 1)) 
      {
        // check if the target square is unoccupied or occupied by an opponent's piece
        if (!isOccupied(targetX, targetY, pieceArr) || isOccupiedByOpponent(targetX, targetY, pieceArr, attackingColor)) {
          return true;
        }
      }
      return false
}

function checkIfLegalBishopMove(originalSquare, targetSquare, color, pieceArr) {
  const targetX = targetSquare.x;
  const targetY = targetSquare.y;

  const currentX = originalSquare.x;
  const currentY = originalSquare.y;

  const attackingColor = color === WHITE ? BLACK : WHITE

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
  if (!isOccupied(targetX, targetY, pieceArr) || isOccupiedByOpponent(targetX, targetY, pieceArr, attackingColor)) {
    return true;
  }
return false;
}

function checkIfLegalQueenMove(originalSquare, targetSquare, color, pieceArr) {
  return checkIfLegalRookMove(originalSquare, targetSquare, color, pieceArr) ||
         checkIfLegalBishopMove(originalSquare, targetSquare, color, pieceArr);
}

function checkIfLegalKingMove(originalSquare, targetSquare, color, pieceArr, setPieceArr, modalRef) {
  const targetX = targetSquare.x;
  const targetY = targetSquare.y;

  const currentX = originalSquare.x;
  const currentY = originalSquare.y;

  const deltaX = Math.abs(targetX - currentX);
  const deltaY = Math.abs(targetY - currentY);

  const attackingColor = color === WHITE ? BLACK : WHITE;

  // check for regular king move - one square
  if ((deltaX === 1 && deltaY === 0) || (deltaX === 0 && deltaY === 1) || (deltaX === 1 && deltaY === 1)) {
    if (!isOccupied(targetX, targetY, pieceArr) || isOccupiedByOpponent(targetX, targetY, pieceArr, attackingColor)) {
      const updatedPieceArr = pieceArr.map(row => row.map(element => (element === null? null : _.cloneDeep(element))));
      updatedPieceArr[targetX][targetY] = updatedPieceArr[currentX][currentY]
      updatedPieceArr[targetX][targetY].x = targetX
      updatedPieceArr[targetX][targetY].y = targetY
      updatedPieceArr[currentX][currentY] = null
      if (isUnderAttack(targetX, targetY, attackingColor, updatedPieceArr, setPieceArr, modalRef)) {
        return false;
      }
      if (color === WHITE) {
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
    if (color === WHITE ? shortCastelW : shortCastelB) {
      if (!isOccupied(currentX + 1, currentY, pieceArr) && !isOccupied(currentX + 2, currentY, pieceArr)) {
        if (!isUnderAttack(currentX, currentY, attackingColor, pieceArr, setPieceArr, modalRef) &&
             !isUnderAttack(currentX + 1, currentY, attackingColor, pieceArr, setPieceArr, modalRef) && 
             !isUnderAttack(currentX + 2, currentY, attackingColor, pieceArr, setPieceArr, modalRef)) {
              if (color === WHITE) {
                longCastelW = false;
                shortCastelW = false;
              } else {
                longCastelB = false;
                shortCastelB = false;
              }

              // move the rook
              const rookOriginalKey = new Coordinates(BOARD_WIDTH - 1, (color === WHITE) ? 0 : 7)
              const rookTargetKey = new Coordinates(targetX - 1, (color === WHITE) ? 0 : 7)
              movePiece(rookOriginalKey, rookTargetKey, pieceArr, setPieceArr)

          return true;
        }
      }
    }
  }

  // handle long castl
  if ((deltaX === 2) && (deltaY === 0) && (targetX < currentX)) {
    if (color === WHITE ? longCastelW : longCastelB) {
      if (!isOccupied(currentX - 1, currentY, pieceArr) &&
       !isOccupied(currentX - 2, currentY, pieceArr) &&
       !isOccupied(currentX - 3, currentY, pieceArr)) {
        if (!isUnderAttack(currentX, currentY, attackingColor, pieceArr, setPieceArr, modalRef) &&
             !isUnderAttack(currentX + 1, currentY, attackingColor, pieceArr, setPieceArr, modalRef) && 
             !isUnderAttack(currentX + 2, currentY, attackingColor, pieceArr, setPieceArr, modalRef)) {
              if (color === WHITE) {
                longCastelW = false;
                shortCastelW = false;
              } else {
                longCastelB = false;
                shortCastelB = false;
              }

              // move the rook
              const rookOriginalKey = new Coordinates(0, (color === WHITE) ? 0 : 7)
              const rookTargetKey = new Coordinates(targetX + 1, (color === WHITE) ? 0 : 7)
              movePiece(rookOriginalKey, rookTargetKey, pieceArr, setPieceArr)

          return true;
        }
      }
    }
  }
  return false;
}

function promote(pieceType, pieceArr, setPieceArr, modalRef) {
  const updatedPieceArr = pieceArr.map(row => row.map(element => (element === null? null :{ ...element })));
  const promotedPawnKey = lastMove.targetKey
  updatedPieceArr[promotedPawnKey.x][promotedPawnKey.y].pieceType = pieceType;
  setPieceArr(updatedPieceArr);
  modalRef.current?.classList.add("nullified")
}

function isUnderAttack(attckedSquareX, attckedSquareY, attackingColor, pieceArr, setPieceArr, modalRef) {
  // iterate through the board
  for (let col = 0; col < BOARD_WIDTH; col++) {
    for (let row = 0; row < BOARD_HEIGHT; row++) {
      const piece = pieceArr[col][row]
      if (piece && piece.color === attackingColor) { // check that it is an opponent's piece
      // check if the opponent's piece can legally move to the target square
        const attckedSquare = new Coordinates(attckedSquareX, attckedSquareY);
        const originalSquare = new Coordinates(piece.x, piece.y)
        let attacked = null
        switch (piece.pieceType) {
          case PAWN:
            attacked = checkIfLegalPawnMove(originalSquare, attckedSquare, pieceArr, attackingColor, modalRef)
            if (attacked) {
              return true
            }
            continue
          case KNIGHT:
            attacked = checkIfLegalKnightMove(originalSquare, attckedSquare, attackingColor, pieceArr)
            if (attacked) {
              return true
            }
            continue
          case BISHOP:
            attacked = checkIfLegalBishopMove(originalSquare, attckedSquare, attackingColor, pieceArr)
            if (attacked) {
              return true
            }
            continue
          case ROOK:
            attacked = checkIfLegalRookMove(originalSquare, attckedSquare, attackingColor, pieceArr)
            if (attacked) {
              return true
            }
            continue
          case QUEEN:
            attacked = checkIfLegalQueenMove(originalSquare, attckedSquare, attackingColor, pieceArr)
            if (attacked) {
              return true
            }
            continue
          case KING:
            attacked = checkIfLegalKingMove(originalSquare, attckedSquare, pieceArr, setPieceArr)
            if (attacked) {
              return true
            }
            continue
          default:
        }
      }
    }
  }
  return false; // square is not under attack
}

// move a specified piece from its current square to a new square
function movePiece(originalKey, targetKey, pieceArr, setPieceArr) {
  const originalX = originalKey.x;
  const originalY = originalKey.y;
  const targetX = targetKey.x;
  const targetY = targetKey.y;

  const pieceToMove = pieceArr[originalX][originalY];

  if (pieceToMove) {
    // Update the piece's position in the pieceArr
    const updatedPieceArr = [...pieceArr];
    updatedPieceArr[originalX][originalY] = null;
    updatedPieceArr[targetX][targetY] = pieceToMove
    updatedPieceArr[targetX][targetY].x = targetX
    updatedPieceArr[targetX][targetY].y = targetY
    setPieceArr(updatedPieceArr);
  }
}

// helper function to check if a square is occupied by a piece
function isOccupied(x, y, pieceArr) {
  return pieceArr[x][y] !== null;
}

// helper function to check if a square is occupied by an opponent piece
function isOccupiedByOpponent(x, y, pieceArr, attackingColor) {
  return pieceArr[x][y] !== null && pieceArr[x][y].color === attackingColor;
}

function handleMouseDown(e, turn, chessboardRef) {
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

function handleMouseUp(e, pieceArr, setPieceArr, turn, setTurn, chessboardRef, modalRef) {
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
  if (key[0] < 0 || key[0] >= BOARD_WIDTH || key[1] < 0 || key[1] >= BOARD_HEIGHT) {
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
      const legal = checkIfLegalMove(originalKey, targetSquare, pieceArr[prevX][prevY], turn, pieceArr, setPieceArr, modalRef)
      if (legal) {
        // update the lastMove object
        const pieceType = getPieceTypeFromStyle(selectedPiece.style.backgroundImage);
        lastMove.pieceType = pieceType.substring(1);
        lastMove.originalKey = originalKey;
        lastMove.targetKey = targetSquare;
  
        // update the piece's position on the board and remove captured pieces
        if (pieceArr[prevX][prevY] !== null) {
            const newX = targetSquare.x;
            const newY = targetSquare.y;
            const updatedPieceArr = [...pieceArr];
            updatedPieceArr[newX][newY] = pieceArr[prevX][prevY]
            updatedPieceArr[newX][newY].x = newX
            updatedPieceArr[newX][newY].y = newY
            updatedPieceArr[prevX][prevY] = null;
            
            setPieceArr(updatedPieceArr); // update pieceArr
          }
  
        // move the selected piece to the new location.
        selectedPiece.style.position = "absolute";
        selectedPiece.style.left = `${x - left}px`;
        selectedPiece.style.top = `${y - top}px`;
  
        // switch player turn after the move
        turn = turn === WHITE ? BLACK : WHITE; // switch turns
        setTurn(turn)
  
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
  const [pieceArr, setPieceArr] = useState(INITIAL_BOARD); // state (2D array) to keep track of the board
  const chessboardRef = useRef(null); // reference to the chessboard div element
  const modalRef = useRef(null); // reference to the promotion modal div element
  const [turn, setTurn] = useState(WHITE);
  const color = turn === WHITE ? BLACK : WHITE

  // function to set the initial positions of the chess pieces
  function setInitialPos() {
    const INITIAL_BOARD2 = new Array(BOARD_WIDTH).fill(null).map(() => new Array(BOARD_HEIGHT).fill(null));

    // push pawns
    for (let i = 0; i < BOARD_WIDTH; i++) {
      INITIAL_BOARD2[i][1] = new Piece(i, 1, WHITE, 'pawn');
      INITIAL_BOARD2[i][6] = new Piece(i, 6, BLACK, 'pawn');
    }
    // push the rest of the pieces
    for (let i = 0; i < 2; i++) {
      const type = i === 0 ? WHITE : BLACK;
      const yPos = i === 0 ? 0 : 7;
      INITIAL_BOARD2[0][yPos] = new Piece(0, yPos, type, ROOK);
      INITIAL_BOARD2[7][yPos] = new Piece(7, yPos, type, ROOK);
      INITIAL_BOARD2[1][yPos] = new Piece(1, yPos, type, KNIGHT);
      INITIAL_BOARD2[6][yPos] = new Piece(6, yPos, type, KNIGHT);
      INITIAL_BOARD2[2][yPos] = new Piece(2, yPos, type, BISHOP);
      INITIAL_BOARD2[5][yPos] = new Piece(5, yPos, type, BISHOP);
      INITIAL_BOARD2[4][yPos] = new Piece(4, yPos, type, KING);
      INITIAL_BOARD2[3][yPos] = new Piece(3, yPos, type, QUEEN);
    }
    setPieceArr(INITIAL_BOARD2);
  }

  // run setInitialPos only once
  useEffect(() => {
    setInitialPos();
  }, []);

  // Generate the XML for the chessboard grid and pieces
  let Board = [];
  for (let i = BOARD_HEIGHT - 1; i >= 0; i--) {
    for (let j = 0; j < BOARD_WIDTH; j++) {
      const num = j + i 
      let imageSrc = undefined;
      if (pieceArr[j][i] !== null) {
        imageSrc = 'images/' + pieceArr[j][i].color + pieceArr[j][i].pieceType + '.png';
      }
      Board.push(<Square key={`${j},${i}`} number={num} image={imageSrc}/>)
    }
  }

  // render the chessboard and pieces
  return (
    <>
      <div id="pawn-promotion" className="nullified" ref={modalRef}>
        <div className="modal-body">
          <img onClick={() => promote(QUEEN, pieceArr, setPieceArr, modalRef, lastMove)} src={`images/${color}QUEEN.png`} alt={`${color} QUEEN`}/>
          <img onClick={() => promote(KNIGHT, pieceArr, setPieceArr, modalRef, lastMove)} src={`images/${color}KNIGHT.png`} alt={`${color} KNIGHT`}/>
          <img onClick={() => promote(ROOK, pieceArr, setPieceArr, modalRef, lastMove)} src={`images/${color}ROOK.png`} alt={`${color} ROOK`}/>
          <img onClick={() => promote(BISHOP, pieceArr, setPieceArr, modalRef, lastMove)} src={`images/${color}BISHOP.png`} alt={`${color} BISHOP`}/>
        </div>
      </div>
      <div 
      ref={chessboardRef}
      onMouseDown={(e) => handleMouseDown(e, turn, chessboardRef)}
      onMouseMove={(e) => handleMouseMove(e, chessboardRef)}
      onMouseUp={(e) => handleMouseUp(e, pieceArr, setPieceArr, turn, setTurn, chessboardRef, modalRef)}
      id="Chessboard">
        {Board}
        </div>
    </>
    );
}

export default Chessboard;