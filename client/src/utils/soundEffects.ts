// client/src/utils/soundEffects.ts
// Премиальный синтезатор звуков (Web Audio API) и тактильный отклик (Haptic Feedback)
// Работает 100% оффлайн, с нулевой задержкой и без внешних аудиофайлов

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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

// ==========================================
// НАСТРОЙКИ ЗВУКА И ВИБРАЦИИ (LocalStorage)
// ==========================================

export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const val = localStorage.getItem('app_sound_enabled');
  return val === null ? true : val === 'true';
}

export function setSoundEnabled(enabled: boolean): void {
  localStorage.setItem('app_sound_enabled', String(enabled));
}

export function isHapticsEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const val = localStorage.getItem('app_haptics_enabled');
  return val === null ? true : val === 'true';
}

export function setHapticsEnabled(enabled: boolean): void {
  localStorage.setItem('app_haptics_enabled', String(enabled));
}

// ==========================================
// ТАКТИЛЬНЫЙ ОТКЛИК (HAPTIC FEEDBACK)
// ==========================================

export function triggerHaptic(type: 'light' | 'medium' | 'success' | 'warning' = 'light'): void {
  if (typeof window === 'undefined' || !isHapticsEnabled()) return;
  if (!('vibrate' in navigator)) return;

  try {
    switch (type) {
      case 'light':
        navigator.vibrate(12);
        break;
      case 'medium':
        navigator.vibrate(25);
        break;
      case 'success':
        navigator.vibrate([15, 40, 20]);
        break;
      case 'warning':
        navigator.vibrate([30, 50, 30]);
        break;
    }
  } catch (e) {
    // Игнорируем ограничения политик вибрации в некоторых браузерах
  }
}

// ==========================================
// ЗВУКОВЫЕ ЭФФЕКТЫ (SYNTHESIZED WEB AUDIO)
// ==========================================

/**
 * Мягкий и сочный «щелчок» выполнения задачи (Satisfying Pop / Bubble Check, как в Things 3 / iOS)
 */
export function playTaskCompleteSound(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Генерация двухфазного мягкого щелчка (основной тон + гармоника)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Быстрый частотный свип вверх (эффект лопающегося пузырька / сочного щелчка)
    osc.frequency.setValueAtTime(580, now);
    osc.frequency.exponentialRampToValueAtTime(1100, now + 0.04);
    osc.frequency.exponentialRampToValueAtTime(780, now + 0.09);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.11);
  } catch (e) {
    console.error('Audio playback error:', e);
  }
}

/**
 * Мягкий глухой щелчок снятия галочки задачи
 */
export function playTaskUncheckSound(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, now);
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.06);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  } catch (e) {}
}

/**
 * Праздничный колокольчатый аккорд при получении уровня или достижении цели
 */
export function playLevelUpSound(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    // Ноты арпеджио: До5, Ми5, Соль5, До6 (мажорное праздничное трезвучие)
    const notes = [523.25, 659.25, 783.99, 1046.5];

    notes.forEach((freq, idx) => {
      const noteTime = now + idx * 0.07;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime(0.2, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.46);
    });
  } catch (e) {}
}

/**
 * Игривый звук «Eat That Frog 🐸» при выборе главного фокуса дня
 */
export function playFrogFocusSound(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    // Два забавных квакающих пузырька
    [
      { start: 0, f1: 300, f2: 650 },
      { start: 0.09, f1: 360, f2: 780 },
    ].forEach(({ start, f1, f2 }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f1, now + start);
      osc.frequency.exponentialRampToValueAtTime(f2, now + start + 0.05);

      gain.gain.setValueAtTime(0.18, now + start);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + start);
      osc.stop(now + start + 0.09);
    });
  } catch (e) {}
}

/**
 * Спокойный медитативный аккорд завершения дня для вечерней рефлексии
 */
export function playEveningChimeSound(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    // Мягкий вечерний аккорд Ре-мажор 7
    const freqs = [293.66, 369.99, 440.0, 554.37];

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 1.25);
    });
  } catch (e) {}
}
