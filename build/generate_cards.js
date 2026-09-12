const fs = require('fs');
const path = require('path');

// Usage: node generate_cards.js <content.json> <outdir> <palette teal> <palette gold>
const [,, contentPath, outDir, teal, gold] = process.argv;
const spec = JSON.parse(fs.readFileSync(contentPath, 'utf8'));

const templatePath = path.resolve(__dirname, '..', 'finance_card_template.html');
const templateSrc = fs.readFileSync(templatePath, 'utf8');

const styleMatch = templateSrc.match(/<style>([\s\S]*?)<\/style>/);
let style = styleMatch[1];
style = style.replace(/--teal:\s*#[0-9A-Fa-f]{6};/, `--teal: ${teal};`);
style = style.replace(/--gold:\s*#[0-9A-Fa-f]{6};/, `--gold: ${gold};`);

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// accent(): text with **word** turned into <span class="accent">word</span>
function accent(s) {
  return esc(s).replace(/\*\*(.+?)\*\*/g, '<span class="accent">$1</span>');
}

function coverCard(c, imgPath, tag) {
  return `
  <div class="card cover">
    <div class="imgwrap">
      <img src="file://${imgPath}" alt="">
      <div class="fade"></div>
      <div class="tag">${esc(tag)}</div>
    </div>
    <div class="textwrap">
      <div class="eyebrow">${esc(c.eyebrow)}</div>
      <div class="heading">${accent(c.headline)}</div>
      <div class="sub">${accent(c.sub)}</div>
    </div>
  </div>`;
}

function entryCard(e, idx, imgPath, pageNum) {
  const items = e.items.map((it, i) => `
        <div class="item">
          <div class="badge">${String(i + 1).padStart(2, '0')}</div>
          <div>
            <div class="t">${accent(it.t)}</div>
            <div class="d">${accent(it.d)}</div>
            ${it.callout ? `<div class="callout">${esc(it.callout)}</div>` : ''}
          </div>
        </div>`).join('');
  return `
  <div class="card">
    <div class="imgwrap">
      <img src="file://${imgPath}" alt="">
      <div class="fade"></div>
    </div>
    <div class="textwrap">
      <div class="eyebrow">ENTRY ${String(idx).padStart(2, '0')}</div>
      <div class="heading">${accent(e.heading)}</div>
      <div class="list">${items}
      </div>
      <div class="page-foot"><span>재테크 카드뉴스</span><span>P.${String(pageNum).padStart(2, '0')}</span></div>
    </div>
  </div>`;
}

function closingCard(cl, imgPath, pageNum) {
  return `
  <div class="card closing">
    <div class="imgwrap">
      <img src="file://${imgPath}" alt="">
      <div class="fade"></div>
    </div>
    <div class="textwrap">
      <div class="eyebrow">SUMMARY</div>
      <div class="heading">${accent(cl.heading)}</div>
      <div class="list">
        <div class="stat-label">${esc(cl.stat_label)}</div>
        <div class="stat">${esc(cl.stat)}</div>
        <div class="cta">${accent(cl.cta)}</div>
      </div>
      <div class="page-foot"><span>재테크 카드뉴스</span><span>P.${String(pageNum).padStart(2, '0')}</span></div>
    </div>
  </div>`;
}

const cardsHtml = [
  coverCard(spec.cover, spec.images[0], spec.tag),
  entryCard(spec.entries[0], 1, spec.images[1], 1),
  entryCard(spec.entries[1], 2, spec.images[2], 2),
  entryCard(spec.entries[2], 3, spec.images[3], 3),
  closingCard(spec.closing, spec.images[4], 4),
].join('\n');

const fullHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>카드뉴스</title>
<style>${style}</style>
</head>
<body>
${cardsHtml}
</body>
</html>`;

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outHtmlPath = path.join(outDir, 'cards.html');
fs.writeFileSync(outHtmlPath, fullHtml, 'utf8');
console.log('Wrote', outHtmlPath);
