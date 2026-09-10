// Cloudflare Pages Functions — роутинг коротких субдоменів на локалі.
// Локалі фізично живуть у /locales/<locale>/, тому ПЕРЕЗАПИС шляху через
// context.next() зі зміненим pathname дав би 404 (такого файлу не існує).
// Робоче рішення: корінь субдомену — 308-редірект на /locales/<locale>/;
// решта шляхів і канонічні market-host-и (US/CA/IN) — як є.
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
  return Response.redirect(new URL(`/locales/${locale}/`, url).toString(), 308);
}
