/**
 * Single glossary source for inline definitions. Concepts are pre-taught, these are
 * brief refreshers, not lessons. Add a term here and wrap it anywhere with
 * <app-define term="...">.
 */
export const GLOSSARY: { [term: string]: string } = {
  // Accounts & cash
  'Brokerage account': 'An account used to buy and hold investments like stocks, funds, and bonds.',
  'Cash Settlement Account': 'The cash in your brokerage account waiting to be invested or withdrawn. It earns a small yield.',
  'Cash Available': "Cash in your brokerage account that isn't invested, ready to buy investments or to withdraw.",
  'Settlement': 'The short delay before a trade is final and the cash is available, usually the next business day (T+1).',
  'Transfer': 'Moving money between accounts, for example, from your bank to your brokerage account to fund investing.',
  'APY': 'Annual Percentage Yield: the interest you earn on cash over a year, including compounding.',
  'Compounding': 'Earning returns on your past returns, so growth builds on itself over time.',

  // Investment types
  'Fund': 'A basket of many investments bundled together, so a single purchase spreads your money across lots of holdings at once.',
  'Stock': 'A share of ownership in a single company. Prices can swing a lot, so individual stocks are riskier than diversified funds.',
  'ETF': 'Exchange-Traded Fund: a basket of investments that trades on an exchange throughout the day, like a stock.',
  'Mutual fund': 'A professionally managed basket of investments that prices once per day, after the market closes.',
  'Index fund': 'A fund that simply tracks a market index (like the whole U.S. stock market) instead of being actively managed, usually low-cost.',
  'Target-date fund': 'A single fund holding a diversified mix that gradually shifts from stocks toward bonds as its target year nears.',
  'Bond fund': 'A fund holding many bonds (loans to governments or companies). Generally steadier than stocks, paying income from interest.',
  'Investments': "The current value of everything you own in your brokerage account (stocks, funds, bonds), not counting cash.",
  'Quarterly statement': "A summary of your brokerage account for a three-month period (a quarter): your holdings, cash, and the quarter's activity.",

  // Returns, income & costs
  'Interest': 'Money your bank or cash account pays you for holding cash there, usually added each month.',
  'Dividend': 'A cash payment some companies and funds make to shareholders, usually each quarter.',
  'Yield': 'The income an investment pays, shown as an annual percentage of its price.',
  '30-day SEC yield': "A standardized estimate of a bond fund's recent income, shown as an annual percentage.",
  'Expense ratio': "A fund's annual fee, taken out of the fund's returns over time, not charged on your statement.",
  'Commission-free': 'No fee to buy or sell. Most brokerage accounts no longer charge a per-trade commission.',
  'Cost basis': 'What you originally paid for the shares you still hold, used to figure out your gain or loss.',
  'Gain/Loss': "The difference between what a holding is worth now and what you paid. It isn't 'realized' until you sell.",
  'Capital gain': 'The profit when you sell an investment for more than you paid.',
  'Capital gains tax': 'Tax on the profit when you sell an investment for more than you paid. You owe it only once you sell, not while the value is still on paper.',
  'Short-term gain': 'Profit on an investment held one year or less, usually taxed at a higher rate than long-term gains.',
  'Long-term gain': 'Profit on an investment held more than one year, usually taxed at a lower rate than short-term gains.',

  // Strategy & market
  'Diversification': 'Spreading your money across different investments so no single one can sink your whole portfolio.',
  'Asset allocation': 'How your money is split across asset classes: stocks, bonds, and cash. A key way to manage risk.',
  'Market price': 'The current price an investment trades at. ETFs trade at market price all day; mutual funds price once daily.',
  'Volatility': 'How much an investment’s price moves up and down. Higher volatility means bigger swings, and more risk.'
};
