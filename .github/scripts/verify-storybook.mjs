import { spawn } from "node:child_process";
import { mkdir, mkdtemp, open, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { pathToFileURL } from "node:url";
import { Result } from "../../src/utils/Result.ts";
import { captureScreenshot, evaluateInPage, findChrome, openCdp, requestJson, serveStatic } from "./lib/storybook-browser.mjs";

/**
 * Storybook の index から、完全一致する story を探す。
 *
 * @param index Storybook が返した index
 * @param selector `{ id }` または `{ title, name }`
 * @returns 選択した story、または不在・曖昧さを表す失敗
 */
export function resolveStory(index, selector) {
  const stories = Object.values(index.entries ?? {}).filter((entry) => entry?.type === "story");
  const matches = "id" in selector
    ? stories.filter(({ id }) => id === selector.id)
    : stories.filter(({ title, name }) => title === selector.title && name === selector.name);
  if (matches.length === 0) {
    return Result.err({ kind: "not-found", selector });
  }
  if (matches.length > 1) {
    return Result.err({ kind: "ambiguous", selector, ids: matches.map(({ id }) => id) });
  }
  return Result.ok(matches[0]);
}

/**
 * 手順を順に実行し、期待の観測と途中の撮影を記録する。
 *
 * @param steps 実行する手順
 * @param driver `perform(step)`・`observe(step)`・`capture(name)` を持つ操作先
 * @returns 確認の記録、または失敗した手順と直前までの記録
 */
export async function runSteps(steps, driver) {
  const screenshots = [];
  const checks = [];
  for (const [index, step] of steps.entries()) {
    const description = step.description ?? step.kind;
    const failure = (expected, observed) => Result.err({
      kind: "step-failed", step: index + 1, description, expected, observed, screenshots, checks,
    });
    if (step.kind === "capture") {
      const capture = await driver.capture(step.name);
      if (!Result.isOk(capture)) {
        return failure("PNG を保存できる", capture.error);
      }
      screenshots.push({ path: capture.value, description });
      continue;
    }
    const isExpectation = step.kind === "expect-text" || step.kind === "expect-visible";
    if (isExpectation) {
      const expected = step.kind === "expect-visible" ? true : step.expected;
      const observation = await driver.observe(step);
      if (!Result.isOk(observation)) {
        return failure(expected, observation.error);
      }
      if (observation.value !== expected) {
        return failure(expected, observation.value);
      }
      checks.push({ step: index + 1, description, expected, observed: observation.value });
      continue;
    }
    const performed = await driver.perform(step);
    if (!Result.isOk(performed)) {
      return failure("操作が成功する", performed.error);
    }
  }
  return Result.ok({ screenshots, checks });
}

const Viewport = { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false };
const RenderTimeoutMs = 10_000;
const ObservationTimeoutMs = 5_000;
const Usage = "node .github/scripts/verify-storybook.mjs (--story ID | --title TITLE --name NAME) [--steps FILE] [--storybook-dir DIR] [--out DIR]";
const CaptureName = /^[a-z0-9][a-z0-9_-]*$/i;
const Keys = {
  Enter: { key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 },
  Escape: { key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 },
  Tab: { key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 },
  Backspace: { key: "Backspace", code: "Backspace", windowsVirtualKeyCode: 8 },
};

const errorMessage = (error) => error instanceof Error ? error.message : String(error);
const invalidInput = (message) => Result.err({ kind: "invalid-input", message });
const nonempty = (value) => typeof value === "string" && value.trim().length > 0;

function parseArguments(args) {
  const options = new Map();
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index];
    const value = args[index + 1];
    const isValidOption = ["--story", "--title", "--name", "--steps", "--storybook-dir", "--out"].includes(key)
      && !options.has(key) && nonempty(value) && !value.startsWith("--");
    if (!isValidOption) {
      return invalidInput(`不正な引数: ${key}`);
    }
    options.set(key, value);
  }
  const id = options.get("--story");
  const title = options.get("--title");
  const name = options.get("--name");
  const hasValidStorySelector = id ? !title && !name : Boolean(title) && Boolean(name);
  if (!hasValidStorySelector) {
    return invalidInput("--story または --title と --name を指定してください");
  }
  return Result.ok({ selector: id ? { id } : { title, name }, options });
}

const hasCoordinates = (step) => Number.isFinite(step.x) && Number.isFinite(step.y);
const StepValidators = {
  click: (step) => nonempty(step.selector),
  "double-click": (step) => nonempty(step.selector),
  fill: (step) => nonempty(step.selector) && typeof step.value === "string",
  press: (step) => typeof step.key === "string" && Object.hasOwn(Keys, step.key),
  "pointer-down": (step) => hasCoordinates(step) || nonempty(step.selector),
  "pointer-move": (step) => hasCoordinates(step) || (Number.isFinite(step.dx) && Number.isFinite(step.dy)),
  "pointer-up": (step) => hasCoordinates(step) || (!("x" in step) && !("y" in step)),
  "expect-visible": (step) => nonempty(step.selector) && nonempty(step.description),
  "expect-text": (step) => nonempty(step.selector) && typeof step.expected === "string" && nonempty(step.description),
  capture: (step) => nonempty(step.name) && CaptureName.test(step.name) && nonempty(step.description),
};

function validateSteps(steps) {
  if (!Array.isArray(steps)) {
    return invalidInput("操作ファイルは手順の JSON 配列にしてください");
  }
  const captures = new Set();
  for (const [index, step] of steps.entries()) {
    const isValidStep = typeof step?.kind === "string"
      && Object.hasOwn(StepValidators, step.kind) && StepValidators[step.kind](step);
    if (!isValidStep) {
      return invalidInput(`手順 ${index + 1} に未対応の操作か不正な引数があります`);
    }
    if (step.kind !== "capture") {
      continue;
    }
    if (captures.has(step.name)) {
      return invalidInput(`撮影名が重複しています: ${step.name}`);
    }
    captures.add(step.name);
  }
  if (captures.size > 0) {
    return Result.ok(steps);
  }
  return Result.ok([...steps, { kind: "capture", name: "final", description: "全手順を終えた画面" }]);
}

/** 専用プロファイルに書かれた CDP ポートを待つ。 */
async function waitForDebugOrigin(profile, browserExited) {
  const deadline = Date.now() + 15_000;
  while (!browserExited() && Date.now() < deadline) {
    const portText = await readFile(join(profile, "DevToolsActivePort"), "utf8").catch((error) => {
      if (error.code === "ENOENT") {
        return "";
      }
      return Promise.reject(error);
    });
    const port = Number(portText.match(/^(\d+)\r?\n/)?.[1]);
    const isValidPort = Number.isInteger(port) && port > 0 && port <= 65535;
    if (isValidPort) {
      return Result.ok(`http://127.0.0.1:${port}`);
    }
    await sleep(50);
  }
  return Result.err({ kind: "browser-start", message: "Chrome の CDP ポートが開きませんでした" });
}

/** 各回で起動した Chrome だけを使い、終了後にそのプロファイルを削除する。 */
async function withChrome(verify) {
  const binary = findChrome();
  const profile = await mkdtemp(join(tmpdir(), "verify-storybook-chrome-"));
  try {
    const chrome = spawn(binary, [
      "--headless=new", "--disable-gpu", "--remote-debugging-port=0",
      `--user-data-dir=${profile}`, "about:blank",
    ], { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    chrome.stderr.setEncoding("utf8").on("data", (chunk) => {
      stderr = (stderr + chunk).slice(-2000);
    });
    let ended = false;
    const stopped = new Promise((resolve) => {
      chrome.once("exit", () => {
        ended = true;
        resolve();
      });
      chrome.once("error", (error) => {
        ended = true;
        stderr = errorMessage(error);
        resolve();
      });
    });

    try {
      const debuggerOrigin = await waitForDebugOrigin(profile, () => ended);
      if (!Result.isOk(debuggerOrigin)) {
        return Result.err({ ...debuggerOrigin.error, stderr: stderr.trim() });
      }
      return await verify(debuggerOrigin.value);
    } finally {
      if (!ended) {
        chrome.kill("SIGTERM");
        const force = setTimeout(() => chrome.kill("SIGKILL"), 2000);
        await stopped;
        clearTimeout(force);
      }
    }
  } finally {
    await rm(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  }
}

function renderState(id) {
  const body = document.body;
  const showsRenderError = body?.classList.contains("sb-show-errordisplay")
    || body?.classList.contains("sb-show-nopreview");
  if (showsRenderError) {
    return { kind: "render-error", message: document.querySelector("#error-message")?.textContent?.trim() || document.title };
  }
  const render = globalThis.__STORYBOOK_PREVIEW__?.currentRender;
  const root = document.querySelector("#storybook-root");
  // Storybook は sb-show-main を描画前にも付けるため、選択した story の完了まで待つ。
  const isSelectedStoryReady = body?.classList.contains("sb-show-main") && root && !root.hidden
    && render?.id === id && render.phase === "finished";
  if (isSelectedStoryReady) {
    return { kind: "ready" };
  }
  return { kind: "pending" };
}

async function waitForStory(cdp, story) {
  const deadline = Date.now() + RenderTimeoutMs;
  while (Date.now() < deadline) {
    const state = await evaluateInPage(cdp, renderState, [story.id]);
    if (state.kind === "render-error") {
      return Result.err(state);
    }
    if (state.kind === "ready") {
      return Result.ok(undefined);
    }
    await sleep(50);
  }
  return Result.err({ kind: "render-timeout", message: `${RenderTimeoutMs} ms 以内に ${story.id} が描画されませんでした` });
}

function inspectElement(selector, action) {
  const matches = document.querySelectorAll(selector);
  if (matches.length > 1) {
    return { kind: "ambiguous", count: matches.length };
  }
  const element = matches[0];
  if (!element?.checkVisibility({ opacityProperty: true, visibilityProperty: true })) {
    return { kind: "hidden" };
  }
  const shouldScrollIntoView = action === "point" || action === "fill";
  if (shouldScrollIntoView) {
    element.scrollIntoView({ block: "nearest", inline: "nearest" });
  }
  if (action === "fill") {
    const isTextInput = element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement;
    const isEditable = isTextInput && !element.disabled && !element.readOnly;
    if (!isEditable) {
      return { kind: "not-editable" };
    }
    element.focus();
    element.select();
  }
  const rect = element.getBoundingClientRect();
  const x = rect.x + rect.width / 2;
  const y = rect.y + rect.height / 2;
  if (action === "point") {
    const isDisabled = element.matches(":disabled") || element.closest('[aria-disabled="true"]') !== null;
    if (isDisabled) {
      return { kind: "disabled" };
    }
    if (!element.contains(document.elementFromPoint(x, y))) {
      return { kind: "not-hittable" };
    }
  }
  const intersectsViewport = rect.width > 0 && rect.height > 0
    && rect.right > 0 && rect.bottom > 0 && rect.left < window.innerWidth && rect.top < window.innerHeight;
  const isOutsideViewport = action === "visibility" && !intersectsViewport;
  if (isOutsideViewport) {
    return { kind: "outside-viewport" };
  }
  return {
    kind: "visible",
    text: (element.innerText ?? element.textContent ?? "").trim(),
    x,
    y,
  };
}

async function captureFrame(cdp, path) {
  await evaluateInPage(cdp, () => new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve(true)));
  }));
  const { data } = await captureScreenshot(cdp);
  await writeFile(path, Buffer.from(data, "base64"), { flag: "wx" });
  return path;
}

function createBrowserDriver(cdp, out) {
  let pointer = { x: 0, y: 0, pressed: false };

  const elementState = (selector, action) => evaluateInPage(cdp, inspectElement, [selector, action]);
  const dispatch = async (type, point, { button, pressed, clickCount = 1 }) => {
    await cdp.send("Input.dispatchMouseEvent", {
      type, x: point.x, y: point.y, button, buttons: pressed ? 1 : 0, clickCount,
    });
    pointer = { x: point.x, y: point.y, pressed };
  };
  const press = async (key) => {
    await cdp.send("Input.dispatchKeyEvent", { type: "keyDown", ...Keys[key] });
    await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", ...Keys[key] });
  };
  const pointFor = async (step) => {
    const usesSelector = step.selector && ["click", "double-click", "pointer-down"].includes(step.kind);
    if (usesSelector) {
      const element = await elementState(step.selector, "point");
      if (element.kind !== "visible") {
        return Result.err(`要素を一意に操作できません: ${step.selector} (${element.kind})`);
      }
      return Result.ok(element);
    }
    if (hasCoordinates(step)) {
      return Result.ok({ x: step.x, y: step.y });
    }
    return Result.ok({ x: pointer.x + (step.dx ?? 0), y: pointer.y + (step.dy ?? 0) });
  };
  const perform = async (step) => {
    if (step.kind === "press") {
      await press(step.key);
      return Result.ok(undefined);
    }
    if (step.kind === "fill") {
      const element = await elementState(step.selector, "fill");
      if (element.kind !== "visible") {
        return Result.err(`入力できません: ${step.selector} (${element.kind})`);
      }
      if (step.value === "") {
        await press("Backspace");
      } else {
        await cdp.send("Input.insertText", { text: step.value });
      }
      return Result.ok(undefined);
    }
    const releasesWithoutPress = step.kind === "pointer-up" && !pointer.pressed;
    if (releasesWithoutPress) {
      return Result.err("押下していないポインターは解放できません");
    }
    const interruptsPointerPress = pointer.pressed && step.kind !== "pointer-move" && step.kind !== "pointer-up";
    if (interruptsPointerPress) {
      return Result.err("ポインターを押したまま別のクリックはできません");
    }
    const position = await pointFor(step);
    if (!Result.isOk(position)) {
      return position;
    }
    const point = position.value;
    switch (step.kind) {
      case "pointer-down":
        await dispatch("mouseMoved", point, { button: "none", pressed: false });
        await dispatch("mousePressed", point, { button: "left", pressed: true });
        break;
      case "pointer-move":
        await dispatch("mouseMoved", point, { button: pointer.pressed ? "left" : "none", pressed: pointer.pressed });
        break;
      case "pointer-up":
        await dispatch("mouseReleased", point, { button: "left", pressed: false });
        break;
      case "click":
      case "double-click": {
        const count = step.kind === "double-click" ? 2 : 1;
        await dispatch("mouseMoved", point, { button: "none", pressed: false });
        for (let clickCount = 1; clickCount <= count; clickCount += 1) {
          await dispatch("mousePressed", point, { button: "left", pressed: true, clickCount });
          await dispatch("mouseReleased", point, { button: "left", pressed: false, clickCount });
        }
        break;
      }
    }
    return Result.ok(undefined);
  };
  const observe = async (step) => {
    const deadline = Date.now() + ObservationTimeoutMs;
    const checksVisibility = step.kind === "expect-visible";
    const expected = checksVisibility ? true : step.expected;
    let observed;
    do {
      const element = await elementState(step.selector, checksVisibility ? "visibility" : "read-text");
      if (element.kind === "ambiguous") {
        return Result.err(`${step.selector} に ${element.count} 要素が一致しました`);
      }
      observed = checksVisibility ? element.kind === "visible" : element.text ?? null;
      if (observed === expected) {
        break;
      }
      await sleep(50);
    } while (Date.now() < deadline);
    return Result.ok(observed);
  };
  return {
    perform: (step) => perform(step).catch((error) => Result.err(errorMessage(error))),
    observe: (step) => observe(step).catch((error) => Result.err(errorMessage(error))),
    capture: (name) => captureFrame(cdp, join(out, `${name}.png`))
      .then(Result.ok, (error) => Result.err(errorMessage(error))),
  };
}

async function verifyInBrowser({ origin, story, steps, out }, debuggerOrigin) {
  const target = await requestJson(`${debuggerOrigin}/json/new?about:blank`, { method: "PUT", signal: AbortSignal.timeout(5000) });
  const webSocket = new URL(target.webSocketDebuggerUrl);
  const debuggerPort = new URL(debuggerOrigin).port;
  const isOwnDebugEndpoint = webSocket.protocol === "ws:"
    && webSocket.hostname === "127.0.0.1" && webSocket.port === debuggerPort;
  if (!isOwnDebugEndpoint) {
    return Result.err({ kind: "browser-start", message: "起動した Chrome とは異なる接続先が返りました" });
  }
  const cdp = await openCdp(webSocket);
  try {
    await cdp.send("Emulation.setDeviceMetricsOverride", Viewport);
    const iframe = new URL("/iframe.html", origin);
    iframe.search = new URLSearchParams({ id: story.id, viewMode: "story" });
    const navigation = await cdp.send("Page.navigate", { url: iframe.href });
    if (navigation.errorText) {
      return Result.err({ kind: "render-error", message: navigation.errorText });
    }
    const ready = await waitForStory(cdp, story);
    if (!Result.isOk(ready)) {
      return ready;
    }
    return await runSteps(steps, createBrowserDriver(cdp, out));
  } finally {
    cdp.close();
  }
}

async function buildStorybook(directory) {
  const builder = spawn("pnpm", ["run", "build-storybook", "--output-dir", directory], {
    stdio: ["ignore", process.stderr, process.stderr],
  });
  return new Promise((resolve) => {
    builder.once("error", (error) => resolve(Result.err({ kind: "build-failed", message: errorMessage(error) })));
    builder.once("exit", (code, signal) => resolve(code === 0
      ? Result.ok(undefined)
      : Result.err({ kind: "build-failed", message: `pnpm build-storybook: ${signal ?? code}` })));
  });
}

async function verifyStory(config, steps, out) {
  const build = config.options.get("--storybook-dir");
  const directory = build ? resolve(build) : await mkdtemp(join(tmpdir(), "verify-storybook-build-"));
  try {
    if (!build) {
      const built = await buildStorybook(directory);
      if (!Result.isOk(built)) {
        return built;
      }
    }
    const { server, origin } = await serveStatic(directory);
    try {
      const index = await requestJson(`${origin}/index.json`, { signal: AbortSignal.timeout(5000) });
      const story = resolveStory(index, config.selector);
      if (!Result.isOk(story)) {
        return story;
      }
      const result = await withChrome((debuggerOrigin) => verifyInBrowser({ origin, story: story.value, steps, out }, debuggerOrigin));
      if (!Result.isOk(result)) {
        return Result.err({ ...result.error, story: story.value.id });
      }
      return Result.ok({ story: story.value.id, ...result.value });
    } finally {
      const closed = new Promise((resolve) => server.close(resolve));
      server.closeAllConnections();
      await closed;
    }
  } finally {
    if (!build) {
      await rm(directory, { recursive: true, force: true });
    }
  }
}

async function main(args) {
  const requestsHelp = args.length === 1 && args[0] === "--help";
  if (requestsHelp) {
    console.log(Usage);
    return 0;
  }
  const parsed = parseArguments(args);
  if (!Result.isOk(parsed)) {
    console.error(`${parsed.error.message}\n${Usage}`);
    return 1;
  }
  const { selector, options } = parsed.value;
  const stepsFile = options.get("--steps");
  const out = options.has("--out") ? resolve(options.get("--out")) : await mkdtemp(join(tmpdir(), "verify-storybook-proof-"));
  await mkdir(out, { recursive: true });
  const reportPath = join(out, "report.json");
  const reportFile = await open(reportPath, "wx");
  try {
    const steps = stepsFile
      ? await readFile(stepsFile, "utf8").then((contents) => validateSteps(JSON.parse(contents)))
        .catch((error) => invalidInput(`操作ファイルを読めません: ${errorMessage(error)}`))
      : validateSteps([]);
    const result = Result.isOk(steps)
      ? await verifyStory(parsed.value, steps.value, out)
        .catch((error) => Result.err({ kind: "runtime-error", message: errorMessage(error) }))
      : steps;
    const report = Result.isOk(result)
      ? { status: "passed", ...result.value, reportPath }
      : { status: "failed", selector, ...result.error, reportPath };
    const json = JSON.stringify(report, null, 2);
    await reportFile.writeFile(`${json}\n`);
    console.log(json);
    return Result.isOk(result) ? 0 : 1;
  } finally {
    await reportFile.close();
  }
}

const isScriptEntry = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isScriptEntry) {
  process.exitCode = await main(process.argv.slice(2)).catch((error) => {
    console.error(errorMessage(error));
    return 1;
  });
}
