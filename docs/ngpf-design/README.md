# NGPF Design System

> Educational interfaces, decks, one-pagers and reports for Next Gen Personal Finance — the free personal-finance curriculum and PD provider for U.S. middle- and high-school teachers.

NGPF (ngpf.org) ships free curriculum, professional development, certification courses, classroom activities, advocacy resources and an annual *Mission 2030* movement to financial educators. Its surface area spans a marketing/curriculum site, a teacher account portal, certification courses, on-demand modules, Question of the Day (QoD) widgets, blog/news, conference and donation pages, and brand-stamped PDFs/decks.

This design system contains the foundations (color, type, spacing, motion), the brand assets (logos, patterns, full-color illustrations, social icons), and a website UI kit + deck slide kit you can use to produce on-brand artifacts.

---

## Sources

| Source | Where it lives |
|---|---|
| Figma — *NGPF Site* (UI Library + 46 product pages, 842 frames) | Mounted as `.fig` virtual filesystem during creation. Originals belong to NGPF Figma org. |
| Brand guidelines | `uploads/NGPF_Full_Brand_Guidelines.pdf`, `uploads/NGPF Quick Brand Guidelines_.pdf` |
| Logos | `uploads/NGPF_horizontal_primary.svg`, `..._KO.svg`, `..._Vertical_Secondary.svg`, `..._Vertical_Secondary KO.svg` |
| Patterns | `uploads/NGPF Pattern_ primary blue@2x.png`, `…bright blue@2x.png` |
| Inherited tokens / deck scaffold | `uploads/colors_and_type.css`, `uploads/deck.css` |

---

## Brand essentials

- **Logo** — *ngpf* lowercase wordmark inside a parallelogram with a graduation-cap-and-tassel mark over the "n". Comes in horizontal primary, vertical secondary, and KO (knock-out / white) variants. **Always include the horizontal logo on first page and as a footer on every page** of one-pagers, reports, and decks.

> ### ⛔ NEVER use the all-black logo.
> The NGPF wordmark only renders in **two states**:
> - **Color (navy `#1f3b9b` + orange `#f78219`)** — default, on white or any light background.
> - **KO (all white)** — only when sitting on a dark brand color (`#0b1541` Midnight, `#1f3b9b` True Blue, `#275ce4` Bright Blue, or one of the blue patterns).
>
> The all-black version that ships in some brand asset bundles is **for legacy print emergencies only**. Don't reach for it in digital work, decks, web, or PDFs.
- **Primary palette:** True Blue `#1f3b9b`, Bright Blue `#275ce4`, Midnight `#0b1541`.
- **Secondary / accents:** Sky `#1db8e8`, Gold `#f4ad00`, Orange `#f78219`.
- **Heading font:** **PT Sans Bold** — *only* for the document/page title, upper-and-lower-case.
- **Body / sub-head font:** **Montserrat** — Bold for sub-heads (often ALL CAPS at sizes ≤ h4), Regular for body, Light for long paragraphs, Italic for quotes.
- **Document defaults:** one-pagers → PDF, presentations → PPTX, match the deck layout in `slides/`.

> ### ⛔ NEVER use PT Sans for big metric numbers — ALWAYS use Montserrat.
> Big numbers (*100k+*, *5.2M*, *33 states*) are **Montserrat Bold**, weight 700, in `#275ce4` Bright Blue. PT Sans Bold is reserved for **the document title only**. If you find yourself styling a `metric-num` with `--font-display`, stop.

### A11y & color rules

- Avoid yellow text on `#1f3b9b` or `#275ce4`. Yellow on `#0b1541` is OK.
- Don't add a full border to rounded-corner boxes. If you want a border, place it on the top *or* the side, paired with a top/side-only radius.
- Don't use the gold or orange as a long-form background — they're accents.

---

## CONTENT FUNDAMENTALS

> **Authoritative sources** (raw text in `docs/`):
> - `docs/copywriting-style-guide.txt` — NGPF Guidelines & Terms (Feb 2024)
> - `docs/copy-catalog.txt` — Model sentence/bullet/paragraph copy for every product & initiative (Jan 2025)

NGPF writes the way good teachers talk: **clear, warm, second-person, and useful before it's clever**. The tone is encouraging and lightly enthusiastic, never corporate.

### Overall positioning — teacher-first language

Always frame products from the **teacher's perspective**. NGPF serves and supports teachers; messaging should reflect that. Center *how teachers and their students will benefit*, not NGPF's role in creation.

| ✅ Do | ❌ Don't |
|---|---|
| *teachers who use NGPF* / *teachers in our network* | *our teachers* |
| *X teachers invested Y hours in NGPF PD* | *NGPF provided X hours of PD* |
| *Together, we can achieve Mission 2030* | *NGPF will achieve Mission 2030* |
| *Teachers who reach 80% of students in the U.S. have selected NGPF* | *Our curriculum is used by teachers who reach…* |

Refer to teachers as **professionals** — but never use *"professionalizing the industry."*

### Describing NGPF (boilerplate)

> *The leader in personal finance curriculum and professional development for over 115,000 middle and high school teachers.*

Supporting line: *More than 80% of teachers using NGPF use it as their primary curriculum.*

Words teachers use to describe NGPF (use these in testimonials and decks): **indispensable, one-stop shop, life-saver, life-changing, invaluable, essential, relevant, up-to-date, current, helpful, innovative, easy-to-use, comprehensive, complete**.

### The 4 C's (when describing curriculum / resources)

- **Current** — updated regularly to capture the constantly changing personal-finance landscape
- **Customizable** — built in Google Suite so teachers can adapt it to their students
- **Comprehensive** — ready-to-use courses of varying lengths for high school and middle school
- **Curated** — built by former educators who pull from 1,000+ sources

### Mission

> *Our mission is to revolutionize the teaching of personal finance in all schools and to improve the financial lives of the next generation of Americans.*

**Mission 2030** — *By the year 2030, ALL students will take a one-semester personal finance course before graduating from high school.*

### Naming, casing & phrasing (high-priority terms)

| Term | Rule |
|---|---|
| **financial capability** / **financial education** | Preferred terms |
| **financial literacy** | Use sparingly — only in *Financial Literacy Month*, bill language, quotes, or as a keyword |
| **no-cost** | Use in formal writing (press releases). *free* is OK for tagline + promo |
| **nonprofit** | One word — not *non-profit* or *non profit* |
| **Guarantee States** | Both words capitalized — never *Guaranteed States* or *Guarantee states* |
| **guaranteed** | Use instead of *mandated* / *required* unless writing for lawmakers |
| **Personal Finance course** | Capitalized when referring to a specific class |
| **personal finance** | Lowercase when general |
| **U.S.** | Use periods; not *US*. Preferred over *American* / *America* |
| **Certification Courses** | Full term on first reference; *Cert Courses* / *Certs* after |
| **professional development** | Full term first reference; *PD* after. Never *training* |
| **Virtual PD** / **Virtual Conferences** | Always include "Virtual" — distinguishes from in-person |
| **On-Demand modules** | Capitalize "On-Demand"; never *On-Demands* |
| **FinCamp** | One word, capital F+C — not *Fin Camp*, *Fincamp* |
| **FinCap Friday** | Capital F+C, never plural — not *FinCap Fridays* |
| **mini-unit** | Hyphenated; not *mini unit* or *MiniUnit* |
| **Full-Year Course** | Hyphenated |
| **bell ringer** | Two words, no hyphen |
| **standalone course** | One word, no hyphen |
| **Teacher Account** | Capitalized — it's a product name |
| **Question of the Day** | Plural is *Questions of the Day* — never *Question of the Days* |
| **PAYBACK · STAX · MOVE · PLAY · FINE PRINT · Influenc'd** | NGPF activity names — always ALL CAPS (or in *Influenc'd*'s case, with the apostrophe) |
| **Financial Equity and Empowerment Grant / FEE Grant** | Full term first; no ampersand |
| **Jordan Brand grant** | Always include *Jordan Brand* — never just *Michael Jordan* |
| **Personal Finance Specialists** | Capitalized; use instead of FEE Grant Specialists / CAFE Grant Specialists / etc. |

### Financial vocabulary specifics

- **401(k)** — not *401k*
- **Bitcoin** — capital B, always singular
- **Buy Now, Pay Later** — all words capitalized, with the comma
- **ChatGPT** — not *Chat GPT*
- **homeowners insurance** / **renters insurance** — no apostrophe
- **W-2** / **W-4** — hyphenated
- **speculating in cryptocurrency** (preferred) or *buying cryptocurrency* — **never** *investing in cryptocurrency*
- **Peer-to-peer payment apps** (or *P2P*)

### Diversity, equity & inclusion

- Avoid **poor** → use *low-income*, *below the poverty line*, *Title I school*, *majority free and reduced-price meals*
- **guardian** alongside *parent* in general references — *"students' parents or guardians"*
- **historically excluded communities** (preferred) — not *underserved* or *minorities*
- **opportunity gap**, not *achievement gap*
- **most diverse districts**, not *urban districts*
- **undocumented**, never *illegal*
- **multilingual learners / ML / MLL / English Language Learners / ELL** — all OK; vary them
- **Black** capitalized; never *Blacks* or *the Blacks*. *white* lowercase. **Indigenous** capitalized.
- **Hispanic / Latin(o/a) / Latine** — use *Latine* as the gender-neutral form, not *Latinx*. Avoid *brown*.
- Avoid **minority** — demographically inaccurate, creates negative comparison
- **LGBTQ+** as the default abbreviation
- **pronouns** — never *preferred pronouns*. Use *they/them* or the person's name if unknown
- Use diacritics when applicable (é, ë, ñ), especially in names

### Punctuation, writing & numbers

- **Oxford comma** always
- Hyphenate phrases used as adjectives: *two-minute video, three-week course*
- Never hyphenate *-ly* words: *highly regarded, widely used*
- Use **percent** with a specific number (*92 percent of teachers*), **percentage** without (*a high percentage*)
- Spell out abbreviations on first reference
- Spell out numbers **one through nine**; numerals for *10*+. Same with ordinals (*first through ninth*; *10th*+)
- Spell out a number that begins a sentence
- **Less vs. fewer** — *fewer* for things counted, *less* for things measured
- **Which vs. what** — *which* when the range of answers is restricted

### Limit / avoid

- **Ampersand (&)** — only in headlines, email subjects, proper org names, and tweets when saving characters
- **Exclamation points** — sparingly. Swap urgency-by-exclamation for vivid vocabulary
- **"that"** — drop it if the sentence still makes sense
- **Passive voice** — *"With our curriculum, you can…"* beats *"Our curriculum enables you to…"*
- **Words to avoid:**
  - *delve* — ChatGPT tic; use *explore, investigate, examine, look into, dig into, dive into*
  - *utilize* — always *use*
  - *very, really* — empty intensifiers
- **No emoji.** The brand uses full-color illustrations (folders, clipboards, balance scales, magnifying glasses) instead.

### Blog & email specifics

- **Title Case** for blog headlines (exception: Question of the Day)
- Header 3 bold for in-post headings
- Single space after period, two between sections
- Hyperlink the **full descriptive phrase**, not *here* / *click here*
- Set links to open in a new window
- Always include **alt text** on images; **blur faces** from FinLit Fanatics screenshots unless permission given
- Always include a **call to action** at the end, unless one's already clear
- Use **archive.is** for paywalled article links

### Tone in action — sample copy patterns

> **Hero** — *Bring Joy to Teaching Personal Finance. No Prep Needed.*
>
> **PD lead** — *Build your confidence in the classroom by participating in NGPF's free professional development offerings.*
>
> **Curriculum lead** — *NGPF's free Personal Finance curriculum is designed to be a one-stop shop for high school teachers.*
>
> **QoD prompt** — *What percent of Gen Zers don't have a monthly budget?*
>
> **Mission close** — *Together, we can achieve Mission 2030.*
>
> **CTA labels** — *Apply now · Register · Learn More · Download Event · Get Started*

### Pre-publish checklist

1. Does this match NGPF's visual identity (logo, blue palette, PT Sans / Montserrat)?
2. Is the **teacher** the subject of the sentence — and is the tone warm + useful?
3. Are financial claims accurate and sourced? *Bitcoin/cryptocurrency phrasing especially — speculate, never invest.*
4. Did I check the **Copy Catalog** (`docs/copy-catalog.txt`) for an existing model sentence/bullet/paragraph?
5. Did I check the **Copywriting Style Guide** (`docs/copywriting-style-guide.txt`) for term-level rules?

---

## VISUAL FOUNDATIONS

### Color

A two-blue + two-warm system on white. The two **primary** blues (`#1f3b9b` true blue and `#275ce4` bright blue) carry almost every interactive surface — primary CTAs are bright-blue solids, body links use bright blue, sub-headings inside cards use true blue. **Midnight `#0b1541`** is the body-text near-black and the only allowed deep background. **Sky `#1db8e8`** is decorative (illustrations, "Math" tabs in nav). **Gold `#f4ad00`** and **Orange `#f78219`** are *accent only* — used inside illustrations, the *Math* / *Account* nav pills, and tiny highlights. Tinted backgrounds are always pale blues (`#edfaff` / `#dfe9ff` / `#d2eff9`), never gray.

### Type

Two families.
- **PT Sans Bold 48–84px** — page title only, upper-and-lower-case.
- **Montserrat** — everything else. Bold ~700 dominates sub-heads, card titles, buttons, and CTA labels (the brand uses Bold roughly 2× as often as Regular). Italic Montserrat for quotes. h4/h5/h6 are ALL CAPS with +4% letter-spacing.

> **Big metric numbers are Montserrat — never PT Sans.** Per the brand team's most-repeated note: stats like *100k+ / 5.2M / 33 states* are **Montserrat Bold 80–120px** in Bright Blue `#275ce4`. PT Sans Bold is reserved exclusively for the document title.

### Spacing

A 4-base scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 px. Section padding on web is typically 80px horizontal at desktop; cards are 16–20px padded.

### Backgrounds

- **White** is the default page background.
- **Pale-blue tints** (`#edfaff`, `#dfe9ff`) for callouts, hero strips, related-post backgrounds.
- **Primary-blue and bright-blue patterned tiles** (`assets/pattern-primary-blue.png`, `pattern-bright-blue.png`) for hero panels, deck covers, and big stat strips. The pattern is a low-opacity texture and tiles at ~600px.
- **No gradients** by default. The deck cover uses a clipped diagonal blue panel against white — not a gradient. Resist the urge to add purple→blue gradients; the brand reads flat-and-confident.
- **No grain, no noise, no glass blur, no dark mode.** Imagery is always full-color, warm, daylit classroom photography or full-color flat illustrations.

### Borders, cards & shadows

- **Cards** are white, **`5–8px` radius** for content cards and **`10px`** for buttons. A 4-col card has a **`1px solid #275ce4` outer border + `0 4px 4px rgba(0,0,0,0.25)` drop shadow** — that's the signature card. A pale-blue "Related Post" card has no border at all.
- **Notifications** use a 6px-wide colored left-rail on white (not a full border).
- **Rounded illustration cards** (20px radius) carry the full-color icon up top, no border, no shadow.
- **Don't** put a full border on a rounded-corner box. If you want a border, restrict it to one or two sides (top OR side) and match the radius to those corners only.
- **Inner shadows / glass effects** are not used.
- **Standard elevations:** `0 1px 2px rgba(0,0,0,.08)` light card, `0 2px 4px rgba(0,0,0,.25)` site-nav, `0 6px 20px rgba(11,21,65,.15)` modal.

### Buttons & states

Six button forms total: standard solid, standard solid + icon, standard outline, standard outline + icon, small solid, small outline, tiny outline (used for utility actions like *Download Event*). All have **normal / hover / click** states.

| State | Solid (Bright Blue) | Outline |
|---|---|---|
| Normal | `bg #275ce4`, white text | `2px #275ce4`, blue text |
| Hover | `bg #1f4ec4` (slightly darker) | `bg #f4f7ff` tint |
| Click  | `bg #1e44a5` (darker still) | text + border `#1f3b9b` |

Radii: solid `10px`, small `10px`, tiny `8px`. Padding: standard `16px 18px`, small `11px 22px`, tiny `4px 9px`. Buttons never use gradients or shadows.

### Motion

Subtle. NGPF doesn't lean on motion. Use 120–160ms ease transitions for hover color swaps. No bounces, no parallax, no scroll-jacking. Carousel widgets fade between cards. Accordions slide open in ~200ms.

### Iconography (preview)

Two parallel systems:
1. **FontAwesome-style line/solid icons** at 16/24/30px for UI controls (chevrons, plus, document, clock, search, social — see `assets/icons/`).
2. **Full-color flat illustrations** at 130–150px for content cards (Folder, Bingo, Survey, Playbook, Clipboard, Doc, Slides, Calendar, Resources, Raffle, Toolkit, Report, Bill Tracker, Documentary, Kahoot). These are NGPF-original — see `assets/illustrations/` and the ICONOGRAPHY section below.

### Layout rules

- The site is **1440px** wide, **80px** outside gutters, **24–32px** column gutters.
- Decks are **1440 × 1080** (4:3 historic) — the team has been migrating to 1920×1080 16:9 (see `slides/`).
- The nav bar is **80px** tall, white, with a 2px shadow underneath. Logo at left (~163px wide), nav links centered, account pill at right.
- Footers carry the horizontal primary logo plus org links.

---

## ICONOGRAPHY

NGPF uses **two icon systems side-by-side**:

### 1. UI icons — FontAwesome 6 Solid

Every chevron, document, plus-circle, check-circle, bell, search-glass, clock, calendar, comment, link, filter, trash, user-circle, social glyph in the figma file matches the **FontAwesome v6 Free Solid** set exactly (component names in the source are literal FA names: `document-solid`, `plus-circle-solid`, `chevron-circle-right-solid`, `check-circle`, `clock-solid`, `external-link-alt-solid`, `pen-solid`, `compare-solid`, `user-circle`, `unlock-solid`, `clipboard-list-solid`, `home-solid`, `bank-solid`, `graduation-cap-solid`, `chalkboard-teacher-solid`, `bullhorn-solid`, `cart-plus-solid`, `cart-minus-solid`, `comment-alt-solid`, `times-solid`, `bullhorn-solid`, `play-circle`, `volume-up-solid`, `share-square-solid`, `facebook-f`, `instagram`, `linkedin-in`, `twitter`, `youtube`).

**Pull these from the FontAwesome CDN.** Keep weight = solid, fill = `currentColor`, drawn at 16/20/24px in body, 30px in cards. Default color is `#1f3b9b` on light surfaces, `#fff` on dark; on hover for chevron-circle controls, swap fill to `#275ce4`.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.2/css/all.min.css">
<i class="fas fa-clock"></i>
```

### 2. Brand illustrations — full-color flat

A set of ~15 illustrated icons drawn at 130–150px for content cards: **Folder, Bingo, Survey, Playbook, Clipboard, Doc, Slides, Calendar, Resources, Raffle, Toolkit, Report 2024, Bill Tracker, Documentary, Kahoot**. They sit on white, no shadow, no border, centered above a Montserrat-Bold title in `#275ce4` plus a sentence of body copy.

These are NGPF-original art and should not be redrawn. They live in the Figma file at `/UI-LIbrary/Full-Color-Page-Icons/` and on the production site as PNG/SVG. When prototyping with this kit, drop the icon in via `<img src="assets/illustrations/icon-{name}.png">` — until those production exports are added to this kit, use the placeholder shown in `preview/illustrations-preview.html` and **flag the missing asset to the NGPF team**.

### 3. No emoji, no unicode-as-icon

The brand never uses 🎉 / ⚡ / ✅ as decoration. Don't introduce them.

### 4. Social

Use the FontAwesome brand icons: `fa-x-twitter`, `fa-youtube`, `fa-linkedin-in`, `fa-instagram`, `fa-facebook-f`. They appear in the footer at 24px, white on the dark-blue footer panel.

---

## Index

| File / folder | What it is |
|---|---|
| `colors_and_type.css` | All design tokens (colors, type, spacing, radii, shadows) + base element styles |
| `deck.css` | Slide chrome for the NGPF deck template (cover, transition, regular, agenda, metrics, timeline, four-point) |
| `assets/` | Logos (4 variants), patterns (2), illustrations, plus any extracted SVG icons |
| `fonts/` | Montserrat weights — you must supply locally; PT Sans pulled from Google Fonts. **See note below.** |
| `preview/` | Design system cards (registered as assets — these populate the Design System tab) |
| `ui_kits/website/` | Hi-fi recreation of the marketing/curriculum site — modular React/JSX components + a click-thru `index.html` |
| `slides/` | Sample 1440×1080 slides built on `deck.css` (cover, transition, regular, agenda, metrics, timeline, four-point) |
| `SKILL.md` | Drop-in skill for Claude Code or this product so the system can be invoked by name |
| `uploads/` | Original source materials (PDFs, raw SVGs, patterns, the seed CSS files) |

### Caveats / known gaps

- **Montserrat fonts** are not bundled — the `colors_and_type.css` already `@font-face`-references `fonts/Montserrat-*.ttf` but the files aren't in this project. Either drop them in, or rely on the Google-Fonts fallback by changing the `@import` line. Flagged.
- **Full-color brand illustrations** (Folder/Bingo/Survey/…) are referenced but not exported. Pull the PNGs from Figma and drop them into `assets/illustrations/` with the names listed in `ICONOGRAPHY`.
- The Figma file contains many one-off page designs (Investing Sim, ASU, Cert-Exam, Donation, etc.) that this kit does not yet cover — see the Figma directly when designing for those surfaces.
