#!/usr/bin/env node
// Lets an agent (or you) SEE the app: launches a headless Chromium-family
// browser, runs a plan of steps and saves PNG screenshots + a DOM text dump.
// Harness tool, see ../backend-steam-society/docs/HARNESS.md. No dependencies
// (Node 24 has global fetch and WebSocket).
//
// Usage:
//   DEMO_PASSWORD=... node scripts/ui-shots.mjs scripts/ui-plans/smoke.json
// Env:
//   CHROME_BIN   browser binary (default: first of brave-origin, brave,
//                chromium, google-chrome found in PATH)
//   WEB_URL      default http://localhost:3001
//   API_URL      default http://localhost:3000/v1
//   OUT_DIR      default .shots/<plan-name>  (gitignored)
//   CHROME_EXTRA_ARGS  extra browser flags, space separated (e.g. the fake
//                camera for calls: --use-fake-ui-for-media-stream
//                --use-fake-device-for-media-stream)
//   DEMO_PASSWORD  used by "login" steps; never write passwords in plans.
//
// Plan format (JSON array). Each step is one of:
//   { "viewport": [390, 844] }                      set viewport (mobile if < 600)
//   { "login": "camila.huaman@demo.steamsociety.local" }
//   { "logout": true }
//   { "name": "01-home", "path": "/", "wait": 3000, "after": "<js>" }
//       navigate, optional JS to run after load (inside an async function, so
//       `await` works; errors are printed), then screenshot + text dump.
//       In "after", {{DEMO_PASSWORD}} becomes a JS string literal with the
//       password from the env, so plans can fill login forms without it.
import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const planFile = process.argv[2];
if (!planFile) {
  console.error("usage: node scripts/ui-shots.mjs <plan.json>");
  process.exit(2);
}
const steps = JSON.parse(fs.readFileSync(planFile, "utf8"));
const WEB = process.env.WEB_URL ?? "http://localhost:3001";
const API = process.env.API_URL ?? "http://localhost:3000/v1";
const OUT =
  process.env.OUT_DIR ?? path.join(".shots", path.basename(planFile, ".json"));
const PORT = 9300 + Math.floor(Math.random() * 500);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function findBrowser() {
  if (process.env.CHROME_BIN) return process.env.CHROME_BIN;
  for (const bin of ["brave-origin", "brave", "chromium", "google-chrome"]) {
    try {
      return execFileSync("which", [bin], { encoding: "utf8" }).trim();
    } catch {
      /* try next */
    }
  }
  throw new Error("No Chromium-family browser found. Set CHROME_BIN.");
}

for (const url of [WEB, `${API}/health`]) {
  const ok = await fetch(url)
    .then((r) => r.status < 500)
    .catch(() => false);
  if (!ok) {
    console.error(
      `Not reachable: ${url}. Start the API (pnpm start:dev) and the web (pnpm dev) first.`,
    );
    process.exit(1);
  }
}

fs.mkdirSync(OUT, { recursive: true });
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "ui-shots-"));
const browser = spawn(
  findBrowser(),
  [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--hide-scrollbars",
    ...(process.env.CHROME_EXTRA_ARGS ?? "").split(" ").filter(Boolean),
    "about:blank",
  ],
  // Own process group: the binary may be a wrapper script, and killing only
  // the wrapper would leave the real browser running.
  { stdio: "ignore", detached: true },
);

let target;
for (let i = 0; i < 50 && !target; i++) {
  await sleep(200);
  target = await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, {
    method: "PUT",
  })
    .then((r) => r.json())
    .catch(() => undefined);
}
if (!target) throw new Error("Browser did not open the DevTools port.");

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r));
let seq = 0;
const pending = new Map();
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m);
    pending.delete(m.id);
  }
});
const send = (method, params = {}) =>
  new Promise((r) => {
    const id = ++seq;
    pending.set(id, r);
    ws.send(JSON.stringify({ id, method, params }));
  });
const evalJs = async (expression) =>
  (
    await send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    })
  ).result?.result?.value;

const consoleErrors = [];
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.method === "Runtime.exceptionThrown")
    consoleErrors.push(
      m.params.exceptionDetails?.exception?.description ?? "exception",
    );
  if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error")
    consoleErrors.push(
      m.params.args.map((a) => a.value ?? a.description).join(" "),
    );
});
await send("Page.enable");
await send("Runtime.enable");

const report = [];
try {
  for (const s of steps) {
    if (s.viewport) {
      const [width, height] = s.viewport;
      await send("Emulation.setDeviceMetricsOverride", {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: width < 600,
      });
      continue;
    }
    if (s.login || s.logout) {
      await send("Page.navigate", { url: WEB });
      await sleep(2000);
      const body = s.login
        ? JSON.stringify({
            email: s.login,
            password: process.env.DEMO_PASSWORD ?? "",
          })
        : null;
      const status = await evalJs(
        `fetch(${JSON.stringify(`${API}/auth/logout`)},{method:'POST',credentials:'include'}).catch(()=>0)` +
          (body
            ? `.then(()=>fetch(${JSON.stringify(`${API}/auth/login`)},{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:${JSON.stringify(body)}})).then(r=>r.status)`
            : `.then(()=>'logged out')`),
      );
      report.push(`${s.login ? `login ${s.login}` : "logout"}: ${status}`);
      continue;
    }
    consoleErrors.length = 0;
    await send("Page.navigate", { url: `${WEB}${s.path}` });
    await sleep(s.wait ?? 3000);
    if (s.after) {
      // Wrapped in an async function so plans can use `await`; a failing
      // script is reported instead of silently producing a misleading shot.
      const script = s.after.replaceAll(
        "{{DEMO_PASSWORD}}",
        JSON.stringify(process.env.DEMO_PASSWORD ?? ""),
      );
      const outcome = await send("Runtime.evaluate", {
        expression: `(async () => {\n${script}\n})()`,
        awaitPromise: true,
        returnByValue: true,
      });
      const failure = outcome.result?.exceptionDetails;
      if (failure) {
        const reason =
          failure.exception?.description?.split("\n")[0] ?? failure.text;
        console.error(`  after-script failed in ${s.name}: ${reason}`);
        consoleErrors.push(`${s.name}: after-script: ${reason}`);
      }
      await sleep(2000);
    }
    const shot = await send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: true,
    });
    fs.writeFileSync(
      path.join(OUT, `${s.name}.png`),
      Buffer.from(shot.result.data, "base64"),
    );
    const text = await evalJs("document.body.innerText");
    fs.writeFileSync(path.join(OUT, `${s.name}.txt`), text ?? "");
    const url = await evalJs("location.pathname + location.search");
    report.push(
      `${s.name}: ${s.path} -> ${url}${consoleErrors.length ? `  console errors: ${consoleErrors.join(" | ")}` : ""}`,
    );
  }
} finally {
  ws.close();
  try {
    process.kill(-browser.pid, "SIGTERM");
  } catch {
    browser.kill();
  }
  // The dying browser may still write to its profile for a moment.
  await sleep(500);
  fs.rmSync(profile, {
    recursive: true,
    force: true,
    maxRetries: 10,
    retryDelay: 200,
  });
}

fs.writeFileSync(path.join(OUT, "report.txt"), report.join("\n") + "\n");
console.log(report.join("\n"));
console.log(`\nSaved to ${OUT}/ (PNG + .txt per step, report.txt)`);
