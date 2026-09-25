// Cloudflare Pages Functions — host-aware роутинг коротких субдоменів на локалі.
// Локалі фізично живуть у /locales/<locale>/, але користувач не повинен бачити
// технічний каталог у браузері: внутрішній fetch через ASSETS зберігає чистий
// root URL і водночас віддає правильний статичний index.html.
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const sub = url.hostname.split(".")[0].toLowerCase();

  // `ca` and `in` intentionally fall through to the canonical English market
  // themes (Canada and India) served from the root index.html.
  // The old en-IN page is a legacy Hindi stub and must not shadow the current
  // host-aware landing; `india` is kept as a compatibility alias in the page.
  const localeBySub = { de: "de-DE", pl: "pl-PL", af: "af-ZA" };
  const locale = localeBySub[sub];
  if (!locale) return context.next(); // apex / www / preview → канон en-US

  // The locale directory is an implementation detail, not a public URL. If a
  // user follows an old bookmark or search result, canonicalize only the exact
  // locale document path back to the clean regional root. Asset paths and
  // unrelated application paths still fall through untouched.
  const localePath = `/locales/${locale}`;
  const normalizedPath = url.pathname.replace(/\/+$/, "") || "/";
  if (normalizedPath === localePath || normalizedPath === `${localePath}/index.html`) {
    const cleanUrl = new URL("/", url);
    cleanUrl.search = url.search;
    return Response.redirect(cleanUrl.toString(), 301);
  }

  if (url.pathname !== "/" && url.pathname !== "") return context.next();

  // Pages Functions' ASSETS binding supports an internal asset fetch with a
  // rewritten pathname; unlike a redirect, this keeps af/de/pl at their clean
  // subdomain roots while serving the locale's canonical layout.
  // Keep the trailing slash: Pages' asset server canonicalizes index.html to
  // this directory with a redirect, which would leak the internal path again.
  const localeUrl = new URL(`/locales/${locale}/`, url);
  return context.env.ASSETS.fetch(new Request(localeUrl, context.request));
}
