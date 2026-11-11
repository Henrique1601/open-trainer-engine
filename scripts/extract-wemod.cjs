const fs = require('fs');
const path = require('path');
const asar = require('@electron/asar');

const asarPath = 'C:\\Users\\henri\\AppData\\Local\\Wand\\app-12.71.0\\resources\\app.asar';
const outDir = path.join(__dirname, '..', 'wemod-extracted');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

console.log('Extracting WeMod files...');
// Extract CSS files
const cssFiles = [
  'app-65e972d9.bfd687c7e3ea07152751.bundle.css',
  '92415.b3797d67d42cb92505c4.bundle.css'
];

for (const css of cssFiles) {
  try {
    const buf = asar.extractFile(asarPath, css);
    fs.writeFileSync(path.join(outDir, css), buf);
    console.log(`Saved ${css} (${buf.length} bytes)`);
  } catch (err) {
    console.error(`Failed to extract ${css}:`, err.message);
  }
}

// Extract pt-BR strings
try {
  const filePath = path.join('static', 'strings', 'pt-BR.json');
  const buf = asar.extractFile(asarPath, filePath);
  fs.writeFileSync(path.join(outDir, 'pt-BR.json'), buf);
  console.log(`Saved pt-BR.json (${buf.length} bytes)`);
} catch (err) {
  console.error('Failed to extract pt-BR.json:', err.message);
}

// Extract SVGs
const allFiles = asar.listPackage(asarPath);
const svgs = allFiles.filter(f => f.endsWith('.svg'));
console.log(`Found ${svgs.length} SVGs`);
for (const svg of svgs) {
  try {
    const cleanPath = svg.replace(/^\\+/, '');
    const buf = asar.extractFile(asarPath, cleanPath);
    const basename = path.basename(cleanPath);
    fs.writeFileSync(path.join(outDir, basename), buf);
  } catch (err) {
    // Ignore individual svg errors
  }
}

console.log('Done extraction!');
