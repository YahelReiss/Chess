import React, { useCallback, useEffect, useState } from 'react';
import './Chessboard.css';
import Piece from './Piece';

const board_width = 8;
const board_height = 8;

function usePieceMovement() {
    const [selectedPiece, setSelectedPiece] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const handlePieceMouseDown = (e, piece) => {
        e.preventDefault();
        setSelectedPiece(piece);
        setIsDragging(true);
  
        const { left, top } = e.target.getBoundingClientRect();
        const x = e.clientX - left;
        const y = e.clientY - top;
        setDragOffset({ x, y });
    };

    const handlePieceMouseMove = useCallback((e) => {
        if (!isDragging || !selectedPiece) return;
    
        const { left, top } = e.target.parentElement.getBoundingClientRect();
        const x = e.clientX - left - dragOffset.x;
        const y = e.clientY - top - dragOffset.y;

        // Ensure the piece doesn't go outside the board boundaries
        const maxX = (board_width - 1) * 80;
        const maxY = (board_height - 1) * 80;
        const boundedX = Math.min(maxX, Math.max(0, x));
        const boundedY = Math.min(maxY, Math.max(0, y));
    
        setSelectedPiece((prevPiece) => ({
            ...prevPiece,
            x: Math.floor(boundedX / 80),
            y: Math.floor(boundedY / 80),
        }));
    }, [isDragging, selectedPiece, dragOffset]);

    const handlePieceMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        document.addEventListener('mousedown', handlePieceMouseDown);
        document.addEventListener('mousemove', handlePieceMouseMove);
        
        return () => {
            document.removeEventListener('mousemove', handlePieceMouseMove);
            document.removeEventListener('mouseup', handlePieceMouseUp);
        };
        }, [isDragging, selectedPiece, dragOffset, handlePieceMouseMove, handlePieceMouseUp]);
    
        return { handlePieceMouseDown };
    };


function Chessboard() {
  const [pieceArr, setPieceArr] = useState([]);
  const { handlePieceMouseDown } = usePieceMovement();

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

  // eslint-disable-next-line no-unused-vars
  const renderChessPieces = () => {
    return pieceArr.map((piece) => (
      <div
        key={`${piece.x},${piece.y}`}
        className="chessPiece"
        style={{
          backgroundImage: `url(images/${piece.type}.png)`,
          top: piece.y * 80,
          left: piece.x * 80,
          cursor: 'grab',
        }}
        onMouseDown={(event) => handlePieceMouseDown(event, piece)}
      ></div>
    ));
  };

  let Board = [];
  for (let i = board_height - 1; i >= 0; i--) {
    for (let j = 0; j < board_width; j++) {
      let imageSrc = undefined;
      pieceArr.forEach((p) => {
        if (p.x === j && p.y === i) {
          imageSrc = 'images/' + p.type + '.png';
        }
      });

      if ((i + j) % 2 === 0) {
        Board.push(
          <div className="square black" key={`${j},${i}`}>
            {imageSrc && <div style={{ backgroundImage: `url(${imageSrc})` }} className="chessPiece"></div>}
          </div>
        );
      } else {
        Board.push(
          <div className="square white" key={`${j},${i}`}>
            {imageSrc && <div style={{ backgroundImage: `url(${imageSrc})` }} className="chessPiece"></div>}
          </div>
        );
      }
    }
  }

  return (
  <div
   id="Chessboard"
  >
    {Board}
    </div>
    );
}

export default Chessboard;