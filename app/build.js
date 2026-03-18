/**
 * Build script for Hverdagsverktøy native app.
 * Copies web files from parent directory into www/ for Capacitor.
 */

const fs = require('fs');
const path = require('path');

const parentDir = path.resolve(__dirname, '..');
const wwwDir = path.resolve(__dirname, 'www');

// Files and directories to copy from parent
const filesToCopy = [
  'finanskalkulator.html',
  'manifest.json',
  'sw.js',
];

const dirsToCopy = [
  'icons',
  'fonts',
];

// Ensure www/ exists
if (!fs.existsSync(wwwDir)) {
  fs.mkdirSync(wwwDir, { recursive: true });
}

// Copy a single file
function copyFile(src, dest) {
  fs.copyFileSync(src, dest);
  console.log(`  Copied: ${path.basename(src)}`);
}

// Recursively copy a directory
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
  console.log(`  Copied dir: ${path.basename(src)}/`);
}

console.log('Building Hverdagsverktøy app...');
console.log(`  Source: ${parentDir}`);
console.log(`  Destination: ${wwwDir}\n`);

// Copy index.html (Capacitor expects index.html as entry point)
const htmlSrc = path.join(parentDir, 'finanskalkulator.html');
const htmlDest = path.join(wwwDir, 'index.html');
fs.copyFileSync(htmlSrc, htmlDest);
console.log('  Copied: finanskalkulator.html -> index.html');

// Also copy with original name (for manifest.json start_url compatibility)
fs.copyFileSync(htmlSrc, path.join(wwwDir, 'finanskalkulator.html'));
console.log('  Copied: finanskalkulator.html');

// Copy remaining files
for (const file of filesToCopy.filter(f => f !== 'finanskalkulator.html')) {
  const src = path.join(parentDir, file);
  if (fs.existsSync(src)) {
    copyFile(src, path.join(wwwDir, file));
  } else {
    console.warn(`  WARNING: ${file} not found, skipping.`);
  }
}

// Copy directories
for (const dir of dirsToCopy) {
  const src = path.join(parentDir, dir);
  if (fs.existsSync(src)) {
    copyDir(src, path.join(wwwDir, dir));
  } else {
    console.warn(`  WARNING: ${dir}/ not found, skipping.`);
  }
}

console.log('\nBuild complete!');
