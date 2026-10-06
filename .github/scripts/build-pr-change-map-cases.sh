#!/usr/bin/env bash
#
# 変更の地図の判定表。一時リポジトリに PR の形の履歴を組んで `build-pr-change-map.py` を走らせ、
# 出てきた JSON が期待どおりかを 1 コマンドで確かめる。
#
# 使い方: bash .github/scripts/build-pr-change-map-cases.sh
# 出力が `ok` だけなら期待どおり。`NG` が 1 行でも出たら判定が変わっている。
#
# **テスト名の増減は、同じテストが「削除 + 追加」に化けないことを見るケースが要。**
# テストファイルの rename と、名前を変えずに中身だけ変えたテストがそれに当たる。差分の行から
# テスト名を拾う実装へ戻すと、この 2 つが落ちる。
#
# base 側にも PR の分岐後のコミットを置く。地図の起点が merge-base でなく base の先端になると、
# base 側で変わったファイルが PR の変更として出てくる。
#
# 表は `ケース名|JSON(変数 m)に対する Python の表明` の 1 行 1 ケース。表明が成り立てば ok。
set -uo pipefail

scripts_dir="$(cd "$(dirname "$0")" && pwd)"
builder="$scripts_dir/build-pr-change-map.py"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

# 外側のリポジトリを指す git の環境変数を落とす(立ったまま一時ディレクトリで git を使うと、
# 本物のリポジトリを触る)。
unset GIT_DIR GIT_WORK_TREE GIT_INDEX_FILE

source "$scripts_dir/../../.claude/hooks/lib/cases-report.sh"

repo="$work/repo"
git init --quiet -b main "$repo"
cd "$repo" || exit 1
git config user.name cases
git config user.email cases@example.com

put() {
  mkdir -p "$(dirname "$1")"
  printf '%s\n' "$2" > "$1"
}

put src/domains/dcmp/node/index.ts 'export const Node = {};'
put src/features/editor/features/tokens/__tests__/token.normal.test.ts "test(\"既存のテスト\", () => {});
it('消すテスト', () => {});"
put src/utils/__tests__/Moved.normal.test.ts 'test("動かすだけのテスト", () => {});'
put src/utils/__tests__/Body.normal.test.ts 'test("中身だけ変えるテスト", () => { expect(1).toBe(1); });'
put src/utils/__tests__/Gone.normal.test.ts 'test("ファイルごと消えるテスト", () => {});'
put docs/base-only.md 'base'
git add -A && git commit --quiet -m base
fork="$(git rev-parse HEAD)"

git checkout --quiet -b pr
put src/domains/dcmp/node/index.ts 'export const Node = { changed: true };'
put src/features/editor/features/tokens/__tests__/token.normal.test.ts "test(\"既存のテスト\", () => {});
test(\"足したテスト\", () => {});
test.each([
  [1, 2],
])(
  \"表で回すテスト %i\",
  (a) => {},
);"
git add -A && git commit --quiet -m first
first="$(git rev-parse HEAD)"
git mv src/utils/__tests__/Moved.normal.test.ts src/utils/__tests__/Renamed.normal.test.ts
put src/utils/__tests__/Body.normal.test.ts 'test("中身だけ変えるテスト", () => { expect(2).toBe(2); });'
put 'src/features/editor/components/日本語/index.tsx' 'export const A = 1;'
put .github/workflows/x.yml 'name: x'
put harness/case-law/x.md 'x'
put docs/x.md 'x'
put src-tauri/src/lib.rs 'fn main() {}'
put src/services/node-html/index.ts 'export const NodeHtml = {};'
printf '\x89PNG\x00\x01' > docs/x.png
git rm --quiet src/utils/__tests__/Gone.normal.test.ts
# テスト名ではない呼び出し(`split(` `.test(`)と、修飾付き・括弧入りの表を持つ新しいテストファイル。
put src/libs/x/__tests__/x.normal.test.ts "test(\"新しいファイルのテスト\", () => { \"a,b\".split(\",\"); /x/.test(\"y\"); });
test.skip(\"飛ばすテスト\", () => {});
test.each([[\"(\", 1]])(\"括弧入りの表 %s\", () => {});"
# 読む順を確かめるために、各層へ 1 件ずつ置く。components には本体・テスト・story を並べる。
put src/domains/unit/px/index.ts 'export const Px = {};'
put src/domains/session/doc/index.ts 'export const Doc = {};'
put src/libs/x/index.ts 'export const X = {};'
put src/types/T.ts 'export type T = 1;'
put src/components/button/index.tsx 'export const Button = 1;'
put src/components/button/__tests__/button.normal.test.tsx 'test("ボタンのテスト", () => {});'
put src/components/button/index.stories.tsx 'export default {};'
put src/hooks/use-x/index.ts 'export const useX = 1;'
put src/app/App.tsx 'export const App = 1;'
put src/main.tsx 'export {};'
put rules/x.md 'x'
put .claude/skills/x/SKILL.md 'x'
# 依存を確かめるファイル。TS の import(`@/` と相対)、Python の import、ワークフローからの呼び出し、
# 同じフォルダのシェル変数付きの呼び出しは依存。コメント・docstring・Markdown の言及と、同じフォルダの
# ありふれた `index.*` の名前は依存にしない。
put src/services/uses-node/index.ts 'import { Node } from "@/domains/dcmp/node";
import { Px } from "../../domains/unit/px";'
put .github/scripts/helper_mod.py 'x = 1'
put .github/scripts/tool.py 'from helper_mod import x'
put .github/scripts/doc_only.py '"""helper_mod.py の説明だけ"""
y = 2'
put .github/scripts/run-cases.sh 'python3 "$scripts_dir/tool.py"
# 説明: doc_only.py を見る'
put .github/workflows/y.yml 'run: python3 .github/scripts/tool.py'
put docs/ref.md 'see .github/scripts/tool.py'
put src/hooks/use-x/other.ts 'export const Name = "index.ts";'
# 依存の境目を確かめるファイル。拾うもの: .tsx から index.tsx(フォルダ)への import・動的 import・
# ドット付きの Python の import・`$dir/サブフォルダ/`・`$(dirname "$0")/`・`$dir/../..`・ルートからの
# `$repo_root/`。拾わないもの: 名前の一部だけが一致する別のパス・別のフォルダの同じ名前・自分自身・
# 消したファイル・行末のコメント・`/* */`(JSX の中を含む)。
put src/app/Uses.tsx 'import { Button } from "@/components/button";'
put src/hooks/use-x/lazy.ts 'export const load = () => import("@/libs/x");'
put src/hooks/use-x/jsx.tsx 'export const A = () => <div>{/* docs/x.md */}</div>;
/*
 * src/types/T.ts
 */'
put src/hooks/use-x/comment.ts '// docs/x.md を見る
export const C = 1;'
put .github/scripts/dotted.py 'from lib.helper_mod import x'
put .github/scripts/lib/inner.py 'z = 3'
put .github/scripts/sub-call.sh 'python3 "$scripts_dir/lib/inner.py"'
put .github/scripts/dirname-call.sh 'bash "$(dirname "$0")/run-cases.sh"'
put .github/scripts/up-call.sh 'cat "$scripts_dir/../../harness/case-law/x.md" "$repo_root/docs/x.md"'
put .github/scripts/partial.sh 'python3 "$scripts_dir/xtool.py" tool.pyc'
put harness/other.sh 'python3 tool.py'
put .github/scripts/self.sh 'echo .github/scripts/self.sh'
put .github/scripts/mention-gone.sh 'cat src/utils/__tests__/Gone.normal.test.ts'
put .github/scripts/trailing.py 'w = 1  # see .github/scripts/tool.py'
# UTF-8 として読めないバイトを含むファイル(地図づくりを落とさない)と、長すぎて依存を探しに読まないファイル。
printf 'python3 "$scripts_dir/tool.py" # \x82\xa0\xff\n' > .github/scripts/sjis.sh
python3 -c 'import sys; sys.stdout.write("python3 .github/scripts/tool.py\n" + "x" * 1_000_001 + "\n")' > .github/scripts/huge.sh
git add -A && git commit --quiet -m second
head="$(git rev-parse HEAD)"

git checkout --quiet main
put docs/base-only.md 'changed on base after the fork'
git add -A && git commit --quiet -m base-moves
base="$(git rev-parse HEAD)"

python3 "$builder" --base "$base" --head "$head" --pr 12 > "$work/map.json" || { echo "NG   地図が作れなかった"; exit 1; }
python3 "$builder" --base "$head" --head "$head" --pr 12 > "$work/empty.json" || { echo "NG   差分なしの地図が作れなかった"; exit 1; }

# 表明が成り立つかを holds / fails で出す。
# $1 地図の JSON, $2 Python の表明
outcome_of() {
  python3 - "$1" "$2" "$fork" "$first" "$head" <<'PY'
import json, sys
m = json.load(open(sys.argv[1], encoding="utf-8"))
fork, first, head = sys.argv[3:6]
labels = [group["label"] for group in m["groups"]]
deps = {(d["from"], d["to"]) for d in m.get("dependencies", [])}
files = {file["path"]: file for group in m["groups"] for file in group["files"]}
label_of = {file["path"]: group["label"] for group in m["groups"] for file in group["files"]}
added = {test["name"] for test in m["tests"]["added"]}
removed = {test["name"] for test in m["tests"]["removed"]}
print("holds" if eval(sys.argv[2]) else "fails")
PY
}

while IFS='|' read -r label expression; do
  [ -n "$label" ] || continue
  file="$work/map.json"
  case "$label" in 差分なし*) file="$work/empty.json" ;; esac
  report holds "$(outcome_of "$file" "$expression")" "$label"
done <<'CASES'
起点は merge-base で、base 側で後から変わったファイルは出ない|m["mergeBase"] == fork and "docs/base-only.md" not in files
head は PR の先端|m["head"] == head and m["pr"] == 12
domains のカテゴリで分類される|label_of["src/domains/dcmp/node/index.ts"] == "domains / dcmp"
入れ子の feature は子 feature の単位で分類される|label_of["src/features/editor/features/tokens/__tests__/token.normal.test.ts"] == "features / editor/features/tokens"
src の外は src-tauri / docs / ハーネス に分かれる|label_of["src-tauri/src/lib.rs"] == "src-tauri" and label_of["docs/x.md"] == "docs" and all(label_of[p] == "ハーネス" for p in [".github/workflows/x.yml", "harness/case-law/x.md", "rules/x.md", ".claude/skills/x/SKILL.md"])
読む順は内側の層から外側へ|labels == ["domains / unit", "domains / dcmp", "domains / session", "services", "libs", "utils", "types", "features / editor", "features / editor/features/tokens", "components", "hooks", "app", "src(その他)", "src-tauri", "docs", "ハーネス"]
層の中では本体 → テスト → story の順|[f["path"] for g in m["groups"] if g["label"] == "components" for f in g["files"]] == ["src/components/button/index.tsx", "src/components/button/__tests__/button.normal.test.tsx", "src/components/button/index.stories.tsx"]
バイナリの行数は数えられないので null|files["docs/x.png"]["additions"] is None and files["docs/x.png"]["deletions"] is None and files["docs/x.md"]["additions"] == 1
非 ASCII のパスも欠けない|"src/features/editor/components/日本語/index.tsx" in files
rename は旧パスを持つ 1 件として出る|files["src/utils/__tests__/Renamed.normal.test.ts"]["status"] == "R" and files["src/utils/__tests__/Renamed.normal.test.ts"]["oldPath"] == "src/utils/__tests__/Moved.normal.test.ts" and "src/utils/__tests__/Moved.normal.test.ts" not in files
中身を変えずに rename したファイルの行数は 0 と 0|(files["src/utils/__tests__/Renamed.normal.test.ts"]["additions"], files["src/utils/__tests__/Renamed.normal.test.ts"]["deletions"]) == (0, 0)
rename でないファイルは旧パスを持たない|files["src/utils/__tests__/Body.normal.test.ts"]["status"] == "M" and files["src/utils/__tests__/Body.normal.test.ts"]["oldPath"] is None
足した test("…") は追加として出る|"足したテスト" in added
test.each(…)(…) の名前も拾う|"表で回すテスト %i" in added
消した it('…') とファイルごと消したテストは削除として出る|removed == {"消すテスト", "ファイルごと消えるテスト"}
新しく足したテストファイルのテストは追加として出る|"新しいファイルのテスト" in added and "ボタンのテスト" in added
修飾付きの test.skip と、括弧入りの表の test.each も拾う|"飛ばすテスト" in added and "括弧入りの表 %s" in added
split(",") や /x/.test("y") の引数はテスト名として拾わない|"," not in added and "y" not in added
TS の @/ と相対パスの import は、index を補って変更ファイルへの依存になる|("src/services/uses-node/index.ts", "src/domains/dcmp/node/index.ts") in deps and ("src/services/uses-node/index.ts", "src/domains/unit/px/index.ts") in deps
Python の import は同じ名前の .py への依存になる|(".github/scripts/tool.py", ".github/scripts/helper_mod.py") in deps
ワークフローがフルパスで呼ぶスクリプトは依存になる|(".github/workflows/y.yml", ".github/scripts/tool.py") in deps
同じフォルダを $変数/ファイル名 で呼ぶのは依存になる|(".github/scripts/run-cases.sh", ".github/scripts/tool.py") in deps
コメントだけの行の言及は依存にしない|(".github/scripts/run-cases.sh", ".github/scripts/doc_only.py") not in deps
docstring の言及は依存にしない|(".github/scripts/doc_only.py", ".github/scripts/helper_mod.py") not in deps
Markdown は使う側にしない|not any(source == "docs/ref.md" for source, _ in deps)
同じフォルダのありふれた index.* の名前は依存にしない|("src/hooks/use-x/other.ts", "src/hooks/use-x/index.ts") not in deps
差分なしの地図は依存も空|m["dependencies"] == []
UTF-8 として読めないバイトがあっても地図を作り、そのファイルの依存も拾う|(".github/scripts/sjis.sh", ".github/scripts/tool.py") in deps
長すぎるファイルは依存を探しに読まない|not any(source == ".github/scripts/huge.sh" for source, _ in deps)
.tsx から、フォルダを指す import で index.tsx への依存になる|("src/app/Uses.tsx", "src/components/button/index.tsx") in deps
動的 import(import("…"))も依存になる|("src/hooks/use-x/lazy.ts", "src/libs/x/index.ts") in deps
ドット付きの Python の import も、最後の名前の .py への依存になる|(".github/scripts/dotted.py", ".github/scripts/helper_mod.py") in deps
$dir/サブフォルダ/ で呼ぶのは、使う側のフォルダからの相対で依存になる|(".github/scripts/sub-call.sh", ".github/scripts/lib/inner.py") in deps
$(dirname "$0")/ で呼ぶのは依存になる|(".github/scripts/dirname-call.sh", ".github/scripts/run-cases.sh") in deps
$dir/../.. と、ルートから書いた $repo_root/ も依存になる|(".github/scripts/up-call.sh", "harness/case-law/x.md") in deps and (".github/scripts/up-call.sh", "docs/x.md") in deps
名前の一部だけが一致する別のパスは依存にしない|not any(source == ".github/scripts/partial.sh" for source, _ in deps)
別のフォルダの同じ名前は依存にしない|("harness/other.sh", ".github/scripts/tool.py") not in deps
自分自身は依存にしない|(".github/scripts/self.sh", ".github/scripts/self.sh") not in deps
消したファイルへの言及は依存にしない|not any(source == ".github/scripts/mention-gone.sh" for source, _ in deps)
行末のコメントの言及は依存にしない|(".github/scripts/trailing.py", ".github/scripts/tool.py") not in deps
// の行の言及は依存にしない|("src/hooks/use-x/comment.ts", "docs/x.md") not in deps
/* */ の中(JSX の中を含む)の言及は依存にしない|not any(source == "src/hooks/use-x/jsx.tsx" for source, _ in deps)
テストファイルの rename は増減に出ない|"動かすだけのテスト" not in added and "動かすだけのテスト" not in removed
中身だけ変えたテストは増減に出ない|"中身だけ変えるテスト" not in added and "既存のテスト" not in added
追加はこの 6 件だけ|added == {"足したテスト", "表で回すテスト %i", "新しいファイルのテスト", "飛ばすテスト", "括弧入りの表 %s", "ボタンのテスト"}
コミットごとの変更ファイルが古い順に入る|[c["sha"] for c in m["commits"]] == [first, head] and m["commits"][0]["files"] == ["src/domains/dcmp/node/index.ts", "src/features/editor/features/tokens/__tests__/token.normal.test.ts"]
差分なしでも head が入り、各一覧は空|m["head"] == head and m["groups"] == [] and m["tests"] == {"added": [], "removed": []} and m["commits"] == []
CASES

exit "$cases_failed"
