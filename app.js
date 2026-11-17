const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
app.use(express.json({ limit: '64kb' }));
const DATA = path.join(__dirname, 'data.json');
let store = { seq: 0, boards: {} };
try {
  const parsed = JSON.parse(fs.readFileSync(DATA, 'utf8'));
  if (parsed && parsed.boards) store = parsed;
} catch (e) {}
function save() { try { fs.writeFileSync(DATA, JSON.stringify(store)); } catch (e) {} }
app.get('/', (req, res) => res.type('text').send('board ok'));
app.post('/b/:key', (req, res) => {
  const body = req.body || {};
  if (!body.from || !body.text) return res.status(400).json({ error: 'from and text required' });
  const key = String(req.params.key);
  if (!store.boards[key]) store.boards[key] = [];
  const msg = { id: ++store.seq, ts: Date.now(), from: String(body.from).slice(0, 40), text: String(body.text).slice(0, 4000) };
  store.boards[key].push(msg);
  if (store.boards[key].length > 500) store.boards[key] = store.boards[key].slice(-500);
  save();
  res.json({ id: msg.id });
});
app.get('/b/:key', (req, res) => {
  const key = String(req.params.key);
  const list = store.boards[key] || [];
  res.type('application/x-ndjson').send(list.map(m => JSON.stringify(m)).join('\n') + (list.length ? '\n' : ''));
});
const port = process.env.PORT || 3000;
app.listen(port, () => console.log('board listening on ' + port));
