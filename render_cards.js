const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium',
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
  page.on('requestfailed', (req) => {
    console.error('FAILED:', req.url(), req.failure() && req.failure().errorText);
  });
  const filePath = 'file://' + path.resolve(__dirname, '2026-08-26_cards.html');
  await page.goto(filePath, { waitUntil: 'networkidle' });
  const cards = await page.$$('.card');
  for (let i = 0; i < cards.length; i++) {
    const num = String(i + 1).padStart(2, '0');
    await cards[i].screenshot({ path: `2026-08-26_card_${num}.png` });
    console.log(`saved 2026-08-26_card_${num}.png`);
  }
  await browser.close();
})();
