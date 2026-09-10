const STORAGE_KEY = "support-link-sfx-muted";

type SfxKind = "ok" | "warn" | "err";

let ctx: AudioContext | null = null;
const listeners = new Set<() => void>();

function reducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function notify() {
  listeners.forEach((listener) => listener());
}

export function isSfxMuted() {
  if (typeof window === "undefined") return true;
  if (reducedMotion()) return true;
  return window.localStorage.getItem(STORAGE_KEY) === "1";
}

export function setSfxMuted(value: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  notify();
}

export function subscribeSfx(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getContext() {
  const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!ctx) ctx = new AudioCtx();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function unlockSfx() {
  if (typeof window === "undefined") return;
  getContext();
}

function beep(audio: AudioContext, frequency: number, duration: number, type: OscillatorType, gainValue: number, when = 0) {
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audio.currentTime + when);
  gain.gain.setValueAtTime(gainValue, audio.currentTime + when);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + when + duration);
  oscillator.connect(gain);
  gain.connect(audio.destination);
  oscillator.start(audio.currentTime + when);
  oscillator.stop(audio.currentTime + when + duration);
}

export function playSfx(kind: SfxKind) {
  if (typeof window === "undefined" || isSfxMuted()) return;
  const audio = getContext();
  if (!audio) return;

  if (kind === "ok") {
    beep(audio, 523, 0.09, "sine", 0.05);
    beep(audio, 784, 0.1, "sine", 0.04, 0.08);
    return;
  }
  if (kind === "warn") {
    beep(audio, 392, 0.14, "triangle", 0.05);
    return;
  }
  beep(audio, 196, 0.18, "sawtooth", 0.04);
}
