// Cloudflare Pages Functions — locale routing
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const host = url.hostname;
  const path = url.pathname;

  // Map subdomains to locales
  const subdomainMap = {
    'in': 'en-IN',
    'de': 'de-DE',
    'pl': 'pl-PL',
    'af': 'af-ZA'
  };

  // Root domain -> en-US
  if (host === 'biosunlocktool.com' || host === 'www.biosunlocktool.com') {
    if (path === '/' || path === '') {
      return context.next();
    }
  }

  // Check subdomain routing
  const subdomain = host.split('.')[0];
  if (subdomain && subdomainMap[subdomain]) {
    url.pathname = `/${subdomainMap[subdomain]}${path}`;
    return context.next();
  }

  // Default: serve en-US for root
  return context.next();
}
