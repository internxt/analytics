export function setImpactCookies(anonymousId: string, irclickid: string, utmMedium?: string | null): void {
  const cookieDomain = 'internxt.com';

  const sourceExpiration = new Date();
  sourceExpiration.setHours(sourceExpiration.getHours() + 2);

  const anonymousExpiration = new Date();
  anonymousExpiration.setFullYear(anonymousExpiration.getFullYear() + 10);

  const trackingExpiration = new Date();
  trackingExpiration.setDate(trackingExpiration.getDate() + 30);

  document.cookie = `impactSource=Impact;expires=${sourceExpiration.toUTCString()};domain=${cookieDomain};Path=/;Secure`;
  document.cookie = `impactAnonymousId=${anonymousId};expires=${anonymousExpiration.toUTCString()};domain=${cookieDomain};Path=/;Secure`;
  document.cookie = `impactClickId=${irclickid};expires=${trackingExpiration.toUTCString()};domain=${cookieDomain};Path=/;Secure`;

  if (utmMedium) {
    document.cookie = `impactPartnerId=${utmMedium};expires=${trackingExpiration.toUTCString()};domain=${cookieDomain};Path=/;Secure`;
  }
}

export function getCookie(cookieName: string): string | undefined {
  const cookie: Record<string, string | undefined> = {};
  document.cookie.split(';').forEach((el) => {
    const [key = '', value] = el.split('=');
    cookie[key.trim()] = value;
  });
  return cookie[cookieName];
}
