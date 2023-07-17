import './App.css';
import { useState, useEffect } from 'react';

function App() {
  const top = 60;
  const down = 50;

  const [speed, setSpeed] = useState(1000)

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

  const [grid,setGrid] = useState(() => createGrid(top,down))
  const [gameStart, setGameStart] = useState(false)


  const handleBlockClick = (rowIndex, colIndex) => {
    const newGrid = [...grid]; // Create a copy of the grid array

    // Update the value at the clicked cell
    newGrid[rowIndex][colIndex] = 1 - newGrid[rowIndex][colIndex];

    setGrid(newGrid); // Update the state with the new grid
  };

  function handleGameStart(){
    if(!gameStart){
      setGameStart(true)
    }else{
      setGameStart(false)
    }
  }

  useEffect(() => {
    if (gameStart) {
      const interval = setInterval(() => {
        setGrid((prevGrid) => computeNextGeneration(prevGrid));
      }, speed);

      return () => clearInterval(interval);
    }
  }, [gameStart,speed]);

  const computeNextGeneration = (currentGrid) => {
    let newGrid = []
    for (let row = 0; row < down; row++){
      let newRow = [];
      for(let col = 0; col < top; col++){
        let currCell = currentGrid[row][col];
        const neightbors = countLiveNeighbors(currentGrid, row, col);
        let newCell = 0
        if(currCell === 1  && (neightbors === 2 || neightbors === 4) ){
          newCell = 1
        }else if(currCell === 0 && neightbors === 3){
          newCell = 1
        }
        newRow.push(newCell)
      }
      newGrid.push(newRow)
    }
    return newGrid
  }

  const countLiveNeighbors = (currentGrid, row, col) => {
    const directions = [
      [-1,-1],  // top left   
      [-1, 0],  // top
      [-1 ,1],  // top right
      [0, -1],  // left 
      [0 , 1],  // right
      [1 ,-1],  // bottom left
      [1 , 0],  // bottom 
      [1,  1],  // bottom right
    ]

    let neighborCount = 0

    for(let i=0; i<directions.length; i++){ 
      const [dx,dy] = directions[i]
      const newRow = row + dx
      const newCol = col + dy
      if(
        newCol >= 0    &&
        newCol < top  &&
        newRow >= 0    && 
        newRow < down  &&
        currentGrid[newRow][newCol] === 1
      ){
        neighborCount++
      }
    }
    return neighborCount
  }

  function updateValue(range,currentValue) {
    // Get the maximum and minimum values of the range
    let max = range[0]
    let min = range[1]

    // Calculate the inverse scale
    let inverseValue = max - (currentValue - min);
  
    // Update the displayed value
    return inverseValue
  }

  console.table(grid)

  return (
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
                backgroundColor: col === 0 ? 'black' : 'white',
              }}
              onClick={() =>!gameStart ?  handleBlockClick(rowIndex, colIndex) : null}
            ></div>
          ))}
        </div>
      ))}
      <input type='range' className='computationSpeedSlider' min={10} max={1000} value={speed} onChange={(e) => setSpeed(e.target.value)}/>
      <button className='GameStartButton' onClick={() => handleGameStart()}>{gameStart === true ? 'stop' : 'start' }</button>
    </div>
  );
}

export default App;
