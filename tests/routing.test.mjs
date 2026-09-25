// Host-aware routing contract for functions/_middleware.ts.
//
// These tests call the shipped middleware directly with a fake Pages context.
// No Cloudflare account, no network and no production deploy is involved:
// ASSETS.fetch is recorded, not executed, so the assertions are about which
// document a request resolves to and what the browser is allowed to see in the
// address bar.

import { test } from "node:test";
import assert from "node:assert/strict";
import { onRequest } from "../functions/_middleware.ts";

function run(url) {
  const state = { nextCalls: 0, assetRequests: [] };
  const context = {
    request: new Request(url),
    next: async () => {
      state.nextCalls += 1;
      return "NEXT";
    },
    env: {
      ASSETS: {
        fetch: async (request) => {
          state.assetRequests.push(request.url);
          return new Response("asset", { status: 200 });
        },
      },
    },
  };
  return onRequest(context).then((response) => ({ response, state }));
}

const localeHosts = {
  "de.biosunlocktool.com": "de-DE",
  "pl.biosunlocktool.com": "pl-PL",
  "af.biosunlocktool.com": "af-ZA",
};

for (const [host, locale] of Object.entries(localeHosts)) {
  test(`${host} root serves the locale document without changing the public URL`, async () => {
    const { response, state } = await run(`https://${host}/`);
    assert.equal(state.nextCalls, 0, "the request must not fall through to static handling");
    assert.equal(response.status, 200);
    assert.equal(state.assetRequests.length, 1);
    assert.equal(state.assetRequests[0], `https://${host}/locales/${locale}/`);
    assert.equal(new URL(state.assetRequests[0]).hostname, host, "public host must be preserved");
  });

  test(`${host} canonicalises the legacy locale document path with 301`, async () => {
    for (const path of [`/locales/${locale}`, `/locales/${locale}/`, `/locales/${locale}/index.html`]) {
      const { response, state } = await run(`https://${host}${path}`);
      assert.equal(response.status, 301, `${path} must redirect`);
      assert.equal(response.headers.get("location"), `https://${host}/`, `${path} must redirect to the clean root`);
      assert.equal(state.nextCalls, 0);
      assert.equal(state.assetRequests.length, 0, "a redirect must not fetch a locale asset");
    }
  });

  test(`${host} keeps the query string while canonicalising`, async () => {
    const { response } = await run(`https://${host}/locales/${locale}/index.html?utm_source=bookmark`);
    assert.equal(response.headers.get("location"), `https://${host}/?utm_source=bookmark`);
  });

  test(`${host} leaves assets and unrelated paths untouched`, async () => {
    for (const path of ["/assets/css/main.css", "/blog/dell-bios-password", "/robots.txt", "/other/page.html"]) {
      const { response, state } = await run(`https://${host}${path}`);
      assert.equal(response, "NEXT", `${path} must fall through`);
      assert.equal(state.nextCalls, 1, `${path} must not be rewritten or redirected`);
    }
  });
}

for (const host of ["biosunlocktool.com", "www.biosunlocktool.com", "us.biosunlocktool.com", "ca.biosunlocktool.com", "in.biosunlocktool.com"]) {
  test(`${host} falls through to the shared English root`, async () => {
    const { response, state } = await run(`https://${host}/`);
    assert.equal(response, "NEXT");
    assert.equal(state.nextCalls, 1);
    assert.equal(state.assetRequests.length, 0, `${host} must not be routed into /locales/`);
  });
}

test("India and Canada are market themes, not locale rewrites", async () => {
  for (const host of ["in.biosunlocktool.com", "ca.biosunlocktool.com"]) {
    const { response } = await run(`https://${host}/`);
    assert.equal(response, "NEXT", `${host} must serve the root document selected by data-market`);
  }
});

test("an unknown subdomain is not treated as a locale", async () => {
  const { response, state } = await run("https://xx.biosunlocktool.com/");
  assert.equal(response, "NEXT");
  assert.equal(state.assetRequests.length, 0);
});

test("the legacy en-IN document is not reachable through routing", async () => {
  const { response, state } = await run("https://in.biosunlocktool.com/");
  assert.equal(response, "NEXT");
  assert.equal(state.assetRequests.some((url) => url.includes("en-IN")), false);
});
