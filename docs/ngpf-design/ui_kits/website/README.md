# NGPF Website UI Kit

Hi-fidelity recreation of the marketing/curriculum side of **ngpf.org** — built from the Figma `Home-Page` + `Navigation` frames and the `UI-LIbrary` components. Click-thru only; no real data fetching.

## Components

| File | What it is |
|---|---|
| `NavBar.jsx` | Top nav: ngpf logo, Math + Arcade pills, Curriculum / Teacher PD / Mission 2030 dropdowns, search, Account |
| `HeroSection.jsx` | Pale-blue hero with PT-Sans title, supporting copy, and floating illustration cluster |
| `IllustrationCardGrid.jsx` | Five 3-col illustration cards (Folder / Bingo / Strategy / Calendar / Graduation) |
| `ContentCardGrid.jsx` | Four 4-col content cards (badge + title + sentence) — the signature blue-border drop-shadow card |
| `BigNumbers.jsx` | Three-up metrics strip on blue pattern background |
| `QuoteBlock.jsx` | Pale-blue panel with white quote card + speaker line |
| `BlogStrip.jsx` | Three "Related Post" tiles with hero image + category + title |
| `Footer.jsx` | Dark-blue footer with logo, links and social icons |
| `Illustrations.jsx` | Inline-SVG full-color illustration set (placeholder for prod NGPF assets) |

## How to use

Open `index.html`. Components are loaded with `<script type="text/babel" src="ComponentName.jsx">` and exported to `window` for cross-file reuse. Bring your own data — every component takes a small props bag.
