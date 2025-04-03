'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

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
  const [touchTimer, setTouchTimer] = useState<TouchTimer>({ 
    timerId: null, 
    touchStartTime: 0
  });
  const longPressHandledRef = useRef(false);
  const lastTouchTimeRef = useRef(0);
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
  const initializeBoard = useCallback(() => {
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
  }, [boardSize.rows, boardSize.cols, mineCount, intervalId]);
  
  // Reveal a cell
  const revealCell = useCallback((row: number, col: number) => {
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

    // Start timer only on first non-mine click if there's no timer running already
    if (gameState === 'waiting' && !intervalId) {
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
  }, [board, gameState, boardSize.rows, boardSize.cols, intervalId]);
  
  // Toggle flag on a cell
  const toggleFlag = useCallback((row: number, col: number) => {
    if (gameState !== 'playing' && gameState !== 'waiting') return;
    
    // Start the game if it's the first action
    if (gameState === 'waiting') {
      setGameState('playing');
      
      // Start timer on first flag placement only if there's no timer running already
      if (!intervalId) {
        const newIntervalId = setInterval(() => {
          setTimer(prevTimer => prevTimer + 1);
        }, 1000);
        setIntervalId(newIntervalId);
      }
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
  }, [board, gameState, flagCount, mineCount, intervalId, boardSize.rows, boardSize.cols]);
  
  // Reveal adjacent cells when right-clicking a revealed number
  const chordReveal = useCallback((row: number, col: number) => {
    if (gameState !== 'playing') return;

    const newBoard = [...board];
    const cell = newBoard[row][col];

    if (!cell.isRevealed) return;

    // Process chord reveal: reveal all adjacent non-flagged cells regardless of flag count
    const neighborsToProcess = [];
    let shouldLoseGame = false;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const newRow = row + i;
        const newCol = col + j;
        if (newRow >= 0 && newRow < boardSize.rows && newCol >= 0 && newCol < boardSize.cols) {
          const neighbor = newBoard[newRow][newCol];
          if (!neighbor.isFlagged && !neighbor.isRevealed) {
            neighborsToProcess.push({ row: newRow, col: newCol });
            if (neighbor.isMine) {
              shouldLoseGame = true;
            }
          }
        }
      }
    }

    if (shouldLoseGame) {
      // Reveal all mines and end game
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

    for (const neighbor of neighborsToProcess) {
      revealCell(neighbor.row, neighbor.col);
    }
  }, [board, gameState, boardSize.rows, boardSize.cols, revealCell, intervalId]);
  
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
    
    // Ensure timer is stopped when game is won or lost
    if (gameState === 'won' || gameState === 'lost') {
      if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
    }
  }, [boardSize, mineCount, gameState, initializeBoard, intervalId]);
  
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
    longPressHandledRef.current = false; // Reset ref
    const startTime = Date.now(); // Store start time locally

    const timer = setTimeout(() => {
      // Long press detected
      const cell = board[row][col];
      if (cell.isRevealed && cell.neighborMines > 0) {
        // If revealed and has neighbors, do chord reveal
        chordReveal(row, col);
      } else if (!cell.isRevealed) {
        // If not revealed, toggle flag
        toggleFlag(row, col);
        setIsFlashing(true);
        setTimeout(() => setIsFlashing(false), 200);
      }
      longPressHandledRef.current = true;
    }, 500);

    setTouchTimer({
      timerId: timer,
      touchStartTime: startTime
    });
  }, [board, toggleFlag, chordReveal, setIsFlashing]);

  // Handle touch end
  const handleTouchEnd = useCallback((row: number, col: number) => {
    if (touchTimer.timerId) {
      clearTimeout(touchTimer.timerId);
    }

    if (longPressHandledRef.current) {
      longPressHandledRef.current = false;
    } else {
      if (touchTimer.touchStartTime > 0 && Date.now() - touchTimer.touchStartTime < 500) {
        const cell = board[row][col];
        if (!cell.isFlagged) {
          revealCell(row, col);
        }
      }
    }

    setTouchTimer({ timerId: null, touchStartTime: 0 });
    lastTouchTimeRef.current = Date.now();
  }, [board, touchTimer, revealCell]);

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
        onClick={() => { 
          // If a touch event occurred recently, ignore the click
          if (Date.now() - lastTouchTimeRef.current < 500) {
            return;
          }
          revealCell(row, col);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          if (cell.isRevealed && cell.neighborMines > 0) {
            chordReveal(row, col);
          } else {
            toggleFlag(row, col);
          }
        }}
        onTouchStart={() => handleTouchStart(row, col)}
        onTouchEnd={() => handleTouchEnd(row, col)}
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
          <p>👆 Tap to reveal</p>
          <p>🚩 Hold to flag/unflag</p>
          <p>🔢 Hold on numbers to reveal neighbors</p>
          <p>🖱️ Right-click to flag on desktop</p>
        </div>
      </div>

      <button 
        className="theme-toggle"
        onClick={toggleTheme}
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        <span className="theme-toggle-icon">
          {theme === 'light' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          )}
        </span>
      </button>
    </>
  );
};

export default Minesweeper;