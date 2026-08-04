const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    args: ['--no-sandbox', '--ignore-certificate-errors'],
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined,
    proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined,
  });
  const page = await browser.newPage({ viewport: { width: 1200, height: 1400 }, ignoreHTTPSErrors: true });
  const filePath = 'file://' + path.resolve(__dirname, 'cards.html');
  await page.goto(filePath, { waitUntil: 'networkidle', timeout: 60000 });

  const cards = await page.locator('.card').all();
  console.log('cards found:', cards.length);

  for (let i = 0; i < cards.length; i++) {
    const idx = String(i + 1).padStart(2, '0');
    const outPath = path.resolve(__dirname, `2026-08-03_card_${idx}.png`);
    await cards[i].screenshot({ path: outPath });
    console.log('saved', outPath);
  }

  await browser.close();
})().catch(err => {
  console.error(err);
  process.exit(1);
});
