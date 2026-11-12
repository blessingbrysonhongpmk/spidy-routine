import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const PORT = 8092;
const CHROME_PORT = 9223;
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

          // Let's find horizontal lines or boundaries of the progress bar track:
          // In y range 820 to 870:
          const yRange = [];
          for (let y = 820; y <= 860; y++) {
            let rowRedCount = 0;
            let rowWhiteCount = 0;
            let firstX = -1, lastX = -1;
            for (let x = 80; x < 460; x++) {
              const pixel = ctx.getImageData(x, y, 1, 1).data;
              if (pixel[0] > 180 && pixel[1] < 80 && pixel[2] < 80) {
                rowRedCount++;
                if (firstX === -1) firstX = x;
                lastX = x;
              }
              if (pixel[0] > 200 && pixel[1] > 200 && pixel[2] > 200) {
                rowWhiteCount++;
              }
            }
            if (rowRedCount > 10 || rowWhiteCount > 5) {
              yRange.push({ y, rowRedCount, rowWhiteCount, firstX, lastX });
            }
          }
          window.measurements = {
            width: img.width,
            height: img.height,
            rows: yRange
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
    await wait(300);
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
        await wait(500);

        const res = await send('Runtime.evaluate', {
          expression: 'JSON.stringify(window.measurements)',
        });

        console.log('MEASUREMENTS:', res?.result?.value);
        ws.close();
        chromeProc.kill();
        server.close();
        process.exit(0);
      }
    } catch (_) {}
  }
  chromeProc.kill();
  server.close();
  process.exit(1);
});
