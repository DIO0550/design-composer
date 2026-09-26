#!/usr/bin/env bash
#
# `check-pr-closing-issue.sh` の判定表。問い合わせ結果を模した JSON を食わせ、
# 結果が期待どおりかを 1 コマンドで確かめる。
#
# 使い方: bash .github/scripts/check-pr-closing-issue-cases.sh
# 出力が `ok` だけなら期待どおり。`NG` が 1 行でも出たら判定が変わっている。
#
# 配線は CI(`frontend.yml` の `rules-check`)だけで、層 2(`pre-push`)には無い
# (理由は `.claude/hooks/README.md`「カバー範囲と残る穴」)。判定は終了コードで見る
# (問い合わせの節だけは結果の種別で見る。理由はその節)。
#
# **表をここへ置くのは、CI の run が流れると判定の根拠が残らないため。** 覆うのは
# 「問い合わせ結果 → 終了コード」「5xx のときの再試行」「未反映のときの問い合わせ直し」の
# 3 つ。GraphQL のクエリ本体(フィールド名)とワークフローの配線は覆えないので、
# そこは CI で実際に叩いて確かめる。
#
# **件数(`totalCount`)と中身(`nodes`)は別々に渡す。** クエリは `files(first: 1)` なので
# GitHub は 2 ファイル以上の PR でも `nodes` を 1 件しか返さない。`nodes` の数から
# `totalCount` を作ると、その切り詰められた形を表で 1 度も踏めなくなる。
set -uo pipefail

script="$(dirname "$0")/check-pr-closing-issue.sh"
failed=0

# 問い合わせ結果を組み立てる。閉じる Issue・変更ファイルの総数・返ってきた 1 件目を差し替える
result_json() {
  jq -n --argjson closing "$1" --argjson total "$2" --argjson files "$3" '{
    data: { repository: { pullRequest: {
      closingIssuesReferences: { nodes: $closing },
      files: { totalCount: $total, nodes: $files }
    } } }
  }'
}

run_case() {
  local expected="$1" closing="$2" total="$3" files="$4" label="$5"
  local json actual=0

  json="$(mktemp)"
  result_json "$closing" "$total" "$files" >"$json"
  bash "$script" "$json" >/dev/null 2>&1 || actual=$?
  rm -f "$json"

  if [ "$actual" = "$expected" ]; then
    printf 'ok   exit=%s  %s\n' "$actual" "$label"
    return
  fi
  printf 'NG   exit=%s (期待 %s)  %s\n' "$actual" "$expected" "$label"
  failed=1
}

no_issue='[]'
one_issue='[{"number":517}]'
record='[{"path":"harness/records/pr-1.md","changeType":"ADDED"}]'
record_modified='[{"path":"harness/records/pr-1.md","changeType":"MODIFIED"}]'
sibling_folder='[{"path":"harness/records-old/pr-1.md","changeType":"ADDED"}]'
nested_path='[{"path":"docs/harness/records/pr-1.md","changeType":"ADDED"}]'
records_readme='[{"path":"harness/records/README.md","changeType":"ADDED"}]'

run_case 0 "$no_issue"  1 "$record"          '記録 PR(新規 1 ファイル)は閉じる Issue が無くても通る'
run_case 0 "$one_issue" 1 "$record"          '記録 PR に閉じる Issue があっても落とさない'
run_case 1 "$no_issue"  2 "$record"          '1 件目が記録でも、2 ファイル以上あるなら閉じる Issue が要る'
run_case 0 "$one_issue" 2 "$record"          '記録以外を含んでも閉じる Issue があれば通る'
run_case 1 "$no_issue"  1 "$record_modified" '記録ファイルの変更だけの PR は記録 PR ではない'
run_case 1 "$no_issue"  1 "$sibling_folder"  'harness/records- で始まる別フォルダは記録 PR ではない'
run_case 1 "$no_issue"  1 "$nested_path"     'パスの途中に harness/records/ を含むだけのものは記録 PR ではない'
run_case 1 "$no_issue"  1 "$records_readme"  'harness/records/ でも pr-<番号>.md でなければ記録 PR ではない'

# --- 問い合わせの再試行と問い合わせ直し ---
#
# `gh` を差し替えて、GitHub の API が 5xx を返したとき・閉じる Issue がまだ反映されて
# いないときの振る舞いを固定する。スタブは呼び出しごとに `STUB_REPLIES` の語を 1 つずつ
# 返す(`fail` = 5xx / `empty` = 閉じる Issue が空 / `linked` = 閉じる Issue あり)。
# 語が尽きたら `linked`。**待ち時間があるので、この節だけで 1 分ほどかかる。**
# いちばん守りたいのは「3 回とも駄目なら赤」。ここが黙って通るようになると、
# 問い合わせに失敗しただけの PR・閉じ忘れた PR が緑になる。
#
# 期待は終了コードではなく結果の種別で書く(`pass` = 通った / `missing` = 閉じ忘れとして
# 赤 / `fetch-failed` = 閉じ忘れの案内を出さずに赤)。どちらの赤も exit 1 なので、
# 終了コードだけでは問い合わせの失敗が空の結果として判定へ流れても区別できない。
#
# `PR_ACTION` は各行で必ず与える。ここで既定値を埋めると、イベント種別が空の経路を
# 表から踏めなくなる。
not_record='[{"path":"AGENTS.md","changeType":"MODIFIED"}]'

run_fetch_case() {
  local expected="$1" expected_calls="$2" label="$3"
  local dir output status=0 actual calls

  dir="$(mktemp -d)"
  mkdir -p "$dir/bin"
  cat >"$dir/bin/gh" <<'STUB'
#!/usr/bin/env bash
calls=$(( $(cat "$STUB_COUNT_FILE" 2>/dev/null || echo 0) + 1 ))
echo "$calls" >"$STUB_COUNT_FILE"
read -ra replies <<<"$STUB_REPLIES"
reply="${replies[$((calls - 1))]:-linked}"
if [ "$reply" = fail ]; then
  echo "gh: HTTP 502" >&2
  exit 1
fi
cat "$STUB_DIR/$reply.json"
STUB
  chmod +x "$dir/bin/gh"
  result_json "$no_issue" "${STUB_FILES_TOTAL:-9}" "${STUB_FILES:-$not_record}" >"$dir/empty.json"
  result_json "$one_issue" "${STUB_FILES_TOTAL:-9}" "${STUB_FILES:-$not_record}" >"$dir/linked.json"

  output="$(
    PATH="$dir/bin:$PATH" STUB_COUNT_FILE="$dir/count" STUB_REPLIES="${STUB_REPLIES:-}" \
      STUB_DIR="$dir" GITHUB_REPOSITORY=owner/repo PR_NUMBER=1 PR_ACTION="$PR_ACTION" \
      bash "$script" 2>/dev/null
  )" || status=$?
  calls="$(cat "$dir/count" 2>/dev/null || echo 0)"
  rm -rf "$dir"

  if [ "$status" = 0 ]; then
    actual=pass
  elif grep -q 'マージ時に閉じる Issue がありません' <<<"$output"; then
    actual=missing
  else
    actual=fetch-failed
  fi

  if [ "$actual" = "$expected" ] && [ "$calls" = "$expected_calls" ]; then
    printf 'ok   %s 呼び出し=%s  %s\n' "$actual" "$calls" "$label"
    return
  fi
  printf 'NG   %s 呼び出し=%s (期待 %s 呼び出し=%s)  %s\n' \
    "$actual" "$calls" "$expected" "$expected_calls" "$label"
  failed=1
}

PR_ACTION=synchronize run_fetch_case pass 1 '問い合わせが通れば再試行しない'
PR_ACTION=synchronize STUB_REPLIES='fail' run_fetch_case pass 2 '一時的な 5xx は再試行して通る'
PR_ACTION=synchronize STUB_REPLIES='fail fail fail' run_fetch_case fetch-failed 3 \
  '3 回とも失敗したら赤にする（握りつぶさない）'
PR_ACTION='' run_fetch_case fetch-failed 0 \
  'イベント種別が渡らなければ、問い合わせずに赤にする'

PR_ACTION=opened STUB_REPLIES='empty' run_fetch_case pass 2 \
  'PR を作った直後に閉じる Issue が未反映でも、問い合わせ直して反映されれば通る'
PR_ACTION=opened STUB_REPLIES='empty empty empty' run_fetch_case missing 3 \
  'PR を作った直後でも、3 回とも閉じる Issue が空なら閉じ忘れとして赤にする'
PR_ACTION=opened STUB_REPLIES='empty fail fail fail' run_fetch_case fetch-failed 4 \
  '問い合わせ直しの途中で 5xx が 3 回続いたら、閉じ忘れではなく問い合わせ失敗として赤にする'
PR_ACTION=synchronize STUB_REPLIES='empty' run_fetch_case missing 1 \
  'PR を作った直後でなければ、閉じる Issue が空でも問い合わせ直さずに赤にする'
PR_ACTION=edited STUB_REPLIES='empty' run_fetch_case missing 1 \
  '本文を編集しただけなら、閉じる Issue が空でも問い合わせ直さずに赤にする'
PR_ACTION=opened STUB_REPLIES='empty' STUB_FILES_TOTAL=1 \
  STUB_FILES="$record" run_fetch_case pass 1 \
  '記録 PR は PR を作った直後でも問い合わせ直さずに通す'

exit "$failed"
