/**
 * Robust copy-to-clipboard with execCommand fallback.
 * The async Clipboard API is blocked in iframe contexts (like the Emergent
 * preview shell) by a permissions policy — fall back to the legacy textarea
 * + execCommand('copy') trick which works without special permissions.
 *
 * Returns true on success, false otherwise.
 */
export async function copyText(text) {
  if (!text) return false;
  // 1. Modern API path
  try {
    if (navigator?.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (_) { /* fall through to legacy */ }

  // 2. Legacy fallback — hidden textarea + execCommand('copy')
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    ta.style.left = '-1000px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand && document.execCommand('copy');
    document.body.removeChild(ta);
    return !!ok;
  } catch (_) { return false; }
}
