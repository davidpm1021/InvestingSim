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
  /** Build the choices from the student's own portfolio instead of authoring them,
   *  so the right answer is a number they can actually read off the screen. */
  dynamic?: 'account-change';
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
  /** An aside about how the simulation works, shown small and muted at the foot of
   *  the step. For housekeeping facts that would interrupt the teaching copy. */
  note?: string;
  /** Primary button label (defaults to "Continue"). */
  cta?: string;
  /** Auto-advance trigger, only for steps with one obvious completion event.
   *  Open-ended steps (buy, sell, explore) have none and proceed manually. */
  trigger?: 'browser-open' | 'bank-linked' | 'funded' | 'quarter-advanced' | 'year-end';
  /** CSS selector to spotlight for a page-tour step: the overlay highlights the
   *  element and anchors a small callout to it instead of centering a modal. */
  target?: string;
  /** Scroll the page back to the top when this step opens (the tour leaves the
   *  page scrolled down at the lower cards). */
  scrollTop?: boolean;
  /** Suppress the automatic glossary hover-definitions in this step's body. */
  noGlossary?: boolean;
  /** Lock forward progress until the step's action is done: the manual
   *  "Next step" control is disabled, so only the auto-advance trigger can
   *  move past it (e.g. you must actually open the browser). */
  requireAction?: boolean;
  /** Lock forward progress until this checklist milestone is complete. Like
   *  requireAction, but gated on a real portfolio action (buy/sell/etc.) rather
   *  than a one-shot event. Auto-advances when the milestone is reached, and
   *  unlocks immediately if the student already did it before arriving here. */
  gate?: 'buy' | 'sell' | 'statement' | 'withdraw';
  /** Lock forward progress until the student has bought this many DISTINCT investments
   *  (used by "Build your portfolio", which asks for three different ones). Unlike
   *  gate:'buy' (one buy), this requires several, and auto-advances only once the count
   *  is reached. Unlocks immediately if the student already bought that many. */
  requireDistinctBuys?: number;
  /** Seal off Back at this step: earlier steps referenced a screen that is no
   *  longer visible (the desktop), so hide Back so the student can't rewind
   *  into stale, out-of-context instructions. */
  sealBack?: boolean;
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
      "You have $5,000 in savings. Let's open a brokerage account and put that money to work.",
    ],
    cta: "Let's go",
  },
  {
    part: 'Part I · Set up',
    title: 'Open your brokerage account',
    trigger: 'browser-open',
    noGlossary: true,
    requireAction: true,
    body: [
      'Bank accounts hold cash you can spend or save. A brokerage account holds investments you buy, sell and own.',
      'You will connect (or "link") your bank account to your brokerage account later to move money between them.',
    ],
    action: 'Open the Web Browser on the desktop.',
  },
  // --- Page tour: highlight the parts of Summit Invest before connecting ---
  {
    part: 'Tour',
    title: 'A quick look around',
    sealBack: true,
    target: '.browser-tabs',
    body: ['These two tabs switch between Evergreen Bank, where your cash is held, and Summit Invest, where your investments are held.'],
  },
  {
    part: 'Part I · Connect',
    title: 'Connect your bank',
    trigger: 'bank-linked',
    requireAction: true,
    scrollTop: true,
    body: [
      'A brokerage account holds investments, but the cash to buy them comes from your bank. Connecting it lets you move money in and out.',
    ],
    action: 'On the Overview tab, click "Connect Your Bank", then "Connect to your Bank".',
    questions: [
      {
        id: 'cfu-connect-why',
        kind: 'mc',
        prompt: 'Why does a brokerage account make you connect a bank account before you can do anything?',
        choices: [
          { text: 'A brokerage account holds investments, but the cash to buy them has to come from your bank account.', correct: true },
          { text: 'Banks require it by law before you can see any prices.' },
          { text: 'It is how the brokerage account pays you interest on your savings.' },
        ],
        explanation: 'The brokerage account is where investments live; your bank account is where the cash starts. Connecting them lets you move money in to invest, and back out when you want it.',
      },
    ],
  },
  {
    part: 'Tour',
    title: 'Overview tab',
    target: '.tour-tab-overview',
    body: ['Your home base: balances, the investments you can buy, and where you Buy and Sell.'],
  },
  {
    part: 'Tour',
    title: 'Holdings tab',
    target: '.tour-tab-holdings',
    body: ['The investments you own, and your portfolio value over time.'],
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
    title: 'Your checklist',
    target: '.nb-panel',
    body: ['This notebook tracks your progress through the seven steps and crosses each one off as you go. You can minimize it with the button in its top corner and reopen it whenever you like.'],
  },
  {
    part: 'Part I · Look around',
    title: 'Two accounts, two jobs',
    body: [
      'In this simulation, your savings account and your cash settlement account pay different interest rates. You move money into the settlement account not to earn interest, but to buy investments, which can grow faster than cash over time (though they can also fall).',
    ],
    action: 'Switch between the two tabs and see which account pays more interest.',
    questions: [
      {
        id: 'cfu-why-move-money',
        kind: 'mc',
        prompt: 'In this simulation, the cash settlement account earns less interest than your savings. So why move money into it at all?',
        choices: [
          { text: 'To buy investments, which can grow faster than cash over time.', correct: true },
          { text: 'To earn a higher interest rate than the bank pays.' },
          { text: 'To keep your money safer than in a bank.' },
        ],
        explanation: 'Here, your cash settlement account earns less than savings, so moving money over is about investing, not interest. Investing can grow faster than cash over time, though it can also lose value. In real life this is not a rule: some cash settlement accounts pay more than a basic savings account and some pay less, so it is worth checking the actual rates.',
      },
    ],
  },
  {
    part: 'Part I · Fund it',
    title: 'Move money in',
    trigger: 'funded',
    requireAction: true,
    body: [
      "You can't invest cash that is still at the bank.",
    ],
    action: 'Click Add Funds and transfer money into your brokerage account.',
    questions: [
      {
        id: 'cfu-transfer-timing',
        kind: 'mc',
        prompt: 'The transfer is instant here, but in real life it can take a few days. Why is that worth knowing before you invest?',
        choices: [
          { text: 'Because the cash might not be ready to trade right away, so you would move it in ahead of time.', correct: true },
          { text: 'Because real transfers charge a fee every time.' },
          { text: 'Because the price of investments changes while you wait.' },
        ],
        explanation: 'A real transfer can take a few days to clear, so the money is not ready to invest right away. Moving cash over ahead of time means it is there when you want to trade.',
      },
    ],
  },
  {
    part: 'Part II · Explore',
    title: 'Meet your investments',
    body: [
      'In this simulation, you have seven investments to choose from: three stocks, a mutual fund, an ETF, a target-date fund, and a bond fund.',
      'The mutual fund and the ETF track the same market. The mutual fund is priced once a day, after the market closes; the ETF trades live all day, like a stock.',
    ],
    action: 'Click a few investments to read about them, then compare the mutual fund (TSMX) and the ETF (TSME).',
    questions: [
      {
        id: 'cfu-which-etf',
        kind: 'mc',
        prompt: 'Which of these investments is an ETF?',
        choices: [
          { text: 'Total Stock Market', correct: true },
          { text: 'Total Stock Market Index Fund' },
          { text: 'Target Date 2070 Fund' },
        ],
        explanation: 'The Total Stock Market ETF is the ETF, so it trades on an exchange all day, like a stock. The index fund is a mutual fund, and the target-date fund is a blended fund of stocks and bonds.',
      },
      {
        id: 'cfu-which-daily',
        kind: 'mc',
        prompt: 'Which of these is priced just once a day, after the market closes?',
        choices: [
          { text: 'Total Stock Market Index Fund', correct: true },
          { text: 'Total Stock Market ETF' },
          { text: 'Sterling Health' },
        ],
        explanation: 'The Total Stock Market Index Fund is a mutual fund, so it is priced once a day after close. The ETF and the stock (Sterling Health) both trade live all day at the market price.',
      },
    ],
  },
  {
    part: 'Part II · Buy',
    title: 'Build your portfolio',
    requireDistinctBuys: 3,
    noGlossary: true,
    body: [
      'Buy three different investments. Spreading your money out is called diversification, and it means no single investment can make or break your results. Mixing different types, say a stock, a fund and a bond fund, spreads it further, because they tend not to all move together.',
    ],
    action: 'Click Buy and purchase three different investments.',
    note: 'Trades are free in this simulation.',
    questions: [
      {
        id: 'cfu-gain-zero',
        kind: 'mc',
        prompt: "Right after you buy, a holding's Gain/Loss is $0.00. Why?",
        choices: [
          { text: 'You just bought at the current price, so what you paid and what it is worth still match.', correct: true },
          { text: 'The brokerage account hides your gain until the quarter ends.' },
          { text: 'Buying always starts you at a small loss from fees.' },
        ],
        explanation: 'A gain or loss only appears once the price moves away from what you paid, which happens as time passes, not the instant you buy.',
      },
    ],
  },
  {
    part: 'Part III · Time',
    title: 'Fast-forward a quarter',
    trigger: 'quarter-advanced',
    requireAction: true,
    body: [
      'Prices move over time. Jump to the next quarter to see whether your investments gained or lost value. Quarters only move forward, so make any trades you want at today\'s prices first.',
    ],
    action: 'At the top of the page, click Jump to Quarter 2, then confirm.',
  },
  {
    part: 'Part III · Check in',
    title: 'Three months later',
    scrollTop: true,
    body: [
      'A quarter is three months, so three months of price movement just went by. Your investments are now worth whatever they would sell for today, which is probably not what you paid.',
      'The Overview tab shows your account value and the Gain/Loss on each holding. The Holdings tab goes deeper, with your portfolio value over time and the price history of any holding you select.',
    ],
    action: "On the Overview tab, check your account value and each holding's Gain/Loss, then open the Holdings tab for a closer look.",
    questions: [
      {
        id: 'cfu-quarter-change',
        kind: 'mc',
        dynamic: 'account-change',
        prompt: 'Look at the "Up / down" row of the Portfolio Summary card. How much has your account increased or decreased in value?',
        explanation: 'The "Up / down" row is the change: what your account is worth now, minus the money you added. The other two are the account total and your contributions, and neither one on its own tells you whether you gained or lost. Not all of that change came from prices moving, though. Some of it is dividend and interest payments, which is what you will look at next.',
      },
    ],
  },
  {
    part: 'Part III · Income',
    title: 'Unearned Income',
    body: [
      'Your savings earns interest each month. Your investments can pay dividends or bond income each quarter, added as cash to your cash settlement account, not as trades. A dividend can even arrive while a price falls.',
    ],
    action: 'Open the Activity tab and scroll to Income Received. Find your dividend or bond income, and look at where it landed.',
    questions: [
      {
        id: 'cfu-income-lands',
        kind: 'mc',
        prompt: 'Your investments paid a dividend or bond income this quarter. Where did that cash go?',
        choices: [
          { text: 'Into your cash settlement account, as cash.', correct: true },
          { text: 'Straight into your Evergreen Bank savings.' },
          { text: 'It was reinvested to buy more shares automatically.' },
        ],
        explanation: 'Here, income lands as cash in your cash settlement account, ready to reinvest or move to your bank, and it is never sent to your savings. Real brokerages handle it differently: many can reinvest dividends for you automatically, buying more shares instead of leaving the cash sitting there. That is usually a setting you choose, so check with your brokerage to see what yours does.',
      },
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
    gate: 'statement',
    body: [
      'A statement is the official record of your account for one period of time, here a single quarter. It shows what you started with, the money you added, what your investments earned or lost, and what you ended with. Every brokerage sends them, and it is how you check your own account rather than taking anyone\'s word for it.',
      "Until you sell a holding, its gain is unrealized: not real money yet, just value on paper. Selling is what turns it into cash. That is why the statement splits Cash Available from Investments.",
    ],
    action: "Open the Statements tab, or click the \"statement is ready\" notification, then open your Quarter 1 statement.",
    questions: [
      {
        id: 'cfu-unrealized',
        kind: 'mc',
        prompt: 'Suppose a holding is worth more than you paid. Is that gain money you can spend yet?',
        choices: [
          { text: 'No. It is an unrealized gain that only becomes real money when you sell.', correct: true },
          { text: 'Yes. It is already sitting in your cash settlement account.' },
          { text: 'Yes. The brokerage account deposits gains into your bank each quarter.' },
        ],
        explanation: 'Until you sell, the price can still rise or fall. That is why the statement separates Cash Available (the real cash in your cash settlement account) from Investments (the current value of what you own).',
      },
      {
        id: 'cfu-statement-read',
        kind: 'mc',
        prompt: 'Your account value changed this quarter. How does the statement show how much came from your investments, not just money you added?',
        choices: [
          { text: 'It lists "Money you added" separately from your investment gain/loss and income.', correct: true },
          { text: 'It does not; the statement only shows the ending total.' },
          { text: 'The whole change counts as your investment gain or loss.' },
        ],
        explanation: 'The statement splits the change in your account into money you added versus what your investments gained or lost, plus any income. That separation shows your true return.',
      },
    ],
  },
  {
    part: 'Part III · Sell',
    title: 'Selling, and the tax twist',
    gate: 'sell',
    body: [
      'Selling for a profit can mean paying capital gains tax. A sale is tagged short-term (ST) if you held the investment for a year or less, or long-term (LT) if you held it longer. This simulation covers a single year, so nearly every sale here is short-term. In real life, long-term gains are usually taxed at a lower rate, which is one reason people hold on longer.',
    ],
    action: 'On the Overview tab, click Sell in the Portfolio Summary card. Pick one of your holdings from the Investment list, choose Shares, and enter fewer shares than you own so you keep part of it. Confirm the sale, then open the Activity tab to find it.',
  },
  {
    part: 'Part IV · Review',
    title: 'See how each investment did',
    scrollTop: true,
    body: [
      'You have seen your account total move. Now compare your investments against each other. The Performance chart plots every investment as a percent change since the start, so you can see which pulled ahead and which lagged, on the same scale.',
      'Percent matters more than dollars for this: a holding you put more money into will show a bigger dollar swing even if it barely moved.',
    ],
    action: 'On the Overview, use the Performance chart to compare your investments against each other, then open the Holdings tab to compare their price histories.',
    questions: [
      {
        id: 'cfu-holdings-diverge',
        kind: 'mc',
        prompt: 'Look at the Gain/Loss next to each holding. In the same quarter, one is up (green) and another is down (red). What does that tell you?',
        choices: [
          { text: 'Different investments move differently, so some can rise while others fall in the same period.', correct: true },
          { text: 'One of the numbers must be an error, because holdings always move together.' },
          { text: 'The holding that is down is guaranteed to recover by next quarter.' },
        ],
        explanation: 'Prices move independently, so in any quarter some holdings gain while others lose. Holding a mix is what lets a winner cushion a loser. That is diversification doing its job.',
      },
      {
        id: 'cfu-trim-winner',
        kind: 'mc',
        prompt: 'After a strong run, one holding has grown into a much bigger slice of your portfolio than the rest. Why might someone sell part of it?',
        choices: [
          { text: 'To rebalance: when one holding gets large, more of your outcome rides on that single investment.', correct: true },
          { text: 'Because a gain disappears unless you sell it within the same quarter.' },
          { text: 'Because an investment that just went up is certain to fall next quarter.' },
        ],
        explanation: 'As a winner grows, it becomes a bigger part of your mix, so your results lean more on that one holding. Trimming brings the mix back toward balance. It is a choice, not a rule: you could also let it run, or buy a holding that dipped.',
      },
    ],
  },
  {
    part: 'Part IV · The year',
    title: 'Play out the year',
    body: [
      "Now play out the rest of the year. Watch each holding's Gain/Loss and the Performance chart, and trade as you see fit: buy a dip, add to a winner, or trim a position.",
    ],
    action: 'Repeat through Quarter 4: trade if you want, jump a quarter, then open the new statement.',
  },
  {
    part: 'Part IV · Cash out',
    title: 'Turning investments back into money',
    gate: 'withdraw',
    body: [
      'Your dividends and interest pile up in your cash settlement account. To bank it, sell what you want, then use Withdraw Funds.',
    ],
    action: 'Use Withdraw Funds to move some cash from your cash settlement account back to your bank.',
  },
  {
    part: 'Part V · Wrap up',
    title: 'See your Year-End Review',
    trigger: 'year-end',
    requireAction: true,
    body: [
      'One last jump. The Year-End Review sums up your whole year: what your account is worth, your total gain or loss, and the income you earned. You can reopen it any time from the Notifications bell.',
    ],
    action: 'At the top, click Jump to Year-End Review, then confirm.',
  },
  {
    part: 'You did it',
    title: 'One year as an investor',
    body: [
      'You funded a brokerage account, invested, weathered the ups and downs, and read your statements. The real thing works just like this.',
    ],
    action: 'Close the guide and keep exploring.',
    cta: 'Finish',
  },
];
