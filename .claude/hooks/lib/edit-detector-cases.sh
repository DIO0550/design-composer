#!/usr/bin/env bash
#
# 編集時の検査フックの共通部分(`edit-detector.sh`)の判定表。それを使うフック 3 本
# (`block-lint-suppress.sh` / `check-doc-comments.sh` / `check-test-helper-duplication.sh`)へ
# 編集の JSON を流し、拒否 / 検査できていない / 違反の報告 / 素通り が期待どおりかを 1 コマンドで確かめる。
#
# 使い方: bash .claude/hooks/lib/edit-detector-cases.sh
# 出力が `ok` だけなら期待どおり。`NG` が 1 行でも出たら判定が変わっている。
#
# フックは一時ディレクトリへ写したものを走らせ、検出器はその写しの `lib/` に同じ名前で置く
# (スタブか実物)。環境変数で検出器を差し替える形にすると、本番のフックにもその差し替え口が残る。
#
# 1 ケースは `check <期待> <フック> <検出器の種類> <入力> <python3> <ケース名>`。期待の綴りは `verdict` が返すもの。
#
# `<python3>` は `ok` か `broken`。`broken` は起動できない python3 を PATH 先頭に置く。起動できない
# python3 は python3 が無い環境と同じに扱うので pass になり、python3 が起動してから検出器が落ちた
# ケース(unchecked)とは分かれる(スタブと起動できない python3 の作り方は `cases-fixtures.sh`)。
#
# JSON の組み立てと取り出しに jq、検出器に python3 を使う。python3 が無いと pass 以外のケースが、jq が無いと
# すべてのケースが NG になるので、`harness/githooks/pre-push` は両方が揃う環境でだけ走らせる
# (カナリアの判定表と同じ)。
set -uo pipefail

lib_dir="$(cd "$(dirname "$0")" && pwd)"
repo_dir="$(cd "$lib_dir/../../.." && pwd)"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

source "$lib_dir/cases-report.sh"
source "$lib_dir/cases-fixtures.sh"

# 判定に要るものだけを、リポジトリと同じ相対位置で一時ディレクトリへ写す。
copy_hooks() {
  local path
  for path in .claude/hooks/block-lint-suppress.sh .claude/hooks/check-doc-comments.sh \
    .claude/hooks/check-test-helper-duplication.sh .claude/hooks/lib/edit-detector.sh \
    .github/scripts/lib/detector-precondition.sh .github/scripts/lib/detector-report.sh; do
    mkdir -p "$work/$(dirname "$path")"
    cp "$repo_dir/$path" "$work/$path"
  done
}

# 違反のある入力と無い入力に使うファイルを置く。
#
# doc は doc の無い export と doc のある export、テストヘルパーは深さの違う 2 つの `__tests__/` に
# 本体が同じヘルパーと、本体が 1 つしか無いヘルパー。
place_sources() {
  mkdir -p "$work/src"
  printf 'export function openedAt() {\n  return 1;\n}\n' >"$work/src/undocumented.ts"
  printf '/** 開いた時刻を返す。 */\nexport function openedAt() {\n  return 1;\n}\n' >"$work/src/documented.ts"
  place_duplicate_helpers "$work/src"
  printf 'function closedAt(path: string) {\n  return ClosedDocument.create({ path, closedBy: sampleUser() });\n}\n' \
    >"$work/src/a/__tests__/single.ts"
}

# フックごとの検出器の名前・イベント名・報告の見出し(`additionalContext` に載るもの)・
# 報告の行(検出器が違反のときに出す 1 行目)を、`<名前>=<値>` の行で書く。
#
# $1 フックのファイル名
hook_profile() {
  case "$1" in
    block-lint-suppress.sh)
      printf 'detector=lint-suppressions.py\nevent=PreToolUse\nheading=\nreport_line=1:// eslint-disable-next-line no-console\n' ;;
    check-doc-comments.sh)
      printf 'detector=missing-doc-comments.py\nevent=PostToolUse\nheading=doc が規約を満たしていません\nreport_line=doc が規約を満たしていません:\n' ;;
    check-test-helper-duplication.sh)
      printf 'detector=duplicate-test-helpers.py\nevent=PostToolUse\nheading=本体が同じテストヘルパーが\nreport_line=本体が同じテストヘルパーが、__tests__ に 2 つ以上あります。\n' ;;
  esac
}

# `hook_profile` から 1 項目を取り出す。
#
# $1 フックのファイル名
# $2 項目の名前
profile_value() {
  hook_profile "$1" | sed -n "s/^$2=//p"
}

# フックへ渡す JSON を書く。
#
# $1 フックのファイル名
# $2 違反のある入力なら `violation`、無い入力なら `clean`
edit_payload() {
  local hook="$1" input="$2"
  case "$hook:$input" in
    block-lint-suppress.sh:violation)
      jq -n --arg f "$work/src/a.ts" '{tool_name: "Write", tool_input: {file_path: $f, content: "// eslint-disable-next-line no-console\nconsole.log(1);\n"}}' ;;
    block-lint-suppress.sh:clean)
      jq -n --arg f "$work/src/a.ts" '{tool_name: "Write", tool_input: {file_path: $f, content: "console.log(1);\n"}}' ;;
    check-doc-comments.sh:violation) jq -n --arg f "$work/src/undocumented.ts" '{tool_input: {file_path: $f}}' ;;
    check-doc-comments.sh:clean) jq -n --arg f "$work/src/documented.ts" '{tool_input: {file_path: $f}}' ;;
    check-test-helper-duplication.sh:violation) jq -n --arg f "$work/src/a/__tests__/setup.ts" '{tool_input: {file_path: $f}}' ;;
    check-test-helper-duplication.sh:clean) jq -n --arg f "$work/src/a/__tests__/single.ts" '{tool_input: {file_path: $f}}' ;;
  esac
}

# 写しの `lib/` に検出器を置く。種類ごとに終了コードと出力の組が違う。
#
# $1 フックのファイル名
# $2 検出器の種類(`real` は実物。`reports-exit2` は報告の行を出して exit 2。他は `place_failing_detector` の落ち方)
place_detector() {
  local hook="$1" kind="$2"
  local name target report_line
  name="$(profile_value "$hook" detector)"
  target="$work/.claude/hooks/lib/$name"
  report_line="$(profile_value "$hook" report_line)"
  case "$kind" in
    real) cp "$repo_dir/.claude/hooks/lib/$name" "$target" ;;
    reports-exit2) printf 'import sys\nprint(%s)\nsys.exit(2)\n' "$(jq -n --arg l "$report_line" '$l')" >"$target" ;;
    *) place_failing_detector "$kind" "$target" ;;
  esac
}

# フックの出力と終了コードを、`exit=<n>` / `pass` / `deny` / `unchecked` / `feedback` / `unknown` に分ける。
#
# $1 フックの標準出力
# $2 フックの終了コード
# $3 期待するイベント名
# $4 報告の見出し(空なら `feedback` にはならない)
verdict() {
  local output="$1" status="$2" event="$3" heading="$4"
  if [ "$status" -ne 0 ]; then
    echo "exit=$status"
    return 0
  fi
  if [ -z "$output" ]; then
    echo "pass"
    return 0
  fi
  local is_deny='.hookSpecificOutput.permissionDecision == "deny" and .hookSpecificOutput.hookEventName == $event'
  local is_unchecked='(.hookSpecificOutput | has("permissionDecision") | not)
    and .hookSpecificOutput.hookEventName == $event
    and (.hookSpecificOutput.additionalContext // "" | contains("検査できていません"))'
  local is_feedback='$heading != "" and .hookSpecificOutput.hookEventName == $event
    and (.hookSpecificOutput.additionalContext // "" | contains($heading))
    and (.hookSpecificOutput.additionalContext // "" | contains("検査できていません") | not)'
  local kind
  for kind in deny unchecked feedback; do
    local expression="is_$kind"
    if jq -e --arg event "$event" --arg heading "$heading" "${!expression}" <<<"$output" >/dev/null 2>&1; then
      echo "$kind"
      return 0
    fi
  done
  echo "unknown"
}

# 1 ケースを判定して報告し、PATH に足したものを消す(後ろのケースへ残さない)。
#
# $1 期待
# $2 フックのファイル名
# $3 検出器の種類(`place_detector` が置くもの)
# $4 違反のある入力なら `violation`、無い入力なら `clean`
# $5 `broken` なら起動できない python3 を PATH 先頭に置く。置かないなら `ok`
# $6 ケース名
check() {
  local expected="$1" hook="$2" kind="$3" input="$4" python3_state="$5" label="$6"
  local output status=0 prefix decision
  place_detector "$hook" "$kind"
  prefix="$(python3_path_prefix "$python3_state" "$work")"
  output="$(edit_payload "$hook" "$input" | PATH="${prefix}${PATH}" bash "$work/.claude/hooks/$hook" 2>/dev/null)" || status=$?
  decision="$(verdict "$output" "$status" "$(profile_value "$hook" event)" "$(profile_value "$hook" heading)")"
  rm -rf "$work/broken-bin"
  report "$expected" "$decision" "$hook: $label"
}

copy_hooks
place_sources

for hook in block-lint-suppress.sh check-doc-comments.sh check-test-helper-duplication.sh; do
  found="feedback"
  [ "$hook" = "block-lint-suppress.sh" ] && found="deny"
  check unchecked "$hook" crash violation ok "報告を出さずに traceback で落ちる検出器なら、拒否せず検査できていないことを伝える"
  check unchecked "$hook" summary-exit1 violation ok "要約の行だけを出して exit 1 で終わる検出器なら、検査できていないことを伝える"
  check unchecked "$hook" usage violation ok "報告を出さずに exit 2 で終わる検出器なら、検査できていないことを伝える"
  check unchecked "$hook" reports-exit2 violation ok "報告の行を出して exit 2 で終わる検出器なら、違反とは読まず検査できていないことを伝える"
  check "$found" "$hook" real violation ok "実物の検出器で違反があれば、これまでどおり伝える"
  check pass "$hook" real clean ok "実物の検出器で違反が無ければ、何も出さない"
  check pass "$hook" real violation broken "起動できない python3 しか無ければ、違反があっても何も出さない"
done

if [ "$cases_failed" -ne 0 ]; then
  echo "判定表と食い違いがあります"
  exit 1
fi
echo "編集時の検査フックの共通部分の判定表: 期待どおり"
