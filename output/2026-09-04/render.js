const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium',
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 1200, height: 1400 } });
  const fileUrl = 'file://' + path.resolve(__dirname, 'cards.html');
  await page.goto(fileUrl, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);

  const cards = await page.$$('.card');
  console.log('found cards:', cards.length);
  for (let i = 0; i < cards.length; i++) {
    const num = String(i + 1).padStart(2, '0');
    const outPath = path.resolve(__dirname, `2026-09-04_card_${num}.png`);
    await cards[i].screenshot({ path: outPath });
    console.log('saved', outPath);
  }

  await browser.close();
})();
