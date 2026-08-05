const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    ignoreDefaultArgs: true,
    args: [
      '--headless=new',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--remote-debugging-port=0',
    ],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 1 });
  const filePath = 'file://' + path.join(__dirname, 'cards.html');
  await page.goto(filePath, { waitUntil: 'networkidle0' });

  const cards = await page.$$('.card');
  console.log(`Found ${cards.length} cards`);
  for (let i = 0; i < cards.length; i++) {
    const idx = String(i + 1).padStart(2, '0');
    const outPath = path.join(__dirname, `2026-08-05_card_${idx}.png`);
    await cards[i].screenshot({ path: outPath });
    console.log(`Saved ${outPath}`);
  }

  await browser.close();
})();
