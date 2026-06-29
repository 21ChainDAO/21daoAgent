import React from 'react';
import StaticPage from './StaticPage';

export default function Privacy() {
  return (
    <StaticPage title="PRIVACY POLICY" kicker="// PRIVACY.TXT">
      <p><strong>Effective Date:</strong> July 2025. This Privacy Policy describes how DegensBet (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) collects, uses, and discloses information about you when you use the Service.</p>

      <h2>1. INFORMATION WE COLLECT</h2>
      <ul>
        <li><strong>X (Twitter) profile</strong>: when you sign in, we collect your X user ID, handle, display name, and public profile picture from Privy.</li>
        <li><strong>Deposit address</strong>: we generate a Solana address for you and store the private key in encrypted form on our infrastructure.</li>
        <li><strong>On-chain activity</strong>: deposits to and from your address, sweep transactions, withdrawal signatures.</li>
        <li><strong>Trading activity</strong>: positions opened/closed, account type, pair, leverage, PnL.</li>
        <li><strong>Withdrawal requests</strong>: destination address, amount, status, timestamps.</li>
        <li><strong>Device &amp; usage</strong>: IP address, browser, OS, pages visited, clicks (basic web analytics).</li>
      </ul>

      <h2>2. HOW WE USE INFORMATION</h2>
      <ul>
        <li>To operate the Service: credit deposits, settle trades, process withdrawals, run competitions.</li>
        <li>To display your handle / avatar on public leaderboards.</li>
        <li>To detect and prevent fraud, multi-accounting, and abuse.</li>
        <li>To comply with legal obligations and respond to lawful requests.</li>
        <li>To improve the Service and develop new features.</li>
      </ul>

      <h2>3. SHARING</h2>
      <p>We do not sell your personal information. We may share data with:</p>
      <ul>
        <li><strong>Service providers</strong>: Privy (auth), Helius (Solana RPC), MongoDB (database hosting), CoinGecko (market data).</li>
        <li><strong>Law enforcement</strong> where compelled by valid legal process.</li>
        <li><strong>Buyers</strong> in connection with a corporate transaction (merger, acquisition).</li>
      </ul>

      <h2>4. ON-CHAIN PUBLICITY</h2>
      <p>Solana is a public blockchain. Deposit, sweep, and withdrawal transactions tied to your custodial address are <strong>publicly viewable forever</strong>. We cannot delete or hide on-chain data.</p>

      <h2>5. SECURITY</h2>
      <p>Custodial private keys are encrypted at rest with a master key held in restricted-access secrets management. We use TLS in transit, restricted database access, and standard operational security. No system is 100% secure; you use the Service at your own risk.</p>

      <h2>6. RETENTION</h2>
      <p>We retain your account data for as long as your account is active and for a reasonable period afterwards to satisfy our legal, regulatory, and operational obligations.</p>

      <h2>7. YOUR RIGHTS</h2>
      <p>Depending on your jurisdiction, you may have the right to access, correct, or delete your personal data. To exercise these rights, contact us via <a href="https://x.com/0xdegensbet" target="_blank" rel="noreferrer">@0xdegensbet on X</a>. We may retain certain records (such as transaction logs) where required for legal or operational reasons.</p>

      <h2>8. CHILDREN</h2>
      <p>The Service is not directed to anyone under 18. Do not provide us information if you are under 18.</p>

      <h2>9. CHANGES</h2>
      <p>We may update this Privacy Policy from time to time. The &ldquo;Effective Date&rdquo; at the top will reflect the latest version.</p>

      <h2>10. CONTACT</h2>
      <p>Questions? <a href="https://x.com/0xdegensbet" target="_blank" rel="noreferrer">@0xdegensbet</a>.</p>
    </StaticPage>
  );
}
