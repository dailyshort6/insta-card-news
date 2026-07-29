const { chromium } = require('playwright');
const path = require('path');

const DATE = process.argv[2];
const OUTDIR = process.argv[3];

(async () => {
  const proxyServer = process.env.HTTPS_PROXY || process.env.https_proxy;
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium',
    args: [
      '--no-sandbox',
      ...(proxyServer ? [`--proxy-server=${proxyServer}`] : []),
      '--ssl-version-max=tls1.2', // interception proxy resets TLS1.3 handshakes from Chromium; TLS1.2 avoids it
    ],
  });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
  await page.goto('file://' + path.resolve(__dirname, 'finance_card_template.html'));
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(300);
  const cards = await page.$$('.card');
  for (let i = 0; i < cards.length; i++) {
    const num = String(i + 1).padStart(2, '0');
    const file = path.join(OUTDIR, `${DATE}_card_${num}.png`);
    await cards[i].screenshot({ path: file });
    console.log(file);
  }
  await browser.close();
})();
