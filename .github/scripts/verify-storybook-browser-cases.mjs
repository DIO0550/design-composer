import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual, promisify } from "node:util";

const VerifyScript = fileURLToPath(new URL("./verify-storybook.mjs", import.meta.url));
const StoryId = "fixture--default";
const FixtureHtml = `<!doctype html>
<meta charset="utf-8">
<style>
  .buttons { position: relative; width: 150px; height: 40px; }
  .buttons button { position: absolute; inset: 1px; }
  .cover { display: none; }
  #hover:hover .cover, #second.covered .cover { display: block; }
  .clip { position: relative; width: 160px; height: 40px; overflow: hidden; }
  .clip span { position: absolute; height: 20px; }
  #partial { top: 30px; }
  #clipped { top: 60px; }
</style>
<body class="sb-show-main">
<main id="storybook-root">
  <fieldset disabled><input id="disabled"></fieldset>
  <input id="redirected"><input id="microtask-redirected"><input id="other" autofocus>
  <output id="typed"></output>
  <div id="hover" class="buttons"><button id="hover-target">Target</button><button id="hover-cover" class="cover">Cover</button></div>
  <div id="second" class="buttons"><button id="first-target">Target</button><button id="second-cover" class="cover">Cover</button></div>
  <output id="clicked"></output>
  <div class="clip"><span id="partial">partly visible</span><span id="clipped">fully clipped</span></div>
</main>
<script src="fixture.js"></script>`;
const FixtureScript = `
  globalThis.__STORYBOOK_PREVIEW__ = { currentRender: { id: ${JSON.stringify(StoryId)}, phase: "finished" } };
  const byId = (id) => document.getElementById(id);
  byId("redirected").addEventListener("focus", () => byId("other").focus());
  byId("microtask-redirected").addEventListener("focus", () => queueMicrotask(() => byId("other").focus()));
  byId("other").addEventListener("input", () => { byId("typed").textContent = byId("other").value; });
  byId("first-target").addEventListener("click", () => byId("second").classList.add("covered"));
  function recordCover() { byId("clicked").textContent = "cover was pressed"; }
  byId("hover-cover").addEventListener("pointerdown", recordCover);
  byId("second-cover").addEventListener("pointerdown", recordCover);
`;

const expectVisible = (selector) => ({ kind: "expect-visible", selector, description: selector });
const expectText = (selector, expected) => ({ kind: "expect-text", selector, expected, description: selector });
const fill = (selector) => [{ kind: "fill", selector, value: "wrong input" }, expectText("#typed", "wrong input")];
const hit = (kind, selector) => [{ kind, selector }, expectText("#clicked", "cover was pressed")];
const failure = (steps, observed) => ({ steps, expected: { exitCode: 1, kind: "step-failed", step: 1, observed } });
const actionError = (selector) => `要素を一意に操作できません: ${selector} (not-hittable)`;

const Cases = [
  ["disabled fieldset 内の入力欄に入力しない", failure(fill("#disabled"), "入力できません: #disabled (not-editable)")],
  ["別の入力欄へフォーカスが移ったら入力しない", failure(fill("#redirected"), "入力できません: #redirected (not-focused)")],
  ["フォーカス後のマイクロタスクで別の入力欄に移ったら入力しない", failure(fill("#microtask-redirected"), "入力できません: #microtask-redirected (not-focused)")],
  ["hover で覆われた要素をクリックしない", failure(hit("click", "#hover-target"), actionError("#hover-target"))],
  ["hover で覆われた要素を押下しない", failure(hit("pointer-down", "#hover-target"), actionError("#hover-target"))],
  ["最初のクリック後に覆われた要素を二度目に押下しない", failure(hit("double-click", "#first-target"), actionError("#first-target"))],
  ["完全にクリップされた要素は表示済みではない", failure([expectVisible("#clipped")], false)],
  ["完全にクリップされた要素の文言は観測できない", failure([expectText("#clipped", "fully clipped")], null)],
  ["一部が表示される要素の表示と文言は確認できる", {
    steps: [expectVisible("#partial"), expectText("#partial", "partly visible")],
    expected: { exitCode: 0, checks: [true, "partly visible"] },
  }],
];

async function runCase(directory, index, steps) {
  const operationsPath = join(directory, `steps-${index}.json`);
  const outputPath = join(directory, `output-${index}`);
  await writeFile(operationsPath, JSON.stringify(steps));
  const exitCode = await promisify(execFile)(process.execPath, [
    VerifyScript, "--story", StoryId, "--steps", operationsPath,
    "--storybook-dir", join(directory, "storybook"), "--out", outputPath,
  ]).then(() => 0, (error) => error.code);
  const report = JSON.parse(await readFile(join(outputPath, "report.json"), "utf8"));
  if (report.status === "passed") {
    return { exitCode, checks: report.checks.map(({ observed }) => observed) };
  }
  return { exitCode, kind: report.kind, step: report.step, observed: report.observed };
}

async function main() {
  const directory = await mkdtemp(join(tmpdir(), "verify-storybook-browser-cases-"));
  try {
    const fixture = join(directory, "storybook");
    await mkdir(fixture);
    const story = { id: StoryId, title: "Fixture", name: "Default", type: "story" };
    await Promise.all([
      writeFile(join(fixture, "index.json"), JSON.stringify({ entries: { [StoryId]: story } })),
      writeFile(join(fixture, "iframe.html"), FixtureHtml),
      writeFile(join(fixture, "fixture.js"), FixtureScript),
    ]);
    let failed = false;
    for (const [index, [name, { steps, expected }]] of Cases.entries()) {
      const actual = await runCase(directory, index, steps);
      if (isDeepStrictEqual(expected, actual)) {
        console.log(`ok   ${name}`);
        continue;
      }
      failed = true;
      console.log(`NG   expected=${JSON.stringify(expected)} got=${JSON.stringify(actual)}  ${name}`);
    }
    return failed ? 1 : 0;
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

process.exitCode = await main().catch((error) => {
  console.error(error);
  return 1;
});
