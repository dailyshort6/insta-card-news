const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox', '--proxy-server=http://127.0.0.1:42331', '--ssl-version-max=tls1.2'],
  });
  const page = await browser.newPage({ viewport: { width: 1160, height: 1400 }, ignoreHTTPSErrors: true });
  const filePath = 'file://' + path.resolve(__dirname, 'cards.html');
  await page.goto(filePath, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1500);

  const cards = await page.$$('.card');
  console.log(`found ${cards.length} cards`);
  for (let i = 0; i < cards.length; i++) {
    const n = String(i + 1).padStart(2, '0');
    const outPath = path.resolve(__dirname, `2026-08-25_card_${n}.png`);
    await cards[i].screenshot({ path: outPath });
    console.log('saved', outPath);
  }

  await browser.close();
})();
