const CONSENT_KEY = 'cookie_consent';

export type ConsentLevel = 'all' | 'essential' | null;

export function getConsent(): ConsentLevel {
  const v = localStorage.getItem(CONSENT_KEY);
  if (v === 'all' || v === 'essential') return v;
  return null;
}

export function setConsent(level: 'all' | 'essential') {
  localStorage.setItem(CONSENT_KEY, level);
  window.dispatchEvent(new Event('consent-updated'));
}
