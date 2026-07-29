const puppeteer = require('puppeteer');
const path = require('path');

async function main() {
  const [,, htmlPath, outDir, datePrefix] = process.argv;
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  const args = ['--no-sandbox', '--disable-setuid-sandbox'];
  if (proxy) {
    args.push(`--proxy-server=${proxy}`);
    args.push('--ignore-certificate-errors');
  }
  const browser = await puppeteer.launch({ args });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 1 });
  await page.goto('file://' + path.resolve(htmlPath), { waitUntil: 'networkidle0', timeout: 60000 });

  const cards = await page.$$('.card');
  console.log(`found ${cards.length} cards`);
  for (let i = 0; i < cards.length; i++) {
    const n = String(i + 1).padStart(2, '0');
    const outPath = path.join(outDir, `${datePrefix}_card_${n}.png`);
    await cards[i].screenshot({ path: outPath });
    console.log('saved', outPath);
  }

  await browser.close();
}

main().catch(err => { console.error(err); process.exit(1); });
