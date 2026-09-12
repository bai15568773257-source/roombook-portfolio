// Run after build_preview.py: node demo/test_preview.mjs
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../docs/preview.js", import.meta.url), "utf8");
const html = await readFile(new URL("../docs/index.html", import.meta.url), "utf8");
const listeners = new Map();
let nativeFetchCalls = 0;
const window = {
  location: { href: "https://example.test/roombook-portfolio/", origin: "https://example.test" },
  fetch() { nativeFetchCalls += 1; throw new Error("Native network must never be used"); },
};
vm.runInNewContext(source, {
  window, URL, Response, Intl, Date, setTimeout, clearTimeout,
  document: {
    getElementById() { return null; },
    addEventListener(type, fn, capture) {
      assert.equal(capture, true, "Read-only UI guards must run before app listeners");
      listeners.set(type, fn);
    },
  },
});

const get = async (path, options) => {
  const response = await window.fetch(path, options);
  return { status: response.status, body: await response.json() };
};
const me = await get("/api/auth/me");
assert.equal(me.status, 200);
assert.equal(me.body.user.role, "user");
assert.equal(me.body.user.must_change_password, false);
assert.equal(me.body.user.email, "visitor@example.test");
const users = await get("/api/users/directory");
assert.ok(users.body.every((user) => user.email.endsWith("@example.test")));
const all = await get("/api/reservations");
assert.ok(all.body.length > 10);
assert.ok(all.body.every((item) => !item.can_delete && item.user_email.endsWith("@example.test")));
const oneDate = all.body[0].date;
const end = new Date(`${oneDate}T00:00:00Z`);
end.setUTCDate(end.getUTCDate() + 1);
const range = await get(`/api/reservations?start=${oneDate}&end=${end.toISOString().slice(0, 10)}`);
assert.ok(range.body.length > 0);
assert.ok(range.body.every((item) => item.date === oneDate));
for (const method of ["POST", "PATCH", "DELETE", "PUT", "HEAD"]) {
  assert.equal((await get("/api/reservations", { method })).status, 405);
}
for (const path of ["/api/admin", "/api/admin/users", "/api/admin/reports/usage.csv", "/api/admin/mail/test"]) {
  assert.equal((await get(path)).status, 403);
}
assert.equal((await get("/api/auth/logout", { method: "POST" })).status, 405);
assert.equal((await get("/api/auth/login", { method: "POST" })).status, 405);
assert.equal((await get("/.env")).status, 404);
assert.equal((await get("/api/unknown")).status, 404);
assert.equal((await get("https://external.example.test/api/auth/me")).status, 403);
assert.equal((await get({ url: "https://example.test/api/reservations", method: "POST" })).status, 405);
assert.equal(nativeFetchCalls, 0);
assert.deepEqual((await get("/api/reservations")).body, all.body, "Rejected writes cannot change fixtures");
let prevented = false;
let stopped = false;
listeners.get("submit")({
  preventDefault() { prevented = true; },
  stopImmediatePropagation() { stopped = true; },
});
assert.ok(prevented && stopped);
assert.ok(html.includes("connect-src 'none'"));
assert.ok(html.includes("form-action 'none'"));
assert.ok(html.indexOf('src="./preview.js"') < html.indexOf('src="./app.js'));
assert.ok(!/(?:href|src)="\//.test(html), "Assets must work below the GitHub project subpath");
assert.ok(!source.includes("__EXPECTED_API_VERSION__"));
console.log("PASS: general-user fictional fixtures, date filtering, writes/admin/external denial, no native fetch, capture guards, CSP and subpath assets.");
