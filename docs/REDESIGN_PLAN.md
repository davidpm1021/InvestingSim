# InvestingSim → Brokerage Sim — Redesign Spec

**Status:** Planning complete; decisions approved; not yet implemented.
**Last updated:** 2026-06-09

This document specs a full redesign of the InvestingSim app, driven by three feedback
sources plus a model statement (see §9). It is meant to be handed to a developer and
built chunk by chunk. Every decision below was reviewed and approved.

---

## 1 · Vision & principles

A **client-side educational brokerage simulator** — the sibling to NGPF's *Online Bank
Simulator*. Students *experience* a real-feeling brokerage so they're comfortable with the
real thing. It is **not** a game to win.

1. **Experience, not score.** No leaderboard, no "maximize returns" framing. Success =
   comfort with the product.
2. **Sibling to the bank sim.** Same grammar/gestures: *Make a Transfer*, *advance the
   calendar (top-right)*, *check Notifications*, *read your Activity / Statement*. A student
   who did the bank sim should feel at home.
3. **Orient, don't teach.** Concepts are pre-taught; inline definitions are refreshers. The
   **reflection worksheet (built later) does the teaching.**
4. **Act like a real brokerage.** Factual notifications only — **no in-app coaching/nudges**.
   Never block with a fail state; gate gently and give a recovery path.
5. **Realistic mechanics, de-risked content.** Fictional "boring" stocks + generic fund
   products; the realism lives in *how it works* (transfers, settlement, statements).
6. **Evergreen.** Never display a year anywhere — months/quarters only. Keep real ISO dates
   internally for the engine.

---

## 1A · Visual design is FROZEN (hard constraint)

**This redesign changes structure, content, and logic — NOT the look.** Fonts, colors,
theme, spacing, and the existing visual language must be preserved exactly.

**Do not change:**
- The **Angular Material "Azure Blue" prebuilt theme** (`angular.json` → `styles`:
  `@angular/material/prebuilt-themes/azure-blue.css`). No new theme, no palette overrides.
- **Typography:** Montserrat (body) + Inter, loaded in `src/styles.scss`. No new fonts.
- **Bootstrap grid only** (`bootstrap-grid.min.css`) — keep as-is.
- Global styles in `src/styles.scss` and the shared `src/styles/layout` partial — color
  values, `router-link-active`, card/dialog overrides — stay untouched.
- Existing component SCSS and the browser-chrome look (tabs, address bar, window controls).

**New surfaces must inherit the existing style, not invent one.** A few chunks add new UI —
Desktop entry (Ch1), connect-bank dialog (Ch1), notifications center (Ch9), definition
popovers (Ch9), the flattened Trade screen (Ch7), the rebuilt Statement (Ch6). These need
*new markup/layout SCSS*, but must use the **same theme, fonts, colors, Material components
(cards/dialogs/buttons), and spacing** as the current app. Reuse existing classes and copy
the styling of an analogous existing screen.

**Highest style-drift risk — the Statement (Ch6).** We adopt Dave's *structure* from
`htmlCode.pdf`, **not its CSS.** Re-implement those sections in the app's existing visual
style (Material + Montserrat + Azure Blue). The PDF is a layout reference only.

**Net effect on existing pages:** tab set, navigation, content, and data change; the *visual
design* (fonts, coloring, components) does **not**.

---

## 1B · Reuse-first / DRY (hard constraint)

**The original developer's rule: never build the same system twice.** If something can be
abstracted, systematized, and reused, that is the default. Before creating anything new,
**find the existing component / service / pipe / pattern and extend it** (add an input or
variant) rather than duplicating it. Never recreate what already exists. The current repo
already reflects this — match it:

- **`TransferDialogComponent`** handles *both* directions from one component via a
  `transferDirection: 'to-brokerage' | 'to-banking'` input (title, accounts, and balances all
  derived from it). Ch1's withdrawal **reuses this** — do not build a second dialog.
- **`ConfirmationDialogComponent`** is a generic, typed confirm dialog that
  `TransferDialogComponent` *composes*. The new Trade screen reuses it too.
- Shared, parameterized components already exist: **`holdings-totals`** (with a
  `hideTotalValue` input), **`asset-details-dialog`**, **`quarter-navigation-dialog`**,
  `header`, `sidebar`, and the **`AssetTypePipe`** (single formatting source).
- **Services are the single source of truth** (`CurrentDateService`, `HoldingsService`,
  `TransactionsService`, `DataService`) using the reactive `combineLatest(currentDate$, …)`
  pattern; price resolution lives once in `HoldingsService.getCurrentPrice`; layout is
  config-driven via `DataService.getOptions()`.

**Apply the same discipline to everything new in this plan — each cross-cutting concern gets
ONE home, parameterized for its variations:**

| Concern | One home (don't scatter or duplicate) |
|---|---|
| Money math (interest, dividends, **FIFO lots**, gain/loss, % of portfolio, **single price source**) | the services — computed once, consumed by all views; never recomputed per component |
| Allocation (Stocks/Bonds/Cash) + portfolio value series | one calculation, reused by Holdings, the Overview compare chart, and the Statement |
| Charts (Chart.js create/destroy is repeated today) | **one reusable chart component/config**; pass in data + options |
| Evergreen dates | **one date pipe** used everywhere — no ad-hoc year-stripping per component |
| Quick definitions | **one popover directive + one glossary source** |
| Notifications | **one service + one center** (statements + trade confirms) |
| First-visit callouts | **one service/directive**, driven by `investing_sim__visited_pages` |
| Dialogs (connect-bank, trade confirm, etc.) | follow the existing Material-dialog pattern; reuse confirm / amount-input / validation from `TransferDialogComponent` |

**Rule of thumb:** if you're about to copy-paste UI or recompute a value a service already
owns, stop and abstract it. Design for flexibility across all the situations it'll be used in.

---

## 2 · Global model (cross-cutting)

| Area | Decision |
|---|---|
| Institutions | **Evergreen Bank** (`evergreenbank.example/online-banking`) and **Summit Invest** (`summitinvest.example`), presented as two tabs in the existing browser chrome. |
| Cash yields | Bank = **standard Savings @ 1.5% APY**; brokerage uninvested cash = **Cash Settlement Account @ 0.25% APY**. |
| Interest | **Posts monthly** (idempotent), labeled entries in Activity, for both accounts. |
| Income | Dividends + bond income **post quarterly** into settlement cash (bond = 30-day SEC yield); cash only (no reinvestment). |
| Fees | **Commission-free** — no trade fees anywhere. Expense ratios are **informational** on fund details only. |
| Cost basis | **FIFO lots.** Realized **short-/long-term** gain surfaced on sale. **No tax math in-app** (worksheet does it). |
| Time | One-way **Next Quarter** (top-right), confirm-before-advance. Dev dropdown removed from student view; **teacher quarter-override kept in Admin**. |
| Catalog | **7 fictional/generic instruments** with **monthly** low-volatility price series. |
| Allocation lens | **Stocks / Bonds / Cash.** Target-date fund **splits ~90/10** Stocks/Bonds. |
| Precision | **6 dp back-end / 4 dp front-end**, and a **single price source per (asset, date)**. |
| Notifications | Factual only: **statement-ready + trade/order confirmations.** No coaching nudges; no dividend/interest notifications. |
| Definitions | **Inline hover/click popovers.** |
| Onboarding | **Dismissible first-visit callouts** per page; reopenable via "?". |

---

## 3 · Decision ledger

| # | Decision | Choice | Source |
|---|---|---|---|
| Brand | Bank + brokerage names | Evergreen Bank / Summit Invest (fictional, plausible) | user |
| Nav | Browser tabs | Keep tabs, reduced to 2 (Bank, Brokerage); Admin hidden | user |
| Onboarding | Link bank | Pre-filled connect popup → "connecting…" animation → persistent ✓ | user |
| Home | `/home` | **Removed** | user |
| Transfer | Settlement | **Instant + a "real life takes days" note** | user |
| Cash | Interest accrual | **Monthly entries** | QA12 |
| Cash | Display | **Cash Settlement Account as a holding line** | Tim |
| Cash | Yields | 1.5% savings / 0.25% brokerage (kept; bank = "standard savings") | Dave/QA10 |
| Cash | Interest callout | APY labels + "paid monthly" tooltip + labeled monthly entries | — |
| Menu | Naming | **Fictional stocks + generic funds** | QA2 |
| Menu | Target-date | **Split ~90/10 Stocks/Bonds** | — |
| Menu | MF + ETF | **Keep both** (teach MF-vs-ETF) | Tim |
| Trade | Capital gains | **FIFO + surface ST/LT; tax in worksheet** | Tim |
| Trade | Settlement | **Instant + note** (T+1; MF EOD vs ETF intraday) | Tim |
| Trade | Income | **Quarterly to settlement cash** | Tim |
| Trade | Fees | **Remove trade fees; expense ratios informational** | Dave/QA5 |
| Perf | Data granularity | **Monthly** price data | Dave/QA9 |
| Perf | Ranges | **1M / 3M / YTD / All, default YTD**; label every % | Tim/QA9 |
| Perf | Portfolio chart | **Holdings tab, total + optional per-asset overlay** | Dave/QA11 |
| Perf | Compare chart | **All available assets, on the Overview** | QA13 |
| Stmt | Model | **Adopt Dave's statement model** (fictional names) | Dave/QA6 |
| Stmt | Breakdown | **Stocks / Bonds / Cash** | — |
| Stmt | Chart | **Tabular** (rely on Holdings chart) | — |
| IA | Brokerage tabs | **Overview · Holdings · Activity · Statements**; **Trade = button** | user/QA |
| IA | Daily Movers | **Kept as-is** | user |
| IA | Buy flow | **Flattened single Trade screen** | user |
| Time | Progression | **One-way Next** (Option 1) | QA8 |
| Time | Quarter advance | **Notification → "view your new statement"** | user |
| Time | Final Review | **Year-end capstone summary; no worksheet handoff** | user |
| Time | Control placement | **Top-right** (bank-sim style) | — |
| Time | Evergreen | **No years displayed anywhere** | user |
| Scaffold | Notifications | **Center + badge; statements + trade confirmations only** | user |
| Scaffold | Definitions | **Inline hover/click popovers** | user |
| Scaffold | Orientation | **Dismissible first-visit callouts** | user |
| Scaffold | Coaching nudges | **None** (a real brokerage wouldn't) | user |

---

## 4 · Information architecture (before → after)

**Today:** Splash → `/home`. Browser tabs: *Investing Sim (home) · My Bank · My Investing ·
Admin (hidden) · Bank Sim (hidden)*. Brokerage = 6 tabs (Dashboard, Place Trade, Holdings,
Activity, Profile, Statements). Funding exists in **both** the bank page and the investing
dashboard.

**After:**
- `/` = **Desktop** (no chrome). Click browser icon → opens browser to the **Brokerage**.
- Browser tabs: **Evergreen Bank · Summit Invest** (+ **Admin** hidden for teachers).
- **Bank site:** Savings balance (1.5% APY) + Activity (transfers, interest). Simple.
- **Brokerage site tabs:** **Overview · Holdings · Activity · Statements**, plus a
  **Trade** Buy/Sell button (opens one flattened trade screen). A **Notifications** badge and
  the top-right **Next Quarter** control are global chrome.
- Removed: `/home`, the external `/bank-sim` embed, the Place-Trade wizard, the Profile tab.

---

## 5 · Chunk specs

### Chunk 1 — Desktop → browser spine & onboarding
**Goal:** Entry + account separation become a felt narrative; funding is one visible,
reversible "Make a Transfer" gesture between two institutions.
**Build:**
- Repurpose `SplashComponent` → **Desktop** at `/` (wallpaper + browser icon, "Open the
  browser to get started"). Clicking opens the browser to the **Brokerage** tab.
- `main-layout`: reduce tabs to **Evergreen Bank | Summit Invest** (Admin hidden). Update
  `getCurrentUrl()` domains. (Back/forward are currently `console.log` stubs — out of scope
  unless trivial.)
- Remove `/home` route + `HomeComponent` from the shell. Remove/hide `/bank-sim` + the
  external embed; the bank page links to **its own Activity** (QA1).
- **Onboarding gate** at the brokerage: arrive → **Connect bank** → pre-filled fictional
  details (account holder, Evergreen Bank, routing #, masked acct ••••1234, type) → click
  **"Connect to your Bank"** → **"Securely connecting to Evergreen Bank…"** animation →
  persistent **✓ Connected** indicator. Funding unlocked only after linking.
- **Consolidate funding to one place.** Transfer is **instant + a note** ("instant in this
  simulation; in real life this can take a few days to process"). Withdrawal reverses it
  (surface `TransferDialogComponent`'s `to-banking` direction).
**Data/state:** new `OnboardingService` + `investing_sim__onboarding` (`bankLinked`,
`hasFunded`).
**Reuse:** withdrawal reuses `TransferDialogComponent` (its `to-banking` direction already exists) + `ConfirmationDialogComponent`; the connect-bank dialog follows the existing Material-dialog pattern; **extend** the existing `main-layout` chrome rather than rebuilding it; `OnboardingService` mirrors the existing service + `localStorage` pattern (cf. the `hasAccessedAdmin` tab-gating).
**Acceptance:** can't fund before linking; a transfer visibly debits Evergreen and credits
Summit (and vice-versa for withdrawal); `/home` and the external bank-sim are unreachable.
**Touches:** `pages/splash/*`, `shared/layout/main-layout/*`, `app.routes.ts`,
`features/banking/*`, `transfer-dialog`, new connect-bank dialog + `OnboardingService`.

### Chunk 2 — The point of the transfer (cash with stakes)
**Goal:** Give the transfer a reason via a visible yield trade-off; make cash a first-class
asset.
**Build:**
- Rename bank account → **Savings**; brokerage cash → **Cash Settlement Account**, rendered
  as a **holding line** in Holdings (synthetic row sourced from the brokerage cash balance;
  `% of portfolio` includes cash).
- **Monthly interest** entries: 1.5%/12 (savings) and 0.25%/12 (settlement), posted as
  labeled month-end transactions for the months elapsed up to `currentDate`.
- **APY shown next to each balance** + "paid monthly" tooltip; **"Interest payment"** lines
  appear in each account's Activity.
- Financial-goals card **deferred**.
**Implementation note:** interest generation must be **deterministic & idempotent** — compute
month-end interest from the balance history and insert entries only up to `currentDate`;
never double-post on repeated quarter advances.
**Reuse:** interest accrual lives in `TransactionsService` (beside the existing transfer/trade creation); cash-as-holding is a synthetic row added inside `HoldingsService.holdings$` (extend the existing `combineLatest`, not a new store); interest entries render through the existing Activity/running-balance view; the APY tooltip uses the Ch9 definition popover.
**Acceptance:** balances accrue monthly; interest visible in Activity; Holdings shows a Cash
Settlement Account line @ 0.25%.
**Touches:** `transactions.service` (account naming, accrual), `holdings.service`
(cash-as-holding), banking + holdings views.

### Chunk 3 — Simplified menu
**Goal:** A small, low-volatility, bias-free catalog.
**Build:** Replace the 9-asset catalog with **7 instruments**:

| Type | Instrument |
|---|---|
| Stock (consumer staples) | Harvest Foods Co. |
| Stock (utility) | Granite Power & Light |
| Stock (healthcare) | Sterling Health |
| Mutual fund | Total Stock Market Index Fund |
| ETF | Total Stock Market ETF |
| Target-date | Target Date 2070 Fund |
| Bond fund | Total Bond Market Fund |

- Funds named by type (no brand). **$1 minimum** purchase. Allocation lens **Stocks/Bonds/
  Cash**; **Target Date splits ~90/10**.
- Author **monthly, low-volatility** price series across the (internal) Q4'24–Q4'25 range.
**Data:** rewrite `assets.json`; add per-asset `stockBondSplit` (target-date), `expenseRatio`
(info), `dividendYield` / `secYield`. Update `DataService` categories (the buy groupings
become Stocks / Funds / Bond). `AssetType` can drop `index_fund`.
**Reuse:** pure data + `DataService` config — no new components. Extend the existing `Asset` model (`stockBondSplit`, `secYield`) and edit `getBuyCategories()` in place; labels via `AssetTypePipe`.
**Acceptance:** only the 7 appear; allocation buckets correctly (target-date split applied);
$1 purchases succeed.

### Chunk 4 — Trading realism & correctness
**Goal:** Correct, fee-free, FIFO trading with surfaced (not taxed) gains.
**Build:**
- Remove all trade fees; add a **commission-free explainer** + reflection hook. Show
  **expense ratio** as info on fund details ("comes out of the fund's returns, not your
  statement").
- **FIFO lots:** model each buy as a lot (date/price/shares/remaining); sells consume oldest
  lots; compute **realized gain/loss + ST/LT flag** on each sale (ST = held ≤ 1 yr — note the
  ~1-year sim makes nearly all gains short-term).
- Trades **instant + settlement note** (real-world T+1; mutual fund prices end-of-day, ETF
  trades intraday).
- **Dividends + bond income quarterly** into settlement cash (bond = 30-day SEC yield),
  labeled in Activity + statement Cash Activity.
- **Precision 6/4** and a **single price source per (asset, date)** so a buy never shows an
  instant phantom gain/loss (root cause of the "bought $298, shows $295" report — the trade
  price and Holdings' re-priced value must come from the same source).
**Reuse:** FIFO lots, realized gain/loss, and the single price source replace the cost-basis logic *inside* `HoldingsService` (not a parallel calc); income posts via the existing `TransactionsService` transaction model; commission-free/settlement notes use the Ch9 definition/tooltip pattern.
**Acceptance:** buying shows ~$0 gain/loss immediately; a sale reports realized ST/LT gain;
quarterly income posts; no fee line anywhere.
**Touches:** `holdings.service` (lots, realized gain, price source), `transactions.service`
(income, trade records), trade screen, asset detail.

### Chunk 5 — Performance & charts
**Goal:** Meaningful, clearly-labeled performance views.
**Build:**
- Monthly price data (from Ch3). Replace fixed "90-day" with a **range toggle: 1M / 3M / YTD
  / All, default YTD**. **Label every percentage** with its measure + window.
- **Portfolio-value-over-time line on Holdings**, total + optional per-asset overlay.
- **Compare-all-assets** multi-line chart surfaced on the **Overview** (clicking one drills
  into its own chart). (This view already exists in Admin "All Assets".)
- Honor the existing Y-axis admin option (`lineGraphYAxis`).
**Reuse:** build ONE shared chart component and migrate the existing Chart.js usages onto it (Holdings line, Admin "All Assets", `asset-details-dialog`) — the compare view already exists in Admin, so lift it rather than re-author; range + value series computed once in a service; honor the existing `lineGraphYAxis` option.
**Acceptance:** ranges recompute; no unlabeled %; compare chart shows all 7.

### Chunk 6 — Statement (to Dave's model)
**Goal:** A realistic, reconciling quarterly statement.
**Build:** Rebuild the statement to match Dave's model (`htmlCode.pdf`):
- Header + **"How to read this statement"** help.
- **Change in Account Value** — *This Quarter | Year to Date*.
- **Cash Available** + **Investments** summary boxes that **sum to Ending balance**.
- **Cash Activity** reconciliation (incl. dividends received, interest earned).
- **Deposits & Withdrawals** table.
- **Your Investments** — Investment · Type · Shares · Price · Current Value · **What You
  Paid** · Gain/Loss · **% of Portfolio** (of total account value incl. cash).
- **Portfolio Breakdown = Stocks / Bonds / Cash**.
- **Your Trades** for the period. Support footer + "educational purposes only" disclaimer.
- Fictional names; **year-less** dates ("April 1 – June 30"). **Tabular, no chart.**
**Reuse:** the statement consumes the SAME service-computed values as Holdings/Overview (allocation, value series, gain/loss, income) — no statement-only math; reuse `AssetTypePipe`, the Ch8 evergreen date pipe, and existing card/table styling.
**Acceptance (critical):** **every section reconciles** (Cash Available + Investments =
Ending balance; Cash Activity sums to Ending cash) — this is the fix for the −$5.00 subtotal
bug. Purchase prices present; YTD columns correct.
**Touches:** statement component (replaces `statement-dialog`).

### Chunk 7 — Layout cleanup & de-duplication
**Goal:** One natural home per piece of info; a natural flow.
**Build:**
- Brokerage tabs → **Overview · Holdings · Activity · Statements**. **Trade is a Buy/Sell
  button** opening one **flattened** screen: pick instrument (grouped Stocks / Funds / Bond) →
  buy or sell → amount ($ or shares) → confirm. Retire the 4-step wizard.
- **Fold Profile into Overview.** Overview shows a **modest** "Account value · You've added ·
  Up/down $ (%)" line (QA4) — informational, not a score.
- **Daily Movers kept as-is** on the Overview.
- Write out "Exchange-Traded Fund (ETF)" where helpful (pipe already capitalizes "ETF").
- Bank site stays simple (balance + Activity).
**Reuse:** this chunk *is* de-dup — fold Profile into Overview (delete the duplicate). The flattened Trade screen reuses `ConfirmationDialogComponent` + the amount-input/validation from `TransferDialogComponent`; Overview reuses `holdings-totals` and the shared chart component; drill-ins reuse `asset-details-dialog`.
**Acceptance:** no datum appears in two tabs; Trade reachable in ≤2 clicks; 4 brokerage tabs.
**Touches:** `features/investing/*` (tab set, Overview, trade screen); retire
`place-trade` wizard + Profile.

### Chunk 8 — Time & evergreen
**Goal:** One-way quarterly time, evergreen labeling, statement-centric advance.
**Build:**
- **Next Quarter** control **top-right** (shows current quarter/month, no year);
  confirm-before-advance; **Admin teacher override** retained; student dropdown removed.
- On advance → **notification: "Your Quarter N statement is ready."** (The statement carries
  the recap; the worksheet drives "read your statement" questions.)
- **Year-End Review** (was "Final Review") = capstone summary (final portfolio, full-year
  performance, income earned). **No worksheet handoff.**
- **Evergreen display rule:** a date-formatting pipe that **never emits a year**; relabel the
  internal start period "Opening" (was Q4 2024) and "Year-End Review" (was Final Review).
  Internal ISO dates unchanged.
**Reuse:** extend `CurrentDateService` (don't fork) for one-way advance + labels; confirm-before-advance reuses `quarter-navigation-dialog`; the evergreen date pipe is the single formatter used everywhere; the statement-ready prompt uses the Ch9 `NotificationsService`; teacher override reuses existing Admin patterns.
**Acceptance:** no year visible anywhere; student can't navigate backward; statement prompt
fires on advance.
**Touches:** `current-date.service`, `quarters.json`/`quarters.data`, header/time control,
new evergreen date pipe, admin override, Year-End screen.

### Chunk 9 — Scaffolding (orient only)
**Goal:** Light orientation that never coaches.
**Build:**
- **Notifications center + badge** — **statements + trade/order confirmations ONLY.** (No
  coaching nudges; no dividend/interest notifications — income still posts to cash and shows
  in Activity + statement, it just doesn't notify.)
- **Inline hover/click definition popovers** for key terms (ETF, dividend, APY, expense
  ratio, capital gains, settlement, diversification, …) — 1–2 sentence refreshers.
- **Dismissible first-visit callouts** per page (1–2 light callouts; reopenable via "?"). Not
  a forced walkthrough.
- Commission-free + settlement notes are already placed (Ch4).
**Data/state:** `investing_sim__visited_pages`, `investing_sim__notifications`.
**Reuse:** these are the canonical homes the rest of the app consumes — one `NotificationsService` + one center, one definition-popover directive + one glossary source, one first-visit-callout service (driven by `investing_sim__visited_pages`); badge + popovers use existing Material patterns.
**Acceptance:** definitions reachable inline; first-visit callouts show once then dismiss;
notifications never editorialize.

---

## 6 · Data & state changes

**localStorage keys (existing):** `investing_sim__current_date`,
`investing_sim__holding_transactions`, `investing_sim__transactions`,
`investing_sim__admin_options`.
**New keys:** `investing_sim__onboarding`, `investing_sim__visited_pages`,
`investing_sim__notifications`.

**`assets.json` per-asset shape (target):** `id`, `name`, `type`, `sector`, `description`,
`historicalPerformance` (monthly points), `dividendYield`, `secYield` (bond), `expenseRatio`
(info), `stockBondSplit` (target-date only, e.g. `{stocks: 0.9, bonds: 0.1}`), `trade`.

**New components/services:** Desktop screen, `OnboardingService` + connect-bank dialog,
`NotificationsService` + notifications center/badge, definition-popover directive + glossary
data, first-visit-callout service, evergreen date pipe, flattened Trade screen, rebuilt
Statement component, FIFO lot logic in `HoldingsService`, interest/income accrual in
`TransactionsService`.

---

## 7 · Build sequence

1 (spine) → 2 (cash/interest) → 3 (catalog) → 4 (trading correctness) → 6 (statement) →
5 (charts) → 7 (IA cleanup) → 8 (time/evergreen) → 9 (scaffolding).

Notes: 2 & 3 are prerequisites for 4 and 6. The evergreen date pipe (8) is used by the
statement (6) — build the pipe early if convenient.

---

## 8 · Deferred / out of scope

The **reflection worksheet** (built after this), the **dollar-cost-averaging exercise**,
**in-app tax calculation**, and the **financial-goals snapshot**. The sim deliberately
*surfaces the data* these will use — purchase prices, ST/LT flags, the statement, and income
lines.

---

## 9 · Source materials

- **Notion — Investing Sim Review Agenda** (meeting-level questions / structural ideas).
- **Notion — Investing Sim QA and Feedback** (tracked DB; items referenced as "QAn").
- **Google Doc — Investing Sim TR notes** (Tim's detailed product feedback).
- **Model statement — `htmlCode.pdf`** (Dave's brokerage statement mock; basis for Chunk 6).
- **NGPF Online Bank Simulator worksheet** (the sibling product whose spirit/IA we mirror).
- *Not used:* Ellie's Figma mock (diverges from the browser-style direction).
