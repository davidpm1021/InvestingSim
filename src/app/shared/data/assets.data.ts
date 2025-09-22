export interface AssetPerformancePoint {
    date: string;
    value: number;
}

export interface Asset {
    id: string;
    name: string;
    type: 'stock' | 'mutual_fund' | 'index_fund' | 'etf' | 'target_date_fund' | 'bond_fund';
    sector: string;
    description: string;
    historicalPerformance: AssetPerformancePoint[];
    dividendYield?: number | null;
    interestRate?: number | null;
    expenseRatio?: number | null;
    trade: {
        inputModes: ('shares' | 'dollars')[];
        execution: {
            priceType: 'market';
            speed: 'instant';
        };
    };
}

export const ASSETS: Asset[] = [
    {
        id: "AAPL",
        name: "Apple Inc.",
        type: "stock",
        sector: "Technology",
        description: "Consumer electronics and software company.",
        historicalPerformance: [
            { date: "2024-10-01", value: 115 },
            { date: "2025-01-01", value: 120 },
            { date: "2025-04-01", value: 128 },
            { date: "2025-07-01", value: 122 },
            { date: "2025-10-01", value: 135 },
            { date: "2026-01-01", value: 142 }
        ],
        dividendYield: 0.006,
        interestRate: null,
        expenseRatio: null,
        trade: {
            inputModes: ["shares", "dollars"],
            execution: { priceType: "market", speed: "instant" }
        }
    },
    {
        id: "TSLA",
        name: "Tesla Inc.",
        type: "stock",
        sector: "Automotive",
        description: "Electric vehicle and clean energy company.",
        historicalPerformance: [
            { date: "2024-10-01", value: 190 },
            { date: "2025-01-01", value: 200 },
            { date: "2025-04-01", value: 185 },
            { date: "2025-07-01", value: 205 },
            { date: "2025-10-01", value: 195 },
            { date: "2026-01-01", value: 185 }
        ],
        dividendYield: null,
        interestRate: null,
        expenseRatio: null,
        trade: {
            inputModes: ["shares", "dollars"],
            execution: { priceType: "market", speed: "instant" }
        }
    },
    {
        id: "JPM",
        name: "JPMorgan Chase & Co.",
        type: "stock",
        sector: "Financials",
        description: "Global financial services and investment banking firm.",
        historicalPerformance: [
            { date: "2024-10-01", value: 90 },
            { date: "2025-01-01", value: 95 },
            { date: "2025-04-01", value: 102 },
            { date: "2025-07-01", value: 98 },
            { date: "2025-10-01", value: 105 },
            { date: "2026-01-01", value: 108 }
        ],
        dividendYield: 0.025,
        interestRate: null,
        expenseRatio: null,
        trade: {
            inputModes: ["shares", "dollars"],
            execution: { priceType: "market", speed: "instant" }
        }
    },
    {
        id: "VFINX",
        name: "Vanguard 500 Index Fund",
        type: "index_fund",
        sector: "Broad Market",
        description: "Tracks the performance of the S&P 500 index.",
        historicalPerformance: [
            { date: "2024-10-01", value: 290 },
            { date: "2025-01-01", value: 300 },
            { date: "2025-04-01", value: 285 },
            { date: "2025-07-01", value: 295 },
            { date: "2025-10-01", value: 305 },
            { date: "2026-01-01", value: 298 }
        ],
        dividendYield: 0.012,
        interestRate: null,
        expenseRatio: 0.0004,
        trade: {
            inputModes: ["shares", "dollars"],
            execution: { priceType: "market", speed: "instant" }
        }
    },
    {
        id: "SWTSX",
        name: "Schwab Total Stock Market Index Fund",
        type: "mutual_fund",
        sector: "Broad Market",
        description: "Provides exposure to the entire U.S. equity market.",
        historicalPerformance: [
            { date: "2024-10-01", value: 48 },
            { date: "2025-01-01", value: 50 },
            { date: "2025-04-01", value: 52 },
            { date: "2025-07-01", value: 49 },
            { date: "2025-10-01", value: 53 },
            { date: "2026-01-01", value: 51 }
        ],
        dividendYield: 0.010,
        interestRate: null,
        expenseRatio: 0.0003,
        trade: {
            inputModes: ["shares", "dollars"],
            execution: { priceType: "market", speed: "instant" }
        }
    },
    {
        id: "VTI",
        name: "Vanguard Total Stock Market ETF",
        type: "etf",
        sector: "Broad Market",
        description: "Covers virtually all U.S. investable stocks.",
        historicalPerformance: [
            { date: "2024-10-01", value: 195 },
            { date: "2025-01-01", value: 200 },
            { date: "2025-04-01", value: 205 },
            { date: "2025-07-01", value: 198 },
            { date: "2025-10-01", value: 208 },
            { date: "2026-01-01", value: 202 }
        ],
        dividendYield: 0.013,
        interestRate: null,
        expenseRatio: 0.0003,
        trade: {
            inputModes: ["shares", "dollars"],
            execution: { priceType: "market", speed: "instant" }
        }
    },
    {
        id: "VFFX",
        name: "Vanguard Target Retirement 2045 Fund",
        type: "target_date_fund",
        sector: "Mixed Allocation",
        description: "Designed for investors planning to retire around 2045.",
        historicalPerformance: [
            { date: "2024-10-01", value: 98 },
            { date: "2025-01-01", value: 100 },
            { date: "2025-04-01", value: 96 },
            { date: "2025-07-01", value: 103 },
            { date: "2025-10-01", value: 99 },
            { date: "2026-01-01", value: 105 }
        ],
        dividendYield: 0.011,
        interestRate: null,
        expenseRatio: 0.0013,
        trade: {
            inputModes: ["shares", "dollars"],
            execution: { priceType: "market", speed: "instant" }
        }
    },
    {
        id: "AGG",
        name: "iShares Core U.S. Aggregate Bond ETF",
        type: "bond_fund",
        sector: "Bonds",
        description: "Tracks the U.S. investment-grade bond market.",
        historicalPerformance: [
            { date: "2024-10-01", value: 108 },
            { date: "2025-01-01", value: 110 },
            { date: "2025-04-01", value: 112 },
            { date: "2025-07-01", value: 108 },
            { date: "2025-10-01", value: 114 },
            { date: "2026-01-01", value: 111 }
        ],
        dividendYield: null,
        interestRate: 0.02,
        expenseRatio: 0.0005,
        trade: {
            inputModes: ["shares", "dollars"],
            execution: { priceType: "market", speed: "instant" }
        }
    },
    {
        id: "BND",
        name: "Vanguard Total Bond Market ETF",
        type: "bond_fund",
        sector: "Bonds",
        description: "Broad exposure to U.S. investment-grade bonds.",
        historicalPerformance: [
            { date: "2024-10-01", value: 78 },
            { date: "2025-01-01", value: 80 },
            { date: "2025-04-01", value: 82 },
            { date: "2025-07-01", value: 79 },
            { date: "2025-10-01", value: 84 },
            { date: "2026-01-01", value: 81 }
        ],
        dividendYield: null,
        interestRate: 0.022,
        expenseRatio: 0.0004,
        trade: {
            inputModes: ["shares", "dollars"],
            execution: { priceType: "market", speed: "instant" }
        }
    }
];