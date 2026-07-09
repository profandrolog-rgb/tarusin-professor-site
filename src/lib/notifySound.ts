// Короткий двухтональный сигнал завершения — без внешних аудио-файлов, чистый Web Audio API.
let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  } catch {
    return null;
  }
}

const LS_KEY = "app.soundNotificationsEnabled";

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(LS_KEY) !== "0";
}

export function setSoundEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(LS_KEY, enabled ? "1" : "0"); } catch {}
}

export function playCompletionChime() {
  if (!isSoundEnabled()) return;
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const fundamental = 523.25;
  const partials: [number, number][] = [
    [fundamental, 0.16],
    [fundamental * 1.5, 0.05],
  ];
  partials.forEach(([freq, peakGain]) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.8);
  });
}
