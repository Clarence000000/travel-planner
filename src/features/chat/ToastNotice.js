/**
 * Toast Notice & HTML Escaping Utilities.
 */

export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function showDashToast(message, type = 'success') {
  const existing = document.querySelector('.dash-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `dash-toast dash-toast--${type} dash-toast--visible`;
  toast.setAttribute('role', 'status');
  toast.innerHTML = `
    <span class="dash-toast__icon">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    </span>
    <span class="dash-toast__msg">${escapeHtml(message)}</span>
  `;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.remove('dash-toast--visible');
    toast.classList.add('dash-toast--exit');
    setTimeout(() => toast.remove(), 350);
  }, 3500);
}
