// Cloudflare Pages Functions — host-aware роутинг коротких субдоменів на локалі.
// Локалі фізично живуть у /locales/<locale>/, але користувач не повинен бачити
// технічний каталог у браузері: внутрішній fetch через ASSETS зберігає чистий
// root URL і водночас віддає правильний статичний index.html.
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const sub = url.hostname.split(".")[0].toLowerCase();

  // `in` intentionally falls through to the canonical English India theme.
  // The old en-IN page is a legacy Hindi stub and must not shadow the current
  // host-aware landing; `india` is kept as a compatibility alias in the page.
  const localeBySub = { de: "de-DE", pl: "pl-PL", af: "af-ZA" };
  const locale = localeBySub[sub];
  if (!locale) return context.next(); // apex / www / preview → канон en-US

  if (url.pathname !== "/" && url.pathname !== "") return context.next();

  // Pages Functions' ASSETS binding supports an internal asset fetch with a
  // rewritten pathname; unlike a redirect, this keeps af/de/pl at their clean
  // subdomain roots while serving the locale's canonical layout.
  // Keep the trailing slash: Pages' asset server canonicalizes index.html to
  // this directory with a redirect, which would leak the internal path again.
  const localeUrl = new URL(`/locales/${locale}/`, url);
  return context.env.ASSETS.fetch(new Request(localeUrl, context.request));
}
