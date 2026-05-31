#!/usr/bin/env python3
# Legg til "Budsjett" som FORSTE fane i nav-baren paa alle kanoniske sider,
# for aa matche master-designet (Subpage Preview.html). Kirurgisk tekst-innsetting
# (additiv — reserialiserer IKKE hele fila). Idempotent + variant-bevisst.
import os, sys

ROOT = os.path.dirname(os.path.abspath(__file__)).rsplit(os.sep, 1)[0]  # repo root (parent of _dev)
DRY = '--apply' not in sys.argv

EXCLUDE_DIRS = {'_incoming', '_arkiv', '_dev', '.git', 'node_modules', '.claude'}
FOREIGN = {'ar', 'en', 'fr', 'lt', 'pl', 'so', 'ti', 'uk', 'zh'}

ICON = ('<svg{cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" '
        'stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="14" rx="1.5"/>'
        '<line x1="3.5" y1="9.5" x2="20.5" y2="9.5"/><line x1="7" y1="13" x2="11" y2="13"/>'
        '<line x1="7" y1="16" x2="9" y2="16"/><line x1="15" y1="13" x2="17" y2="13"/>'
        '<line x1="15" y1="16" x2="17" y2="16"/></svg>')

def tab_block(is_landing, selected):
    if is_landing:
        sel = 'true' if selected else 'false'
        open_a = ('<a href="/personlig/budsjett/" class="tab" role="tab" data-tab="budsjett" '
                  'aria-selected="%s">' % sel)
        icon = ICON.format(cls=' class="tab-icon"')
    else:
        attrs = ' aria-selected="true"' if selected else ''
        open_a = '<a href="/personlig/budsjett/" class="tab"%s data-i18n="tabBudsjett">' % attrs
        icon = ICON.format(cls='')
    return '%s\n        %sBudsjett\n      </a>\n      ' % (open_a, icon)

def canonical_pages():
    out = []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        parts = set(os.path.relpath(dirpath, ROOT).replace('\\', '/').split('/'))
        if parts & EXCLUDE_DIRS or parts & FOREIGN:
            dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS and d not in FOREIGN]
            if parts & EXCLUDE_DIRS or parts & FOREIGN:
                continue
        dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS and d not in FOREIGN]
        if 'index.html' in filenames:
            out.append(os.path.join(dirpath, 'index.html'))
    return out

changed, skipped, notab = [], [], []
for f in canonical_pages():
    text = open(f, encoding='utf-8').read()
    i = text.find('class="tabs"')
    if i < 0:
        notab.append(f); continue
    block = text[i:i+4000]
    if '/personlig/budsjett/' in block:           # idempotent — already has Budsjett tab
        skipped.append(f); continue
    a = text.find('<a', i)
    if a < 0:
        notab.append(f); continue
    first_anchor = text[a:a+220]
    is_landing = 'role="tab"' in first_anchor
    is_budsjett_page = os.path.dirname(f).replace('\\', '/').endswith('/personlig/budsjett')
    new_text = text[:a] + tab_block(is_landing, False) + text[a:]  # alltid non-selected; budsjett-siden fikses separat
    rel = os.path.relpath(f, ROOT).replace('\\', '/')
    changed.append((rel, 'role-nav' if is_landing else 'i18n-nav', '(budsjett-side: fiks valgt separat)' if is_budsjett_page else ''))
    if not DRY:
        open(f, 'w', encoding='utf-8', newline='').write(new_text)

print('MODE:', 'DRY-RUN (ingen skriving)' if DRY else 'APPLIED')
print('Vil endre %d sider, hoppet over %d (har allerede Budsjett / ingen nav: %d)' % (len(changed), len(skipped), len(notab)))
print('--- endrede sider ---')
for rel, variant, note in sorted(changed):
    print('  %-40s [%s] %s' % (rel, variant, note))
if skipped:
    print('--- hoppet over (allerede Budsjett-fane) ---')
    for f in sorted(skipped):
        print('  ', os.path.relpath(f, ROOT).replace('\\', '/'))
if notab:
    print('--- ingen nav funnet ---')
    for f in sorted(notab):
        print('  ', os.path.relpath(f, ROOT).replace('\\', '/'))
