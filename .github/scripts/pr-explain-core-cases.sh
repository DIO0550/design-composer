#!/usr/bin/env bash
#
# 解説ページの核の判定表。テンプレート(`.claude/skills/pr-explain/templates/index.html`)から固定
# スクリプトを抜き出して node の `vm` で評価し、`document` が無いときに置かれる `prExplainCore` を
# 叩いて、地図と解説の合流・確認の印の鍵・開く画面が期待どおりかを 1 コマンドで確かめる。
#
# 使い方: bash .github/scripts/pr-explain-core-cases.sh
# 出力が `ok` だけなら期待どおり。`NG` が 1 行でも出たら判定が変わっている。
#
# **どのケースも、既定値や素朴な実装と答えが違う入力を選ぶ。** 古さは 4 件のうち 2 件目を解説時点に
# して、以降の件数(2)が添字(1)とも「全件数 − 添字」(3)とも違うようにする。表示名は concept 名・`index.*`・それ以外を
# 並べ、解説なしのときは退けた解説に concept 名を書いておいて、それを使わないことを見る。
#
# 組み立て(DOM を触る側)はここでは通らない。画面の配線は表示確認で見る。
#
# ケースは node の中の表 `cases` に 1 件ずつ並べ、`actual` の値を JSON にして `expected` と比べる。
set -uo pipefail

scripts_dir="$(cd "$(dirname "$0")" && pwd)"
repo_root="$(cd "$scripts_dir/../.." && pwd)"
template="$repo_root/.claude/skills/pr-explain/templates/index.html"

source "$repo_root/.claude/hooks/lib/cases-report.sh"

results="$(node - "$template" <<'JS'
const fs = require("fs");
const vm = require("vm");

const template = fs.readFileSync(process.argv[2], "utf8");
const script = (template.match(/<script>([\s\S]*?)<\/script>/) || [])[1];
if (script === undefined) {
  console.error("固定スクリプトが見つからない");
  process.exit(2);
}
const context = vm.createContext({});
vm.runInContext(script, context);
const core = context.prExplainCore;
if (core === undefined) {
  console.error("document の無い評価で prExplainCore が置かれていない");
  process.exit(2);
}
const { ExplainedMap, ReviewMark, ScreenChoice } = core;

const Pr = 7;
const shaOf = (digit) => String(digit).repeat(40);
const changedFile = (path, extra = {}) => ({ path, changed: true, status: "M", oldPath: null, additions: 3, deletions: 1, target: null, ...extra });
const contextFile = (path) => ({ path, changed: false });
const commitOf = (digit) => ({ sha: shaOf(digit), merge: false, author: "a", date: `2026-01-0${digit}T00:00:00+00:00`, subject: `c${digit}`, body: "", files: [] });
const mapOf = (overrides = {}) => ({
  version: 2,
  pr: Pr,
  headBranch: "topic",
  baseBranch: "main",
  mergeBase: shaOf(9),
  head: shaOf(4),
  groups: [{ label: "utils", files: [changedFile("src/utils/Hub.ts")] }],
  tests: { added: [], removed: [] },
  commits: [1, 2, 3, 4].map(commitOf),
  dependencies: [],
  ...overrides,
});
const explainOf = (overrides = {}) => ({ version: 1, pr: Pr, sha: shaOf(4), overview: { title: "題", lead: "要約", before: [], after: [{ text: "後" }] }, ...overrides });
const concept = (path, name, extra = {}) => ({ path, name, role: "役割", ...extra });
const commitNote = (sha) => ({ sha, phase: "core", role: "役割", why: "理由" });
const suite = (id, file) => ({ id, label: id, file });
const test = (id, suiteId, name, extra = {}) => ({ id, suite: suiteId, name, techniques: ["state"], why: "w", given: "g", when: "w", then: "t", ...extra });
const absent = { kind: "absent" };
const explained = (map, explain) => ExplainedMap.from(map, { kind: "text", text: JSON.stringify(explain) });
const plain = (value) => JSON.parse(JSON.stringify(value));

// ハブ(Hub.ts)を変え、変更していない 5 本がそれを使っている地図。
const hubImporters = ["A", "B", "C", "D", "E"].map((name) => `src/features/${name}.ts`);
const hubMap = mapOf({
  groups: [
    { label: "utils", files: [changedFile("src/utils/Hub.ts")] },
    { label: "features", files: hubImporters.map(contextFile) },
  ],
  dependencies: hubImporters.map((from) => ({ from, to: "src/utils/Hub.ts", state: "kept" })),
});

const cases = [
  {
    label: "解説の sha が地図の head なら最新",
    actual: () => explained(mapOf(), explainOf()).freshness,
    expected: { kind: "latest", sha: shaOf(4) },
  },
  {
    label: "解説の sha が 4 件中 2 件目のコミットなら古く、以降は 2 コミット",
    actual: () => explained(mapOf(), explainOf({ sha: shaOf(2) })).freshness,
    expected: { kind: "stale", sha: shaOf(2), after: 2 },
  },
  {
    label: "解説の sha が地図のコミットに無ければ「地図に無い」",
    actual: () => explained(mapOf(), explainOf({ sha: shaOf(8) })).freshness,
    expected: { kind: "unknown", sha: shaOf(8) },
  },
  {
    label: "地図に無い sha の commitNotes は別の一覧に出し、どのコミットにも付けない",
    actual: () => {
      const result = explained(mapOf(), explainOf({ commitNotes: [commitNote(shaOf(3)), commitNote(shaOf(8))] }));
      return { stray: result.strayNotes.map((note) => note.sha), attached: result.commits.map((commit) => (commit.note === null ? null : commit.note.sha)) };
    },
    expected: { stray: [shaOf(8)], attached: [null, null, shaOf(3), null] },
  },
  {
    label: "解説が無いとき、テストは地図の追加と、テストファイルの対象から作る",
    actual: () => {
      const testFile = "src/utils/__tests__/Hub.normal.test.ts";
      const map = mapOf({
        groups: [{ label: "utils", files: [changedFile("src/utils/Hub.ts"), changedFile(testFile, { status: "A", target: "src/utils/Hub.ts" })] }],
        tests: { added: [{ file: testFile, name: "足したテスト" }], removed: [] },
      });
      return ExplainedMap.from(map, absent).tests.map((item) => ({ name: item.name, status: item.status, targets: item.targets }));
    },
    expected: [{ name: "足したテスト", status: "new", targets: ["src/utils/Hub.ts"] }],
  },
  {
    label: "解説が無いとき、まとめ方は層だけ",
    actual: () => Object.keys(ExplainedMap.from(mapOf(), absent).groupings),
    expected: ["layer"],
  },
  {
    label: "解説なしのとき、表示名はファイル名(退けた解説の concept 名を使わない)",
    actual: () => {
      const rejected = explainOf({ pr: Pr + 1, concepts: [concept("src/utils/Hub.ts", "ハブ")] });
      return explained(mapOf(), rejected).entries.map((entry) => ExplainedMap.nameOf(entry, "concept"));
    },
    expected: ["Hub.ts"],
  },
  {
    label: "JSON として読めない解説は、理由を「読めない」として解説なしにする",
    actual: () => ExplainedMap.from(mapOf(), { kind: "text", text: "{" }).explain.reason.kind,
    expected: "unreadable",
  },
  {
    label: "version が 1 でない解説は、理由を version として解説なしにする",
    actual: () => explained(mapOf(), explainOf({ version: 2 })).explain.reason,
    expected: { kind: "version", actual: 2 },
  },
  {
    label: "pr が地図と違う解説は、理由を pr として解説なしにする",
    actual: () => explained(mapOf(), explainOf({ pr: Pr + 1 })).explain.reason,
    expected: { kind: "pr", actual: Pr + 1 },
  },
  {
    label: "一覧のキーが配列でない解説は、理由を型として解説なしにする",
    actual: () => explained(mapOf(), explainOf({ concepts: {} })).explain.reason,
    expected: { kind: "shape", key: "concepts" },
  },
  {
    label: "解説のテストは、地図の追加に同じファイルと名前があれば new、無ければ old",
    actual: () => {
      const map = mapOf({ tests: { added: [{ file: "s.test.ts", name: "足した" }], removed: [] } });
      const explain = explainOf({
        suites: [suite("s", "s.test.ts"), suite("u", "u.test.ts")],
        tests: [test("a", "s", "足した"), test("b", "s", "前から"), test("c", "u", "足した")],
      });
      return explained(map, explain).tests.map((item) => [item.test.id, item.status]);
    },
    expected: [["a", "new"], ["b", "old"], ["c", "old"]],
  },
  {
    label: "todo のテストは、地図の追加に同じ名前があっても todo",
    actual: () => {
      const map = mapOf({ tests: { added: [{ file: "s.test.ts", name: "足した" }], removed: [] } });
      const explain = explainOf({ suites: [suite("s", "s.test.ts")], tests: [test("a", "s", "足した", { todo: true })] });
      return explained(map, explain).tests.map((item) => item.status);
    },
    expected: ["todo"],
  },
  {
    label: "箱は変更ファイルと concepts の名指しだけで、ハブを使う残りは「ほかに n」に畳む",
    actual: () => {
      const result = explained(hubMap, explainOf({ concepts: [concept("src/features/B.ts", "B")] }));
      const hub = result.entries.find((entry) => entry.path === "src/utils/Hub.ts");
      return { boxes: result.entries.filter((entry) => entry.inGraph).map((entry) => entry.path), others: hub.others };
    },
    expected: { boxes: ["src/utils/Hub.ts", "src/features/B.ts"], others: ["src/features/A.ts", "src/features/C.ts", "src/features/D.ts", "src/features/E.ts"] },
  },
  {
    label: "graph が偽の concept は木にだけ出し、箱にしない",
    actual: () => {
      const layer = explained(mapOf(), explainOf({ concepts: [concept("src/utils/Hub.ts", "ハブ", { graph: false })] })).groupings.layer[0];
      return { tree: layer.treePaths, boxes: layer.paths };
    },
    expected: { tree: ["src/utils/Hub.ts"], boxes: [] },
  },
  {
    label: "機能でまとめると、feature の無い箱は未分類に入る",
    actual: () => {
      const map = mapOf({ groups: [{ label: "utils", files: [changedFile("src/utils/Hub.ts"), changedFile("src/utils/Other.ts"), contextFile("src/utils/Ctx.ts")] }] });
      const explain = explainOf({
        features: [{ id: "f", label: "機能", role: "役割" }],
        concepts: [concept("src/utils/Hub.ts", "ハブ", { feature: "f" }), concept("src/utils/Ctx.ts", "文脈")],
      });
      return explained(map, explain).groupings.feature.map((group) => ({ kind: group.kind, paths: group.paths }));
    },
    expected: [{ kind: "feature", paths: ["src/utils/Hub.ts"] }, { kind: "unassigned", paths: ["src/utils/Other.ts", "src/utils/Ctx.ts"] }],
  },
  {
    label: "features が空なら、concepts があってもまとめ方は層だけ",
    actual: () => Object.keys(explained(mapOf(), explainOf({ features: [], concepts: [concept("src/utils/Hub.ts", "ハブ")] })).groupings),
    expected: ["layer"],
  },
  {
    label: "表示名は concept 名、無ければファイル名で、index.* には親フォルダを付ける",
    actual: () => {
      const map = mapOf({ groups: [{ label: "src", files: [changedFile("src/a/Named.ts"), changedFile("src/domains/unit/px/index.ts"), changedFile("src/utils/Plain.ts")] }] });
      const entries = explained(map, explainOf({ concepts: [concept("src/a/Named.ts", "名前")] })).entries;
      return { concept: entries.map((entry) => ExplainedMap.nameOf(entry, "concept")), file: entries.map((entry) => ExplainedMap.nameOf(entry, "file")) };
    },
    expected: { concept: ["名前", "px/index.ts", "Plain.ts"], file: ["Named.ts", "px/index.ts", "Plain.ts"] },
  },
  {
    label: "version 1 の地図は古いと分かり、changed の無いファイルも変更ファイルとして箱にする",
    actual: () => {
      const map = {
        version: 1,
        pr: Pr,
        mergeBase: shaOf(9),
        head: shaOf(1),
        groups: [{ label: "utils", files: [{ path: "src/utils/Hub.ts", status: "M", oldPath: null, additions: 3, deletions: 1 }] }],
        tests: { added: [], removed: [] },
        commits: [{ sha: shaOf(1), files: ["src/utils/Hub.ts"] }],
      };
      const result = ExplainedMap.from(map, absent);
      return { isCurrent: result.map.isCurrent, boxes: result.entries.filter((entry) => entry.inGraph).map((entry) => entry.path), subject: result.commits[0].subject };
    },
    expected: { isCurrent: false, boxes: ["src/utils/Hub.ts"], subject: null },
  },
  {
    label: "確認の印の鍵は、同じ sha と同じ文なら同じ",
    actual: () => ReviewMark.keyOf(shaOf(1), "見るところ") === ReviewMark.keyOf(shaOf(1), "見るところ"),
    expected: true,
  },
  {
    label: "確認の印の鍵は、文が変われば別",
    actual: () => ReviewMark.keyOf(shaOf(1), "見るところ") === ReviewMark.keyOf(shaOf(1), "見るところを書き直した"),
    expected: false,
  },
  {
    label: "確認の印の鍵は、sha が変われば別",
    actual: () => ReviewMark.keyOf(shaOf(1), "見るところ") === ReviewMark.keyOf(shaOf(2), "見るところ"),
    expected: false,
  },
  {
    label: "開く画面は、ハッシュが画面を指していれば保存値より優先する",
    actual: () => ScreenChoice.choose({ hash: "#story", saved: "test" }),
    expected: "story",
  },
  {
    label: "ハッシュが無いか知らない値なら保存値、それも無いか知らない値なら構造マップ",
    actual: () => [
      ScreenChoice.choose({ hash: "#nope", saved: "test" }),
      ScreenChoice.choose({ hash: "", saved: "story" }),
      ScreenChoice.choose({ hash: "", saved: null }),
      ScreenChoice.choose({ hash: "#nope", saved: "nope" }),
    ],
    expected: ["test", "story", "map", "map"],
  },
];

// 1 件が例外で止まっても、残りのケースは走らせて、そのケースだけを食い違いとして出す。
const decisionOf = (actual, expected) => {
  try {
    const got = JSON.stringify(plain(actual()));
    return got === JSON.stringify(expected) ? "same" : `got:${got}`;
  } catch (error) {
    return `threw:${error.message}`;
  }
};
for (const { label, actual, expected } of cases) console.log(`${decisionOf(actual, expected)}\t${label}`);
JS
)"
status=$?

if [ "$status" -ne 0 ]; then
  printf 'NG   核を評価できない(node の終了コード %s)\n' "$status"
  [ -n "$results" ] && printf '%s\n' "$results"
  exit 1
fi

while IFS=$'\t' read -r decision label; do
  [ -n "$label" ] || continue
  report same "$decision" "$label"
done <<< "$results"

exit "$cases_failed"
