import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import produce from 'immer';
import monitor from './CommodoreDOS.png' //Crt monitor Img overlay


//Preset neighbour grid locations to aid living neighbour detection function (TOP,DOWN,LEFT,RIGHT,TOP-RIGHT,BOTTOM-RIGHT,TOP-LEFT,BOTTOM-LEFT)
const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1], [0, 1],
  [1, -1], [1, 0], [1, 1],
];

//Default values for Game size and speed ( Top = X || Down = Y || Speed = FPS)  
const TOP = 60; //X
const DOWN = 50; //Y
const INITIAL_SPEED = 10; //Itteration speed

//Creates Game grid based on Top(X)/Down(Y) Values
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
  const [gridBackgroundColor, setGridBackgroundColor] = useState("#000000")
  const [cellColor, setCellColor] = useState("#FFFFFF")
  const [previewGridColor, setPreviewGridColor] = useState('black')
  
  const fpsRef = useRef(0);
  const livingCellsRef = useRef(0);
  
  //App color scheme switch case
  const changeColor = (scheme) => {
    console.log(scheme)
    switch (parseInt(scheme)) {
      case (1): //black and white
        setCellColor("#FFFFFF")
        setGridBackgroundColor("#000000")
        break;
      case (2): //amber and black
        setCellColor("#FFB000")
        setGridBackgroundColor("#000000")
        break;
      case (3): //green and black
        setCellColor("#00FF00")
        setGridBackgroundColor("#000000")
        break;
      case (4): //blue and black
        setCellColor("#0000FF")
        setGridBackgroundColor("#000000")
        break;
      //add additional color schemes below 
    }
  }
  
  //Returns total count of live cells adjacent to current cell
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

  //Returns living cell count in grid
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

  //Logic to allow user to activate/deactive cells on click
  const handleBlockClick = (rowIndex, colIndex) => {
    if (!gameStart) {
      const newGrid = produce(grid, (draftGrid) => {
        if (selectedOption === 'Block') {
          draftGrid[rowIndex][colIndex] = 1;
        }
      });
      setGrid(newGrid);
    }
  };


  //Game start toggle
  const handleGameStart = () => {
    setGameStart((prevGameStart) => !prevGameStart);
  };

  //Returns grid to default state
  const handleClearGrid = () => {
    setGameStart(false);
    const newGrid = createGrid(TOP, DOWN);
    setGrid(newGrid);
    livingCellsRef.current = 0;
  };

  //Adds randomized living cells to grid 
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

  //Computes next generation of grid based on the rules of Conway's Game of Life.
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
      <img className='Monitor' src={monitor} />
      <div className="overlay"></div>
      <div className="grid-wrapper">
        <div className='grid' style={{ backgroundColor: previewGridColor }}>
          {grid.map((row, rowIndex) => (
            <div key={rowIndex} className="row">
              {row.map((col, colIndex) => (
                <div
                  key={colIndex}
                  className="block"
                  style={{
                    backgroundColor: col === 1 ? cellColor : gridBackgroundColor,
                    opacity: '1',
                  }}
                  //When user hovers over grid, highlight grid
                  onClick={() => handleBlockClick(rowIndex, colIndex)}
                  onMouseEnter={() => {
                    setPreviewGridColor(cellColor)
                  }}
                  //when mouse leaves cell, un-highlight grid
                  onMouseLeave={() => {
                    setPreviewGridColor('black')
                  }}
                ></div>
              ))}
            </div>
          ))}
        </div>

        {/*Buttons*/}
        <div className="controller-wrapper">
          <div className="buttons-wrapper">
            <button className="Button GameStartButton" style={{ "backgroundColor": cellColor, "color": gridBackgroundColor }} onClick={handleGameStart}>{gameStart ? 'Stop' : 'Start'}</button>
            <button className="Button ClearGrid" style={{ "backgroundColor": cellColor, "color": gridBackgroundColor }} onClick={handleClearGrid}>Clear</button>
            <button className="Button RandomizeGrid" style={{ "backgroundColor": cellColor, "color": gridBackgroundColor }} onClick={handleRandomizeGrid}>Randomize</button>
          </div>

          {/*Color selector & Living Cell Counter*/}
          <div className='counters-wrapper'>
            <label className="living-cells-counter" style={{ "color": cellColor }}>Living Cells: {livingCellsRef.current}</label>
            <select className="colors" style={{ "backgroundColor": cellColor, "color": gridBackgroundColor }} onChange={(e) => changeColor(e.target.value)}>
              <option value="1" >Apple II Series</option> {/*black and white*/}
              <option value="2" >Amber</option> {/*amber and black*/}
              <option value="3" >Commodore PET</option> {/*green and black*/}
              <option value="4" >Commodore 64</option> {/*blue and black*/}
            </select>
          </div>
          
          {/*Fps counter*/}
          <div className="slider-wrapper"> 
            <label className="fps-counter" style={{ "color": cellColor }}>FPS: {fpsRef.current}</label>
            <input className="computationSpeedSlider" style={{ "color": cellColor }} type="range" min="1" max="60" value={speed} onChange={(e) => setSpeed(e.target.value)} />

          </div>
        </div>
      </div>
    </div>
  );
};

export default App;


//(NOTE TO SELF) Future additions:
// -presets for users to place premade glider patterns
// -Intro to teach users how to play
// -True crt effect to grid cells


