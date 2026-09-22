#!/usr/bin/env bash
#
# story の `title` 検査の判定表。`story-title-violations.py` へ小さな story を流し、
# deny / pass / miss が期待どおりかを 1 コマンドで確かめる。
#
# 使い方: bash .claude/hooks/lib/story-title-cases.sh
# 出力が `ok` だけなら期待どおり。`NG` が 1 行でも出たら判定が変わっている。
#
# **表をファイルに置くのは、導出（構造セグメントの取り方・`components` の落とし方・
# 葉を見ないこと）がこの検査の中心で、`src` に違反が無い限り検出器を呼ぶだけの層 1・
# 層 2 は緑のままだから。** 同じ形の前例は同じフォルダの `result-option-read-cases.sh`。
#
# 判定を終了コードで見る理由は `.claude/hooks/README.md`「終了コードまで見る」。deny の行は
# さらに報告の見出しが出ることも見る。
#
# **検出器は走査ルートを `src` という綴りで見る**(`feature_of()` が `src/features` から
# 辿る)。一時リポジトリへ `cd` してから相対パスで呼ぶのはそのため。絶対パスで渡すと
# 走査ルートより上のフォルダまで導出に混ざり(`/tmp/xxx/src/...` が `tmp/Xxx/Src/...` に
# なる)、pass の行まで違反として報告される。
#
# 表は `期待|ケース名|story のパス|title` の 1 行 1 ケース。`title` の綴りが 3 つだけ
# 特別で、`-` は `title:` を持たない story、`@tpl` はテンプレートリテラルで書かれた
# `title:`、`@two` は既定 export の外にも `title:` がある story を置く。期待は 3 つ。
#
# | 期待 | 意味 |
# | --- | --- |
# | `deny` | 違反として報告してほしい(exit 1) |
# | `pass` | 報告してはいけない(誤検知したら信用を失う側) |
# | `miss` | **意図した取りこぼし。** 葉(最後のセグメント)は表示名なので見ない。
#            期待の綴りを分けてあるのは、`pass` と並べると次に読む人がバグと読んで
#            葉を自由にした理由ごと消しにいくため |
set -uo pipefail

lib_dir="$(cd "$(dirname "$0")" && pwd)"
detector="$lib_dir/story-title-violations.py"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

# 判定の読み取りと報告は判定表どうしで共有する（`cases_failed` / `decide` / `report`）。
source "$lib_dir/cases-report.sh"

# 検出器を 1 度走らせ、終了コードから deny / pass を決める。
verdict() {
  local output status
  output="$(cd "$work" && python3 "$detector" src)" && status=0 || status=$?
  decide "$output" "$status" '^\[story-title-(tree|missing)\]'
}

while IFS='|' read -r expected label story title; do
  [ -n "$story" ] || continue
  rm -rf "${work:?}/src"
  mkdir -p "$work/$(dirname "$story")"
  case "$title" in
    -)    printf 'export default {};\n' > "$work/$story" ;;
    @tpl) printf 'export default {\n  title: `features/${name}`,\n};\n' > "$work/$story" ;;
    # 既定 export より前に別の `title:` がある形。これを story の title と取り違えると、
    # Storybook が実際に使う綴りを一度も見ないまま通る。
    @two) printf 'const args = {\n  title: "features/editor/EditorLayout",\n};\nexport default {\n  title: "features/canvas/Whatever",\n  args,\n};\n' > "$work/$story" ;;
    *)    printf 'export default {\n  title: "%s",\n};\n' "$title" > "$work/$story" ;;
  esac
  report "$expected" "$(normalize_miss "$expected" "$(verdict)")" "$label"
done <<'CASES'
pass|入れ子の子 feature が導出どおりの title を持つ|src/features/editor/features/canvas/components/artboard-canvas/canvas-body/index.stories.tsx|features/editor/features/canvas/ArtboardCanvas/CanvasBody
deny|子 feature が親 editor を飛ばした title を持つ(#669 の再発形)|src/features/editor/features/canvas/components/artboard-canvas/canvas-body/index.stories.tsx|features/canvas/ArtboardCanvas/CanvasBody
deny|子 feature が別の子 feature の名前を書いた title を持つ|src/features/editor/features/canvas/components/artboard-canvas/index.stories.tsx|features/editor/features/tokens/ArtboardCanvas
deny|中間の PascalCase セグメントを落とした title(C を A より採った根拠)|src/features/editor/features/canvas/components/artboard-canvas/canvas-body/index.stories.tsx|features/editor/features/canvas/CanvasBody
deny|components/ を落とさずに書いた title|src/features/editor/components/editor-layout/index.stories.tsx|features/editor/components/EditorLayout
deny|葉より上にセグメントを 1 つ足した title|src/features/editor/components/editor-layout/index.stories.tsx|features/editor/Layout/EditorLayout
pass|feature 直下(子 feature でない)が導出どおりの title を持つ|src/features/editor/components/editor-layout/index.stories.tsx|features/editor/EditorLayout
pass|src/components/ の story が components/<名前> を持つ|src/components/context-menu/index.stories.tsx|components/ContextMenu
deny|src/components/ の story が features/... で始まる title を持つ|src/components/context-menu/index.stories.tsx|features/editor/ContextMenu
deny|層の綴りだけを取り違えた title(段数は合っている)|src/components/context-menu/index.stories.tsx|widgets/ContextMenu
pass|拡張子が .stories.ts の story も走査される|src/components/context-menu/index.stories.ts|components/ContextMenu
deny|拡張子が .stories.ts の story の title も検査される|src/components/context-menu/index.stories.ts|widgets/ContextMenu
deny|src 直下に置いた story が層を飛ばした title を持つ|src/overview.stories.tsx|features/editor/Overview
pass|src 直下に置いた story が 1 セグメントの title を持つ|src/overview.stories.tsx|Overview
pass|features 以外の層(domains)の story が第 1 セグメントから始まる title を持つ|src/domains/unit/px/index.stories.tsx|domains/Unit/Px
pass|feature 内の components 以外のフォルダは導出に残る|src/features/editor/hooks/use-selection/index.stories.tsx|features/editor/Hooks/UseSelection
deny|feature 直下に置いた story が feature を飛ばした title を持つ|src/features/editor/features/canvas/overview.stories.tsx|features/editor/features/Overview
pass|feature 直下に置いた story が feature の下に入る title を持つ|src/features/editor/features/canvas/overview.stories.tsx|features/editor/features/canvas/Overview
deny|title がテンプレートリテラルで取れない|src/features/editor/components/editor-layout/index.stories.tsx|@tpl
deny|title を持たない story|src/features/editor/components/editor-layout/index.stories.tsx|-
deny|既定 export の外にも title: があり、どれが story の title か決まらない|src/features/editor/components/editor-layout/index.stories.tsx|@two
miss|葉の名前が実在のコンポーネントと無関係でも通る(意図した取りこぼし)|src/features/editor/components/editor-layout/index.stories.tsx|features/editor/Nonsense
CASES

if [ "$cases_failed" -ne 0 ]; then
  echo "判定表と食い違いがあります"
  exit 1
fi
echo "story の title の判定表: 期待どおり"
