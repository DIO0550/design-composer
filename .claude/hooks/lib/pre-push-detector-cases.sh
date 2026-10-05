#!/usr/bin/env bash
#
# push 前の検査フックの共通部分(`pre-push-detector.sh`)の判定表。
# `deny_on_all_src_failure` は `pre-push-test-helper-duplication.sh` へ JSON を流し、
# `deny_on_violations` はスタブの検出器を渡して直接呼び、deny / pass が期待どおりかを
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
# 1 ケースは `check <期待> <ケース名> <コマンド> <重複を置くか> [python3]`。`CLAUDE_PROJECT_DIR` を
# 一時ディレクトリへ向けるので、検出器が見る `src` はそこに置いたものだけになる。
#
# `deny_on_violations` のケースは `check_violations <期待> <ケース名> <コマンド> <スタブ> [python3]`。
# 終了コードと出力の組を実物の検出器から決まった形で作れないので、スタブで作る。
# 期待は deny を理由の文面で 2 つに分ける(`violation` / `unchecked`)。deny か pass かだけを
# 見ると、0 以外ならすべて deny にする実装も表を通る。
#
# `[python3]` に `broken` を渡すと、起動すると 127 で落ちる python3 を PATH 先頭に置く。
# 道具が無い環境では止めないので pass になる(`command -v python3` で疎通を見る実装は、
# 起動して落ちたものを deny にする)。
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

# 起動すると 127 で落ちる python3 を置き、PATH の先頭に足す値を返す。`broken` 以外なら空。
#
# $1 `broken` なら置く
python3_path_prefix() {
  [ "$1" = "broken" ] || return 0
  mkdir -p "$work/broken-bin"
  printf '#!/usr/bin/env bash\nexit 127\n' >"$work/broken-bin/python3"
  chmod +x "$work/broken-bin/python3"
  printf '%s:' "$work/broken-bin"
}

# フックへ渡す JSON を書く。
#
# $1 フックへ渡すコマンド
push_payload() {
  jq -n --arg c "$1" '{tool_input: {command: $c}}'
}

# 1 ケースを判定して報告し、置いたものを消す(後ろのケースへ残さない)。
#
# $1 期待
# $2 ケース名
# $3 フックへ渡すコマンド
# $4 重複を置くなら `duplicate`、置かないなら `clean`
# $5 `broken` なら起動できない python3 を PATH 先頭に置く(省略可)
check() {
  local expected="$1" label="$2" command="$3" fixture="$4" python3_state="${5:-ok}"
  local output decision prefix
  rm -rf "$work/src"
  mkdir -p "$work/src"
  [ "$fixture" = "duplicate" ] && place_duplicate
  prefix="$(python3_path_prefix "$python3_state")"
  output="$(push_payload "$command" | CLAUDE_PROJECT_DIR="$work" PATH="${prefix}${PATH}" bash "$hook")"
  decision="pass"
  if printf '%s' "$output" | jq -e '.hookSpecificOutput.permissionDecision == "deny"' >/dev/null 2>&1; then
    decision="deny"
  fi
  rm -rf "$work/broken-bin"
  report "$expected" "$decision" "$label"
}

# `deny_on_violations` のスタブの検出器を置く。名前ごとに終了コードと出力の組が違う。
place_stub_detectors() {
  mkdir -p "$work/stubs"
  printf 'import sys\nprint("[kind] src/a.ts: 違反")\nsys.exit(1)\n' >"$work/stubs/reports.py"
  printf 'print("違反は 0 件")\n' >"$work/stubs/clean.py"
  printf 'import sys\nprint("[kind] src/a.ts: 違反")\nprint("x" * 200000)\nsys.exit(1)\n' >"$work/stubs/large-report.py"
  printf 'raise RuntimeError("判定表: 検出器が途中で落ちる")\n' >"$work/stubs/crash.py"
  printf 'import sys\nprint("違反は 0 件")\nsys.exit(1)\n' >"$work/stubs/summary-exit1.py"
  printf 'import sys\nprint("使い方: 走査するルートを渡す")\nsys.exit(2)\n' >"$work/stubs/usage.py"
  printf 'import sys\nprint("[kind] src/a.ts: 違反")\nsys.exit(2)\n' >"$work/stubs/reports-exit2.py"
}

# `deny_on_violations` の 1 ケースを判定して報告する。
#
# $1 期待(`violation` / `unchecked` / `pass`)
# $2 ケース名
# $3 フックへ渡すコマンド
# $4 スタブの検出器の名前(`place_stub_detectors` が置いたもの)
# $5 `broken` なら起動できない python3 を PATH 先頭に置く(省略可)
check_violations() {
  local expected="$1" label="$2" command="$3" stub="$4" python3_state="${5:-ok}"
  local output reason decision prefix
  prefix="$(python3_path_prefix "$python3_state")"
  output="$(push_payload "$command" | CLAUDE_PROJECT_DIR="$work" PATH="${prefix}${PATH}" \
    bash -c 'set -euo pipefail; source "$1"; deny_on_violations "$2" "判定表" "直してください"' _ \
    "$lib_dir/pre-push-detector.sh" "$work/stubs/$stub.py" 2>/dev/null)"
  reason="$(printf '%s' "$output" | jq -r '.hookSpecificOutput.permissionDecisionReason // empty' 2>/dev/null)"
  case "$reason" in
    "") decision="pass" ;;
    *違反が見つかった*) decision="violation" ;;
    *検査できませんでした*) decision="unchecked" ;;
    *) decision="deny-unknown" ;;
  esac
  rm -rf "$work/broken-bin"
  report "$expected" "$decision" "$label"
}

check deny "重複があるときの git push を止める" "git push -u origin HEAD" duplicate
check deny "連ねたコマンドの途中にある git push も止める" "cd sub && git push" duplicate
check pass "重複が無ければ git push を止めない" "git push" clean
check pass "git push 以外のコマンドは、重複があっても止めない" "git status" duplicate
check pass "起動できない python3 しか無ければ、重複があっても git push を止めない" "git push" duplicate broken

place_stub_detectors
check_violations violation "報告の行を出して exit 1 で終わる検出器なら、違反として git push を止める" "git push" reports
check_violations violation "報告の行のあとに大きな出力を続けて exit 1 で終わる検出器でも、違反として git push を止める" "git push" large-report
check_violations pass "要約の行だけを出して exit 0 で終わる検出器なら、git push を止めない" "git push" clean
check_violations unchecked "報告を出さずに traceback で落ちる検出器なら、検査できなかったとして git push を止める" "git push" crash
check_violations unchecked "要約の行だけを出して exit 1 で終わる検出器なら、検査できなかったとして git push を止める" "git push" summary-exit1
check_violations unchecked "使い方を出して exit 2 で終わる検出器なら、検査できなかったとして git push を止める" "git push" usage
check_violations unchecked "報告の行を出して exit 2 で終わる検出器なら、検査できなかったとして git push を止める" "git push" reports-exit2
check_violations pass "git push 以外のコマンドは、検出器が落ちても止めない" "git status" crash
check_violations pass "起動できない python3 しか無ければ、git push を止めない" "git push" reports broken

if [ "$cases_failed" -ne 0 ]; then
  echo "判定表と食い違いがあります"
  exit 1
fi
echo "push 前の検査フックの共通部分の判定表: 期待どおり"
