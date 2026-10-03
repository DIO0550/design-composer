#!/usr/bin/env bash
#
# push 前の検査フックの共通部分(`pre-push-detector.sh` の `deny_on_all_src_failure`)の判定表。
# `pre-push-test-helper-duplication.sh` へ JSON を流し、deny / pass が期待どおりかを
# 1 コマンドで確かめる。
#
# 使い方: bash .claude/hooks/lib/pre-push-detector-cases.sh
# 出力が `ok` だけなら期待どおり。`NG` が 1 行でも出たら判定が変わっている。
#
# **表をファイルに置くのは、この関数が壊れても層 3 が黙って素通りするだけで、どの検出器の
# 判定表も落ちないから。** git hooks と CI は検出器を直接呼ぶので、`git push` の判定・
# 終了コードの向き・`--all src` の引数が崩れても緑のまま残る。同じ関数に乗っている
# `pre-push-doc-comments.sh` も同時に止まるが、1 本で関数の経路は通るのでフックは 1 本に絞る。
#
# 1 ケースは `check <期待> <ケース名> <コマンド> <重複を置くか>`。`CLAUDE_PROJECT_DIR` を
# 一時ディレクトリへ向けるので、検出器が見る `src` はそこに置いたものだけになる。
#
# JSON の取り出しに jq、検出器に python3 を使う。どちらかが無いと deny 側が NG になるので、
# `harness/githooks/pre-push` は両方が揃う環境でだけ走らせる(カナリアの判定表と同じ)。
set -uo pipefail

lib_dir="$(cd "$(dirname "$0")" && pwd)"
hook="$lib_dir/../pre-push-test-helper-duplication.sh"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

source "$lib_dir/cases-report.sh"

# 深さの違う 2 つの `__tests__/` に、本体が同じヘルパーを置く
place_duplicate() {
  local folder
  for folder in "$work/src/a/__tests__" "$work/src/b/c/__tests__"; do
    mkdir -p "$folder"
    printf 'function openedAt(path: string) {\n  return OpenedDocument.create({ path, document: sampleDocument() });\n}\n' \
      >"$folder/setup.ts"
  done
}

# 1 ケースを判定して報告し、置いたものを消す(後ろのケースへ残さない)。
#
# $1 期待
# $2 ケース名
# $3 フックへ渡すコマンド
# $4 重複を置くなら `duplicate`、置かないなら `clean`
check() {
  local expected="$1" label="$2" command="$3" fixture="$4" payload output decision
  rm -rf "$work/src"
  mkdir -p "$work/src"
  [ "$fixture" = "duplicate" ] && place_duplicate
  payload="$(jq -n --arg c "$command" '{tool_input: {command: $c}}')"
  output="$(printf '%s' "$payload" | CLAUDE_PROJECT_DIR="$work" bash "$hook")"
  decision="pass"
  if printf '%s' "$output" | jq -e '.hookSpecificOutput.permissionDecision == "deny"' >/dev/null 2>&1; then
    decision="deny"
  fi
  report "$expected" "$decision" "$label"
}

check deny "重複があるときの git push を止める" "git push -u origin HEAD" duplicate
check deny "連ねたコマンドの途中にある git push も止める" "cd sub && git push" duplicate
check pass "重複が無ければ git push を止めない" "git push" clean
check pass "git push 以外のコマンドは、重複があっても止めない" "git status" duplicate

if [ "$cases_failed" -ne 0 ]; then
  echo "判定表と食い違いがあります"
  exit 1
fi
echo "push 前の検査フックの共通部分の判定表: 期待どおり"
