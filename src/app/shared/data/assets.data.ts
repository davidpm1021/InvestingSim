import assetsData from './assets.json';

export interface AssetPerformancePoint {
    date: string;
    value: number;
}

export type AssetType = 'stock' | 'mutual_fund' | 'etf' | 'target_date_fund' | 'bond_fund';

export interface Asset {
    id: string;
    name: string;
    type: AssetType;
    sector: string;
    description: string;
    historicalPerformance: AssetPerformancePoint[];
    dividendYield?: number | null;
    interestRate?: number | null;
    /** 30-day SEC yield for bond funds (used for income in Chunk 4). */
    secYield?: number | null;
    expenseRatio?: number | null;
    /** Asset-class split for blended funds (e.g. target-date). Defaults to all-stocks. */
    stockBondSplit?: { stocks: number; bonds: number };
    trade: {
        inputModes: ('shares' | 'dollars')[];
        execution: {
            priceType: 'market';
            speed: 'instant';
        };
    };
}

export const ASSETS: Asset[] = assetsData as Asset[];