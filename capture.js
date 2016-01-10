const fs = require('fs');
const child_process = require('child_process');

if (process.argv.length < 1) {
  console.log(`usage: node ./capture.js [har file]`);
  return;
}

const file = process.argv[0];
const data = JSON.parse(fs.readFileSync(file));
const entries = data.log.entries;
const next = () => {
  if (entries.length === 0) {
    return;
  }
  const entry = entries.pop();
  const child = child_process.spawn('wget', ['-x', entry.request.url]);
  child.on('close', next);
};
next();
