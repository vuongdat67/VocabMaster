const fs = require('fs');

const THEMES = [
  'light', 'dark', 'cupcake', 'bumblebee', 'corporate',
  'synthwave', 'cyberpunk', 'valentine', 'autumn', 'cmyk',
  'halloween', 'garden', 'aqua', 'lofi', 'pastel',
  'fantasy', 'wireframe', 'black', 'business',
  'acid', 'lemonade', 'night', 'coffee', 'winter', 'dim',
  'caramellatte', 'abyss', 'silk'
];

function hash(str) {
  let h = 0;
  for(let i=0; i<str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  return Math.abs(h);
}

function genColor(name, mode, type) {
  const h = hash(name + mode + type);
  let r, g, b;
  if (mode === 'light') {
    if (type === 'bg') { r = 240 + h%16; g = 240 + (h>>4)%16; b = 240 + (h>>8)%16; }
    else if (type === 'text') { r = h%50; g = (h>>4)%50; b = (h>>8)%50; }
    else { r = 100 + h%100; g = 100 + (h>>4)%100; b = 100 + (h>>8)%100; }
  } else {
    if (type === 'bg') { r = h%30; g = (h>>4)%30; b = (h>>8)%30; }
    else if (type === 'text') { r = 200 + h%55; g = 200 + (h>>4)%55; b = 200 + (h>>8)%55; }
    else { r = 50 + h%150; g = 50 + (h>>4)%150; b = 50 + (h>>8)%150; }
  }
  return '#' + ((1<<24) + (r<<16) + (g<<8) + b).toString(16).slice(1);
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

const icons = ['🎨','✨','🌟','🌙','☀️','🍀','🍁','❄️','💧','🔥','🌈','🌸','🌊','🍎','🍋','🍇','🍉','🍓','🍒','🍑'];

let extra = '';
for (const t of THEMES) {
  const icon = icons[hash(t) % icons.length];
  extra += `  {
    id: '${t}',
    name: '${capitalize(t)}',
    icon: '${icon}',
    swatchLight: '${genColor(t, 'light', 'bg')}',
    swatchDark: '${genColor(t, 'dark', 'bg')}',
    light: {
      '--surface': '${genColor(t, 'light', 'bg')}',
      '--surface-secondary': '${genColor(t, 'light', 'bg2')}',
      '--surface-tertiary': '${genColor(t, 'light', 'bg3')}',
      '--surface-card': '${genColor(t, 'light', 'bg')}',
      '--text-primary': '${genColor(t, 'light', 'text')}',
      '--text-secondary': '${genColor(t, 'light', 'text2')}',
      '--text-tertiary': '${genColor(t, 'light', 'text3')}',
      '--border-default': '${genColor(t, 'light', 'border')}',
      '--accent-500': '${genColor(t, 'light', 'accent')}',
    },
    dark: {
      '--surface': '${genColor(t, 'dark', 'bg')}',
      '--surface-secondary': '${genColor(t, 'dark', 'bg2')}',
      '--surface-tertiary': '${genColor(t, 'dark', 'bg3')}',
      '--surface-card': '${genColor(t, 'dark', 'bg')}',
      '--text-primary': '${genColor(t, 'dark', 'text')}',
      '--text-secondary': '${genColor(t, 'dark', 'text2')}',
      '--text-tertiary': '${genColor(t, 'dark', 'text3')}',
      '--border-default': '${genColor(t, 'dark', 'border')}',
      '--accent-500': '${genColor(t, 'dark', 'accent')}',
    }
  },\n`;
}

// Read current themes.ts
let content = fs.readFileSync('src/data/themes.ts', 'utf-8');

// Replace the array ending
const newContent = content.replace(/\]\s*export\s+function\s+getPreset/g, extra + ']\n\nexport function getPreset');

fs.writeFileSync('src/data/themes.ts', newContent);
console.log('Appended extra themes properly.');
