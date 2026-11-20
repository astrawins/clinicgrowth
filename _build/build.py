#!/usr/bin/env python3
"""clinicgrowth.gr — build του site (στατικό HTML για GitHub Pages).

  python3 _build/build.py          # γράφει index.html, τις σελίδες ενοτήτων, sitemap.xml, robots.txt, llms.txt
                                   # και ενημερώνει header/footer στις υπόλοιπες σελίδες (κλήση, φόρμες, νομικά, 404)

Μία πηγή αλήθειας: SITE (στοιχεία επιχείρησης) + NAV (μενού) εδώ, κείμενα σελίδων στο content.py,
οι ενότητες που ΔΕΝ αλλάζουν (έργα, online κράτηση, Μυρίλλας, κριτικές) στο partials/.
"""
import html, json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
import content as C  # noqa: E402

V = {'css': 30, 'main': 3, 'work': 16, 'pulse': 1}

SITE = {
    'name': 'clinicgrowth',
    'url': 'https://clinicgrowth.gr',
    'legal': 'ASTRA MARKETING Ι.Κ.Ε.',
    'email': 'info@astramarketing.gr',
    'street': 'Ανδρέα Μπογδάνου 21-23', 'locality': 'Σαρωνικός', 'region': 'Αττική', 'zip': '19013',
    'vat': '803285113',
    'maps': 'https://www.google.com/maps?cid=13580388847976999120',
    'desc': 'Η clinicgrowth φτιάχνει ιστοσελίδες για γιατρούς, κλινικές και κέντρα αισθητικής στην Ελλάδα, με SEO & GEO '
            'και σύστημα αυτόματων κριτικών Google.',
    'og': 'https://clinicgrowth.gr/assets/img/og.png',
    'launch': '2026-11-20',
}
ORG_ID = SITE['url'] + '/#org'
WEB_ID = SITE['url'] + '/#website'


def P(name):
    return (ROOT / '_build' / 'partials' / f'{name}.part').read_text(encoding='utf-8')


def esc(s):
    return html.escape(s, quote=True)


def url(slug):
    return SITE['url'] + ('/' if not slug else f'/{slug}/')


def ld(obj):
    return '<script type="application/ld+json">' + json.dumps(obj, ensure_ascii=False, separators=(',', ':')) + '</script>'


def base_graph():
    return {'@context': 'https://schema.org', '@graph': [
        {'@type': 'ProfessionalService', '@id': ORG_ID, 'name': SITE['name'], 'legalName': SITE['legal'],
         'url': SITE['url'] + '/', 'description': SITE['desc'], 'image': SITE['og'],
         'logo': SITE['url'] + '/assets/img/icon-512.png', 'email': SITE['email'], 'vatID': SITE['vat'],
         'address': {'@type': 'PostalAddress', 'streetAddress': SITE['street'], 'addressLocality': SITE['locality'],
                     'addressRegion': SITE['region'], 'postalCode': SITE['zip'], 'addressCountry': 'GR'},
         'areaServed': {'@type': 'Country', 'name': 'Ελλάδα'}, 'hasMap': SITE['maps'], 'knowsLanguage': ['el', 'en'],
         'knowsAbout': C.KNOWS_ABOUT,
         'aggregateRating': {'@type': 'AggregateRating', 'ratingValue': C.RATING, 'reviewCount': C.REVIEW_COUNT},
         'makesOffer': [{'@type': 'Offer', 'itemOffered': {'@type': 'Service', 'name': p['service'], 'url': url(p['slug'])}}
                        for p in C.PAGES if p.get('service')]},
        {'@type': 'WebSite', '@id': WEB_ID, 'url': SITE['url'] + '/', 'name': SITE['name'], 'inLanguage': 'el',
         'publisher': {'@id': ORG_ID}},
    ]}


def header(current=''):
    links = '\n'.join(
        f'      <a href="/{s}/"{" aria-current=" + chr(34) + "page" + chr(34) if s == current else ""}>{esc(label)}</a>'
        for s, label in C.NAV)
    cur = ' aria-current="page"' if current == 'kleiste-klisi' else ''
    return f'''  <header class="frame-top">
    <div class="cell brand-cell">
      <a href="/" aria-label="clinicgrowth, αρχική" class="wordmark"><img class="mark" src="/assets/img/mark-white.png" alt="" width="54" height="40">clinicgrowth</a>
    </div>
    <button class="menu-btn" aria-expanded="false" aria-controls="site-nav">
      Μενού
      <svg width="16" height="10" viewBox="0 0 16 10" fill="none" aria-hidden="true"><path d="M0 1h16M0 9h16" stroke="currentColor" stroke-width="1.5"/></svg>
    </button>
    <nav class="nav-cells" id="site-nav" aria-label="Κύριο μενού">
{links}
    </nav>
    <a class="cta-cell" href="/kleiste-klisi/"{cur}>Κλείστε κλήση</a>
  </header>'''


def footer():
    cells = '\n'.join(f'      <span class="cell"><a href="/{s}/">{esc(label)}</a></span>' for s, label in C.NAV + C.FOOT_EXTRA)
    return f'''  <footer class="frame-bottom">
    <div class="cells">
      <span class="cell">© 2026 clinicgrowth</span>
{cells}
      <span class="cell"><a href="/kleiste-klisi/">Κλείστε κλήση</a></span>
      <span class="cell grow"></span>
      <span class="cell"><a href="/aporrito/">Απόρρητο</a></span>
      <span class="cell"><a href="/oroi/">Όροι</a></span>
      <span class="cell"><a href="/cookies/">Cookies</a></span>
    </div>
    <div class="fine">
      <span>clinicgrowth · Ιστοσελίδες, SEO &amp; κριτικές Google για γιατρούς · {SITE['legal']} · {SITE['street']}, {SITE['locality']} {SITE['region']}ς {SITE['zip']} · <a href="mailto:{SITE['email']}">{SITE['email']}</a></span>
      <span>clinicgrowth.gr</span>
    </div>
  </footer>'''


FLOAT = ('  <a class="cta-float" href="/kleiste-klisi/" aria-label="Κλείστε κλήση 30 λεπτών"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" '
         'stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M3.5 2h2.2l1.1 2.8-1.4 1a7 7 0 0 0 3.8 3.8l1-1.4 2.8 1.1v2.2a1.5 1.5 0 0 1-1.6 1.5A11 11 0 0 1 2 3.6 1.5 1.5 0 0 1 3.5 2Z"/></svg>Κλείστε κλήση</a>')


def head(title, desc, slug, extra_ld=(), og_image=None):
    u = url(slug)
    img = og_image or SITE['og']
    lds = '\n  '.join([ld(base_graph())] + [ld(x) for x in extra_ld])
    return f'''<!DOCTYPE html>
<html lang="el" class="space night-ink">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{esc(title)}</title>
  <meta name="description" content="{esc(desc)}">
  <link rel="canonical" href="{u}">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <meta name="theme-color" content="#050A18">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="clinicgrowth">
  <meta property="og:title" content="{esc(title)}">
  <meta property="og:description" content="{esc(desc)}">
  <meta property="og:locale" content="el_GR">
  <meta property="og:url" content="{u}">
  <meta property="og:image" content="{img}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="clinicgrowth: ιστοσελίδες, SEO και κριτικές Google για γιατρούς">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{esc(title)}">
  <meta name="twitter:description" content="{esc(desc)}">
  <meta name="twitter:image" content="{img}">
  <link rel="icon" href="/assets/img/icon-512.png" type="image/png" sizes="512x512">
  <link rel="icon" href="/assets/img/favicon-32.png" sizes="32x32" type="image/png">
  <link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
  <link rel="preload" href="/assets/fonts/spline-sans-mono.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/assets/css/main.css">
  <link rel="stylesheet" href="/assets/css/cg.css?v={V['css']}">
  <script src="/assets/js/lenis.min.js" defer></script>
  <script src="/assets/js/main.js?v={V['main']}" defer></script>
  <script src="/assets/js/pulse.js?v={V['pulse']}" defer></script>
  <script src="/assets/js/work.js?v={V['work']}" defer></script>
  {lds}
</head>
<body>

'''


def crumbs_ld(trail):
    return {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': i + 1, 'name': n, 'item': url(s)} for i, (s, n) in enumerate(trail)]}


def faq_html(faq, h2='Συχνές ερωτήσεις'):
    if not faq:
        return ''
    items = '\n'.join(f'          <details class="qa"><summary>{esc(q)}</summary><p>{a}</p></details>' for q, a in faq)
    return f'''    <section class="doc shell faq">
      <div class="wrap">
        <h2>{esc(h2)}</h2>
        <div class="qas">
{items}
        </div>
      </div>
    </section>

'''


def strip_tags(s):
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', '', s))).strip()


def faq_ld(faq):
    return {'@context': 'https://schema.org', '@type': 'FAQPage', 'mainEntity': [
        {'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': strip_tags(a)}} for q, a in faq]}


def close(h2='Να δούμε μαζί το ιατρείο σας;', lede='Μία κλήση 30 λεπτών. Βλέπουμε πού βρίσκεται σήμερα το ιατρείο σας στο Google και σας λέμε με ειλικρίνεια τι θα φτιάχναμε.'):
    return f'''    <section class="close-flood shell">
      <div class="wrap">
        <div>
          <h2>{h2}</h2>
          <p class="lede">{lede}</p>
          <p><a class="btn" href="/kleiste-klisi/">Κλείστε κλήση</a></p>
        </div>
      </div>
    </section>
'''


def related(slugs):
    by = {p['slug']: p for p in C.PAGES}
    cards = '\n'.join(
        f'          <a class="next-card" href="/{s}/"><b>{esc(by[s]["nav"] or by[s]["crumb"])}</b><span>{esc(by[s]["teaser"])}</span></a>'
        for s in slugs if s in by)
    return f'''    <section class="doc shell next">
      <div class="wrap">
        <h2>Δείτε επίσης</h2>
        <div class="next-grid">
{cards}
        </div>
      </div>
    </section>

'''


def render_page(p):
    slug = p['slug']
    trail = [('', 'Αρχική')] + ([(p['parent'], dict(C.NAV + C.FOOT_EXTRA).get(p['parent'], p['parent']))] if p.get('parent') else []) + [(slug, p['crumb'])]
    extra = [crumbs_ld(trail)]
    page_ld = {'@context': 'https://schema.org', '@type': p.get('page_type', 'WebPage'), '@id': url(slug) + '#page', 'url': url(slug),
               'name': p['h1'], 'description': p['desc'], 'inLanguage': 'el', 'isPartOf': {'@id': WEB_ID},
               'about': {'@id': ORG_ID}, 'dateModified': p.get('modified', SITE['launch'])}
    if p.get('service'):
        page_ld['mainEntity'] = {'@type': 'Service', 'name': p['service'], 'serviceType': p['service'], 'provider': {'@id': ORG_ID},
                                 'areaServed': {'@type': 'Country', 'name': 'Ελλάδα'}, 'audience': {'@type': 'Audience', 'audienceType': p.get('audience', 'Γιατροί, κλινικές, κέντρα αισθητικής')},
                                 'description': p['desc'], 'url': url(slug)}
    extra.append(page_ld)
    if p.get('faq'):
        extra.append(faq_ld(p['faq']))
    bc = ' <span aria-hidden="true">/</span> '.join(
        (f'<a href="{"/" if not s else "/" + s + "/"}">{esc(n)}</a>' if s != slug else f'<span aria-current="page">{esc(n)}</span>') for s, n in trail)
    body = [head(p['title'], p['desc'], slug, extra), header(slug), '\n\n  <main>\n']
    body.append(f'''    <section class="page-head shell">
      <div class="wrap">
        <nav class="mono crumbs" aria-label="Διαδρομή">{bc}</nav>
        <h1>{p['h1']}</h1>
        <p class="lede">{p['lede']}</p>
        <p class="hero-cta"><a class="btn" href="/kleiste-klisi/">Κλείστε κλήση</a>{p.get('cta2', '')}</p>
      </div>
    </section>

''')
    for block in p['blocks']:
        kind = block[0]
        if kind == 'partial':
            body.append(C.partial(block[1], P))
        elif kind == 'works':
            body.append(C.works_grid(P, match=block[1], limit=block[2], h2=block[3], more=block[2] is not None or block[1] is not None))
        elif kind == 'reviews':
            body.append(C.reviews_grid(P))
        elif kind == 'html':
            body.append(block[1])
        else:  # ('sec', h2, html)
            body.append(f'''    <section class="doc shell">
      <div class="wrap">
        <h2>{block[1]}</h2>
{block[2]}
      </div>
    </section>

''')
    body.append(faq_html(p.get('faq')))
    if p.get('related'):
        body.append(related(p['related']))
    body.append(close())
    body.append('  </main>\n\n' + FLOAT + '\n\n' + footer() + '\n</body>\n</html>\n')
    out = ROOT / slug / 'index.html'
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(''.join(body), encoding='utf-8')


def render_home():
    h = C.HOME
    extra = [{'@context': 'https://schema.org', '@type': 'WebPage', '@id': url('') + '#page', 'url': url(''), 'name': h['h1'],
              'description': h['desc'], 'inLanguage': 'el', 'isPartOf': {'@id': WEB_ID}, 'about': {'@id': ORG_ID},
              'dateModified': h.get('modified', SITE['launch'])}]
    if h.get('faq'):
        extra.append(faq_ld(h['faq']))
    body = [head(h['title'], h['desc'], '', extra), header(''), '\n\n  <main>\n', C.home_top()]
    body += [C.partial('work', P), C.partial('booking', P), C.partial('myrillas', P), C.partial('reviews', P)]
    body.append(faq_html(h.get('faq')))
    body.append(close())
    body.append('  </main>\n\n' + FLOAT + '\n\n' + footer() + '\n</body>\n</html>\n')
    (ROOT / 'index.html').write_text(''.join(body), encoding='utf-8')


def patch_static():
    """Κλήση, φόρμες, νομικά, 404: ίδιο μενού/footer, σκούρο θέμα, παλμός αντί για αστέρια."""
    for f in ['kleiste-klisi/index.html', 'forma/index.html', 'allages/index.html', 'aporrito/index.html', 'oroi/index.html', 'cookies/index.html', '404.html']:
        path = ROOT / f
        t = path.read_text(encoding='utf-8')
        slug = f.split('/')[0] if '/' in f else ''
        t = re.sub(r'<html lang="el"[^>]*>', '<html lang="el" class="space night-ink">', t, count=1)
        t = re.sub(r'[ \t]*<header class="frame-top">[\s\S]*?</header>', lambda m: header(slug), t, count=1)
        t = re.sub(r'[ \t]*<footer class="frame-bottom">[\s\S]*?</footer>', lambda m: footer(), t, count=1)
        t = re.sub(r'/assets/css/cg\.css(\?v=\d+)?', f"/assets/css/cg.css?v={V['css']}", t)
        t = re.sub(r'/assets/js/main\.js(\?v=\d+)?', f"/assets/js/main.js?v={V['main']}", t)
        t = re.sub(r'\s*<script src="/assets/js/(cx|constellation)\.js[^"]*"[^>]*></script>', '', t)
        if '/assets/js/pulse.js' not in t:
            t = re.sub(r'(<script src="/assets/js/main\.js[^"]*"[^>]*></script>)', r'\1' + f'<script src="/assets/js/pulse.js?v={V["pulse"]}" defer></script>', t, count=1)
            if '/assets/js/pulse.js' not in t:
                t = t.replace('</head>', f'<script src="/assets/js/pulse.js?v={V["pulse"]}" defer></script></head>', 1)
        path.write_text(t, encoding='utf-8')


def write_meta():
    pages = [('', C.HOME.get('modified', SITE['launch']))] + [(p['slug'], p.get('modified', SITE['launch'])) for p in C.PAGES]
    sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    sm += [f'  <url><loc>{url(s)}</loc><lastmod>{m}</lastmod></url>' for s, m in pages]
    sm.append('</urlset>')
    (ROOT / 'sitemap.xml').write_text('\n'.join(sm) + '\n', encoding='utf-8')
    (ROOT / 'robots.txt').write_text('User-agent: *\nAllow: /\n\nSitemap: https://clinicgrowth.gr/sitemap.xml\n', encoding='utf-8')
    (ROOT / 'llms.txt').write_text(C.llms(SITE, url), encoding='utf-8')


if __name__ == '__main__':
    render_home()
    for p in C.PAGES:
        render_page(p)
    patch_static()
    write_meta()
    print(f'✓ αρχική + {len(C.PAGES)} σελίδες, sitemap, robots, llms.txt')
