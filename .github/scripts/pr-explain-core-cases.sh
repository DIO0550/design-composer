#!/usr/bin/env bash
#
# 解説ページの核の判定表。テンプレート(`.claude/skills/pr-explain/templates/index.html`)から固定
# スクリプトを抜き出して node の `vm` で評価し、`document` が無いときに置かれる `prExplainCore` を
# 叩いて、地図と解説の合流・箱の図の配置・コミットの差分・確認の印の鍵・開く画面が期待どおりかを 1 コマンドで
# 確かめる。
#
# 使い方: bash .github/scripts/pr-explain-core-cases.sh
# 出力が `ok` だけなら期待どおり。`NG` が 1 行でも出たら判定が変わっている。
#
# **どのケースも、既定値や素朴な実装と答えが違う入力を選ぶ。** 古さは 4 件のうち 2 件目を解説時点に
# して、以降の件数(2)が添字(1)とも「全件数 − 添字」(3)とも違うようにする。表示名は concept 名・`index.*`・それ以外を
# 並べ、解説なしのときは退けた解説に concept 名を書いておいて、それを使わないことを見る。箱の図の段の向きは、
# 入力の順と答えの順が違うように並べ、循環は打ち切りで済ませると段が割れる順で渡す。抽象度の中と同じ段の中の順は、
# 変更行数の順をラベルの順と変えておく。差分は hunk のあいだの行・変更前と変更後で番号のずれる行・切る前と見せた
# 行数の違う patch を選ぶ。
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
const { ExplainedMap, ReviewMark, ScreenChoice, CommitDiff, GraphLayout } = core;

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

// 差分の地図のファイルと、注釈を付けたコミットの差分。
const diffFile = (path, extra = {}) => ({ path, status: "M", oldPath: null, additions: 1, deletions: 1, patch: "", patchLines: 0, truncated: false, ...extra });
const noteOn = (path, start, end, text, extra = {}) => ({ path, start, end, text, ...extra });
const diffOf = (files, notes) => CommitDiff.of({ ...commitOf(1), files }, { ...commitNote(shaOf(1)), notes });
const linesOf = (rows) => rows.join("\n");
// 変更後の 1〜3 行目と 10〜12 行目の 2 つの hunk。4〜9 行目は差分に出ていない。
const twoHunks = linesOf(["@@ -1,3 +1,3 @@", " a", "-b", "+B", " c", "@@ -10,3 +10,3 @@", " j", "-k", "+K", " l"]);
const numbersOf = (file) => file.body.hunks.map((hunk) => hunk.notes.map((note) => [note.n, note.text]));

// 箱の図の組と依存。graphGroup の箱は `組名/番号.ts`、boxesOf の箱は渡した名前で、lines はその箱の変更行数。
const graphGroup = (id, lines = [1]) => ({ id, boxes: lines.map((count, index) => ({ path: `${id}/${index}.ts`, lines: count })) });
const dependsOn = (from, to, state = "kept") => ({ from: `${from}/0.ts`, to: `${to}/0.ts`, state });
const boxesOf = (id, names, lines) => ({ id, boxes: names.map((name, index) => ({ path: name, lines: lines === undefined ? 1 : lines[index] })) });
// 上の段から順に、行ごとの組(畳んだ組)・箱(開いた組の中)を左から並べる。
const rowsOf = (units) => [...new Set(units.map((unit) => unit.y))].sort((a, b) => a - b).map((y) => units.filter((unit) => unit.y === y).sort((a, b) => a.x - b.x).map((unit) => (unit.kind === "box" ? unit.path : unit.group)));
const groupRowsOf = (groups, links) => rowsOf(GraphLayout.of({ groups, links, expanded: [] }).units);

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
    label: "箱の図では、使う側の組が上の段、使われる側の組が下の段に並ぶ",
    actual: () => groupRowsOf([graphGroup("domain"), graphGroup("ui"), graphGroup("app")], [dependsOn("ui", "app"), dependsOn("app", "domain")]),
    expected: [["ui"], ["app"], ["domain"]],
  },
  {
    label: "互いに使い合う組は同じ段に並び、それを使う組がその上の段に来る",
    actual: () => groupRowsOf([graphGroup("b"), graphGroup("c"), graphGroup("a")], [dependsOn("a", "b"), dependsOn("b", "a"), dependsOn("c", "a")]),
    expected: [["c"], ["b", "a"]],
  },
  {
    label: "開いた組の中の箱も、互いに使い合うものは同じ段に並ぶ",
    actual: () => {
      const links = [{ from: "x", to: "y", state: "kept" }, { from: "y", to: "x", state: "kept" }, { from: "z", to: "x", state: "added" }];
      return rowsOf(GraphLayout.of({ groups: [boxesOf("g", ["y", "z", "x"])], links, expanded: ["g"] }).units);
    },
    expected: [["z"], ["y", "x"]],
  },
  {
    label: "同じ段の箱は 1 行に 4 つまでで、5 つ目は次の行に回る",
    actual: () => rowsOf(GraphLayout.of({ groups: [boxesOf("g", ["a", "b", "c", "d", "e"])], links: [], expanded: ["g"] }).units),
    expected: [["a", "b", "c", "d"], ["e"]],
  },
  {
    label: "消えた依存は段に使わず、その 2 つの組は同じ段に並ぶ",
    actual: () => groupRowsOf([graphGroup("a"), graphGroup("b")], [dependsOn("a", "b", "removed")]),
    expected: [["a", "b"]],
  },
  {
    label: "抽象度が中なら、4 つの組のうち変更行数の多い 2 つを開く",
    actual: () => GraphLayout.expandedAt(GraphLayout.Levels.Mid, [graphGroup("a", [5]), graphGroup("b", [40]), graphGroup("c", [10]), graphGroup("d", [30])]),
    expected: ["b", "d"],
  },
  {
    label: "抽象度が中なら、組が 1 つだけでもそれを開く",
    actual: () => GraphLayout.expandedAt(GraphLayout.Levels.Mid, [graphGroup("a", [5])]),
    expected: ["a"],
  },
  {
    label: "同じ段の組は、変更行数の多い順に左から並ぶ",
    actual: () => groupRowsOf([graphGroup("a", [5]), graphGroup("b", [40]), graphGroup("c", [10])], []),
    expected: [["b", "c", "a"]],
  },
  {
    label: "注釈は行の入る最初の hunk に付き、番号は入力の順ではなく hunk の順にファイルの中で通す",
    actual: () => {
      const notes = [noteOn("src/a.ts", 11, 11, "二つ目"), noteOn("src/a.ts", 3, 10, "またぐ")];
      return numbersOf(diffOf([diffFile("src/a.ts", { patch: twoHunks })], notes).files[0]);
    },
    expected: [[[1, "またぐ"]], [[2, "二つ目"]]],
  },
  {
    label: "hunk のあいだの行への注釈は、差分に出ていない行への注釈として番号を続けて回す",
    actual: () => {
      const file = diffOf([diffFile("src/a.ts", { patch: twoHunks })], [noteOn("src/a.ts", 2, 2, "差分の中"), noteOn("src/a.ts", 6, 7, "あいだ")]).files[0];
      return { placed: numbersOf(file), unplaced: file.unplaced.map((note) => [note.n, note.text]) };
    },
    expected: { placed: [[[1, "差分の中"]], []], unplaced: [[2, "あいだ"]] },
  },
  {
    label: "side が old の注釈は、変更前の行番号で hunk と光らせる行を決める",
    actual: () => {
      const patch = linesOf(["@@ -10,3 +10,1 @@", "-a", "-b", " c", "@@ -30,2 +28,2 @@", " x", "-y", "+Y"]);
      const note = noteOn("src/a.ts", 11, 11, "消した行", { side: "old" });
      const hunks = diffOf([diffFile("src/a.ts", { patch })], [note]).files[0].body.hunks;
      return { hunk: hunks.findIndex((hunk) => hunk.notes.length > 0), covered: hunks.flatMap((hunk) => hunk.lines).filter((line) => CommitDiff.covers(note, line)).map((line) => line.text) };
    },
    expected: { hunk: 0, covered: ["b"] },
  },
  {
    label: "そのコミットに無いパスへの注釈は、どのファイルにも付けず「地図に無い」に回す",
    actual: () => {
      const result = diffOf([diffFile("src/a.ts")], [noteOn("src/a.ts", 1, 1, "ある"), noteOn("src/gone.ts", 1, 1, "無い")]);
      return { stray: result.strayNotes.map((note) => note.path), onFile: result.files[0].unplaced.map((note) => note.text) };
    },
    expected: { stray: ["src/gone.ts"], onFile: ["ある"] },
  },
  {
    label: "切った patch の残り行数は、切る前の行数から見せた行数を引いたもので、切っていなければ 0",
    actual: () => {
      const patch = linesOf(["@@ -1 +1 @@", "-a", "+b"]);
      const result = diffOf([diffFile("src/a.ts", { patch, patchLines: 10, truncated: true }), diffFile("src/b.ts", { patch, patchLines: 10 })], []);
      return result.files.map((file) => file.body.remaining);
    },
    expected: [7, 0],
  },
  {
    label: "patch が空なら中身の変更なし、null なら消したファイル(変更前の行への注釈はそこに付く)かバイナリ",
    actual: () => {
      const files = [
        diffFile("src/moved.ts", { status: "R", oldPath: "src/old.ts" }),
        diffFile("src/gone.ts", { status: "D", additions: 0, deletions: 61, patch: null }),
        diffFile("src/image.png", { status: "A", additions: null, deletions: null, patch: null }),
      ];
      const notes = [noteOn("src/gone.ts", 5, 6, "消した行", { side: "old" }), noteOn("src/gone.ts", 1, 1, "変更後")];
      return diffOf(files, notes).files.map((file) => ({ kind: file.body.kind, lines: file.body.lines ?? null, onBody: (file.body.notes ?? []).map((note) => [note.n, note.text]), unplaced: file.unplaced.map((note) => [note.n, note.text]) }));
    },
    expected: [
      { kind: "unchanged", lines: null, onBody: [], unplaced: [] },
      { kind: "deleted", lines: 61, onBody: [[1, "消した行"]], unplaced: [[2, "変更後"]] },
      { kind: "binary", lines: null, onBody: [], unplaced: [] },
    ],
  },
  {
    label: "コードの表示では、続けて消した行を 1 つに畳み、あいだに残った行で分ける",
    actual: () => {
      const patch = linesOf(["@@ -1,5 +1,3 @@", " a", "-b", "-c", "+d", "-e", " f"]);
      const hunk = diffOf([diffFile("src/a.ts", { patch })], []).files[0].body.hunks[0];
      return CommitDiff.codeRowsOf(hunk).map((row) => (row.kind === "gap" ? ["gap", row.lines.map((line) => line.text)] : ["line", row.line.text]));
    },
    expected: [["line", "a"], ["gap", ["b", "c"]], ["line", "d"], ["gap", ["e"]], ["line", "f"]],
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
