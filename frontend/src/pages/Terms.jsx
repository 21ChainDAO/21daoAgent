import React from 'react';
import StaticPage from './StaticPage';

export default function Terms() {
  return (
    <StaticPage title="TERMS &amp; CONDITIONS" kicker="// TERMS.TXT">
      <p><strong>Effective Date:</strong> July 2025. By accessing degensbet.bet (the &ldquo;Service&rdquo;), you agree to be bound by these Terms. If you do not agree, do not use the Service.</p>

      <h2>1. ELIGIBILITY</h2>
      <p>You must be at least 18 years old and legally permitted to use the Service in your jurisdiction. The Service is not available to residents of jurisdictions where derivative trading, sweepstakes, or skill-based wagering are prohibited. You are solely responsible for compliance with applicable laws.</p>

      <h2>2. NATURE OF THE SERVICE</h2>
      <p>DegensBet is a skill-based trading competition platform. Users wager on the direction and magnitude of price movements in supported markets. Outcomes are determined by live external market data. The Service is <strong>not</strong> a regulated exchange, broker-dealer, futures commission merchant, or money transmitter, and does not provide investment advice.</p>

      <h2>3. CUSTODIAL ACCOUNTS</h2>
      <p>The Service operates with a custodial wallet model. When you sign up, the Service provisions a Solana deposit address whose private key is held and controlled by the Service. By depositing funds you authorize the Service to custody those funds and to move them to its operating treasury. The Service maintains an off-chain ledger of your balance, profits, and losses. You acknowledge that custodial models carry counterparty risk.</p>

      <h2>4. DEPOSITS</h2>
      <p>Only SOL on Solana mainnet is accepted. Sending any other asset or sending on any other chain results in <strong>permanent loss</strong> of those funds. Deposits are credited to your REAL balance at the prevailing SOL/USD rate at the time of detection.</p>

      <h2>5. WITHDRAWALS</h2>
      <p>Withdrawals are processed in two tiers:</p>
      <ul>
        <li><strong>Auto:</strong> up to the SOL amount you have deposited, paid instantly.</li>
        <li><strong>Manual review:</strong> profits above your deposited amount, released within 1–3 hours after review.</li>
      </ul>
      <p>The Service reserves the right to delay, decline, or claw back withdrawals where there is reasonable suspicion of abuse, fraud, multi-accounting, market manipulation, exploitation of bugs, or violation of these Terms.</p>

      <h2>6. PROHIBITED CONDUCT</h2>
      <ul>
        <li>Creating multiple accounts or operating accounts on behalf of others.</li>
        <li>Using bots, scripts, or automated trading without express written permission.</li>
        <li>Front-running, latency arbitrage, or any exploitation of price feed delay.</li>
        <li>Attempting to access, copy, or interfere with the Service&rsquo;s code or infrastructure.</li>
        <li>Using the Service for money laundering or any unlawful purpose.</li>
      </ul>

      <h2>7. COMPETITIONS</h2>
      <p>Entry fees are non-refundable and are paid from your REAL balance. Prize structures, schedules, and pool sizes may be modified at the Service&rsquo;s discretion. Winners are announced after the operator verifies eligibility; the Service reserves the right to disqualify any participant for breach of these Terms. Prizes paid in <code>$dBET</code> are subject to the tokenomics published on the homepage.</p>

      <h2>8. NO INVESTMENT ADVICE</h2>
      <p>Nothing on the Service constitutes investment, legal, accounting, or tax advice. Past performance is not indicative of future results. You acknowledge that trading on leverage carries substantial risk of loss.</p>

      <h2>9. INTELLECTUAL PROPERTY</h2>
      <p>All Service content, branding (including DegensBet and $dBET), code, and design are property of the operator. You receive a limited, non-exclusive, non-transferable license to use the Service for personal, non-commercial purposes.</p>

      <h2>10. DISCLAIMERS &amp; LIMITATION OF LIABILITY</h2>
      <p>The Service is provided &ldquo;AS IS&rdquo; without warranties of any kind. To the maximum extent permitted by law, the operator shall not be liable for any indirect, consequential, special, or punitive damages, or for any loss of profits or data, arising out of your use of the Service. Aggregate liability shall not exceed the amount of fees paid to the operator by you in the preceding 30 days.</p>

      <h2>11. CHANGES</h2>
      <p>These Terms may be updated at any time. Continued use of the Service after changes are posted constitutes acceptance.</p>

      <h2>12. CONTACT</h2>
      <p>For questions or appeals, reach the team via <a href="https://x.com/0xdegensbet" target="_blank" rel="noreferrer">@0xdegensbet on X</a>.</p>
    </StaticPage>
  );
}
