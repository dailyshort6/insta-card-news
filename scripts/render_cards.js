// usage: node render_cards.js cards.html outdir prefix
// Screenshots each .card at 1080x1350 and prints a QA report (overflow, broken images, placeholders) as JSON.
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const [html, outdir, prefix] = process.argv.slice(2);
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1200, height: 1500 }, deviceScaleFactor: 1 });
  await page.goto('file://' + path.resolve(html), { waitUntil: 'networkidle', timeout: 90000 });
  await page.evaluate(() => document.fonts.ready);
  const report = await page.evaluate(() => [...document.querySelectorAll('.card')].map((c, i) => {
    const r = c.getBoundingClientRect();
    const tw = c.querySelector('.textwrap');
    const imgs = [...c.querySelectorAll('img')].map(im => ({ ok: im.complete && im.naturalWidth > 0, src: im.src.slice(0, 90) }));
    const overflow = [];
    c.querySelectorAll('.textwrap *').forEach(el => {
      const b = el.getBoundingClientRect();
      if (b.width && (b.bottom > r.bottom - 2 || b.right > r.right + 1)) overflow.push(el.className || el.tagName);
    });
    return {
      i: i + 1, w: r.width, h: r.height, imgs,
      overflow: [...new Set(overflow)],
      textOverflow: tw.scrollHeight > tw.clientHeight + 1,
      placeholders: c.innerText.match(/\{[^}]+\}/g) || [],
    };
  }));
  const cards = await page.$$('.card');
  const files = [];
  for (let i = 0; i < cards.length; i++) {
    const f = path.join(outdir, `${prefix}_card_${String(i + 1).padStart(2, '0')}.png`);
    await cards[i].screenshot({ path: f });
    files.push(f);
  }
  console.log(JSON.stringify({ files, report }, null, 1));
  await browser.close();
})();
