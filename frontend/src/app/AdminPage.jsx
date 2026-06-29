import React, { useEffect, useState } from 'react';
import { api, fmtUsd } from '../lib/api';
import { ShieldCheck, AlertTriangle, RefreshCw, Check, X, ExternalLink } from 'lucide-react';

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(null);
  const [overview, setOverview] = useState(null);
  const [wds, setWds] = useState([]);
  const [users, setUsers] = useState([]);
  const [keys, setKeys] = useState(null);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');
  const [tab, setTab] = useState('withdrawals');

  const load = async () => {
    try {
      const me = await api.get('/admin/me');
      setIsAdmin(me.data.is_admin);
      if (!me.data.is_admin) return;
      const [ov, w, u, k] = await Promise.all([
        api.get('/admin/overview'),
        api.get('/admin/withdrawals'),
        api.get('/admin/users'),
        api.get('/admin/keystatus'),
      ]);
      setOverview(ov.data);
      setWds(w.data.withdrawals);
      setUsers(u.data.users);
      setKeys(k.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { load(); }, []);

  const approve = async (wid) => {
    setBusy(wid); setMsg('');
    try {
      const r = await api.post(`/admin/withdrawals/${wid}/approve`, {});
      setMsg(`✓ APPROVED · TX ${r.data.tx_signature?.slice(0,12)}...`);
      await load();
    } catch (e) {
      setMsg(e.response?.data?.detail || 'FAILED');
    } finally {
      setBusy(''); setTimeout(() => setMsg(''), 5000);
    }
  };

  const reject = async (wid) => {
    setBusy(wid); setMsg('');
    try {
      await api.post(`/admin/withdrawals/${wid}/reject`, {});
      setMsg('✓ REJECTED & REFUNDED');
      await load();
    } catch (e) {
      setMsg(e.response?.data?.detail || 'FAILED');
    } finally {
      setBusy(''); setTimeout(() => setMsg(''), 5000);
    }
  };

  if (isAdmin === null) return <div className="font-pixel text-[10px] text-[#808080]">CHECKING AUTH...</div>;
  if (!isAdmin) {
    return (
      <div className="pixel-card p-8 max-w-xl">
        <div className="flex items-center gap-3 mb-3">
          <AlertTriangle className="text-[#ff3838]" />
          <div className="font-pixel text-[14px] text-[#ff3838]">ACCESS DENIED</div>
        </div>
        <div className="font-mono text-[16px] text-[#808080]">
          Your X handle is not in the admin whitelist. Set <span className="text-white">ADMIN_X_HANDLES</span> in
          <span className="text-white"> backend/.env</span> (comma-separated, lowercase) and restart the backend to grant yourself admin access.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="section-label">// ADMIN.SYS</div>
          <h1 className="font-pixel text-white text-[22px] flex items-center gap-3 mt-2">
            <ShieldCheck className="text-[#00FF29]" /> OPERATOR PANEL
          </h1>
        </div>
        <button onClick={load} className="pixel-btn pixel-btn-secondary !py-2 !px-3 !text-[9px]">
          <RefreshCw size={12} className="mr-2" /> REFRESH
        </button>
      </div>

      {/* Overview */}
      {overview && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat label="USERS" value={overview.users} />
          <Stat label="PENDING WD" value={overview.pending_withdrawals} color="#ffe93d" />
          <Stat label="DEPOSITED SOL" value={overview.total_deposited_sol.toFixed(3)} />
          <Stat label="LIVE REAL BAL" value={fmtUsd(overview.total_real_balance_usd)} color="#ff3838" />
          <Stat label="AUTO WD SOL" value={overview.total_withdrawn_auto_sol.toFixed(3)} />
          <Stat label="MANUAL WD SOL" value={overview.total_withdrawn_manual_sol.toFixed(3)} />
          <Stat label="COMP ENTRIES" value={overview.competition_entries} />
          <Stat label="TREASURY KEY" value={keys?.treasury_key_loaded ? 'LOADED' : 'MISSING'}
                color={keys?.treasury_key_loaded ? '#00FF29' : '#ff3838'} />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b-2 border-[#1f1f1f]">
        {['withdrawals', 'users', 'keys'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 font-pixel text-[9px] border-b-2 -mb-[2px] ${tab === t ? 'border-[#00FF29] text-[#00FF29]' : 'border-transparent text-[#808080] hover:text-white'}`}>
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {msg && <div className="font-pixel text-[9px] text-[#00FF29] flicker">{msg}</div>}

      {/* Withdrawals tab */}
      {tab === 'withdrawals' && (
        <div className="pixel-card p-0 overflow-hidden">
          <div className="grid grid-cols-12 font-pixel text-[7px] text-[#808080] px-4 py-3 border-b-2 border-[#1f1f1f] bg-[#0a0a0a]">
            <div className="col-span-2">DATE</div>
            <div className="col-span-2">USER</div>
            <div className="col-span-3">TO ADDRESS</div>
            <div className="col-span-1 text-right">SOL</div>
            <div className="col-span-1 text-right">USD</div>
            <div className="col-span-1">KIND</div>
            <div className="col-span-1">STATUS</div>
            <div className="col-span-1 text-right">ACTIONS</div>
          </div>
          {wds.length === 0 ? (
            <div className="py-12 text-center font-pixel text-[9px] text-[#808080]">NO WITHDRAWALS</div>
          ) : wds.map(w => (
            <div key={w.id} className="grid grid-cols-12 items-center px-4 py-3 border-b border-[#1f1f1f]/60 font-mono text-[13px]">
              <div className="col-span-2 text-[#808080]">{new Date(w.requested_at).toLocaleString()}</div>
              <div className="col-span-2 text-white">@{w.x_handle || 'anon'}</div>
              <div className="col-span-3 text-[#00FF29]">{w.to_address.slice(0,8)}...{w.to_address.slice(-6)}</div>
              <div className="col-span-1 text-right text-white">{w.amount_sol.toFixed(4)}</div>
              <div className="col-span-1 text-right text-[#808080]">{fmtUsd(w.amount_usd)}</div>
              <div className="col-span-1">
                <span className={`font-pixel text-[7px] px-2 py-1 ${w.kind === 'auto' ? 'bg-[#0d0d0d] text-[#00FF29] border border-[#00FF29]' : 'bg-[#0d0d0d] text-[#ffe93d] border border-[#ffe93d]'}`}>
                  {(w.kind || 'manual').toUpperCase()}
                </span>
              </div>
              <div className="col-span-1">
                <span className={`font-pixel text-[7px] px-2 py-1 ${
                  w.status === 'completed' ? 'bg-[#00FF29] text-[#050505]' :
                  w.status === 'rejected' ? 'bg-[#ff3838] text-[#050505]' :
                  w.status === 'pending' ? 'bg-[#0d0d0d] text-[#ffe93d] border border-[#ffe93d]' :
                  'bg-[#0d0d0d] text-[#ff3838] border border-[#ff3838]'
                }`}>{w.status.toUpperCase()}</span>
              </div>
              <div className="col-span-1 text-right flex justify-end gap-1">
                {w.status === 'pending' ? (
                  <>
                    <button onClick={() => approve(w.id)} disabled={busy === w.id}
                      className="px-2 py-1 bg-[#00FF29] text-[#050505] font-pixel text-[7px]" title="Approve">
                      <Check size={12} />
                    </button>
                    <button onClick={() => reject(w.id)} disabled={busy === w.id}
                      className="px-2 py-1 bg-[#ff3838] text-[#050505] font-pixel text-[7px]" title="Reject">
                      <X size={12} />
                    </button>
                  </>
                ) : w.tx_signature ? (
                  <a href={`https://solscan.io/tx/${w.tx_signature}`} target="_blank" rel="noreferrer"
                    className="text-[#00FF29] hover:text-white"><ExternalLink size={12} /></a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Users tab */}
      {tab === 'users' && (
        <div className="pixel-card p-0 overflow-hidden">
          <div className="grid grid-cols-12 font-pixel text-[7px] text-[#808080] px-4 py-3 border-b-2 border-[#1f1f1f] bg-[#0a0a0a]">
            <div className="col-span-3">USER</div>
            <div className="col-span-3">CUSTODIAL ADDR</div>
            <div className="col-span-1 text-right">PAPER BAL</div>
            <div className="col-span-1 text-right">REAL BAL</div>
            <div className="col-span-1 text-right">DEP SOL</div>
            <div className="col-span-1 text-right">WD SOL</div>
            <div className="col-span-2">JOINED</div>
          </div>
          {users.map(u => (
            <div key={u.id} className="grid grid-cols-12 items-center px-4 py-2 border-b border-[#1f1f1f]/50 font-mono text-[13px]">
              <div className="col-span-3 flex items-center gap-2 min-w-0">
                {u.x_avatar && <img src={u.x_avatar} alt="" className="w-6 h-6 border border-[#1f1f1f]" />}
                <div className="truncate">
                  <div className="font-pixel text-[8px] text-white">@{u.x_handle || 'anon'}</div>
                  <div className="text-[12px] text-[#808080] truncate">{u.x_name || ''}</div>
                </div>
              </div>
              <div className="col-span-3 text-[#00FF29] text-[12px]">
                {u.custodial_address ? (
                  <a href={`https://solscan.io/account/${u.custodial_address}`} target="_blank" rel="noreferrer" className="hover:underline">
                    {u.custodial_address.slice(0,6)}...{u.custodial_address.slice(-6)}
                  </a>
                ) : '—'}
              </div>
              <div className="col-span-1 text-right text-white">{fmtUsd(u.paper?.balance || 0)}</div>
              <div className="col-span-1 text-right text-[#ff3838]">{fmtUsd(u.real?.balance || 0)}</div>
              <div className="col-span-1 text-right text-[#808080]">{(u.total_sol_deposited || 0).toFixed(3)}</div>
              <div className="col-span-1 text-right text-[#808080]">{(u.total_sol_withdrawn_auto || 0).toFixed(3)}</div>
              <div className="col-span-2 text-[#808080] text-[12px]">{new Date(u.created_at).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      )}

      {/* Keys tab */}
      {tab === 'keys' && keys && (
        <div className="space-y-4">
          <div className="pixel-card p-5">
            <div className="font-pixel text-[11px] text-[#00FF29] mb-3">// KEY STATUS</div>
            <Field label="MASTER KEY FINGERPRINT" value={keys.master_key_fingerprint || '— MISSING —'}
                   highlight={!keys.master_key_fingerprint} />
            <Field label="TREASURY ADDRESS" value={keys.treasury_address || '— NOT SET —'}
                   highlight={!keys.treasury_address} />
            <Field label="TREASURY KEY LOADED"
                   value={keys.treasury_key_loaded ? 'YES (AUTO-WITHDRAW ENABLED)' : 'NO (ALL WITHDRAWALS WILL BE MANUAL)'}
                   highlight={!keys.treasury_key_loaded} />
            {keys.treasury_pubkey_derived && (
              <Field label="DERIVED PUBKEY" value={keys.treasury_pubkey_derived}
                     warn={keys.treasury_pubkey_derived !== keys.treasury_address} />
            )}
            <Field label="HELIUS RPC" value={keys.helius_configured ? 'CONFIGURED' : 'MISSING'}
                   highlight={!keys.helius_configured} />
            <Field label="ADMIN HANDLES" value={(keys.admin_handles || []).join(', ') || '— NONE —'} />
          </div>

          <div className="pixel-card p-5">
            <div className="font-pixel text-[11px] text-[#00FF29] mb-3">// HOW TO STORE THE MASTER KEY SAFELY</div>
            <ol className="font-mono text-[15px] text-[#808080] space-y-2 list-decimal pl-5">
              <li>Copy the contents of <span className="text-white">backend/.env</span> (MASTER_WALLET_KEY line).</li>
              <li>Save it to <span className="text-white">1Password / Bitwarden / iCloud Keychain</span>.</li>
              <li>Print it on paper and store in a safe deposit box (physical backup).</li>
              <li>Optional: move it to <span className="text-white">AWS Secrets Manager</span> and have the backend fetch it via IAM at boot.</li>
              <li><span className="text-[#ff3838]">NEVER</span> commit it to git or paste it in chat.</li>
              <li>The DB stores the encrypted user privkeys. Without this master key they are <span className="text-[#ff3838]">unrecoverable</span>.</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color = '#F5F5F5' }) {
  return (
    <div className="pixel-card p-4">
      <div className="font-pixel text-[7px] text-[#808080] tracking-[0.15em] mb-2">{label}</div>
      <div className="font-pixel text-[15px]" style={{ color }}>{value}</div>
    </div>
  );
}
function Field({ label, value, highlight, warn }) {
  const color = highlight ? '#ff3838' : warn ? '#ffe93d' : '#F5F5F5';
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-[#1f1f1f]/60">
      <span className="font-pixel text-[8px] text-[#808080]">{label}</span>
      <span className="font-mono text-[14px] text-right break-all" style={{ color }}>{value}</span>
    </div>
  );
}
