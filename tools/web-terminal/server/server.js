const express = require('express');
const { WebSocketServer } = require('ws');
const pty = require('node-pty');
const http = require('http');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('/health', (req, res) => res.json({ status: 'ok' }));

wss.on('connection', (ws) => {
  const shell = process.env.SHELL || '/bin/bash';

  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-256color',
    cols: 80,
    rows: 24,
    cwd: process.env.HOME,
    env: { ...process.env, TERM: 'xterm-256color', COLORTERM: 'truecolor' }
  });

  ptyProcess.onData((data) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: 'output', data }));
    }
  });

  ptyProcess.onExit(({ exitCode }) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: 'exit', exitCode }));
    }
  });

  ws.on('message', (msg) => {
    try {
      const parsed = JSON.parse(msg.toString());
      if (parsed.type === 'input') {
        ptyProcess.write(parsed.data);
      } else if (parsed.type === 'resize') {
        ptyProcess.resize(Math.max(2, parsed.cols), Math.max(2, parsed.rows));
      }
    } catch (e) {
      console.error('Message parse error:', e);
    }
  });

  ws.on('close', () => { try { ptyProcess.kill(); } catch (_) {} });
  ws.on('error', () => { try { ptyProcess.kill(); } catch (_) {} });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n🚀 Web Terminal running at http://localhost:${PORT}`);
  console.log(`📡 WebSocket: ws://localhost:${PORT}\n`);
});
