#!/usr/bin/env bash
#
# 名指ししたパスの検査の判定表。`named-path-violations.py` へ小さな木を流し、
# deny / pass / miss が期待どおりかを 1 コマンドで確かめる。
#
# 使い方: bash .claude/hooks/lib/named-path-cases.sh
# 出力が `ok` だけなら期待どおり。`NG` が 1 行でも出たら判定が変わっている。
#
# **表をファイルに置くのは、綴りの取り出し方（コメントと文字列リテラルの見分け・正規化）と
# 走査対象の決め方がこの検査の中心で、リポジトリに違反が無い限り検出器を呼ぶだけの層 1・
# 層 2 は緑のままだから。** 同じ形の前例は同じフォルダの `story-title-cases.sh`。
#
# 判定を終了コードで見る理由は `.claude/hooks/README.md`「終了コードまで見る」。deny の行は
# さらに報告の見出しが出ることも見る。
#
# **木は 1 度だけ組み、ケースごとに中身だけを書き換える。** 検出器は git が追跡している
# ファイルを走査対象にするので、ケースごとに木を組み直すとケースの数だけ索引の作り直しが走る。
# 走査対象のファイルの並びは固定し、そのうち 1 つにだけケースの本文を書く。
#
# 表は `期待|ケース名|ファイル|書き方|綴り` の 1 行 1 ケース。書き方は本文の形を選ぶ。
#
# | 書き方 | 本文 |
# | --- | --- |
# | `line` | 行頭の `//` コメント |
# | `trailing` | コードの後ろに続く `//` コメント |
# | `block` | 単一行の `/* ... */`（綴りはバッククォートで囲む） |
# | `doc` | 複数行の `/** ... */` |
# | `single` | `//` で始まるコメントを丸ごと入れた `'...'` の文字列リテラル |
# | `slash` | 同じものを `"..."` で書いたもの |
# | `template` | 同じものを複数行のテンプレートリテラルへ入れたもの |
# | `md` | Markdown の 1 行 |
#
# 文字列の 3 種はどれも**中身がコメントの形をしている**。状態機械が引用符を追えていないと
# 中身がコメントとして読まれて deny に転ぶので、pass のままであることが引用符の追跡を守る。
#
# 期待は 3 つ。
#
# | 期待 | 意味 |
# | --- | --- |
# | `deny` | 違反として報告してほしい(exit 1) |
# | `pass` | 報告してはいけない(誤検知したら信用を失う側) |
# | `miss` | **意図した取りこぼし。** 名前・プレースホルダ・相対の綴りと、走査しない
#            ファイル。期待の綴りを分けてあるのは、`pass` と並べると次に読む人がバグと
#            読んで、取りこぼしにした理由ごと消しにいくため |
set -uo pipefail

lib_dir="$(cd "$(dirname "$0")" && pwd)"
detector="$lib_dir/named-path-violations.py"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

# 判定の読み取りと報告は判定表どうしで共有する（`cases_failed` / `decide` / `report`）。
source "$lib_dir/cases-report.sh"

# ケースの本文を書く先。`untracked.md` だけは git へ入れない（走査対象の決め方を見るため）。
case_files=(src/probe.ts docs/probe.md .claude/hooks/README.md harness/records/pr-999.md untracked.md)

# 解決先として実在させる木を組み、ケースの本文を書く先を git の索引へ入れる。
build_tree() {
  mkdir -p \
    "$work/src/features/editor/features/canvas/components/artboard-canvas" \
    "$work/src/features/editor/features/tokens" \
    "$work/src/components/context-menu" \
    "$work/src/domains/unit/px" \
    "$work/src/types" "$work/src/utils" \
    "$work/docs" "$work/rules" "$work/harness/records" "$work/.claude/hooks"
  : > "$work/src/test-setup.ts"
  : > "$work/src/types/IndexMove.ts"
  : > "$work/src/utils/ArrayEx.ts"
  : > "$work/docs/01-file-format.md"
  : > "$work/rules/coding.md"
  for file in "${case_files[@]}"; do : > "$work/$file"; done
  git -C "$work" init -q >/dev/null 2>&1
  git -C "$work" add src docs rules harness .claude >/dev/null 2>&1
}

# 1 ケース分の本文を書く。前のケースの本文は残さない。
write_case() {
  local file="$1" shape="$2" spelling="$3" blank
  for blank in "${case_files[@]}"; do : > "$work/$blank"; done
  case "$shape" in
    line)     printf '// 参照: %s\nexport const Probe = 1;\n' "$spelling" ;;
    trailing) printf 'export const Probe = 1; // 参照: %s\n' "$spelling" ;;
    block)    printf '/* 掴む側と落とす側の対。`%s` が持つ契約。 */\nexport const Probe = 1;\n' "$spelling" ;;
    doc)      printf '/**\n * 器ごと落としても、\n * %s のテストは 1 件も落ちない。\n */\nexport const Probe = 1;\n' "$spelling" ;;
    single)   printf "export const Probe = '// 参照: %s';\n" "$spelling" ;;
    slash)    printf 'export const Probe = "// 参照: %s";\n' "$spelling" ;;
    template) printf 'export const Probe = `\n// 参照: %s\n`;\n// 参照: features/editor/features/canvas\n' "$spelling" ;;
    md)       printf '# probe\n\n参照: %s\n' "$spelling" ;;
  esac > "$work/$file"
}

# 検出器を 1 度走らせ、終了コードから deny / pass を決める。
verdict() {
  local output status
  output="$(cd "$work" && python3 "$detector")" && status=0 || status=$?
  decide "$output" "$status" '^\[named-path-missing\]'
}

build_tree

while IFS='|' read -r expected label file shape spelling; do
  [ -n "$file" ] || continue
  write_case "$file" "$shape" "$spelling"
  report "$expected" "$(normalize_miss "$expected" "$(verdict)")" "$label"
done <<'CASES'
deny|実在しないフォルダを名指しした行コメント|src/probe.ts|line|features/sidebar
deny|複数行の doc コメントの中の綴り|src/probe.ts|doc|features/inspector
deny|単一行のブロックコメントの中の、バッククォートで囲んだ綴り|src/probe.ts|block|features/assets
deny|コードの後ろに続く行コメントの中の綴り|src/probe.ts|trailing|features/sidebar
deny|子 feature の移動に追随していない綴り(#679 の再発形)|src/probe.ts|line|features/canvas
deny|エイリアスの綴りが src/ から解決できない|src/probe.ts|line|@/features/sidebar
deny|末尾が区切りでない接頭辞は実在と見なさない|src/probe.ts|line|features/editor/features/token
deny|カテゴリを挟む前の綴り(末尾に / が付いた判例の形)|src/probe.ts|line|domains/px/
deny|Markdown の行の中の綴り|docs/probe.md|md|features/sidebar
deny|Markdown のリンクの中の、上へ辿る綴り|docs/probe.md|md|[規約](../rules/nonexistent.md)
deny|エイリアスはリポジトリルートからは解決しない|src/probe.ts|line|@/docs/01-file-format.md
deny|PascalCase でも拡張子を持つ末尾は綴りとして見る|src/probe.ts|line|utils/Nonexistent.ts
deny|先頭の . を落とさないので .claude/ 以下も検査される|src/probe.ts|line|.claude/hooks/nonexistent.sh
pass|実在するフォルダを名指しした行コメント|src/probe.ts|line|features/editor/features/canvas
pass|拡張子を省いて実在するファイルを指す綴り(接頭辞一致で当たる)|src/probe.ts|line|src/test-setup
pass|末尾セグメントが区切りまでの接頭辞になっている綴り|src/probe.ts|line|docs/01
pass|前後の . と / を落とすので、途中で切れたプレースホルダも通る|src/probe.ts|line|docs/...
pass|エイリアスの綴りが src/ から解決できる|src/probe.ts|line|@/features/editor/features/tokens
pass|'...' の中のコメントの形をした綴りは見ない|src/probe.ts|single|features/sidebar
pass|src/utils/ の PascalCase 1 ファイルは実在すれば通る|src/probe.ts|line|utils/ArrayEx.ts
pass|"..." の中のコメントの形をした綴りは見ない|src/probe.ts|slash|features/sidebar
pass|テンプレートリテラルの中のコメントの形をした綴りは見ない|src/probe.ts|template|features/sidebar
pass|URL はホスト名が第 1 セグメントになるので見ない|src/probe.ts|line|https://example.com/src/features/sidebar
pass|/ で区切った 2 語(NG/OK)はパスと数えない|src/probe.ts|line|NG/OK
miss|PascalCase を含む綴りは名前(story の title・コンポーネント名)なので見ない|src/probe.ts|line|components/ContextMenu
miss|- で終わる綴りは、切れたプレースホルダなので見ない|src/probe.ts|line|harness/records/pr-
miss|相対の綴り(第 1 セグメントがフォルダ名でない)は見ない|src/probe.ts|line|__tests__/canvas-elements.ts
miss|.claude/hooks/README.md は走査しない(probe レシピと / 区切りの層の列挙)|.claude/hooks/README.md|md|features/sidebar
miss|harness/records/ は走査しない(当時の綴りとして正しい)|harness/records/pr-999.md|md|features/sidebar
miss|相対リンクの段数は見ない(行き先が実在すれば通る)|docs/probe.md|md|[規約](../../../../rules/coding.md)
miss|git が追跡していないファイルは走査しない|untracked.md|md|features/sidebar
CASES

if [ "$cases_failed" -ne 0 ]; then
  echo "判定表と食い違いがあります"
  exit 1
fi
echo "名指ししたパスの判定表: 期待どおり"
