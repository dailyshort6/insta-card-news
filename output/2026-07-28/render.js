const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium',
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 1200, height: 1400 } });
  const filePath = 'file://' + path.resolve(__dirname, 'cards.html');
  await page.goto(filePath, { waitUntil: 'networkidle' });

  const cards = await page.$$('.card');
  console.log(`found ${cards.length} cards`);
  for (let i = 0; i < cards.length; i++) {
    const idx = String(i + 1).padStart(2, '0');
    const outPath = path.resolve(__dirname, `2026-07-28_card_${idx}.png`);
    await cards[i].screenshot({ path: outPath });
    console.log('saved', outPath);
  }

  await browser.close();
})();
