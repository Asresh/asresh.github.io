# Asresh Kuricheti — Portfolio

**🔗 Live at [asresh.github.io](https://asresh.github.io)**

A single-page portfolio for a hardware engineer, organized around four areas of work:

1. **RTL Design** — synthesizable SystemVerilog, self-checking testbenches
2. **Design Verification** — UVM environments, coverage, SVA
3. **Hardware–Software Co-Design** — RTL + C firmware + differential verification, with measured speedups
4. **AI Hardware Acceleration** — systolic GEMM, structured sparsity, GPU/SIMT dataflow

Built as a self-contained static site — plain HTML, CSS, and vanilla JavaScript, no build step and no dependencies to install.

## Run locally

Just open `index.html`, or serve the folder:

```bash
python3 -m http.server 8000
```

Then visit <http://localhost:8000>.

## Deploy to GitHub Pages

This repo is a `<user>.github.io` site, so GitHub Pages serves it automatically from the `main` branch root — every push to `main` redeploys **<https://asresh.github.io>** in ~30–60 s. The site is served as-is (`.nojekyll` disables Jekyll processing).

## Structure

```
.
├── index.html        # markup + content for all four sections
├── css/styles.css    # design system (navy / mint-teal), layout, responsive rules
├── js/main.js        # scroll-aware nav, reveal-on-scroll, mobile menu
└── assets/
    ├── favicon.svg
    └── resume.pdf     # add your résumé here (linked from the nav)
```

## Customize

A few spots are wired to placeholders — search the codebase for `TODO`:

- **Contact email** — `you@example.com` in `index.html` (left rail, right rail, and the *Say Hello* button)
- **LinkedIn URL** — currently points at `linkedin.com`
- **Résumé** — drop a `resume.pdf` into `assets/`

## Credits

Layout and visual language adapted from [Brittany Chiang's v4](https://v4.brittanychiang.com), used with attribution.
