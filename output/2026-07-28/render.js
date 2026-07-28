const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy;
  console.log('using proxy', proxyUrl);
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 1200, height: 1400 } });
  page.on('requestfailed', req => console.log('FAILED:', req.url(), req.failure()?.errorText));
  page.on('response', res => { if (!res.ok()) console.log('BAD RESPONSE:', res.status(), res.url()); });
  const filePath = 'file://' + path.resolve(__dirname, 'cards.html');
  await page.goto(filePath, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const cards = await page.$$('.card');
  console.log('found cards:', cards.length);
  for (let i = 0; i < cards.length; i++) {
    const num = String(i + 1).padStart(2, '0');
    const outPath = path.resolve(__dirname, `2026-07-28_card_${num}.png`);
    await cards[i].screenshot({ path: outPath });
    console.log('saved', outPath);
  }

  await browser.close();
})();
