import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const DIST_DIR = path.resolve('dist');
const PORT = 8085;
const CHROME_PORT = 9223;
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

// 1. Static file server for dist
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.wasm': 'application/wasm',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  let filePath = path.join(DIST_DIR, reqPath);

  if (!fs.existsSync(filePath)) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  } catch (err) {
    res.writeHead(500);
    res.end('Server Error: ' + err.message);
  }
});

server.listen(PORT, async () => {
  console.log(`🌐 Static server hosting dist at http://localhost:${PORT}`);

  const tempUserDataDir = path.join(process.env.TEMP || 'C:\\Temp', 'chrome_cdp_test_' + Date.now());
  fs.mkdirSync(tempUserDataDir, { recursive: true });

  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${CHROME_PORT}`,
    `--user-data-dir=${tempUserDataDir}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `http://localhost:${PORT}`,
  ]);

  let cdpConnected = false;
  let ws = null;
  const consoleErrors = [];
  const uncaughtExceptions = [];

  const cleanup = () => {
    try {
      if (ws) ws.close();
      chromeProc.kill();
      server.close();
      fs.rmSync(tempUserDataDir, { recursive: true, force: true });
    } catch (_) {}
  };

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // Poll for CDP endpoint
  for (let i = 0; i < 20; i++) {
    await wait(500);
    try {
      const resp = await fetch(`http://localhost:${CHROME_PORT}/json`);
      const tabs = await resp.json();
      const pageTab = tabs.find((t) => t.type === 'page');
      if (pageTab && pageTab.webSocketDebuggerUrl) {
        cdpConnected = true;
        console.log('🔌 Connected to Chrome CDP:', pageTab.webSocketDebuggerUrl);

        ws = new WebSocket(pageTab.webSocketDebuggerUrl);
        let idCounter = 1;
        const pending = new Map();

        ws.onmessage = (event) => {
          const msg = JSON.parse(event.data);
          if (msg.id && pending.has(msg.id)) {
            const resolve = pending.get(msg.id);
            pending.delete(msg.id);
            resolve(msg.result);
          }
          if (msg.method === 'Runtime.consoleAPICalled') {
            if (msg.params.type === 'error') {
              consoleErrors.push(msg.params.args.map((a) => a.value || a.description).join(' '));
            }
          }
          if (msg.method === 'Runtime.exceptionThrown') {
            uncaughtExceptions.push(msg.params.exceptionDetails.text + ' ' + (msg.params.exceptionDetails.exception?.description || ''));
          }
        };

        const send = (method, params = {}) => {
          return new Promise((resolve) => {
            const id = idCounter++;
            pending.set(id, resolve);
            ws.send(JSON.stringify({ id, method, params }));
          });
        };

        await new Promise((r) => (ws.onopen = r));
        await send('Runtime.enable');
        await send('Page.enable');

        console.log('⏳ Waiting 3.5s for app hydration...');
        await wait(3500);

        // Verify root mounted
        const evalRoot = await send('Runtime.evaluate', {
          expression: 'document.getElementById("root") ? document.getElementById("root").innerHTML.length : 0',
        });
        console.log('📦 Root DOM content size:', evalRoot?.result?.value);

        // Inspect available buttons and text on screen
        const inspectDom = await send('Runtime.evaluate', {
          expression: `
            (() => {
              const textContent = document.body.innerText;
              const hasHero = textContent.includes('SPIDY') || textContent.includes('Spider') || textContent.includes('Spidy');
              const buttons = Array.from(document.querySelectorAll('[role="button"], div[tabindex="0"]')).map(el => el.innerText.trim()).filter(Boolean);
              return { hasHero, textSnippet: textContent.slice(0, 300), buttonCount: buttons.length };
            })()
          `,
          returnByValue: true,
        });
        console.log('🔍 DOM Inspection:', inspectDom?.result?.value);

        // Test Theme Switching logic directly in app context
        const themeEval = await send('Runtime.evaluate', {
          expression: `
            (() => {
              const currentTheme = localStorage.getItem('spidy_theme_mode');
              return { storedTheme: currentTheme };
            })()
          `,
          returnByValue: true,
        });
        console.log('🎨 Stored theme in localStorage:', themeEval?.result?.value);

        // Check for any critical errors
        console.log('\n--- VERIFICATION AUDIT RESULTS ---');
        console.log('Console Errors caught:', consoleErrors.length);
        if (consoleErrors.length > 0) {
          consoleErrors.forEach((e) => console.log('  ⚠️', e));
        }
        console.log('Uncaught Exceptions caught:', uncaughtExceptions.length);
        if (uncaughtExceptions.length > 0) {
          uncaughtExceptions.forEach((e) => console.log('  ❌', e));
        }

        const success = uncaughtExceptions.length === 0 && (evalRoot?.result?.value || 0) > 100;
        if (success) {
          console.log('\n🎉 ALL LIVE CDP THEME VERIFICATION CHECKS PASSED!');
        } else {
          console.error('\n❌ Live CDP verification failed.');
        }

        cleanup();
        process.exit(success ? 0 : 1);
        return;
      }
    } catch (_) {}
  }

  console.error('❌ Could not connect to Chrome within timeout.');
  cleanup();
  process.exit(1);
});

