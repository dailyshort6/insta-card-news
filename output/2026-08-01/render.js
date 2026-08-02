const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1200, height: 1400 } });
  page.on('requestfailed', r => console.log('FAILED', r.url(), r.failure()));
  const fileUrl = 'file://' + path.resolve(__dirname, 'cards.html');
  await page.goto(fileUrl, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1000);

  const cards = await page.$$('.card');
  console.log('found cards:', cards.length);
  for (let i = 0; i < cards.length; i++) {
    const n = String(i + 1).padStart(2, '0');
    const outPath = path.resolve(__dirname, `2026-08-01_card_${n}.png`);
    await cards[i].screenshot({ path: outPath });
    console.log('saved', outPath);
  }

  await browser.close();
})();
