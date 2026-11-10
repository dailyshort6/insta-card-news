"""Build card HTML from finance_card_template.html style + content JSON.
usage: python3 build_cards.py content.json out.html
content.json: {palette:{teal,gold}, cover:{img,tag,eyebrow,heading,sub},
  entries:[{img,eyebrow,heading,items:[{t,d,callout?}]}],
  closing:{img,eyebrow,heading,stat_label,stat,cta}, foot}
heading/sub/cta strings may contain <br> and <span class="accent">.
"""
import json, re, sys, html, pathlib

root = pathlib.Path(__file__).resolve().parent.parent
tpl = (root / "finance_card_template.html").read_text(encoding="utf-8")
style = re.search(r"<style>.*?</style>", tpl, re.S).group(0)
c = json.load(open(sys.argv[1], encoding="utf-8"))
p = c["palette"]
style = re.sub(r"--teal:\s*#[0-9A-Fa-f]+;", f"--teal: {p['teal']};", style)
style = re.sub(r"--gold:\s*#[0-9A-Fa-f]+;", f"--gold: {p['gold']};", style)
# callout tint follows the palette gold
style = style.replace("rgba(168,114,30,0.10)", "color-mix(in srgb, var(--gold) 10%, transparent)")
style = style.replace("rgba(168,114,30,0.35)", "color-mix(in srgb, var(--gold) 35%, transparent)")
e = html.escape
foot = e(c.get("foot", "재테크 카드뉴스"))

cv = c["cover"]
cards = [f'''<div class="card cover"><div class="imgwrap"><img src="{e(cv['img'])}" alt=""><div class="fade"></div><div class="tag">{e(cv['tag'])}</div></div>
<div class="textwrap"><div class="eyebrow">{e(cv['eyebrow'])}</div><div class="heading">{cv['heading']}</div><div class="sub">{cv['sub']}</div></div></div>''']

for i, en in enumerate(c["entries"], 1):
    assert len(en["items"]) <= 4, "max 4 items per card"
    items = ""
    for j, it in enumerate(en["items"], 1):
        call = f'<div class="callout">{e(it["callout"])}</div>' if it.get("callout") else ""
        items += (f'<div class="item"><div class="badge">{j:02d}</div><div><div class="t">{e(it["t"])}</div>'
                  f'<div class="d">{e(it["d"])}</div>{call}</div></div>')
    cards.append(f'''<div class="card"><div class="imgwrap"><img src="{e(en['img'])}" alt=""><div class="fade"></div></div>
<div class="textwrap"><div class="eyebrow">{e(en['eyebrow'])}</div><div class="heading">{en['heading']}</div><div class="list">{items}</div>
<div class="page-foot"><span>{foot}</span><span>P.{i:02d}</span></div></div></div>''')

cl = c["closing"]
cards.append(f'''<div class="card closing"><div class="imgwrap"><img src="{e(cl['img'])}" alt=""><div class="fade"></div></div>
<div class="textwrap"><div class="eyebrow">{e(cl['eyebrow'])}</div><div class="heading">{cl['heading']}</div><div class="list"><div class="stat-label">{e(cl['stat_label'])}</div><div class="stat">{e(cl['stat'])}</div><div class="cta">{cl['cta']}</div></div>
<div class="page-foot"><span>{foot}</span><span>P.{len(c['entries'])+1:02d}</span></div></div></div>''')

out = (f'<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><title>cards</title>{style}</head><body>\n'
       + "\n".join(cards) + "\n</body></html>")
open(sys.argv[2], "w", encoding="utf-8").write(out)
print("cards:", len(cards))
