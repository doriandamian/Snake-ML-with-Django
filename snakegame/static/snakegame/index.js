let canvas = document.getElementById("game");
let ctx = canvas.getContext("2d");
// draw on the screen to get the context, ask canvas  to get the 2d context

// snake axis
class SnakePart {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}
// speed of the game
let speed = 7;
// size and count of a tile
let tileCount = 20;
let tileSize = canvas.width / tileCount - 2;
// head of the snake
let headX = 10;
let headY = 10;
let snakeParts = [];
let tailLength = 2;
// apple size
let appleX = 5;
let appleY = 5;
// movement
let inputsXVelocity = 0;
let inputsYVelocity = 0;

let xVelocity = 0;
let yVelocity = 0;

let score = 0;

//game loop
function drawGame() {
  xVelocity = inputsXVelocity;
  yVelocity = inputsYVelocity;

  changeSnakePosition();
  let result = isGameOver();
  if (result) {
    return;
  }

  clearScreen();

  checkAppleCollision();
  drawApple();
  drawSnake();

  drawScore();

  if (score > 5) {
    speed = 9;
  }
  if (score > 10) {
    speed = 11;
  }

  setTimeout(drawGame, 1000 / speed);
}

function isGameOver() {
  let gameOver = false;

  if (yVelocity === 0 && xVelocity === 0) {
    return false;
  }

  //walls
  if (headX < 0) {
    gameOver = true;
  } else if (headX === tileCount) {
    gameOver = true;
  } else if (headY < 0) {
    gameOver = true;
  } else if (headY === tileCount) {
    gameOver = true;
  }

  for (let i = 0; i < snakeParts.length; i++) {
    let part = snakeParts[i];
    if (part.x === headX && part.y === headY) {
      gameOver = true;
      break;
    }
  }

  if (gameOver) {
    ctx.fillStyle = "white";
    ctx.font = "50px Verdana";

    if (gameOver) {
      ctx.fillStyle = "white";
      ctx.font = "50px Verdana";

      var gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop("0", " magenta");
      gradient.addColorStop("0.5", "blue");
      gradient.addColorStop("1.0", "red");
      // Fill with gradient
      ctx.fillStyle = gradient;

      ctx.fillText("Game Over!", canvas.width / 6.5, canvas.height / 2);
    }

    ctx.fillText("Game Over!", canvas.width / 6.5, canvas.height / 2);
  }

  return gameOver;
}

function drawScore() {
  ctx.fillStyle = "white";
  ctx.font = "10px Verdana";
  ctx.fillText("Score " + score, canvas.width - 50, 10);
}

function clearScreen() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawSnake() {
  ctx.fillStyle = "green";
  for (let i = 0; i < snakeParts.length; i++) {
    let part = snakeParts[i];
    ctx.fillRect(part.x * tileCount, part.y * tileCount, tileSize, tileSize);
  }

  snakeParts.push(new SnakePart(headX, headY)); //put an item at the end of the list next to the head
  while (snakeParts.length > tailLength) {
    snakeParts.shift(); // remove the furthet item from the snake parts if have more than our tail size.
  }

  ctx.fillStyle = "orange";
  ctx.fillRect(headX * tileCount, headY * tileCount, tileSize, tileSize);
}

function changeSnakePosition() {
  headX = headX + xVelocity;
  headY = headY + yVelocity;
}

function drawApple() {
  ctx.fillStyle = "red";
  ctx.fillRect(appleX * tileCount, appleY * tileCount, tileSize, tileSize);
}

function checkAppleCollision() {
  if (appleX === headX && appleY == headY) {
    appleX = Math.floor(Math.random() * tileCount);
    appleY = Math.floor(Math.random() * tileCount);
    tailLength++;
    score++;
  }
}

function changeInputsVelocity(direction) {
  switch (direction) {
    case "UP": {
      inputsYVelocity = -1;
      inputsXVelocity = 0;
      break;
    }
    case "DOWN": {
      inputsYVelocity = 1;
      inputsXVelocity = 0;
      break;
    }
    case "LEFT": {
      inputsYVelocity = 0;
      inputsXVelocity = -1;
      break;
    }
    case "RIGHT": {
      inputsYVelocity = 0;
      inputsXVelocity = 1;
      break;
    }
    default:
      console.log("Invalid direction received!");
      break;
  }
}

document.body.addEventListener("keydown", keyDown);

function keyDown(event) {
  //up
  if (event.keyCode == 38 || event.keyCode == 87) {
    //87 is w
    if (inputsYVelocity == 1) return;
    changeInputsVelocity("UP");
  }

  //down
  if (event.keyCode == 40 || event.keyCode == 83) {
    // 83 is s
    if (inputsYVelocity == -1) return;
    changeInputsVelocity("DOWN");
  }

  //left
  if (event.keyCode == 37 || event.keyCode == 65) {
    // 65 is a
    if (inputsXVelocity == 1) return;
    changeInputsVelocity("LEFT");
  }

  //right
  if (event.keyCode == 39 || event.keyCode == 68) {
    //68 is d
    if (inputsXVelocity == -1) return;
    changeInputsVelocity("RIGHT");
  }
}

const socket = new WebSocket("ws://localhost:8765");

// Connection opened
socket.addEventListener("open", () => {
  console.log("Connected to server");
});

socket.addEventListener("message", (event) => {
  console.log(`Server Response: ${event.data} !`);
  const data = JSON.parse(event.data);

  switch (data.direction) {
    case "up": {
      changeInputsVelocity("UP");
      console.log("Snake moves: UP");
      break;
    }

    case "down": {
      changeInputsVelocity("DOWN");
      console.log("Snake moves: DOWN");
      break;
    }

    case "left": {
      changeInputsVelocity("LEFT");
      console.log("Snake moves: LEFT");
      break;
    }

    case "right": {
      changeInputsVelocity("RIGHT");
      console.log("Snake moves: RIGHT");
      break;
    }
  }
});

function sendData() {
  const payload = {
    name: "Dorian",
    message: "This is a test message",
  };

  socket.send(JSON.stringify(payload));
  console.log(`<>Sent: Name: ${payload.name}, Message: "${payload.message}"`);
}

// Connection closed
socket.addEventListener("close", () => {
  console.log("Disconnected from server");
});

// Handle errors
socket.addEventListener("error", (error) => {
  console.log(`Error: ${error}`);
});

drawGame();
