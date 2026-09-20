#!/usr/bin/env bash
#
# `check-duplicate-issue-pr.sh` の判定表。問い合わせ結果を模した JSON を食わせ、
# 「重複を拾うか」を 1 コマンドで確かめる(`check-pr-closing-issue-cases.sh` に倣う)。
#
# 使い方: bash .github/scripts/check-duplicate-issue-pr-cases.sh
# 出力が `ok` だけなら期待どおり。`NG` が 1 行でも出たら判定が変わっている。
#
# **再発の実例で再生する。** `harness/records/pr-604.md` 指摘 1 / `pr-605.md` 指摘 1 は、
# それぞれ Issue #595 / #600 を 2 つの PR(#602 と #604、#601 と #605)が並行して閉じ、
# 気づくまでに実装・レビュー・PR 作成が終わっていた実例。この判定表はその状態
# (両方 open だったときの形)を JSON で再現し、検出器が捕まえることを確かめる。
# 両 Issue とも現在はマージ済みで片方が closed になっているため、GitHub への実際の
# 問い合わせでは当時の状態を再現できない。
set -uo pipefail

script="$(dirname "$0")/check-duplicate-issue-pr.sh"
failed=0

# 問い合わせ結果を組み立てる。この PR が閉じる Issue と、他の open な PR の一覧を差し替える。
#
# **件数(`totalCount`)は中身(`nodes`)と別に渡せる。** クエリは `first: 100` なので、GitHub は
# 101 件以上ある repository でも `nodes` を 100 件しか返さない。`nodes` の数からしか
# `totalCount` を作れないと、その切り詰められた形を表で 1 度も踏めなくなる。
# 省略したときは `nodes` の数(切り詰めが起きていない形)にする
result_json() {
  jq -n --argjson closing "$1" --argjson others "$2" --arg total "${3:-}" '{
    data: { repository: {
      pullRequest: { closingIssuesReferences: { nodes: $closing } },
      pullRequests: {
        totalCount: (if $total == "" then ($others | length) else ($total | tonumber) end),
        nodes: $others
      }
    } }
  }'
}

run_case() {
  local expected="$1" self="$2" closing="$3" others="$4" label="$5" total="${6:-}"
  local json actual

  json="$(mktemp)"
  result_json "$closing" "$others" "$total" >"$json"
  actual="$(PR_NUMBER="$self" bash "$script" "$json" 2>&1)"
  rm -f "$json"

  if [ "$actual" = "$expected" ]; then
    printf 'ok   %s\n' "$label"
    return
  fi
  printf 'NG   実際=%s (期待 %s)  %s\n' "$actual" "$expected" "$label"
  failed=1
}

no_closing='[]'
issue_595='[{"number":595}]'
issue_600='[{"number":600}]'

no_others='[]'
self_only='[{"number":604,"closingIssuesReferences":{"nodes":[{"number":595}]}}]'
unrelated='[{"number":610,"closingIssuesReferences":{"nodes":[{"number":700}]}}]'
duplicate_595='[{"number":602,"closingIssuesReferences":{"nodes":[{"number":595}]}}]'
duplicate_600='[{"number":601,"closingIssuesReferences":{"nodes":[{"number":600}]}}]'
two_duplicates='[{"number":601,"closingIssuesReferences":{"nodes":[{"number":600}]}},{"number":602,"closingIssuesReferences":{"nodes":[{"number":600}]}}]'
partial_overlap='[{"number":611,"closingIssuesReferences":{"nodes":[{"number":595},{"number":999}]}}]'

run_case '[]'                                                     604 "$no_closing" "$no_others"     '閉じる Issue が無ければ重複なし'
run_case '[]'                                                     604 "$issue_595"  "$no_others"     '他に open な PR が無ければ重複なし'
run_case '[]'                                                     604 "$issue_595"  "$self_only"     '自分自身(同じ PR 番号)は候補から除く'
run_case '[]'                                                     604 "$issue_595"  "$unrelated"     '別の Issue を閉じる PR は重複ではない'
run_case '[{"pr":602,"issues":[595]}]'                            604 "$issue_595"  "$duplicate_595" 'pr-604 の実例(Issue #595 を #602 も閉じている)を捕まえる'
run_case '[{"pr":601,"issues":[600]}]'                            605 "$issue_600"  "$duplicate_600" 'pr-605 の実例(Issue #600 を #601 も閉じている)を捕まえる'
run_case '[{"pr":601,"issues":[600]},{"pr":602,"issues":[600]}]'  605 "$issue_600"  "$two_duplicates" '重複が 2 件あれば両方拾う'
run_case '[{"pr":611,"issues":[595]}]'                            604 "$issue_595"  "$partial_overlap" '閉じる Issue が複数あっても、重なった番号だけを報告する'

# --- 切り詰め ---

run_case '[]
注記: open な PR は 120 件あり、更新の新しい 1 件だけを見た' \
  604 "$issue_595" "$unrelated" 'open な PR が全部は見られなかったときは、見た範囲を添える' 120

# --- コメントの投稿 ---
#
# 貼る・差し替える・貼らないの 3 通りと、`gh` が落ちたときの扱いを、差し替えた `gh` の
# 呼ばれ方で固定する。ここが無いと、**コメントを 1 度も投稿しない実装でも上のケースは
# 全部緑**になる(判定の JSON しか見ていないため)。
#
# `gh` は呼ばれ方を $STUB_CALL_FILE へ、投稿した本文を $STUB_BODY_FILE へ落とすだけにする。
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

# 差し替えた `gh` を置いて走らせ、$dir に calls / body を残す
run_with_gh_stub() {
  local dir="$1" existing="$2" fail_on="$3" others="$4"

  install_gh_stub "$dir"
  result_json "$issue_595" "$others" >"$dir/result.json"
  PATH="$dir/bin:$PATH" STUB_CALL_FILE="$dir/calls" STUB_BODY_FILE="$dir/body" \
    EXISTING_COMMENT_ID="$existing" FAIL_ON="$fail_on" \
    GITHUB_REPOSITORY=owner/repo PR_NUMBER=604 \
    bash "$script" "$dir/result.json" >/dev/null 2>&1
}

run_comment_case() {
  local expected="$1" existing="$2" fail_on="$3" others="$4" label="$5"
  local dir calls actual=0

  dir="$(mktemp -d)"
  run_with_gh_stub "$dir" "$existing" "$fail_on" "$others" || actual=$?
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

run_comment_case 'GET POST'  ''      ''      "$duplicate_595" '重複があってコメントがまだ無ければ、新しく貼る'
run_comment_case 'GET PATCH' '12345' ''      "$duplicate_595" '重複があってコメントが既にあれば、差し替える'
run_comment_case 'GET PATCH' '12345' ''      "$unrelated"     '重複が無くなったら、貼ってあるコメントを差し替える'
run_comment_case 'GET'       ''      ''      "$unrelated"     '重複が無くてコメントも無ければ、何も貼らない'
run_comment_case 'GET-FAILED' ''     GET     "$duplicate_595" 'コメントの一覧を取れなければ、貼らない（取れなかったのを「無い」と読んで二重に貼らない）'
run_comment_case 'GET POST-FAILED'  '' POST  "$duplicate_595" 'コメントの投稿に失敗しても赤にしない'
run_comment_case 'GET PATCH-FAILED' '12345' PATCH "$duplicate_595" 'コメントの差し替えに失敗しても赤にしない'

# --- 投稿する本文 ---
#
# 呼ばれ方だけを見ていると、**marker も相手の PR 番号も無い本文**で緑になる。marker は
# sticky の要(次の実行が `startswith` で探す)で、行は知らせたい中身そのもの。
run_body_case() {
  local expected="$1" label="$2"
  local dir body

  dir="$(mktemp -d)"
  run_with_gh_stub "$dir" '' '' "$duplicate_595"
  body="$(cat "$dir/body" 2>/dev/null || true)"
  rm -rf "$dir"

  if grep -qF "$expected" <<<"$body"; then
    printf 'ok   %s\n' "$label"
    return
  fi
  printf 'NG   本文に %s が無い  %s\n' "$expected" "$label"
  failed=1
}

run_body_case '<!-- sticky-comment: duplicate-issue-pr -->' \
  '貼る本文は marker で始まる（次の実行がこのコメントを見つけられる）'
run_body_case 'Issue #595 は PR #602 も閉じています。' \
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
# 数えるのは問い合わせ(graphql)だけ。コメント側の呼び出しは空を返して数に入れない
if [ "${2:-}" != graphql ]; then
  exit 0
fi
calls=$(( $(cat "$STUB_COUNT_FILE" 2>/dev/null || echo 0) + 1 ))
echo "$calls" >"$STUB_COUNT_FILE"
if [ "$calls" -le "$FAIL_TIMES" ]; then
  echo "gh: HTTP 502" >&2
  exit 1
fi
echo '{"data":{"repository":{"pullRequest":{"closingIssuesReferences":{"nodes":[]}},"pullRequests":{"totalCount":0,"nodes":[]}}}}'
STUB
  chmod +x "$dir/bin/gh"

  PATH="$dir/bin:$PATH" STUB_COUNT_FILE="$dir/count" FAIL_TIMES="$fail_times" \
    GITHUB_REPOSITORY=owner/repo PR_NUMBER=604 \
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
