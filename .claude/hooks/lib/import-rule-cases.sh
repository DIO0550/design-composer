#!/usr/bin/env bash
#
# import 規約の検査の判定表。`import-rule-violations.py` へ小さなツリーを流し、
# どの種別で報告されるかが期待どおりかを 1 コマンドで確かめる。
#
# 使い方: bash .claude/hooks/lib/import-rule-cases.sh
# 出力が `ok` だけなら期待どおり。`NG` が 1 行でも出たら判定が変わっている。
#
# **表をファイルに置くのは、どの feature に属するかがパスの深さで決まり（`feature_of()`）、
# `src` に違反が無い限り検出器を呼ぶだけの層 1・層 2 は緑のままだから。** 同じ形の前例は
# 同じフォルダの `story-title-cases.sh`。
#
# **期待は種別の綴りと件数まで見る。** 終了コードだけを見ると、種別を 1 つ報告から落としても
# 違反の総数が残る限り exit 1 のまま通る（`module-public-api` / `domains-category` /
# `import-cycle` を落とすミューテーションが素通りした）。向きの違反が公開口の違反として
# 報告される取り違えも、終了コードでは見えない。
#
# **検出器は層の位置を `src/features` のような相対パスで持つ**（`FEATURES_ROOT` /
# `DOMAINS_ROOT`）。作業フォルダへ `cd` してから `src` を渡すのはそのため。絶対パスで渡すと
# どのファイルも層の外と見なされ、deny を期待したケースが全部 pass になる。
#
# 表は `期待|ケース名|置くファイル` の 1 行 1 ケース。ツリーはケースごとに組み直す。
# 置くファイルは `パス>中身` を空白で並べたもので、`-` なら何も置かない。中身の綴りは 5 つ。
#
# | 中身 | 置くもの |
# | --- | --- |
# | `-` | import を持たないファイル |
# | `<綴り>` | `export { Probe } from "<綴り>";` |
# | `type:<綴り>` | `import type` だけで読むファイル |
# | `dynamic:<綴り>` | `import("<綴り>")` だけで読むファイル |
# | `comment:<綴り>` | `/** */` の中・`/* */`・`//` の 3 つのコメントにだけ import を書いたファイル |
#
# 期待は `pass`（違反 0 件）か、報告された種別を報告順に `+` で繋いだもの。2 件以上の種別は
# `種別*件数` と綴る。検出器の終了コードと報告の見出しが食い違ったら `broken`。
set -uo pipefail

lib_dir="$(cd "$(dirname "$0")" && pwd)"
detector="$lib_dir/import-rule-violations.py"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

# 報告は判定表どうしで共有する（`cases_failed` / `report`）。
source "$lib_dir/cases-report.sh"

# 判定の土台になるツリー。親 `editor` の下に子 feature を 2 つ置き、公開口・テスト用の
# 公開口・中のモジュールを持たせる。feature の外にも、`index.tsx` を持つモジュール・
# 入れ子のモジュール・カテゴリの下の domains を 1 つずつ置く。
build_tree() {
  local editor="$work/src/features/editor"
  rm -rf "${work:?}/src"
  mkdir -p "$work/src/app" \
    "$editor/components/features/toolbar" \
    "$editor/features/sidebar/__stories__" \
    "$editor/features/sidebar/components/layers-panel" \
    "$editor/features/tokens/__tests__" \
    "$work/src/components/type-glyph" \
    "$work/src/libs/document-ipc/fake" \
    "$work/src/domains/unit/px"
  printf 'export const App = 1;\n' > "$work/src/app/App.ts"
  printf 'export const EditorScreen = 1;\n' > "$editor/index.ts"
  printf 'export const Toolbar = 1;\n' > "$editor/components/features/toolbar/index.ts"
  printf 'export const Sidebar = 1;\n' > "$editor/features/sidebar/index.ts"
  printf 'export const SampleDocument = 1;\n' > "$editor/features/sidebar/__stories__/index.ts"
  printf 'export const LayersPanel = 1;\n' > "$editor/features/sidebar/components/layers-panel/index.ts"
  printf 'export const Row = 1;\n' > "$editor/features/sidebar/components/layers-panel/row.ts"
  printf 'export const TokenList = 1;\n' > "$editor/features/tokens/index.ts"
  printf 'export const setupTokens = 1;\n' > "$editor/features/tokens/__tests__/index.ts"
  printf 'export const TypeGlyph = () => null;\n' > "$work/src/components/type-glyph/index.tsx"
  printf 'export const GlyphPath = 1;\n' > "$work/src/components/type-glyph/glyph-path.ts"
  printf 'export const DocumentIpc = 1;\n' > "$work/src/libs/document-ipc/index.ts"
  printf 'export const FakeDocumentIpc = 1;\n' > "$work/src/libs/document-ipc/fake/index.ts"
  printf 'export const Px = 1;\n' > "$work/src/domains/unit/px/index.ts"
}

# 表の 1 つ分の中身を、置くファイルの本文にする。
#
# $1 表に書かれた中身
render_body() {
  local spec="$1"
  case "$spec" in
    -) printf 'export const Probe = 1;\n' ;;
    type:*) printf 'import type { Probe } from "%s";\nexport type Alias = Probe;\n' "${spec#type:}" ;;
    dynamic:*) printf 'export const load = () => import("%s");\n' "${spec#dynamic:}" ;;
    comment:*) printf '/**\n * import { Probe } from "%s";\n */\n/* import { Probe } from "%s"; */\n// import { Probe } from "%s";\nexport const Probe = 1;\n' \
      "${spec#comment:}" "${spec#comment:}" "${spec#comment:}" ;;
    *) printf 'export { Probe } from "%s";\n' "$spec" ;;
  esac
}

# 表の「置くファイル」を作業フォルダへ書く。
#
# $1 `パス>中身` を空白で並べたもの。`-` なら何も置かない
place() {
  local entry
  [ "$1" = "-" ] && return 0
  for entry in $1; do
    mkdir -p "$work/$(dirname "${entry%%>*}")"
    render_body "${entry#*>}" > "$work/${entry%%>*}"
  done
}

# 検出器を 1 度走らせ、報告された種別を報告順に `+` で繋いで返す。
#
# `broken` になるのは、終了コードと見出しの有無が食い違ったとき(exit 0 で見出しがある /
# exit 1 で見出しが無い)、終了コードが 0・1 以外のとき、種別として読めない見出しがあるとき。
# `cases-report.sh` の `decide()` を使わないのは、exit 1 以外を一律 pass と読むため。
# 見出しを出したまま exit 0 を返す退行（push が止まらない）がそれでは通る。
verdict() {
  local output status kinds headings
  output="$(cd "$work" && python3 "$detector" src)" && status=0 || status=$?
  headings="$(printf '%s\n' "$output" | grep -c '^\[')"
  kinds="$(printf '%s\n' "$output" \
    | sed -nE 's/^\[([a-z-]+)\] ([0-9]+) 件$/\1*\2/p' \
    | sed 's/\*1$//')"
  if [ "$headings" != "$(printf '%s' "$kinds" | grep -c .)" ]; then
    echo "broken"
    return 0
  fi
  kinds="$(printf '%s\n' "$kinds" | paste -sd '+' -)"
  case "$status:${kinds:+found}" in
    0:) echo "pass" ;;
    1:found) echo "$kinds" ;;
    *) echo "broken" ;;
  esac
}

# 期待の欄に出てくる種別を 1 行ずつ並べる（件数の綴りは落とす）。
#
# $1 表の期待の欄を改行で並べたもの
kinds_in() {
  printf '%s\n' "$1" | tr '+' '\n' | sed 's/\*[0-9]*$//' | sort -u
}

cases="$(cat <<'CASES'
pass|probe を置かない土台のツリーは違反 0 件|-
pass|親 feature が直下の子 feature の公開口を読む|src/features/editor/probe.ts>@/features/editor/features/sidebar
pass|親 feature が直下の子 feature の __tests__ 公開口を読む|src/features/editor/probe.ts>@/features/editor/features/tokens/__tests__
pass|親 feature が直下の子 feature の __stories__ 公開口を読む|src/features/editor/probe.ts>@/features/editor/features/sidebar/__stories__
pass|feature が自分の中のモジュールの公開口を読む|src/features/editor/features/sidebar/probe.ts>@/features/editor/features/sidebar/components/layers-panel
pass|モジュールの中のファイルが同じモジュールの内部を読む|src/features/editor/features/sidebar/components/layers-panel/probe.ts>./row
pass|feature の外がトップレベル feature の公開口を読む|src/app/probe.ts>@/features/editor
pass|feature 層の直下に置いたファイルは親 feature に属する|src/features/editor/features/probe.ts>@/features/editor/features/sidebar
pass|feature の中の features という名前の普通のフォルダは feature 層と数えない|src/features/editor/components/features/toolbar/probe.ts>@/features/editor/features/tokens
pass|feature が自分の __tests__ の中のファイルを直接読む(__tests__ はモジュールと数えない)|src/features/editor/features/tokens/__tests__/fixture.ts>- src/features/editor/features/tokens/probe.ts>./__tests__/fixture
pass|入れ子のモジュールの公開口は外から読める|src/features/editor/probe.ts>@/libs/document-ipc/fake
pass|コメントに書いた import のパスでは止まらない|src/features/editor/probe.ts>comment:@/features/editor/features/sidebar/components/layers-panel
pass|カテゴリの下に置いた domains のモジュールは通る|src/domains/unit/elapsed/index.ts>-
pass|自分自身を読むファイルは閉路にしない|src/utils/probe-a.ts>./probe-a
feature-public-api|親 feature が子 feature の中のモジュールの公開口を読む|src/features/editor/probe.ts>@/features/editor/features/sidebar/components/layers-panel
feature-public-api|feature の外が feature の中のモジュールを読む|src/app/probe.ts>@/features/editor/components/features/toolbar
feature-public-api|兄弟 feature の内部は、向きではなく公開口で報告する|src/features/editor/features/tokens/probe.ts>@/features/editor/features/sidebar/components/layers-panel
feature-public-api|feature の外が feature の直下に置いた index 以外のファイルを読む|src/features/editor/helper.ts>- src/app/probe.ts>@/features/editor/helper
feature-public-api|feature の外が feature の中の .tsx(index 以外)を読む|src/features/editor/components/cell.tsx>- src/app/probe.ts>@/features/editor/components/cell
feature-public-api|動的 import で feature の内部を読む|src/app/probe.ts>dynamic:@/features/editor/components/features/toolbar
feature-public-api|.tsx から feature の内部を読む|src/features/editor/probe.tsx>@/features/editor/features/sidebar/components/layers-panel/row
feature-sibling|兄弟 feature の公開口を読む|src/features/editor/features/sidebar/probe.ts>@/features/editor/features/tokens
feature-sibling|兄弟 feature の __tests__ 公開口を読む|src/features/editor/features/sidebar/probe.ts>@/features/editor/features/tokens/__tests__
feature-sibling|兄弟 feature の __stories__ 公開口を読む|src/features/editor/features/tokens/probe.ts>@/features/editor/features/sidebar/__stories__
feature-sibling|トップレベルの feature 同士が読む|src/features/probe-a/index.ts>- src/features/probe-b/index.ts>@/features/probe-a
feature-sibling*2|兄弟が読み合って閉路になっても、出るのは feature-sibling だけ|src/features/editor/features/sidebar/probe.ts>@/features/editor/features/tokens src/features/editor/features/tokens/probe.ts>@/features/editor/features/sidebar
feature-sibling+feature-nest-depth|祖父 feature が孫 feature を読む|src/features/editor/features/sidebar/features/tree/index.ts>- src/features/editor/probe.ts>@/features/editor/features/sidebar/features/tree
feature-ancestor|子 feature が親 feature を読む|src/features/editor/features/sidebar/probe.ts>@/features/editor
feature-ancestor|親が子を読んでいるところへ子から親への辺が増えても、出るのは feature-ancestor だけ|src/features/editor/probe.ts>@/features/editor/features/sidebar src/features/editor/features/sidebar/probe.ts>@/features/editor
feature-nest-depth|入れ子が 3 段目の feature は import が無くても報告する|src/features/editor/features/sidebar/features/tree/index.ts>-
module-public-api|index.tsx を持つモジュールの内部を、そのフォルダの外から読む|src/components/probe.ts>@/components/type-glyph/glyph-path
module-public-api|.tsx からモジュールの内部を読む|src/components/probe.tsx>@/components/type-glyph/glyph-path
domains-category|domains のモジュールがカテゴリのフォルダの下にいない|src/domains/loose-thing/index.ts>-
domains-category|domains のカテゴリのフォルダが index.ts を持つ|src/domains/unit/index.ts>-
import-cycle|3 ファイルの閉路を拾う|src/utils/probe-a.ts>./probe-b src/utils/probe-b.ts>./probe-c src/utils/probe-c.ts>./probe-a
import-cycle|.tsx どうしの閉路を拾う|src/components/probe-a.tsx>./probe-b src/components/probe-b.tsx>./probe-a
import-cycle|import type だけでできた閉路も拾う|src/utils/probe-a.ts>type:./probe-b src/utils/probe-b.ts>type:./probe-a
CASES
)"

while IFS='|' read -r expected label files; do
  build_tree
  place "$files"
  report "$expected" "$(verdict)" "$label"
done <<< "$cases"

# 検出器が報告する種別のうち、表の期待に 1 度も出てこないものがあれば NG にする。種別を
# 足したときに表が追随しないと、その種別は誰にも守られないまま緑になる。種別は `scan()` の
# `groups` から取り、取れた数が docstring の「報告する違反は N つ」と合わなければ、
# 取り出しそのものが壊れていると見なす（0 件取れたまま網羅と読まないため）。
reported_kinds="$(sed -nE 's/^ +\("([a-z-]+)", [a-z_]+\),$/\1/p' "$detector")"
documented_count="$(sed -nE 's/^報告する違反は ([0-9]+) つ。$/\1/p' "$detector")"
reported_count="$(printf '%s' "$reported_kinds" | grep -c .)"
kinds_extracted_as_documented() {
  [ -n "$documented_count" ] && [ "$reported_count" = "$documented_count" ]
}
if ! kinds_extracted_as_documented; then
  printf 'NG   検出器の種別を %s 件取り出したが、docstring は %s つと書いている\n' \
    "$reported_count" "${documented_count:-何}"
  cases_failed=1
fi
covered_kinds="$(kinds_in "$(printf '%s\n' "$cases" | cut -d '|' -f 1)")"
for kind in $reported_kinds; do
  if printf '%s\n' "$covered_kinds" | grep -qx "$kind"; then
    printf 'ok   %s を期待するケースがある\n' "$kind"
  else
    printf 'NG   %s を期待するケースが表に無い\n' "$kind"
    cases_failed=1
  fi
done

if [ "$cases_failed" -ne 0 ]; then
  echo "判定表と食い違いがあります"
  exit 1
fi
echo "import 規約の判定表: 期待どおり"
