import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import produce from 'immer';


const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1], [0, 1],
  [1, -1], [1, 0], [1, 1],
];

const GLIDER_PATTERN = [
  [0, 1, 0],
  [0, 0, 1],
  [1, 1, 1],
];

const TOP = 60;
const DOWN = 50;
const INITIAL_SPEED = 5;

const createGrid = (width, height) => {
  const grid = [];
  for (let row = 0; row < height; row++) {
    const rowArray = [];
    for (let col = 0; col < width; col++) {
      rowArray.push(0);
    }
    grid.push(rowArray);
  }
  return grid;
};

const App = () => {
  const [selectedOption, setSelectedOption] = useState('Block');
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [grid, setGrid] = useState(() => createGrid(TOP, DOWN));
  const [gameStart, setGameStart] = useState(false);
  const [gliderPreviewRow, setGliderPreviewRow] = useState(null);
  const [gliderPreviewCol, setGliderPreviewCol] = useState(null);
  const [singleBlockPreview, setSingleBlockPreview] = useState({ rowIndex: null, colIndex: null });

  const fpsRef = useRef(0);
  const livingCellsRef = useRef(0);

  const countLiveNeighbors = useCallback((currentGrid, row, col) => {
    let neighborCount = 0;
    for (let i = 0; i < DIRECTIONS.length; i++) {
      const [dx, dy] = DIRECTIONS[i];
      let newRow = row + dx;
      let newCol = col + dy;
      if (newRow < 0) newRow = DOWN - 1;
      if (newRow >= DOWN) newRow = 0;
      if (newCol < 0) newCol = TOP - 1;
      if (newCol >= TOP) newCol = 0;
      if (currentGrid[newRow][newCol] === 1) {
        neighborCount++;
      }
    }
    return neighborCount;
  }, [DOWN, TOP]);

  const countLivingCells = useCallback((currentGrid) => {
    let count = 0;
    for (let row = 0; row < DOWN; row++) {
      for (let col = 0; col < TOP; col++) {
        if (currentGrid[row][col] === 1) {
          count++;
        }
      }
    }
    return count;
  }, [DOWN, TOP]);

  const handleBlockClick = (rowIndex, colIndex) => {
    if (!gameStart) {
      const newGrid = produce(grid, (draftGrid) => {
        if (selectedOption === 'Glider') {
          for (let i = 0; i < GLIDER_PATTERN.length; i++) {
            for (let j = 0; j < GLIDER_PATTERN[i].length; j++) {
              draftGrid[rowIndex + i][colIndex + j] = selectedOption === 'Glider' ? GLIDER_PATTERN[i][j] : 1 - draftGrid[rowIndex + i][colIndex + j];
            }
          }
        } else if (selectedOption === 'Block') {
          draftGrid[rowIndex][colIndex] = 1;
        }
      });
      setGrid(newGrid);
    }
  };

  const handleBlockHover = (rowIndex, colIndex) => {
    if (!gameStart) {
      if (selectedOption === 'Block') {
        setSingleBlockPreview({ row: rowIndex, col: colIndex });
        setGliderPreviewRow(null);
        setGliderPreviewCol(null);
      } else if (selectedOption === 'Glider') {
        setGliderPreviewRow(rowIndex);
        setGliderPreviewCol(colIndex);
      }
    }
  };

  const handleBlockLeave = () => {
    if (!gameStart) {
      setGliderPreviewRow(null);
      setGliderPreviewCol(null);
    }
  };

  const handleGameStart = () => {
    setGameStart((prevGameStart) => !prevGameStart);
  };

  const handleClearGrid = () => {
    setGameStart(false);
    const newGrid = createGrid(TOP, DOWN);
    setGrid(newGrid);
    livingCellsRef.current = 0;
  };

  const handleRandomizeGrid = () => {
    if (!gameStart) {
      const newGrid = produce(grid, (draftGrid) => {
        for (let row = 0; row < DOWN; row++) {
          for (let col = 0; col < TOP; col++) {
            draftGrid[row][col] = Math.random() > 0.7 ? 1 : 0;
          }
        }
      });
      setGrid(newGrid);
      livingCellsRef.current = countLivingCells(newGrid);
    }
  };

  const computeNextGeneration = useCallback((currentGrid) => {
    const newGrid = produce(currentGrid, (draftGrid) => {
      for (let row = 0; row < DOWN; row++) {
        for (let col = 0; col < TOP; col++) {
          let currCell = currentGrid[row][col];
          const neighbors = countLiveNeighbors(currentGrid, row, col);
          let newCell = 0;
          if (currCell === 1 && (neighbors === 2 || neighbors === 3)) {
            newCell = 1;
          } else if (currCell === 0 && neighbors === 3) {
            newCell = 1;
          }
          draftGrid[row][col] = newCell;
        }
      }
    });
    return newGrid;
  }, [countLiveNeighbors, DOWN, TOP]);

  const updateFPS = useCallback(() => {
    fpsRef.current = Math.round(speed);
  }, [speed]);

  const updateLivingCells = useCallback(() => {
    livingCellsRef.current = countLivingCells(grid);
  }, [countLivingCells, grid]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (gameStart) {
        setGrid((prevGrid) => computeNextGeneration(prevGrid));
      }
    }, 1000 / speed);

    return () => clearInterval(interval);
  }, [computeNextGeneration, gameStart, speed]);

  useEffect(() => {
    updateFPS();
    updateLivingCells();
  }, [updateFPS, updateLivingCells]);

  return (
    <div className="body">
      <div className='title-wrapper'>
        <h1 className='title'>Conway's - Game Of Life</h1>
      </div>
      <div className="grid-wrapper">
        <div className='grid'>
          {grid.map((row, rowIndex) => (
            <div key={rowIndex} className="row">
              {row.map((col, colIndex) => (
                <div
                  key={colIndex}
                  className="block"
                  style={{
                    backgroundColor: col === 1 ? 'white' : 'black',
                    opacity: (gliderPreviewRow !== null &&
                      rowIndex >= gliderPreviewRow &&
                      rowIndex < gliderPreviewRow + GLIDER_PATTERN.length &&
                      colIndex >= gliderPreviewCol &&
                      colIndex < gliderPreviewCol + GLIDER_PATTERN[0].length) ||
                      (singleBlockPreview.rowIndex !== null &&
                        rowIndex === singleBlockPreview.rowIndex &&
                        colIndex === singleBlockPreview.colIndex)
                      ? '0.5'
                      : '1',
                  }}
                  onClick={() => handleBlockClick(rowIndex, colIndex)}
                  onMouseEnter={() => handleBlockHover(rowIndex, colIndex)}
                  onMouseLeave={handleBlockLeave}
                ></div>
              ))}
            </div>
          ))}
        </div>
        <div className="controller-wrapper">
          <div className="buttons-wrapper">
            <button className="Button GameStartButton" onClick={handleGameStart}>{gameStart ? 'Stop' : 'Start'}</button>
            <button className="Button ClearGrid" onClick={handleClearGrid}>Clear</button>
            <button className="Button RandomizeGrid" onClick={handleRandomizeGrid}>Randomize</button>
          </div>
          <div className='counters-wrapper'>
            <label className="living-cells-counter">Living Cells: {livingCellsRef.current}</label>
          </div>
          <div className="slider-wrapper">            
            <label className="fps-counter">FPS: {fpsRef.current}</label>
            <input className="computationSpeedSlider" type="range" min="1" max="60" value={speed} onChange={(e) => setSpeed(e.target.value)} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
