const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    args: [
      '--no-sandbox',
      '--proxy-server=127.0.0.1:33791',
      '--ignore-certificate-errors',
    ],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 1 });
  const filePath = 'file://' + path.resolve(__dirname, 'finance_card_template.html');
  await page.goto(filePath, { waitUntil: 'networkidle0', timeout: 60000 });

  const cards = await page.$$('.card');
  console.log('cards found:', cards.length);

  const date = '2026-07-29';
  for (let i = 0; i < cards.length; i++) {
    const num = String(i + 1).padStart(2, '0');
    const outPath = path.resolve(__dirname, `${date}_card_${num}.png`);
    await cards[i].screenshot({ path: outPath });
    console.log('saved', outPath);
  }

  await browser.close();
})();
