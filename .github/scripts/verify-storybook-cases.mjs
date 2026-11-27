import { isDeepStrictEqual } from "node:util";
import { Result } from "../../src/utils/Result.ts";
import { resolveStory, runSteps } from "./verify-storybook.mjs";

const CanvasStory = {
  type: "story",
  id: "editor-canvas--default",
  title: "Editor/Canvas",
  name: "Default",
};
const AlternateCanvasStory = {
  ...CanvasStory,
  id: "editor-canvas--example",
  name: "Example",
};
const AnotherDefaultStory = {
  ...CanvasStory,
  id: "editor-sidebar--default",
  title: "Editor/Sidebar",
};
const CanvasDocs = {
  ...CanvasStory,
  type: "docs",
  id: "editor-canvas--docs",
};
const IndexWithCanvasStories = {
  entries: Object.fromEntries(
    [CanvasStory, AlternateCanvasStory, AnotherDefaultStory, CanvasDocs]
      .map((entry) => [entry.id, entry]),
  ),
};
const DuplicateCanvasStory = {
  ...CanvasStory,
  id: "editor-canvas--another-default",
};

/** 操作と撮影の呼び出し順を残し、期待と比較する文言を返す。 */
function createRecordingDriver(observedText) {
  const calls = [];
  return {
    calls,
    driver: {
      async perform(step) {
        calls.push(step);
        return Result.ok(undefined);
      },
      async observe(step) {
        calls.push(step);
        return Result.ok(observedText);
      },
      async capture(name) {
        calls.push({ kind: "capture", name });
        return Result.ok(`proof/${name}.png`);
      },
    },
  };
}

const PointerDown = { kind: "pointer-down", x: 10, y: 20 };
const PointerMove = { kind: "pointer-move", x: 30, y: 45 };
const PointerUp = { kind: "pointer-up", x: 30, y: 45 };
const HeldCapture = { kind: "capture", name: "held", description: "押したまま移動した位置" };
const BeforeCapture = { kind: "capture", name: "before", description: "比較前の表示" };
const TextExpectation = {
  kind: "expect-text",
  selector: "[data-name=title]",
  expected: "新しい題名",
  description: "変更した題名が表示される",
};
const LateClick = { kind: "click", selector: "button" };

/** story 解決や操作の成否を、比較用の値として展開する。 */
function readableResult(result) {
  if (Result.isOk(result)) {
    return { kind: "ok", value: result.value };
  }
  return { kind: "err", error: result.error };
}

/** story 解決の失敗は読み手が区別できる種別を比較する。 */
function storyErrorKind(result) {
  if (Result.isOk(result)) {
    return "accepted";
  }
  return result.error.kind;
}

const StorybookVerificationCases = [
  {
    label: "完全 ID は該当する story を選ぶ",
    expected: { kind: "ok", value: AlternateCanvasStory },
    measure: () => readableResult(resolveStory(IndexWithCanvasStories, { id: AlternateCanvasStory.id })),
  },
  {
    label: "title と name が完全一致する一意の story を選ぶ",
    expected: { kind: "ok", value: CanvasStory },
    measure: () => readableResult(resolveStory(IndexWithCanvasStories, {
      title: CanvasStory.title,
      name: CanvasStory.name,
    })),
  },
  {
    label: "未知の ID を story として選ばない",
    expected: "not-found",
    measure: () => storyErrorKind(resolveStory(IndexWithCanvasStories, { id: "editor-canvas--unknown" })),
  },
  {
    label: "title と name の重複は曖昧と判定する",
    expected: "ambiguous",
    measure: () => storyErrorKind(resolveStory({
      entries: { ...IndexWithCanvasStories.entries, [DuplicateCanvasStory.id]: DuplicateCanvasStory },
    }, { title: CanvasStory.title, name: CanvasStory.name })),
  },
  {
    label: "docs の ID を story として選ばない",
    expected: "not-found",
    measure: () => storyErrorKind(resolveStory(IndexWithCanvasStories, { id: CanvasDocs.id })),
  },
  {
    label: "押下から解放までの途中に撮影し、画像と説明を記録する",
    expected: {
      calls: [PointerDown, PointerMove, { kind: "capture", name: HeldCapture.name }, PointerUp],
      result: {
        kind: "ok",
        value: {
          screenshots: [{ path: "proof/held.png", description: HeldCapture.description }],
          checks: [],
        },
      },
    },
    async measure() {
      const { calls, driver } = createRecordingDriver("操作前の題名");
      const result = await runSteps([PointerDown, PointerMove, HeldCapture, PointerUp], driver);
      return { calls, result: readableResult(result) };
    },
  },
  {
    label: "期待不一致で止まり、手順・観測値・撮影済み画像を保つ",
    expected: {
      calls: [{ kind: "capture", name: BeforeCapture.name }, TextExpectation],
      result: {
        kind: "err",
        error: {
          kind: "step-failed",
          step: 2,
          description: TextExpectation.description,
          expected: TextExpectation.expected,
          observed: "操作前の題名",
          screenshots: [{ path: "proof/before.png", description: BeforeCapture.description }],
          checks: [],
        },
      },
    },
    async measure() {
      const { calls, driver } = createRecordingDriver("操作前の題名");
      const result = await runSteps([BeforeCapture, TextExpectation, LateClick], driver);
      return { calls, result: readableResult(result) };
    },
  },
];

const results = await Promise.all(StorybookVerificationCases.map(async ({ label, expected, measure }) => {
  const actual = await measure();
  return { label, expected, actual, matches: isDeepStrictEqual(actual, expected) };
}));

for (const { label, expected, actual, matches } of results) {
  if (matches) {
    console.log(`ok   ${label}`);
    continue;
  }
  console.log(`NG   expected=${JSON.stringify(expected)} got=${JSON.stringify(actual)}  ${label}`);
}

process.exitCode = results.every(({ matches }) => matches) ? 0 : 1;
