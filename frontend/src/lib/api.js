import axios from 'axios';

const BASE = process.env.REACT_APP_BACKEND_URL;
export const API = `${BASE}/api`;

export const api = axios.create({ baseURL: API });

export function setAuthHeader(privyId) {
  if (privyId) api.defaults.headers.common['X-Privy-Id'] = privyId;
  else delete api.defaults.headers.common['X-Privy-Id'];
}

export const PAIRS = ['ANSEM/USD','JUPITER/USD','CARDS/USD','KINS/USD','TRIPLET/USD','JOTCHUA/USD','WORLD/USD','DROOL/USD'];

export function formatPrice(n) {
  if (n == null) return '-';
  if (n >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (n >= 1) return n.toFixed(3);
  if (n >= 0.01) return n.toFixed(5);
  return n.toExponential(3);
}

export function formatMoney(n, withSign = false) {
  if (n == null) return '-';
  const sign = withSign && n > 0 ? '+' : '';
  return sign + '$' + Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 2 }) * (n < 0 ? -1 : 1);
}

export function fmtUsd(n, opts = {}) {
  const { sign = false } = opts;
  if (n == null || isNaN(n)) return '$0.00';
  const abs = Math.abs(n);
  const s = '$' + abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n < 0) return '-' + s;
  if (sign && n > 0) return '+' + s;
  return s;
}
