#!/usr/bin/env bash
#
# `upsert-sticky-comment.sh` の判定表。`gh` を差し替え、コメントの一覧(ページごとの JSON)と
# 失敗のさせ方を置いて走らせ、終了コードと `gh` の呼ばれ方・書き込んだ本文が期待どおりかを
# 1 コマンドで確かめる。
#
# 使い方: bash .github/scripts/upsert-sticky-comment-cases.sh
# 出力が `ok` だけなら期待どおり。`NG` が 1 行でも出たら振る舞いが変わっている。
#
# 差し替えた `gh` は、一覧(GET)なら置いたページの JSON に `--jq` を当てて返し(`--paginate` が
# 無ければ 1 ページ目だけ)、書き込み(POST / PATCH)なら `body=@<file>` の先を読んで残す。
# `FAIL_GET` / `FAIL_POST` / `FAIL_PATCH` に n を渡すと、その種類の最初の n 回を失敗させる。
# `POST_LANDS=1` なら、失敗を返した POST の本文を 1 ページ目に足す(実は通っていた形)。
#
# 待ち時間は `STICKY_COMMENT_RETRY_WAIT=0` で消す。投げ先の環境変数は毎ケース明示し、
# 本物の `gh` へ届かないよう PATH の先頭に差し替えを置く。
set -uo pipefail

scripts_dir="$(cd "$(dirname "$0")" && pwd)"
repo_root="$(cd "$scripts_dir/../.." && pwd)"
script="$scripts_dir/upsert-sticky-comment.sh"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

source "$repo_root/.claude/hooks/lib/cases-report.sh"

marker='<!-- sticky-comment: cases -->'

mkdir -p "$work/bin"
cat >"$work/bin/gh" <<'STUB'
#!/usr/bin/env bash
kind=GET filter="" body="" target="" paginate=false prev=""
for arg in "$@"; do
  case "$arg" in
    POST | PATCH) kind="$arg" ;;
    --paginate) paginate=true ;;
    body=@*) body="$(cat "${arg#body=@}")" ;;
    repos/*/issues/comments/*) target=" ${arg##*/}" ;;
  esac
  [ "$prev" = --jq ] && filter="$arg"
  prev="$arg"
done
done_count="$(grep -c "^$kind" "$STUB_DIR/calls" 2>/dev/null)"
fails_var="FAIL_$kind"
if [ "$((${done_count:-0} + 1))" -le "${!fails_var:-0}" ]; then
  echo "$kind-FAILED" >>"$STUB_DIR/calls"
  failed_post_landed=false
  [ "$kind" = POST ] && [ -n "${POST_LANDS:-}" ] && failed_post_landed=true
  if [ "$failed_post_landed" = true ]; then
    jq --arg b "$body" '. + [{id: 900, body: $b}]' "$STUB_DIR/pages/1.json" >"$STUB_DIR/landed"
    mv "$STUB_DIR/landed" "$STUB_DIR/pages/1.json"
  fi
  echo "gh: HTTP 502" >&2
  exit 1
fi
echo "$kind$target" >>"$STUB_DIR/calls"
if [ "$kind" != GET ]; then
  printf '%s' "$body" >"$STUB_DIR/body"
  exit 0
fi
pages=("$STUB_DIR"/pages/*.json)
[ "$paginate" = true ] || pages=("$STUB_DIR/pages/1.json")
for page in "${pages[@]}"; do jq -r "$filter" "$page" || exit 1; done
STUB
chmod +x "$work/bin/gh"

# ケースの置き場を作り、ページの JSON を置く。置き場のパスを標準出力へ返す。
# $@ 1 ページ目から順に、コメントの配列の JSON
new_case() {
  local dir page=0
  dir="$(mktemp -d "$work/case-XXXXXX")"
  mkdir -p "$dir/pages"
  : >"$dir/calls"
  for json in "$@"; do
    page=$((page + 1))
    printf '%s' "$json" >"$dir/pages/$page.json"
  done
  printf '%s' "$dir"
}

# 置き場 $1 で共通スクリプトを走らせ、`exit=<終了コード> calls=<呼ばれ方>` を返す。
# $2 以降はスクリプトへの引数。失敗のさせ方は呼び出し側が環境変数で渡す。
# 投げ先の環境変数を欠いた形は、$UNSET に欠く変数の名前を渡して作る。PR 番号は $CASE_PR_NUMBER で
# 差し替える(既定 1)。標準エラーは置き場の `stderr` に残す
run_upsert() {
  local dir="$1" status unset_flag=()
  shift
  [ -n "${UNSET:-}" ] && unset_flag=(-u "$UNSET")
  # 空の配列を `"${a[@]}"` で展開すると、bash 4.4 未満では `set -u` が未定義として落ちる
  STUB_DIR="$dir" PATH="$work/bin:$PATH" STICKY_COMMENT_RETRY_WAIT=0 \
    GITHUB_REPOSITORY=owner/repo PR_NUMBER="${CASE_PR_NUMBER:-1}" \
    env ${unset_flag[@]+"${unset_flag[@]}"} bash "$script" "$@" >/dev/null 2>"$dir/stderr"
  status=$?
  printf 'exit=%s calls=%s' "$status" "$(tr '\n' ' ' <"$dir/calls" | sed 's/ $//')"
}

# 置き場 $1 に最後に書き込んだ本文が、marker の行に続けて渡した本文を並べたものかを報告する。
# $2 ケース名
report_written_body() {
  local outcome=differs written_body_matches=false
  [ -f "$1/body" ] && [ "$(cat "$1/body")" = "$expected_body" ] && written_body_matches=true
  [ "$written_body_matches" = true ] && outcome=matches
  report matches "$outcome" "$2"
}

printf '本文の 1 行目\n本文の 2 行目' >"$work/body.md"
post=(--marker "$marker" --body-file "$work/body.md" --if-missing post)
skip=(--marker "$marker" --body-file "$work/body.md" --if-missing skip)
expected_body="$(printf '%s\n本文の 1 行目\n本文の 2 行目' "$marker")"

no_comments='[]'
unrelated='[{"id": 11, "body": "ほかの人のコメント"}]'
sticky_101='[{"id": 11, "body": "ほかの人のコメント"}, {"id": 101, "body": "<!-- sticky-comment: cases -->\n前の本文"}]'

# --- 貼る / 差し替える / 貼らない ---

dir="$(new_case "$unrelated")"
report 'exit=0 calls=GET POST' "$(run_upsert "$dir" "${post[@]}")" \
  'marker で始まるコメントが無く、無いときは貼る指定なら、新しく貼る'

dir="$(new_case "$unrelated")"
run_upsert "$dir" "${post[@]}" >/dev/null
report_written_body "$dir" \
  '貼る本文は marker の行で始まり、続けて渡した本文が入る'

dir="$(new_case "$sticky_101")"
report 'exit=0 calls=GET PATCH 101' "$(run_upsert "$dir" "${post[@]}")" \
  'marker で始まるコメントがあれば、そのコメントの ID へ差し替える'

dir="$(new_case "$sticky_101")"
run_upsert "$dir" "${post[@]}" >/dev/null
report_written_body "$dir" \
  '差し替える本文も marker の行で始まり、続けて渡した本文が入る'

dir="$(new_case "$unrelated")"
report 'exit=0 calls=GET' "$(run_upsert "$dir" "${skip[@]}")" \
  '無いときは貼らない指定で、コメントも無ければ何も貼らない'

dir="$(new_case "$sticky_101")"
report 'exit=0 calls=GET PATCH 101' "$(run_upsert "$dir" "${skip[@]}")" \
  '無いときは貼らない指定でも、コメントがあれば差し替える'

# --- 探し方 ---

dir="$(new_case "$unrelated" '[{"id": 202, "body": "<!-- sticky-comment: cases -->\n2 ページ目"}]')"
report 'exit=0 calls=GET PATCH 202' "$(run_upsert "$dir" "${skip[@]}")" \
  '2 ページ目にしか無いコメントも見つけて差し替える'

dir="$(new_case '[{"id": 12, "body": "引用: <!-- sticky-comment: cases --> を探している"}]')"
report 'exit=0 calls=GET POST' "$(run_upsert "$dir" "${post[@]}")" \
  'marker を本文の途中に含むだけのコメントは sticky と見なさず、新しく貼る'

# 1 ページ目に 2 件・2 ページ目に 1 件置き、ページの中の先頭とページをまたいだ先頭の両方を踏む
dir="$(new_case \
  '[{"id": 101, "body": "<!-- sticky-comment: cases -->\n古い"}, {"id": 102, "body": "<!-- sticky-comment: cases -->\n新しい"}]' \
  '[{"id": 203, "body": "<!-- sticky-comment: cases -->\n2 ページ目"}]')"
report 'exit=0 calls=GET PATCH 101' "$(run_upsert "$dir" "${post[@]}")" \
  'marker で始まるコメントが 2 件以上あれば、先に並ぶほうを差し替える'

# --- やり直し ---

dir="$(new_case "$no_comments")"
report 'exit=0 calls=GET-FAILED GET POST' "$(FAIL_GET=1 run_upsert "$dir" "${post[@]}")" \
  '一覧の取得が一時的に失敗しても、やり直して貼る'

dir="$(new_case "$no_comments")"
report 'exit=1 calls=GET-FAILED GET-FAILED GET-FAILED' "$(FAIL_GET=9 run_upsert "$dir" "${post[@]}")" \
  '一覧を 3 回とも取れなければ、貼らずに失敗で終わる'

dir="$(new_case "$no_comments")"
report 'exit=0 calls=GET POST-FAILED GET PATCH 900' "$(FAIL_POST=1 POST_LANDS=1 run_upsert "$dir" "${post[@]}")" \
  '投稿が失敗を返しても実は載っていたなら、取り直した一覧から見つけて差し替え、二重に貼らない'

dir="$(new_case "$no_comments")"
FAIL_POST=1 run_upsert "$dir" --marker "$marker" --body-file <(printf '本文の 1 行目\n本文の 2 行目') \
  --if-missing post >/dev/null
report_written_body "$dir" \
  '本文をパイプで渡しても、やり直した後の書き込みに本文が残る'

dir="$(new_case "$sticky_101")"
report 'exit=1 calls=GET PATCH-FAILED GET PATCH-FAILED GET PATCH-FAILED' \
  "$(FAIL_PATCH=9 run_upsert "$dir" "${post[@]}")" \
  '差し替えが 3 回とも失敗したら、失敗で終わる'

dir="$(new_case "$no_comments")"
report 'exit=1 calls=GET POST-FAILED GET POST-FAILED GET POST-FAILED' \
  "$(FAIL_POST=9 run_upsert "$dir" "${post[@]}")" \
  '投稿が 3 回とも失敗したら、失敗で終わる'

dir="$(new_case '[{"id": "gh: HTTP 502", "body": "<!-- sticky-comment: cases -->\n壊れた応答"}]')"
report 'exit=1 calls=GET' "$(run_upsert "$dir" "${post[@]}")" \
  '一覧が数値でない ID を返したら、書き込まず・投稿にも落ちず・やり直しもせず失敗で終わる'

# --- 使い方の誤り(`gh` を呼ぶ前に exit 2) ---

dir="$(new_case "$no_comments")"
report 'exit=2 calls=' "$(run_upsert "$dir" --marker "$marker" --body-file "$work/body.md" --if-missing always)" \
  '無いときの扱いに post / skip 以外を渡したら、gh を呼ばずに使い方の誤りで終わる'

dir="$(new_case "$no_comments")"
report 'exit=2 calls=' "$(run_upsert "$dir" --marker 'sticky-comment: cases' --body-file "$work/body.md" --if-missing post)" \
  'marker が HTML コメントの形でなければ、gh を呼ばずに使い方の誤りで終わる'

dir="$(new_case "$no_comments")"
report 'exit=2 calls=' "$(run_upsert "$dir" --marker '<!-- a" -->' --body-file "$work/body.md" --if-missing post)" \
  'marker に二重引用符が入っていれば、gh を呼ばずに使い方の誤りで終わる'

dir="$(new_case "$no_comments")"
report 'exit=2 calls=' "$(run_upsert "$dir" --marker '<!-- a\ -->' --body-file "$work/body.md" --if-missing post)" \
  'marker にバックスラッシュが入っていれば、gh を呼ばずに使い方の誤りで終わる'

dir="$(new_case "$no_comments")"
report 'exit=2 calls=' "$(run_upsert "$dir" --marker '<!-- a --> "' --body-file "$work/body.md" --if-missing post)" \
  'marker の閉じの後ろに続きがあれば、gh を呼ばずに使い方の誤りで終わる'

dir="$(new_case "$no_comments")"
report 'exit=2 calls=' "$(run_upsert "$dir" --marker 'x<!-- a -->' --body-file "$work/body.md" --if-missing post)" \
  'marker の開きの前に何かあれば、gh を呼ばずに使い方の誤りで終わる'

dir="$(new_case "$no_comments")"
report 'exit=2 calls=' "$(run_upsert "$dir" --marker "$marker" --body-file "$work/missing.md" --if-missing post)" \
  '本文のファイルが読めなければ、gh を呼ばずに使い方の誤りで終わる'

dir="$(new_case "$no_comments")"
report 'exit=2 calls=' "$(run_upsert "$dir" --marker "$marker" --body-file "$work" --if-missing post)" \
  '本文のファイルとしてディレクトリを渡したら、gh を呼ばずに使い方の誤りで終わる'

dir="$(new_case "$no_comments")"
report 'exit=2 calls=' "$(run_upsert "$dir" --marker "$marker" --body-file "$work/body.md" --if-missing)" \
  '値の無い引数で終わっていれば、gh を呼ばずに使い方の誤りで終わる(受け流される 3 回失敗と同じ 1 にしない)'

dir="$(new_case "$no_comments")"
report 'exit=2 calls=' "$(run_upsert "$dir" "${post[@]}" --unknown x)" \
  '知らない引数を渡したら、gh を呼ばずに使い方の誤りで終わる'

dir="$(new_case "$no_comments")"
report 'exit=2 calls=' "$(UNSET=PR_NUMBER run_upsert "$dir" "${post[@]}")" \
  'PR 番号が無ければ、gh を呼ばずに使い方の誤りで終わる'

dir="$(new_case "$no_comments")"
report 'exit=2 calls=' "$(CASE_PR_NUMBER=abc run_upsert "$dir" "${post[@]}")" \
  'PR 番号が数字でなければ、gh を呼ばずに使い方の誤りで終わる'

dir="$(new_case "$no_comments")"
report 'exit=2 calls=' "$(UNSET=GITHUB_REPOSITORY run_upsert "$dir" "${post[@]}")" \
  'リポジトリが無ければ、gh を呼ばずに使い方の誤りで終わる'

dir="$(new_case "$no_comments")"
usage_run="$(run_upsert "$dir" "${post[@]}" --unknown x)"
usage_outcome=missing
usage_shown=false
[[ "$(cat "$dir/stderr")" == *"upsert-sticky-comment.sh --marker '<!-- 名前 -->'"* ]] && usage_shown=true
# 使い方を出したあとに終わらず gh まで進む退行は、標準エラーだけ見ても通ってしまう
[ "$usage_shown" = true ] && [ "$usage_run" = 'exit=2 calls=' ] && usage_outcome=shown
report shown "$usage_outcome" '使い方の誤りでは、冒頭の使い方を標準エラーへ出し、gh を呼ばずに終わる'

# --- 読み込む lib が無い(`gh` を呼ぶ前に exit 127) ---

mkdir -p "$work/without-lib"
cp "$script" "$work/without-lib/"
dir="$(new_case "$no_comments")"
report 'exit=127 calls=' "$(script="$work/without-lib/upsert-sticky-comment.sh" run_upsert "$dir" "${post[@]}")" \
  '読み込む lib が無ければ、引数が正しくても gh を呼ばずに受け流されない失敗で終わる'

# --- 一時ファイルの失敗(`gh` を呼ぶ前に exit 3) ---

dir="$(new_case "$no_comments")"
report 'exit=3 calls=' "$(TMPDIR="$work/missing-dir" run_upsert "$dir" "${post[@]}")" \
  '一時ファイルを作れなければ、gh を呼ばずに使い方の誤りとは別の失敗で終わる'

exit "$cases_failed"
