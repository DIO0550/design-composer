#!/usr/bin/env bash
#
# 検出器の種別の照合（`report_documented_kinds` / `report_covered_kinds`）と `report` 自身（NG なら
# `cases_failed` を立て、ok なら立てない）と、判定の読み取り（`decide` / `decide_by_permission` / `normalize_miss`）の
# 判定表。照合の表は一時ディレクトリへ小さな検出器を置いて照合を呼び、`report` の表は検出器を置かずに
# `report` だけを呼ぶ。この 2 つは、NG を出して `cases_failed` を立てるか ok だけを出すかを確かめる。
# 判定の読み取りの表は検出器を走らせず、表に書いた出力と終了コードを `decide` / `decide_by_permission` へ
# 渡して返る判定を確かめる。最後の文の照合の表は一時ディレクトリに判定表の木を置いて
# `report_tables_exit_with_cases_failed` を呼び、最後に本物のリポジトリのルートでも呼んで、
# `cases-report.sh` を source するどの判定表も最後の文が `exit "$cases_failed"` かを確かめる。
# 本物のルートで集めた判定表に、相手役の `harness/githooks/lib/check-tally-cases.sh` が入っているかも確かめる。
#
# 使い方: bash .claude/hooks/lib/cases-report-cases.sh
# 出力が `ok` だけなら期待どおり。`NG` が 1 行でも出たら判定が変わっている。
#
# **表をファイルに置くのは、実物の検出器を照合する判定表が、種別がそろっている限り NG の枝に届かない
# から。** 並びを見なくなる・0 件どうしを一致と読む・網羅を見なくなる、のどれに壊しても、その判定表は
# 緑のまま残る。`decide` の broken の枝も同じで、実物の検出器を呼ぶ判定表は検出器が退行しない限りそこへ
# 届かない。
#
# 照合と `report` は 1 回の呼び出しごとに `cases_failed` を立てるので、ケースごとにサブシェルで呼び、そこでの
# `cases_failed` と出力の行を組にして判定を決める。`decide` / `normalize_miss` は判定を返すだけで
# `cases_failed` に触れないので、サブシェルを挟まず返った判定をそのまま `report` へ渡す。
#
# 表は `期待|ケース名|照合|実装の種別|docstring の種別|表の期待に出た種別` の 1 行 1 ケース。種別は
# 空白区切りで、`-` は 1 つも持たない。照合は `documented`（`report_documented_kinds`）か
# `covered`（`report_covered_kinds`）。`report` 自身の表は `期待|ケース名|report に渡す期待|report に渡す判定`
# の 1 行 1 ケース。最後の文の照合の表は `期待|ケース名|置くもの` の 1 行 1 ケースで、置くものは
# `パス=読み方:終わり方` の空白区切り（`-` なら何も置かない。読み方と終わり方は `table_sourcing` /
# `table_ending` の case）。照合の表と `report` の表と最後の文の照合の表の期待は 2 つ（NG / ok）。
#
# | 期待 | 意味 |
# | --- | --- |
# | `NG` | NG の行を出し、`cases_failed` を立ててほしい |
# | `ok` | ok の行だけを出し、`cases_failed` を立ててはいけない |
#
# 判定の読み取りの表は 3 つ。`decide` の表と `decide_by_permission` の表は `期待|ケース名|終了コード|出力`、
# `normalize_miss` と組み合わせた表は `期待|ケース名|表に書く期待|終了コード|出力` の 1 行 1 ケース。出力は
# 検出器（`decide_by_permission` の表では PreToolUse フック）の標準出力の 1 行で、`-` なら何も出さない。
# `decide` の見出しの正規表現は `decide_row` の中で固定する。期待は返ってほしい判定の綴り
# そのもの（`pass` / `deny` / `broken` / `miss`）で、`report` へ直に渡す。
set -uo pipefail

lib_dir="$(cd "$(dirname "$0")" && pwd)"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

source "$lib_dir/cases-report.sh"

# 空白区切りの種別を 1 行 1 つにする。`-` は空にする。
#
# $1 表に書いた種別
kinds_lines() {
  [ "$1" = "-" ] && return 0
  printf '%s\n' "$1" | tr ' ' '\n'
}

# 種別を行頭の `KINDS = (...)` に、docstring の一覧を「報告する違反は次のとおり」の箇条書きに持つ
# 検出器を置く。どちらも `-` なら、その形を書かない。
#
# $1 実装の種別
# $2 docstring の種別
# $3 検出器を書くパス
place_detector() {
  local reported="$1" documented="$2" target="$3" kind
  {
    printf '"""照合の判定表が置く検出器。\n'
    if [ "$documented" != "-" ]; then
      printf '\n報告する違反は次のとおり。\n\n'
      while IFS= read -r kind; do
        printf -- '- `%s` — 判定表の種別\n' "$kind"
      done <<<"$(kinds_lines "$documented")"
    fi
    printf '"""\n'
    if [ "$reported" != "-" ]; then
      printf 'KINDS = (%s)\n' "$(kinds_lines "$reported" | sed 's/.*/"&"/' | paste -sd ',' - | sed 's/,/, /g')"
    fi
  } >"$target"
}

# 関数をサブシェルで 1 回呼び、出力と `cases_failed` から NG / ok / broken を決める。
# NG の行と `cases_failed` の片方だけなら broken（報告と終了コードが食い違う）。
#
# $@ 呼び出す関数と引数
verdict_of() {
  local output failed
  output="$(
    cases_failed=0
    "$@"
    echo "failed=$cases_failed"
  )"
  failed="$(printf '%s\n' "$output" | sed -n 's/^failed=//p')"
  output="$(printf '%s\n' "$output" | grep -v '^failed=')"
  if [ "$failed" = "1" ] && printf '%s\n' "$output" | grep -q '^NG '; then
    echo "NG"
  elif [ "$failed" = "0" ] && all_in_category "$output" '^ok '; then
    echo "ok"
  else
    echo "broken"
  fi
}

# 照合を 1 回呼んだときの NG / ok / broken。
#
# $1 照合（`documented` / `covered`）
# $2 検出器のパス
# $3 表の期待に出た種別
verdict() {
  local check="$1" detector="$2" covered="$3"
  case "$check" in
    documented) verdict_of report_documented_kinds "$detector" ;;
    covered) verdict_of report_covered_kinds "$detector" "$(kinds_lines "$covered")" ;;
  esac
}

while IFS='|' read -r expected label check reported documented covered; do
  [ -n "$check" ] || continue
  detector="$work/detector.py"
  place_detector "$reported" "$documented" "$detector"
  report "$expected" "$(verdict "$check" "$detector" "$covered")" "$label"
done <<'CASES'
ok|実装と docstring の種別が並びまで一致する|documented|alpha beta|alpha beta|-
NG|実装と docstring の種別が並びだけ違う|documented|alpha beta|beta alpha|-
NG|docstring に無い種別を実装が持つ|documented|alpha beta|alpha|-
NG|実装と docstring のどちらからも種別を取り出せない|documented|-|-|-
ok|実装の種別をすべて表の期待が含む|covered|alpha beta|alpha beta|alpha beta
NG|表の期待に無い種別を実装が持つ|covered|alpha beta|alpha beta|alpha
CASES

while IFS='|' read -r expected label report_expected report_decision; do
  [ -n "$label" ] || continue
  decision="$(verdict_of report "$report_expected" "$report_decision" "report のケース")"
  report "$expected" "$decision" "$label"
  # 食い違いを外側の `report` に任せず、ここで直に `cases_failed` を立てる。外側の `report` も同じ壊れ方を
  # していると、NG の行が出ても `cases_failed` が立たず exit 0 で通る。
  # 出力の NG 行を数え直す形は採らない（出力の形に依存する）。
  [ "$decision" = "$expected" ] || cases_failed=1
done <<'REPORT_CASES'
ok|期待と判定が一致すると ok の行だけを出し、cases_failed を立てない|deny|deny
NG|期待と判定が食い違うと NG の行を出し、cases_failed を立てる|deny|pass
REPORT_CASES

# 判定の読み取りの表に書いた出力を、検出器の標準出力にする。
#
# $1 表に書いた出力。`-` なら何も出さない
row_output() {
  [ "$1" = "-" ] && return 0
  printf '%s\n' "$1"
}

# 表に書いた終了コードと出力から、`decide` の判定を返す。見出しの正規表現は `^\[alpha\]` に固定する。
#
# $1 表に書いた終了コード
# $2 表に書いた出力
decide_row() {
  decide "$(row_output "$2")" "$1" '^\[alpha\]'
}

while IFS='|' read -r expected label status output; do
  [ -n "$label" ] || continue
  report "$expected" "$(decide_row "$status" "$output")" "$label"
done <<'DECIDE_CASES'
pass|exit 0 で何も出さなければ pass|0|-
pass|exit 0 で見出しに当たらない行だけを出すなら pass|0|違反 0 件
deny|exit 1 で見出しを出せば deny|1|[alpha] 1 件
broken|exit 1 なのに何も出さなければ broken|1|-
broken|exit 1 なのに見出しに当たらない行だけを出すなら broken|1|違反 0 件
broken|見出しを出したまま exit 0 なら broken|0|[alpha] 1 件
broken|exit 2 で何も出さなければ broken|2|-
broken|exit 2 で見出しを出しても broken|2|[alpha] 1 件
DECIDE_CASES

while IFS='|' read -r expected label status output; do
  [ -n "$label" ] || continue
  report "$expected" "$(decide_by_permission "$(row_output "$output")" "$status")" "$label"
done <<'PERMISSION_CASES'
deny|PreToolUse フックが exit 0 で deny の JSON を返せば deny|0|{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny"}}
pass|PreToolUse フックが exit 0 で何も出さなければ pass|0|-
pass|PreToolUse フックが exit 0 で additionalContext だけを返すなら pass|0|{"hookSpecificOutput":{"hookEventName":"PreToolUse","additionalContext":"x"}}
broken|PreToolUse フックが deny の JSON を返しても exit 0 以外なら broken|1|{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny"}}
PERMISSION_CASES

while IFS='|' read -r expected label table_expected status output; do
  [ -n "$label" ] || continue
  decision="$(decide_row "$status" "$output")"
  report "$expected" "$(normalize_miss "$table_expected" "$decision")" "$label"
done <<'MISS_CASES'
miss|取りこぼしを期待した表で exit 0 かつ何も出さなければ miss|miss|0|-
pass|pass を期待した表で exit 0 かつ何も出さなければ miss と読まず pass|pass|0|-
deny|取りこぼしを期待した表でも exit 1 で見出しを出せば deny|miss|1|[alpha] 1 件
broken|取りこぼしを期待した表でも exit 2 なら miss と読まず broken|miss|2|-
broken|取りこぼしを期待した表でも見出しを出したまま exit 0 なら miss と読まず broken|miss|0|[alpha] 1 件
MISS_CASES

# `cases-report.sh` を source している `*.sh` を、`<root>` の下から 1 行 1 本で出す。`node_modules/` と
# `.git/` の下は見ない。
#
# $1 探すルート
tables_sourcing_cases_report() {
  grep -rlE --include='*.sh' --exclude-dir=node_modules --exclude-dir=.git \
    '^[[:space:]]*(source|\.)[[:space:]].*cases-report\.sh' "$1" | sort
}

# `<root>` の下で `cases-report.sh` を source している判定表ごとに、最後の文が `exit "$cases_failed"` かを
# 1 行で出す。1 本も見つからなければ、集め方が壊れているので NG にする。
#
# $1 探すルート
report_tables_exit_with_cases_failed() {
  local root="$1" tables table
  tables="$(tables_sourcing_cases_report "$root")"
  if [ -z "$tables" ]; then
    printf 'NG   %s の下に cases-report.sh を source する判定表が見つからない\n' "$root"
    cases_failed=1
    return 0
  fi
  while IFS= read -r table; do
    report_exits_with_cases_failed "$table" "${table#"$root"/}"
  done <<<"$tables"
}

# 最後の文の照合の表に書いた終わり方を、判定表の末尾の行にする。表に知らない終わり方なら 1 を返す。
#
# $1 終わり方
table_ending() {
  case "$1" in
    exit) printf '%s\n' 'exit "$cases_failed"' ;;
    exit-then-comments) printf '%s\n' 'exit "$cases_failed"' '' '# 後ろはコメントだけ' '  # 字下げしたコメント' ;;
    exit-0) printf '%s\n' 'exit 0' ;;
    no-exit) ;;
    echo-after-exit) printf '%s\n' 'exit "$cases_failed"' 'echo "後ろの文"' ;;
    commented-exit) printf '%s\n' '# exit "$cases_failed"' ;;
    if-form)
      printf '%s\n' 'if [ "$cases_failed" -ne 0 ]; then' '  echo "判定表と食い違いがあります"' '  exit 1' 'fi' \
        'echo "期待どおり"'
      ;;
    unquoted) printf '%s\n' 'exit $cases_failed' ;;
    braced) printf '%s\n' 'exit "${cases_failed}"' ;;
    indented-exit) printf '%s\n' '  exit "$cases_failed"' ;;
    trailing-comment) printf '%s\n' 'exit "$cases_failed"  # 終わり' ;;
    *) return 1 ;;
  esac
}

# 最後の文の照合の表に書いた読み方を、`cases-report.sh` を読む行にする。`mention` はコメントで触れるだけ。
# 表に知らない読み方なら 1 を返す。
#
# $1 読み方
table_sourcing() {
  case "$1" in
    source) printf '%s\n' 'source "$lib_dir/cases-report.sh"' ;;
    dot) printf '%s\n' '. "$lib_dir/cases-report.sh"' ;;
    indented-source) printf '%s\n' '  source "$lib_dir/cases-report.sh"' ;;
    mention) printf '%s\n' '# source "$lib_dir/cases-report.sh" はしない' ;;
    *) return 1 ;;
  esac
}

# 表に書いた置くもの（`パス=読み方:終わり方` の空白区切り。`-` なら何も置かない）を `<root>` の下へ置く。
# 読み方か終わり方に表の知らない綴りがあれば 1 を返す。
#
# $1 表に書いた置くもの
# $2 置くルート
place_tables() {
  local placements="$1" root="$2" placement path how
  mkdir -p "$root"
  [ "$placements" = "-" ] && return 0
  for placement in $placements; do
    path="$root/${placement%%=*}"
    how="${placement#*=}"
    mkdir -p "$(dirname "$path")"
    {
      printf '%s\n' '#!/usr/bin/env bash'
      table_sourcing "${how%%:*}" || return 1
      printf '%s\n' 'report ok ok "ケース"'
      table_ending "${how#*:}" || return 1
    } >"$path"
  done
}

tree_count=0
while IFS='|' read -r expected label placements; do
  [ -n "$label" ] || continue
  tree_count=$((tree_count + 1))
  root="$work/tree-$tree_count"
  # 綴りを打ち間違えたケースは、期待が ok でも NG でも食い違いとして落とす（置かれなかった木を照合して
  # 期待どおりの判定が出ると、打ち間違いが緑のまま残る）。
  decision="表に知らない綴りがある"
  if place_tables "$placements" "$root"; then
    decision="$(verdict_of report_tables_exit_with_cases_failed "$root")"
  fi
  report "$expected" "$decision" "$label"
done <<'EXIT_CASES'
ok|最後の文が exit "$cases_failed" なら ok|a-cases.sh=source:exit
ok|exit "$cases_failed" の後ろがコメントと空行だけなら ok|a-cases.sh=source:exit-then-comments
NG|最後の文が exit 0 なら NG|a-cases.sh=source:exit-0
NG|exit を消して最後の文が report になっていれば NG|a-cases.sh=source:no-exit
NG|exit "$cases_failed" の後ろに echo があれば NG|a-cases.sh=source:echo-after-exit
NG|exit "$cases_failed" をコメントにしていれば NG|a-cases.sh=source:commented-exit
NG|cases_failed を if で見て echo で終わる形なら NG|a-cases.sh=source:if-form
NG|引用符の無い exit $cases_failed なら NG|a-cases.sh=source:unquoted
NG|exit "${cases_failed}" なら NG|a-cases.sh=source:braced
NG|字下げした exit "$cases_failed" なら NG|a-cases.sh=source:indented-exit
NG|行末にコメントのある exit "$cases_failed" なら NG|a-cases.sh=source:trailing-comment
NG|. で読む判定表が exit 0 なら NG|a-cases.sh=source:exit b-cases.sh=dot:exit-0
NG|字下げした source で読む判定表が exit 0 なら NG|a-cases.sh=source:exit b-cases.sh=indented-source:exit-0
ok|コメントで cases-report.sh に触れるだけのファイルは見ない|a-cases.sh=source:exit b.sh=mention:no-exit
ok|node_modules の下の判定表は見ない|a-cases.sh=source:exit node_modules/pkg/b-cases.sh=source:exit-0
ok|.git の下の判定表は見ない|a-cases.sh=source:exit .git/hooks/b-cases.sh=source:exit-0
NG|cases-report.sh を source する判定表が 1 本も無ければ NG|-
NG|正しい判定表と exit 0 の判定表が並んでいれば NG|a-cases.sh=source:exit lib/b-cases.sh=source:exit-0
NG|exit 0 の判定表が正しい判定表より先に並んでいても NG|a-cases.sh=source:exit-0 lib/b-cases.sh=source:exit
EXIT_CASES

repo_root="$(cd "$lib_dir/../../.." && pwd)"
report_tables_exit_with_cases_failed "$repo_root"

# `repo_root` がずれると集める範囲が縮み、相手役の判定表が照合から外れても緑のまま残る。2 本が互いに
# 相手を照合する形なので、相手が集めた範囲に入っていることも見る。
partner_table="harness/githooks/lib/check-tally-cases.sh"
partner_decision="範囲に無い"
tables_sourcing_cases_report "$repo_root" | grep -qxF -- "$repo_root/$partner_table" && partner_decision="範囲にある"
report "範囲にある" "$partner_decision" "本物のルートで集めた判定表に $partner_table が入っている"

exit "$cases_failed"
