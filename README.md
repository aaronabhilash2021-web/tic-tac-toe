# TIC -TAC-TOE Demo

Tic-Tac-Toe with webcam gesture controls using MediaPipe Hands — no external model required.

Features

- Detects hand gestures (rock/paper/scissors) via MediaPipe Hands in the browser.
- Maps gestures to Tic-Tac-Toe board positions (configurable).
- Plays against a simple computer AI, tracks wins/losses/draws.

How to use

- Open `index.html` via a local HTTP server (browsers block webcam on file://).
- Click "Allow Webcam" to start the camera and MediaPipe processing.
- Perform gestures: rock, paper, or scissors — the detected gesture is shown and mapped to a board cell.

Run locally

Using Python 3:

```bash
cd tic-tac-toe
python -m http.server 8000
# then open http://localhost:8000 in your browser
```
