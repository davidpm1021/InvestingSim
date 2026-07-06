/**
 * Guided walkthrough content: a short scene-setter, a quick page tour, and one
 * concise "learning moment" per section of the NGPF Brokerage Simulator activity.
 * Most learning moments carry a check-for-understanding (CFU) question so the
 * student pauses to think, not just click.
 */

/** A check-for-understanding question shown inside a learning-moment pop-up. */
export interface CfuQuestion {
  /** Stable key used to save the student's answer (e.g. 'cfu-connect-why'). */
  id: string;
  prompt: string;
  /** 'mc' = auto-checked multiple choice; 'free' = a written reflection. */
  kind: 'mc' | 'free';
  /** Choices for an 'mc' question, in display order (mark the right one). */
  choices?: { text: string; correct?: boolean }[];
  /** The "why", revealed after an 'mc' question is answered. */
  explanation?: string;
}

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
  /** Check-for-understanding questions for this instruction. The service splits
   *  these onto their own follow-up step, shown after the student clicks Next. */
  questions?: CfuQuestion[];
  /** Set by the service on the synthesized question step (its own screen, shown
   *  right after the related instruction). Authors do not set this directly. */
  kind?: 'question';
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
    questions: [
      {
        id: 'cfu-connect-why',
        kind: 'mc',
        prompt: 'Why does a brokerage make you connect a bank before you can do anything?',
        choices: [
          { text: 'A brokerage holds investments, but the cash to buy them has to come from your bank.', correct: true },
          { text: 'Banks require it by law before you can see any prices.' },
          { text: 'It is how the brokerage pays you interest on your savings.' },
        ],
        explanation: 'The brokerage is where investments live; your bank is where the cash starts. Connecting them lets you move money in to invest, and back out when you want it.',
      },
    ],
  },
  {
    part: 'Part I · Look around',
    title: 'Two accounts, two jobs',
    body: [
      'Savings earns 1.50%; the brokerage cash account earns just 0.25%. You move money over not for interest, but to buy investments that can grow faster.',
    ],
    action: 'Switch between the two browser tabs and compare the balances.',
    questions: [
      {
        id: 'cfu-why-move-money',
        kind: 'mc',
        prompt: 'The cash settlement account pays less interest than your savings. So why move money into the brokerage at all?',
        choices: [
          { text: 'To buy investments, which can grow faster than cash over time.', correct: true },
          { text: 'To earn a higher interest rate than the bank pays.' },
          { text: 'Because money is safer in a brokerage than in a bank.' },
        ],
        explanation: 'You do not move money over for interest. You move it so you can invest; investments like stocks and funds can grow faster than cash over time, though they can also fall.',
      },
    ],
  },
  {
    part: 'Part I · Fund it',
    title: 'Move money in',
    trigger: 'funded',
    body: [
      "You can't invest cash that is still at the bank. (Transfers are instant here, but take a few days in real life.)",
    ],
    action: 'Click Add Funds and transfer money into your brokerage.',
    questions: [
      {
        id: 'cfu-transfer-timing',
        kind: 'mc',
        prompt: 'The transfer is instant here but takes a few days in real life. Why is that worth knowing before you invest?',
        choices: [
          { text: 'In real life the cash would not be ready to trade the instant you click, so you would move it in ahead of time.', correct: true },
          { text: 'Because real transfers charge a fee every time.' },
          { text: 'Because the price of investments changes while you wait.' },
        ],
        explanation: 'If a real transfer takes days to clear, you cannot buy the moment you decide. Planning ahead means your cash is ready when you want to trade.',
      },
    ],
  },
  {
    part: 'Part II · Explore',
    title: 'Meet your investments',
    body: [
      'Seven choices: three stocks, two whole-market funds (a mutual fund and an ETF), a target-date fund, and a bond fund.',
      'The mutual fund and the ETF track the same market. The fund prices once a day after close; the ETF trades live all day, like a stock.',
    ],
    action: 'Click a few Daily Movers to read them, then compare the mutual fund and the ETF.',
    questions: [
      {
        id: 'cfu-types',
        kind: 'mc',
        prompt: 'There are seven investments to choose from. What different types are available?',
        choices: [
          { text: 'Individual stocks, a mutual fund, an ETF, a target-date fund, and a bond fund.', correct: true },
          { text: 'Only individual stocks and individual bonds.' },
          { text: 'Savings accounts, CDs, and money-market funds.' },
        ],
        explanation: 'Three individual stocks, two whole-market funds (a mutual fund and an ETF), a target-date fund, and a bond fund: a spread of ways to invest.',
      },
      {
        id: 'cfu-mf-vs-etf',
        kind: 'mc',
        prompt: 'A mutual fund and an ETF here track the same market. How does the way they trade differ?',
        choices: [
          { text: 'The mutual fund prices once a day after close; the ETF trades all day at a live price, like a stock.', correct: true },
          { text: 'The ETF prices once a day; the mutual fund trades live all day.' },
          { text: 'They trade exactly the same way; only the names differ.' },
        ],
        explanation: 'Same underlying market, different wrapper. A mutual fund settles at one end-of-day price; an ETF trades live throughout the day like a stock.',
      },
    ],
  },
  {
    part: 'Part II · Buy',
    title: 'Build your portfolio',
    body: [
      'Buy at least three different types. Spreading your money around (diversification) means when one drops, another may rise. Trades are free.',
    ],
    action: 'Click Buy and purchase three different types of investment.',
    questions: [
      {
        id: 'cfu-gain-zero',
        kind: 'mc',
        prompt: "Right after you buy, a holding's Gain/Loss is about $0. Why?",
        choices: [
          { text: 'You just bought at the current price, so what you paid and what it is worth still match.', correct: true },
          { text: 'The brokerage hides your gain until the quarter ends.' },
          { text: 'Buying always starts you at a small loss from fees.' },
        ],
        explanation: 'A gain or loss only appears once the price moves away from what you paid, which happens as time passes, not the instant you buy. (Trades here are free.)',
      },
    ],
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
    questions: [
      {
        id: 'cfu-dividend-signal',
        kind: 'mc',
        prompt: 'You received dividend cash this quarter. Is that a sure sign your investments did well?',
        choices: [
          { text: 'No. A stock can pay a dividend even while its price falls, so you could still be down overall.', correct: true },
          { text: 'Yes. Dividends only ever arrive when an investment gains value.' },
          { text: 'Yes. The dividend always equals your gain for the quarter.' },
        ],
        explanation: 'Dividends and bond income are real cash, which is nice. But income is only part of your return; price changes usually matter more, and a dividend can arrive even in a down quarter.',
      },
    ],
  },
  {
    part: 'Part III · Statement',
    title: 'Read your first statement',
    body: [
      "A holding's gain is not real money until you sell it (it is unrealized). That is why the statement splits Cash Available from Investments.",
    ],
    action: 'Open your Quarter 1 statement.',
    questions: [
      {
        id: 'cfu-unrealized',
        kind: 'mc',
        prompt: 'Your statement shows a holding worth more than you paid. Is that gain money you actually have yet?',
        choices: [
          { text: 'No. It is an unrealized gain that only becomes real money when you sell.', correct: true },
          { text: 'Yes. It is already sitting in your cash settlement account.' },
          { text: 'Yes. The brokerage deposits gains into your bank each quarter.' },
        ],
        explanation: 'Until you sell, the price can still rise or fall. That is why the statement separates Cash Available (real settlement cash) from Investments (the current value of what you own).',
      },
    ],
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
    part: 'Part IV · The year',
    title: 'Play out the year',
    body: [
      "Look at each holding's Gain/Loss and the Compare chart. Make trades as you see fit: buy a dip, add to a winner, or trim a position.",
      'Then jump a quarter, open each new statement, and review, repeating through Quarter 4. Which holdings carried you, and did the stocks swing more than the bond fund?',
    ],
    action: 'Trade, advance a quarter, and review, repeating through Quarter 4.',
    questions: [
      {
        id: 'cfu-allocation',
        kind: 'mc',
        prompt: 'Why does it matter how your money is split across stocks, bonds, and cash (your allocation)?',
        choices: [
          { text: 'Different types move differently, so spreading out means one falling may be offset by another. It also sets how much your value swings.', correct: true },
          { text: 'A brokerage charges you less when you hold more types.' },
          { text: 'Allocation only matters for taxes, not for risk.' },
        ],
        explanation: 'Stocks tend to swing more than bonds, and cash barely moves. Your mix drives both how bumpy the ride is and how much room you have to grow. That is diversification.',
      },
    ],
  },
  {
    part: 'Part IV · Cash out',
    title: 'Turning investments back into money',
    body: [
      'Your dividends and interest pile up as settlement cash. To bank it, sell what you want, then use Withdraw Funds.',
    ],
    action: 'Make any final trades, then advance to the Year-End Review.',
    questions: [
      {
        id: 'cfu-cash-out',
        kind: 'mc',
        prompt: "Your settlement cash has piled up. How do you turn that, or a holding's gain, into money in your bank?",
        choices: [
          { text: 'Sell any holdings you want to cash out, then use Withdraw Funds to move the settlement cash to your bank.', correct: true },
          { text: 'The brokerage sends it to your bank automatically at year end.' },
          { text: 'Gains cannot be moved to a bank; they stay in the brokerage.' },
        ],
        explanation: "A holding's gain is not spendable until you sell. After selling, Withdraw Funds moves your settlement cash back to Evergreen Bank.",
      },
    ],
  },
  {
    part: 'Part V · Reflect',
    title: 'Take a moment',
    body: [
      'You funded a brokerage, invested, rode the ups and downs, and read your statements. Before you finish, take a moment to reflect.',
    ],
    action: 'Click Next to jot down a thought.',
    questions: [
      {
        id: 'cfu-reflect',
        kind: 'free',
        prompt: 'Looking back over the year, what surprised you about how your investments behaved? Or: what is one thing you would want to know before opening a real brokerage account?',
      },
    ],
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
