const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    args: ['--no-sandbox'],
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  });
  const page = await browser.newPage({ viewport: { width: 1200, height: 1400 } });
  const filePath = 'file://' + path.resolve(__dirname, '2026-08-13_card.html');
  await page.goto(filePath, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const cards = await page.$$('.card');
  for (let i = 0; i < cards.length; i++) {
    const num = String(i + 1).padStart(2, '0');
    const outPath = path.resolve(__dirname, `2026-08-13_card_${num}.png`);
    await cards[i].screenshot({ path: outPath });
    console.log('saved', outPath);
  }

  await browser.close();
})();
