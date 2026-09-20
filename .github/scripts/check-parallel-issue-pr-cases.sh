#!/usr/bin/env bash
#
# `check-parallel-issue-pr.sh` の判定表。問い合わせ結果を模した JSON と、差し替えた `gh` を
# 食わせ、判定行・コメントの投稿・終了コードが期待どおりかを 1 コマンドで確かめる。
#
# 使い方: bash .github/scripts/check-parallel-issue-pr-cases.sh
# 出力が `ok` だけなら期待どおり。`NG` が 1 行でも出たら判定が変わっている。
#
# **表をここへ置くのは、CI の run が流れると判定の根拠が残らないため**
# (前例は `check-pr-closing-issue-cases.sh`)。覆うのは「問い合わせ結果 → 判定行」
# 「コメントを貼る/差し替える/貼らない」「`gh` が失敗したときの扱い」の 3 つ。
# GraphQL のクエリ本体とワークフローの配線は覆えないので、そこは CI で実際に叩いて確かめる。
#
# **件数(`totalCount`)と中身(`nodes`)は別々に渡す。** クエリは `pullRequests(first: 100)`
# なので、GitHub は 101 件以上ある repository でも `nodes` を 100 件しか返さない。
# `nodes` の数から `totalCount` を作ると、その切り詰められた形を表で 1 度も踏めなくなる。
#
# **`nodes` には自分自身も入れる。** 検査するのは open な PR なので、自分も `states: OPEN` の
# 一覧に載る。自分を入れない入力は本番で起きず、自己除外を壊しても落ちない表になる。
set -uo pipefail

script="$(dirname "$0")/check-parallel-issue-pr.sh"
failed=0

# 問い合わせ結果を組み立てる。閉じる Issue・open な PR の総数と中身を差し替える
result_json() {
  jq -n --argjson mine "$1" --argjson total "$2" --argjson others "$3" '{
    data: { repository: {
      pullRequest: {
        closingIssuesReferences: { nodes: ($mine | map({ number: . })) }
      },
      pullRequests: {
        totalCount: $total,
        nodes: ($others | map({
          number: .number,
          closingIssuesReferences: { nodes: (.closes | map({ number: . })) }
        }))
      }
    } }
  }'
}

# `gh` を差し替える。コメントの一覧は $EXISTING_COMMENT_ID を返し、呼ばれ方を
# $STUB_CALL_FILE へ、投稿した本文を $STUB_BODY_FILE へ落とす。
# $FAIL_ON に GET / POST / PATCH を渡すと、その呼び出しだけ失敗させられる
install_gh_stub() {
  mkdir -p "$1/bin"
  cat >"$1/bin/gh" <<'STUB'
#!/usr/bin/env bash
kind=GET
for arg in "$@"; do
  case "$arg" in
    PATCH|POST) kind="$arg" ;;
    body=*) printf '%s' "${arg#body=}" >"$STUB_BODY_FILE" ;;
  esac
done
if [ "$kind" = "${FAIL_ON:-}" ]; then
  echo "${kind}-FAILED" >>"$STUB_CALL_FILE"
  echo "gh: HTTP 502" >&2
  exit 1
fi
echo "$kind" >>"$STUB_CALL_FILE"
[ "$kind" = GET ] && printf '%s' "${EXISTING_COMMENT_ID:-}"
exit 0
STUB
  chmod +x "$1/bin/gh"
}

# 判定行を確かめる。コメントの投稿は run_comment_case が見る
run_case() {
  local expected="$1" self="$2" mine="$3" total="$4" others="$5" label="$6"
  local dir actual=0 verdict

  dir="$(mktemp -d)"
  install_gh_stub "$dir"
  result_json "$mine" "$total" "$others" >"$dir/result.json"

  verdict="$(PATH="$dir/bin:$PATH" STUB_CALL_FILE="$dir/calls" STUB_BODY_FILE="$dir/body" \
    GITHUB_REPOSITORY=owner/repo PR_NUMBER="$self" \
    bash "$script" "$dir/result.json" 2>/dev/null)" || actual=$?
  rm -rf "$dir"

  if [ "$verdict" = "$expected" ] && [ "$actual" = 0 ]; then
    printf 'ok   %s\n' "$label"
    return
  fi
  printf 'NG   exit=%s 判定=%s (期待 %s)  %s\n' \
    "$actual" "$(tr '\n' '/' <<<"$verdict")" "$(tr '\n' '/' <<<"$expected")" "$label"
  failed=1
}

# --- 判定行 ---

# `pr-533` の実例。#533 を出した時点で #532 が open で、どちらも #531 を閉じていた
run_case '重複: Issue #531 → #532' \
  533 '[531]' 2 '[{"number":533,"closes":[531]},{"number":532,"closes":[531]}]' \
  '同じ Issue を閉じる open な PR があれば、その PR を挙げる（pr-533 の実例）'

# `pr-604` の実例。#604 を開いた時点で #602 が open で、どちらも #595 を閉じていた
run_case '重複: Issue #595 → #602' \
  604 '[595]' 2 '[{"number":604,"closes":[595]},{"number":602,"closes":[595]}]' \
  '同じ Issue を閉じる open な PR があれば、その PR を挙げる（pr-604 の実例）'

# `pr-605` の実例。#605 を出した時点で #601 が open で、どちらも #600 を閉じていた
run_case '重複: Issue #600 → #601' \
  605 '[600]' 2 '[{"number":605,"closes":[600]},{"number":601,"closes":[600]}]' \
  '同じ Issue を閉じる open な PR があれば、その PR を挙げる（pr-605 の実例）'

run_case '閉じる Issue なし' \
  610 '[]' 2 '[{"number":610,"closes":[]},{"number":602,"closes":[595]}]' \
  '閉じる Issue が無い PR は重複を判定しない'

run_case '重複なし' \
  610 '[595]' 1 '[{"number":610,"closes":[595]}]' \
  '一覧に自分しかいなければ重複は無い（自分自身は数えない）'

run_case '重複なし' \
  610 '[595]' 2 '[{"number":610,"closes":[595]},{"number":602,"closes":[596]}]' \
  '他の open な PR が別の Issue を閉じているなら重複は無い'

run_case '重複: Issue #595 → #602, #604' \
  610 '[595]' 3 '[{"number":610,"closes":[595]},{"number":604,"closes":[595]},{"number":602,"closes":[595]}]' \
  '同じ Issue を閉じる open な PR が 2 本あれば、2 本とも挙げる（並びは番号順）'

run_case '重複: Issue #595 → #602
重複: Issue #596 → #603' \
  610 '[596,595]' 3 '[{"number":610,"closes":[596,595]},{"number":603,"closes":[596]},{"number":602,"closes":[595]}]' \
  '閉じる Issue が 2 つとも重複するなら、Issue ごとに行を分ける（並びは Issue 番号順）'

run_case '重複: Issue #595 → #602' \
  610 '[595,596]' 2 '[{"number":610,"closes":[595,596]},{"number":602,"closes":[595]}]' \
  '閉じる Issue が 2 つあり片方だけ重複するなら、重複した側だけを挙げる'

run_case '重複: Issue #595 → #602' \
  604 '[595]' 2 '[{"number":604,"closes":[595]},{"number":602,"closes":[595,596]}]' \
  '相手が複数の Issue を閉じていても、共有している Issue だけを挙げる'

run_case '重複なし
注記: open な PR は 120 件あり、更新の新しい 1 件だけを見た' \
  610 '[595]' 120 '[{"number":610,"closes":[595]}]' \
  'open な PR が全部は見られなかったときは、見た範囲を添える'

# --- コメントの投稿 ---
#
# 貼る・差し替える・貼らないの 3 通りと、`gh` が落ちたときの扱いを、差し替えた `gh` の
# 呼ばれ方で固定する。ここが無いと、**コメントを 1 度も投稿しない実装でも判定行のケースは
# 全部緑**になる。

no_duplicate='[{"number":610,"closes":[595]}]'
duplicate='[{"number":610,"closes":[595]},{"number":602,"closes":[595]}]'

run_comment_case() {
  local expected="$1" existing="$2" fail_on="$3" others="$4" label="$5"
  local dir calls actual=0

  dir="$(mktemp -d)"
  install_gh_stub "$dir"
  result_json '[595]' 2 "$others" >"$dir/result.json"

  PATH="$dir/bin:$PATH" STUB_CALL_FILE="$dir/calls" STUB_BODY_FILE="$dir/body" \
    EXISTING_COMMENT_ID="$existing" FAIL_ON="$fail_on" \
    GITHUB_REPOSITORY=owner/repo PR_NUMBER=610 \
    bash "$script" "$dir/result.json" >/dev/null 2>&1 || actual=$?
  calls="$(tr '\n' ' ' <"$dir/calls" 2>/dev/null || true)"
  rm -rf "$dir"

  if [ "${calls% }" = "$expected" ] && [ "$actual" = 0 ]; then
    printf 'ok   %s\n' "$label"
    return
  fi
  printf 'NG   exit=%s 呼び出し=%s (期待 exit=0 呼び出し=%s)  %s\n' \
    "$actual" "${calls% }" "$expected" "$label"
  failed=1
}

run_comment_case 'GET POST' '' '' "$duplicate" \
  '重複があってコメントがまだ無ければ、新しく貼る'
run_comment_case 'GET PATCH' '12345' '' "$duplicate" \
  '重複があってコメントが既にあれば、差し替える'
run_comment_case 'GET PATCH' '12345' '' "$no_duplicate" \
  '重複が無くなったら、貼ってあるコメントを差し替える'
run_comment_case 'GET' '' '' "$no_duplicate" \
  '重複が無くてコメントも無ければ、何も貼らない'
run_comment_case 'GET-FAILED' '' GET "$duplicate" \
  'コメントの一覧を取れなければ、貼らない（取れなかったのを「無い」と読んで二重に貼らない）'
run_comment_case 'GET POST-FAILED' '' POST "$duplicate" \
  'コメントの投稿に失敗しても赤にしない'
run_comment_case 'GET PATCH-FAILED' '12345' PATCH "$duplicate" \
  'コメントの差し替えに失敗しても赤にしない'

# --- 投稿する本文 ---
#
# 呼ばれ方だけを見ていると、**marker も表の行も無い本文**で緑になる。marker は sticky の要で
# (`existing_comment_id` が `startswith` で探す)、表の行は知らせたい中身そのもの。
run_body_case() {
  local expected="$1" others="$2" label="$3"
  local dir body

  dir="$(mktemp -d)"
  install_gh_stub "$dir"
  result_json '[595]' 2 "$others" >"$dir/result.json"

  PATH="$dir/bin:$PATH" STUB_CALL_FILE="$dir/calls" STUB_BODY_FILE="$dir/body" \
    EXISTING_COMMENT_ID='' FAIL_ON='' \
    GITHUB_REPOSITORY=owner/repo PR_NUMBER=610 \
    bash "$script" "$dir/result.json" >/dev/null 2>&1
  body="$(cat "$dir/body" 2>/dev/null || true)"
  rm -rf "$dir"

  if grep -qF "$expected" <<<"$body"; then
    printf 'ok   %s\n' "$label"
    return
  fi
  printf 'NG   本文に %s が無い  %s\n' "$expected" "$label"
  failed=1
}

run_body_case '<!-- sticky-comment: parallel-issue-pr -->' "$duplicate" \
  '貼る本文は marker で始まる（次の実行がこのコメントを見つけられる）'
run_body_case '| #595 | #602 |' "$duplicate" \
  '貼る本文に、閉じる Issue と相手の PR の行が入る'

# --- 問い合わせの再試行 ---
#
# `gh` を差し替えて、GitHub の API が 5xx を返したときの振る舞いを固定する。
# **待ち時間があるのでこの 2 ケースだけで 20 秒ほどかかる。**
# いちばん守りたいのは「3 回とも駄目なら赤」。この検査は判定では赤にしないので、
# ここが黙って通るようになると、検査が動いていないことに誰も気づけない。
run_fetch_case() {
  local expected="$1" fail_times="$2" expected_calls="$3" label="$4"
  local dir actual=0 calls

  dir="$(mktemp -d)"
  mkdir -p "$dir/bin"
  cat >"$dir/bin/gh" <<'STUB'
#!/usr/bin/env bash
calls=$(( $(cat "$STUB_COUNT_FILE" 2>/dev/null || echo 0) + 1 ))
echo "$calls" >"$STUB_COUNT_FILE"
if [ "$calls" -le "$FAIL_TIMES" ]; then
  echo "gh: HTTP 502" >&2
  exit 1
fi
echo '{"data":{"repository":{"pullRequest":{"closingIssuesReferences":{"nodes":[]}},"pullRequests":{"totalCount":1,"nodes":[]}}}}'
STUB
  chmod +x "$dir/bin/gh"

  PATH="$dir/bin:$PATH" STUB_COUNT_FILE="$dir/count" FAIL_TIMES="$fail_times" \
    GITHUB_REPOSITORY=owner/repo PR_NUMBER=610 \
    bash "$script" >/dev/null 2>&1 || actual=$?
  calls="$(cat "$dir/count" 2>/dev/null || echo 0)"
  rm -rf "$dir"

  if [ "$actual" = "$expected" ] && [ "$calls" = "$expected_calls" ]; then
    printf 'ok   exit=%s 呼び出し=%s  %s\n' "$actual" "$calls" "$label"
    return
  fi
  printf 'NG   exit=%s 呼び出し=%s (期待 exit=%s 呼び出し=%s)  %s\n' \
    "$actual" "$calls" "$expected" "$expected_calls" "$label"
  failed=1
}

run_fetch_case 0 0 1 '問い合わせが通れば再試行しない'
run_fetch_case 0 1 2 '一時的な 5xx は再試行して通る'
run_fetch_case 1 9 3 '3 回とも失敗したら赤にする（握りつぶさない）'

exit "$failed"
