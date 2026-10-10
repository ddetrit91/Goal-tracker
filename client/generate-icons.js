// generate-icons.js
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas'); // Нам понадобится эта библиотека

// Если библиотеки нет, установим её одной командой ниже
function createIcon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // 1. Белый фон с закругленными углами (как у iOS/Android иконок)
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  const radius = size * 0.2;
  ctx.roundRect(0, 0, size, size, radius);
  ctx.fill();

  // 2. Фиолетовый градиентный круг
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#6366f1'); // Indigo-500
  gradient.addColorStop(1, '#8b5cf6'); // Violet-500
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.35, 0, Math.PI * 2);
  ctx.fill();

  // 3. Белая галочка
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = size * 0.08;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  const cx = size / 2;
  const cy = size / 2;
  const s = size * 0.25; // размер галочки
  
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.6, cy + s * 0.1);
  ctx.lineTo(cx - s * 0.1, cy + s * 0.6);
  ctx.lineTo(cx + s * 0.7, cy - s * 0.5);
  ctx.stroke();

  // Сохраняем
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(__dirname, 'public', filename), buffer);
  console.log(`✅ Иконка ${filename} (${size}x${size}) создана!`);
}

// Убедимся, что папка public существует
if (!fs.existsSync(path.join(__dirname, 'public'))) {
  fs.mkdirSync(path.join(__dirname, 'public'));
}

createIcon(192, 'icon-192.png');
createIcon(512, 'icon-512.png');