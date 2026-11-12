import { spawn } from 'child_process';
import fs from 'fs';
import http from 'http';
import path from 'path';

const PORT = 8089;
const CHROME_PORT = 9224;
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const server = http.createServer((req, res) => {
  if (req.url === '/poster.jpg') {
    const data = fs.readFileSync(path.resolve('assets/images/loading-poster.jpg'));
    res.writeHead(200, { 'Content-Type': 'image/jpeg' });
    return res.end(data);
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

          // Find red progress bar pixels (high R, low G, low B) in y range 800 to 900
          let minX = 9999, maxX = 0, minY = 9999, maxY = 0;
          const imgData = ctx.getImageData(0, 800, img.width, 100);
          const data = imgData.data;

          for (let y = 0; y < 100; y++) {
            for (let x = 0; x < img.width; x++) {
              const idx = (y * img.width + x) * 4;
              const r = data[idx];
              const g = data[idx+1];
              const b = data[idx+2];
              if (r > 190 && g < 70 && b < 70) {
                const absY = 800 + y;
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (absY < minY) minY = absY;
                if (absY > maxY) maxY = absY;
              }
            }
          }
          window.analysis = {
            width: img.width,
            height: img.height,
            bar: { minX, maxX, minY, maxY, w: maxX - minX, h: maxY - minY },
            barRel: {
              topRel: minY / img.height,
              bottomRel: maxY / img.height,
              leftRel: minX / img.width,
              rightRel: maxX / img.width
            }
          };
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
        await wait(1500);
        const evalRes = await send('Runtime.evaluate', {
          expression: 'JSON.stringify(window.analysis)',
          returnByValue: true
        });
        console.log('📊 Poster Analysis Result:', evalRes?.result?.value);
        ws.close();
        chromeProc.kill();
        server.close();
        process.exit(0);
      }
    } catch (_) { }
  }
  server.close();
  process.exit(1);
});

