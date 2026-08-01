#!/usr/bin/env python3
"""
sync.py — keep the portfolio grids in step with the source project repos.

What it does
------------
1. Reads data/projects.json (the curated source of truth for every grid card).
2. (--fetch, the default) For each synced section, downloads that repo's own
   project index — the `| Day | Project | Key concepts | Folder |` README table
   for the SystemVerilog repos, or MANIFEST.json for the co-design repo — and
   APPENDS any project that isn't already listed. Curated entries are never
   overwritten, so hand-written descriptions and ordering are preserved.
3. Regenerates each section's <ul class="projects-grid"> in index.html, in place,
   between its <!-- AUTO:<id>:start --> / <!-- AUTO:<id>:end --> markers.

Run it locally with `python3 scripts/sync.py` to pick up new projects, or
`python3 scripts/sync.py --no-fetch` to just re-render from projects.json.
The GitHub Action (.github/workflows/sync.yml) runs it on a schedule and commits
any change. No dependencies beyond the Python standard library.
"""

import argparse
import html
import json
import os
import re
import sys
import urllib.request
from urllib.parse import quote

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data", "projects.json")
INDEX = os.path.join(ROOT, "index.html")

FOLDER_SVG = (
    '<svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" '
    'stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 '
    '2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>'
)
EXT_SVG = (
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" '
    'stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 '
    '2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline>'
    '<line x1="10" y1="14" x2="21" y2="3"></line></svg>'
)


# --------------------------------------------------------------------------- #
# Fetching / parsing the source repos                                         #
# --------------------------------------------------------------------------- #
def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "portfolio-sync"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8")


ACRONYMS = {
    "gpu": "GPU", "rng": "RNG", "fir": "FIR", "cordic": "CORDIC", "sfu": "SFU",
    "dma": "DMA", "cam": "CAM", "bbo": "BBO", "gemm": "GEMM", "alu": "ALU",
    "tlb": "TLB", "fifo": "FIFO", "crc": "CRC", "ecc": "ECC", "spi": "SPI",
    "uart": "UART", "axi": "AXI", "hft": "HFT", "simd": "SIMD", "int8": "INT8",
    "risc": "RISC", "cdc": "CDC", "mac": "MAC", "rv32i": "RV32I", "tcam": "TCAM",
}


def fix_caps(title):
    return " ".join(ACRONYMS.get(w.lower(), w) for w in title.split())


def trim(text, limit=150):
    """Turn a long comma-list of 'key concepts' into one short, capitalised sentence."""
    text = re.sub(r"`([^`]*)`", r"\1", text)              # drop markdown code ticks
    text = re.sub(r"\*{1,2}([^*]+)\*{1,2}", r"\1", text)  # drop *em* / **bold**
    text = " ".join(text.split())
    if len(text) > limit:
        cut = text[:limit]
        cut = cut.rsplit(",", 1)[0] if "," in cut else cut.rsplit(" ", 1)[0]
        text = cut.rstrip(" ,;—-") + "…"
    if text:
        text = text[0].upper() + text[1:]
    return text


def extract_speedup(summary):
    """Pull a headline speedup like '49.35x' from a co-design summary (skips '8x8')."""
    cands = re.findall(r"(\d+(?:\.\d+)?)[x×](?![0-9])", summary)
    if not cands:
        return None
    dec = [c for c in cands if "." in c]
    return (dec[0] if dec else max(cands, key=float)) + "×"


def parse_readme_table(text):
    """`| Day | Project | Key concepts | Folder |` -> {day -> {id,title,desc,metric}}."""
    out = {}
    for line in text.splitlines():
        line = line.strip()
        if not line.startswith("|"):
            continue
        cells = [c.strip() for c in line.strip("|").split("|")]
        if len(cells) < 3 or not cells[0].isdigit():
            continue
        day = int(cells[0])
        out[day] = {
            "id": f"Day{day}",
            "title": html.escape(cells[1], quote=False),
            "desc": html.escape(trim(cells[2]), quote=False),
            "metric": None,
        }
    return out


def parse_manifest(text):
    """MANIFEST.json -> {day -> {id,title,desc,metric}}."""
    out = {}
    for p in json.loads(text).get("projects", []):
        day = int(p["day"])
        name = p.get("name", f"day{day}")
        summary = p.get("summary", "")
        out[day] = {
            "id": f"day{day} - {name}",
            "title": html.escape(fix_caps(name.replace("_", " ").title()), quote=False),
            "desc": html.escape(trim(summary, 150), quote=False),
            "metric": extract_speedup(summary),
        }
    return out


def source_map(section):
    repo, src = section["repo"], section["src"]
    base = f"https://raw.githubusercontent.com/Asresh/{repo}/main/"
    if src == "table":
        return parse_readme_table(fetch(base + "README.md"))
    return parse_manifest(fetch(base + "MANIFEST.json"))


def day_of(pid):
    m = re.search(r"(\d+)", pid or "")
    return int(m.group(1)) if m else None


def sync_section(section):
    """Append repo projects that are missing, and refresh auto-added ('new') ones.

    Curated entries (no 'new' flag) are never touched — hand-written titles,
    descriptions, ordering and tags always win. Auto entries are re-derived from
    the repo each run, so a tidied-up README/MANIFEST propagates to the site.
    Delete the 'new' flag on an entry once you've curated it to freeze it.
    """
    smap = source_map(section)
    existing = {day_of(p["id"]): p for p in section["projects"] if day_of(p["id"])}
    featured = day_of(section.get("featured", ""))
    added = []
    for day in sorted(smap):
        if day == featured:
            continue
        info = smap[day]
        if day in existing:
            p = existing[day]
            if p.get("new"):                       # auto entry -> refresh from source
                p["title"], p["desc"] = info["title"], info["desc"]
                if info["metric"] and section.get("cardStyle") == "metric":
                    p["metric"] = info["metric"]
        else:
            entry = {"id": info["id"], "title": info["title"],
                     "desc": info["desc"], "tags": [], "new": True}
            if section.get("cardStyle") == "metric":
                entry["metric"] = info["metric"] or "NEW"
            section["projects"].append(entry)
            added.append(info["id"])
    return added


# --------------------------------------------------------------------------- #
# Rendering the grid HTML                                                      #
# --------------------------------------------------------------------------- #
def href(section, pid):
    return section["hrefBase"] + quote(pid, safe="")


def render_card(section, p):
    url = href(section, p["id"])
    if section.get("cardStyle") == "metric":
        top_right = f'<span class="card-metric">{p.get("metric", "NEW")}</span>'
    else:
        top_right = (
            f'<a class="card-link" href="{url}" target="_blank" rel="noopener" '
            f'aria-label="Open {p["id"]} on GitHub">{EXT_SVG}</a>'
        )
    tags = "".join(f"<li>{t}</li>" for t in p.get("tags", []))
    tags_ul = f'\n        <ul class="card-tech">{tags}</ul>' if tags else ""
    return (
        '      <li class="project-card">\n'
        '        <div class="card-top">\n'
        f'          <span class="card-folder" aria-hidden="true">{FOLDER_SVG}</span>\n'
        f'          {top_right}\n'
        '        </div>\n'
        f'        <h4 class="card-title"><a href="{url}" target="_blank" rel="noopener">{p["title"]}</a></h4>\n'
        f'        <p class="card-desc">{p["desc"]}</p>'
        f'{tags_ul}\n'
        '      </li>'
    )


def render_grid(section):
    cards = "\n\n".join(render_card(section, p) for p in section["projects"])
    return '    <ul class="projects-grid reveal">\n' + cards + "\n    </ul>"


def inject(html_text, section_id, grid):
    start = f"<!-- AUTO:{section_id}:start"
    end = f"<!-- AUTO:{section_id}:end -->"
    i = html_text.find(start)
    j = html_text.find(end)
    if i == -1 or j == -1:
        raise SystemExit(f"markers for section '{section_id}' not found in index.html")
    i = html_text.find("-->", i) + 3          # end of the start-marker comment
    return html_text[:i] + "\n" + grid + "\n    " + html_text[j:]


# --------------------------------------------------------------------------- #
def main():
    ap = argparse.ArgumentParser(description="Sync portfolio grids from the source repos.")
    ap.add_argument("--no-fetch", action="store_true", help="regenerate from projects.json only")
    args = ap.parse_args()

    with open(DATA, encoding="utf-8") as f:
        data = json.load(f)

    if not args.no_fetch:
        for section in data["sections"]:
            if not section.get("repo"):
                continue
            try:
                added = sync_section(section)
            except Exception as e:                       # network hiccup: keep going
                print(f"! {section['id']}: fetch failed ({e}); keeping existing", file=sys.stderr)
                continue
            if added:
                print(f"+ {section['id']}: added {', '.join(added)}")
        with open(DATA, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.write("\n")

    with open(INDEX, encoding="utf-8") as f:
        html_text = f.read()
    for section in data["sections"]:
        html_text = inject(html_text, section["id"], render_grid(section))
    with open(INDEX, "w", encoding="utf-8") as f:
        f.write(html_text)

    total = sum(len(s["projects"]) for s in data["sections"])
    print(f"Rendered {total} project cards across {len(data['sections'])} synced sections.")


if __name__ == "__main__":
    main()
