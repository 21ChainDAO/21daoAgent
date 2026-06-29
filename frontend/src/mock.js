// Mock data for Degens.bet clone
export const stats = {
  month: 'APRIL',
  monthlyVolume: 350499074,
  totalVolume: '$5B+',
  traders: '120k+',
  uptime: '99.98%',
  maxLeverage: '1000x',
};

export const features = [
  {
    icon: 'rocket',
    title: '1000X LEVERAGE',
    desc: 'Trade with insane leverage. Up to 1000x. No compromises.',
  },
  {
    icon: 'cursor',
    title: 'ONE CLICK TRADING',
    desc: 'Enter positions instantly. No confirmations. No delays.',
  },
  {
    icon: 'vault',
    title: 'HOUSE WALLET',
    desc: 'Managed treasury. Instant credits. No seed phrases to lose.',
  },
  {
    icon: 'bolt',
    title: 'NO SLIPPAGE',
    desc: 'Exact execution. No hidden losses.',
  },
];

export const sidebarLinks = [
  { icon: 'dashboard', label: 'DASHBOARD' },
  { icon: 'markets', label: 'MARKETS' },
  { icon: 'futures', label: 'FUTURES' },
  { icon: 'wallet', label: 'WALLET' },
  { icon: 'trophy', label: 'LEADERBOARD' },
  { icon: 'settings', label: 'SETTINGS' },
];

export const whyDegens = [
  { icon: 'zap', title: 'INSTANT SETTLEMENT', desc: 'Trades fill in under a second.' },
  { icon: 'shield', title: 'SAFE TREASURY', desc: 'Funds held in segregated cold storage.' },
  { icon: 'droplet', title: 'INFINITE LIQUIDITY', desc: 'Never get stuck on the exit.' },
  { icon: 'link', title: 'PROVABLY FAIR', desc: 'Every trade and PnL is auditable.' },
];

export const markets = [
  { sym: 'BTC/USD', price: '67,420.18', chg: '+2.31%', up: true },
  { sym: 'ETH/USD', price: '3,580.04', chg: '+1.12%', up: true },
  { sym: 'SOL/USD', price: '178.42', chg: '-0.84%', up: false },
  { sym: 'PEPE/USD', price: '0.00001324', chg: '+12.4%', up: true },
  { sym: 'DOGE/USD', price: '0.1342', chg: '-3.21%', up: false },
  { sym: 'WIF/USD', price: '2.31', chg: '+8.7%', up: true },
];

export const orderBookBids = [
  { p: '67,418.12', s: '0.842' },
  { p: '67,417.04', s: '1.214' },
  { p: '67,416.88', s: '0.521' },
  { p: '67,415.20', s: '2.108' },
  { p: '67,414.55', s: '0.913' },
];
export const orderBookAsks = [
  { p: '67,420.92', s: '0.674' },
  { p: '67,421.45', s: '1.811' },
  { p: '67,422.78', s: '0.430' },
  { p: '67,423.50', s: '1.255' },
  { p: '67,424.10', s: '0.998' },
];

export const chartBars = Array.from({ length: 24 }, (_, i) => ({
  h: 20 + Math.round(Math.abs(Math.sin(i * 0.6) * 60) + Math.random() * 25),
  up: i % 3 !== 0,
}));
