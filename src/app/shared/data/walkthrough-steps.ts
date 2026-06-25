/**
 * Guided walkthrough content: a short scene-setter + one concise "learning
 * moment" for every checklist item in the NGPF Brokerage Simulator activity.
 * Each step is a pop-up the student reads before continuing.
 */
export interface WalkthroughStep {
  /** Short section label shown as a chip (e.g. "Part I · Set up"). */
  part: string;
  title: string;
  /** Short paragraphs: the point + the "why" (the learning moment). */
  body: string[];
  /** The concrete thing to do in the app, highlighted as a call to action. */
  action?: string;
  /** Primary button label (defaults to "Continue"). */
  cta?: string;
  /** Auto-advance trigger, only for steps with one obvious completion event.
   *  Open-ended steps (buy, sell, explore) have none and proceed manually. */
  trigger?: 'browser-open' | 'bank-linked' | 'funded' | 'quarter-advanced';
  /** CSS selector to spotlight for a page-tour step: the overlay highlights the
   *  element and anchors a small callout to it instead of centering a modal. */
  target?: string;
  /** Scroll the page back to the top when this step opens (the tour leaves the
   *  page scrolled down at the lower cards). */
  scrollTop?: boolean;
}

export const WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    part: 'Welcome',
    title: 'So you want to invest',
    body: [
      "You have $5,000 in savings and some curiosity. Let's open a brokerage account, safely in a simulation, and put a little of it to work.",
    ],
    action: 'Ready? Let us begin.',
    cta: "Let's go",
  },
  {
    part: 'Part I · Set up',
    title: 'Open your brokerage',
    trigger: 'browser-open',
    body: [
      'A brokerage is where you buy and hold investments. Open the browser to reach yours, Summit Invest.',
    ],
    action: 'Open the Web Browser on the desktop.',
  },
  // --- Page tour: highlight the parts of Summit Invest before connecting ---
  {
    part: 'Tour',
    title: 'A quick look around',
    target: '.browser-tabs',
    body: ['These two tabs switch between Evergreen Bank (your cash) and Summit Invest (your investments).'],
  },
  {
    part: 'Tour',
    title: 'Overview tab',
    target: '.tour-tab-overview',
    body: ['Your home base: balances, the Daily Movers, and where you Buy and Sell.'],
  },
  {
    part: 'Tour',
    title: 'Holdings tab',
    target: '.tour-tab-holdings',
    body: ['Everything you own, plus your portfolio value over time.'],
  },
  {
    part: 'Tour',
    title: 'Activity tab',
    target: '.tour-tab-activity',
    body: ['Every trade, dividend, and interest payment, listed out.'],
  },
  {
    part: 'Tour',
    title: 'Statements tab',
    target: '.tour-tab-statements',
    body: ['Your quarterly statements show up here, once each quarter ends.'],
  },
  {
    part: 'Tour',
    title: 'Daily Movers',
    target: '.daily-movers-card',
    body: ['The investments you can buy, with live prices. Click any one to read about it.'],
  },
  {
    part: 'Tour',
    title: 'Compare Investments',
    target: '.compare-card',
    body: ['And this chart shows how every investment has moved over time.'],
  },
  {
    part: 'Part I · Connect',
    title: 'Connect your bank',
    trigger: 'bank-linked',
    scrollTop: true,
    body: [
      'A brokerage holds investments, but the cash to buy them comes from your bank. Connecting it lets you move money in and out.',
    ],
    action: 'On the Overview tab, click "Connect Your Bank", then "Connect to your Bank".',
  },
  {
    part: 'Part I · Look around',
    title: 'Two accounts, two jobs',
    body: [
      'Savings earns 1.50%; the brokerage cash account earns just 0.25%. You move money over not for interest, but to buy investments that can grow faster.',
    ],
    action: 'Switch between the two browser tabs and compare the balances.',
  },
  {
    part: 'Part I · Fund it',
    title: 'Move money in',
    trigger: 'funded',
    body: [
      "You can't invest cash that is still at the bank. (Transfers are instant here, but take a few days in real life.)",
    ],
    action: 'Click Add Funds and transfer money into your brokerage.',
  },
  {
    part: 'Part II · Explore',
    title: 'Meet your investments',
    body: [
      'Seven choices: three stocks, two whole-market funds (a mutual fund and an ETF), a target-date fund, and a bond fund.',
    ],
    action: 'Click a few Daily Movers and read their descriptions.',
  },
  {
    part: 'Part II · Learn',
    title: 'Same thing, two wrappers',
    body: [
      'The mutual fund and the ETF track the same market. The fund prices once a day after close; the ETF trades live all day, like a stock.',
    ],
    action: 'Compare the mutual fund and the ETF.',
  },
  {
    part: 'Part II · Buy',
    title: 'Build your portfolio',
    body: [
      'Buy at least three different types. Spreading your money around (diversification) means when one drops, another may rise. Trades are free.',
    ],
    action: 'Click Buy and purchase three different types of investment.',
  },
  {
    part: 'Part II · Notice',
    title: 'Why your gain is $0',
    body: [
      'Right after buying, your gain is about $0, because you paid the current price. It only changes once prices move, which happens as time passes.',
    ],
    action: 'Check the Gain/Loss on a new holding.',
  },
  {
    part: 'Part III · Time',
    title: 'Fast-forward a quarter',
    trigger: 'quarter-advanced',
    body: [
      'Time moves one way, so finalize your trades first. Then jump ahead.',
    ],
    action: 'Click Jump to Quarter 2 and confirm.',
  },
  {
    part: 'Part III · Alerts',
    title: 'What a brokerage tells you',
    body: [
      'A real brokerage sends only facts, like "your statement is ready", never advice. The decisions stay yours.',
    ],
    action: 'Open the Notifications bell.',
  },
  {
    part: 'Part III · Income',
    title: 'Money that shows up on its own',
    body: [
      'Interest posts monthly; dividends and bond income post each quarter as cash into your settlement account, not as trades. Nice, but a dividend can arrive even while a price falls.',
    ],
    action: 'Check Recent Transactions at Evergreen Bank, then the Recent Transactions card on the Summit Invest Overview, just below Recent Trade Activity.',
  },
  {
    part: 'Part III · Statement',
    title: 'Read your first statement',
    body: [
      "A holding's gain is not real money until you sell it (it is unrealized). That is why the statement splits Cash Available from Investments.",
    ],
    action: 'Open your Quarter 1 statement.',
  },
  {
    part: 'Part III · Sell',
    title: 'Selling, and the tax twist',
    body: [
      'Sales are tagged ST or LT. Almost all here are short-term (held under a year); in real life, long-term gains are usually taxed less.',
    ],
    action: 'Sell part of a holding, then open the Activity tab.',
  },
  {
    part: 'Part IV · Your move',
    title: 'Read the market, then act',
    body: [
      "Look at the Compare chart and each holding's Gain/Loss. Something down that you still believe in? Up more than you'd like? Make at least one trade: buy a dip, add to a winner, or trim a position.",
    ],
    action: 'Analyze your holdings, then buy or sell at least once.',
  },
  {
    part: 'Part IV · The year',
    title: 'Play out the year',
    body: [
      'Jump a quarter, then open your statement and the Compare chart: which holdings carried you, which dragged, and did the stocks swing more than the bond fund? Trade, advance, and repeat through Quarter 4.',
    ],
    action: 'Trade, advance a quarter, and review, repeating through Quarter 4.',
  },
  {
    part: 'Part IV · Cash out',
    title: 'Turning investments back into money',
    body: [
      'Your dividends and interest pile up as settlement cash. To bank it, sell what you want, then use Withdraw Funds.',
    ],
    action: 'Make any final trades, then advance to the Year-End Review.',
  },
  {
    part: 'You did it',
    title: 'One year as an investor',
    body: [
      'You funded a brokerage, invested, weathered the ups and downs, and read your statements. The real thing works just like this.',
    ],
    action: 'Close the guide and keep exploring.',
    cta: 'Finish',
  },
];
