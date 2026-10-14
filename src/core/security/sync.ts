/** Never mirror credentials, payment details or one-time codes. */
export function isSensitiveControl(element: Element | null): boolean {
  if (!element) return false;
  const input = element.closest('input, textarea, select, [contenteditable]');
  if (!input) return false;
  if (input.getAttribute('type')?.toLowerCase() === 'password') return true;
  const tokens = (input.getAttribute('autocomplete') ?? '').toLowerCase().split(/\s+/);
  if (tokens.some(token => token.startsWith('cc-') || ['current-password', 'new-password', 'one-time-code'].includes(token))) return true;
  return /password|passwd|passcode|otp|cvc|cvv|card.?number/i.test(`${input.getAttribute('name') ?? ''} ${input.id}`);
}
export const carriesInputData = (channel: string) => ['input', 'form', 'key'].includes(channel);
