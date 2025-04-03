'use client';

import React, { useState, useEffect, useCallback } from 'react';

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

interface TouchTimer {
  timerId: NodeJS.Timeout | null;
  touchStartTime: number;
}

const Minesweeper = () => {
  const [boardSize, setBoardSize] = useState<BoardSize>({ rows: 10, cols: 10 });
  const [mineCount, setMineCount] = useState(15);
  const [board, setBoard] = useState<Cell[][]>([]);
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'won' | 'lost'>('waiting');
  const [flagCount, setFlagCount] = useState(0);
  const [timer, setTimer] = useState(0);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [touchTimer, setTouchTimer] = useState<TouchTimer>({ timerId: null, touchStartTime: 0 });
  const [isFlagMode, setIsFlagMode] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  
  // Initialize theme
  useEffect(() => {
    // Check if user has a saved preference
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }
  }, []);

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

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

    // Start timer only on first non-mine click
    if (gameState === 'waiting') {
      const newIntervalId = setInterval(() => {
        setTimer(prevTimer => prevTimer + 1);
      }, 1000);
      setIntervalId(newIntervalId);
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
        // Add flash effect
        setIsFlashing(true);
        setTimeout(() => setIsFlashing(false), 300);
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
  
  // Reveal adjacent cells when right-clicking a revealed number
  const chordReveal = (row: number, col: number) => {
    if (gameState !== 'playing') return;

    const cell = board[row][col];
    if (!cell.isRevealed || cell.neighborMines === 0) return;

    // Count adjacent flags
    let adjacentFlags = 0;
    const adjacentCells: { row: number; col: number }[] = [];

    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i === 0 && j === 0) continue;
        
        const newRow = row + i;
        const newCol = col + j;
        
        if (newRow >= 0 && newRow < boardSize.rows && 
            newCol >= 0 && newCol < boardSize.cols) {
          if (board[newRow][newCol].isFlagged) {
            adjacentFlags++;
          }
          adjacentCells.push({ row: newRow, col: newCol });
        }
      }
    }

    // Only reveal if the number of adjacent flags matches the number
    if (adjacentFlags === cell.neighborMines) {
      const newBoard = [...board];
      let hitMine = false;

      // Reveal all non-flagged adjacent cells
      adjacentCells.forEach(({row: r, col: c}) => {
        const adjacentCell = newBoard[r][c];
        if (!adjacentCell.isFlagged && !adjacentCell.isRevealed) {
          if (adjacentCell.isMine) {
            hitMine = true;
            // Reveal all mines if we hit one
            for (let row = 0; row < boardSize.rows; row++) {
              for (let col = 0; col < boardSize.cols; col++) {
                if (newBoard[row][col].isMine) {
                  newBoard[row][col].isRevealed = true;
                }
              }
            }
          } else {
            // Recursively reveal empty cells
            if (adjacentCell.neighborMines === 0) {
              revealCell(r, c);
            } else {
              adjacentCell.isRevealed = true;
            }
          }
        }
      });

      if (hitMine) {
        if (intervalId) {
          clearInterval(intervalId);
          setIntervalId(null);
        }
        setGameState('lost');
      }
      
      setBoard([...newBoard]);
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
  
  // Handle touch start
  const handleTouchStart = useCallback((row: number, col: number) => {
    const timer = setTimeout(() => {
      // Long press detected - toggle flag
      toggleFlag(row, col);
    }, 500); // 500ms for long press

    setTouchTimer({
      timerId: timer,
      touchStartTime: Date.now()
    });
  }, [toggleFlag]);

  // Handle touch end
  const handleTouchEnd = useCallback((row: number, col: number) => {
    if (touchTimer.timerId) {
      clearTimeout(touchTimer.timerId);
      
      // If the touch was short (less than 500ms), treat it as a reveal
      if (Date.now() - touchTimer.touchStartTime < 500) {
        if (isFlagMode) {
          toggleFlag(row, col);
        } else {
          revealCell(row, col);
        }
      }
    }
    
    setTouchTimer({ timerId: null, touchStartTime: 0 });
  }, [touchTimer, isFlagMode, toggleFlag, revealCell]);

  // Handle touch move (cancel if moved)
  const handleTouchMove = useCallback(() => {
    if (touchTimer.timerId) {
      clearTimeout(touchTimer.timerId);
      setTouchTimer({ timerId: null, touchStartTime: 0 });
    }
  }, [touchTimer]);

  // Memoize toggleFlag and revealCell to prevent unnecessary re-renders
  const memoizedToggleFlag = useCallback((row: number, col: number) => {
    toggleFlag(row, col);
  }, [toggleFlag]);

  const memoizedRevealCell = useCallback((row: number, col: number) => {
    revealCell(row, col);
  }, [revealCell]);

  // Cell rendering with touch support
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
        onClick={() => isFlagMode ? memoizedToggleFlag(row, col) : memoizedRevealCell(row, col)}
        onContextMenu={(e) => {
          e.preventDefault();
          if (cell.isRevealed && cell.neighborMines > 0) {
            chordReveal(row, col);
          } else {
            memoizedToggleFlag(row, col);
          }
        }}
        onTouchStart={() => handleTouchStart(row, col)}
        onTouchEnd={() => handleTouchEnd(row, col)}
        onTouchMove={handleTouchMove}
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
    <>
      <div className={`minesweeper ${isFlashing ? 'flag-flash' : ''}`}>
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
        
        <button 
          className={`flag-mode-toggle ${isFlagMode ? 'active' : ''}`}
          onClick={() => setIsFlagMode(!isFlagMode)}
          title={`${isFlagMode ? 'Reveal' : 'Flag'} mode`}
        >
          {isFlagMode ? '👆 Reveal Mode' : '🚩 Flag Mode'}
        </button>
        
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
            gridTemplateRows: `repeat(${boardSize.rows}, minmax(30px, 40px))`,
            gridTemplateColumns: `repeat(${boardSize.cols}, minmax(30px, 40px))`
          }}
        >
          {board.map((row, rowIndex) => (
            row.map((cell, colIndex) => renderCell(cell, rowIndex, colIndex))
          ))}
        </div>
        
        <div className="instructions">
          <p>👆 Tap to reveal • Hold to flag</p>
          <p>🖱️ Click to reveal • Right-click to flag</p>
          <p>🔢 Numbers show nearby mines</p>
          <p>🚩 Use flag mode for easier flagging</p>
        </div>
      </div>

      <button 
        className="theme-toggle"
        onClick={toggleTheme}
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        <span className="theme-toggle-icon">
          {theme === 'light' ? '🌙' : '☀️'}
        </span>
        <span className="theme-toggle-text">
          {theme === 'light' ? 'Dark' : 'Light'} mode
        </span>
      </button>
    </>
  );
};

export default Minesweeper;