#!/usr/bin/env bash
#
# import 規約の検査の判定表。`import-rule-violations.py` へ小さなツリーを流し、
# どの種別で報告されるかが期待どおりかを 1 コマンドで確かめる。
#
# 使い方: bash .claude/hooks/lib/import-rule-cases.sh
# 出力が `ok` だけなら期待どおり。`NG` が 1 行でも出たら判定が変わっている。
#
# **表をファイルに置くのは、feature が入れ子になってから「どの feature に属するか」が
# パスの深さで決まるようになり、手で 1 回動かすだけでは退行を検知できないため。** 同じ
# 形の前例は同じフォルダの `result-option-read-cases.sh` と `canary-cases.sh`。
#
# **期待は種別の綴りまで見る。** 終了コードだけを見ると、向きの違反（`feature-direction`）
# が公開口の違反（`feature-public-api`）として報告されても ok になる。2 つは直す場所が
# 違う（向きは設計、公開口は import の書き方）ので、取り違えは見つからないと困る。
#
# 表は `期待|ケース名|probe を置くパス|import の綴り` の 1 行 1 ケース。期待は `pass` か、
# 報告される種別を報告順に `+` で繋いだもの。
set -uo pipefail

lib_dir="$(cd "$(dirname "$0")" && pwd)"
detector="$lib_dir/import-rule-violations.py"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
failed=0

# 判定の土台になるツリー。親 `editor` の下に子 feature を 2 つ置き、公開口・テスト用の
# 公開口・中のモジュールを 1 つずつ持たせる。
build_tree() {
  local editor="$work/src/features/editor"
  mkdir -p "$work/src/app" \
    "$editor/features/sidebar/__stories__" \
    "$editor/features/sidebar/components/layers-panel" \
    "$editor/features/assets/__tests__"
  printf 'export const App = 1;\n' > "$work/src/app/App.ts"
  printf 'export const EditorScreen = 1;\n' > "$editor/index.ts"
  printf 'export const LayersPanel = 1;\n' > "$editor/features/sidebar/index.ts"
  printf 'export const SampleDocument = 1;\n' > "$editor/features/sidebar/__stories__/index.ts"
  printf 'export const LayersPanel = 1;\n' > "$editor/features/sidebar/components/layers-panel/index.ts"
  printf 'export const AssetsPanel = 1;\n' > "$editor/features/assets/index.ts"
  printf 'export const setupAssetGrab = 1;\n' > "$editor/features/assets/__tests__/index.ts"
}

# 検出器を 1 度走らせ、報告された種別を報告順に `+` で繋いで返す。
#
# **作業フォルダへ降りてから `src` を渡す。** 検出器は層の位置を `src/features` のような
# 相対パスで持っており（`FEATURES_ROOT` / `DOMAINS_ROOT`）、絶対パスを root に渡すと
# どのファイルも層の外と見なされて、すべてのケースが pass になる。
verdict() {
  local output status
  output="$(cd "$work" && python3 "$detector" src)" && status=0 || status=$?
  if [ "$status" -eq 0 ]; then
    echo "pass"
    return 0
  fi
  if [ "$status" -ne 1 ]; then
    echo "broken"
    return 0
  fi
  printf '%s' "$output" | sed -n 's/^\[\([a-z-]*\)\].*/\1/p' | paste -sd '+' -
}

report() {
  local expected="$1" decision="$2" label="$3"
  if [ "$decision" = "$expected" ]; then
    printf 'ok   %-38s %s\n' "$expected" "$label"
    return 0
  fi
  printf 'NG   expected=%s got=%s  %s\n' "$expected" "$decision" "$label"
  failed=1
}

build_tree
report "pass" "$(verdict)" "probe を置かないツリーそのものは違反 0 件"

while IFS='|' read -r expected label probe specifier; do
  [ -n "$specifier" ] || continue
  printf 'export { Probe } from "%s";\n' "$specifier" > "$work/src/$probe"
  report "$expected" "$(verdict)" "$label"
  rm -f "$work/src/$probe"
done <<'CASES'
pass|親 feature が子 feature の公開口を読む|features/editor/probe.ts|@/features/editor/features/sidebar
pass|親 feature が子 feature の __tests__ 公開口を読む|features/editor/probe.ts|@/features/editor/features/assets/__tests__
pass|親 feature が子 feature の __stories__ 公開口を読む|features/editor/probe.ts|@/features/editor/features/sidebar/__stories__
pass|feature が自分の中のモジュールを読む|features/editor/features/sidebar/probe.ts|@/features/editor/features/sidebar/components/layers-panel
pass|feature の外がトップレベル feature の公開口を読む|app/probe.ts|@/features/editor
pass|feature 層の直下に置いたファイルは feature と数えない|features/editor/features/probe.ts|@/features/editor/features/sidebar
feature-direction|兄弟 feature の公開口を読む|features/editor/features/sidebar/probe.ts|@/features/editor/features/assets
feature-direction|兄弟 feature の __tests__ 公開口を読む|features/editor/features/sidebar/probe.ts|@/features/editor/features/assets/__tests__
feature-direction|兄弟 feature の __stories__ 公開口を読む|features/editor/features/assets/probe.ts|@/features/editor/features/sidebar/__stories__
feature-direction|feature の外が入れ子の子 feature を名指しする|app/probe.ts|@/features/editor/features/sidebar
feature-direction|兄弟 feature の内部は、公開口ではなく向きで報告する|features/editor/features/assets/probe.ts|@/features/editor/features/sidebar/components/layers-panel
feature-direction|子 feature が親 feature を読む|features/editor/features/sidebar/probe.ts|@/features/editor
feature-public-api|親 feature が子 feature の内部を読む|features/editor/probe.ts|@/features/editor/features/sidebar/components/layers-panel
CASES

# 親が子を読んでいるところへ子から親への辺が増えると、向きの違反に feature 単位の閉路が
# 重なる。表は 1 ケース 1 ファイルなので、2 本の辺が要るこの形はここで見る。
printf 'export { Probe } from "@/features/editor/features/sidebar";\n' \
  > "$work/src/features/editor/probe.ts"
printf 'export { Probe } from "@/features/editor";\n' \
  > "$work/src/features/editor/features/sidebar/probe.ts"
report "feature-direction+feature-cycle" "$(verdict)" "親が子を読んでいるところへ子から親への辺が増える"
rm -f "$work/src/features/editor/probe.ts" \
  "$work/src/features/editor/features/sidebar/probe.ts"

exit "$failed"
