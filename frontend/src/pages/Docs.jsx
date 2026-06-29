import React from 'react';
import StaticPage from './StaticPage';

export default function Docs() {
  return (
    <StaticPage title="HOW IT WORKS" kicker="// DOCS.SYS">
      <p>
        DegensBet is a competitive trading arcade. Connect with X, get a deposit address, fund it, and battle
        other degens for cash and <code>$DEGEN</code> token prizes. Two arenas: <strong>PAPER</strong> (sandbox) and
        <strong> REAL</strong> (skin in the game).
      </p>

      <h2>1. CREATE AN ACCOUNT</h2>
      <p>
        Hit <strong>LAUNCH APP</strong> and sign in with X (Twitter). The platform auto-provisions a managed Solana
        deposit address linked to your profile. Your X handle becomes your public trader identity on the
        leaderboard.
      </p>

      <h2>2. TWO ACCOUNTS: PAPER &amp; REAL</h2>
      <p>Every user gets two sub-accounts that operate independently:</p>
      <ul>
        <li><strong>PAPER</strong> — starts with $10,000 fake USDC. Sandbox. Real live prices, simulated PnL. Practice and grind the paper leaderboard for prizes.</li>
        <li><strong>REAL</strong> — starts at $0. Funded by your SOL deposits at live market rate. Real stakes, real payouts.</li>
      </ul>
      <p>The top-bar toggle switches active context across the entire app: dashboard, trade view, history, leaderboard.</p>

      <h2>3. DEPOSITING</h2>
      <p>Open the <strong>WALLET</strong> tab to see your Solana deposit address. Send any amount of SOL on Solana mainnet — our chain watcher detects it and credits your <strong>REAL</strong> balance at the current SOL/USD rate (typically within 60 seconds).</p>

      <h2>4. TRADING</h2>
      <p>Long or short any supported pair (SOL, BTC, ETH, BONK, WIF, JUP, PEPE — more coming) at up to <strong>1000x leverage</strong>. Pick your account, your size, your leverage, click <strong>BUY / LONG</strong> or <strong>SELL / SHORT</strong>. Close any time. Liquidation triggers when unrealized loss reaches your margin.</p>

      <h2>5. WITHDRAWING</h2>
      <p>Request a SOL withdrawal to any Solana address. The system distinguishes two portions:</p>
      <ul>
        <li><strong>Instant auto-payout</strong> — up to the SOL amount you have personally deposited. Sent automatically by the treasury within seconds.</li>
        <li><strong>Manual review (1–3 hours)</strong> — profits above your deposited amount. Reviewed and released by a human operator to protect against abuse.</li>
      </ul>
      <p>Your withdrawal history shows both kinds and links the on-chain signature.</p>

      <h2>6. COMPETITIONS</h2>
      <p>Two flagship tournaments running continuously:</p>
      <ul>
        <li><strong>PAPER ARCADE</strong> &mdash; entry: 0.25 SOL &bull; prize pool: $10,000 + 30,000,000 DEGEN.</li>
        <li><strong>REAL MONEY ARENA</strong> &mdash; entry: 2.5 SOL &bull; prize pool: $100,000 + 70,000,000 DEGEN.</li>
      </ul>
      <p>Ranking is by <strong>tournament PnL</strong> (your PnL accrued since joining). Entry fees fund the operating treasury and DEGEN incentives.</p>

      <h2>7. $DEGEN TOKEN</h2>
      <p>1,000,000,000 supply on Solana. Distribution:</p>
      <ul>
        <li>50% Locked</li>
        <li>7% Real-arena prize pool</li>
        <li>3% Paper-arena prize pool</li>
        <li>40% Public fair launch</li>
      </ul>
      <p>Contract address: <code>TBA</code> &mdash; published in the token section on the homepage at launch, and pinned permanently in the bottom-right of every page once live.</p>

      <h2>8. RISK</h2>
      <p>Trading with leverage is risky. PnL is calculated on real market prices, but liquidity for execution is provided by the platform; you are entering a wager-style instrument against the house, not the open market. Do not deposit more than you are willing to lose. See <a href="/terms">Terms</a> and <a href="/privacy">Privacy</a>.</p>
    </StaticPage>
  );
}
