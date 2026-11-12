import { spawn } from 'child_process';
import fs from 'fs';
import http from 'http';
import path from 'path';

const DIST_DIR = path.resolve('dist');
const PORT = 8087;
const CHROME_PORT = 9226;
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\pc\\.gemini\\antigravity\\brain\\8bdf88ee-e53e-490a-846d-5b4aae7b2a95';

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.wasm': 'application/wasm',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  let filePath = path.join(DIST_DIR, reqPath);

  if (!fs.existsSync(filePath)) {
    // Search recursively in dist for the filename
    const base = path.basename(reqPath);
    const findFile = (dir) => {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        const full = path.join(dir, item.name);
        if (item.isDirectory()) {
          const found = findFile(full);
          if (found) return found;
        } else if (item.name === base) {
          return full;
        }
      }
      return null;
    };
    const found = findFile(DIST_DIR);
    if (found) {
      filePath = found;
    } else if (!path.extname(reqPath) || path.extname(reqPath) === '.html') {
      filePath = path.join(DIST_DIR, 'index.html');
    } else {
      console.log('404:', reqPath);
      res.writeHead(404);
      return res.end('Not Found: ' + reqPath);
    }
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  } catch (err) {
    console.log('500:', reqPath, err.message);
    res.writeHead(500);
    res.end('Server Error: ' + err.message);
  }
});

server.listen(PORT, async () => {
  console.log(`🌐 Server listening at http://localhost:${PORT}`);
  const tempUserDataDir = path.join(process.env.TEMP || 'C:\\Temp', 'chrome_cdp_loading_' + Date.now());
  fs.mkdirSync(tempUserDataDir, { recursive: true });

  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${CHROME_PORT}`,
    `--user-data-dir=${tempUserDataDir}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `http://localhost:${PORT}/intro`,
  ]);

  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  const cleanup = () => {
    try {
      chromeProc.kill();
      server.close();
      fs.rmSync(tempUserDataDir, { recursive: true, force: true });
    } catch (_) { }
  };

  for (let i = 0; i < 20; i++) {
    await wait(350);
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
          if (msg.method === 'Runtime.consoleAPICalled') {
            console.log('Browser console:', msg.params.type, msg.params.args.map(a => a.value || a.description).join(' '));
          }
          if (msg.method === 'Network.loadingFailed') {
            console.log('Network loadingFailed:', msg.params.errorText, msg.params.requestId);
          }
        };
        const send = (method, params = {}) => new Promise(r => {
          const id = idCounter++;
          pending.set(id, r);
          ws.send(JSON.stringify({ id, method, params }));
        });

        await send('Runtime.enable');
        await send('Page.enable');
        await send('Network.enable');

        // Poll until loading screen element mounts (max 8s)
        console.log('⏳ Polling for loading screen to render...');
        let checkDom = null;
        for (let attempt = 0; attempt < 25; attempt++) {
          await wait(300);
          const evalRes = await send('Runtime.evaluate', {
            expression: `
              (() => {
                const text = document.body.innerText;
                const imgTags = Array.from(document.querySelectorAll('img')).map(i => ({ src: i.src, naturalWidth: i.naturalWidth, naturalHeight: i.naturalHeight }));
                return { hasSkip: text.includes('SKIP'), imgCount: imgTags.length, imgTags, snippet: text.slice(0, 100) };
              })()
            `,
            returnByValue: true
          });
          const val = evalRes?.result?.value;
          if (val && (val.hasSkip || val.imgCount > 0)) {
            checkDom = val;
            await wait(1000);
            break;
          }
        }
        console.log('📱 Loading Page Check:', JSON.stringify(checkDom, null, 2));

        // Capture screenshot of the live loading page
        const screenshot = await send('Page.captureScreenshot', { format: 'png' });
        if (screenshot?.data) {
          const screenshotPath = path.join(ARTIFACT_DIR, 'loading-screen-preview.png');
          fs.writeFileSync(screenshotPath, screenshot.data, 'base64');
          console.log('📸 Loading page screenshot saved to:', screenshotPath);
        }

        ws.close();
        cleanup();
        process.exit(0);
      }
    } catch (_) { }
  }
  cleanup();
  process.exit(1);
});
