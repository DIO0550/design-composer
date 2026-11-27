import { spawnSync } from "node:child_process";
import { readFile, realpath, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, isAbsolute, relative, resolve, sep } from "node:path";

const ContentTypes = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};
const CdpTimeoutMs = 15_000;

/** ビルドの実ファイルだけを loopback の空きポートで配信する。 */
export async function serveStatic(root) {
  const rootPath = await realpath(root);
  const server = createServer(async (request, response) => {
    try {
      const { pathname } = new URL(request.url ?? "/", "http://127.0.0.1");
      const decoded = decodeURIComponent(pathname);
      const target = await realpath(resolve(rootPath, decoded === "/" ? "index.html" : `.${decoded}`));
      const fromRoot = relative(rootPath, target);
      // ディレクトリ名の共通接頭辞や、外へ向くシンボリックリンクは配信の境界にしない。
      const escapesRoot = fromRoot === ".." || fromRoot.startsWith(`..${sep}`) || isAbsolute(fromRoot);
      const isServedAsset = !escapesRoot && (await stat(target)).isFile();
      if (!isServedAsset) {
        response.writeHead(404).end("not found");
        return;
      }
      const contents = await readFile(target);
      response.writeHead(200, { "content-type": ContentTypes[extname(target)] ?? "application/octet-stream" }).end(contents);
    } catch (error) {
      const hasNoMatchingAsset = error instanceof URIError || error.code === "ENOENT" || error.code === "ENOTDIR";
      if (hasNoMatchingAsset) {
        response.writeHead(404).end("not found");
        return;
      }
      response.writeHead(500).end("Could not read Storybook asset");
    }
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });
  const { port } = server.address();
  return { server, origin: `http://127.0.0.1:${port}` };
}

/** HTTP の不成立を JSON の読み取りエラーと区別する。 */
export async function requestJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`${options?.method ?? "GET"} ${url} failed: ${response.status}`);
  }
  return response.json();
}

/** CHROME_BIN または PATH から実行できる Chrome / Chromium を探す。 */
export function findChrome() {
  const candidates = [process.env.CHROME_BIN, "google-chrome", "google-chrome-stable", "chromium", "chromium-browser"].filter(Boolean);
  const found = candidates.find((candidate) => spawnSync(candidate, ["--version"], { stdio: "ignore" }).status === 0);
  if (!found) {
    throw new Error("Chrome is required. Install Google Chrome/Chromium or set CHROME_BIN.");
  }
  return found;
}

/** 対象のタブに CDP 接続を開き、各コマンドの応答を対応づける。 */
export async function openCdp(wsUrl) {
  const socket = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.close();
      reject(new Error("CDP 接続が時間内に開きませんでした"));
    }, CdpTimeoutMs);
    socket.addEventListener("open", () => {
      clearTimeout(timer);
      resolve();
    }, { once: true });
    socket.addEventListener("error", () => {
      clearTimeout(timer);
      reject(new Error("CDP に接続できませんでした"));
    }, { once: true });
  });

  let id = 0;
  const pending = new Map();
  socket.addEventListener("close", () => {
    for (const { method, timer, reject } of pending.values()) {
      clearTimeout(timer);
      reject(new Error(`CDP 接続が閉じました (${method})`));
    }
    pending.clear();
  });
  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data.toString());
    const callbacks = pending.get(message.id);
    if (!callbacks) {
      return;
    }
    pending.delete(message.id);
    clearTimeout(callbacks.timer);
    if (message.error) {
      callbacks.reject(new Error(message.error.message));
      return;
    }
    callbacks.resolve(message.result ?? {});
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    if (socket.readyState !== WebSocket.OPEN) {
      reject(new Error(`CDP 接続が開いていません (${method})`));
      return;
    }
    const messageId = ++id;
    const timer = setTimeout(() => {
      pending.delete(messageId);
      reject(new Error(`CDP コマンドが時間切れになりました (${method})`));
    }, CdpTimeoutMs);
    pending.set(messageId, { method, timer, resolve, reject });
    socket.send(JSON.stringify({ id: messageId, method, params }));
  });
  return { send, close: () => socket.close() };
}

/** 固定のページ内関数に JSON の引数を渡し、値を読み取る。 */
export async function evaluateInPage(cdp, probe, args = []) {
  const { result, exceptionDetails } = await cdp.send("Runtime.evaluate", {
    expression: `(${probe.toString()})(...${JSON.stringify(args)})`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(`${probe.name}: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
  return result.value;
}

/** 現在のビューポートの PNG データを取得する。 */
export function captureScreenshot(cdp) {
  return cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
}
