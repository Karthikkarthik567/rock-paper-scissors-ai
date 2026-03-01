// ================== ELEMENTS ==================
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const gestureText = document.getElementById("gesture");
const aiMoveText = document.getElementById("aiMove");
const userScoreText = document.getElementById("userScore");
const aiScoreText = document.getElementById("aiScore");
const startBtn = document.getElementById("startBtn");
const countdownText = document.getElementById("countdown");
const resultText = document.getElementById("result");
const aiDisplay = document.getElementById("aiDisplay");

const roundSelect = document.getElementById("roundSelect");
const currentRoundText = document.getElementById("currentRound");
const maxRoundsText = document.getElementById("maxRounds");

// ================== GAME STATE ==================
let userMove = "";
let userScore = 0;
let aiScore = 0;
let currentRound = 1;
let maxRounds = parseInt(roundSelect.value);
let gameOver = false;

maxRoundsText.innerText = maxRounds;

// ================== CAMERA ==================
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480 }
    });
    video.srcObject = stream;
    await video.play();
  } catch (err) {
    alert("Camera access denied or not working.");
    console.error(err);
  }
}
startCamera();

function resizeCanvas() {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
}
video.addEventListener("loadedmetadata", resizeCanvas);

// ================== MEDIAPIPE ==================
const hands = new Hands({
  locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});
hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7
});

hands.onResults(results => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

  if (results.multiHandLandmarks.length > 0) {
    const landmarks = results.multiHandLandmarks[0];
    drawConnectors(ctx, landmarks, HAND_CONNECTIONS, { color: "#00FF00", lineWidth: 3 });
    drawLandmarks(ctx, landmarks, { color: "#FF0000", lineWidth: 2 });
    detectGesture(landmarks);
  } else {
    userMove = "";
    gestureText.innerText = "Show Rock / Paper / Scissors";
  }
});

async function detectionLoop() {
  await hands.send({ image: video });
  requestAnimationFrame(detectionLoop);
}
video.addEventListener("playing", detectionLoop);

// ================== GESTURE DETECTION ==================
function detectGesture(landmarks) {
  const thumb = landmarks[4].x < landmarks[3].x;
  const index = landmarks[8].y < landmarks[6].y;
  const middle = landmarks[12].y < landmarks[10].y;
  const ring = landmarks[16].y < landmarks[14].y;
  const pinky = landmarks[20].y < landmarks[18].y;

  const openFingers = [index, middle, ring, pinky].filter(v => v).length;

  if (openFingers === 0) userMove = "rock";
  else if (openFingers === 4) userMove = "paper";
  else if (index && middle && !ring && !pinky) userMove = "scissors";
  else userMove = "";

  gestureText.innerText = userMove ? `Your Move: ${userMove.toUpperCase()}` : "Show Rock / Paper / Scissors";
}

// ================== START ROUND ==================
startBtn.addEventListener("click", () => {
  if (gameOver) return;
  if (!userMove) return alert("Show a clear gesture first!");
  startCountdown();
});

// ================== COUNTDOWN ==================
function startCountdown() {
  let count = 3;
  countdownText.innerText = count;
  resultText.innerText = "";
  aiDisplay.innerText = "❔";

  const timer = setInterval(() => {
    count--;
    countdownText.innerText = count > 0 ? count : "SHOW!";
    if (count < 0) {
      clearInterval(timer);
      revealMoves();
    }
  }, 800);
}

// ================== AI MOVE ==================
function revealMoves() {
  const moves = ["rock", "paper", "scissors"];
  const aiMove = moves[Math.floor(Math.random() * 3)];
  const emojiMap = { rock: "🪨", paper: "📄", scissors: "✂️" };
  aiDisplay.innerText = emojiMap[aiMove];
  evaluateRound(aiMove);
}

// ================== EVALUATE ROUND ==================
function evaluateRound(aiMove) {
  if (userMove === aiMove) resultText.innerText = "Draw 🤝";
  else if (
    (userMove === "rock" && aiMove === "scissors") ||
    (userMove === "paper" && aiMove === "rock") ||
    (userMove === "scissors" && aiMove === "paper")
  ) {
    userScore++;
    resultText.innerText = "You Win 🎉";
  } else {
    aiScore++;
    resultText.innerText = "Computer Wins 🤖";
  }

  // Increment round AFTER evaluating the winner
  currentRound++;
  userScoreText.innerText = userScore;
  aiScoreText.innerText = aiScore;
  currentRoundText.innerText = currentRound - 1; // display actual round

  checkGameEnd();
}

// ================== CHECK GAME END ==================
function checkGameEnd() {
  const needed = Math.ceil(maxRounds / 2);

  // Stop if someone reaches needed wins OR all rounds played
  if (userScore === needed || aiScore === needed || currentRound > maxRounds) {
    gameOver = true;
    announceWinner();
  }
}

// ================== ANNOUNCE WINNER ==================
function announceWinner() {
  if (userScore > aiScore) resultText.innerText = "🎉 CONGRATULATIONS! YOU WON THE GAME!";
  else if (aiScore > userScore) resultText.innerText = "💀 COMPUTER WON THE GAME!";
  else resultText.innerText = "😐 GAME TIED!";

  countdownText.innerText = "GAME OVER";
  startBtn.innerText = "Play Again";
  startBtn.onclick = resetGame;
}

// ================== RESET GAME ==================
function resetGame() {
  userScore = 0;
  aiScore = 0;
  currentRound = 1;
  gameOver = false;

  userScoreText.innerText = 0;
  aiScoreText.innerText = 0;
  currentRoundText.innerText = 1;
  resultText.innerText = "";
  countdownText.innerText = "Press Start";
  aiDisplay.innerText = "❔";
  gestureText.innerText = "Show Rock / Paper / Scissors";

  startBtn.innerText = "Start Round";

  // Update maxRounds in case user changed selection
  maxRounds = parseInt(roundSelect.value);
  maxRoundsText.innerText = maxRounds;
}