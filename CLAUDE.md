# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

InvestingSim is an Angular 19 client-side educational app that simulates investing and banking. Users advance through quarters (Q4 2024 to Q4 2025), buy/sell assets, transfer funds between accounts, and track portfolio performance. All data is static (no backend) and state persists in localStorage.

## Development Commands

```bash
ng serve          # Dev server at http://localhost:4200
ng build          # Production build to dist/investing-sim
ng test           # Unit tests (Karma + Jasmine, Chrome)
ng build --watch --configuration development  # Watch mode
```

## Tech Stack

- Angular 19.2 with standalone components (no NgModules)
- TypeScript 5.7, SCSS
- Angular Material 19.2 (Azure Blue prebuilt theme), Bootstrap 5.3
- Chart.js 4.5 for visualizations
- RxJS BehaviorSubjects for state management
- localStorage for persistence (all keys prefixed `investing_sim__`)

## Architecture

### Reactive Data Flow

The entire app is driven by `CurrentDateService.currentDate$`. Changing the simulation date triggers recalculation everywhere:

1. `CurrentDateService` emits date changes
2. `HoldingsService.holdings$` uses `combineLatest([currentDate$, holdingTransactions$])` to compute current holdings, prices, and gain/loss
3. `TransactionsService.accountData$` uses `combineLatest([currentDate$, transactions$])` to compute account balances
4. Components subscribe to these observables and render reactively

All calculations filter by `date <= currentDate` so only transactions up to the simulation date are included.

### Core Services (`src/app/shared/services/`)

| Service | localStorage Key | Purpose |
|---------|-----------------|---------|
| `CurrentDateService` | `investing_sim__current_date` | Simulation date (default: `2025-01-01`), quarter navigation |
| `HoldingsService` | `investing_sim__holding_transactions` | Buy/sell transactions, share calculations, price resolution from historical data |
| `TransactionsService` | `investing_sim__transactions` | Banking/brokerage account balances, transfers, trade records. Seeds a $5000 initial deposit if empty |
| `DataService` | `investing_sim__admin_options` | Static asset catalog, asset type definitions, admin options (Y-axis scaling, layout mode) |

### Price Resolution

`HoldingsService.getCurrentPrice(asset, date)` resolves prices in order: exact date match, then closest historical point before date, then closest after, then most recent overall.

### Data Layer (`src/app/shared/data/`)

Static JSON files imported as TypeScript constants:
- `assets.json` / `assets.data.ts` - Asset catalog with `AssetType` union: `'stock' | 'mutual_fund' | 'index_fund' | 'etf' | 'target_date_fund' | 'bond_fund'`
- `quarters.json` / `quarters.data.ts` - Quarter definitions (Q4 2024 through Q4 2025), helper functions for date-to-quarter mapping
- `guide.json` / `guide.data.ts` - Per-quarter educational content

### Routing (`app.routes.ts`)

- `/` - Splash page
- `MainLayoutComponent` shell wraps all feature routes: `/home`, `/banking`, `/investing`, `/admin`, `/bank-sim`
- `MainLayoutComponent` includes header (quarter nav) + sidebar (navigation)

### Layout Modes

`DataService.getOptions().layout` controls the shell: `'default'` (standard sidebar/header) or `'web_browser'` (faux browser chrome with URL bar). Configurable from the admin panel.

### Component Patterns

- All components are standalone (no NgModules)
- Chart.js charts are manually created/destroyed in component lifecycle (not via Angular directive) - destroy in `ngOnDestroy` to prevent memory leaks
- Running balances in transaction tables are computed by iterating transactions
- `AssetTypePipe` converts snake_case asset types to display labels

### Accounts

Two hardcoded accounts: `banking001` (Banking Account) and `brokerage001` (Brokerage Account), both with initial balance 0. Transfers move money between them.
