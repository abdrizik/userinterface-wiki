// Sound library for UI feedback sounds

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
  return audioContext;
}

function createTone(
  ctx: AudioContext,
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  volume = 0.2,
) {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

  gainNode.gain.setValueAtTime(volume, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
}

export const sounds = {
  success: () => {
    try {
      const ctx = getAudioContext();
      createTone(ctx, 523.25, 0.1);
      setTimeout(() => createTone(ctx, 659.25, 0.15), 80);
    } catch {
      // Audio not supported
    }
  },

  error: () => {
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(280, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        180,
        ctx.currentTime + 0.2,
      );

      gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.2);
    } catch {
      // Audio not supported
    }
  },

  warning: () => {
    try {
      const ctx = getAudioContext();
      createTone(ctx, 440, 0.08, "square");
      setTimeout(() => createTone(ctx, 440, 0.08, "square"), 120);
    } catch {
      // Audio not supported
    }
  },

  click: () => {
    try {
      const ctx = getAudioContext();
      const bufferSize = ctx.sampleRate * 0.02;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
      }

      const source = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      const gainNode = ctx.createGain();

      source.buffer = buffer;
      filter.type = "highpass";
      filter.frequency.value = 800;
      gainNode.gain.value = 0.15;

      source.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      source.start();
    } catch {
      // Audio not supported
    }
  },

  pop: () => {
    try {
      const ctx = getAudioContext();
      createTone(ctx, 400, 0.05, "sine", 0.15);
    } catch {
      // Audio not supported
    }
  },

  notification: () => {
    try {
      const ctx = getAudioContext();
      createTone(ctx, 880, 0.1, "sine", 0.15);
      setTimeout(() => createTone(ctx, 1108.73, 0.15, "sine", 0.12), 100);
    } catch {
      // Audio not supported
    }
  },
};
