const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const dir = process.argv[2];
  const date = process.argv[3];
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 1400, deviceScaleFactor: 1 });
  await page.goto('file://' + path.join(dir, 'cards.html'), { waitUntil: 'networkidle0', timeout: 60000 });
  await page.evaluate(() => new Promise(r => {
    const imgs = Array.from(document.images);
    let left = imgs.length;
    if (left === 0) return r();
    imgs.forEach(img => {
      if (img.complete) { left--; if (left === 0) r(); }
      else {
        img.addEventListener('load', () => { left--; if (left === 0) r(); });
        img.addEventListener('error', () => { left--; if (left === 0) r(); });
      }
    });
  }));
  const cards = await page.$$('.card');
  for (let i = 0; i < cards.length; i++) {
    const num = String(i + 1).padStart(2, '0');
    const filePath = path.join(dir, `${date}_card_${num}.png`);
    await cards[i].screenshot({ path: filePath });
    console.log('saved', filePath);
  }
  await browser.close();
})();
