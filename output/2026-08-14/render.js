const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium',
    args: ['--no-sandbox', '--ignore-certificate-errors'],
    proxy: { server: 'http://127.0.0.1:37199' },
  });
  const page = await browser.newPage({ viewport: { width: 1200, height: 1400 } });
  page.on('console', msg => console.log('CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('PAGEERROR:', err.message));
  page.on('requestfailed', req => console.log('REQFAILED:', req.url(), req.failure() && req.failure().errorText));
  page.on('response', res => { if (res.url().includes('unsplash')) console.log('RESPONSE:', res.status(), res.url()); });
  const filePath = 'file://' + path.resolve(__dirname, 'card.html');
  await page.goto(filePath, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1000);

  const cards = await page.$$('.card');
  console.log('cards found:', cards.length);
  for (let i = 0; i < cards.length; i++) {
    const num = String(i + 1).padStart(2, '0');
    const outPath = path.resolve(__dirname, `2026-08-14_card_${num}.png`);
    await cards[i].screenshot({ path: outPath });
    console.log('saved', outPath);
  }

  await browser.close();
})();
