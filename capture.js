'use strict';

const fs = require('fs');
const child_process = require('child_process');
const path = require('path');

if (process.argv.length < 3) {
  console.log(`usage: node ./capture.js [har file]`);
  return;
}

const sitesDir = `${__dirname}/sites`;
const getDomains = () => fs.readdirSync(sitesDir).filter(domain => domain !== '.gitkeep');

// print nginx, etc/hosts config
const hostsConfig = domain => `127.0.0.1\t${domain}`;
const printConfig = () => {
  const domains = getDomains();
  console.log(`/etc/hosts:

${domains.map(hostsConfig).join('\n')}

nginx settings:

server {
  listen 80;
  root ${sitesDir}/$host;
  index index.html;

  location / {
    try_files $uri $uri?$args $uri/ =404;
  }
}
`);
};

// wget sites
const file = process.argv[2];
const data = JSON.parse(fs.readFileSync(file));
const entries = data.log.entries;
const next = () => {
  if (entries.length === 0) {
    printConfig();
    return;
  }
  const entry = entries.pop();

  if (entry.response && entry.response.content && entry.response.content.text) {
    const content = entry.response.content;
    const text = new Buffer(content.text, content.encoding === 'base64' ? 'base64' : '');
    let paths = entry.request.url.match(/^https?:\/\/(.+)$/)[1];
    if (paths[paths.length - 1] === '/') { paths += 'index.html'; }
    const child = child_process.spawn('mkdir', ['-p', path.dirname(paths)], { cwd: sitesDir });
    child.on('close', () => {
      fs.writeFileSync(path.join(sitesDir, paths), text);
      next();
    });
  } else {
    const child = child_process.spawn('wget', ['-x', entry.request.url], { cwd: sitesDir });
    child.on('close', next);
  }
};
next();
