const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 1 });
  await page.goto('file://' + path.resolve(__dirname, 'finance_card_template.html'), { waitUntil: 'networkidle0', timeout: 60000 });

  const cards = await page.$$('.card');
  console.log('cards found:', cards.length);
  for (let i = 0; i < cards.length; i++) {
    const num = String(i + 1).padStart(2, '0');
    const filename = `2026-08-29_card_${num}.png`;
    await cards[i].screenshot({ path: filename });
    console.log('saved', filename);
  }
  await browser.close();
})();
