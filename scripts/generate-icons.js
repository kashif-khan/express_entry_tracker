// Simple script to create basic PNG icons for PWA
const fs = require('fs');
const path = require('path');

console.log('\x1b[36m%s\x1b[0m', '🎨 Creating PWA Icons...\n');

// Create a simple HTML file that can generate the icons using canvas
const htmlGenerator = `<!DOCTYPE html>
<html>
<head>
  <title>PWA Icon Generator</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
    canvas { border: 1px solid #ccc; margin: 10px 0; }
    button { padding: 10px 20px; margin: 10px; background: #3b82f6; color: white; border: none; cursor: pointer; }
    button:hover { background: #2563eb; }
  </style>
</head>
<body>
  <h1>PWA Icon Generator</h1>
  <p>This will generate the icons needed for your PWA</p>

  <h3>192x192 Icon</h3>
  <canvas id="canvas192" width="192" height="192"></canvas>
  <button onclick="download('canvas192', 'icon-192.png')">Download 192x192</button>

  <h3>512x512 Icon</h3>
  <canvas id="canvas512" width="512" height="512"></canvas>
  <button onclick="download('canvas512', 'icon-512.png')">Download 512x512</button>

  <script>
    function createIcon(canvasId, size) {
      const canvas = document.getElementById(canvasId);
      const ctx = canvas.getContext('2d');

      // Blue background
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(0, 0, size, size);

      // White text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold ' + (size * 0.4) + 'px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('EE', size / 2, size / 2);
    }

    function download(canvasId, filename) {
      const canvas = document.getElementById(canvasId);
      const link = document.createElement('a');
      link.download = filename;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }

    // Generate icons on load
    createIcon('canvas192', 192);
    createIcon('canvas512', 512);
  </script>
</body>
</html>`;

// Save the HTML file
const htmlPath = path.join(__dirname, '..', 'public', 'generate-icons.html');
fs.writeFileSync(htmlPath, htmlGenerator);

console.log('\x1b[32m%s\x1b[0m', '✅ Icon generator created!\n');
console.log('To create your PWA icons:\n');
console.log('1. Start your development server: npm run dev');
console.log('2. Open: http://localhost:3000/generate-icons.html');
console.log('3. Click the download buttons to save the icons');
console.log('4. The icons will be downloaded to your Downloads folder');
console.log('5. Move them to the public folder\n');
console.log('\x1b[33m%s\x1b[0m', 'Alternative: Use an online tool like https://www.pwabuilder.com/imageGenerator\n');
