// Replace these constants at the top of the gesture section
const GESTURE_COOLDOWN = 350;  // was 600
let lastWaveTime = 0;
let waveConfirmTime = 200;      // was 300

// Inside detectGesture, modify horizontal and vertical wave blocks:

// Horizontal wave - more sensitive
if (prevX !== null) {
    const dx = palmX - prevX;
    if (Math.abs(dx) > 0.025 && (now - lastWaveTime) > 100) {   // was 0.04 and 150
        let dir = dx > 0 ? 'left' : 'right';
        if (lastDirX === dir && !confirmX) {
            confirmX = true;
            // ... rest of gesture handling (same)
            setTimeout(() => { confirmX = false; }, waveConfirmTime);
        }
        lastDirX = dir;
        lastWaveTime = now;
    } else if ((now - lastWaveTime) > waveConfirmTime) {
        lastDirX = null;
        confirmX = false;
    }
}
// Same for vertical (use same thresholds)