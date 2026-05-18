// IndexNow ping для audit.chimitdorzhi.tech
// Yandex быстро узнаёт о новых/обновлённых страницах.
// Run: node tools/indexnow-ping.js

const https = require('https');

const KEY = '05a87ff2185b8c857c16ea753dba0b13';
const HOST = 'audit.chimitdorzhi.tech';

const body = JSON.stringify({
  host: HOST,
  key: KEY,
  keyLocation: `https://${HOST}/${KEY}.txt`,
  urlList: [
    `https://${HOST}/`,
    `https://${HOST}/security/`,
    `https://${HOST}/legal/`,
    `https://${HOST}/sitemap.xml`,
  ],
});

const req = https.request({
  hostname: 'yandex.com',
  path: '/indexnow',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  },
}, (res) => {
  let data = '';
  res.on('data', (c) => { data += c; });
  res.on('end', () => {
    console.log(`Yandex IndexNow: HTTP ${res.statusCode}`);
    if (data) console.log(data);
  });
});
req.on('error', (e) => console.error('error:', e.message));
req.write(body);
req.end();
