import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const PORT = 8091;
const CHROME_PORT = 9225;
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const server = http.createServer((req, res) => {
  if (req.url === '/poster.jpg') {
    const data = fs.readFileSync(path.resolve('assets/images/loading-poster.jpg'));
    res.writeHead(200, { 'Content-Type': 'image/jpeg' });
    return res.end(data);
  }
  if (req.url === '/save-clean' && req.method === 'POST') {
    let body = [];
    req.on('data', chunk => body.push(chunk));
    req.on('end', () => {
      const dataUri = Buffer.concat(body).toString();
      const base64Data = dataUri.replace(/^data:image\/jpeg;base64,/, '');
      fs.writeFileSync(path.resolve('assets/images/loading-poster-clean.jpg'), base64Data, 'base64');
      res.writeHead(200);
      res.end('saved');
    });
    return;
  }
  const html = `
    <!DOCTYPE html>
    <html>
    <body>
      <canvas id="c"></canvas>
      <script>
        const img = new Image();
        img.src = '/poster.jpg';
        img.onload = () => {
          const c = document.getElementById('c');
          c.width = img.width;
          c.height = img.height;
          const ctx = c.getContext('2d');
          ctx.drawImage(img, 0, 0);

          // Clean the region where "Initializing Your Mission...", the progress bar, and "72%" sit:
          // y = 805 to 872
          // Sample the dark rocky background from y=795 and y=885
          // We can create a seamless atmospheric patch with dark radial / linear gradient
          // with subtle red tone on left (rgb 20, 10, 12) and dark blue on right (rgb 8, 14, 25)
          const grad = ctx.createLinearGradient(0, 805, img.width, 872);
          grad.addColorStop(0, '#10080B');
          grad.addColorStop(0.3, '#0B090F');
          grad.addColorStop(0.7, '#080C14');
          grad.addColorStop(1, '#070D18');

          ctx.save();
          // Feather edges
          ctx.fillStyle = grad;
          // Apply with subtle dark blend
          ctx.fillRect(40, 808, img.width - 80, 62);

          // Add a soft feather around the patch
          ctx.filter = 'blur(6px)';
          ctx.fillRect(35, 805, img.width - 70, 68);
          ctx.restore();

          // Save the clean poster
          const dataUri = c.toDataURL('image/jpeg', 0.95);
          fetch('/save-clean', { method: 'POST', body: dataUri }).then(() => {
            window.done = true;
          });
        };
      </script>
    </body>
    </html>
  `;
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(html);
});

server.listen(PORT, async () => {
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${CHROME_PORT}`,
    '--disable-gpu',
    `http://localhost:${PORT}`,
  ]);

  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  for (let i = 0; i < 20; i++) {
    await wait(400);
    try {
      const resp = await fetch(`http://localhost:${CHROME_PORT}/json`);
      const tabs = await resp.json();
      const pageTab = tabs.find(t => t.type === 'page');
      if (pageTab && pageTab.webSocketDebuggerUrl) {
        const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
        await new Promise(r => ws.onopen = r);
        let idCounter = 1;
        const pending = new Map();
        ws.onmessage = e => {
          const msg = JSON.parse(e.data);
          if (msg.id && pending.has(msg.id)) {
            pending.get(msg.id)(msg.result);
          }
        };
        const send = (method, params = {}) => new Promise(r => {
          const id = idCounter++;
          pending.set(id, r);
          ws.send(JSON.stringify({ id, method, params }));
        });

        await send('Runtime.enable');
        for (let j = 0; j < 15; j++) {
          await wait(300);
          const evalRes = await send('Runtime.evaluate', { expression: 'window.done' });
          if (evalRes?.result?.value === true) {
            console.log('✅ Clean poster generated and saved to assets/images/loading-poster-clean.jpg');
            ws.close();
            chromeProc.kill();
            server.close();
            process.exit(0);
          }
        }
      }
    } catch (_) {}
  }
  server.close();
  process.exit(1);
});

