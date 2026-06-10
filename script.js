const URL = "./my_model/";

let model, webcam, labelContainer, maxPredictions;
let lastPrediction = null;
let localModelFiles = null;
let modelFilesInput = null;
let retryPermissionBtn = null;
let webcamPermissionGranted = false;

const game = {
  board: Array(9).fill(null),
  playerSymbol: 'X',
  computerSymbol: 'O',
  over: false,
  playerScore: 0,
  computerScore: 0,
  draws: 0
};

function createBoardUI() {
  const boardEl = document.getElementById('board');
  boardEl.innerHTML = '';
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.index = i;
    cell.addEventListener('click', () => playerMove(i));
    boardEl.appendChild(cell);
  }
}

function updateBoardUI() {
  const cells = document.querySelectorAll('.cell');
  cells.forEach(c => {
    const i = Number(c.dataset.index);
    c.textContent = game.board[i] || '';
    c.classList.toggle('disabled', Boolean(game.board[i]));
  });
  document.getElementById('score').textContent = `You ${game.playerScore} - ${game.computerScore} Computer  Draws ${game.draws}`;
}

function setStatus(message) {
  document.getElementById('status').textContent = `Status: ${message}`;
}

function resetGameBoard() {
  game.board = Array(9).fill(null);
  game.over = false;
  updateBoardUI();
  setStatus('Ready for detection');
}

function checkWinnerStatic(boardArr) {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (const [a,b,c] of wins) {
    if (boardArr[a] && boardArr[a] === boardArr[b] && boardArr[a] === boardArr[c]) return boardArr[a];
  }
  return null;
}

function checkWinner() {
  return checkWinnerStatic(game.board);
}

function playerMove(index) {
  if (game.over) return;
  if (game.board[index]) return;

  game.board[index] = game.playerSymbol;
  updateBoardUI();

  const winner = checkWinner();
  if (winner) {
    game.over = true;
    if (winner === game.playerSymbol) {
      game.playerScore++;
      setStatus('You win!');
    } else {
      game.computerScore++;
      setStatus('Computer wins');
    }
    updateBoardUI();
    return;
  }

  if (game.board.every(Boolean)) {
    game.draws++;
    game.over = true;
    setStatus('Draw');
    updateBoardUI();
    return;
  }

  setStatus('Computer thinking...');
  setTimeout(computerMove, 600);
}

function computerMove() {
  if (game.over) return;
  const empty = game.board.map((v, i) => (v ? null : i)).filter(i => i !== null);

  for (const i of empty) {
    const copy = [...game.board];
    copy[i] = game.computerSymbol;
    if (checkWinnerStatic(copy) === game.computerSymbol) {
      game.board[i] = game.computerSymbol;
      finishAfterComputer();
      return;
    }
  }

  for (const i of empty) {
    const copy = [...game.board];
    copy[i] = game.playerSymbol;
    if (checkWinnerStatic(copy) === game.playerSymbol) {
      game.board[i] = game.computerSymbol;
      finishAfterComputer();
      return;
    }
  }

  if (!game.board[4]) {
    game.board[4] = game.computerSymbol;
    finishAfterComputer();
    return;
  }

  const choice = empty[Math.floor(Math.random() * empty.length)];
  game.board[choice] = game.computerSymbol;
  finishAfterComputer();
}

function finishAfterComputer() {
  updateBoardUI();
  const winner = checkWinner();
  if (winner) {
    game.over = true;
    if (winner === game.playerSymbol) {
      game.playerScore++;
      setStatus('You win!');
    } else {
      game.computerScore++;
      setStatus('Computer wins');
    }
  } else if (game.board.every(Boolean)) {
    game.draws++;
    game.over = true;
    setStatus('Draw');
  } else {
    setStatus('Your turn');
  }
  updateBoardUI();
}

function createLabelRows() {
  labelContainer = document.getElementById('label-container');
  labelContainer.innerHTML = '';
  for (let i = 0; i < maxPredictions; i++) {
    const row = document.createElement('div');
    row.className = 'label-row';
    row.innerHTML = `
      <div class="label-name"></div>
      <div class="label-score"></div>
      <div class="label-map">
        <label>Map to</label>
        <select class="map-select">
          <option value="">None</option>
          <option value="0">Top-left</option>
          <option value="1">Top-center</option>
          <option value="2">Top-right</option>
          <option value="3">Middle-left</option>
          <option value="4">Center</option>
          <option value="5">Middle-right</option>
          <option value="6">Bottom-left</option>
          <option value="7">Bottom-center</option>
          <option value="8">Bottom-right</option>
        </select>
      </div>
    `;
    labelContainer.appendChild(row);
  }
}

function getMappedIndex(predictionIndex) {
  const row = labelContainer.children[predictionIndex];
  if (!row) return null;
  const select = row.querySelector('.map-select');
  const value = select?.value;
  if (!value) return null;
  const index = parseInt(value, 10);
  return Number.isFinite(index) ? index : null;
}

async function init(files = null) {
  try {
    setStatus('Loading model...');
    document.getElementById('model-status').textContent = 'Loading Teachable Machine model...';
    if (!webcamPermissionGranted) {
      const allowed = await requestWebcamPermission();
      if (!allowed) return;
    }
    if (files) {
      await loadModelFromFiles(files);
    } else {
      try {
        const modelURL = URL + 'model.json';
        const metadataURL = URL + 'metadata.json';
        model = await tmImage.load(modelURL, metadataURL);
      } catch (error) {
        document.getElementById('model-status').textContent = 'Model not found at ./my_model/. Select Load Local Model Files to provide model.json, metadata.json, and .bin file(s).';
        setStatus('Model not found. Load local model files.');
        return;
      }
    }

    maxPredictions = model.getTotalClasses();
    createLabelRows();

    const flip = true;
    webcam = new tmImage.Webcam(320, 320, flip);
    await webcam.setup();
    await webcam.play();
    document.getElementById('webcam-container').innerHTML = '';
    document.getElementById('webcam-container').appendChild(webcam.canvas);

    document.getElementById('model-status').textContent = 'Model loaded. Assign each class to a board cell.';
    setStatus('Model ready. Show a gesture or board marker to the camera.');
    window.requestAnimationFrame(loop);
  } catch (error) {
    document.getElementById('model-status').textContent = `Unable to load model: ${error.message}`;
    setStatus('Model load failed');
  }
}

async function requestWebcamPermission() {
  const status = document.getElementById('permission-status');
  status.textContent = 'Requesting camera permission...';

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach(track => track.stop());
    webcamPermissionGranted = true;
    status.textContent = 'Camera permission granted. You can now start the webcam.';
    retryPermissionBtn?.classList.add('hidden');
    return true;
  } catch (error) {
    webcamPermissionGranted = false;
    status.textContent = 'Camera permission denied. Please allow camera access and try again.';
    setStatus('Camera permission denied');
    retryPermissionBtn?.classList.remove('hidden');
    return false;
  }
}

async function loadModelFromFiles(files) {
  const modelFiles = [];
  const metadataFiles = [];

  for (const file of files) {
    if (file.name === 'model.json' || file.name.endsWith('.bin')) {
      modelFiles.push(file);
    }
    if (file.name === 'metadata.json') {
      metadataFiles.push(file);
    }
  }

  if (modelFiles.length === 0 || metadataFiles.length === 0) {
    throw new Error('Please select model.json, metadata.json, and the .bin file(s).');
  }

  model = await tmImage.loadFromFiles(modelFiles, metadataFiles);
}

async function loop() {
  webcam.update();
  await predict();
  window.requestAnimationFrame(loop);
}

async function predict() {
  if (!model || !webcam) return;
  const prediction = await model.predict(webcam.canvas);
  let bestPrediction = { probability: 0, className: '', index: -1 };

  prediction.forEach((result, index) => {
    const score = result.probability;
    const row = labelContainer.children[index];
    if (!row) return;
    row.querySelector('.label-name').textContent = result.className;
    row.querySelector('.label-score').textContent = `${(score * 100).toFixed(1)}%`;
    if (score > bestPrediction.probability) {
      bestPrediction = { probability: score, className: result.className, index };
    }
  });

  labelContainer.querySelectorAll('.label-row').forEach((row, rowIndex) => {
    row.classList.toggle('active', rowIndex === bestPrediction.index);
  });

  if (bestPrediction.probability > 0.75) {
    const mappedIndex = getMappedIndex(bestPrediction.index);
    if (mappedIndex !== null && !game.over && !game.board[mappedIndex]) {
      if (bestPrediction.className !== lastPrediction) {
        lastPrediction = bestPrediction.className;
        playerMove(mappedIndex);
      }
    } else if (mappedIndex === null) {
      setStatus(`Detected ${bestPrediction.className}, but no board mapping is assigned.`);
    } else if (game.board[mappedIndex]) {
      setStatus(`Detected ${bestPrediction.className}, but mapped cell is occupied.`);
    }
  }
}

window.addEventListener('load', () => {
  createBoardUI();
  resetGameBoard();
  document.getElementById('reset-btn').addEventListener('click', resetGameBoard);

  const startBtn = document.getElementById('start-btn');
  const loadLocalBtn = document.getElementById('load-local-btn');
  retryPermissionBtn = document.getElementById('retry-permission-btn');
  modelFilesInput = document.getElementById('model-files');

  retryPermissionBtn.classList.add('hidden');

  startBtn.addEventListener('click', () => init(localModelFiles));
  retryPermissionBtn.addEventListener('click', requestWebcamPermission);
  loadLocalBtn.addEventListener('click', () => modelFilesInput.click());

  modelFilesInput.addEventListener('change', async (event) => {
    localModelFiles = Array.from(event.target.files);
    if (localModelFiles.length) {
      await init(localModelFiles);
    }
  });
});
