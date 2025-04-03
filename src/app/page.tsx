'use client';

import React, { useState, useEffect } from 'react';

interface Cell {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborMines: number;
}

interface BoardSize {
  rows: number;
  cols: number;
}

const Minesweeper = () => {
  const [boardSize, setBoardSize] = useState<BoardSize>({ rows: 10, cols: 10 });
  const [mineCount, setMineCount] = useState(15);
  const [board, setBoard] = useState<Cell[][]>([]);
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'won' | 'lost'>('waiting');
  const [flagCount, setFlagCount] = useState(0);
  const [timer, setTimer] = useState(0);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  
  // Initialize the board
  const initializeBoard = () => {
    // Reset game state
    setGameState('waiting');
    setFlagCount(0);
    setTimer(0);
    
    // Clear any existing timer
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    
    // Create empty board
    const newBoard: Cell[][] = Array(boardSize.rows).fill(null).map(() => 
      Array(boardSize.cols).fill(null).map(() => ({
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        neighborMines: 0
      }))
    );
    
    // Place mines randomly
    let minesPlaced = 0;
    while (minesPlaced < mineCount) {
      const row = Math.floor(Math.random() * boardSize.rows);
      const col = Math.floor(Math.random() * boardSize.cols);
      
      if (!newBoard[row][col].isMine) {
        newBoard[row][col].isMine = true;
        minesPlaced++;
      }
    }
    
    // Calculate neighbor mines
    for (let row = 0; row < boardSize.rows; row++) {
      for (let col = 0; col < boardSize.cols; col++) {
        if (!newBoard[row][col].isMine) {
          let neighbors = 0;
          
          // Check all 8 neighboring cells
          for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
              const newRow = row + i;
              const newCol = col + j;
              
              if (newRow >= 0 && newRow < boardSize.rows && 
                  newCol >= 0 && newCol < boardSize.cols &&
                  newBoard[newRow][newCol].isMine) {
                neighbors++;
              }
            }
          }
          
          newBoard[row][col].neighborMines = neighbors;
        }
      }
    }
    
    setBoard(newBoard);
  };
  
  // Reveal a cell
  const revealCell = (row: number, col: number) => {
    const newBoard = [...board];
    const cell = newBoard[row][col];
    
    // If game is waiting, start it
    if (gameState === 'waiting') {
      setGameState('playing');
      
      // Start timer only on first click
      const newIntervalId = setInterval(() => {
        setTimer(prevTimer => prevTimer + 1);
      }, 1000);
      setIntervalId(newIntervalId);
    } else if (gameState !== 'playing') {
      return; // Don't do anything if game is won or lost
    }
    
    // Don't reveal flagged cells
    if (cell.isFlagged) return;
    
    // Game over if it's a mine
    if (cell.isMine) {
      // Reveal all mines
      for (let r = 0; r < boardSize.rows; r++) {
        for (let c = 0; c < boardSize.cols; c++) {
          if (newBoard[r][c].isMine) {
            newBoard[r][c].isRevealed = true;
          }
        }
      }
      
      if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
      setGameState('lost');
      setBoard(newBoard);
      return;
    }
    
    // If already revealed, do nothing
    if (cell.isRevealed) return;
    
    // Reveal this cell
    cell.isRevealed = true;
    
    // If empty cell (no neighboring mines), reveal neighbors recursively
    if (cell.neighborMines === 0) {
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          const newRow = row + i;
          const newCol = col + j;
          
          if (newRow >= 0 && newRow < boardSize.rows && 
              newCol >= 0 && newCol < boardSize.cols &&
              !newBoard[newRow][newCol].isRevealed &&
              !newBoard[newRow][newCol].isMine) {
            revealCell(newRow, newCol);
          }
        }
      }
    }
    
    setBoard([...newBoard]);
  };
  
  // Toggle flag on a cell
  const toggleFlag = (row: number, col: number) => {
    if (gameState !== 'playing' && gameState !== 'waiting') return;
    
    // Start the game if it's the first action
    if (gameState === 'waiting') {
      setGameState('playing');
      
      // Start timer on first flag placement
      const newIntervalId = setInterval(() => {
        setTimer(prevTimer => prevTimer + 1);
      }, 1000);
      setIntervalId(newIntervalId);
    }
    
    const newBoard = [...board];
    const cell = newBoard[row][col];
    
    if (!cell.isRevealed) {
      if (cell.isFlagged) {
        cell.isFlagged = false;
        setFlagCount(prevCount => prevCount - 1);
      } else if (flagCount < mineCount) {
        cell.isFlagged = true;
        setFlagCount(prevCount => prevCount + 1);
      }
      
      // Check if the player has correctly flagged all mines
      if (!cell.isFlagged) { // Just unflagged, so no win check needed
        setBoard(newBoard);
        return;
      }
      
      // Check for win when adding a flag
      let allMinesFlagged = true;
      let allFlagsOnMines = true;
      let currentFlagCount = 0;
      
      for (let r = 0; r < boardSize.rows; r++) {
        for (let c = 0; c < boardSize.cols; c++) {
          if (newBoard[r][c].isFlagged) {
            currentFlagCount++;
          }
          
          // Check if any mine is not flagged
          if (newBoard[r][c].isMine && !newBoard[r][c].isFlagged) {
            allMinesFlagged = false;
          }
          
          // Check if any flag is not on a mine
          if (newBoard[r][c].isFlagged && !newBoard[r][c].isMine) {
            allFlagsOnMines = false;
          }
        }
      }
      
      // Win condition: all mines are flagged and all flags are on mines
      if (allMinesFlagged && allFlagsOnMines && currentFlagCount === mineCount) {
        if (intervalId) {
          clearInterval(intervalId);
          setIntervalId(null);
        }
        setGameState('won');
      }
      
      setBoard(newBoard);
    }
  };
  
  // Handle difficulty change
  const changeDifficulty = (level: 'easy' | 'medium' | 'hard') => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    
    switch (level) {
      case 'easy':
        setBoardSize({ rows: 10, cols: 10 });
        setMineCount(15);
        break;
      case 'medium':
        setBoardSize({ rows: 16, cols: 16 });
        setMineCount(40);
        break;
      case 'hard':
        setBoardSize({ rows: 16, cols: 30 });
        setMineCount(99);
        break;
      default:
        break;
    }
    
    setGameState('waiting');
  };
  
  // Initialize board when boardSize or mineCount changes
  useEffect(() => {
    if (gameState === 'waiting') {
      initializeBoard();
    }
  }, [boardSize, mineCount]);
  
  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
    };
  }, [intervalId]);
  
  // Cell rendering
  const renderCell = (cell: Cell, row: number, col: number) => {
    let cellContent = '';
    let className = 'cell';
    
    if (cell.isRevealed) {
      className += ' revealed';
      
      if (cell.isMine) {
        cellContent = '💣';
        className += ' mine';
      } else if (cell.neighborMines > 0) {
        cellContent = cell.neighborMines.toString();
        className += ` neighbors-${cell.neighborMines}`;
      }
    } else if (cell.isFlagged) {
      cellContent = '🚩';
      className += ' flagged';
    }
    
    return (
      <div 
        key={`${row}-${col}`}
        className={className}
        onClick={() => revealCell(row, col)}
        onContextMenu={(e) => {
          e.preventDefault();
          toggleFlag(row, col);
        }}
      >
        {cellContent}
      </div>
    );
  };
  
  // Format timer
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="minesweeper">
      <h1 className="game-title">Minesweeper</h1>
      
      <div className="controls">
        <button 
          className="control-btn easy"
          onClick={() => changeDifficulty('easy')}
        >
          Easy
        </button>
        <button 
          className="control-btn medium"
          onClick={() => changeDifficulty('medium')}
        >
          Medium
        </button>
        <button 
          className="control-btn hard"
          onClick={() => changeDifficulty('hard')}
        >
          Hard
        </button>
        <button 
          className="control-btn new-game"
          onClick={initializeBoard}
        >
          New Game
        </button>
      </div>
      
      <div className="game-info">
        <div className="mines">
          <span>💣</span> {mineCount - flagCount}/{mineCount}
        </div>
        <div className="timer">
          <span>⏱️</span> {formatTime(timer)}
        </div>
      </div>
      
      {gameState === 'won' && (
        <div className="status won">
          You won! 🎉 🏆 🎉
        </div>
      )}
      {gameState === 'lost' && (
        <div className="status lost">
          Game over! 💥 😵 💥
        </div>
      )}
      
      <div 
        className="board"
        style={{
          gridTemplateRows: `repeat(${boardSize.rows}, 30px)`,
          gridTemplateColumns: `repeat(${boardSize.cols}, 30px)`
        }}
      >
        {board.map((row, rowIndex) => (
          row.map((cell, colIndex) => renderCell(cell, rowIndex, colIndex))
        ))}
      </div>
      
      <div className="instructions">
        <p>👆 Click to reveal a cell. 👉 Right-click to place/remove a flag.</p>
        <p>🔢 Numbers show how many mines are in the adjacent cells.</p>
      </div>
      
      <style jsx>{`
        .cell {
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #8A2BE2; /* Vibrant purple */
          cursor: pointer;
          user-select: none;
          font-weight: bold;
          border-radius: 4px;
          box-shadow: inset 2px 2px 3px rgba(255,255,255,0.3), inset -2px -2px 3px rgba(0,0,0,0.2);
        }
        .cell:hover {
          background-color: #9932CC; /* Lighter purple on hover */
          transform: scale(1.05);
          transition: all 0.1s;
        }
        .cell.revealed {
          background-color: #F8F8FF; /* Ghost white */
          box-shadow: inset 1px 1px 2px rgba(0,0,0,0.2);
        }
        .cell.mine {
          background-color: #FF1493; /* Deep pink */
        }
        .cell.flagged {
          background-color: #32CD32; /* Lime green */
        }
        .neighbors-1 { color: #1E90FF; } /* Dodger blue */
        .neighbors-2 { color: #00FF7F; } /* Spring green */
        .neighbors-3 { color: #FF4500; } /* Orange red */
        .neighbors-4 { color: #9400D3; } /* Dark violet */
        .neighbors-5 { color: #FF8C00; } /* Dark orange */
        .neighbors-6 { color: #00CED1; } /* Dark turquoise */
        .neighbors-7 { color: #FF1493; } /* Deep pink */
        .neighbors-8 { color: #FFD700; } /* Gold */
      `}</style>
    </div>
  );
};

export default Minesweeper;