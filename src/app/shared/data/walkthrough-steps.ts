/**
 * Guided walkthrough content: scene-setting + a blocking "learning moment" for
 * every checklist item in the NGPF Brokerage Simulator activity. Each step is a
 * full-screen pop-up the student must read and acknowledge before continuing.
 */
export interface WalkthroughStep {
  /** Short section label shown as a chip (e.g. "Part I · Set up"). */
  part: string;
  title: string;
  /** Paragraphs of story + the "why" (the learning moment). */
  body: string[];
  /** The concrete thing to do in the app, highlighted as a call to action. */
  action?: string;
  /** Primary button label (defaults to "Continue"). */
  cta?: string;
}

export const WALKTHROUGH_STEPS: WalkthroughStep[] = [
  // --- Scene setting ---
  {
    part: 'Welcome',
    title: 'So you want to invest',
    body: [
      'Picture it: your first real paycheck just landed, and a friend mentions she "invests." You nodded along, but honestly, you were not sure what that meant or where you would even start.',
      'Today you find out, safely. You are about to open and run your own brokerage account in a simulation. No real money, nothing you can break. Just practice, so the real thing feels familiar when you get there.',
      'You begin with $5,000 in savings at Evergreen Bank. By the end you will have funded a brokerage, bought real-feeling investments, lived through a year of ups and downs, and read your own statements like you have done it for years.',
    ],
    action: 'Ready? Let us begin.',
    cta: "Let's go",
  },
  // --- Part I ---
  {
    part: 'Part I · Set up',
    title: 'Open your brokerage',
    body: [
      'A brokerage account is where you buy and hold investments: stocks, funds, and bonds. Think of it like online banking, except instead of just parking cash, it puts your money to work.',
      'On the desktop you will see a Web Browser icon. Opening it takes you to Summit Invest, your brand-new brokerage.',
    ],
    action: 'Open the Web Browser on the desktop, then come back and continue.',
  },
  {
    part: 'Part I · Connect',
    title: 'Connect your bank, and why you have to',
    body: [
      'Before Summit Invest lets you do anything, it asks you to connect a bank account. Here is why: a brokerage holds your investments, but the cash to buy them has to come from somewhere.',
      'Connecting your bank is what lets you move money in to invest, and back out when you want it. The details here are pre-filled and fake. Never use real account info in a simulation.',
    ],
    action: 'On the Overview tab, click "Connect Your Bank", review the details, then "Connect to your Bank".',
  },
  {
    part: 'Part I · Look around',
    title: 'Two accounts, two jobs',
    body: [
      'Click between the Evergreen Bank and Summit Invest tabs. You now have two homes for your money.',
      'Evergreen Bank Savings holds $5,000 and earns 1.50% APY. Summit Invest has a Cash Settlement Account at 0.25% APY: the holding pen for cash inside your brokerage, before and after you invest.',
      'Wait, the brokerage pays less interest. So why move money there at all? Because you are not moving it for interest. You move it so you can buy investments, which over time usually grow faster than cash ever could.',
    ],
    action: 'Switch between the two browser tabs and compare the balances and APYs.',
  },
  {
    part: 'Part I · Fund it',
    title: 'Move money in',
    body: [
      'You cannot invest cash that is still sitting at the bank. Time to move some over.',
      'On the Overview tab, use Add Funds to transfer an amount of your choice from Evergreen Bank into your Summit Invest settlement account. The same screen has Withdraw Funds to move it back.',
      'One thing worth noticing: the screen says the transfer is instant here, but in real life it can take a few days. Good to know. In the real world you would move cash in ahead of time, not the instant you want to buy.',
    ],
    action: 'Click Add Funds and transfer some money into your brokerage.',
  },
  // --- Part II ---
  {
    part: 'Part II · Explore',
    title: 'Meet your investments',
    body: [
      'Now the fun part: seeing what you can buy. On the Overview, the Daily Movers section shows seven investments. Click a few to read their details.',
      'You have three individual stocks (Harvest Foods, Granite Power & Light, Sterling Health), a mutual fund and an ETF that both track the whole U.S. stock market, a target-date fund, and a bond fund.',
    ],
    action: 'Click a few Daily Movers and read their descriptions.',
  },
  {
    part: 'Part II · Learn',
    title: 'Same thing, two wrappers',
    body: [
      'Here is a neat one: two of your choices track the exact same thing, the total U.S. stock market. One is a mutual fund, the other is an ETF. So what is the difference?',
      'A mutual fund prices once per day, after the market closes. An ETF trades all day long at a live price, like a stock. Same ingredients, different way of buying. Neither is "better"; it depends on whether you want to trade live or keep it simple.',
    ],
    action: 'Open the mutual fund and the ETF and compare their descriptions.',
  },
  {
    part: 'Part II · Buy',
    title: 'Build your portfolio',
    body: [
      'Time to invest. Click Buy, and notice the choices are grouped into Stocks, Funds, and Bonds.',
      'Buy at least three different investments of different types. Spreading your money across different kinds of investments is called diversification, and it is one of the most important ideas in investing: when one thing zigs, another might zag. Trades here are commission-free, and even small amounts work.',
    ],
    action: 'Click Buy and purchase three different types of investment.',
  },
  {
    part: 'Part II · Notice',
    title: 'Why your gain is $0, for now',
    body: [
      'Right after you buy, check the Gain/Loss on a holding. It is basically $0, and that is exactly right.',
      'You just bought at the current market price, so what you paid and what it is worth are the same. A gain or loss only appears once the price moves. And prices move as time passes, which is where we are headed next.',
    ],
    action: 'Look at the Gain/Loss on one of your new holdings.',
  },
  // --- Part III ---
  {
    part: 'Part III · Time',
    title: 'Fast-forward three months',
    body: [
      'Your trades are placed. Now let time pass. In the top bar, click Jump to Quarter 2, read the confirmation, and Continue.',
      'Notice the warning: finalize your trades first, because time only moves one way and you cannot go back. Real markets work the same way. It makes you commit to your decisions, just like a real investor has to.',
    ],
    action: 'Click Jump to Quarter 2 and confirm.',
  },
  {
    part: 'Part III · Alerts',
    title: 'What a brokerage tells you',
    body: [
      'After advancing, open the Notifications bell. You will see "Your Quarter 1 statement is ready."',
      'Notice what kind of alerts this is, and is not. A real brokerage sends factual notices: statements being ready, trade confirmations. It never tells you what to buy or sell. The decisions are always yours.',
    ],
    action: 'Open the Notifications bell in the top bar.',
  },
  {
    part: 'Part III · Income',
    title: 'Money that shows up on its own',
    body: [
      'As time passes, your accounts earn income automatically. You did not set anything up.',
      'On the Evergreen Bank page, look at Recent Transactions: an Interest payment posts at the end of each month. In Summit Invest Activity, look for cash you did not add yourself; those are dividends and bond income, which arrive at the end of each quarter.',
      'Careful though: receiving dividend cash is a good sign, but it does not mean you won. A stock can pay a dividend while its price falls. Income is only part of the story.',
    ],
    action: 'Check Recent Transactions at Evergreen Bank, then the Activity tab at Summit Invest.',
  },
  {
    part: 'Part III · Statement',
    title: 'Read your first statement',
    body: [
      'Open the Statements tab and click your Quarter 1 statement. There is a "How to read this statement" helper if you want it.',
      'Compare a holding\'s "What You Paid" to its "Current Value". Is that gain or loss money you actually have? Not yet. It is unrealized: it only becomes real cash when you sell, and until then the number keeps changing. That is why the statement separates Cash Available (real settlement cash) from Investments (current value of what you own).',
    ],
    action: 'Open your Quarter 1 statement and find a holding\'s gain or loss.',
  },
  {
    part: 'Part III · Sell',
    title: 'Selling, and the tax twist',
    body: [
      'Try selling part of a holding, then open the Activity tab. Your sale is tagged ST or LT: short-term or long-term.',
      'Almost every sale here is short-term, because this simulation runs only about a year (short-term means you held it a year or less). In real life this matters a lot: long-term gains are usually taxed at a lower rate, so how long you hold can change what you keep.',
    ],
    action: 'Sell part of a holding, then open the Activity tab to see the ST or LT tag.',
  },
  // --- Part IV ---
  {
    part: 'Part IV · The year',
    title: 'Live through a year',
    body: [
      'Now keep going. Advance one quarter at a time through Quarter 4, buying or selling as you like, and open each new statement when it is ready.',
      'Watch two charts as you go. The Compare Investments chart on the Overview shows how differently things move: the stocks swing around far more than the steady bond fund. The Portfolio Value Over Time chart on the Holdings tab shows your total, and notice the line does not only go up. That is investing: value changes quarter to quarter, not a straight climb.',
    ],
    action: 'Advance through the quarters and watch the Compare and Portfolio Value charts.',
  },
  {
    part: 'Part IV · Cash out',
    title: 'Turning investments back into money',
    body: [
      'Quarter 4 is the last quarter where you can trade, so make any final moves before advancing to the Year-End Review.',
      'Across the year, all your dividends and interest collected in your Summit Invest Cash Settlement Account. To turn a holding\'s gain, or that built-up cash, into money in your actual bank, you would sell what you want to cash out, then use Withdraw Funds to move the settlement cash back to Evergreen Bank.',
    ],
    action: 'Finish your trades, then advance to the Year-End Review.',
  },
  // --- Close ---
  {
    part: 'You did it',
    title: 'One year as an investor',
    body: [
      'That is it. You opened a brokerage, funded it, built a portfolio, lived through a year of ups and downs, collected income, and read your own statements. The real thing works just like this.',
      'Last thing: think back. Did using a realistic brokerage make investing feel more approachable, or more intimidating? And what is one thing you would want to know before opening a real account? There are no wrong answers, just yours.',
    ],
    action: 'Close the guide and keep exploring on your own.',
    cta: 'Finish',
  },
];
