/**
 * Audio Manager — Procedurally generated game sounds.
 *
 * Uses Web Audio API to create short sound effects without
 * loading external audio files. All sounds < 0.5 sec.
 */

let ctx = null;
let enabled = true;

/**
 * Initialize the audio context (must be called after user interaction).
 */
function ensureContext() {
  if (ctx) return ctx;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  } catch {
    // Web Audio not supported
  }
  return ctx;
}

/**
 * Play a tone with the given parameters.
 */
function playTone(freq, duration, type = "square", volume = 0.15, ramp = true) {
  if (!enabled) return;
  const ac = ensureContext();
  if (!ac) return;

  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ac.currentTime);
  gain.gain.setValueAtTime(volume, ac.currentTime);

  if (ramp) {
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
  }

  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(ac.currentTime);
  osc.stop(ac.currentTime + duration);
}

/**
 * Play two tones in sequence.
 */
function playToneSequence(tones) {
  if (!enabled) return;
  const ac = ensureContext();
  if (!ac) return;

  let time = ac.currentTime;
  for (const { freq, duration, type, volume } of tones) {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type || "square";
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(volume || 0.12, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(time);
    osc.stop(time + duration);
    time += duration * 0.8; // slight overlap for smoother sequence
  }
}

// ─── Sound Effects ──────────────────────────────────────

/** Level-up fanfare — ascending C-E-G-C pattern */
export function playLevelUp() {
  playToneSequence([
    { freq: 523, duration: 0.1, type: "square", volume: 0.12 },
    { freq: 659, duration: 0.1, type: "square", volume: 0.12 },
    { freq: 784, duration: 0.1, type: "square", volume: 0.12 },
    { freq: 1047, duration: 0.2, type: "square", volume: 0.15 },
  ]);
}

/** Smelt/smith metallic clink */
export function playSmelt() {
  playToneSequence([
    { freq: 800, duration: 0.05, type: "triangle", volume: 0.1 },
    { freq: 1200, duration: 0.08, type: "triangle", volume: 0.15 },
  ]);
}

/** Monster kill hit — short percussive */
export function playHit() {
  if (!enabled) return;
  const ac = ensureContext();
  if (!ac) return;

  // Noise burst for impact
  const bufferSize = ac.sampleRate * 0.06;
  const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const source = ac.createBufferSource();
  source.buffer = buffer;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.1, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.06);
  source.connect(gain);
  gain.connect(ac.destination);
  source.start();
}

/** Quest complete jingle — triumphant short melody */
export function playQuestComplete() {
  playToneSequence([
    { freq: 392, duration: 0.1, type: "square", volume: 0.12 },
    { freq: 494, duration: 0.1, type: "square", volume: 0.12 },
    { freq: 587, duration: 0.1, type: "square", volume: 0.12 },
    { freq: 784, duration: 0.15, type: "square", volume: 0.14 },
    { freq: 988, duration: 0.25, type: "square", volume: 0.15 },
  ]);
}

/** Shop purchase ka-ching */
export function playShopBuy() {
  playToneSequence([
    { freq: 1500, duration: 0.04, type: "sine", volume: 0.1 },
    { freq: 2000, duration: 0.06, type: "sine", volume: 0.12 },
  ]);
}

/** Achievement unlock ding — bright bell */
export function playAchievement() {
  playToneSequence([
    { freq: 880, duration: 0.08, type: "sine", volume: 0.15 },
    { freq: 1100, duration: 0.08, type: "sine", volume: 0.12 },
    { freq: 1320, duration: 0.15, type: "sine", volume: 0.15 },
    { freq: 1760, duration: 0.25, type: "sine", volume: 0.12 },
  ]);
}

/** Gather action — soft click for mining/fishing/woodcutting */
export function playGather() {
  playTone(600, 0.05, "triangle", 0.08);
}

// ─── State Management ───────────────────────────────────

/**
 * Set sound enabled/disabled state.
 * @param {boolean} state - True to enable, false to mute.
 */
export function setSoundEnabled(state) {
  enabled = !!state;
}

/**
 * Check if sound is currently enabled.
 * @returns {boolean}
 */
export function isSoundEnabled() {
  return enabled;
}
