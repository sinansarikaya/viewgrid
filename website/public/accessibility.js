/* global document, window, MutationObserver */
let activeDialog = null;
let returnFocus = null;
const inertState = new Map();
function syncDialogs() {
  const next = [...document.querySelectorAll('#tour-lightbox, #shortcuts-modal')].find(element => element.classList.contains('active'));
  if (next === activeDialog) return;
  if (activeDialog) {
    inertState.forEach((value, element) => { element.inert = value; });
    inertState.clear();
    activeDialog = null;
    if (returnFocus?.isConnected) returnFocus.focus();
  }
  if (!next) return;
  returnFocus = document.activeElement;
  activeDialog = next;
  for (const element of document.body.children) {
    if (element !== next) { inertState.set(element, element.inert); element.inert = true; }
  }
  (next.querySelector('button, a[href], [tabindex]') || next).focus();
}
document.addEventListener('keydown', event => {
  if (!activeDialog) return;
  if (event.key === 'Escape') { activeDialog.classList.remove('active'); syncDialogs(); return; }
  if (event.key !== 'Tab') return;
  const elements = [...activeDialog.querySelectorAll('button, a[href], input, [tabindex]:not([tabindex="-1"])')].filter(element => element.getBoundingClientRect().height && !element.disabled);
  const first = elements[0], last = elements.at(-1);
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});
document.addEventListener('DOMContentLoaded', () => {
  for (const element of document.querySelectorAll('[data-i18n-aria]')) {
    const value = window.viewgridSiteCopy?.[document.documentElement.lang]?.[element.dataset.i18nAria];
    if (value) element.setAttribute('aria-label', value);
  }
  for (const dialog of document.querySelectorAll('#tour-lightbox, #shortcuts-modal')) {
    document.body.append(dialog);
    new MutationObserver(syncDialogs).observe(dialog, { attributes: true, attributeFilter: ['class'] });
  }
  for (const element of document.querySelectorAll('[data-keyboard-click]')) {
    element.addEventListener('pointerdown', () => element.focus());
    element.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); element.click(); }
    });
  }
  const media = document.getElementById('promo-video');
  if (media) for (const track of media.textTracks) track.mode = track.language === document.documentElement.lang ? 'showing' : 'disabled';
  const range = document.getElementById('comparison-range');
  range?.addEventListener('input', () => window.updateDiffVisuals(Number(range.value)));
  const steps = [...document.querySelectorAll('.how-step')];
  const updateSteps = () => steps.forEach(step => step.setAttribute('aria-pressed', String(step.classList.contains('active'))));
  steps.forEach(step => new MutationObserver(updateSteps).observe(step, { attributes: true, attributeFilter: ['class'] }));
  document.querySelectorAll('.lang-btn').forEach(link => {
    if (link.dataset.lang === document.documentElement.lang) link.setAttribute('aria-current', 'page');
    const changelog = window.location.pathname.includes('/changelog/');
    if (changelog) link.href = '/changelog/' + (link.dataset.lang === 'en' ? '' : link.dataset.lang + '/');
  });
});
