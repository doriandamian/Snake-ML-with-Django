let canvas = document.getElementById("game");
let ctx = canvas.getContext("2d");

SPEED = 10;
APPLE_REWARD = 10;
GAME_OVER_REWARD = -100;
MOVE_REWARD = -1;

const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

let tileCount = 10;
let tileSize = canvas.width / tileCount;

class SnakePart {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

let headX = 5;
let headY = 5;
let snakeParts = [];
let tailLength = 0;
let currentDirection = DIRECTIONS.DOWN;
let score = 0;

let appleX;
let appleY;

generateApple();

function resetGame() {
  headX = 5;
  headY = 5;
  snakeParts = [];
  tailLength = 0;
  generateApple();
  score = 0;
  currentDirection = DIRECTIONS.DOWN;
}

function generateApple() {
  appleX = Math.floor(Math.random() * tileCount);
  appleY = Math.floor(Math.random() * tileCount);
  while (isAppleOnSnake()) {
    appleX = Math.floor(Math.random() * tileCount);
    appleY = Math.floor(Math.random() * tileCount);
  }
}

function isAppleOnSnake() {
  for (let part of snakeParts) {
    if (part.x === appleX && part.y === appleY) {
      return true;
    }
  }
  return appleX === headX && appleY === headY;
}

function isCollision(point) {
  if (
    point.x < 0 ||
    point.x >= tileCount ||
    point.y < 0 ||
    point.y >= tileCount
  ) {
    return true;
  }
  for (let i = 0; i < snakeParts.length; i++) {
    if (snakeParts[i].x === point.x && snakeParts[i].y === point.y) {
      return true;
    }
  }
  return false;
}

function clearScreen() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawApple() {
  ctx.fillStyle = "red";
  ctx.fillRect(appleX * tileSize, appleY * tileSize, tileSize, tileSize);
}

function drawScore() {
  ctx.fillStyle = "white";
  ctx.font = "10px Verdana";
  ctx.fillText("Score " + score, canvas.width - 50, 10);
}

function drawSnake() {
  ctx.fillStyle = "green";
  for (let i = 0; i < snakeParts.length; i++) {
    let part = snakeParts[i];
    ctx.fillRect(part.x * tileSize, part.y * tileSize, tileSize, tileSize);
  }

  snakeParts.push(new SnakePart(headX, headY));
  while (snakeParts.length > tailLength) {
    snakeParts.shift();
  }

  ctx.fillStyle = "orange";
  ctx.fillRect(headX * tileSize, headY * tileSize, tileSize, tileSize);
}

function changeSnakePosition() {
  headX += currentDirection.x;
  headY += currentDirection.y;
}

function checkAppleCollision() {
  if (appleX === headX && appleY == headY) {
    generateApple();
    tailLength++;
    score++;
    return true;
  }
  return false;
}

function getState() {
  const head = { x: headX, y: headY };
  const pointL = {
    x: head.x + currentDirection.y,
    y: head.y - currentDirection.x,
  };
  const pointR = {
    x: head.x - currentDirection.y,
    y: head.y + currentDirection.x,
  };
  const pointF = {
    x: head.x + currentDirection.x,
    y: head.y + currentDirection.y,
  };

  const dirL = currentDirection === DIRECTIONS.LEFT;
  const dirR = currentDirection === DIRECTIONS.RIGHT;
  const dirU = currentDirection === DIRECTIONS.UP;
  const dirD = currentDirection === DIRECTIONS.DOWN;

  const state = [
    isCollision(pointF),
    isCollision(pointR),
    isCollision(pointL),
    dirL,
    dirR,
    dirU,
    dirD,
    appleX < headX, // food is left
    appleX > headX, // food is right
    appleY < headY, // food is up
    appleY > headY, // food is down
  ];

  return state;
}

function changeDirection(command) {
  clock_wise = [
    DIRECTIONS.RIGHT,
    DIRECTIONS.DOWN,
    DIRECTIONS.LEFT,
    DIRECTIONS.UP,
  ];
  index = clock_wise.indexOf(currentDirection);
  if (command == "right") {
    currentDirection = clock_wise[(index + 1) % 4];
  } else if (command == "left") {
    currentDirection = clock_wise[(index + 3) % 4];
  }
}

let socket;
const serverUrl = "ws://localhost:8765";

function connectWebSocket() {
  socket = new WebSocket(serverUrl);

  socket.onopen = function () {
    console.log("Connected to the server.");
    setTimeout(drawGame(), 2000);
  };

  socket.onmessage = function (event) {
    const data = JSON.parse(event.data);
    handleResponse(data.direction);
  };

  socket.onclose = function () {
    console.log("Connection lost. Attempting to reconnect...");
    setTimeout(connectWebSocket, 5000);
  };

  socket.onerror = function (error) {
    console.error("WebSocket Error:", error);
  };
}

connectWebSocket();

function sendState() {
  const payload = {
    state: getState(),
  };
  socket.send(JSON.stringify(payload));
}

function sendFeedback(reward, done) {
  const feedback = {
    reward: reward,
    done: done,
    score: score,
    state: getState(),
  };
  socket.send(JSON.stringify(feedback));
}

function handleResponse(direction) {
  changeDirection(direction);

  changeSnakePosition();

  let over = isCollision({ x: headX, y: headY });
  let appleCollision = checkAppleCollision();
  if (over == false) {
    if (appleCollision == true) {
      sendFeedback(APPLE_REWARD, false);
    } else {
      sendFeedback(MOVE_REWARD, false);
    }
  } else if (over == true) {
    sendFeedback(GAME_OVER_REWARD, true);
    resetGame();
  }

  clearScreen();

  drawApple();
  drawSnake();
  drawScore();

  setTimeout(drawGame, 1000 / SPEED);
}

function drawGame() {
  sendState();
}
