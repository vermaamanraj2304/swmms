// Web Audio API synthesized sound generator (Zero external asset dependencies, zero 404s)

class SoundAlertManager {
  constructor() {
    this.audioCtx = null;
    this.activeSiren = null;
  }

  getAudioContext() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  // 1. Doorstep Arrival Siren (Dual-tone oscillating municipal truck arrival siren)
  playDoorstepSiren(durationSeconds = 8) {
    this.stopSiren(); // Stop any currently playing siren first

    const ctx = this.getAudioContext();
    if (!ctx) return () => {};

    try {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sawtooth';
      gainNode.gain.setValueAtTime(0.18, ctx.currentTime);

      // Create dual-tone frequency modulation (wailing siren 650Hz <-> 960Hz)
      const now = ctx.currentTime;
      const cycleTime = 0.45; // seconds per cycle
      const cycles = Math.ceil(durationSeconds / cycleTime);

      for (let i = 0; i < cycles; i++) {
        const t = now + i * cycleTime;
        osc.frequency.setValueAtTime(650, t);
        osc.frequency.exponentialRampToValueAtTime(960, t + cycleTime / 2);
        osc.frequency.exponentialRampToValueAtTime(650, t + cycleTime);
      }

      // Smooth fade out at the end
      gainNode.gain.setValueAtTime(0.18, now + durationSeconds - 0.5);
      gainNode.gain.linearRampToValueAtTime(0.001, now + durationSeconds);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + durationSeconds);

      let isStopped = false;
      const stop = () => {
        if (!isStopped) {
          isStopped = true;
          try {
            gainNode.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.1);
            setTimeout(() => {
              try { osc.stop(); } catch (_) {}
            }, 120);
          } catch (_) {}
        }
      };

      this.activeSiren = { stop };
      return stop;
    } catch (err) {
      console.warn('AudioContext siren playback notice:', err);
      return () => {};
    }
  }

  stopSiren() {
    if (this.activeSiren && typeof this.activeSiren.stop === 'function') {
      this.activeSiren.stop();
      this.activeSiren = null;
    }
  }

  // 2. Proximity Arrival Notification Chime (2-tone pleasant melodic doorbell chime)
  playProximityChime() {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [
        { freq: 587.33, start: 0, dur: 0.28 }, // D5
        { freq: 880.00, start: 0.22, dur: 0.45 }  // A5
      ];

      notes.forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + start);

        gain.gain.setValueAtTime(0.2, now + start);
        gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + start);
        osc.stop(now + start + dur);
      });
    } catch (err) {
      console.warn('AudioContext chime notice:', err);
    }
  }

  // 3. Shift Started Fanfare / Alert Chime
  playDutyStartChime() {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [
        { freq: 440, start: 0, dur: 0.15 },
        { freq: 554.37, start: 0.14, dur: 0.15 },
        { freq: 659.25, start: 0.28, dur: 0.35 }
      ];

      notes.forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + start);

        gain.gain.setValueAtTime(0.2, now + start);
        gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + start);
        osc.stop(now + start + dur);
      });
    } catch (err) {
      console.warn('AudioContext duty start notice:', err);
    }
  }

  // 4. Garbage Picked Up & Points Credited Success Sound (Harmonic ascending chime)
  playPointsCreditedChime() {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [
        { freq: 523.25, start: 0, dur: 0.12 },     // C5
        { freq: 659.25, start: 0.10, dur: 0.12 },    // E5
        { freq: 783.99, start: 0.20, dur: 0.14 },    // G5
        { freq: 1046.50, start: 0.30, dur: 0.40 }   // C6
      ];

      notes.forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + start);

        gain.gain.setValueAtTime(0.25, now + start);
        gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + start);
        osc.stop(now + start + dur);
      });
    } catch (err) {
      console.warn('AudioContext points chime notice:', err);
    }
  }

  // 5. Crisp Modern Notification Ping
  playNotificationPing() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.10); // E6

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.28);
    } catch (err) {
      console.warn('AudioContext ping notice:', err);
    }
  }

  // 6. Urgent Emergency Chime
  playEmergencyAlertChime() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const freqs = [750, 950, 750, 950];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = now + idx * 0.12;

        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 0.11);
      });
    } catch (err) {
      console.warn('AudioContext emergency chime notice:', err);
    }
  }
}

export const soundManager = new SoundAlertManager();
