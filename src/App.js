import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import produce from 'immer';

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

  const gridRef = useRef(createClearGrid(top, down));

  function createClearGrid(width, height) {
    const grid = [];

    for (let row = 0; row < height; row++) {
      const rowArray = [];
      for (let col = 0; col < width; col++) {
        rowArray.push(0);
      }
      grid.push(rowArray);
    }

    return grid;
  }

  const [gameStart, setGameStart] = useState(false);
  const [speed, setSpeed] = useState(1); // Initial value set to 1

  const handleBlockClick = (rowIndex, colIndex) => {
    if (!gameStart) {
      const newGrid = produce(gridRef.current, (gridCopy) => {
        gridCopy[rowIndex][colIndex] = 1 - gridCopy[rowIndex][colIndex];
      });

      gridRef.current = newGrid;
      setGrid(newGrid);
    }
  };

  const handleGameStart = () => {
    setGameStart((prevGameStart) => !prevGameStart);
  };

  const handleClearGrid = () => {
    setGameStart(false);
    const newGrid = createClearGrid(top, down);
    gridRef.current = newGrid;
    setGrid(newGrid);
  };

  const handleRandomizeGrid = () => {
    if (!gameStart) {
      const newGrid = produce(gridRef.current, (gridCopy) => {
        for (let row = 0; row < down; row++) {
          for (let col = 0; col < top; col++) {
            gridCopy[row][col] = Math.random() < 0.1 ? 1 : 0;
          }
        }
      });

      gridRef.current = newGrid;
      setGrid(newGrid);
    }
  };

  const computeNextGeneration = useCallback(
    (currentGrid) => {
      return produce(currentGrid, (gridCopy) => {
        for (let row = 0; row < down; row++) {
          for (let col = 0; col < top; col++) {
            const currCell = currentGrid[row][col];
            const neighbors = countLiveNeighbors(currentGrid, row, col);

            if (currCell === 1 && (neighbors < 2 || neighbors > 3)) {
              gridCopy[row][col] = 0;
            } else if (currCell === 0 && neighbors === 3) {
              gridCopy[row][col] = 1;
            }
          }
        }
      });
    },
    [down, top]
  );

  const countLiveNeighbors = useCallback(
    (currentGrid, row, col) => {
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
    },
    [down, top]
  );

  const [grid, setGrid] = useState(gridRef.current);

  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);

  const requestRef = useRef();
  const previousTimeRef = useRef();

  const updateGrid = useCallback(
    (currentTime) => {
      if (!previousTimeRef.current) {
        previousTimeRef.current = currentTime;
      }

      const deltaTime = currentTime - previousTimeRef.current;
      const delay = 1000 / (speed * 2); // Adjust the multiplier for a slower scale

      if (deltaTime > delay) {
        setGrid((prevGrid) => {
          const newGrid = computeNextGeneration(prevGrid);
          return newGrid;
        });

        previousTimeRef.current = currentTime;
      }

      requestRef.current = requestAnimationFrame(updateGrid);
    },
    [computeNextGeneration, speed]
  );

  useEffect(() => {
    if (gameStart) {
      requestRef.current = requestAnimationFrame(updateGrid);
    } else {
      cancelAnimationFrame(requestRef.current);
      previousTimeRef.current = null;
    }

    return () => cancelAnimationFrame(requestRef.current);
  }, [gameStart, updateGrid]);

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
              max={20}
              value={speed}
              onChange={(e) => {
                setSpeed(parseInt(e.target.value, 10));
              }}
            />
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
      </div>
      <div className="options"></div>
    </div>
  );
}

export default App;
