// Procedural Web Audio API foley synthesizer (zero external network assets).

export function createAudioEngine() {
  let ctx = null;
  let muted = false;

  function ensureContext() {
    if (muted) return null;
    if (!ctx && typeof window !== 'undefined') {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  function tone(freq, endFreq, duration, type = 'triangle', gainPeak = 0.14, delay = 0) {
    const c = ensureContext();
    if (!c) return;
    const now = c.currentTime + delay;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== freq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
    }
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(gainPeak, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  return {
    unlock() {
      ensureContext();
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    isMuted() {
      return muted;
    },
    playPick() {
      tone(340, 520, 0.08, 'sine', 0.12);
    },
    playDrop() {
      tone(280, 180, 0.09, 'triangle', 0.12);
    },
    playChop(hitIndex) {
      const base = 180 + hitIndex * 45;
      tone(base, 75, 0.07, 'square', 0.09);
    },
    playPerfectSear() {
      tone(587.3, 880, 0.16, 'sine', 0.13);
    },
    playServe(combo) {
      const boost = Math.min(4, combo) * 40;
      tone(784 + boost, 784 + boost, 0.22, 'sine', 0.16, 0);
      tone(1046.5 + boost, 1046.5 + boost, 0.28, 'sine', 0.14, 0.07);
    },
    playBurn() {
      tone(220, 110, 0.25, 'sawtooth', 0.1);
    },
    playDash() {
      tone(420, 210, 0.1, 'sine', 0.08);
    },
    playShiftOver() {
      tone(523.25, 523.25, 0.18, 'triangle', 0.15, 0);
      tone(659.25, 659.25, 0.18, 'triangle', 0.15, 0.14);
      tone(783.99, 783.99, 0.35, 'triangle', 0.16, 0.28);
    },
  };
}
