const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path');
const fs = require('fs');

// Usage: node render_cards.js <outdir> <datePrefix>
const [,, outDir, datePrefix] = process.argv;
const htmlPath = path.join(outDir, 'cards.html');

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
  await page.goto('file://' + path.resolve(htmlPath));
  await page.waitForTimeout(400);
  const cards = await page.$$('.card');
  if (cards.length !== 5) {
    console.error('Expected 5 cards, found', cards.length);
    process.exit(1);
  }
  const outputs = [];
  for (let i = 0; i < cards.length; i++) {
    const fname = `${datePrefix}_card_${String(i + 1).padStart(2, '0')}.png`;
    const outPath = path.join(outDir, fname);
    await cards[i].screenshot({ path: outPath });
    outputs.push(outPath);
  }
  await browser.close();
  console.log(JSON.stringify(outputs));
})();
