import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import produce from 'immer';
import video from './video.webm'

const directions = [
  [-1, -1], // top left
  [-1, 0], // top
  [-1, 1], // top right
  [0, -1], // left
  [0, 1], // right
  [1, -1], // bottom left
  [1, 0], // bottom
  [1, 1], // bottom right
];

function App() {
  const top = 60;
  const down = 50;
  const initialSpeed = 5;

  const countLiveNeighbors = useCallback((currentGrid, row, col) => {
    let neighborCount = 0;

    for (let i = 0; i < directions.length; i++) {
      const [dx, dy] = directions[i];
      let newRow = row + dx;
      let newCol = col + dy;

      // Wrap around if the neighbor is out of bounds
      if (newRow < 0) newRow = down - 1;
      if (newRow >= down) newRow = 0;
      if (newCol < 0) newCol = top - 1;
      if (newCol >= top) newCol = 0;

      if (currentGrid[newRow][newCol] === 1) {
        neighborCount++;
      }
    }

    return neighborCount;
  }, [down, top]);

  const countLivingCells = useCallback((currentGrid) => {
    let count = 0;

    for (let row = 0; row < down; row++) {
      for (let col = 0; col < top; col++) {
        if (currentGrid[row][col] === 1) {
          count++;
        }
      }
    }

    return count;
  }, [down, top]);

  const [speed, setSpeed] = useState(initialSpeed);
  const [grid, setGrid] = useState(() => createGrid(top, down));
  const [gameStart, setGameStart] = useState(false);

  const fpsRef = useRef(0);
  const livingCellsRef = useRef(0);

  function createGrid(width, height) {
    const grid = [];

    for (let row = 0; row < height; row++) {
      const rowArray = [];
      for (let col = 0; col < width; col++) {
        rowArray.push(0); // Change this line to customize the initial value of each cell
      }
      grid.push(rowArray);
    }

    return grid;
  }

  const handleBlockClick = (rowIndex, colIndex) => {
    if (!gameStart) {
      const newGrid = produce(grid, (draftGrid) => {
        draftGrid[rowIndex][colIndex] = 1 - draftGrid[rowIndex][colIndex];
      });
      setGrid(newGrid);
    }
  };

  const handleGameStart = () => {
    setGameStart((prevGameStart) => !prevGameStart);
  };

  const handleClearGrid = () => {
    if (!gameStart) {
      const newGrid = createGrid(top, down);
      setGrid(newGrid);
      livingCellsRef.current = 0;
    }
  };

  const handleRandomizeGrid = () => {
    if (!gameStart) {
      const newGrid = produce(grid, (draftGrid) => {
        for (let row = 0; row < down; row++) {
          for (let col = 0; col < top; col++) {
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
      for (let row = 0; row < down; row++) {
        for (let col = 0; col < top; col++) {
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
  }, [countLiveNeighbors, down, top]);

  const updateFPS = useCallback(() => {
    fpsRef.current = Math.round((speed));
  }, [speed]);

  const updateLivingCells = useCallback(() => {
    livingCellsRef.current = countLivingCells(grid);
  }, [countLivingCells, grid]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (gameStart) {
        setGrid((prevGrid) => computeNextGeneration(prevGrid));
      }
    }, (1000 / speed));

    return () => clearInterval(interval);
  }, [computeNextGeneration, gameStart, speed]);

  useEffect(() => {
    updateFPS();
    updateLivingCells();
  }, [updateFPS, updateLivingCells]);

  
  return (
    <div className="body">
      <div className="grid">
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className="row">
            {row.map((col, colIndex) => (
              <div
                key={colIndex}
                className="block"
                style={{
                  width: '10px',
                  height: '10px',
                  backgroundColor: col === 1 ? 'black' : 'white',
                }}
                onClick={() => handleBlockClick(rowIndex, colIndex)}
              ></div>
            ))}
          </div>
        ))}
        <div className="controller-wrapper">
          <div className="slider-wrapper">
            Speed
            <input
              type="range"
              className="computationSpeedSlider"
              min={1}
              max={25}
              value={speed}
              onChange={(e) => setSpeed(parseInt(e.target.value))}
            />
          </div>
          <div className="info-wrapper">
            <div className="fps-counter">FPS: {fpsRef.current}</div>
            <div className="living-cells-counter">Living Cells: {livingCellsRef.current}</div>
          </div>
          <div className="buttons-wrapper">
            <button className="ClearGrid" onClick={handleClearGrid}>
              Clear
            </button>
            <button className="RandomizeGrid" onClick={handleRandomizeGrid}>
              Randomize
            </button>
            <button className="GameStartButton" onClick={handleGameStart}>
              {gameStart ? 'Stop' : 'Start'}
            </button>
          </div>
          
        </div>
        <video id="transparentVideo" autoPlay loop src={video} muted>
        </video>
      </div>
    </div>
  );
}

export default App;
