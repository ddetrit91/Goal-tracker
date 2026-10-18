// client/src/utils/ambientSound.ts
// Премиальные генераторы фонового звука продуктивности (Web Audio API)
// 100% автономно, без задержек, с мгновенным надёжным выключением при закрытии

export type AmbientSoundType = 'none' | 'rain' | 'waves' | 'fire' | 'noise';

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let activeSources: (AudioNode & { stop?: (when?: number) => void })[] = [];
let fireCrackleInterval: NodeJS.Timeout | null = null;
let fireTimeouts: NodeJS.Timeout[] = [];
let snapNoiseBuffer: AudioBuffer | null = null;
let currentType: AmbientSoundType = 'none';

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx || audioCtx.state === 'closed') {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch (e) {
    console.warn('Web Audio API not supported:', e);
    return null;
  }
}

/**
 * Создаёт циклический буфер розового шума (Pink noise 1/f)
 */
function createPinkNoiseBuffer(ctx: AudioContext, durationSeconds = 5): AudioBuffer {
  const bufferSize = ctx.sampleRate * durationSeconds;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.18;
    b6 = white * 0.115926;
  }

  return buffer;
}

/**
 * Буфер белого шума для мгновенных физических импульсов щелчков древесины
 */
function getSnapNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (!snapNoiseBuffer || snapNoiseBuffer.sampleRate !== ctx.sampleRate) {
    const size = ctx.sampleRate * 2;
    snapNoiseBuffer = ctx.createBuffer(1, size, ctx.sampleRate);
    const data = snapNoiseBuffer.getChannelData(0);
    for (let i = 0; i < size; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }
  return snapNoiseBuffer;
}

/**
 * Мгновенная и полная остановка всех фоновых звуков
 */
export function stopAmbientSound(): void {
  // 1. Очищаем таймер и отложенные щелчки костра
  if (fireCrackleInterval) {
    clearInterval(fireCrackleInterval);
    fireCrackleInterval = null;
  }
  for (const timeout of fireTimeouts) {
    clearTimeout(timeout);
  }
  fireTimeouts = [];

  // 2. Мгновенно глушим мастер-громкость
  if (masterGain && audioCtx) {
    try {
      masterGain.gain.cancelScheduledValues(0);
      masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
      masterGain.disconnect();
    } catch {}
    masterGain = null;
  }

  // 3. Останавливаем и отключаем все запущенные ноды
  for (const node of activeSources) {
    try {
      if (typeof node.stop === 'function') {
        node.stop(0);
      }
    } catch {}
    try {
      node.disconnect();
    } catch {}
  }
  activeSources = [];
  currentType = 'none';
}

/**
 * Органический звук треска горящей древесины в лесу (Campfire timber snap)
 * Создаёт физически достоверные щелчки и треск лопающихся смоляных кармашков и сухих веток.
 */
function playCampfireCrackle(
  ctx: AudioContext,
  destination: AudioNode,
  mode: 'ember' | 'timber' | 'spark' = 'ember'
) {
  try {
    const now = ctx.currentTime;
    const noiseBuffer = getSnapNoiseBuffer(ctx);
    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;
    // Случайное смещение для уникальности каждой микродетонации древесины
    const offset = Math.random() * 1.5;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';

    const gain = ctx.createGain();

    if (mode === 'timber') {
      // 🪵 Глубокий, сочный щелчок раскалывающегося сухого полена
      const centerFreq = 1100 + Math.random() * 900;
      filter.frequency.setValueAtTime(centerFreq, now);
      filter.Q.setValueAtTime(2.8, now);

      const duration = 0.03 + Math.random() * 0.025; // 30–55 мс
      const vol = 0.11 + Math.random() * 0.09;

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.001);
      gain.gain.exponentialRampToValueAtTime(0.00001, now + duration);

      // Акустический резонанс массивной ветки (низкочастотный глухой удар)
      const thump = ctx.createOscillator();
      const thumpGain = ctx.createGain();
      const thumpFreq = 170 + Math.random() * 80;
      thump.type = 'triangle';
      thump.frequency.setValueAtTime(thumpFreq, now);
      thump.frequency.exponentialRampToValueAtTime(45, now + 0.035);

      thumpGain.gain.setValueAtTime(0.0001, now);
      thumpGain.gain.linearRampToValueAtTime(vol * 0.65, now + 0.002);
      thumpGain.gain.exponentialRampToValueAtTime(0.00001, now + 0.04);

      thump.connect(thumpGain);
      thumpGain.connect(destination);
      thump.start(now);
      thump.stop(now + 0.045);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(destination);

      source.start(now, offset, duration + 0.01);
      source.stop(now + duration + 0.02);
    } else if (mode === 'spark') {
      // ✨ Звонкая стреляющая искра (вскипание смолы в сосновой коре)
      const centerFreq = 2600 + Math.random() * 2600;
      filter.frequency.setValueAtTime(centerFreq, now);
      filter.Q.setValueAtTime(4.2, now);

      const duration = 0.015 + Math.random() * 0.02; // 15–35 мс
      const vol = 0.08 + Math.random() * 0.08;

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.001);
      gain.gain.exponentialRampToValueAtTime(0.00001, now + duration);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(destination);

      source.start(now, offset, duration + 0.01);
      source.stop(now + duration + 0.02);
    } else {
      // 🔥 Мелкий хруст и потрескивание тлеющих углей
      const centerFreq = 1600 + Math.random() * 1800;
      filter.frequency.setValueAtTime(centerFreq, now);
      filter.Q.setValueAtTime(2.2, now);

      const duration = 0.01 + Math.random() * 0.018; // 10–28 мс
      const vol = 0.035 + Math.random() * 0.055;

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.001);
      gain.gain.exponentialRampToValueAtTime(0.00001, now + duration);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(destination);

      source.start(now, offset, duration + 0.01);
      source.stop(now + duration + 0.02);
    }
  } catch {}
}

/**
 * Запуск генератора фонового звука
 */
export function playAmbientSound(type: AmbientSoundType, volume = 0.5): void {
  // Всегда сначала глушим всё прежнее
  stopAmbientSound();

  if (type === 'none') {
    return;
  }

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const targetGainValue = Math.max(0.01, Math.min(1, volume * 0.8));
    const now = ctx.currentTime;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(targetGainValue, now + 0.3);
    gain.connect(ctx.destination);
    masterGain = gain;

    // Общий генератор розового шума
    const noiseBuffer = createPinkNoiseBuffer(ctx, 6);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    if (type === 'rain') {
      // 🌧️ ДОЖДЬ: объёмный, сочный, мягкий шум падающих капель
      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(2600, now);

      const highpass = ctx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.setValueAtTime(320, now);

      noiseSource.connect(highpass);
      highpass.connect(lowpass);
      lowpass.connect(gain);

      noiseSource.start(now);
      activeSources.push(noiseSource, highpass, lowpass);
    } else if (type === 'fire') {
      // 🔥 ЛЕСНОЙ КОСТЁР:
      // 1. Тёплый глубокий гул очага (низкочастотная основа пламени)
      const flameFilter = ctx.createBiquadFilter();
      flameFilter.type = 'lowpass';
      flameFilter.frequency.setValueAtTime(380, now);

      const warmLow = ctx.createBiquadFilter();
      warmLow.type = 'lowshelf';
      warmLow.frequency.setValueAtTime(120, now);
      warmLow.gain.setValueAtTime(6, now); // Глубокое тёплое "тело" огня

      // Медленное дыхание пламени на ветру (LFO 0.55 Гц)
      const flameGain = ctx.createGain();
      flameGain.gain.setValueAtTime(0.8, now);

      const windLfo = ctx.createOscillator();
      windLfo.type = 'sine';
      windLfo.frequency.setValueAtTime(0.55, now);

      const windLfoDepth = ctx.createGain();
      windLfoDepth.gain.setValueAtTime(0.18, now);
      windLfo.connect(windLfoDepth);
      windLfoDepth.connect(flameGain.gain);

      noiseSource.connect(warmLow);
      warmLow.connect(flameFilter);
      flameFilter.connect(flameGain);
      flameGain.connect(gain);

      // 2. Непрерывное шипение сосновой смолы и хвои (Sizzle bed)
      const sizzleFilter = ctx.createBiquadFilter();
      sizzleFilter.type = 'bandpass';
      sizzleFilter.frequency.setValueAtTime(2600, now);
      sizzleFilter.Q.setValueAtTime(1.4, now);

      const sizzleGain = ctx.createGain();
      sizzleGain.gain.setValueAtTime(0.055, now);

      noiseSource.connect(sizzleFilter);
      sizzleFilter.connect(sizzleGain);
      sizzleGain.connect(gain);

      noiseSource.start(now);
      windLfo.start(now);
      activeSources.push(
        noiseSource,
        warmLow,
        flameFilter,
        flameGain,
        windLfo,
        windLfoDepth,
        sizzleFilter,
        sizzleGain
      );

      // 3. Органичный нерегулярный треск поленьев, щелчки веток и вылетающие искры
      const scheduleCrackle = () => {
        if (!ctx || !masterGain) return;
        const roll = Math.random();

        if (roll < 0.42) {
          // Обычный мягкий щелчок тлеющего уголька
          playCampfireCrackle(ctx, masterGain, 'ember');
        } else if (roll < 0.60) {
          // Серия быстрых микровзрывов смолы (пачка щелчков)
          playCampfireCrackle(ctx, masterGain, 'ember');
          const t1 = setTimeout(() => {
            if (ctx && masterGain) playCampfireCrackle(ctx, masterGain, 'ember');
          }, 25 + Math.random() * 30);
          const t2 = setTimeout(() => {
            if (ctx && masterGain) playCampfireCrackle(ctx, masterGain, 'spark');
          }, 60 + Math.random() * 40);
          fireTimeouts.push(t1, t2);
        } else if (roll < 0.74) {
          // Звонкий выстрел смоляной искры
          playCampfireCrackle(ctx, masterGain, 'spark');
        } else if (roll < 0.88) {
          // Сочный глухой раскол сухого соснового полена
          playCampfireCrackle(ctx, masterGain, 'timber');
        }
        // 0.88..1.00: пауза, естественное дыхание костра
      };

      fireCrackleInterval = setInterval(scheduleCrackle, 85);
    } else if (type === 'waves') {
      // 🌊 МОРСКИЕ ВОЛНЫ:
      const waveFilter = ctx.createBiquadFilter();
      waveFilter.type = 'lowpass';
      waveFilter.frequency.setValueAtTime(700, now);

      const waveGain = ctx.createGain();
      waveGain.gain.setValueAtTime(0.45, now);

      // LFO для дыхания волн (0.1 Гц, ~10 секунд полный цикл прибоя)
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.1, now);

      const lfoDepth = ctx.createGain();
      lfoDepth.gain.setValueAtTime(0.35, now);

      lfo.connect(lfoDepth);
      lfoDepth.connect(waveGain.gain);

      noiseSource.connect(waveFilter);
      waveFilter.connect(waveGain);
      waveGain.connect(gain);

      noiseSource.start(now);
      lfo.start(now);

      activeSources.push(noiseSource, waveFilter, waveGain, lfo, lfoDepth);
    } else if (type === 'noise') {
      // 💨 БЕЛЫЙ/РОЗОВЫЙ ШУМ ДЛЯ ЛАЗЕРНОГО ФОКУСА
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1900, now);

      noiseSource.connect(filter);
      filter.connect(gain);

      noiseSource.start(now);
      activeSources.push(noiseSource, filter);
    }

    currentType = type;
  } catch (err) {
    console.error('Ambient playback error:', err);
    stopAmbientSound();
  }
}

/**
 * Плавная регулировка громкости
 */
export function setAmbientVolume(volume: number): void {
  if (masterGain && audioCtx) {
    try {
      const target = Math.max(0, Math.min(1, volume * 0.8));
      masterGain.gain.cancelScheduledValues(0);
      masterGain.gain.setValueAtTime(target, audioCtx.currentTime);
    } catch {}
  }
}

export function getCurrentAmbientSound(): AmbientSoundType {
  return currentType;
}
