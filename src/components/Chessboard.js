import React, {useEffect, useState, useRef } from 'react';
import './Chessboard.css';
import Piece from './Piece';
import Square from './square.js';
import retrieveKeyFromCoordinates from './utilities.js'

const board_width = 8;
const board_height = 8;

let selectedPiece = null;
let prevKey = null;

function handleMouseDown(e) {
    const elem = e.target;
    const x = e.clientX - 50;
    const y = e.clientY - 50;
    if (elem.classList.contains("chessPiece")) {
        selectedPiece = elem
        const { left, top } = elem.getBoundingClientRect();
        
        selectedPiece.style.position = "absolute";
        selectedPiece.style.left = `${x - left}px`;
        selectedPiece.style.top = `${y - top}px`;

        prevKey  = `${x + 50},${y + 50}`
    }
}

function handleMouseMove(e, pieceArr, setPieceArr, chessboardRef) {
    const elem = e.target;
    const chessboardRect = chessboardRef.current.getBoundingClientRect();
    const offsetX = chessboardRect.left;
    const offsetY = chessboardRect.top;

    const x = e.clientX;
    const y = e.clientY;
    const key = retrieveKeyFromCoordinates(x - offsetX, y - offsetY);

    const { left, top } = elem.getBoundingClientRect();
    if (selectedPiece) {
        if (key !== prevKey) {
            const prevX = parseInt(prevKey.split(",")[0]);
            const prevY = parseInt(prevKey.split(",")[1]);
            const pieceIndex = pieceArr.findIndex((p) => p.x === prevX && p.y === prevY);

            if (pieceIndex !== -1) {
                const newX = parseInt(key.split(",")[0]);
                const newY = parseInt(key.split(",")[1]);
                const updatedPieceArr = [...pieceArr];
                updatedPieceArr[pieceIndex].x = newX;
                updatedPieceArr[pieceIndex].y = newY;
                setPieceArr(updatedPieceArr);
            }
            prevKey = key;
        }
        selectedPiece.style.position = "absolute";
        selectedPiece.style.left = `${x - left}px`;
        selectedPiece.style.top = `${y - top}px`;
    }
}

function handleMouseUp() {
  selectedPiece = null;
  prevKey = null;
}


function Chessboard() {
  const [pieceArr, setPieceArr] = useState([]);
  const chessboardRef = useRef(null);

  function setInitialPos() {
    const initialPieces = [];
    for (let i = 0; i < board_width; i++) {
      initialPieces.push(new Piece(i, 1, 'Wpawn'));
      initialPieces.push(new Piece(i, 6, 'Bpawn'));
    }
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

  return (
  <div 
  ref={chessboardRef}
  onMouseDown={(e) => handleMouseDown(e)}
  onMouseMove={(e) => handleMouseMove(e, pieceArr, setPieceArr, chessboardRef)}
  onMouseUp={() => handleMouseUp()}
  id="Chessboard">
    {Board}
    </div>
    );
}

export default Chessboard;