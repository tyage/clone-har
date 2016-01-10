const fs = require('fs');
const child_process = require('child_process');

if (process.argv.length < 3) {
  console.log(`usage: node ./capture.js [har file]`);
  return;
}

const sitesDir = `${process.cwd()}/sites`;
const getDomains = () => fs.readdirSync(sitesDir).filter(domain => domain !== '.gitkeep');

// print nginx, etc/hosts config
const hostsConfig = domain => `127.0.0.1\t${domain}`;
const nginxConfig = domain => `server {
  listen 80;
  server_name ${domain};

  root ${sitesDir}/${domain};
  index index.html;

  location / {
    try_files $uri $uri/ =404;
  }
}`;
const printConfig = () => {
  const domains = getDomains();
  console.log(`/etc/hosts:

${domains.map(hostsConfig).join('\n')}

nginx settings:

${domains.map(nginxConfig).join('\n')}
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
  const child = child_process.spawn('wget', ['-x', entry.request.url], { cwd: sitesDir });
  child.on('close', next);
};
next();
