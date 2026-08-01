# Asresh Kuricheti — Portfolio

**🔗 Live at [asresh.github.io](https://asresh.github.io)**

A single-page portfolio for a hardware engineer, organized around five areas of work:

1. **RTL Design** — synthesizable SystemVerilog, self-checking testbenches
2. **Design Verification** — UVM environments, coverage, SVA
3. **Hardware–Software Co-Design** — RTL + C firmware + differential verification, with measured speedups
4. **Computer Architecture** — RISC-V datapath, caches/TLB, out-of-order, GPU/SIMT microarchitecture
5. **AI Hardware Acceleration** — systolic GEMM, structured sparsity, GPU/SIMT dataflow

Built as a self-contained static site — plain HTML, CSS, and vanilla JavaScript, no build step and no dependencies to install.

## Keeping the projects in sync

The first four sections are **generated**, so new daily projects appear on their own. Each is backed by a source repo:

| Section | Source repo | Read from |
|---|---|---|
| RTL Design | `RTL-Projects-Everyday` | README index table |
| Design Verification | `Design-Verification-Projects-Everyday` | README index table |
| Hardware–Software Co-Design | `Hardware-Software-Codesign-Projects-Everyday` | `MANIFEST.json` |
| Computer Architecture | `Computer-Architecture-Projects-Everyday` | README index table |

[`data/projects.json`](data/projects.json) is the source of truth for the cards. [`scripts/sync.py`](scripts/sync.py) reads each repo's own index, **appends any project it hasn't seen yet**, and rewrites the grids in `index.html` between the `AUTO:*` markers.

- Curated cards are never overwritten — hand-written titles, descriptions, tags and order always win.
- Freshly-discovered cards are added with `"new": true` and re-derived from the repo on every run. Delete that flag once you've polished a card to freeze it.
- New cards land at the **end** of their section, in the repo's own order — move an entry up in `projects.json` to place it by complexity.
- The featured build at the top of each section (and the whole **AI** section) is hand-written in `index.html` and intentionally excluded from the generated grids.

```bash
python3 scripts/sync.py             # fetch new projects + regenerate
python3 scripts/sync.py --no-fetch  # regenerate from projects.json only
```

[`.github/workflows/sync.yml`](.github/workflows/sync.yml) runs the sync every 6 hours (and on demand via **Actions → Run workflow**), commits any change, and Pages redeploys — so adding a project to a source repo is all it takes to see it here.

## Run locally

Open `index.html`, or serve the folder:

```bash
python3 -m http.server 8000
```

Then visit <http://localhost:8000>.

## Deploy to GitHub Pages

This repo is a `<user>.github.io` site, so GitHub Pages serves it automatically from the `main` branch root — every push to `main` redeploys **<https://asresh.github.io>** in ~30–60 s. The site is served as-is (`.nojekyll` disables Jekyll processing).

## Structure

```
.
├── index.html                    # page markup; grids between AUTO:* markers are generated
├── css/styles.css                # design system (navy / mint-teal), layout, responsive rules
├── js/main.js                    # scroll-aware nav, reveal-on-scroll, mobile menu
├── data/projects.json            # source of truth for the four generated grids
├── scripts/sync.py               # pulls new projects from the repos and rewrites the grids
├── .github/workflows/sync.yml    # runs the sync on a schedule
└── assets/favicon.svg
```

## Customize

Content for the four generated sections lives in [`data/projects.json`](data/projects.json) (see above). Everything else — hero copy, the AI section, contact email and social links — is directly in `index.html`.

## Credits

Layout and visual language adapted from [Brittany Chiang's v4](https://v4.brittanychiang.com), used with attribution.
